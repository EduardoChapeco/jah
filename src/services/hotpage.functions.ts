import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAnonServerClient, getServerClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/server-access";

export type HotpageModule =
  | "home"
  | "mercado"
  | "marketplace"
  | "noticias"
  | "agenda"
  | "events"
  | "diretorio"
  | "turismo"
  | "empregos"
  | "classificados"
  | "mobilidade"
  | "gastronomia"
  | "moda"
  | "pet"
  | "livros"
  | "imoveis"
  | "limpeza"
  | "beleza"
  | "servicos"
  | "acougue"
  | "bebidas"
  | "farmacia"
  | "construcao"
  | "casa"
  | "eletronicos"
  | "doacoes"
  | "ofertas"
  | "all";

export const HotpageModuleSchema = z.enum([
  "home",
  "mercado",
  "marketplace",
  "noticias",
  "agenda",
  "events",
  "diretorio",
  "turismo",
  "empregos",
  "classificados",
  "mobilidade",
  "gastronomia",
  "moda",
  "pet",
  "livros",
  "imoveis",
  "limpeza",
  "beleza",
  "servicos",
  "acougue",
  "bebidas",
  "farmacia",
  "construcao",
  "casa",
  "eletronicos",
  "doacoes",
  "ofertas",
  "all",
]);

export type HotpageBgMediaType = "none" | "image" | "video" | "gif";
export type HotpageBgTexture = "none" | "noise" | "dots" | "grid" | "mesh" | "glass";

export type HotpageTemplateType = "turbo" | "hits" | "bogo" | "market" | "travel" | "services" | "custom";
export type HotpageRulePreset = "all" | "free_shipping" | "turbo_express" | "bogo" | "discount_only" | "top_rated" | "under_20" | "custom";

export interface HotpageDTO {
  id: string;
  slug: string;
  title: string;
  badge_label?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  icon_name?: string | null;
  icon_url?: string | null;
  custom_icon_url?: string | null;
  target_route?: string | null;
  bg_media_type?: HotpageBgMediaType | null;
  bg_media_url?: string | null;
  bg_color?: string | null;
  bg_overlay_opacity?: number | null;
  bg_texture?: HotpageBgTexture | null;
  filter_rules?: Record<string, any>;
  module?: HotpageModule;
  is_active: boolean;
  sort_order: number;
  show_title?: boolean;
  show_description?: boolean;
  show_overlay?: boolean;
  show_badge?: boolean;
  template_type?: HotpageTemplateType;
  rule_preset?: HotpageRulePreset;
  hero_stat_badge?: string | null;
  hero_secondary_badge?: string | null;
  hero_floating_render_url?: string | null;
  featured_rail_title?: string | null;
}

