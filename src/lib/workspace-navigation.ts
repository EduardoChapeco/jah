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
  Kanban,
  Newspaper,
  Plus,
  Sliders,
  DollarSign,
  Ticket,
  ArrowRightLeft,
  Building2,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
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
  Bus,
  Award,
  Bot,
  LifeBuoy,
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
    { path: "/workspace/tarefas", label: "Tarefas & Equipe", icon: ClipboardList },
    { path: "/workspace/suporte", label: "Ajuda & Suporte", icon: LifeBuoy },
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
    { path: "/workspace/pedidos/gestor", label: "Gestor & SLAs (KDS)", icon: ClipboardList },
    { path: "/workspace/pdv/comandas", label: "Salão & Mesas", icon: UtensilsCrossed },
    { path: "/workspace/pdv/cozinha", label: "KDS Cozinha", icon: ChefHat },
    { path: "/workspace/reservas", label: "Reservas de Mesas", icon: Calendar },
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
    { path: "/workspace/clientes", label: "Carteira de Clientes", icon: Users },
    { path: "/workspace/comercial", label: "Funil Comercial (Kanban)", icon: Kanban },
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
  label: "Turismo & Viagens",
  icon: Plane,
  items: [
    { path: "/workspace/catalogo/produtos", label: "Pacotes & Roteiros", icon: Package },
    { path: "/workspace/turismo/destinos", label: "Banco de Destinos", icon: MapPin },
    { path: "/workspace/turismo/hoteis", label: "Banco de Hotéis & Resorts", icon: Building2 },
    { path: "/workspace/turismo/cotacoes", label: "Cotações & Leads de Viagem", icon: Plane },
    { path: "/workspace/orcamentos", label: "Orçamentos Gerais", icon: FileText },
    { path: "/workspace/turismo/propostas", label: "Lâminas & Propostas (Studio)", icon: Sparkles },
    { path: "/workspace/turismo/contratos", label: "Contratos & Assinatura Digital", icon: FileText },
    { path: "/workspace/turismo/grupos", label: "Grupos & Excursões", icon: Users },
    { path: "/workspace/turismo/frota", label: "Frota & Ônibus (Assentos 2D)", icon: Bus },
    { path: "/workspace/eventos", label: "Passeios & Ingressos", icon: Calendar },
  ],
};

const GROUP_TURISMO_COMMERCIAL: NavGroup = {
  id: "tourism-commercial",
  label: "Passageiros & Vendas",
  icon: Users,
  items: [
    { path: "/workspace/clientes", label: "Carteira de Clientes & Passageiros", icon: Users },
    { path: "/workspace/comercial", label: "Funil Comercial (Kanban)", icon: Kanban },
    { path: "/workspace/atendimento", label: "Atendimento & WhatsApp", icon: MessageSquare },
    { path: "/workspace/pedidos", label: "Emissões & Vendas", icon: ShoppingBag },
  ],
};

