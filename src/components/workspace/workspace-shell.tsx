import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  DollarSign,
  Ticket,
  ArrowRightLeft,
  ArrowUpRight,
  User,
  LogOut,
  Bell,
  Check,
  ChevronsUpDown,
  Building2,
  ShieldCheck,
  UtensilsCrossed,
  Compass,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/services/auth.functions";
import { setTenantContext } from "@/services/identity.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

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
      { path: "/workspace/catalogo/tabelas", label: "Tabelas de Preços", icon: DollarSign },
      { path: "/workspace/catalogo/categorias", label: "Categorias", icon: Tags },
      { path: "/workspace/catalogo/colecoes", label: "Coleções", icon: Sliders },
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
      { path: "/workspace/logistica/tabelas", label: "Tabelas de Frete & KM", icon: DollarSign },
      { path: "/workspace/logistica/faturas", label: "Faturas de Frota", icon: Banknote },
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
      { path: "/workspace/pacotes", label: "Pacotes & Passes de Aulas", icon: Ticket },
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
      { path: "/workspace/configuracoes", label: "Configurações da Loja", icon: Settings },
      { path: "/workspace/lojas", label: "Minhas Lojas / Unidades", icon: Store },
      { path: "/workspace/configuracoes/ai", label: "Agentes & IA", icon: Sparkles },
      { path: "/workspace/configuracoes/integracoes", label: "Integrações", icon: Link2 },
      { path: "/workspace/configuracoes/parceiros", label: "Parceiros & Fornecedores", icon: Users },
      { path: "/workspace/configuracoes/fretes/cotacoes", label: "Fretes & Logística", icon: Truck },
    ],
  },
];


function getStoreContextualAction(storeData: any) {
  const segment = (
    storeData?.segment ||
    storeData?.type ||
    storeData?.category ||
    storeData?.settings?.segment ||
    ""
  ).toLowerCase();

  if (
    segment.includes("gastro") ||
    segment.includes("restauran") ||
    segment.includes("lanchon") ||
    segment.includes("bar") ||
    segment.includes("caf") ||
    segment.includes("pizza") ||
    segment.includes("hamburg") ||
    segment.includes("comida") ||
    segment.includes("aliment")
  ) {
    return {
      label: "Ver Cardápio Online",
      icon: UtensilsCrossed,
      aba: "cardapio",
    };
  }

  if (
    segment.includes("servi") ||
    segment.includes("belez") ||
    segment.includes("estet") ||
    segment.includes("saud") ||
    segment.includes("consult") ||
    segment.includes("advoc") ||
    segment.includes("agenc")
  ) {
    return {
      label: "Ver Catálogo de Serviços",
      icon: Sparkles,
      aba: "servicos",
    };
  }

  if (segment.includes("imove") || segment.includes("imobili")) {
    return {
      label: "Ver Catálogo de Imóveis",
      icon: Building2,
      aba: "imoveis",
    };
  }

  if (
    segment.includes("turis") ||
    segment.includes("hotel") ||
    segment.includes("pousad") ||
    segment.includes("viage")
  ) {
    return {
      label: "Ver Espaço Turístico",
      icon: Compass,
      aba: "turismo",
    };
  }

  if (
    segment.includes("moda") ||
    segment.includes("calc") ||
    segment.includes("roup") ||
    segment.includes("varej") ||
    segment.includes("mercad") ||
    segment.includes("loja")
  ) {
    return {
      label: "Ver Loja Online",
      icon: ShoppingBag,
      aba: "catalogo",
    };
  }

  return {
    label: "Ver Página da Loja",
    icon: ArrowUpRight,
    aba: "catalogo",
  };
}

