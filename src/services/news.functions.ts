import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export interface NewsSectionDTO {
  type: "paragraph" | "heading" | "quote" | "gallery" | "video";
  content: string | string[];
  caption?: string;
}

export interface NewsArticleDTO {
  id: string;
  store_id: string;
  store_name?: string;
  store_avatar?: string;
  author_profile_id?: string | null;
  author_name?: string;
  title: string;
  slug: string;
  kicker?: string | null;
  subtitle?: string | null;
  content_sections: NewsSectionDTO[];
  cover_media_url?: string | null;
  cover_media_type: "image" | "video" | "gif";
  category: string;
  tags: string[];
  reading_time_minutes: number;
  views_count: number;
  unique_views_count: number;
  status: "draft" | "published" | "archived";
  published_at?: string | null;
  created_at: string;
}

export interface SponsorDTO {
  id: string;
  store_id: string;
  name: string;
  logo_url?: string | null;
  banner_url?: string | null;
  video_url?: string | null;
  website_url?: string | null;
  cta_label?: string | null;
  description?: string | null;
  tier: "gold" | "silver" | "standard" | "supporter";
  active: boolean;
  created_at: string;
}

export interface NewsCommentDTO {
  id: string;
  article_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string | null;
  content_text: string;
  created_at: string;
}

