import {
  Package,
  Tags,
  Tag,
  Store,
  LayoutDashboard,
  Settings,
  Calendar,
  Users,
  ShoppingBag,
  Truck,
  Boxes,
  Banknote,
  FileText,
  LayoutTemplate,
  Link2,
  Image as ImageIcon,
  ClipboardList,
  ShieldAlert,
  Sparkles,
  Megaphone,
  Flame,
  Newspaper,
  Plus,
  Sliders,
  DollarSign,
  Ticket,
  ArrowRightLeft,
  Building2,
  ShieldCheck,
  UtensilsCrossed,
  Coins,
  Zap,
  MessageSquare,
  Scale,
  Wrench,
  MapPin,
  Star,
  Navigation,
  Briefcase,
  Plane,
  ShoppingCart,
  Eye,
  Receipt,
  AlertTriangle,
  ArrowDownUp,
  Clock,
  Car,
  Smartphone,
  Layers,
} from "lucide-react";

export type NavItem = {
  path: string;
  label: string;
  icon?: any;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
};

// ── DEFINIÇÃO DOS GRUPOS BASE DO SISTEMA ─────────────────────────────────────

const GROUP_OVERVIEW: NavGroup = {
  id: "overview",
  label: "Geral",
  icon: LayoutDashboard,
  items: [
    { path: "/workspace", label: "Visão Geral", icon: LayoutDashboard },
  ],
};

const GROUP_GASTRO_CATALOG: NavGroup = {
  id: "gastro-catalog",
  label: "Cardápio & Itens",
  icon: UtensilsCrossed,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Cardápio & Produtos", icon: Package },
    { path: "/workspace/catalogo/categorias", label: "Categorias do Menu", icon: Tags },
    { path: "/workspace/catalogo/atributos", label: "Adicionais & Opcionais", icon: Boxes },
    { path: "/workspace/estoque", label: "Controle de Insumos", icon: Boxes },
  ],
};

const GROUP_GASTRO_ORDERS: NavGroup = {
  id: "gastro-orders",
  label: "Pedidos & Cozinha",
  icon: ClipboardList,
  items: [
    { path: "/workspace/pedidos/gestor", label: "Gestor de Pedidos (KDS)", icon: ClipboardList },
    { path: "/workspace/pedidos", label: "Histórico de Vendas", icon: ShoppingBag },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
    { path: "/workspace/pedidos/frota", label: "Entregadores & Despacho", icon: Truck },
    { path: "/workspace/clientes", label: "Clientes", icon: Users },
  ],
};

const GROUP_RETAIL_CATALOG: NavGroup = {
  id: "retail-catalog",
  label: "Catálogo & Estoque",
  icon: Package,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Produtos & Variações", icon: Package },
    { path: "/workspace/catalogo/categorias", label: "Categorias", icon: Tags },
    { path: "/workspace/catalogo/colecoes", label: "Coleções", icon: Sliders },
    { path: "/workspace/catalogo/atributos", label: "Grades (Cores/Tamanhos)", icon: Boxes },
    { path: "/workspace/estoque", label: "Estoque & Movimentos", icon: Boxes },
    { path: "/workspace/estoque/alertas", label: "Alertas de Reposição", icon: AlertTriangle },
  ],
};

const GROUP_RETAIL_SALES: NavGroup = {
  id: "retail-sales",
  label: "Vendas & Logística",
  icon: ShoppingBag,
  items: [
    { path: "/workspace/pedidos", label: "Todos os Pedidos", icon: ShoppingBag },
    { path: "/workspace/pedidos/gestor", label: "Gestor (Kanban)", icon: ClipboardList },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
    { path: "/workspace/pedidos/trocas", label: "Trocas & Devoluções", icon: ArrowRightLeft },
    { path: "/workspace/logistica/tabelas", label: "Fretes & Entregas", icon: Truck },
    { path: "/workspace/clientes", label: "Clientes / CRM", icon: Users },
    { path: "/workspace/orcamentos", label: "Orçamentos", icon: FileText },
  ],
};

const GROUP_SERVICES_AGENDA: NavGroup = {
  id: "services-agenda",
  label: "Agenda & Atendimentos",
  icon: Calendar,
  items: [
    { path: "/workspace/agenda", label: "Grade de Agendamentos", icon: Calendar },
    { path: "/workspace/agenda/recursos", label: "Profissionais & Salas", icon: Users },
    { path: "/workspace/pacotes", label: "Pacotes & Passes", icon: Ticket },
  ],
};

