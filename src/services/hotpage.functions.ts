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
  | "all";

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
  filter_rules?: Record<string, any>;
  module?: HotpageModule;
  is_active: boolean;
  sort_order: number;
  show_title?: boolean;
  show_description?: boolean;
  show_overlay?: boolean;
  show_badge?: boolean;
}

const SEED_HOTPAGES: HotpageDTO[] = [
  // ── HOME (Início) ──
  {
    id: "f0000000-0000-0000-0000-000000000001",
    slug: "ofertas",
    title: "Ofertas Relâmpago",
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
];

export const listHotpages = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        module: z
          .enum([
            "home",
            "mercado",
            "marketplace",
            "noticias",
            "agenda",
            "events",
            "diretorio",
            "all",
          ])
          .optional(),
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
      .order("sort_order", { ascending: true });

    if (normalizedModule && normalizedModule !== "all") {
      query = query.or(`module.eq.${normalizedModule},module.eq.all,module.is.null`);
    }

    const { data: dbData, error } = await query;

    if (error || !dbData || dbData.length === 0) {
      const filtered = SEED_HOTPAGES.filter((h) => {
        if (!normalizedModule || normalizedModule === "all") return h.module === "home" || !h.module;
        return h.module === normalizedModule || h.module === reqModule || h.module === "all";
      });
      return filtered.length > 0
        ? filtered
        : SEED_HOTPAGES.filter((h) => h.module === "home");
    }

    return dbData as HotpageDTO[];
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
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as HotpageDTO;
  });

export const saveUserPreferences = createServerFn({ method: "POST" })
  .validator(
    z.object({
      selected_niches: z.array(z.string()),
      default_city: z.string().optional(),
      default_lat: z.number().optional(),
      default_lng: z.number().optional(),
      onboarding_done: z.boolean().default(true),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, guest: true };
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      selected_niches: data.selected_niches,
      default_city: data.default_city,
      default_lat: data.default_lat,
      default_lng: data.default_lng,
      onboarding_done: data.onboarding_done,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[PREFERENCES] Failed to save user preferences:", error);
    }

    return { success: !error };
  });

export const getUserPreferences = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    selected_niches: string[];
    default_city: string;
    onboarding_done: boolean;
  } | null> => {
    const supabase = getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return {
      selected_niches: data.selected_niches || [],
      default_city: data.default_city || "Chapecó - SC",
      onboarding_done: data.onboarding_done || false,
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
      module: z
        .enum([
          "home",
          "mercado",
          "marketplace",
          "noticias",
          "agenda",
          "events",
          "diretorio",
          "all",
        ])
        .default("home"),
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
      module: z
        .enum([
          "home",
          "mercado",
          "marketplace",
          "noticias",
          "agenda",
          "events",
          "diretorio",
          "all",
        ])
        .optional(),
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
