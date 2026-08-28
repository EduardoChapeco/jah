import { Link, useLocation } from "@tanstack/react-router";
import { type ContextConfig } from "@/lib/navigation-registry";
import { PublishSheet } from "@/components/commerce/publish-sheet";
import {
  House,
  ChatCenteredText,
  NewspaperClipping,
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
  Broom,
  Books,
} from "@phosphor-icons/react";

export interface ContextSidebarProps {
  config: ContextConfig;
  session?: any;
}

// ── 1. Módulos Principais de Descoberta (Explorar) ──
const PRIMARY_DESTINATIONS = [
  { to: "/", label: "Início", icon: House, exact: true },
  { to: "/mural", label: "Feed", icon: ChatCenteredText, exact: true },
  { to: "/noticias", label: "Notícias", icon: NewspaperClipping },
  { to: "/mercado", label: "Mercado", icon: Storefront, exact: true },
  { to: "/classificados", label: "Classificados", icon: Tag, exact: true },
  { to: "/mapa", label: "Moments", icon: MapPin, exact: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDots, exact: true },
  { to: "/agendar", label: "Agendamentos", icon: Scissors, exact: true },
  { to: "/turismo", label: "Turismo", icon: AirplaneTilt, exact: true },
  { to: "/empregos", label: "Empregos", icon: Briefcase, exact: true },
  { to: "/diretorio", label: "Guia & Diretório", icon: Compass, exact: true },
  { to: "/mobilidade", label: "Mobilidade", icon: CarProfile, exact: true },
];

// ── 2. Categorias Master & Nichos de Alto Consumo (16 Verticais Canônicas) ──
const CATEGORY_NICHES = [
  { to: "/gastronomia", label: "Gastronomia & Delivery", icon: ForkKnife },
  { to: "/mercado", label: "Mercado & Hortifrúti", icon: ShoppingBag },
  { to: "/farmacia", label: "Farmácia & Saúde", icon: Heartbeat },
  { to: "/bebidas", label: "Bebidas & Adega", icon: BeerBottle },
  { to: "/acougue", label: "Açougue & Carnes", icon: Flame },
  { to: "/moda", label: "Moda & Vestuário", icon: TShirt },
  { to: "/eletronicos", label: "Eletrônicos & Tech", icon: Laptop },
  { to: "/pet", label: "Pet Shop & Veterinária", icon: Bone },
  { to: "/servicos", label: "Serviços Especializados", icon: Briefcase },
  { to: "/imoveis", label: "Imóveis & Aluguel", icon: Buildings },
  { to: "/construcao", label: "Construção & Casa", icon: Hammer },
  { to: "/casa", label: "Móveis & Decoração", icon: Armchair },
  { to: "/beleza", label: "Beleza & Estética", icon: Scissors },
  { to: "/limpeza", label: "Limpeza & Higiene", icon: Broom },
  { to: "/livros", label: "Livros & Papelaria", icon: Books },
  { to: "/ofertas", label: "Ofertas Relâmpago", icon: Flame },
];

// ── 3. Painel Pessoal (Exibido apenas para autenticados) ──
const USER_DESTINATIONS = [
  { to: "/conta", label: "Minha Conta", icon: User, exact: true },
  { to: "/conta/salvos", label: "Itens Salvos", icon: BookmarkSimple, exact: true },
];

export function ContextSidebar({ config, session }: ContextSidebarProps) {
  const location = useLocation();
  const isAuthenticated = Boolean(session?.user || session?.id);

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
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full py-4 px-3 bg-background justify-between select-none overflow-y-auto scrollbar-none z-20">
      <div className="space-y-4">
        {/* 1. Módulos Principais */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70">
            Explorar
          </span>
          <nav className="flex flex-col space-y-1 pt-1">
            {PRIMARY_DESTINATIONS.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-3 h-9 px-3 rounded-xl text-xs transition-all cursor-pointer group ${
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <Icon
                    size={17}
                    weight={active ? "fill" : "regular"}
                    className={`shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. Categorias Master & Nichos */}
        <div className="space-y-1 pt-2">
          <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70">
            Categorias
          </span>
          <nav className="flex flex-col space-y-1 pt-1">
            {CATEGORY_NICHES.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-3 h-9 px-3 rounded-xl text-xs transition-all cursor-pointer group ${
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <Icon
                    size={17}
                    weight={active ? "fill" : "regular"}
                    className={`shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. Área Pessoal — Renderizada somente se autenticado */}
        {isAuthenticated && (
          <div className="space-y-1 pt-2">
            <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70">
              Pessoal
            </span>
            <nav className="flex flex-col space-y-1 pt-1">
              {USER_DESTINATIONS.map((item) => {
                const Icon = item.icon;
                const active = isCurrentActive(item);

                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={`flex items-center gap-3 h-9 px-3 rounded-xl text-xs transition-all cursor-pointer group ${
                      active
                        ? "bg-primary/10 text-primary font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                    }`}
                  >
                    <Icon
                      size={17}
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

      {/* 4. Ação Principal Flutuante / Publicar */}
      <div className="pt-3 mt-3">
        <PublishSheet />
      </div>
    </aside>
  );
}
