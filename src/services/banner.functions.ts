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
  | "empregos"
  | "turismo"
  | "classificados"
  | "classifieds"
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
  | "all"
  | "ofertas"
  | "store";


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
    badge_text: "Comunidade Wider",
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
    badge_text: "Redação Wider",
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

  // ── VAGAS & EMPREGOS ──
  {
    id: "e0000000-0000-0000-0000-000000000051",
    title: "Encontre Seu Próximo Desafio Profissional",
    subtitle: "Vagas abertas em grandes empresas, startups, indústrias e comércio da região.",
    badge_text: "Carreiras & Vagas",
    media_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/empregos",
    cta_label: "Explorar Vagas",
    placement: "empregos",
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
    id: "e0000000-0000-0000-0000-000000000052",
    title: "Oportunidades em Tecnologia & Home Office",
    subtitle: "Desenvolvimento de software, dados, produto e design com flexibilidade e benefícios.",
    badge_text: "Tech & Remoto",
    media_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/empregos?categoria=tech",
    cta_label: "Vagas Tech",
    placement: "empregos",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
  // ── GASTRONOMIA & RESTAURANTES ──
  {
    id: "e0000000-0000-0000-0000-000000000061",
    title: "Festival Gastronômico & Burgers Artesanais",
    subtitle: "Os melhores chefs e restaurantes da cidade com entrega rápida e exclusiva.",
    badge_text: "Alta Gastronomia",
    media_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/gastronomia?categoria=burgers",
    cta_label: "Fazer Pedido",
    placement: "gastronomia",
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
    id: "e0000000-0000-0000-0000-000000000062",
    title: "Pizzas Forno a Lenha & Massas Frescas",
    subtitle: "Receitas tradicionais italianas preparadas na hora com ingredientes selecionados.",
    badge_text: "Tradição Italiana",
    media_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/gastronomia?categoria=pizzas",
    cta_label: "Ver Cardápio",
    placement: "gastronomia",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 2,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── FARMÁCIA & SAÚDE ──
  {
    id: "e0000000-0000-0000-0000-000000000071",
    title: "Cuidados Diários, Saúde & Suplementação",
    subtitle: "Medicamentos, dermocosméticos e vitaminas com entrega expressa na sua porta.",
    badge_text: "Farmácia Digital",
    media_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/farmacia",
    cta_label: "Comprar Medicamentos",
    placement: "farmacia",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── BEBIDAS & ADEGA ──
  {
    id: "e0000000-0000-0000-0000-000000000081",
    title: "Cervejas Artesanais, Vinhos & Destilados",
    subtitle: "Seleção especial de rótulos premiados e cervejarias locais geladas para o seu momento.",
    badge_text: "Adega & Cervejaria",
    media_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/bebidas",
    cta_label: "Ver Bebidas Geladas",
    placement: "bebidas",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── AÇOUGUE & CARNES ──
  {
    id: "e0000000-0000-0000-0000-000000000091",
    title: "Cortes Nobres & Especialidades para Churrasco",
    subtitle: "Picanha, ancho, costela e linguiças artesanais com procedência e maciez garantida.",
    badge_text: "Boutique de Carnes",
    media_url: "https://images.unsplash.com/photo-1558030006-450675393462?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/acougue",
    cta_label: "Ver Cortes Especiais",
    placement: "acougue",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── MODA & VESTUÁRIO ──
  {
    id: "e0000000-0000-0000-0000-000000000101",
    title: "Nova Coleção de Estilo & Conforto",
    subtitle: "Roupas, calçados e acessórios das melhores boutiques e marcas autorais da região.",
    badge_text: "Moda Local",
    media_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/moda",
    cta_label: "Conferir Looks",
    placement: "moda",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── ELETRÔNICOS & TECH ──
  {
    id: "e0000000-0000-0000-0000-000000000111",
    title: "Smartphones, Informática & Acessórios",
    subtitle: "Tecnologia de ponta, fones bluetooth, computadores e gadgets com garantia local.",
    badge_text: "Tech & Inovação",
    media_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/eletronicos",
    cta_label: "Explorar Eletrônicos",
    placement: "eletronicos",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── PET SHOP ──
  {
    id: "e0000000-0000-0000-0000-000000000121",
    title: "Nutrição & Bem-Estar para o Seu Pet",
    subtitle: "Rações premium, petiscos saudáveis, brinquedos e cuidados veterinários dedicados.",
    badge_text: "Mundo Pet",
    media_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=85",
    media_type: "image",
    target_type: "category",
    target_url: "/pet",
    cta_label: "Ver Produtos Pet",
    placement: "pet",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── TURISMO & HOSPEDAGEM ──
  {
    id: "e0000000-0000-0000-0000-000000000131",
    title: "Roteiros Ecológicos & Pousadas Charmosas",
    subtitle: "Descubra trilhas, cachoeiras, chalés aconchegantes e a cultura acolhedora da região.",
    badge_text: "Turismo Regional",
    media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/turismo",
    cta_label: "Ver Destinos",
    placement: "turismo",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },

  // ── OFERTAS & PROMOÇÕES ──
  {
    id: "e0000000-0000-0000-0000-000000000141",
    title: "Ofertas Relâmpago & Super Descontos",
    subtitle: "Economize comprando em conjunto e aproveitando cupons exclusivos dos lojistas.",
    badge_text: "Economia Real",
    media_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=85",
    media_type: "image",
    target_type: "hotpage",
    target_url: "/ofertas",
    cta_label: "Ver Todas as Ofertas",
    placement: "ofertas",
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    is_active: true,
    sort_order: 1,
    show_title: false,
    show_description: false,
    show_overlay: false,
    show_badge: false,
    show_cta: false,
  },
];

export const BannerPlacementSchema = z.enum([
  "home",
  "mercado",
  "marketplace",
  "noticias",
  "agenda",
  "events",
  "diretorio",
  "empregos",
  "turismo",
  "classificados",
  "classifieds",
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
  "all" as const,
  "ofertas" as const,
  "store" as const,
]);

export const listActiveBanners = createServerFn({ method: "GET" })
  .validator(
    z.object({
      placement: BannerPlacementSchema.optional(),
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

    const active = (data || [])
      .map((b: any) => ({
        ...b,
        show_title: b.show_title === true,
        show_description: b.show_description === true,
        show_overlay: b.show_overlay === true,
        show_badge: b.show_badge === true,
        show_cta: b.show_cta === true,
      }))
      .filter((b) => !b.ends_at || b.ends_at > now) as BannerDTO[];

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
      placement: BannerPlacementSchema.default("home"),
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

export const updateBanner = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      subtitle: z.string().optional().nullable(),
      badge_text: z.string().optional().nullable(),
      media_url: z.string().url().optional(),
      media_type: z.enum(["image", "video", "gif"]).optional(),
      target_type: z
        .enum(["product", "category", "hotpage", "store", "external_url"])
        .optional(),
      target_id: z.string().optional().nullable(),
      target_url: z.string().optional().nullable(),
      cta_label: z.string().optional().nullable(),
      placement: BannerPlacementSchema.optional(),
      city_filter: z.string().optional().nullable(),
      starts_at: z.string().optional(),
      ends_at: z.string().optional().nullable(),
      is_active: z.boolean().optional(),
      sort_order: z.number().int().optional(),
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

    const { id, ...updates } = data;
    const { data: updated, error } = await supabase
      .from("banners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar banner: ${error.message}`);
    }
    return updated as BannerDTO;
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);
    const supabase = getServerClient();

    let query = supabase.from("banners").delete().eq("id", id);
    if (identity.store_id && identity.role !== "platform_admin" && identity.role !== "master") {
      query = query.eq("store_id", identity.store_id);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Falha ao excluir banner: ${error.message}`);
    }
    return { success: true };
  });