const GROUP_SERVICES_CATALOG: NavGroup = {
  id: "services-catalog",
  label: "Serviços & Produtos",
  icon: Sparkles,
  items: [
    { path: "/workspace/agenda/servicos", label: "Catálogo de Serviços", icon: Sparkles },
    { path: "/workspace/catalogo/produtos", label: "Produtos / Homecare", icon: Package },
    { path: "/workspace/pdv", label: "Comandas & PDV", icon: Store },
    { path: "/workspace/clientes", label: "Clientes / Pacientes", icon: Users },
  ],
};

const GROUP_RENTAL_EVENTS: NavGroup = {
  id: "rental-events",
  label: "Locação & Inventário",
  icon: Boxes,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Bens & Equipamentos", icon: Package },
    { path: "/workspace/agenda", label: "Agenda de Locação & Disponibilidade", icon: Calendar },
    { path: "/workspace/orcamentos", label: "Orçamentos & Contratos", icon: FileText },
    { path: "/workspace/pedidos/gestor", label: "Montagens & Despacho", icon: ClipboardList },
    { path: "/workspace/clientes", label: "Clientes / Produtores", icon: Users },
  ],
};

const GROUP_TECH_REPAIR: NavGroup = {
  id: "tech-repair",
  label: "Assistência & Vendas",
  icon: Wrench,
  items: [
    { path: "/workspace/pedidos/gestor", label: "Ordens de Serviço (OS)", icon: ClipboardList },
    { path: "/workspace/agenda/servicos", label: "Tabela de Mão de Obra", icon: Wrench },
    { path: "/workspace/catalogo/produtos", label: "Peças, Capinhas & Acessórios", icon: Package },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
    { path: "/workspace/orcamentos", label: "Orçamentos de Reparo", icon: FileText },
    { path: "/workspace/clientes", label: "Clientes", icon: Users },
  ],
};

const GROUP_LEGAL: NavGroup = {
  id: "legal",
  label: "Processos & Jurídico",
  icon: Scale,
  items: [
    { path: "/workspace/advocacia", label: "Processos & Prazos", icon: Scale },
    { path: "/workspace/agenda", label: "Audiências & Reuniões", icon: Calendar },
    { path: "/workspace/orcamentos", label: "Honorários & Propostas", icon: FileText },
    { path: "/workspace/clientes", label: "Clientes / Assistidos", icon: Users },
  ],
};

const GROUP_REAL_ESTATE: NavGroup = {
  id: "real-estate",
  label: "Imóveis & Vistorias",
  icon: Building2,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Catálogo de Imóveis", icon: Building2 },
    { path: "/workspace/imoveis/manutencoes", label: "Vistorias & Chamados", icon: Wrench },
    { path: "/workspace/orcamentos", label: "Propostas & Contratos", icon: FileText },
    { path: "/workspace/clientes", label: "Interessados / Clientes", icon: Users },
  ],
};

const GROUP_TURISMO: NavGroup = {
  id: "tourism",
  label: "Turismo & Reservas",
  icon: Plane,
  items: [
    { path: "/workspace/turismo/cotacoes", label: "Cotações de Pacotes", icon: Plane },
    { path: "/workspace/eventos", label: "Passeios & Ingressos", icon: Calendar },
    { path: "/workspace/agenda", label: "Grade de Reservas", icon: Clock },
    { path: "/workspace/clientes", label: "Viajantes / Clientes", icon: Users },
  ],
};

const GROUP_MARKETING_VITRINE: NavGroup = {
  id: "marketing",
  label: "Vitrine & Divulgação",
  icon: Megaphone,
  items: [
    { path: "/workspace/marketing/vitrine", label: "Vitrine da Loja", icon: Eye },
    { path: "/workspace/marketing/banners", label: "Banners & Destaques", icon: ImageIcon },
    { path: "/workspace/marketing/promocoes", label: "Promoções & Cupons", icon: Flame },
    { path: "/workspace/cms/stories", label: "Stories & Mídia", icon: ImageIcon },
  ],
};

const GROUP_FINANCE_CLEAN: NavGroup = {
  id: "finance",
  label: "Financeiro",
  icon: Banknote,
  items: [
    { path: "/workspace/financeiro/caixa", label: "Fluxo de Caixa", icon: Banknote },
    { path: "/workspace/financeiro/pagamentos", label: "Pagamentos & Repasses", icon: DollarSign },
    { path: "/workspace/financeiro/comprovantes", label: "Comprovantes", icon: Receipt },
  ],
};

const GROUP_SETTINGS: NavGroup = {
  id: "settings",
  label: "Configurações",
  icon: Settings,
  items: [
    { path: "/workspace/configuracoes", label: "Dados da Loja", icon: Settings },
    { path: "/workspace/configuracoes/equipe", label: "Equipe & Acessos", icon: Users },
    { path: "/workspace/configuracoes/integracoes", label: "Integrações", icon: Link2 },
  ],
};

