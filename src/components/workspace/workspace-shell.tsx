import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
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
  UserCircle,
  Truck,
  Boxes,
  Banknote,
  FileText,
  LayoutTemplate,
  Link2,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ShieldAlert,
  Sparkles,
  Megaphone,
  Flame,
  Newspaper,
  Plus,
  Sliders,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/services/auth.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalRail } from "@/components/shell/global-rail";
import { UtilityCluster } from "@/components/shell/utility-cluster";

type NavItem = {
  path: string;
  label: string;
  icon?: any;
};

type NavGroup = {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
};

const WORKSPACE_MODULES: NavGroup[] = [
  {
    id: "overview",
    label: "Geral",
    icon: LayoutDashboard,
    items: [
      { path: "/workspace", label: "Visão Geral", icon: LayoutDashboard },
      { path: "/workspace/simulacao", label: "SimLab (Enxame IA)", icon: Sparkles },
    ],
  },
  {
    id: "news",
    label: "Notícias & Redação",
    icon: Newspaper,
    items: [
      { path: "/workspace/noticias", label: "Matérias & Artigos", icon: Newspaper },
      { path: "/workspace/noticias/novo", label: "Nova Matéria", icon: Plus },
    ],
  },
  {
    id: "catalog",
    label: "Catálogo",
    icon: Package,
    items: [
      { path: "/workspace/catalogo/produtos", label: "Produtos", icon: Package },
      { path: "/workspace/catalogo/categorias", label: "Categorias", icon: Tags },
      { path: "/workspace/catalogo/atributos", label: "Atributos", icon: Boxes },
      { path: "/workspace/estoque", label: "Estoque", icon: Boxes },
    ],
  },
  {
    id: "sales",
    label: "Vendas & Logística",
    icon: ShoppingBag,
    items: [
      { path: "/workspace/pedidos", label: "Todos os Pedidos", icon: ShoppingBag },
      { path: "/workspace/pedidos/gestor", label: "Gestor (Kanban)", icon: ClipboardList },
      { path: "/workspace/pedidos/frota", label: "Frota & Despacho", icon: Truck },
      { path: "/workspace/pdv", label: "PDV (Frente de Caixa)", icon: Store },
      { path: "/workspace/clientes", label: "Clientes / CRM", icon: Users },
      { path: "/workspace/orcamentos", label: "Orçamentos", icon: FileText },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Monetização",
    icon: Megaphone,
    items: [
      { path: "/workspace/marketing/banners", label: "Top Banners (Vídeo/GIF)", icon: ImageIcon },
      { path: "/workspace/marketing/hotpages", label: "Cards de Categorias", icon: Sliders },
      { path: "/workspace/marketing/patrocinadores", label: "Patrocinadores", icon: Megaphone },
      { path: "/workspace/marketing/telemetria", label: "Telemetria & Audiência", icon: BarChart3 },
      { path: "/workspace/marketing/promocoes", label: "Promoções & Ofertas", icon: Flame },
      { path: "/workspace/marketing/anuncios", label: "Campanhas & Anúncios", icon: Megaphone },
      { path: "/workspace/marketing/gift-cards", label: "Gift Cards", icon: Tag },
    ],
  },
  {
    id: "financial",
    label: "Financeiro & P2P",
    icon: Banknote,
    items: [
      { path: "/workspace/financeiro/caixa", label: "Frente de Caixa", icon: Banknote },
      { path: "/workspace/financeiro/afiliados", label: "Afiliados & Split", icon: Users },
      { path: "/workspace/financeiro/comissoes", label: "Comissões", icon: Tag },
    ],
  },
  {
    id: "services-agenda",
    label: "Serviços & Agenda",
    icon: Calendar,
    items: [
      { path: "/workspace/agenda", label: "Grade de Agendamentos", icon: Calendar },
      { path: "/workspace/agenda/servicos", label: "Catálogo de Serviços", icon: Package },
      { path: "/workspace/agenda/recursos", label: "Profissionais & Salas", icon: Users },
    ],
  },
  {
    id: "cultural",
    label: "Cultural, CMS & Zines",
    icon: LayoutTemplate,
    items: [
      { path: "/workspace/cms/calendario", label: "Calendário Editorial", icon: Calendar },
      { path: "/workspace/cms/stories", label: "Stories & Mídia", icon: ImageIcon },
      { path: "/workspace/cms/bio", label: "Biolink Autoral", icon: Link2 },
      { path: "/workspace/estudio", label: "Estúdio / Builder", icon: LayoutTemplate },
      { path: "/workspace/moderacao", label: "Moderação da Comunidade", icon: ShieldAlert },
    ],
  },
  {
    id: "settings",
    label: "Configurações & IA",
    icon: Settings,
    items: [
      { path: "/workspace/configuracoes/ai", label: "Agentes & IA", icon: Sparkles },
      { path: "/workspace/configuracoes/integracoes", label: "Integrações", icon: Link2 },
      { path: "/workspace/configuracoes/parceiros", label: "Parceiros & Fornecedores", icon: Users },
      { path: "/workspace/configuracoes/fretes/cotacoes", label: "Fretes & Logística", icon: Truck },
    ],
  },
];

export function WorkspaceShell({ children, session }: { children: ReactNode; session?: any }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { overview: true };
    for (const group of WORKSPACE_MODULES) {
      if (group.items.some((item) => currentPath.startsWith(item.path))) {
        initial[group.id] = true;
      }
    }
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/entrar";
    } catch (e) {
      console.error(e);
    }
  };

  const NavLinks = () => (
    <div className="flex flex-col space-y-1 select-none">
      {WORKSPACE_MODULES.map((group) => {
        const isGroupActive = group.items.some((item) =>
          item.path === "/workspace"
            ? currentPath === "/workspace"
            : currentPath.startsWith(item.path),
        );
        const isExpanded = expandedGroups[group.id] ?? isGroupActive;
        const Icon = group.icon;

        return (
          <div key={group.id} className="space-y-0.5">
            <button
              onClick={() => toggleGroup(group.id)}
              className={cn(
                "flex w-full items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors",
                isGroupActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span>{group.label}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="size-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="ml-3 pl-2.5 border-l border-border/60 space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const isItemActive =
                    item.path === "/workspace"
                      ? currentPath === "/workspace"
                      : currentPath.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors",
                        isItemActive
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
                      )}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans relative">
      <GlobalRail session={session} />

      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 border-r border-border/70 bg-background py-5 px-3 justify-between select-none">
        <div className="space-y-4">
          <div className="px-2 space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Workspace
            </span>
            <h2 className="text-sm font-bold text-foreground">Gestão Operacional</h2>
          </div>

          <ScrollArea className="h-[calc(100vh-140px)] pr-2">
            <NavLinks />
          </ScrollArea>
        </div>

        <div className="pt-3 border-t border-border/60">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl"
          >
            <Link to="/conta">
              <UserCircle className="size-4 mr-2 text-muted-foreground" />
              <span>Voltar à Área Pessoal</span>
            </Link>
          </Button>
        </div>
      </aside>

      <UtilityCluster session={session} />

      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto px-4 md:px-6 lg:px-8 py-6 w-full pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