export const SEED_ARTICLES: NewsArticleDTO[] = [
  {
    id: "n0000000-0000-0000-0000-000000000001",
    store_id: "s0000000-0000-0000-0000-000000000001",
    store_name: "JAH Notícias & Redação Regional",
    store_avatar: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&q=80",
    author_name: "Redação JAH",
    title: "Festival de Inovação e Ecoturismo reúne empreendedores no Oeste",
    slug: "festival-inovacao-ecoturismo-oeste",
    kicker: "DESENVOLVIMENTO REGIONAL",
    subtitle: "Evento debate soluções sustentáveis, circuitos turísticos do Rio Uruguai e atração de novos investimentos para Chapecó.",
    content_sections: [
      {
        type: "paragraph",
        content: "A região Oeste catarinense vive um momento de forte expansão no turismo de experiência e na integração entre o agronegócio e a tecnologia. Durante três dias de programação intensa, líderes empresariais e produtores locais debateram novos modelos de negócios cooperativos.",
      },
      {
        type: "heading",
        content: "Valorização da Produção Local e Roteiros Turísticos",
      },
      {
        type: "paragraph",
        content: "O destaque da feira foi a apresentação das novas rotas gastronômicas que conectam vinícolas coloniais, queijarias premiadas e cabanas de montanha na bacia do Rio Uruguai. A iniciativa promete ampliar o fluxo de visitantes em todas as estações do ano.",
      },
      {
        type: "quote",
        content: "Nosso objetivo é transformar o potencial natural e a força do nosso povo em valor compartilhado para toda a comunidade.",
        caption: "Coordenação do Fórum Regional de Turismo",
      },
    ],
    cover_media_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80",
    cover_media_type: "image",
    category: "cidade",
    tags: ["Turismo", "Economia", "Oeste SC", "Inovação"],
    reading_time_minutes: 4,
    views_count: 1420,
    unique_views_count: 980,
    status: "published",
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "n0000000-0000-0000-0000-000000000002",
    store_id: "s0000000-0000-0000-0000-000000000001",
    store_name: "JAH Notícias & Redação Regional",
    store_avatar: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&q=80",
    author_name: "Ana Silveira",
    title: "Comércio Local bate recorde de vendas com programas de fidelidade comunitários",
    slug: "comercio-local-bate-recorde-vendas",
    kicker: "ECONOMIA LOCAL",
    subtitle: "Lojistas apontam aumento de 35% na retenção de clientes após adoção de cashback unificado e vitrines digitais.",
    content_sections: [
      {
        type: "paragraph",
        content: "Pequenos e médios comerciantes de Chapecó estão colhendo os frutos da digitalização cooperativa. A integração de catálogos com sistemas de fidelização permitiu que consumidores concentrassem suas compras nos bairros da cidade.",
      },
      {
        type: "paragraph",
        content: "Os setores de alimentação, vestuário e produtos agroecológicos foram os que apresentaram o maior índice de recompra ao longo do último trimestre.",
      },
    ],
    cover_media_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
    cover_media_type: "image",
    category: "economia",
    tags: ["Comércio", "Varejo", "Fidelidade", "Chapecó"],
    reading_time_minutes: 3,
    views_count: 870,
    unique_views_count: 620,
    status: "published",
    published_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "n0000000-0000-0000-0000-000000000003",
    store_id: "s0000000-0000-0000-0000-000000000001",
    store_name: "JAH Notícias & Redação Regional",
    store_avatar: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&q=80",
    author_name: "Carlos Mendes",
    title: "Novas conexões de transporte e logística expressa fortalecem entregadores autônomos",
    slug: "logistica-expressa-entregadores-autonomos",
    kicker: "LOGÍSTICA & MOBILIDADE",
    subtitle: "Plataforma conecta frotas locais e motoristas autônomos sem taxas abusivas de intermediação.",
    content_sections: [
      {
        type: "paragraph",
        content: "O ecossistema de mobilidade urbana da JAH expandiu sua cobertura com a implementação da central de despacho de fretes e entregas rápidas na região.",
      },
    ],
    cover_media_url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=80",
    cover_media_type: "image",
    category: "tecnologia",
    tags: ["Logística", "Mobilidade", "Entregas", "Tecnologia"],
    reading_time_minutes: 3,
    views_count: 650,
    unique_views_count: 490,
    status: "published",
    published_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
];

// ── 1. Leitura Pública de Notícias ──────────────────────────────────────────

export const listPublicArticles = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: z.string().optional(),
        storeId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(50).default(20),
        query: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<NewsArticleDTO[]> => {
    const supabase = getAnonServerClient();
    const limit = data?.limit ?? 20;

    try {
      let q = supabase
        .from("news_articles")
        .select(
          `
          id, store_id, author_profile_id, title, slug, kicker, subtitle, content_sections,
          cover_media_url, cover_media_type, category, tags, reading_time_minutes,
          views_count, unique_views_count, status, published_at, created_at,
          stores ( name, avatar_url ),
          profiles ( full_name )
        `,
        )
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (data?.category && data.category !== "todas") {
        q = q.eq("category", data.category);
      }

      if (data?.storeId) {
        q = q.eq("store_id", data.storeId);
      }

      if (data?.query) {
        q = q.ilike("title", `%${data.query}%`);
      }

      const { data: articles, error } = await q;
      if (error) {
        console.warn("[news] Erro ao buscar artigos no banco:", error);
        return [];
      }

      return (articles || []).map((a: any) => ({
        id: a.id,
        store_id: a.store_id,
        store_name: a.stores?.name || "Portal de Notícias",
        store_avatar: a.stores?.avatar_url || null,
        author_profile_id: a.author_profile_id,
        author_name: a.profiles?.full_name || "Redação",
        title: a.title,
        slug: a.slug,
        kicker: a.kicker,
        subtitle: a.subtitle,
        content_sections: a.content_sections || [],
        cover_media_url: a.cover_media_url,
        cover_media_type: a.cover_media_type || "image",
        category: a.category,
        tags: a.tags || [],
        reading_time_minutes: a.reading_time_minutes || 3,
        views_count: a.views_count || 0,
        unique_views_count: a.unique_views_count || 0,
        status: a.status,
        published_at: a.published_at,
        created_at: a.created_at,
      }));
    } catch (err) {
      console.warn("[news] Erro ao buscar artigos no banco:", err);
      return [];
    }
  });

