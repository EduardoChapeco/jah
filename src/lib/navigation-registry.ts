import {
  Home,
  MapPin,
  ShoppingBag,
  Tag,
  Calendar,
  Compass,
  User,
  LayoutDashboard,
  Bookmark,
  Handshake,
  Package,
  MessageSquare,
  Coins,
  Gift,
  CreditCard,
  RefreshCcw,
  Sparkles,
  Flame,
  Clock,
  Heart,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Layers,
  Utensils,
  Music,
  Shirt,
  HelpCircle,
  ShieldCheck,
  Building,
  Car,
  Truck,
  Mountain,
  Laptop,
  Briefcase,
} from "lucide-react";

export type ContentWidthMode =
  "social-feed" | "catalog" | "reading" | "workspace" | "full" | "media-detail";

export interface NavigationItem {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
  badge?: string | number;
  description?: string;
}

export interface NavigationGroup {
  id: string;
  title?: string;
  items: NavigationItem[];
}

export interface ContextAction {
  label: string;
  type: "dialog" | "navigate";
  to?: string;
  dialogType?: "publish_post" | "new_classified" | "new_event" | "new_product";
  icon?: any;
}

export interface ContextConfig {
  moduleId: string;
  title: string;
  subtitle?: string;
  groups: NavigationGroup[];
  action?: ContextAction;
  widthMode: ContentWidthMode;
  showContextSidebar: boolean;
}

/**
 * ─── Destinos Globais da Global Rail ─────────────────────────────────────────
 */
export const GLOBAL_DESTINATIONS: NavigationItem[] = [
  { to: "/", label: "Mural", icon: Home, exact: true },
  { to: "/mapa", label: "Mapa", icon: MapPin },
  { to: "/mercado", label: "Mercado", icon: ShoppingBag },
  { to: "/mobilidade", label: "Mobilidade & Fretes", icon: Car },
  { to: "/agenda", label: "Eventos", icon: Calendar },
  { to: "/diretorio", label: "Diretório", icon: Compass },
];

/**
 * ─── Grupos de Navegação da Área Pessoal ─────────────────────────────────────
 */
export const PERSONAL_NAV_GROUPS: NavigationGroup[] = [
  {
    id: "overview",
    title: "Minha Conta",
    items: [
      { to: "/conta", label: "Visão Geral", icon: User, exact: true },
      { to: "/conta/perfil", label: "Meu Perfil", icon: User },
      { to: "/conta/salvos", label: "Itens Salvos", icon: Bookmark },
    ],
  },
  {
    id: "social-p2p",
    title: "Negociações & Anúncios",
    items: [
      { to: "/conta/negociacoes", label: "Negociações P2P", icon: Handshake },
      { to: "/conta/classificados", label: "Meus Anúncios", icon: Tag },
      { to: "/conta/conversas", label: "Mensagens", icon: MessageSquare },
    ],
  },
  {
    id: "commerce",
    title: "Compras & Pagamentos",
    items: [
      { to: "/conta/pedidos", label: "Minhas Compras", icon: Package },
      { to: "/conta/mobilidade", label: "Corridas & Mudanças", icon: Car },
      { to: "/conta/pagamentos", label: "Pagamentos & Parcelas", icon: CreditCard },
      { to: "/conta/creditos", label: "Carteira & Créditos", icon: Coins },
      { to: "/conta/gift-cards", label: "Vales-Presente", icon: Gift },
      { to: "/conta/enderecos", label: "Endereços", icon: MapPin },
      { to: "/conta/trocas", label: "Trocas & Devoluções", icon: RefreshCcw },
    ],
  },
];

/**
 * ─── Grupos de Navegação do Mural / Feed ────────────────────────────────────
 */