const SEED_HOTPAGES: HotpageDTO[] = [
  // ── HOME (Início) ──
  {
    id: "f0000000-0000-0000-0000-000000000001",
    slug: "ofertas",
    title: "Ofertas Relâmpago",
    target_route: "/ofertas",
    badge_label: "Até 40% OFF",
    description: "Descontos exclusivos por tempo limitado na sua região.",
    cover_image_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
    icon_name: "Flame",
    module: "home",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f0000000-0000-0000-0000-000000000002",
    slug: "gastronomia",
    title: "Gastronomia & Lanches",
    badge_label: "Sabor Local",
    description: "Burgers, pizzas, cafés especiais, sobremesas e pratos autorais.",
    cover_image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    icon_name: "Utensils",
    module: "home",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f0000000-0000-0000-0000-000000000003",
    slug: "mercado",
    title: "Mercado & Hortifruti",
    badge_label: "Produtor Direto",
    description: "Alimentos frescos, mercearia fina e produtos da colônia.",
    cover_image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    icon_name: "Store",
    module: "home",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f0000000-0000-0000-0000-000000000004",
    slug: "beleza",
    title: "Beleza & Bem-Estar",
    badge_label: "Cuidados",
    description: "Barbearias, salões de beleza, massoterapia e estética.",
    cover_image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80",
    icon_name: "Scissors",
    module: "home",
    is_active: true,
    sort_order: 4,
  },
  {
    id: "f0000000-0000-0000-0000-000000000005",
    slug: "empregos",
    title: "Vagas & Oportunidades",
    badge_label: "Contratação",
    description: "Empregos locais, freelas e oportunidades no comércio.",
    cover_image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    icon_name: "Briefcase",
    module: "home",
    is_active: true,
    sort_order: 5,
  },
  {
    id: "f0000000-0000-0000-0000-000000000006",
    slug: "viagens",
    title: "Viagens & Passeios",
    badge_label: "Turismo Regional",
    description: "Passeios rurais, ecoturismo, cabanas e estadias na região.",
    cover_image_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
    icon_name: "Compass",
    module: "home",
    is_active: true,
    sort_order: 6,
  },

  // ── MERCADO / MARKETPLACE ──
  {
    id: "f0000000-0000-0000-0000-000000000011",
    slug: "hortifruti",
    title: "Hortifruti & Feira",
    badge_label: "Colheita do Dia",
    description: "Frutas, verduras e legumes orgânicos selecionados.",
    cover_image_url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80",
    icon_name: "Apple",
    module: "mercado",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f0000000-0000-0000-0000-000000000012",
    slug: "padaria",
    title: "Padaria & Confeitaria",
    badge_label: "Fornos Coloniais",
    description: "Pães quentinhos, bolos caseiros e folhados artesanais.",
    cover_image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    icon_name: "Coffee",
    module: "mercado",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f0000000-0000-0000-0000-000000000013",
    slug: "carnes",
    title: "Carnes & Açougue",
    badge_label: "Cortes Nobres",
    description: "Cortes para churrasco, carnes nobres e embutidos artesanais.",
    cover_image_url: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80",
    icon_name: "Flame",
    module: "mercado",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f0000000-0000-0000-0000-000000000014",
    slug: "bebidas",
    title: "Bebidas & Adega",
    badge_label: "Vinhos & Cervejas",
    description: "Cervejarias locais, sucos naturais e vinhos coloniais.",
    cover_image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    icon_name: "Wine",
    module: "mercado",
    is_active: true,
    sort_order: 4,
  },
  {
    id: "f0000000-0000-0000-0000-000000000015",
    slug: "laticinios",
    title: "Laticínios & Queijos",
    badge_label: "Colonial",
    description: "Queijos artesanais, iogurtes, leite fresco e derivados.",
    cover_image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80",
    icon_name: "Package",
    module: "mercado",
    is_active: true,
    sort_order: 5,
  },

  // ── NOTÍCIAS (Portal & Editorial) ──
  {
    id: "f0000000-0000-0000-0000-000000000021",
    slug: "politica",
    title: "Política & Cidade",
    badge_label: "Poder Público",
    description: "Decisões municipais, obras públicas e projetos de lei.",
    cover_image_url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80",
    icon_name: "Landmark",
    module: "noticias",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f0000000-0000-0000-0000-000000000022",
    slug: "cultura",
    title: "Cultura & Arte",
    badge_label: "Cena Autoral",
    description: "Música, teatro, tradições locais e manifestações culturais.",
    cover_image_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80",
    icon_name: "Sparkles",
    module: "noticias",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f0000000-0000-0000-0000-000000000023",
    slug: "economia",
    title: "Economia & Negócios",
    badge_label: "Mercado Regional",
    description: "Comércio, agronegócio, empreendedorismo e novos negócios.",
    cover_image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&q=80",
    icon_name: "TrendingUp",
    module: "noticias",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f0000000-0000-0000-0000-000000000024",
    slug: "esportes",
    title: "Esportes & Lazer",
    badge_label: "Competições",
    description: "Campeonatos regionais, corridas de rua e atletas locais.",
    cover_image_url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&q=80",
    icon_name: "Trophy",
    module: "noticias",
    is_active: true,
    sort_order: 4,
  },
  {
    id: "f0000000-0000-0000-0000-000000000025",
    slug: "opiniao",
    title: "Opinião & Colunas",
    badge_label: "Vozes da Cidade",
    description: "Ensaios, editoriais e colunas semanais de articulistas convidados.",
    cover_image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
    icon_name: "BookOpen",
    module: "noticias",
    is_active: true,
    sort_order: 5,
  },

  // ── AGENDA & EVENTOS ──
  {
    id: "f0000000-0000-0000-0000-000000000031",
    slug: "shows",
    title: "Shows & Festivais",
    badge_label: "Ao Vivo",
    description: "Bandas autorais, tributos e grandes apresentações.",
    cover_image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    icon_name: "Music",
    module: "agenda",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f0000000-0000-0000-0000-000000000032",
    slug: "gastronomico",
    title: "Festivais Gastronômicos",
    badge_label: "Degustação",
    description: "Circuitos de hambúrguer, feiras de cerveja artesanal e jantares.",
    cover_image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    icon_name: "Utensils",
    module: "agenda",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f0000000-0000-0000-0000-000000000033",
    slug: "feiras",
    title: "Feiras Comunitárias",
    badge_label: "Praça & Rua",
    description: "Feiras livres de artesanato, trocas e antiguidades.",
    cover_image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80",
    icon_name: "ShoppingBag",
    module: "agenda",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f0000000-0000-0000-0000-000000000034",
    slug: "workshops",
    title: "Cursos & Workshops",
    badge_label: "Capacitação",
    description: "Aulas práticas, palestras e rodadas de negócios.",
    cover_image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
    icon_name: "GraduationCap",
    module: "agenda",
    is_active: true,
    sort_order: 4,
  },

  // ── DIRETÓRIO DE SERVIÇOS ──
  {
    id: "f0000000-0000-0000-0000-000000000041",
    slug: "saude",
    title: "Saúde & Consultórios",
    badge_label: "Cuidados",
    description: "Médicos, dentistas, psicólogos e fisioterapeutas.",
    cover_image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80",
    icon_name: "Heart",
    module: "diretorio",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f0000000-0000-0000-0000-000000000042",
    slug: "construcao",
    title: "Reformas & Obras",
    badge_label: "Casa & Construção",
    description: "Eletricistas, pedreiros, encanadores, gesso e pintura.",
    cover_image_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
    icon_name: "Hammer",
    module: "diretorio",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f0000000-0000-0000-0000-000000000043",
    slug: "automotivo",
    title: "Auto & Mecânica",
    badge_label: "Veículos",
    description: "Oficinas mecânicas, autoelétricas, guincho e lavagem.",
    cover_image_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80",
    icon_name: "Car",
    module: "diretorio",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f0000000-0000-0000-0000-000000000044",
    slug: "pet",
    title: "Pet & Veterinária",
    badge_label: "Amigos de 4 Patas",
    description: "Clínicas veterinárias, banho e tosa, rações e adestramento.",
    cover_image_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&q=80",
    icon_name: "Dog",
    module: "diretorio",
    is_active: true,
    sort_order: 4,
  },

  // ── VAGAS & EMPREGOS ──
  {
    id: "f0000000-0000-0000-0000-000000000051",
    slug: "tech",
    title: "TI & Programação",
    badge_label: "Tech & Dados",
    description: "Desenvolvedores, analistas de sistemas, suporte e produto.",
    cover_image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80",
    icon_name: "Laptop",
    module: "empregos",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f0000000-0000-0000-0000-000000000052",
    slug: "comercio",
    title: "Comércio & Vendas",
    badge_label: "Vendas B2B & Balcão",
    description: "Vendedores, consultores comerciais, caixas e atendimento.",
    cover_image_url: "https://images.unsplash.com/photo-1556742049-0a67e55722c0?w=600&q=80",
    icon_name: "Storefront",
    module: "empregos",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f0000000-0000-0000-0000-000000000053",
    slug: "saude",
    title: "Saúde & Clínicas",
    badge_label: "Enfermagem & Farmácia",
    description: "Enfermeiros, técnicos, secretárias de consultório e farmácia.",
    cover_image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    icon_name: "Heartbeat",
    module: "empregos",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f0000000-0000-0000-0000-000000000054",
    slug: "estagio",
    title: "Estágios & Trainee",
    badge_label: "Universitários",
    description: "Oportunidades de início de carreira para estudantes.",
    cover_image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80",
    icon_name: "GraduationCap",
    module: "empregos",
    is_active: true,
    sort_order: 4,
  },
  {
    id: "f0000000-0000-0000-0000-000000000055",
    slug: "operacional",
    title: "Indústria & Frota",
    badge_label: "Logística",
    description: "Motoristas, estoquistas, produção industrial e manutenção.",
    cover_image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
    icon_name: "Truck",
    module: "empregos",
    is_active: true,
    sort_order: 5,
  },
];

