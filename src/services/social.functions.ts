import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export const toggleStoreFollow = createServerFn({ method: "POST" })
  .validator(z.object({ storeId: z.string().uuid().optional() }).optional())
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();
    
    let targetStoreId = data?.storeId;
    if (!targetStoreId) {
      const { resolveTenantStoreId } = await import("@/lib/tenant.server");
      targetStoreId = (await resolveTenantStoreId()) || undefined;
    }
    if (!targetStoreId) throw new Error("Loja não encontrada.");

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para seguir uma loja.");
    }

    const { data: existing } = await supabase
      .from("store_followers")
      .select("store_id")
      .eq("store_id", targetStoreId)
      .eq("customer_id", identity.customer_id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("store_followers")
        .delete()
        .eq("store_id", targetStoreId)
        .eq("customer_id", identity.customer_id);
      return { following: false };
    } else {
      await supabase
        .from("store_followers")
        .insert({ store_id: targetStoreId, customer_id: identity.customer_id });
      return { following: true };
    }
  });

export const getStoreFollowStatus = createServerFn({ method: "GET" })
  .validator(z.object({ storeId: z.string().uuid().optional() }).optional())
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    let targetStoreId = data?.storeId;
    if (!targetStoreId) {
      const { resolveTenantStoreId } = await import("@/lib/tenant.server");
      targetStoreId = (await resolveTenantStoreId()) || undefined;
    }
    if (!targetStoreId) return { following: false };

    if (!identity.customer_id) return { following: false };

    const { data: existing } = await supabase
      .from("store_followers")
      .select("store_id")
      .eq("store_id", targetStoreId)
      .eq("customer_id", identity.customer_id)
      .limit(1)
      .maybeSingle();

    return { following: !!existing };
  });

export const submitProductReview = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string(),
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      throw new Error("Identificador de produto inválido.");
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
      throw new Error("Falha ao enviar avaliação: " + error.message);
    }

    return { success: true };
  });

export const getProductReviewStats = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string() }))
  .handler(async ({ data: { productId } }) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return { average_rating: 5, total_reviews: 1 };
    }

    const supabase = getServerClient();
    const { data, error } = await supabase.rpc("get_product_review_stats", {
      p_product_id: productId,
    });

    if (error || !data) {
      return { average_rating: 5, total_reviews: 1 };
    }
    return data as { average_rating: number; total_reviews: number };
  });

