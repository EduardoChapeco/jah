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
  HeartPulse,
  GraduationCap,
  Dog,
  CarFront,
  PenTool,
  Layers2,
  FileSpreadsheet,
  Gift,
  Globe,
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

// 1. Gastronomia
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

// 2. Varejo & Moda
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

// 3. Serviços & Beleza
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

// 4. Locação & Estruturas
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

// 5. Assistência Técnica
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

// 6. Advocacia & Jurídico
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

// 7. Imóveis
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

// 8. Turismo
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

// 9. Empregos & Recrutamento
const GROUP_JOBS: NavGroup = {
  id: "jobs",
  label: "Vagas & Recrutamento",
  icon: Briefcase,
  items: [
    { path: "/workspace/empregos/candidatos", label: "Vagas & Candidaturas", icon: Briefcase },
    { path: "/workspace/clientes", label: "Banco de Talentos", icon: Users },
    { path: "/workspace/marketing/vitrine", label: "Página de Carreiras", icon: Eye },
  ],
};

// 10. Eventos, Shows & Ingressos
const GROUP_EVENTS_TICKETS: NavGroup = {
  id: "events-tickets",
  label: "Eventos & Ingressos",
  icon: Ticket,
  items: [
    { path: "/workspace/eventos", label: "Meus Eventos & Lotes", icon: Ticket },
    { path: "/workspace/marketing/banners", label: "Flyers & Divulgação", icon: ImageIcon },
    { path: "/workspace/clientes", label: "Participantes / Compradores", icon: Users },
    { path: "/workspace/financeiro/pagamentos", label: "Balanço de Ingressos", icon: DollarSign },
  ],
};

// 11. Automóveis & Veículos
const GROUP_VEHICLES: NavGroup = {
  id: "vehicles",
  label: "Estoque de Veículos",
  icon: CarFront,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Estoque de Veículos", icon: CarFront },
    { path: "/workspace/orcamentos", label: "Propostas & Financiamento", icon: FileText },
    { path: "/workspace/clientes", label: "Leads & Interessados", icon: Users },
  ],
};

// 12. Pet Shop & Veterinária
const GROUP_PET: NavGroup = {
  id: "pet",
  label: "Pet Shop & Clínica",
  icon: Dog,
  items: [
    { path: "/workspace/agenda", label: "Grade de Banho, Tosa e Consultas", icon: Calendar },
    { path: "/workspace/agenda/servicos", label: "Procedimentos & Vacinas", icon: HeartPulse },
    { path: "/workspace/catalogo/produtos", label: "Rações, Farmácia & Acessórios", icon: Package },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
    { path: "/workspace/clientes", label: "Tutores & Pets", icon: Users },
  ],
};

// 13. Supermercado, Açougue & Hortifrúti
const GROUP_SUPERMARKET: NavGroup = {
  id: "supermarket",
  label: "Gôndolas & Hortifrúti",
  icon: ShoppingCart,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Produtos (KG e Unidade)", icon: Package },
    { path: "/workspace/catalogo/categorias", label: "Sessões do Mercado", icon: Tags },
    { path: "/workspace/estoque/alertas", label: "Validades & Reposição", icon: AlertTriangle },
    { path: "/workspace/pedidos/gestor", label: "Separação de Pedidos", icon: ClipboardList },
    { path: "/workspace/pedidos/frota", label: "Entregas Locais", icon: Truck },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
  ],
};

// 14. Farmácia & Saúde
const GROUP_PHARMACY: NavGroup = {
  id: "pharmacy",
  label: "Farmácia & Cosméticos",
  icon: HeartPulse,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Medicamentos & OTC", icon: Package },
    { path: "/workspace/pedidos/gestor", label: "Receituários & Balcão", icon: ClipboardList },
    { path: "/workspace/pedidos/frota", label: "Tele-Entrega Express", icon: Truck },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
    { path: "/workspace/clientes", label: "Pacientes / Clientes", icon: Users },
  ],
};

// 15. Notícias & Redação de Jornal
const GROUP_NEWS: NavGroup = {
  id: "news",
  label: "Redação & Notícias",
  icon: Newspaper,
  items: [
    { path: "/workspace/noticias", label: "Todas as Matérias", icon: Newspaper },
    { path: "/workspace/noticias/novo", label: "Nova Reportagem", icon: PenTool },
    { path: "/workspace/marketing/banners", label: "Banners Publicitários", icon: ImageIcon },
    { path: "/workspace/marketing/vitrine", label: "Capa do Portal", icon: Eye },
  ],
};