// ── RESOLVER INTELIGENTE DE NAVEGAÇÃO POR NICHO ──────────────────────────────

export function resolveWorkspaceNavigation(
  storeData: any,
  options?: { isMasterMode?: boolean; additionalModules?: string[] }
): NavGroup[] {
  // Se estiver no modo master/desenvolvedor, entrega todos os grupos
  if (options?.isMasterMode) {
    return [
      GROUP_OVERVIEW,
      GROUP_GASTRO_CATALOG,
      GROUP_GASTRO_ORDERS,
      GROUP_RETAIL_CATALOG,
      GROUP_RETAIL_SALES,
      GROUP_SERVICES_AGENDA,
      GROUP_SERVICES_CATALOG,
      GROUP_RENTAL_EVENTS,
      GROUP_TECH_REPAIR,
      GROUP_LEGAL,
      GROUP_REAL_ESTATE,
      GROUP_TURISMO,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  const segment = (
    storeData?.segment ||
    storeData?.type ||
    storeData?.category ||
    storeData?.settings?.segment ||
    ""
  ).toLowerCase();

  // 1. GASTRONOMIA & ALIMENTAÇÃO
  if (
    segment.includes("gastro") ||
    segment.includes("restauran") ||
    segment.includes("lanchon") ||
    segment.includes("bar") ||
    segment.includes("caf") ||
    segment.includes("pizza") ||
    segment.includes("hamburg") ||
    segment.includes("marmit") ||
    segment.includes("doce") ||
    segment.includes("padar") ||
    segment.includes("comida") ||
    segment.includes("aliment")
  ) {
    return [
      GROUP_OVERVIEW,
      GROUP_GASTRO_CATALOG,
      GROUP_GASTRO_ORDERS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 2. SERVIÇOS, SAÚDE & BELEZA
  if (
    segment.includes("servi") ||
    segment.includes("belez") ||
    segment.includes("barbea") ||
    segment.includes("salao") ||
    segment.includes("estet") ||
    segment.includes("saud") ||
    segment.includes("clini") ||
    segment.includes("tatu") ||
    segment.includes("terap") ||
    segment.includes("massag") ||
    segment.includes("person") ||
    segment.includes("academia")
  ) {
    return [
      GROUP_OVERVIEW,
      GROUP_SERVICES_AGENDA,
      GROUP_SERVICES_CATALOG,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 3. LOCAÇÃO, EVENTOS & ESTRUTURA
  if (
    segment.includes("locac") ||
    segment.includes("alug") ||
    segment.includes("evento") ||
    segment.includes("equipamento") ||
    segment.includes("blaster") ||
    segment.includes("som") ||
    segment.includes("ilumin") ||
    segment.includes("festa") ||
    segment.includes("tenda")
  ) {
    return [
      GROUP_OVERVIEW,
      GROUP_RENTAL_EVENTS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 4. ASSISTÊNCIA TÉCNICA, CELULAR & MECÂNICA
  if (
    segment.includes("celul") ||
    segment.includes("assist") ||
    segment.includes("repar") ||
    segment.includes("consert") ||
    segment.includes("mecan") ||
    segment.includes("oficin") ||
    segment.includes("auto") ||
    segment.includes("eletron")
  ) {
    return [
      GROUP_OVERVIEW,
      GROUP_TECH_REPAIR,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 5. ADVOCACIA & JURÍDICO
  if (segment.includes("advoc") || segment.includes("jurid") || segment.includes("direito")) {
    return [
      GROUP_OVERVIEW,
      GROUP_LEGAL,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 6. IMOBILIÁRIA & IMÓVEIS
  if (segment.includes("imove") || segment.includes("imobili") || segment.includes("corret")) {
    return [
      GROUP_OVERVIEW,
      GROUP_REAL_ESTATE,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 7. TURISMO & VIAGENS
  if (
    segment.includes("turis") ||
    segment.includes("hotel") ||
    segment.includes("pousad") ||
    segment.includes("viage") ||
    segment.includes("guia")
  ) {
    return [
      GROUP_OVERVIEW,
      GROUP_TURISMO,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 8. PADRÃO: VAREJO & COMÉRCIO GERAL (Moda, Pet Shop, Mercado, etc.)
  return [
    GROUP_OVERVIEW,
    GROUP_RETAIL_CATALOG,
    GROUP_RETAIL_SALES,
    GROUP_MARKETING_VITRINE,
    GROUP_FINANCE_CLEAN,
    GROUP_SETTINGS,
  ];
}
