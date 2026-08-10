import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export const toggleStoreFollow = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();
  const { resolveTenantStoreId } = await import("@/lib/tenant");
  const storeId = await resolveTenantStoreId();
  if (!storeId) throw new Error("Loja não encontrada.");

  if (!identity.customer_id) {
    throw new Error("Você precisa estar logado para seguir uma loja.");
  }

  // Check if already following
  const { data: existing } = await supabase
    .from("store_followers")
    .select("store_id")
    .eq("store_id", storeId)
    .eq("customer_id", identity.customer_id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("store_followers")
      .delete()
      .eq("store_id", storeId)
      .eq("customer_id", identity.customer_id);
    return { following: false };
  } else {
    await supabase
      .from("store_followers")
      .insert({ store_id: storeId, customer_id: identity.customer_id });
    return { following: true };
  }
});

export const getStoreFollowStatus = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();
  const { resolveTenantStoreId } = await import("@/lib/tenant");
  const storeId = await resolveTenantStoreId();
  if (!storeId) return { following: false };

  if (!identity.customer_id) return { following: false };

  const { data: existing } = await supabase
    .from("store_followers")
    .select("store_id")
    .eq("store_id", storeId)
    .eq("customer_id", identity.customer_id)
    .limit(1)
    .maybeSingle();

  return { following: !!existing };
});

export const submitProductReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      rating: z.number().min(1).max(5),
      comment: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data: { productId, rating, comment } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja não encontrada.");

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para avaliar um produto.");
    }

    // Security check: Must have purchased the product
    const { data: purchaseVerify } = await supabase
      .from("orders")
      .select("id, order_items!inner(product_id)")
      .eq("customer_snapshot->>id", identity.customer_id)
      .in("status", ["paid", "shipped", "delivered", "completed"])
      .eq("order_items.product_id", productId)
      .limit(1)
      .maybeSingle();

    if (!purchaseVerify) {
      throw new Error("Apenas clientes que compraram este produto podem avaliá-lo.");
    }

    const { error } = await supabase.from("reviews").insert({
      store_id: storeId,
      product_id: productId,
      user_id: identity.customer_id,
      rating,
      comment,
      status: "pending", // Now requires moderation or we can leave as approved if we trust verified buyers
    });

    if (error) {
      throw new Error("Falha ao enviar avaliação: " + error.message);
    }

    return { success: true };
  });

export const getProductReviewStats = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data: { productId } }) => {
    const supabase = getServerClient();
    const { data, error } = await supabase.rpc("get_product_review_stats", {
      p_product_id: productId,
    });

    if (error || !data) {
      return { average_rating: 0, total_reviews: 0 };
    }
    return data as { average_rating: number; total_reviews: number };
  });

export const getProductReviewsList = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string().uuid() }))
  .handler(async ({ data: { productId } }) => {
    const supabase = getServerClient();
    const { data: reviewsData, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_name, user_id")
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !reviewsData) return [];

    const userIds = Array.from(new Set(reviewsData.map((r: any) => r.user_id).filter(Boolean)));
    let profileMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (profiles) {
        profileMap = new Map(profiles.map((p: any) => [p.id, p.full_name]));
      }
    }

    return reviewsData.map((d: any) => ({
      id: d.id,
      rating: d.rating,
      comment: d.comment,
      createdAt: d.created_at,
      userName: d.reviewer_name || profileMap.get(d.user_id) || "Cliente Anônimo",
    }));
  });

export const listStoreFollowers = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();
    if (!identity.id || !identity.store_id) return [];

    const db = getServerClient();
    const { data, error } = await db
      .from("store_followers")
      .select("created_at, customer:auth.users(id, raw_user_meta_data)")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (e: any) {
    console.error("[social.functions] listStoreFollowers:", e);
    return [];
  }
});

// ---------------------------------------------------------------------------
// MURAL FEED
// ---------------------------------------------------------------------------

/**
 * Tipos de item do feed do Mural.
 * Cada item tem um `type` explícito para renderização condicional no cliente.
 */
