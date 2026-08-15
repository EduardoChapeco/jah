import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";
import { z } from "zod";
import { classifiedSchema } from "@/types/community";

// ---------------------------------------------------------------------------
// PUBLIC (no auth required)
// ---------------------------------------------------------------------------

export const getPublicClassifieds = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        category: z
          .enum([
            "sale",
            "vehicle",
            "real_estate",
            "service",
            "job",
            "job_offer",
            "trade",
            "donation",
            "event",
          ])
          .optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    let query = supabase
      .from("classifieds")
      .select(
        "id, category, title, content, price_cents, images, whatsapp, contact_whatsapp, location_name, location_text, location_lat, location_lng, status, attributes, created_at, updated_at",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data?.category) {
      query = query.eq("category", data.category);
    }

    const { data: classifieds, error } = await query;

    if (error) {
      console.error("[classifieds] getPublicClassifieds error:", error);
      throw new Error("Não foi possível carregar os classificados.");
    }

    return classifieds || [];
  });

export const getPublicClassifiedById = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: id }) => {
    const supabase = getServerClient();
    const identity = await getIdentity().catch(() => null);

    const { data, error } = await supabase
      .from("classifieds")
      .select(
        `
        id, category, title, content, price_cents, images, whatsapp, contact_whatsapp,
        location_name, location_text, location_lat, location_lng, condition, negotiable,
        attributes, status, author_profile_id, created_at, updated_at,
        profiles:author_profile_id (id, full_name, avatar_url, phone)
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[classifieds] getPublicClassifiedById error:", error);
      throw new Error("Erro ao carregar o anúncio.");
    }

    if (!data) return null;

    const isOwner = !!(identity?.id && data.author_profile_id === identity.id);
    const isAdmin = !!(identity?.role === "admin" || identity?.role === "master");
    const canManage = isOwner || isAdmin;

    const viewerContext: "owner" | "admin" | "visitor" | "anonymous" = isOwner
      ? "owner"
      : isAdmin
        ? "admin"
        : identity?.id
          ? "visitor"
          : "anonymous";

    return {
      classified: data,
      isOwner,
      canManage,
      viewerContext,
    };
  });

export const updateClassifiedStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["active", "paused", "reserved", "completed", "archived"]),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data: { id, status, reason } }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !identity.id) {
      throw new Error("Não autorizado.");
    }

    // Busca o anúncio para verificar autoria
    const { data: existing, error: fetchErr } = await supabase
      .from("classifieds")
      .select("id, author_profile_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      throw new Error("Anúncio não encontrado.");
    }

    const isAdmin = identity.role === "admin" || identity.role === "master";
    if (existing.author_profile_id !== identity.id && !isAdmin) {
      throw new Error("Você não tem permissão para alterar o estado deste anúncio.");
    }

    const { data: updated, error: updateErr } = await supabase
      .from("classifieds")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error("[classifieds] updateClassifiedStatus error:", updateErr);
      throw new Error("Erro ao atualizar o status do anúncio.");
    }

    return { success: true, classified: updated };
  });

// ---------------------------------------------------------------------------
// AUTHENTICATED (own classifieds — user)
// ---------------------------------------------------------------------------

export const getClassifieds = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity();

  if (!identity || !identity.id) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("classifieds")
    .select("*")
    .eq("author_profile_id", identity.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching classifieds:", error);
    throw new Error("Failed to fetch classifieds");
  }

  return data;
});

export const getClassified = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: id }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !identity.id) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
      .from("classifieds")
      .select("*")
      .eq("id", id)
      .eq("author_profile_id", identity.id)
      .single();

    if (error) {
      console.error("Error fetching classified:", error);
      throw new Error("Failed to fetch classified");
    }

    return data;
  });

const upsertClassifiedInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  category: z.enum([
    "sale",
    "vehicle",
    "real_estate",
    "service",
    "job",
    "job_offer",
    "trade",
    "donation",
    "event",
  ]),
  content: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  price_cents: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  whatsapp: z.string().nullable().optional(),
  contact_whatsapp: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  location_text: z.string().nullable().optional(),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  condition: z.enum(["new", "used", "refurbished"]).nullable().optional(),
  negotiable: z.boolean().optional().default(true),
  attributes: z.record(z.any()).optional().default({}),
  status: z.enum(["draft", "active", "paused", "closed"]).default("active"),
});

export const upsertClassified = createServerFn({ method: "POST" })
  .validator(upsertClassifiedInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !identity.id) {
      throw new Error("Unauthorized");
    }

    const { id, ...rest } = input;
    const isUpdating = !!id;

    const payload = {
      ...rest,
      author_profile_id: identity.id,
    };

    if (isUpdating) {
      const { data, error } = await supabase
        .from("classifieds")
        .update(payload)
        .eq("id", id)
        .eq("author_profile_id", identity.id)
        .select()
        .single();

      if (error) {
        console.error("Error upserting classified:", error);
        throw new Error("Failed to save classified");
      }
      return data;
    } else {
      const { data, error } = await supabase.from("classifieds").insert(payload).select().single();

      if (error) {
        console.error("Error upserting classified:", error);
        throw new Error("Failed to save classified");
      }
      return data;
    }
  });

export const deleteClassified = createServerFn({ method: "POST" })
  .validator(z.string().uuid())
  .handler(async ({ data: id }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !identity.id) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("classifieds")
      .delete()
      .eq("id", id)
      .eq("author_profile_id", identity.id);

    if (error) {
      console.error("Error deleting classified:", error);
      throw new Error("Failed to delete classified");
    }

    return { success: true };
  });