export const FEED_NAV_GROUPS: NavigationGroup[] = [
  {
    id: "feed-discovery",
    title: "Descobrir",
    items: [
      { to: "/", label: "Para Você", icon: Sparkles, exact: true },
      { to: "/?tab=moments", label: "Moments da Rua", icon: Flame },
      { to: "/?tab=classifieds", label: "Classificados no Feed", icon: Tag },
      { to: "/conta/salvos", label: "Meus Salvos", icon: Bookmark },
    ],
  },
];

/**
 * ─── Grupos de Navegação do Mercado ─────────────────────────────────────────
 */
export const MARKET_NAV_GROUPS: NavigationGroup[] = [
  {
    id: "market-explore",
    title: "Explorar Mercado",
    items: [
      { to: "/mercado", label: "Todos os Produtos", icon: ShoppingBag, exact: true },
      { to: "/mercado?niche=ofertas", label: "Ofertas Relâmpago", icon: Flame },
      { to: "/mercado?sort=newest", label: "Novidades da Cidade", icon: Clock },
      { to: "/conta/salvos", label: "Lista de Desejos", icon: Heart },
    ],
  },
  {
    id: "market-niches",
    title: "Categorias & Serviços",
    items: [
      { to: "/mercado?niche=gastronomia", label: "Gastronomia & Lanches", icon: Utensils },
      { to: "/mercado?niche=mercado", label: "Mercado & Hortifruti", icon: Store },
      { to: "/mercado?niche=beleza", label: "Beleza & Barbearia", icon: Sparkles },
      { to: "/mercado?niche=empregos", label: "Vagas & Empregos", icon: Building },
      { to: "/mercado?niche=viagens", label: "Viagens & Passeios", icon: Compass },
      { to: "/mercado?niche=moda", label: "Moda & Estilo", icon: Shirt },
      { to: "/mercado?niche=arte", label: "Música & Arte", icon: Music },
      { to: "/mercado?niche=servicos", label: "Serviços Locais", icon: Layers },
    ],
  },
];

/**
 * ─── Grupos de Navegação de Eventos / Agenda ────────────────────────────────
 */
export const EVENTS_NAV_GROUPS: NavigationGroup[] = [
  {
    id: "events-explore",
    title: "Agenda Cultural",
    items: [
      { to: "/agenda", label: "Todos os Eventos", icon: Calendar, exact: true },
      { to: "/agenda?when=today", label: "Hoje", icon: Clock },
      { to: "/agenda?when=weekend", label: "Este Fim de Semana", icon: Sparkles },
      { to: "/conta/pedidos", label: "Meus Ingressos", icon: Package },
    ],
  },
];

/**
 * ─── Grupos de Navegação do Mapa ────────────────────────────────────────────
 */
export const MAP_NAV_GROUPS: NavigationGroup[] = [
  {
    id: "map-layers",
    title: "Camadas do Mapa",
    items: [
      { to: "/mapa", label: "Ver Tudo", icon: MapPin, exact: true },
      { to: "/mapa?type=moment", label: "Moments da Galera", icon: Flame },
      { to: "/mapa?type=store", label: "Lojas & Pontos", icon: Store },
      { to: "/mapa?type=event", label: "Eventos & Shows", icon: Calendar },
    ],
  },
];

/**
 * ─── Resolver Canônico de Contexto ──────────────────────────────────────────
 */