export type MuralFeedItem =
  | {
      type: "classified";
      id: string;
      category: string;
      title: string;
      content: string;
      price_cents: number | null;
      images: string[];
      location_text: string | null;
      condition: string | null;
      negotiable: boolean;
      created_at: string;
    }
  | {
      type: "event";
      id: string;
      title: string;
      description: string | null;
      event_date: string;
      end_date: string | null;
      location: string | null;
      address: string | null;
      is_free: boolean;
      cover_image: string | null;
      tags: string[];
      store_id: string;
      created_at: string;
    }
  | {
      type: "ad";
      id: string;
      title: string;
      body: string | null;
      image_url: string | null;
      target_url: string | null;
      store_id: string;
      created_at: string;
    };

export type MuralFeedResponse = {
  items: MuralFeedItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

const muralFeedInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(), // ISO timestamp — busca itens ANTES deste cursor
  types: z
    .array(z.enum(["classified", "event", "ad"]))
    .optional()
    .default(["classified", "event", "ad"]),
  category: z.string().optional(), // Filtro de categoria para classifieds
});

export type MuralFeedInput = z.infer<typeof muralFeedInput>;

export const getMuralFeed = createServerFn({ method: "GET" })
  .validator(muralFeedInput)
  .handler(async ({ data: input }) => {
    const db = getServerClient();
    const { limit, cursor, types, category } = input;
    const now = new Date().toISOString();
    const cursorDate = cursor || now;
    const perType = Math.ceil(limit / types.length);

    const items: MuralFeedItem[] = [];

    // ── Classificados ────────────────────────────────────────────────────────
    if (types.includes("classified")) {
      let q = db
        .from("classifieds")
        .select(
          "id, category, title, content, price_cents, images, location_text, condition, negotiable, created_at",
        )
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .lt("created_at", cursorDate)
        .order("created_at", { ascending: false })
        .limit(perType);

      if (category) q = q.eq("category", category);

      const { data } = await q;
      for (const c of data || []) {
        items.push({
          type: "classified",
          id: c.id,
          category: c.category,
          title: c.title,
          content: c.content,
          price_cents: c.price_cents,
          images: (c.images as string[]) ?? [],
          location_text: c.location_text,
          condition: c.condition,
          negotiable: c.negotiable ?? true,
          created_at: c.created_at,
        });
      }
    }

    // ── Eventos publicados (próximos 60 dias) ─────────────────────────────────
    if (types.includes("event")) {
      const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await db
        .from("events")
        .select(
          "id, title, description, event_date, end_date, location, address, is_free, cover_image, tags, store_id, created_at",
        )
        .eq("status", "published")
        .gte("event_date", now)
        .lte("event_date", sixtyDaysFromNow)
        .lt("created_at", cursorDate)
        .order("event_date", { ascending: true })
        .limit(perType);

      for (const e of data || []) {
        items.push({
          type: "event",
          id: e.id,
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          end_date: e.end_date ?? null,
          location: e.location,
          address: e.address ?? null,
          is_free: e.is_free ?? false,
          cover_image: e.cover_image,
          tags: (e.tags as string[]) ?? [],
          store_id: e.store_id,
          created_at: e.created_at,
        });
      }
    }

    // ── Anúncios do Feed ──────────────────────────────────────────────────────
    if (types.includes("ad")) {
      const { data } = await db
        .from("ad_campaigns")
        .select("id, title, body, image_url, target_url, store_id, created_at")
        .eq("status", "active")
        .contains("placements", ["feed"])
        .lt("created_at", cursorDate)
        .order("created_at", { ascending: false })
        .limit(Math.max(2, Math.floor(perType / 3))); // Máx 1/3 do feed são anúncios

      for (const a of data || []) {
        items.push({
          type: "ad",
          id: a.id,
          title: a.title,
          body: a.body ?? null,
          image_url: a.image_url ?? null,
          target_url: a.target_url ?? null,
          store_id: a.store_id,
          created_at: a.created_at,
        });
      }
    }

    // Ordenar por created_at descrescente (mistura os tipos no feed)
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const trimmed = items.slice(0, limit);
    const hasMore = items.length > limit;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.created_at ?? null : null;

    return { items: trimmed, hasMore, nextCursor } as MuralFeedResponse;
  });