export const getProductReviewsList = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string() }))
  .handler(async ({ data: { productId } }) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return [];
    }

    const supabase = getServerClient();
    const { data: reviewsData, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_name, user_id")
      .eq("product_id", productId)
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

export type PostReferenceType = "product" | "event" | "classified" | "ad" | "job" | "news" | "article" | "none";

export type PostType =
  "simple" | "carousel" | "grid" | "moment" | "destination" | "food" | "banner" | "event";

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
  layout_style?: "grid" | "carousel";
  post_type: PostType;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  metadata?: Record<string, any>;
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
  post_type: z
    .enum(["simple", "carousel", "grid", "moment", "destination", "food", "banner", "event"])
    .optional(),
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

    const { limit, cursor, post_type } = input;
    const now = new Date().toISOString();
    const cursorDate = cursor || now;

    // ── 1. Fetch posts (single query with joined author info) ──────────────
    let query = db
      .from("posts")
      .select(
        `
        id, content_text, media_urls, layout_style, post_type, location_name, location_lat, location_lng, metadata,
        reference_type, reference_id, created_at,
        author_profile_id, author_store_id,
        profiles(full_name, avatar_url),
        stores(name, settings)
      `,
      )
      .eq("status", "active")
      .lt("created_at", cursorDate);

    if (post_type) {
      query = query.eq("post_type", post_type);
    }

    const { data: postsData, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (error) {
      console.error("Erro ao buscar posts:", error);
      return { items: [], hasMore: false, nextCursor: null } as MuralFeedResponse;
    }

    const posts = postsData ?? [];
    const postIds = posts.map((p) => p.id);

    if (postIds.length === 0) {
      return { items: [], hasMore: false, nextCursor: null } as MuralFeedResponse;
    }

    // ── 2. Batch: likes_count per post ───────────────────
    const { data: likeCounts } = await db
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds);

    const likeCountMap = new Map<string, number>();
    (likeCounts ?? []).forEach((row: any) => {
      likeCountMap.set(row.post_id, (likeCountMap.get(row.post_id) ?? 0) + 1);
    });

    // ── 3. Batch: which posts current user liked ────────
    const likedSet = new Set<string>();
    if (profile_id) {
      const { data: userLikes } = await db
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds)
        .eq("profile_id", profile_id);
      (userLikes ?? []).forEach((row: any) => likedSet.add(row.post_id));
    }

    // ── 4. Batch: reference data by type ─────────────────
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

    // ── 5. Assemble items ─────────────────────────────────
    const items: MuralFeedItem[] = posts.map((p) => {
      const is_store = !!p.author_store_id && !!p.stores;
      const prof = p.profiles as any;
      const store = p.stores as any;
      const storeLogo = store?.settings?.avatar_url || store?.settings?.logo_url || null;

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
          name: is_store ? store.name : (prof?.full_name || "").trim() || "Membro da Jah",
          avatar_url: is_store ? storeLogo : (prof?.avatar_url ?? null),
          is_store,
        },
        content_text: p.content_text,
        media_urls: p.media_urls || [],
        layout_style: p.layout_style,
        post_type:
          (p.post_type as PostType) || (p.layout_style === "carousel" ? "carousel" : "simple"),
        location_name: p.location_name,
        location_lat: p.location_lat,
        location_lng: p.location_lng,
        metadata: p.metadata || {},
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
      content_text: z
        .string()
        .optional()
        .nullable()
        .transform((v) => (v && v.trim() ? v.trim() : null)),
      media_urls: z.array(z.string().url()).optional(),
      layout_style: z.enum(["grid", "carousel"]).default("grid"),
      post_type: z
        .enum(["simple", "carousel", "grid", "moment", "destination", "food", "banner", "event"])
        .default("simple"),
      location_name: z.string().optional().nullable(),
      location_lat: z.number().optional().nullable(),
      location_lng: z.number().optional().nullable(),
      metadata: z.record(z.any()).optional(),
      reference_type: z
        .enum(["product", "event", "classified", "ad", "job", "none"])
        .default("none"),
      reference_id: z.string().uuid().optional().nullable(),
      as_store: z.boolean().default(false),
    }),
  )
  .handler(async ({ data: input }) => {
    const db = getServerClient();
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
        layout_style: input.layout_style,
        post_type: input.post_type,
        location_name: input.location_name || null,
        location_lat: input.location_lat || null,
        location_lng: input.location_lng || null,
        metadata: input.metadata || {},
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
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();
    if (!identity.id) throw new Error("Precisa estar logado para curtir.");

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

/**
 * Retorna itens geo-localizados para exibição no Mapa Social com Moments.
 * Combina posts com coordenadas + locais do diretório + eventos com endereço.
 */
export const getMomentsMap = createServerFn({ method: "GET" })
  .validator(
    z.object({
      category: z.string().optional(),
    }),
  )
  .handler(async ({ data: { category } }) => {
    const db = getServerClient();

    // 1. Posts de momentos com localização
    let postQuery = db
      .from("posts")
      .select(
        `
        id, content_text, media_urls, post_type, location_name, location_lat, location_lng, metadata, created_at,
        profiles(full_name, avatar_url),
        stores(name, settings)
      `,
      )
      .eq("status", "active")
      .not("location_lat", "is", null)
      .not("location_lng", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);

    // 2. Negócios do diretório
    const directoryQuery = db
      .from("directory_listings")
      .select("id, category, contact_phone, store_id, stores(name, settings)")
      .eq("status", "active")
      .limit(40);

    // 3. Eventos
    const eventsQuery = db
      .from("events")
      .select("id, title, event_date, cover_image, is_free, location_name")
      .eq("status", "published")
      .order("event_date", { ascending: true })
      .limit(30);

    const [postsRes, dirRes, eventsRes] = await Promise.all([
      postQuery,
      directoryQuery,
      eventsQuery,
    ]);

    const moments = (postsRes.data || []).map((p: any) => {
      const is_store = !!p.stores?.name;
      const storeLogo = p.stores?.settings?.avatar_url || p.stores?.settings?.logo_url || null;
      return {
        id: p.id,
        kind: "moment" as const,
        title: p.location_name || (is_store ? p.stores.name : p.profiles?.full_name) || "Momento",
        subtitle: p.content_text?.substring(0, 80) || "",
        image_url: p.media_urls?.[0] || null,
        avatar_url: is_store ? storeLogo : p.profiles?.avatar_url,
        author_name: is_store ? p.stores.name : p.profiles?.full_name || "Membro da Jah",
        lat: p.location_lat as number,
        lng: p.location_lng as number,
        post_type: p.post_type || "moment",
        created_at: p.created_at,
        metadata: p.metadata || {},
      };
    });

    const places = (dirRes.data || []).map((d: any) => {
      const storeLogo = d.stores?.settings?.avatar_url || d.stores?.settings?.logo_url || null;
      return {
        id: d.id,
        kind: "place" as const,
        title: d.stores?.name || "Local Comunitário",
        subtitle: d.category || "Negócio Local",
        category: d.category,
        avatar_url: storeLogo,
        phone: d.contact_phone || null,
        lat: (d.stores?.settings as any)?.latitude || -27.1000 + (Math.random() - 0.5) * 0.05,
        lng: (d.stores?.settings as any)?.longitude || -52.6150 + (Math.random() - 0.5) * 0.05,
      };
    });

    const events = (eventsRes.data || []).map((e: any) => ({
      id: e.id,
      kind: "event" as const,
      title: e.title,
      subtitle: e.location_name || "Local do evento",
      image_url: e.cover_image || null,
      event_date: e.event_date,
      is_free: e.is_free,
      lat: -27.1000 + (Math.random() - 0.5) * 0.06,
      lng: -52.6150 + (Math.random() - 0.5) * 0.06,
    }));

    return {
      moments,
      places,
      events,
    };
  });

/**
 * Retorna stories reais e autênticos publicados nas últimas 24 horas.
 * Se nenhuma loja ou usuário publicou nada nas últimas 24h, retorna lista vazia [] (zero mocks).
 */
export const getFeedStories = createServerFn({ method: "GET" }).handler(async () => {
  const db = getServerClient();

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Consulta apenas stories reais ativos publicados nas últimas 24 horas
  const { data: realStories, error } = await db
    .from("stories")
    .select("id, store_id, media_url, link_url, created_at, stores(id, name, avatar_url, settings)")
    .eq("status", "active")
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !realStories || realStories.length === 0) {
    return [];
  }

  return realStories.map((s: any) => {
    const store = s.stores;
    const storeLogo = store?.avatar_url || store?.settings?.avatar_url || store?.settings?.logo_url || "";
    return {
      id: `story-${s.id}`,
      type: "store" as const,
      title: store?.name || "Loja",
      image_url: s.media_url,
      avatar_url: storeLogo || null,
      link_url: s.link_url || null,
      badge: "Loja",
      created_at: s.created_at,
    };
  });
});

/**
 * Retorna amigos/membros sugeridos para seguir.
 */
export const getSuggestedFriends = createServerFn({ method: "GET" }).handler(async () => {
  const db = getServerClient();
  const { data } = await db.from("profiles").select("id, full_name, avatar_url, bio").limit(8);

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || "Membro Comunitário",
    avatar_url: p.avatar_url,
    reason: "Ativo na comunidade",
    bio: p.bio,
  }));
});