export function WorkspaceShell({ children, session }: { children: ReactNode; session?: any }) {
  const navigate = useNavigate();
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

  // Estado do Modal de Confirmação de Alternância de Contexto
  const [showPersonalSwitchModal, setShowPersonalSwitchModal] = useState(false);
  const [targetPersonalPath, setTargetPersonalPath] = useState<string>("/conta");

  const [isSwitching, setIsSwitching] = useState(false);
  const memberships = (session?.memberships as any[]) || [];
  const activeStoreId = session?.store_id;
  const activeStore = memberships.find((m) => m.store_id === activeStoreId) || memberships[0];

  const userDisplayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    session?.email?.split("@")[0] ||
    "Usuário";

  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const isPlatformAdmin =
    session?.user?.role === "platform_admin" ||
    session?.role === "platform_admin" ||
    session?.user?.user_metadata?.role === "platform_admin";

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

  const handleSwitchStore = async (storeId: string) => {
    if (storeId === activeStoreId || isSwitching) return;
    setIsSwitching(true);
    try {
      if (typeof window !== "undefined") {
        window.document.cookie = `wider_active_tenant=${storeId}; path=/; max-age=31536000; SameSite=Lax`;
      }
      const res = await setTenantContext({ data: { store_id: storeId } }).catch(() => null);
      const storeName = res?.storeName || "Espaço";
      toast.success(`Espaço de trabalho alterado para ${storeName}`);
      window.location.reload();
    } catch {
      toast.error("Erro ao alternar loja.");
      setIsSwitching(false);
    }
  };

  const confirmSwitchToPersonal = () => {
    setShowPersonalSwitchModal(false);
    toast.info(`Alternando para o perfil de ${userDisplayName}...`);
    navigate({ to: targetPersonalPath as any });
  };

  const requestSwitchToPersonal = (destination = "/conta") => {
    setTargetPersonalPath(destination);
    setShowPersonalSwitchModal(true);
  };

  const NavLinks = () => (
    <div className="flex flex-col space-y-1 select-none">
      {/* ── Módulo VIP: Painel Global Master para Platform Admin ── */}
      {isPlatformAdmin && (
        <div className="mb-2 pb-2 border-b border-border/40">
          <Link
            to="/admin-master"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all font-bold text-xs group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary shrink-0" />
              <span className="truncate">Painel Global Master</span>
            </div>
            <ArrowUpRight className="size-3.5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      )}

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
                "flex w-full items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
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
              <div className="ml-3 pl-2.5  space-y-0.5 pt-0.5">
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
                          ? "bg-primary text-primary-foreground font-bold "
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
      {/* ── 1. BARRA LATERAL CANÔNICA DO WORKSPACE (SEM SIDEBAR ANTIGA/GLOBAL RAIL) ── */}
      <aside className="hidden lg:flex flex-col w-[250px] shrink-0 h-screen sticky top-0  bg-background py-4 px-3 justify-between select-none">
        <div className="space-y-4">
          {/* Seletor de Loja Ativa (Store Switcher) */}
          <div className="px-1">
            {memberships.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={isSwitching}
                    className="flex w-full items-center justify-between p-2 rounded-2xl  bg-card hover:bg-muted/70 transition-all text-left group cursor-pointer "
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Store className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                          Loja Ativa
                        </span>
                        <h2 className="text-xs font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                          {activeStore?.name || "Minha Loja"}
                        </h2>
                      </div>
                    </div>
                    <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-[230px] rounded-2xl p-1.5 border-border ">
                  <DropdownMenuLabel className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Alternar Workspace
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {memberships.map((m) => {
                    const isCurrent = m.store_id === activeStore?.store_id;
                    return (
                      <DropdownMenuItem
                        key={m.store_id}
                        onClick={() => handleSwitchStore(m.store_id)}
                        className="rounded-2xl cursor-pointer text-sm flex items-center justify-between py-2.5 px-3"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {m.logo_url ? (
                            <img
                              src={m.logo_url}
                              alt={m.name}
                              className="size-6 rounded-lg object-cover  shrink-0 bg-muted"
                            />
                          ) : (
                            <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                              {m.name ? m.name.slice(0, 2).toUpperCase() : "LJ"}
                            </div>
                          )}
                          <span className={cn("truncate", isCurrent ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                            {m.name || "Loja"}
                          </span>
                        </div>
                        {isCurrent && <Check className="size-4 text-primary shrink-0 ml-1" />}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-sm py-2 px-3 font-semibold text-primary">
                    <Link to="/workspace/lojas">Gerenciar Todas as Lojas</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-sm py-2 px-3 font-medium text-muted-foreground">
                    <Link to="/criar-negocio">Cadastrar Nova Loja</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2.5 p-2 rounded-2xl  bg-card">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Store className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary block">
                    Workspace
                  </span>
                  <h2 className="text-xs font-bold text-foreground truncate leading-tight">
                    {activeStore?.name || "Wider Matriz"}
                  </h2>
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100vh-170px)] pr-2">
            <NavLinks />
          </ScrollArea>
        </div>

        {/* Ações de Rodapé da Sidebar */}
        <div className="pt-3 space-y-1.5">
          {(() => {
            const storeData = activeStore?.store || activeStore;
            const storeSlug = storeData?.slug || storeData?.store_slug || activeStoreId;
            const contextualAction = getStoreContextualAction(storeData);
            const ActionIcon = contextualAction.icon;

            return (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-between h-9 px-3 text-xs font-bold rounded-xl border-border bg-card hover:bg-muted"
              >
                <Link
                  to="/perfil-da-loja"
                  search={{ slug: storeSlug, aba: contextualAction.aba }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-2">
                    <ActionIcon className="size-3.5 text-primary" />
                    <span>{contextualAction.label}</span>
                  </div>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </Link>
              </Button>
            );
          })()}

          {/* Retorno ao Perfil Pessoal */}
          <button
            type="button"
            onClick={() => requestSwitchToPersonal("/conta")}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <UserCircle className="size-4 text-muted-foreground" />
              <span>Voltar ao Super App</span>
            </div>
            <ArrowRightLeft className="size-3 text-muted-foreground/70" />
          </button>
        </div>
      </aside>

      {/* ── 2. ÁREA PRINCIPAL COM HEADER OPERACIONAL DEDICADO ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <header className="h-14  bg-background/90 backdrop-blur-md px-4 md:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8 rounded-xl">
                    <Sliders className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-4">
                  <div className="space-y-4">
                    <div className="font-bold text-sm text-foreground">Menu Operacional</div>
                    <ScrollArea className="h-[calc(100vh-100px)] pr-2">
                      <NavLinks />
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
                Workspace
              </span>
              <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                ● {activeStore?.name || "Wider Matriz"}
              </Badge>
            </div>
          </div>

          {/* Ações do Header do Workspace */}
          <div className="flex items-center gap-2.5">
            {/* Botão Contextual da Loja Pública (Cardápio / Loja Online) */}
            {(() => {
              const storeData = activeStore?.store || activeStore;
              const storeSlug = storeData?.slug || storeData?.store_slug || activeStoreId;
              const contextualAction = getStoreContextualAction(storeData);
              const ActionIcon = contextualAction.icon;

              return (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl text-xs font-bold gap-1.5 hidden md:inline-flex border-border bg-card hover:bg-muted"
                >
                  <Link
                    to="/perfil-da-loja"
                    search={{ slug: storeSlug, aba: contextualAction.aba }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ActionIcon className="size-3.5 text-primary" />
                    <span>{contextualAction.label}</span>
                    <ExternalLink className="size-3 text-muted-foreground ml-0.5" />
                  </Link>
                </Button>
              );
            })()}

            {/* Botão Painel Global Master para Platform Admin */}
            {isPlatformAdmin && (
              <Button
                asChild
                size="sm"
                className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 via-primary to-indigo-600 text-white hover:opacity-95 shadow-xs cursor-pointer"
              >
                <Link to="/admin-master">
                  <ShieldAlert className="size-3.5" />
                  <span>Painel Global Master</span>
                </Link>
              </Button>
            )}

            {/* Frente de Caixa Rápido (PDV) */}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 rounded-xl text-xs font-bold gap-1.5 hidden sm:inline-flex border-border bg-card hover:bg-muted"
            >
              <Link to="/workspace/pdv">
                <Store className="size-3.5 text-primary" />
                <span>Frente de Caixa (PDV)</span>
              </Link>
            </Button>

            {/* Menu do Operador com Troca de Contexto Protegida */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 pl-2.5 rounded-xl  bg-card hover:bg-muted/80 transition-all cursor-pointer "
                >
                  <span className="text-xs font-bold text-foreground max-w-[120px] truncate hidden md:inline-block">
                    {userDisplayName}
                  </span>
                  <Avatar className="size-7 rounded-lg">
                    <AvatarImage src="" alt={userDisplayName} />
                    <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 border-border ">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <p className="text-xs font-bold text-foreground truncate">{userDisplayName}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{session?.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Operando: {activeStore?.name || "Loja"}
                  </span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                  <Link to="/workspace/configuracoes">
                    <Settings className="size-3.5 mr-2 text-muted-foreground" />
                    <span>Configurações da Loja</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                  <Link to="/workspace/lojas">
                    <Building2 className="size-3.5 mr-2 text-muted-foreground" />
                    <span>Trocar de Unidade / Loja</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Alternância Protegida para Perfil Pessoal */}
                <DropdownMenuItem
                  onClick={() => requestSwitchToPersonal("/conta")}
                  className="rounded-xl cursor-pointer text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <UserCircle className="size-3.5 text-primary" />
                    <span>Alternar para Perfil Pessoal</span>
                  </div>
                  <ArrowRightLeft className="size-3 text-muted-foreground" />
                </DropdownMenuItem>

                {(() => {
                  const storeData = activeStore?.store || activeStore;
                  const storeSlug = storeData?.slug || storeData?.store_slug || activeStoreId;
                  const contextualAction = getStoreContextualAction(storeData);
                  const ActionIcon = contextualAction.icon;

                  return (
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-semibold text-foreground flex items-center justify-between">
                      <Link
                        to="/perfil-da-loja"
                        search={{ slug: storeSlug, aba: contextualAction.aba }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2">
                          <ActionIcon className="size-3.5 text-primary" />
                          <span>{contextualAction.label}</span>
                        </div>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </Link>
                    </DropdownMenuItem>
                  );
                })()}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl cursor-pointer text-xs text-destructive focus:text-destructive"
                >
                  <LogOut className="size-3.5 mr-2" />
                  <span>Encerrar Sessão</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 w-full pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── 3. MODAL DE CONFIRMAÇÃO DE ALTERNÂNCIA DE CONTEXTO (PROTEÇÃO RIGOROSA) ── */}
      <Dialog open={showPersonalSwitchModal} onOpenChange={setShowPersonalSwitchModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl  bg-background ">
          <DialogHeader className="p-6 pb-4  bg-muted/20">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 border border-primary/20">
              <ArrowRightLeft className="size-5" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight text-foreground">
              Alternar para Perfil Pessoal?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Você está prestes a sair do ambiente operacional da loja.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4 text-xs">
            {/* Box informativo de transição de identidade */}
            <div className="rounded-2xl  bg-muted/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Ambiente Atual:</span>
                <span className="font-bold text-foreground">Loja {activeStore?.name || "Matriz"}</span>
              </div>
              <div className="h-px bg-border/60" />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Destino:</span>
                <span className="font-bold text-primary">Perfil Pessoal ({userDisplayName})</span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Deseja confirmar a alternância de identidade para o perfil pessoal de <strong>{userDisplayName}</strong>?
            </p>
          </div>

          <DialogFooter className="p-4 bg-muted/20  flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPersonalSwitchModal(false)}
              className="rounded-xl text-xs font-bold"
            >
              Permanecer no Painel
            </Button>
            <Button
              type="button"
              onClick={confirmSwitchToPersonal}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Check className="size-3.5" />
              <span>Sim, alternar para {userDisplayName}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