export const listHotpages = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        module: HotpageModuleSchema.optional(),
      })
      .optional(),
  )
  .handler(async ({ data }): Promise<HotpageDTO[]> => {
    const supabase = getAnonServerClient();
    const reqModule = data?.module;
    const normalizedModule =
      reqModule === "marketplace" ? "mercado" : reqModule === "events" ? "agenda" : reqModule;

    let query = supabase
      .from("hotpages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (normalizedModule && normalizedModule !== "all") {
      query = query.or(
        `module.eq.${normalizedModule},module.eq.${reqModule},module.eq.home,module.eq.all,module.is.null`,
      );
    }

    const { data: records, error } = await query;
    if (error || !records || records.length === 0) {
      const filtered = SEED_HOTPAGES.filter((h) => {
        if (!normalizedModule || normalizedModule === "all") return true;
        return (
          h.module === normalizedModule ||
          h.module === reqModule ||
          h.module === "home" ||
          h.module === "all" ||
          !h.module
        );
      });
      return filtered.length > 0 ? filtered : SEED_HOTPAGES.slice(0, 8);
    }

    return (records || []).map((h: any) => ({
      ...h,
      show_title: h.show_title !== false,
      show_description: h.show_description !== false,
      show_overlay: h.show_overlay !== false,
      show_badge: h.show_badge !== false,
    })) as HotpageDTO[];
  });