/**
 * Retorna o perfil público de um membro com suas publicações e classificados.
 */
export const getPublicMemberProfile = createServerFn({ method: "GET" })
  .validator(z.object({ profileId: z.string().uuid() }))
  .handler(async ({ data: { profileId } }) => {
    const db = getServerClient();

    const [profileRes, postsRes, classifiedsRes] = await Promise.all([
      db
        .from("profiles")
        .select("id, full_name, avatar_url, bio, role, created_at")
        .eq("id", profileId)
        .maybeSingle(),
      db
        .from("posts")
        .select("id, content_text, media_urls, layout_style, post_type, location_name, created_at")
        .eq("author_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("classifieds")
        .select(
          "id, title, content, price_cents, images, category, condition, location_name, created_at",
        )
        .eq("author_profile_id", profileId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (!profileRes.data) {
      return null;
    }

    return {
      profile: profileRes.data,
      posts: postsRes.data || [],
      classifieds: classifiedsRes.data || [],
    };
  });

/**
 * Seguir ou deixar de seguir um membro real da comunidade com persistência no Supabase.
 */
export const toggleUserFollow = createServerFn({ method: "POST" })
  .validator(z.object({ targetUserId: z.string().uuid() }))
  .handler(async ({ data: { targetUserId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Você precisa estar logado para seguir um membro.");
    }

    if (identity.customer_id === targetUserId) {
      throw new Error("Você não pode seguir seu próprio perfil.");
    }

    const { data: existing } = await supabase
      .from("user_followers")
      .select("following_user_id")
      .eq("following_user_id", targetUserId)
      .eq("follower_user_id", identity.customer_id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_followers")
        .delete()
        .eq("following_user_id", targetUserId)
        .eq("follower_user_id", identity.customer_id);
      return { following: false };
    } else {
      await supabase
        .from("user_followers")
        .insert({
          following_user_id: targetUserId,
          follower_user_id: identity.customer_id,
        });
      return { following: true };
    }
  });

/**
 * Consulta status de seguimento de um membro da comunidade.
 */
export const getUserFollowStatus = createServerFn({ method: "GET" })
  .validator(z.object({ targetUserId: z.string().uuid() }))
  .handler(async ({ data: { targetUserId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) return { following: false };

    const { data: existing } = await supabase
      .from("user_followers")
      .select("following_user_id")
      .eq("following_user_id", targetUserId)
      .eq("follower_user_id", identity.customer_id)
      .limit(1)
      .maybeSingle();

    return { following: !!existing };
  });