export function resolveContextNavigation(pathname: string, session?: any): ContextConfig {
  // 1. Área Pessoal
  if (pathname.startsWith("/conta")) {
    const isNewClassified = pathname.startsWith("/conta/classificados/novo");

    return {
      moduleId: "account",
      title: "Minha Área",
      subtitle: session?.email ? `@${session.email.split("@")[0]}` : undefined,
      groups: PERSONAL_NAV_GROUPS,
      action: {
        label: "Novo Anúncio",
        type: "navigate",
        to: "/conta/classificados/novo",
        icon: Plus,
      },
      widthMode: isNewClassified ? "reading" : "workspace",
      showContextSidebar: !isNewClassified,
    };
  }

  // 2. Mercado
  if (pathname.startsWith("/mercado")) {
    return {
      moduleId: "market",
      title: "Mercado JAH",
      subtitle: "Marcas autorais e produtos da comunidade",
      groups: MARKET_NAV_GROUPS,
      action: {
        label: "Anunciar Desapego",
        type: "navigate",
        to: "/conta/classificados/novo",
        icon: Plus,
      },
      widthMode: "catalog",
      showContextSidebar: true,
    };
  }

  // 2.5. Mobilidade & Fretes
  if (pathname.startsWith("/mobilidade")) {
    return {
      moduleId: "mobility",
      title: "Mobilidade & Fretes",
      subtitle: "Corridas, entregas flash e mudanças na cidade",
      groups: [
        {
          id: "mobility-services",
          title: "Serviços",
          items: [
            { to: "/mobilidade", label: "Chamar Agora", icon: Car, exact: true },
            { to: "/conta/mobilidade", label: "Minhas Corridas", icon: Clock },
            { to: "/workspace/pedidos/frota", label: "Central de Despacho", icon: Truck },
          ],
        },
      ],
      action: {
        label: "Novo Chamado",
        type: "navigate",
        to: "/mobilidade",
        icon: Plus,
      },
      widthMode: "reading",
      showContextSidebar: true,
    };
  }

  // 2.6. Turismo, Viagens & Lazer
  if (pathname.startsWith("/turismo") || pathname.startsWith("/viagens")) {
    return {
      moduleId: "tourism",
      title: "Turismo & Viagens",
      subtitle: "Passeios, ecoturismo, cabanas e gastronomia regional",
      groups: [
        {
          id: "tourism-categories",
          title: "Experiências",
          items: [
            { to: "/turismo", label: "Todos os Roteiros", icon: Compass, exact: true },
            { to: "/turismo?category=passeios", label: "Passeios & Catamarã", icon: Sparkles },
            { to: "/turismo?category=hospedagens", label: "Pousadas & Cabanas", icon: Building },
            { to: "/turismo?category=gastronomia_turistica", label: "Vinícolas & Sabores", icon: Utensils },
            { to: "/turismo?category=aventura", label: "Trilhas & Aventura", icon: Mountain },
          ],
        },
      ],
      action: {
        label: "Cadastrar Passeio",
        type: "navigate",
        to: "/workspace/agenda/servicos",
        icon: Plus,
      },
      widthMode: "catalog",
      showContextSidebar: true,
    };
  }

  // 2.7. Vagas & Empregos
  if (pathname.startsWith("/empregos") || pathname.startsWith("/vagas")) {
    return {
      moduleId: "jobs",
      title: "Vagas & Empregos",
      subtitle: "Oportunidades de trabalho e talentos locais",
      groups: [
        {
          id: "jobs-categories",
          title: "Carreiras",
          items: [
            { to: "/empregos", label: "Todas as Vagas", icon: Briefcase, exact: true },
            { to: "/empregos?category=clt", label: "Comércio & CLT", icon: Store },
            { to: "/empregos?category=tech", label: "Tech & Dev", icon: Laptop },
            { to: "/empregos?category=comercial", label: "Vendas & B2B", icon: Flame },
            { to: "/empregos?category=estagio", label: "Estágios", icon: User },
          ],
        },
      ],
      action: {
        label: "Publicar Vaga",
        type: "navigate",
        to: "/conta/classificados/novo",
        icon: Plus,
      },
      widthMode: "catalog",
      showContextSidebar: true,
    };
  }

  // 2.8. Classificados & Desapegos
  if (pathname.startsWith("/classificados")) {
    const isNew = pathname.startsWith("/classificados/novo");
    return {
      moduleId: "classifieds",
      title: "Classificados & Desapegos",
      subtitle: "Negociações diretas entre moradores da comunidade",
      groups: [
        {
          id: "classifieds-categories",
          title: "Categorias",
          items: [
            { to: "/classificados", label: "Todos os Anúncios", icon: Tag, exact: true },
            { to: "/classificados?category=vehicle", label: "Veículos & Autos", icon: Car },
            { to: "/classificados?category=real_estate", label: "Imóveis & Aluguel", icon: Home },
            { to: "/classificados?category=sale", label: "Desapegos & Tech", icon: Laptop },
          ],
        },
      ],
      action: {
        label: "Anunciar Grátis",
        type: "navigate",
        to: "/conta/classificados/novo",
        icon: Plus,
      },
      widthMode: isNew ? "reading" : "catalog",
      showContextSidebar: !isNew,
    };
  }

  // 3. Agenda / Eventos
  if (pathname.startsWith("/agenda") || pathname.startsWith("/evento")) {
    return {
      moduleId: "events",
      title: "Agenda & Eventos",
      subtitle: "Shows, feiras e encontros culturais",
      groups: EVENTS_NAV_GROUPS,
      action: {
        label: "Divulgar Evento",
        type: "navigate",
        to: "/workspace/eventos",
        icon: Plus,
      },
      widthMode: pathname.startsWith("/evento/") ? "media-detail" : "catalog",
      showContextSidebar: !pathname.startsWith("/evento/"),
    };
  }

  // 4. Mapa Urbano & Moments
  if (pathname.startsWith("/mapa")) {
    return {
      moduleId: "map",
      title: "Mapa Urbano",
      subtitle: "Explore a cena ao seu redor",
      groups: MAP_NAV_GROUPS,
      action: {
        label: "Novo Moment",
        type: "dialog",
        dialogType: "publish_post",
        icon: Plus,
      },
      widthMode: "full",
      showContextSidebar: false, // Mapa imersivo: sem sidebar contextual lateral
    };
  }

  // 5. Diretório
  if (pathname.startsWith("/diretorio") || pathname.startsWith("/membro")) {
    return {
      moduleId: "directory",
      title: "Diretório de Membros",
      subtitle: "Produtores, artistas e criadores",
      groups: [
        {
          id: "directory",
          items: [
            { to: "/diretorio", label: "Explorar Membros", icon: Compass },
            { to: "/conta/perfil", label: "Editar Meu Perfil", icon: User },
          ],
        },
      ],
      widthMode: "catalog",
      showContextSidebar: true,
    };
  }

  // 6. Produto / Classificado Detail
  if (pathname.startsWith("/produto/") || pathname.startsWith("/classificados/")) {
    return {
      moduleId: "item-detail",
      title: "Detalhes",
      groups: [],
      widthMode: "media-detail",
      showContextSidebar: false,
    };
  }

  // 7. Páginas institucionais / Termos / FAQ / Políticas
  if (
    pathname.startsWith("/termos") ||
    pathname.startsWith("/privacidade") ||
    pathname.startsWith("/trocas-e-devolucoes") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/politicas")
  ) {
    return {
      moduleId: "reading",
      title: "Institucional",
      groups: [
        {
          id: "institutional",
          items: [
            { to: "/termos", label: "Termos de Uso", icon: HelpCircle },
            { to: "/privacidade", label: "Privacidade e LGPD", icon: ShieldCheck },
            { to: "/trocas-e-devolucoes", label: "Trocas e Devoluções", icon: RefreshCcw },
            { to: "/faq", label: "Perguntas Frequentes", icon: HelpCircle },
          ],
        },
      ],
      widthMode: "reading",
      showContextSidebar: true,
    };
  }

  // 8. Padrão: Mural / Feed Social
  return {
    moduleId: "feed",
    title: "Mural da Comunidade",
    subtitle: "Publicações, novidades e moments da cidade",
    groups: FEED_NAV_GROUPS,
    action: {
      label: "Publicar",
      type: "dialog",
      dialogType: "publish_post",
      icon: Plus,
    },
    widthMode: "social-feed",
    showContextSidebar: true,
  };
}
