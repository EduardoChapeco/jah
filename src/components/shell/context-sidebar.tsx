import { Link, useLocation } from "@tanstack/react-router";
import { type ContextConfig } from "@/lib/navigation-registry";
import { PublishSheet } from "@/components/commerce/publish-sheet";
import {
  Home,
  MessageSquare,
  Newspaper,
  ShoppingBag,
  Tag,
  MapPin,
  Calendar,
  Plane,
  Briefcase,
  Car,
  KeyRound,
  Shirt,
  Compass,
  Utensils,
  Store,
  HeartPulse,
  Coffee,
  Scissors,
  CarFront,
  Building2,
  Wrench,
  Flame,
  User,
  Bookmark,
} from "lucide-react";

export interface ContextSidebarProps {
  config: ContextConfig;
}

// ── 1. Módulos Principais de Descoberta (Explorar) ──
const PRIMARY_DESTINATIONS = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/mural", label: "Feed", icon: MessageSquare },
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/mercado", label: "Marketplace", icon: ShoppingBag, exact: true },
  { to: "/classificados", label: "Classificados", icon: Tag, exact: true },
  { to: "/mapa", label: "Moments", icon: MapPin },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/turismo", label: "Turismo", icon: Plane },
  { to: "/empregos", label: "Empregos", icon: Briefcase },
  { to: "/mobilidade", label: "Mobilidade", icon: Car },
  { to: "/mercado?niche=aluguel", label: "Alugue", icon: KeyRound },
  { to: "/mercado?niche=moda", label: "Roupas & Moda", icon: Shirt },
  { to: "/diretorio", label: "Guia & Diretório", icon: Compass },
];

// ── 2. Categorias Master & Nichos de Alto Consumo ──
const CATEGORY_NICHES = [
  { to: "/mercado?niche=gastronomia", label: "Gastronomia & Delivery", icon: Utensils },
  { to: "/mercado?niche=mercado", label: "Mercado & Hortifruti", icon: Store },
  { to: "/mercado?niche=farmacia", label: "Farmácia & Saúde", icon: HeartPulse },
  { to: "/mercado?niche=conveniencia", label: "Conveniência & Bebidas", icon: Coffee },
  { to: "/mercado?niche=beleza", label: "Beleza & Estética", icon: Scissors },
  { to: "/classificados?categoria=veiculos", label: "Veículos (Auto)", icon: CarFront },
  { to: "/classificados?categoria=imoveis", label: "Imóveis", icon: Building2 },
  { to: "/diretorio", label: "Prestadores de Serviços", icon: Wrench },
  { to: "/mercado?niche=ofertas", label: "Ofertas Relâmpago", icon: Flame },
];

// ── 3. Painel Pessoal ──
const USER_DESTINATIONS = [
  { to: "/conta", label: "Minha Conta", icon: User, exact: true },
  { to: "/conta/salvos", label: "Itens Salvos", icon: Bookmark },
];

export function ContextSidebar({ config }: ContextSidebarProps) {
  const location = useLocation();

  const isCurrentActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.to && !location.searchStr;
    }
    if (item.to.includes("?")) {
      const [base, query] = item.to.split("?");
      return location.pathname === base && location.searchStr.includes(query);
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 py-5 px-3.5 bg-background justify-between select-none overflow-y-auto scrollbar-none z-20 border-r border-border/40">
      <div className="space-y-5">
        {/* 1. Módulos Principais (Botões Grandes Squircle Inflados) */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/80">
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
                  className={`flex items-center gap-3 h-10.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-foreground text-background shadow-xs font-bold scale-[1.01]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${active ? "text-background" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. Categorias Master & Nichos */}
        <div className="space-y-1 pt-3 border-t border-border/60">
          <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/80">
            Categorias
          </span>
          <nav className="flex flex-col space-y-0.5 pt-1">
            {CATEGORY_NICHES.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-3 h-9 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-foreground text-background shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${active ? "text-background" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. Área Pessoal */}
        <div className="space-y-1 pt-2 border-t border-border/60">
          <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/80">
            Pessoal
          </span>
          <nav className="flex flex-col space-y-0.5 pt-1">
            {USER_DESTINATIONS.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-3 h-9 px-3.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-foreground text-background shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${active ? "text-background" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 4. Ação Principal Flutuante / Publicar */}
      <div className="pt-4 border-t border-border/60 mt-4">
        <PublishSheet />
      </div>
    </aside>
  );
}
