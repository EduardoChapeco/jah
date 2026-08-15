import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export type BannerPlacement =
  | "home"
  | "mercado"
  | "marketplace"
  | "noticias"
  | "agenda"
  | "events"
  | "diretorio"
  | "classifieds"
  | "all";

export interface BannerDTO {
  id: string;
  store_id?: string | null;
  title: string;
  subtitle?: string | null;
  badge_text?: string | null;
  media_url: string;
  media_type: "image" | "video" | "gif";
  target_type: "product" | "category" | "hotpage" | "store" | "external_url";
  target_id?: string | null;
  target_url?: string | null;
  cta_label?: string | null;
  placement: BannerPlacement;
  city_filter?: string | null;
  starts_at: string;
  ends_at?: string | null;
  is_active: boolean;
  sort_order: number;
  show_title?: boolean;
  show_description?: boolean;
  show_overlay?: boolean;
  show_badge?: boolean;
  show_cta?: boolean;
}

const SEED_BANNERS: BannerDTO[] = [
  // ── HOME (Início) ──
  {
    id: "e0000000-0000-0000-0000-000000000001",
    title: "Descubra o Melhor da Sua Região",
    subtitle: "Comércio local, gastronomia autoral, notícias em tempo real e eventos em um só lugar.",
    badge_text: "Comunidade JAH",
    media_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/mercado",
    cta_label: "Explorar Cidade",
    placement: "home",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    title: "Apoie os Produtores da Sua Cidade",
    subtitle: "Compre direto de quem faz e fortaleça a economia da nossa comunidade.",
    badge_text: "Feito Local",
    media_url: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/mercado",
    cta_label: "Ver Lojas",
    placement: "home",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── MERCADO / MARKETPLACE ──
  {
    id: "e0000000-0000-0000-0000-000000000011",
    title: "Hortifruti & Feira do Produtor",
    subtitle: "Colheita fresca entregue diretamente na sua casa com seleção rigorosa de qualidade.",
    badge_text: "Frescor Diário",
    media_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/mercado?categoria=hortifruti",
    cta_label: "Ver Ofertas da Feira",
    placement: "mercado",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
  {
    id: "e0000000-0000-0000-0000-000000000012",
    title: "Padarias Artesanais & Cafés Especiais",
    subtitle: "Pães de fermentação natural, doces artesanais e grãos selecionados da região.",
    badge_text: "Artesanal",
    media_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/mercado?categoria=padaria",
    cta_label: "Explorar Padarias",
    placement: "mercado",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── NOTÍCIAS (Portal & Jornalismo) ──
  {
    id: "e0000000-0000-0000-0000-000000000021",
    title: "Jornalismo Comunitário & Notícias em Tempo Real",
    subtitle: "Cobertura das decisões municipais, cultura regional, esporte e reportagens especiais.",
    badge_text: "Redação JAH",
    media_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/noticias",
    cta_label: "Ler Últimas Notícias",
    placement: "noticias",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
  {
    id: "e0000000-0000-0000-0000-000000000022",
    title: "Vozes da Cidade: Opinião & Colunistas",
    subtitle: "Artigos e análises semanais sobre os rumos econômicos e culturais do nosso município.",
    badge_text: "Artigos & Opinião",
    media_url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/noticias?categoria=opiniao",
    cta_label: "Ver Colunas",
    placement: "noticias",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── AGENDA & EVENTOS ──
  {
    id: "e0000000-0000-0000-0000-000000000031",
    title: "Festival de Inverno & Shows Autoriais",
    subtitle: "Confira a programação completa de atrações musicais, feiras ao ar livre e gastronomia.",
    badge_text: "Fim de Semana",
    media_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/agenda",
    cta_label: "Ver Programação",
    placement: "agenda",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
  {
    id: "e0000000-0000-0000-0000-000000000032",
    title: "Feira de Artesanato & Produtores Coloniais",
    subtitle: "Todo domingo na praça central: produtos artesanais, exposições e música ao vivo.",
    badge_text: "Entrada Franca",
    media_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/agenda",
    cta_label: "Salvar na Agenda",
    placement: "agenda",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── DIRETÓRIO DE SERVIÇOS ──
  {
    id: "e0000000-0000-0000-0000-000000000041",
    title: "Guia Oficial de Serviços & Profissionais",
    subtitle: "Encontre especialistas recomendados e avaliados pela comunidade local.",
    badge_text: "Profissionais Verificados",
    media_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/diretorio",
    cta_label: "Buscar Serviços",
    placement: "diretorio",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
  {
    id: "e0000000-0000-0000-0000-000000000042",
    title: "Saúde, Bem-Estar & Cuidados Pessoais",
    subtitle: "Clínicas, consultórios, estética e terapias integrativas perto de você.",
    badge_text: "Saúde & Estética",
    media_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/diretorio?niche=saude",
    cta_label: "Ver Especialistas",
    placement: "diretorio",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
];

export const listActiveBanners = createServerFn({ method: "GET" })
  .validator(
    z.object({
      placement: z
        .enum([
          "home",
          "mercado",
          "marketplace",
          "noticias",
          "agenda",
          "events",
          "diretorio",
          "classifieds",
          "all",
        ])
        .optional(),
      city: z.string().optional(),
    }),
  )
  .handler(async ({ data: { placement, city } }): Promise<BannerDTO[]> => {
    const supabase = getAnonServerClient();
    const now = new Date().toISOString();

    const normalizedPlacement =
      placement === "marketplace" ? "mercado" : placement === "events" ? "agenda" : placement;

    let query = supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (normalizedPlacement && normalizedPlacement !== "all") {
      query = query.or(
        `placement.eq.${normalizedPlacement},placement.eq.${placement},placement.eq.all`,
      );
    }

    if (city) {
      query = query.or(`city_filter.eq.${city},city_filter.is.null`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Retorna banners curados seed contextuais caso o DB ainda não tenha banners
      const filtered = SEED_BANNERS.filter((b) => {
        if (!normalizedPlacement || normalizedPlacement === "all") return true;
        return (
          b.placement === normalizedPlacement ||
          b.placement === placement ||
          b.placement === "all"
        );
      });
      return filtered.length > 0 ? filtered : SEED_BANNERS.slice(0, 2);
    }

    const active = (data || []).filter((b) => !b.ends_at || b.ends_at > now) as BannerDTO[];
    if (active.length === 0) {
      return SEED_BANNERS.filter(
        (b) =>
          !normalizedPlacement ||
          normalizedPlacement === "all" ||
          b.placement === normalizedPlacement ||
          b.placement === placement ||
          b.placement === "all",
      );
    }
    return active;
  });

export const createBanner = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      badge_text: z.string().optional(),
      media_url: z.string().url(),
      media_type: z.enum(["image", "video", "gif"]).default("image"),
      target_type: z
        .enum(["product", "category", "hotpage", "store", "external_url"])
        .default("hotpage"),
      target_id: z.string().optional(),
      target_url: z.string().optional(),
      cta_label: z.string().optional(),
      placement: z
        .enum([
          "home",
          "mercado",
          "marketplace",
          "noticias",
          "agenda",
          "events",
          "diretorio",
          "classifieds",
          "all",
        ])
        .default("home"),
      city_filter: z.string().optional(),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
      is_active: z.boolean().optional(),
      sort_order: z.number().int().default(0),
      show_title: z.boolean().optional(),
      show_description: z.boolean().optional(),
      show_overlay: z.boolean().optional(),
      show_badge: z.boolean().optional(),
      show_cta: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);
    const supabase = getServerClient();

    const { data: banner, error } = await supabase
      .from("banners")
      .insert({
        ...data,
        store_id: identity.store_id || null,
        starts_at: data.starts_at || new Date().toISOString(),
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar banner: ${error.message}`);
    }

    return banner as BannerDTO;
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);
    const supabase = getServerClient();

    let query = supabase.from("banners").delete().eq("id", id);
    if (identity.store_id) {
      query = query.eq("store_id", identity.store_id);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Falha ao excluir banner: ${error.message}`);
    }
    return { success: true };
  });