export const listActiveHotpages = listHotpages;

export const getHotpageBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: { slug } }): Promise<HotpageDTO | null> => {
    const supabase = getAnonServerClient();
    const { data, error } = await supabase
      .from("hotpages")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return SEED_HOTPAGES.find((h) => h.slug === slug) || null;
    }

    return {
      ...data,
      show_title: data.show_title !== false,
      show_description: data.show_description !== false,
      show_overlay: data.show_overlay !== false,
      show_badge: data.show_badge !== false,
    } as HotpageDTO;
  });

export const saveUserPreferences = createServerFn({ method: "POST" })
  .validator(
    z.object({
      selected_niches: z.array(z.string()),
      default_city: z.string().optional(),
      onboarding_done: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const { getCurrentIdentity } = await import("@/services/cart-helpers");
    const identity = await getCurrentIdentity().catch(() => null);
    const userId = identity?.customer_id || null;

    if (userId) {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          selected_niches: data.selected_niches,
          default_city: data.default_city || "Chapecó - SC",
          onboarding_done: data.onboarding_done,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("[PREFERENCES] Falha ao salvar preferências no Supabase:", error);
      }
    }

    // 2. Alimenta o motor de afinidade preditiva para os nichos selecionados
    for (const niche of data.selected_niches) {
      if (niche !== "all") {
        try {
          await supabase.rpc("record_user_behavior_event", {
            p_user_id: userId,
            p_session_id: userId ? null : "anon_session",
            p_event_type: "search",
            p_entity_type: "product",
            p_entity_id: null,
            p_category_slug: niche,
            p_niche: niche,
            p_metadata: { source: "onboarding_picker", weight_boost: 10 },
          });
        } catch {
          // rpc telemetry optional
        }
      }
    }

    return { success: true };
  });

export const getUserPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    selected_niches: string[];
    default_city: string;
    onboarding_done: boolean;
  } | null> => {
    const supabase = getServerClient();
    const { getCurrentIdentity } = await import("@/services/cart-helpers");
    const identity = await getCurrentIdentity().catch(() => null);
    const userId = identity?.customer_id || null;

    if (!userId) return null;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      selected_niches: data.selected_niches || [],
      default_city: data.default_city || "Chapecó - SC",
      onboarding_done: !!data.onboarding_done,
    };
  },
);

