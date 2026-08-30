/**
 * creators.functions.ts — BFF Master para Gestão de Influenciadores Regionais, Embaixadores e Co-Publicações
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { getCurrentIdentity } from "@/services/cart-helpers";

export interface CreatorProfileDTO {
  id: string;
  user_id: string;
  handle: string;
  name: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  niche: string;
  is_official_ambassador: boolean;
  ambassador_badge_label?: string | null;
  city?: string | null;
  state?: string | null;
  social_links?: Record<string, string> | null;
  engagement_score: number;
  status: "active" | "pending_approval" | "suspended" | "rejected";
  created_at: string;
  active_stories_count?: number;
}

export interface StoryCollabDTO {
  id: string;
  story_id: string;
  creator_id: string;
  store_id: string;
  allow_store_repost: boolean;
  status: "pending" | "approved" | "rejected";
  approved_at?: string | null;
  created_at: string;
  creator?: {
    id: string;
    handle: string;
    name: string;
    avatar_url?: string | null;
    is_official_ambassador: boolean;
    ambassador_badge_label?: string | null;
  } | null;
  story?: {
    id: string;
    media_url: string;
    link_url?: string | null;
    link_cta?: string | null;
    duration_seconds: number;
    created_at: string;
  } | null;
}

// ─── 1. LISTAR CRIADORES REGIONAIS (PÚBLICO / BUSCA) ──────────────────────────
export const listCreatorProfiles = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        niche: z.string().optional(),
        ambassadorsOnly: z.boolean().optional(),
        query: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();

    let query = supabase
      .from("creator_profiles")
      .select("id, user_id, handle, name, bio, avatar_url, cover_url, niche, is_official_ambassador, ambassador_badge_label, city, state, social_links, engagement_score, status, created_at")
      .eq("status", "active")
      .order("is_official_ambassador", { ascending: false })
      .order("engagement_score", { ascending: false });

    if (data?.ambassadorsOnly) {
      query = query.eq("is_official_ambassador", true);
    }

    if (data?.niche && data.niche !== "todos") {
      query = query.eq("niche", data.niche);
    }

    if (data?.query) {
      query = query.ilike("name", `%${data.query}%`);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[creators.functions] Error listing creators:", error);
      return [] as CreatorProfileDTO[];
    }

    return (rows || []) as CreatorProfileDTO[];
  });

// ─── 2. OBTER PERFIL DE CRIADOR PELO HANDLE ───────────────────────────────────
export const getCreatorProfileByHandle = createServerFn({ method: "GET" })
  .validator(z.object({ handle: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();

    const cleanHandle = data.handle.replace(/^@/, "").trim().toLowerCase();

    const { data: creator, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("handle", cleanHandle)
      .maybeSingle();

    if (error || !creator) {
      return null;
    }

    return creator as CreatorProfileDTO;
  });

// ─── 3. CADASTRO / ATUALIZAÇÃO DE PERFIL DE CRIADOR (AUTO-ONBOARDING) ─────────
export const registerCreatorProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      handle: z.string().min(3).max(30).regex(/^[a-z0-9._]+$/i, "Handle deve conter apenas letras, números, ponto ou underline"),
      name: z.string().min(2).max(80),
      bio: z.string().max(250).optional(),
      avatarUrl: z.string().url().optional(),
      coverUrl: z.string().url().optional(),
      niche: z.string().default("geral"),
      city: z.string().optional(),
      state: z.string().optional(),
      socialLinks: z.record(z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para criar um perfil de influenciador.");
    }

    const cleanHandle = data.handle.toLowerCase().replace(/^@/, "").trim();

    const { data: created, error } = await supabase
      .from("creator_profiles")
      .upsert(
        {
          user_id: identity.customer_id,
          handle: cleanHandle,
          name: data.name,
          bio: data.bio || null,
          avatar_url: data.avatarUrl || null,
          cover_url: data.coverUrl || null,
          niche: data.niche,
          city: data.city || null,
          state: data.state || null,
          social_links: data.socialLinks || {},
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "handle" },
      )
      .select()
      .single();

    if (error) {
      console.error("[creators.functions] Erro ao cadastrar criador:", error);
      throw new Error("Falha ao salvar perfil de criador. Verifique se o handle já está em uso.");
    }

    return created as CreatorProfileDTO;
  });

// ─── 4. SOLICITAÇÃO DE CO-PUBLICAÇÃO (CRIADOR MARCA A LOJA) ─────────────────
export const requestStoryCollab = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storyId: z.string().uuid(),
      targetStoreId: z.string().uuid(),
      allowStoreRepost: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Faça login para solicitar co-publicação.");
    }

    // Busca o perfil de criador do usuário
    const { data: creator } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", identity.customer_id)
      .maybeSingle();

    if (!creator) {
      throw new Error("Você precisa ter um perfil de criador para marcar lojas parceiras.");
    }

    const { data: collab, error } = await supabase
      .from("story_collabs")
      .upsert(
        {
          story_id: data.storyId,
          creator_id: creator.id,
          store_id: data.targetStoreId,
          allow_store_repost: data.allowStoreRepost,
          status: "pending",
        },
        { onConflict: "story_id,store_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("[creators.functions] Erro ao solicitar co-publicação:", error);
      throw new Error("Não foi possível enviar solicitação de co-publicação.");
    }

    return collab;
  });

// ─── 5. LISTAR CO-PUBLICAÇÕES RECEBIDAS PELA LOJA NO WORKSPACE ───────────────
export const listStoreCollabs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

  const { data: collabs, error } = await supabase
    .from("story_collabs")
    .select(`
      id, story_id, creator_id, store_id, allow_store_repost, status, approved_at, created_at,
      creator_profiles ( id, handle, name, avatar_url, is_official_ambassador, ambassador_badge_label ),
      stories ( id, media_url, link_url, link_cta, duration_seconds, created_at )
    `)
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[creators.functions] Erro ao listar collabs da loja:", error);
    return [] as StoryCollabDTO[];
  }

  return (collabs || []).map((c: any) => ({
    id: c.id,
    story_id: c.story_id,
    creator_id: c.creator_id,
    store_id: c.store_id,
    allow_store_repost: c.allow_store_repost,
    status: c.status,
    approved_at: c.approved_at,
    created_at: c.created_at,
    creator: c.creator_profiles,
    story: c.stories,
  })) as StoryCollabDTO[];
});

// ─── 6. APROVAR OU REJEITAR CO-PUBLICAÇÃO PELA LOJA ──────────────────────────
export const respondToStoryCollab = createServerFn({ method: "POST" })
  .validator(
    z.object({
      collabId: z.string().uuid(),
      action: z.enum(["approve", "reject"]),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

    const newStatus = data.action === "approve" ? "approved" : "rejected";

    const { data: updated, error } = await supabase
      .from("story_collabs")
      .update({
        status: newStatus,
        approved_at: newStatus === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", data.collabId)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) {
      console.error("[creators.functions] Erro ao responder co-publicação:", error);
      throw new Error("Falha ao atualizar status da co-publicação.");
    }

    return updated;
  });