export const getArticleDetail = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string(), storeSlug: z.string().optional() }))
  .handler(
    async ({
      data: { slug },
    }): Promise<{
      article: NewsArticleDTO | null;
      sponsors: SponsorDTO[];
      related: NewsArticleDTO[];
    }> => {
      const supabase = getAnonServerClient();

      try {
        const { data: articleData, error } = await supabase
          .from("news_articles")
          .select(
            `
            id, store_id, author_profile_id, title, slug, kicker, subtitle, content_sections,
            cover_media_url, cover_media_type, category, tags, reading_time_minutes,
            views_count, unique_views_count, status, published_at, created_at,
            stores ( name, avatar_url, slug ),
            profiles ( full_name )
          `,
          )
          .eq("slug", slug)
          .eq("status", "published")
          .limit(1)
          .maybeSingle();

        if (!error && articleData) {
          const [sponsorsRes, relatedRes] = await Promise.all([
            supabase
              .from("sponsors")
              .select("*")
              .eq("store_id", articleData.store_id)
              .eq("active", true)
              .limit(6),
            supabase
              .from("news_articles")
              .select("id, title, slug, kicker, cover_media_url, category, published_at, created_at")
              .eq("status", "published")
              .eq("category", articleData.category)
              .neq("id", articleData.id)
              .order("published_at", { ascending: false })
              .limit(4),
          ]);

          return {
            article: articleData as any,
            sponsors: (sponsorsRes.data || []) as SponsorDTO[],
            related: (relatedRes.data || []) as NewsArticleDTO[],
          };
        }
      } catch (err) {
        console.warn("[news] Erro ao buscar detalhe do artigo no banco:", err);
      }

      // Fallback para SEED_ARTICLES
      const seed = SEED_ARTICLES.find((a) => a.slug === slug);
      if (seed) {
        const related = SEED_ARTICLES.filter((a) => a.id !== seed.id);
        return {
          article: seed,
          sponsors: [
            {
              id: "sp-seed-1",
              store_id: seed.store_id,
              name: "Excelência Negócios & Turismo",
              logo_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&q=80",
              banner_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
              tier: "gold",
              active: true,
              cta_label: "Conhecer Soluções",
              website_url: "https://jah.social",
              description: "Apoio ao jornalismo comunitário e expansão comercial do Oeste.",
              created_at: new Date().toISOString(),
            },
          ],
          related,
        };
      }

      return { article: null, sponsors: [], related: [] };
    },
  );

// ── 2. Gestão no Workspace (Notícias & Redação) ──────────────────────────────

export const listWorkspaceArticles = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsArticleDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) return [];

    const { data } = await supabase
      .from("news_articles")
      .select("*")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    return (data || []) as NewsArticleDTO[];
  },
);

export const createArticle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(3),
      slug: z.string().min(2),
      kicker: z.string().optional(),
      subtitle: z.string().optional(),
      content_sections: z.array(
        z.object({
          type: z.enum(["paragraph", "heading", "quote", "gallery", "video"]),
          content: z.union([z.string(), z.array(z.string())]),
          caption: z.string().optional(),
        }),
      ),
      cover_media_url: z.string().url().optional(),
      cover_media_type: z.enum(["image", "video", "gif"]).default("image"),
      category: z.string().default("geral"),
      tags: z.array(z.string()).default([]),
      reading_time_minutes: z.number().int().default(3),
      status: z.enum(["draft", "published", "archived"]).default("published"),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Nenhum espaço de trabalho ativo.");

    const { data: created, error } = await supabase
      .from("news_articles")
      .insert({
        store_id: identity.store_id,
        author_profile_id: identity.id || null,
        title: input.title,
        slug: input.slug.toLowerCase().trim(),
        kicker: input.kicker || null,
        subtitle: input.subtitle || null,
        content_sections: input.content_sections,
        cover_media_url: input.cover_media_url || null,
        cover_media_type: input.cover_media_type,
        category: input.category,
        tags: input.tags,
        reading_time_minutes: input.reading_time_minutes,
        status: input.status,
        published_at: input.status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as NewsArticleDTO;
  });