// 16. Educação & Cursos
const GROUP_EDUCATION: NavGroup = {
  id: "education",
  label: "Cursos & Turmas",
  icon: GraduationCap,
  items: [
    { path: "/workspace/agenda", label: "Grade de Aulas & Workshops", icon: Calendar },
    { path: "/workspace/agenda/servicos", label: "Catálogo de Cursos", icon: GraduationCap },
    { path: "/workspace/clientes", label: "Alunos & Matrículas", icon: Users },
    { path: "/workspace/orcamentos", label: "Contratos & Propostas", icon: FileText },
  ],
};

// 17. Indústria, Atacado & B2B
const GROUP_WHOLESALE: NavGroup = {
  id: "wholesale",
  label: "Atacado & B2B",
  icon: Layers2,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Grade de Produtos & Caixas", icon: Package },
    { path: "/workspace/catalogo/tabelas", label: "Tabelas de Preço PJ", icon: FileSpreadsheet },
    { path: "/workspace/orcamentos", label: "Orçamentos em Lote", icon: FileText },
    { path: "/workspace/pedidos", label: "Faturamento & Pedidos", icon: ShoppingBag },
    { path: "/workspace/clientes", label: "Clientes PJ / Distribuidores", icon: Users },
  ],
};

// Grupos Universais
const GROUP_MARKETING_VITRINE: NavGroup = {
  id: "marketing",
  label: "Vitrine & Divulgação",
  icon: Megaphone,
  items: [
    { path: "/workspace/marketing/vitrine", label: "Vitrine da Loja", icon: Eye },
    { path: "/workspace/cms/bio", label: "Editor de Link da Bio", icon: Link2 },
    { path: "/workspace/cms/paginas", label: "Páginas do Site", icon: FileText },
    { path: "/workspace/estudio", label: "Estúdio de Design (Studio)", icon: Sparkles },
    { path: "/workspace/marketing/banners", label: "Banners & Destaques", icon: ImageIcon },
    { path: "/workspace/marketing/hotpages", label: "Destaques & Hotpages", icon: Layers },
    { path: "/workspace/marketing/promocoes", label: "Promoções & Cupons", icon: Flame },
    { path: "/workspace/marketing/gift-cards", label: "Vales-Presente", icon: Gift },
    { path: "/workspace/cms/stories", label: "Stories & Mídia", icon: ImageIcon },
    { path: "/workspace/marketing/anuncios", label: "Campanhas de Anúncios", icon: Megaphone },
  ],
};

const GROUP_FINANCE_CLEAN: NavGroup = {
  id: "finance",
  label: "Financeiro & RH",
  icon: Banknote,
  items: [
    { path: "/workspace/financeiro/caixa", label: "Fluxo de Caixa", icon: Banknote },
    { path: "/workspace/financeiro/pagamentos", label: "Pagamentos & Repasses", icon: DollarSign },
    { path: "/workspace/financeiro/recebiveis", label: "Recebíveis & Carnês", icon: Receipt },
    { path: "/workspace/financeiro/funcionarios", label: "Folha & Vales (RH)", icon: Users },
  ],
};

