import { useState, useMemo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { type ContextConfig } from "@/lib/navigation-registry";
import { PublishSheet } from "@/components/commerce/publish-sheet";
import {
  House,
  ChatCenteredText,
  Storefront,
  Tag,
  MapPin,
  CalendarDots,
  AirplaneTilt,
  Briefcase,
  CarProfile,
  TShirt,
  Compass,
  ForkKnife,
  ShoppingBag,
  Heartbeat,
  BeerBottle,
  Scissors,
  Buildings,
  Flame,
  User,
  BookmarkSimple,
  Laptop,
  Bone,
  Hammer,
  Armchair,
  FilmStrip,
  CaretDown,
  CaretRight,
  ChatCircleDots,
  Package,
  Ticket,
  ArrowSquareOut,
} from "@phosphor-icons/react";

export interface ContextSidebarProps {
  config: ContextConfig;
  session?: any;
}

// ── 1. Módulos Principais (1 Palavra Canônica) ──
const MAIN_EXPLORER_ITEMS = [
  { to: "/", label: "Início", icon: House, exact: true },
  { to: "/mural", label: "Feed", icon: ChatCenteredText, exact: true },
  { to: "/mapa", label: "Moments", icon: Flame, exact: true },
  { to: "/mobilidade", label: "Mobilidade", icon: CarProfile, exact: true },
  { to: "/classificados", label: "Classificados", icon: Tag, exact: true },
];

// ── 2. Sub-Marketplaces Verticais (1 Palavra Comercial) ──
const SUB_MARKETPLACES = [
  { to: "/gastronomia", label: "Comida", icon: ForkKnife },
  { to: "/mercado", label: "Mercado", icon: ShoppingBag },
  { to: "/farmacia", label: "Farmácia", icon: Heartbeat },
  { to: "/bebidas", label: "Bebidas", icon: BeerBottle },
  { to: "/acougue", label: "Carnes", icon: Flame },
  { to: "/moda", label: "Moda", icon: TShirt },
  { to: "/pet", label: "Pet", icon: Bone },
  { to: "/eletronicos", label: "Tech", icon: Laptop },
  { to: "/casa", label: "Casa", icon: Armchair },
  { to: "/construcao", label: "Construção", icon: Hammer },
  { to: "/servicos", label: "Serviços", icon: Briefcase },
  { to: "/imoveis", label: "Imóveis", icon: Buildings },
  { to: "/beleza", label: "Beleza", icon: Scissors },
  { to: "/ofertas", label: "Ofertas", icon: Flame },
];

// ── 3. Serviços & Utilidades (1 Palavra) ──
const UTILITY_ITEMS = [
  { to: "/agendar", label: "Agendar", icon: Scissors, exact: true },
  { to: "/turismo", label: "Turismo", icon: AirplaneTilt, exact: true },
  { to: "/empregos", label: "Empregos", icon: Briefcase, exact: true },
  { to: "/diretorio", label: "Guia", icon: Compass, exact: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDots, exact: true },
  { to: "/workspace/estudio", label: "Studio", icon: FilmStrip, exact: true },
];

// ── 4. Painel Pessoal & Social (1 Palavra) ──
const USER_NAV_ITEMS = [
  { to: "/conta/conversas", label: "Conversas", icon: ChatCircleDots, exact: true },
  { to: "/conta/salvos", label: "Salvos", icon: BookmarkSimple, exact: true },
  { to: "/conta/pedidos", label: "Pedidos", icon: Package, exact: true },
  { to: "/conta/pedidos?tab=ingressos", label: "Ingressos", icon: Ticket },
  { to: "/conta/pacotes", label: "Agendamentos", icon: Scissors },
  { to: "/conta/perfil", label: "Perfil", icon: User, exact: true },
];

export function ContextSidebar({ config, session }: ContextSidebarProps) {
  const location = useLocation();
  const isAuthenticated = Boolean(session?.user || session?.id);
  const memberships = (session?.memberships as any[]) || [];
  const hasStore = memberships.length > 0;

  // Detecta se a rota atual é um sub-marketplace
  const isInsideMarketplace = useMemo(() => {
    return SUB_MARKETPLACES.some((sub) => location.pathname.startsWith(sub.to));
  }, [location.pathname]);

  const [isMarketplacesOpen, setIsMarketplacesOpen] = useState(isInsideMarketplace);

  if (config?.showContextSidebar === false) {
    return null;
  }

  const isCurrentActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.to && (!item.to.includes("?") ? !location.searchStr : true);
    }
    if (item.to.includes("?")) {
      const [base, query] = item.to.split("?");
      return location.pathname === base && (location.searchStr || "").includes(query);
    }
    return location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to + "/"));
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full py-3 px-2.5 bg-background justify-between select-none overflow-y-auto no-scrollbar z-20 border-r border-border/40">
      <div className="space-y-4">
        {/* ── 1. MÓDULOS PRINCIPAIS ── */}
        <div className="space-y-0.5">
          <span className="px-2.5 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70">
            Explorar
          </span>
          <nav className="flex flex-col space-y-0.5 pt-1">
            {MAIN_EXPLORER_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-2.5 h-8.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <Icon
                    size={16}
                    weight={active ? "fill" : "regular"}
                    className={`shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {/* ── MARKETPLACES (Hub Expansível com 14 Sub-Marketplaces) ── */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setIsMarketplacesOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between h-8.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                  isInsideMarketplace
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Storefront
                    size={16}
                    weight={isInsideMarketplace ? "fill" : "regular"}
                    className={isInsideMarketplace ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                  />
                  <span className="truncate">Marketplaces</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted/80 text-muted-foreground font-semibold">
                    14
                  </span>
                  {isMarketplacesOpen ? (
                    <CaretDown size={12} className="text-muted-foreground" />
                  ) : (
                    <CaretRight size={12} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Sub-Marketplaces em Grid Compacto e Limpo */}
              {isMarketplacesOpen && (
                <div className="grid grid-cols-2 gap-1 p-1.5 my-1 rounded-2xl bg-muted/30 border border-border/40 animate-in fade-in slide-in-from-top-1 duration-150">
                  {SUB_MARKETPLACES.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = location.pathname.startsWith(sub.to);

                    return (
                      <Link
                        key={sub.to}
                        to={sub.to as any}
                        className={`flex items-center gap-1.5 h-7 px-2 rounded-lg text-[11px] font-medium transition-all ${
                          isSubActive
                            ? "bg-foreground text-background font-bold shadow-2xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <SubIcon size={13} weight={isSubActive ? "fill" : "bold"} className="shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── DEMAIS SERVIÇOS & UTILIDADES ── */}
            {UTILITY_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-2.5 h-8.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <Icon
                    size={16}
                    weight={active ? "fill" : "regular"}
                    className={`shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── 2. PAINEL PESSOAL & REDE SOCIAL ── */}
        {isAuthenticated && (
          <div className="space-y-0.5 pt-1 border-t border-border/40">
            <span className="px-2.5 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70">
              Pessoal
            </span>

            {/* Atalho para Minhas Empresas (Se for lojista/empreendedor) */}
            {hasStore && (
              <div className="pt-1 pb-0.5">
                <Link
                  to="/workspace"
                  className="flex items-center justify-between h-8.5 px-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Storefront size={15} weight="fill" />
                    <span>Minhas Lojas</span>
                  </div>
                  <ArrowSquareOut size={13} className="text-primary/70 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}

            <nav className="flex flex-col space-y-0.5 pt-0.5">
              {USER_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item);

                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={`flex items-center gap-2.5 h-8.5 px-2.5 rounded-xl text-xs transition-all cursor-pointer group ${
                      active
                        ? "bg-primary/10 text-primary font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                    }`}
                  >
                    <Icon
                      size={16}
                      weight={active ? "fill" : "regular"}
                      className={`shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* ── 3. BOTÃO DE CRIAR & PUBLICAR ── */}
      <div className="pt-2">
        <PublishSheet />
      </div>
    </aside>
  );
}