export const updateArticle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(3).optional(),
      slug: z.string().min(2).optional(),
      kicker: z.string().nullable().optional(),
      subtitle: z.string().nullable().optional(),
      content_sections: z
        .array(
          z.object({
            type: z.enum(["paragraph", "heading", "quote", "gallery", "video"]),
            content: z.union([z.string(), z.array(z.string())]),
            caption: z.string().optional(),
          }),
        )
        .optional(),
      cover_media_url: z.string().nullable().optional(),
      cover_media_type: z.enum(["image", "video", "gif"]).optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      reading_time_minutes: z.number().int().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }),
  )
  .handler(async ({ data: { id, ...patch } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Acesso negado.");

    const updatePayload: Record<string, any> = { ...patch, updated_at: new Date().toISOString() };
    if (patch.status === "published") {
      updatePayload.published_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from("news_articles")
      .update(updatePayload)
      .eq("id", id)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as NewsArticleDTO;
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Acesso negado.");

    const { error } = await supabase
      .from("news_articles")
      .delete()
      .eq("id", id)
      .eq("store_id", identity.store_id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ── 3. Gestão de Patrocinadores (Sponsors) ──────────────────────────────────

export const listWorkspaceSponsors = createServerFn({ method: "GET" }).handler(
  async (): Promise<SponsorDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) return [];

    const { data } = await supabase
      .from("sponsors")
      .select("*")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    return (data || []) as SponsorDTO[];
  },
);

export const createSponsor = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2),
      logo_url: z.string().url().optional(),
      banner_url: z.string().url().optional(),
      video_url: z.string().url().optional(),
      website_url: z.string().url().optional(),
      cta_label: z.string().default("Saiba Mais"),
      description: z.string().optional(),
      tier: z.enum(["gold", "silver", "standard", "supporter"]).default("standard"),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Acesso negado.");

    const { data, error } = await supabase
      .from("sponsors")
      .insert({
        store_id: identity.store_id,
        name: input.name,
        logo_url: input.logo_url || null,
        banner_url: input.banner_url || null,
        video_url: input.video_url || null,
        website_url: input.website_url || null,
        cta_label: input.cta_label,
        description: input.description || null,
        tier: input.tier,
        active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SponsorDTO;
  });

export const updateSponsor = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(2).optional(),
      logo_url: z.string().nullable().optional(),
      banner_url: z.string().nullable().optional(),
      video_url: z.string().nullable().optional(),
      website_url: z.string().nullable().optional(),
      cta_label: z.string().optional(),
      description: z.string().nullable().optional(),
      tier: z.enum(["gold", "silver", "standard", "supporter"]).optional(),
      active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data: { id, ...patch } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Acesso negado.");

    const { data, error } = await supabase
      .from("sponsors")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as SponsorDTO;
  });

export const deleteSponsor = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.store_id) throw new Error("Acesso negado.");

    const { error } = await supabase
      .from("sponsors")
      .delete()
      .eq("id", id)
      .eq("store_id", identity.store_id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ── 4. Comentários & Likes Reais ────────────────────────────────────────────

export const listArticleComments = createServerFn({ method: "GET" })
  .validator(z.object({ articleId: z.string().uuid() }))
  .handler(async ({ data: { articleId } }): Promise<NewsCommentDTO[]> => {
    const supabase = getAnonServerClient();

    const { data } = await supabase
      .from("news_comments")
      .select(
        `
        id, article_id, user_id, content_text, created_at,
        profiles ( full_name, avatar_url )
      `,
      )
      .eq("article_id", articleId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    return (data || []).map((c: any) => ({
      id: c.id,
      article_id: c.article_id,
      user_id: c.user_id,
      author_name: c.profiles?.full_name || "Leitor",
      author_avatar: c.profiles?.avatar_url || null,
      content_text: c.content_text,
      created_at: c.created_at,
    }));
  });

export const submitArticleComment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      articleId: z.string().uuid(),
      contentText: z.string().min(3).max(1000),
    }),
  )
  .handler(async ({ data: { articleId, contentText } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Você precisa estar autenticado para comentar.");
    }

    const { data, error } = await supabase
      .from("news_comments")
      .insert({
        article_id: articleId,
        user_id: identity.id,
        profile_id: identity.id,
        content_text: contentText.trim(),
        status: "active",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, comment: data };
  });

export const toggleArticleLike = createServerFn({ method: "POST" })
  .validator(z.object({ articleId: z.string().uuid() }))
  .handler(async ({ data: { articleId } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Faça login para curtir esta matéria.");
    }

    const { data: existing } = await supabase
      .from("news_likes")
      .select("article_id")
      .eq("article_id", articleId)
      .eq("user_id", identity.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("news_likes")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", identity.id);
      return { liked: false };
    } else {
      await supabase
        .from("news_likes")
        .insert({ article_id: articleId, user_id: identity.id });
      return { liked: true };
    }
  });

export const getArticleLikeStatus = createServerFn({ method: "GET" })
  .validator(z.object({ articleId: z.string().uuid() }))
  .handler(async ({ data: { articleId } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity.id) return { liked: false, totalLikes: 0 };

    const [userLikeRes, countRes] = await Promise.all([
      supabase
        .from("news_likes")
        .select("article_id")
        .eq("article_id", articleId)
        .eq("user_id", identity.id)
        .maybeSingle(),
      supabase
        .from("news_likes")
        .select("user_id", { count: "exact", head: true })
        .eq("article_id", articleId),
    ]);

    return {
      liked: !!userLikeRes.data,
      totalLikes: countRes.count || 0,
    };
  });