const GROUP_SETTINGS: NavGroup = {
  id: "settings",
  label: "Configurações",
  icon: Settings,
  items: [
    { path: "/workspace/configuracoes", label: "Dados da Loja", icon: Settings },
    { path: "/workspace/configuracoes/equipe", label: "Equipe & Vagas (RH)", icon: Users },
    { path: "/workspace/configuracoes/dominios", label: "Domínios & DNS", icon: Globe },
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
      GROUP_JOBS,
      GROUP_EVENTS_TICKETS,
      GROUP_VEHICLES,
      GROUP_PET,
      GROUP_SUPERMARKET,
      GROUP_PHARMACY,
      GROUP_NEWS,
      GROUP_EDUCATION,
      GROUP_WHOLESALE,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  const storeName = (storeData?.name || storeData?.stores?.name || "").toLowerCase();
  const segment = (
    storeData?.segment ||
    storeData?.type ||
    storeData?.category ||
    storeData?.stores?.segment ||
    storeData?.stores?.type ||
    storeData?.stores?.category ||
    storeData?.settings?.segment ||
    storeData?.settings?.type ||
    storeData?.settings?.niche ||
    storeData?.stores?.settings?.segment ||
    storeData?.stores?.settings?.type ||
    storeData?.stores?.settings?.niche ||
    storeData?.description ||
    storeName ||
    ""
  ).toLowerCase();

  let rawGroups: NavGroup[] = [];

  // 1. EMPREGOS & RECRUTAMENTO
  if (
    segment.includes("job") ||
    segment.includes("emprego") ||
    segment.includes("vaga") ||
    segment.includes("rh") ||
    segment.includes("recrut") ||
    segment.includes("talento") ||
    segment.includes("estagio")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_JOBS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 2. EVENTOS, SHOWS & INGRESSOS
  else if (
    segment.includes("event") ||
    segment.includes("show") ||
    segment.includes("festa") ||
    segment.includes("ingresso") ||
    segment.includes("produtor") ||
    segment.includes("balada") ||
    segment.includes("teatro") ||
    segment.includes("congresso")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_EVENTS_TICKETS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 3. VEÍCULOS & CONCESSIONÁRIA
  else if (
    segment.includes("veicul") ||
    segment.includes("carro") ||
    segment.includes("moto") ||
    segment.includes("automot") ||
    segment.includes("concessionar") ||
    segment.includes("garagem")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_VEHICLES,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 4. PET SHOP & VETERINÁRIA
  else if (
    segment.includes("pet") ||
    segment.includes("veterin") ||
    segment.includes("banho") ||
    segment.includes("tosa") ||
    segment.includes("agro") ||
    segment.includes("racao")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_PET,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 5. SUPERMERCADO, AÇOUGUE & HORTIFRÚTI
  else if (
    segment.includes("mercado") ||
    segment.includes("supermercado") ||
    segment.includes("hortifruti") ||
    segment.includes("acougue") ||
    segment.includes("mercearia") ||
    segment.includes("emporio")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_SUPERMARKET,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 6. FARMÁCIA & COSMÉTICOS
  else if (
    segment.includes("farma") ||
    segment.includes("drogari") ||
    segment.includes("medicament") ||
    segment.includes("suplement")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_PHARMACY,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 7. JORNALISMO & NOTÍCIAS
  else if (
    segment.includes("notici") ||
    segment.includes("jornal") ||
    segment.includes("redac") ||
    segment.includes("midia") ||
    segment.includes("portal") ||
    segment.includes("revista")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_NEWS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 8. EDUCAÇÃO & CURSOS
  else if (
    segment.includes("curso") ||
    segment.includes("educac") ||
    segment.includes("escola") ||
    segment.includes("aula") ||
    segment.includes("workshop") ||
    segment.includes("treinamento") ||
    segment.includes("idioma")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_EDUCATION,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 9. ATACADO, INDÚSTRIA & B2B
  else if (
    segment.includes("atacado") ||
    segment.includes("distribuidora") ||
    segment.includes("industria") ||
    segment.includes("b2b") ||
    segment.includes("fabrica")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_WHOLESALE,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 10. GASTRONOMIA & ALIMENTAÇÃO
  else if (
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
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_GASTRO_CATALOG,
      GROUP_GASTRO_ORDERS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 11. SERVIÇOS, SAÚDE & BELEZA
  else if (
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
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_SERVICES_AGENDA,
      GROUP_SERVICES_CATALOG,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 12. LOCAÇÃO, EQUIPAMENTOS & ESTRUTURA
  else if (
    segment.includes("locac") ||
    segment.includes("alug") ||
    segment.includes("equipamento") ||
    segment.includes("blaster") ||
    segment.includes("som") ||
    segment.includes("ilumin") ||
    segment.includes("tenda")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_RENTAL_EVENTS,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 13. ASSISTÊNCIA TÉCNICA, CELULAR & MECÂNICA
  else if (
    segment.includes("celul") ||
    segment.includes("assist") ||
    segment.includes("repar") ||
    segment.includes("consert") ||
    segment.includes("mecan") ||
    segment.includes("oficin") ||
    segment.includes("auto") ||
    segment.includes("eletron")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_TECH_REPAIR,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 14. ADVOCACIA & JURÍDICO
  else if (segment.includes("advoc") || segment.includes("jurid") || segment.includes("direito")) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_LEGAL,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 15. IMOBILIÁRIA & IMÓVEIS
  else if (segment.includes("imove") || segment.includes("imobili") || segment.includes("corret")) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_REAL_ESTATE,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // 16. TURISMO & VIAGENS
  else if (
    segment.includes("turis") ||
    segment.includes("hotel") ||
    segment.includes("pousad") ||
    segment.includes("viage") ||
    segment.includes("guia")
  ) {
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_TURISMO,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  } else {
    // 17. PADRÃO: VAREJO & COMÉRCIO GERAL (Moda, Calçados, Presentes, etc.)
    rawGroups = [
      GROUP_OVERVIEW,
      GROUP_RETAIL_CATALOG,
      GROUP_RETAIL_SALES,
      GROUP_MARKETING_VITRINE,
      GROUP_FINANCE_CLEAN,
      GROUP_SETTINGS,
    ];
  }

  // ── ENRIQUECIMENTO E FILTRAGEM MODULAR DINÂMICA ─────────────────────────────
  const enabledModules: string[] | undefined =
    storeData?.settings?.enabled_modules ||
    storeData?.enabled_modules;

  if (enabledModules && Array.isArray(enabledModules) && enabledModules.length > 0) {
    const finalGroups: NavGroup[] = [];

    for (const group of rawGroups) {
      // Sempre preserva Overview, Financeiro e Configurações
      if (group.id === "overview" || group.id === "finance" || group.id === "settings") {
        finalGroups.push(group);
        continue;
      }

      // Grupo de Marketing / Vitrine: filtra ou adiciona itens específicos
      if (group.id === "marketing") {
        const filteredItems = group.items.filter((item) => {
          if (item.path.includes("/workspace/estudio") && !enabledModules.includes("studio")) return false;
          if (item.path.includes("/workspace/cms/bio") && !enabledModules.includes("biolink")) return false;
          if (item.path.includes("/workspace/cms/paginas") && !enabledModules.includes("pages")) return false;
          return true;
        });

        // Adiciona Classificados caso habilitado
        if (enabledModules.includes("classifieds")) {
          const hasClassifieds = filteredItems.some((i) => i.path.includes("classificados"));
          if (!hasClassifieds) {
            filteredItems.push({
              path: "/conta/classificados",
              label: "Classificados Locais",
              icon: Megaphone,
            });
          }
        }

        finalGroups.push({ ...group, items: filteredItems });
        continue;
      }

      // Demais grupos operacionais: filtra itens como PDV, Frota e Estoque se desabilitados
      const filteredItems = group.items.filter((item) => {
        if (item.path === "/workspace/pdv" && !enabledModules.includes("pos")) return false;
        if (item.path.includes("/workspace/pedidos/frota") && !enabledModules.includes("delivery")) return false;
        if (item.path.includes("/workspace/estoque") && !enabledModules.includes("stock")) return false;
        if (item.path === "/workspace/pedidos/gestor" && !enabledModules.includes("orders")) return false;
        return true;
      });

      if (filteredItems.length > 0) {
        finalGroups.push({ ...group, items: filteredItems });
      }
    }

    // Inclusão de grupos complementares ativados pelo usuário
    if (enabledModules.includes("jobs") && !finalGroups.some((g) => g.id === "jobs")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_JOBS);
    }
    if (enabledModules.includes("events") && !finalGroups.some((g) => g.id === "events-tickets")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_EVENTS_TICKETS);
    }
    if (enabledModules.includes("news") && !finalGroups.some((g) => g.id === "news")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_NEWS);
    }
    if (enabledModules.includes("vehicles") && !finalGroups.some((g) => g.id === "vehicles")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_VEHICLES);
    }
    if (enabledModules.includes("real_estate") && !finalGroups.some((g) => g.id === "real-estate")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_REAL_ESTATE);
    }
    if (enabledModules.includes("tourism") && !finalGroups.some((g) => g.id === "turismo")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_TURISMO);
    }
    if (enabledModules.includes("education") && !finalGroups.some((g) => g.id === "education")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_EDUCATION);
    }

    return finalGroups;
  }

  return rawGroups;
}
