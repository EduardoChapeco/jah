import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export const toggleStoreFollow = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();
  const { resolveTenantStoreId } = await import("@/lib/tenant.server");
  const storeId = await resolveTenantStoreId();
  if (!storeId) throw new Error("Loja não encontrada.");

  if (!identity.customer_id) {
    throw new Error("Você precisa estar logado para seguir uma loja.");
  }

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
  const { resolveTenantStoreId } = await import("@/lib/tenant.server");
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
    const { resolveTenantStoreId } = await import("@/lib/tenant.server");
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja não encontrada.");

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para avaliar um produto.");
    }

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
      status: "pending",
    });

    if (error) {
      throw new Error("Falha ao enviar avaliação: " + (error instanceof Error ? error.message : String(error)));
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
  } catch (e: unknown) {
    console.error("[social.functions] listStoreFollowers:", e);
    return [];
  }
});

// ---------------------------------------------------------------------------
// MURAL FEED & POSTS
// ---------------------------------------------------------------------------

export type PostReferenceType = "product" | "event" | "classified" | "ad" | "job" | "none";

export type MuralFeedItem = {
  type: "post";
  id: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_store: boolean;
  };
  content_text: string | null;
  media_urls: string[];
  reference_type: PostReferenceType;
  reference_id: string | null;
  reference_data?: any;
  created_at: string;
  likes_count: number;
  user_liked: boolean;
};

export type MuralFeedResponse = {
  items: MuralFeedItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

const muralFeedInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
});

export type MuralFeedInput = z.infer<typeof muralFeedInput>;

