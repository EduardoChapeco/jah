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
    z.object({
      limit: z.number().int().min(1).max(100).optional(),
      category: z.enum(["job", "sale", "trade", "service"]).optional(),
    }).optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    let query = supabase
      .from("classifieds")
      .select("id, category, title, content, price_cents, status, created_at, updated_at")
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

// ---------------------------------------------------------------------------
// AUTHENTICATED (own classifieds — admin)
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

const upsertClassifiedInput = classifiedSchema.omit({
  id: true,
  author_profile_id: true,
  created_at: true,
  updated_at: true,
}).extend({
  id: z.string().uuid().optional(),
  // New fields from Microfase C migration — all optional for backwards compat
  images: z.array(z.string()).optional().default([]),
  contact_whatsapp: z.string().nullable().optional(),
  location_text: z.string().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  condition: z.enum(["new", "used", "refurbished"]).nullable().optional(),
  negotiable: z.boolean().optional().default(true),
  attributes: z.record(z.any()).optional().default({}),
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
      const { data, error } = await supabase
        .from("classifieds")
        .insert(payload)
        .select()
        .single();
        
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