const GROUP_TURISMO_MARKETING: NavGroup = {
  id: "tourism-marketing",
  label: "Vitrine & Divulgação",
  icon: Megaphone,
  items: [
    { path: "/workspace/marketing/vitrine", label: "Vitrine de Pacotes (Builder)", icon: Sparkles },
    { path: "/workspace/cms/paginas", label: "Roteiros & Landing Pages", icon: FileText },
    { path: "/workspace/cms/bio", label: "Link da Bio da Agência", icon: Link2 },
    { path: "/workspace/marketing/banners", label: "Banners & Destaques", icon: ImageIcon },
    { path: "/workspace/marketing/promocoes", label: "Ofertas & Descontos", icon: Flame },
    { path: "/workspace/marketing/anuncios", label: "Campanhas Publicitárias", icon: Megaphone },
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

// Grupos Universais Corporativos
const GROUP_COMMERCIAL_SALES: NavGroup = {
  id: "commercial",
  label: "Comercial & CRM",
  icon: Users,
  items: [
    { path: "/workspace/clientes", label: "Carteira de Clientes 360°", icon: Users },
    { path: "/workspace/comercial", label: "Funil de Vendas (Kanban)", icon: Kanban },
    { path: "/workspace/atendimento", label: "Atendimento & Chat", icon: MessageSquare },
    { path: "/workspace/orcamentos", label: "Orçamentos & Propostas", icon: FileText },
    { path: "/workspace/pdv", label: "Frente de Caixa (PDV)", icon: Store },
    { path: "/workspace/pedidos", label: "Histórico de Vendas", icon: ShoppingBag },
  ],
};

const GROUP_MARKETING_VITRINE: NavGroup = {
  id: "marketing",
  label: "Vitrine & Divulgação",
  icon: Megaphone,
  items: [
    { path: "/workspace/marketing/vitrine", label: "Vitrine Visual (Builder)", icon: Sparkles },
    { path: "/workspace/cms/paginas", label: "Páginas & Landing Pages", icon: FileText },
    { path: "/workspace/cms/bio", label: "Link da Bio & Perfil", icon: Link2 },
    { path: "/workspace/estudio", label: "Estúdio Gráfico & Vídeo", icon: Sparkles },
    { path: "/workspace/marketing/banners", label: "Banners & Topo", icon: ImageIcon },
    { path: "/workspace/marketing/hotpages", label: "Páginas de Destaque (Hotpages)", icon: Layers },
    { path: "/workspace/marketing/promocoes", label: "Promoções & Cupons", icon: Flame },
    { path: "/workspace/marketing/fidelidade", label: "Programa de Fidelidade", icon: Award },
    { path: "/workspace/marketing/gift-cards", label: "Vales-Presente", icon: Gift },
    { path: "/workspace/cms/stories", label: "Stories & Mídia", icon: ImageIcon },
    { path: "/workspace/marketing/anuncios", label: "Campanhas de Anúncios", icon: Megaphone },
  ],
};

const GROUP_FINANCE_CLEAN: NavGroup = {
  id: "finance",
  label: "Financeiro",
  icon: Banknote,
  items: [
    { path: "/workspace/financeiro/caixa", label: "Fluxo de Caixa", icon: Banknote },
    { path: "/workspace/financeiro/pagamentos", label: "Pagamentos & Repasses", icon: DollarSign },
    { path: "/workspace/financeiro/recebiveis", label: "Recebíveis & Carnês", icon: Receipt },
    { path: "/workspace/financeiro/funcionarios", label: "Folha & Salários", icon: Users },
  ],
};

const GROUP_TEAM_RH: NavGroup = {
  id: "team-rh",
  label: "Equipe & RH",
  icon: Users,
  items: [
    { path: "/workspace/configuracoes/equipe", label: "Colaboradores & Acessos", icon: Users },
    { path: "/workspace/financeiro/comissoes", label: "Comissões & Metas", icon: Sparkles },
    { path: "/workspace/configuracoes/sessoes", label: "Sessões & Segurança", icon: ShieldCheck },
  ],
};

import { getNicheSemantics } from "./niche-semantics";

const GROUP_SETTINGS: NavGroup = {
  id: "settings",
  label: "Configurações",
  icon: Settings,
  items: [
    { path: "/workspace/configuracoes", label: "Dados da Loja", icon: Settings },
    { path: "/workspace/configuracoes/inteligencia-artificial", label: "Inteligência Artificial (IAs)", icon: Bot },
    { path: "/workspace/configuracoes/integracoes", label: "Integrações & Domínios", icon: Link2 },
  ],
};

// ── RESOLVER INTELIGENTE DE NAVEGAÇÃO POR NICHO ──────────────────────────────

export function resolveWorkspaceNavigation(
  storeData: any,
  options?: { isMasterMode?: boolean; additionalModules?: string[]; userRole?: string }
): NavGroup[] {
  // Se estiver no modo master/desenvolvedor, entrega todos os grupos
  if (options?.isMasterMode) {
    return [
      GROUP_OVERVIEW,
      GROUP_TURISMO,
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

  const semantics = getNicheSemantics(storeData);
  let rawGroups: NavGroup[] = [];

  switch (semantics.nicheId) {
    case "tourism":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_TURISMO,
        GROUP_TURISMO_COMMERCIAL,
        GROUP_TURISMO_MARKETING,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "gastronomy":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_GASTRO_CATALOG,
        GROUP_GASTRO_ORDERS,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "services":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_SERVICES_AGENDA,
        GROUP_SERVICES_CATALOG,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "legal":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_LEGAL,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "jobs":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_JOBS,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "pharmacy":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_PHARMACY,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "wholesale":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_WHOLESALE,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "rental":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_RENTAL_EVENTS,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "tech_repair":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_TECH_REPAIR,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "pet":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_PET,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "supermarket":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_SUPERMARKET,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "events":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_EVENTS_TICKETS,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "vehicles":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_VEHICLES,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "real_estate":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_REAL_ESTATE,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "education":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_EDUCATION,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "news":
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_NEWS,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;

    case "retail":
    default:
      rawGroups = [
        GROUP_OVERVIEW,
        GROUP_RETAIL_CATALOG,
        GROUP_RETAIL_SALES,
        GROUP_COMMERCIAL_SALES,
        GROUP_MARKETING_VITRINE,
        GROUP_FINANCE_CLEAN,
        GROUP_TEAM_RH,
        GROUP_SETTINGS,
      ];
      break;
  }

  // ── ENRIQUECIMENTO E FILTRAGEM MODULAR DINÂMICA ─────────────────────────────
  let resolvedGroups = rawGroups;
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
    if (enabledModules.includes("tourism") && !finalGroups.some((g) => g.id === "tourism")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_TURISMO);
    }
    if (enabledModules.includes("education") && !finalGroups.some((g) => g.id === "education")) {
      finalGroups.splice(finalGroups.length - 2, 0, GROUP_EDUCATION);
    }

    resolvedGroups = finalGroups;
  }

  // ── GOVERNANÇA GRANULAR DE RBAC POR CARGO / FUNÇÃO ───────────────────────────
  const userRole = (options?.userRole || "owner").toLowerCase();

  // Proprietário(a) e Administrador Geral possuem acesso irrestrito
  if (userRole === "owner" || userRole === "admin" || userRole === "proprietario") {
    return resolvedGroups;
  }

  // Gerente / Manager: acesso a quase tudo, exceto configurações bancárias/críticas
  if (userRole === "manager" || userRole === "gerente") {
    return resolvedGroups;
  }

  // Operador de Caixa / Cashier: apenas PDV, Abertura/Fechamento de Caixa
  if (userRole === "cashier" || userRole === "caixa") {
    return [
      GROUP_OVERVIEW,
      {
        id: "pos-cashier",
        label: "Frente de Caixa (PDV)",
        icon: ShoppingBag,
        items: [
          { path: "/workspace/pdv", label: "Abrir Frente de Caixa (PDV)", icon: ShoppingBag },
          { path: "/workspace/pedidos", label: "Pedidos & Vendas do Dia", icon: ShoppingCart },
          { path: "/workspace/financeiro/caixa", label: "Fluxo de Caixa & Turno", icon: Banknote },
        ],
      },
    ];
  }

  // Vendedor(a) / Atendente / Seller: Catálogo, Pedidos, Orçamentos, PDV, Clientes
  if (userRole === "seller" || userRole === "vendedor" || userRole === "atendente") {
    return resolvedGroups
      .filter((g) => g.id !== "settings" && g.id !== "marketing")
      .map((g) => {
        if (g.id === "finance") {
          return {
            ...g,
            items: g.items.filter((i) => i.path.includes("caixa") || i.path.includes("pagamentos")),
          };
        }
        return g;
      });
  }

  // Cozinha / Operador / Estoquista: KDS / Separação de Pedidos e Estoque
  if (userRole === "kitchen" || userRole === "operator" || userRole === "cozinha" || userRole === "estoquista") {
    return [
      GROUP_OVERVIEW,
      {
        id: "operations",
        label: "Operações & Expedição",
        icon: Boxes,
        items: [
          { path: "/workspace/pedidos/gestor", label: "Gestor de Pedidos / KDS", icon: Clock },
          { path: "/workspace/pedidos", label: "Separação & Picking", icon: Package },
          { path: "/workspace/estoque", label: "Estoque & Insumos", icon: Boxes },
        ],
      },
    ];
  }

  // Especialista / Profissional: Agenda, Meus Clientes e Comandas
  if (userRole === "specialist" || userRole === "profissional") {
    return [
      GROUP_OVERVIEW,
      {
        id: "specialist-agenda",
        label: "Minha Agenda & Atendimentos",
        icon: Calendar,
        items: [
          { path: "/workspace/agenda", label: "Minha Grade de Agendamentos", icon: Calendar },
          { path: "/workspace/clientes", label: "Meus Clientes", icon: Users },
          { path: "/workspace/pdv", label: "Lançar Comanda de Atendimento", icon: ShoppingBag },
        ],
      },
    ];
  }

  // RH / Recrutador: Colaboradores, Vagas e Candidatos
  if (userRole === "rh" || userRole === "recruiter") {
    return [
      GROUP_OVERVIEW,
      {
        id: "rh-module",
        label: "RH & Recrutamento",
        icon: Briefcase,
        items: [
          { path: "/workspace/configuracoes/equipe", label: "Colaboradores & Folha", icon: Users },
          { path: "/workspace/empregos/candidatos", label: "Vagas & Triagem (ATS)", icon: Briefcase },
          { path: "/workspace/clientes", label: "Banco de Talentos", icon: Users },
        ],
      },
    ];
  }

  return resolvedGroups;
}