export const getMuralFeed = createServerFn({ method: "GET" })
  .validator(muralFeedInput)
  .handler(async ({ data: input }) => {
    const db = getServerClient();
    // Resolve current user's profile_id — non-blocking failure for public access
    let profile_id: string | null = null;
    try {
      const identity = await getCurrentIdentity();
      profile_id = (identity as any).profile_id ?? null;
    } catch {
      // anonymous visitor — no likes
    }

    const { limit, cursor } = input;
    const now = new Date().toISOString();
    const cursorDate = cursor || now;

    // ── 1. Fetch posts (single query with joined author info) ──────────────
    const { data: postsData, error } = await db
      .from("posts")
      .select(
        `
        id, content_text, media_urls, reference_type, reference_id, created_at,
        author_profile_id, author_store_id,
        profiles!posts_author_profile_id_fkey(first_name, last_name, avatar_url),
        stores!posts_author_store_id_fkey(name, logo_url)
      `,
      )
      .eq("status", "active")
      .lt("created_at", cursorDate)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (error) {
      console.error("Erro ao buscar posts:", error);
      throw new Error("Erro ao carregar o mural.");
    }

    const posts = postsData ?? [];
    const postIds = posts.map((p) => p.id);

    if (postIds.length === 0) {
      return { items: [], hasMore: false, nextCursor: null } as MuralFeedResponse;
    }

    // ── 2. Batch: likes_count per post (single aggregate query) ───────────
    const { data: likeCounts } = await db
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds);

    const likeCountMap = new Map<string, number>();
    (likeCounts ?? []).forEach((row: any) => {
      likeCountMap.set(row.post_id, (likeCountMap.get(row.post_id) ?? 0) + 1);
    });

    // ── 3. Batch: which posts the current user liked ───────────────────────
    const likedSet = new Set<string>();
    if (profile_id) {
      const { data: userLikes } = await db
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds)
        .eq("profile_id", profile_id);
      (userLikes ?? []).forEach((row: any) => likedSet.add(row.post_id));
    }

    // ── 4. Batch: reference data by type ──────────────────────────────────
    const productIds = posts
      .filter((p) => p.reference_type === "product" && p.reference_id)
      .map((p) => p.reference_id!);
    const eventIds = posts
      .filter((p) => p.reference_type === "event" && p.reference_id)
      .map((p) => p.reference_id!);
    const classifiedIds = posts
      .filter((p) => p.reference_type === "classified" && p.reference_id)
      .map((p) => p.reference_id!);

    const productMap = new Map<string, any>();
    const eventMap = new Map<string, any>();
    const classifiedMap = new Map<string, any>();

    if (productIds.length > 0) {
      const { data } = await db
        .from("products")
        .select("id, title, price_cents, images")
        .in("id", productIds);
      (data ?? []).forEach((r: any) => productMap.set(r.id, r));
    }
    if (eventIds.length > 0) {
      const { data } = await db
        .from("events")
        .select("id, title, event_date, cover_image, is_free")
        .in("id", eventIds);
      (data ?? []).forEach((r: any) => eventMap.set(r.id, r));
    }
    if (classifiedIds.length > 0) {
      const { data } = await db
        .from("classifieds")
        .select("id, title, price_cents, images")
        .in("id", classifiedIds);
      (data ?? []).forEach((r: any) => classifiedMap.set(r.id, r));
    }

    // ── 5. Assemble items ─────────────────────────────────────────────────
    const items: MuralFeedItem[] = posts.map((p) => {
      const is_store = !!p.author_store_id && !!p.stores;
      const prof = p.profiles as any;
      const store = p.stores as any;

      let reference_data: any = null;
      if (p.reference_type === "product" && p.reference_id)
        reference_data = productMap.get(p.reference_id) ?? null;
      else if (p.reference_type === "event" && p.reference_id)
        reference_data = eventMap.get(p.reference_id) ?? null;
      else if (p.reference_type === "classified" && p.reference_id)
        reference_data = classifiedMap.get(p.reference_id) ?? null;

      return {
        type: "post" as const,
        id: p.id,
        author: {
          id: p.author_store_id || p.author_profile_id,
          name: is_store ? store.name : `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim(),
          avatar_url: is_store ? store.logo_url : (prof?.avatar_url ?? null),
          is_store,
        },
        content_text: p.content_text,
        media_urls: p.media_urls || [],
        reference_type: p.reference_type as PostReferenceType,
        reference_id: p.reference_id,
        reference_data,
        created_at: p.created_at,
        likes_count: likeCountMap.get(p.id) ?? 0,
        user_liked: likedSet.has(p.id),
      };
    });

    const hasMore = items.length > limit;
    if (hasMore) items.pop();
    const nextCursor = hasMore ? (items[items.length - 1]?.created_at ?? null) : null;

    return { items, hasMore, nextCursor } as MuralFeedResponse;
  });

export const createPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      content_text: z.string().min(1, "Escreva algo para publicar.").optional(),
      media_urls: z.array(z.string().url()).optional(),
      reference_type: z
        .enum(["product", "event", "classified", "ad", "job", "none"])
        .default("none"),
      reference_id: z.string().uuid().optional().nullable(),
      as_store: z.boolean().default(false),
    }),
  )
  .handler(async ({ data: input }) => {
    const db = getServerClient();
    // Autorização canônica — nunca as any
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();

    if (!identity.id) throw new Error("Não autorizado — faça login para publicar.");
    if (!input.content_text && (!input.media_urls || input.media_urls.length === 0)) {
      throw new Error("O post precisa ter texto ou mídia.");
    }

    let author_store_id: string | null = null;
    if (input.as_store) {
      if (!identity.store_id) throw new Error("Nenhuma loja ativa para publicar como loja.");
      author_store_id = identity.store_id;
    }

    const { data, error } = await db
      .from("posts")
      .insert({
        author_profile_id: identity.id,
        author_store_id,
        content_text: input.content_text || null,
        media_urls: input.media_urls || [],
        reference_type: input.reference_type,
        reference_id: input.reference_id || null,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao criar post:", error);
      throw new Error("Falha ao criar publicação no mural");
    }

    return { success: true, post_id: data.id };
  });

export const togglePostLike = createServerFn({ method: "POST" })
  .validator(z.object({ post_id: z.string().uuid() }))
  .handler(async ({ data: { post_id } }) => {
    const db = getServerClient();
    // Autorização canônica
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();
    if (!identity.id) throw new Error("Precisa estar logado para curtir.");

    // Usa o profile_id (auth.users.id) como identificador de curtida
    const profile_id = identity.id;

    const { data: existing } = await db
      .from("post_likes")
      .select("post_id")
      .eq("post_id", post_id)
      .eq("profile_id", profile_id)
      .maybeSingle();

    if (existing) {
      await db.from("post_likes").delete().eq("post_id", post_id).eq("profile_id", profile_id);
      return { liked: false };
    } else {
      await db.from("post_likes").insert({ post_id, profile_id });
      return { liked: true };
    }
  });