export const createHotpage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      slug: z.string().min(2),
      title: z.string().min(2),
      badge_label: z.string().optional(),
      description: z.string().optional(),
      cover_image_url: z.string().url().optional(),
      icon_name: z.string().optional(),
      icon_url: z.string().optional(),
      custom_icon_url: z.string().optional(),
      target_route: z.string().optional(),
      bg_media_type: z.enum(["none", "image", "video", "gif"]).default("none"),
      bg_media_url: z.string().optional(),
      bg_color: z.string().optional(),
      bg_overlay_opacity: z.number().min(0).max(100).default(30),
      bg_texture: z.enum(["none", "noise", "dots", "grid", "mesh", "glass"]).default("none"),
      filter_rules: z.record(z.any()).optional(),
      module: HotpageModuleSchema.default("home"),
      sort_order: z.number().int().default(0),
      show_title: z.boolean().default(true),
      show_description: z.boolean().default(true),
      show_overlay: z.boolean().default(true),
      show_badge: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const { data: created, error } = await supabase
      .from("hotpages")
      .insert({
        slug: data.slug,
        title: data.title,
        badge_label: data.badge_label || null,
        description: data.description || null,
        cover_image_url: data.cover_image_url || null,
        icon_name: data.icon_name || null,
        icon_url: data.icon_url || data.custom_icon_url || null,
        custom_icon_url: data.custom_icon_url || data.icon_url || null,
        target_route: data.target_route || null,
        bg_media_type: data.bg_media_type || "none",
        bg_media_url: data.bg_media_url || null,
        bg_color: data.bg_color || null,
        bg_overlay_opacity: data.bg_overlay_opacity ?? 30,
        bg_texture: data.bg_texture || "none",
        filter_rules: data.filter_rules || {},
        module: data.module || "home",
        sort_order: data.sort_order,
        show_title: data.show_title,
        show_description: data.show_description,
        show_overlay: data.show_overlay,
        show_badge: data.show_badge,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as HotpageDTO;
  });

export const updateHotpage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      slug: z.string().min(2).optional(),
      title: z.string().min(2).optional(),
      badge_label: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      cover_image_url: z.string().nullable().optional(),
      icon_name: z.string().nullable().optional(),
      icon_url: z.string().nullable().optional(),
      custom_icon_url: z.string().nullable().optional(),
      target_route: z.string().nullable().optional(),
      bg_media_type: z.enum(["none", "image", "video", "gif"]).optional(),
      bg_media_url: z.string().nullable().optional(),
      bg_color: z.string().nullable().optional(),
      bg_overlay_opacity: z.number().min(0).max(100).optional(),
      bg_texture: z.enum(["none", "noise", "dots", "grid", "mesh", "glass"]).optional(),
      filter_rules: z.record(z.any()).nullable().optional(),
      module: HotpageModuleSchema.optional(),
      sort_order: z.number().int().optional(),
      show_title: z.boolean().optional(),
      show_description: z.boolean().optional(),
      show_overlay: z.boolean().optional(),
      show_badge: z.boolean().optional(),
      is_active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data: { id, ...patch } }) => {
    const supabase = getServerClient();
    const { data: updated, error } = await supabase
      .from("hotpages")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as HotpageDTO;
  });

export const deleteHotpage = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const supabase = getServerClient();
    const { error } = await supabase.from("hotpages").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const saveHotpage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(2),
      title: z.string().min(2),
      badge_label: z.string().optional(),
      description: z.string().optional(),
      cover_image_url: z.string().optional(),
      icon_name: z.string().optional(),
      icon_url: z.string().optional(),
      custom_icon_url: z.string().optional(),
      target_route: z.string().optional(),
      bg_media_type: z.enum(["none", "image", "video", "gif"]).optional(),
      bg_media_url: z.string().optional(),
      bg_color: z.string().optional(),
      bg_overlay_opacity: z.number().min(0).max(100).optional(),
      bg_texture: z.enum(["none", "noise", "dots", "grid", "mesh", "glass"]).optional(),
      filter_rules: z.record(z.any()).optional(),
      module: HotpageModuleSchema.optional(),
      sort_order: z.number().int().default(0),
      show_title: z.boolean().default(true),
      show_description: z.boolean().default(true),
      show_overlay: z.boolean().default(true),
      show_badge: z.boolean().default(true),
      is_active: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    if (data.id) {
      return updateHotpage({ data: { id: data.id, ...data } });
    } else {
      return createHotpage({ data: { ...data, sort_order: data.sort_order ?? 0 } });
    }
  });
