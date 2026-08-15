import { Link, useLocation } from "@tanstack/react-router";
import { type ContextConfig } from "@/lib/navigation-registry";
import { PublishSheet } from "@/components/commerce/publish-sheet";
import {
  Home,
  MessageSquare,
  MapPin,
  ShoppingBag,
  Calendar,
  Compass,
  User,
  Flame,
  Utensils,
  Store,
  Scissors,
  Briefcase,
  Plane,
  Tag,
  Bookmark,
  Newspaper,
  Car,
} from "lucide-react";

export interface ContextSidebarProps {
  config: ContextConfig;
}

const PRIMARY_DESTINATIONS = [
  { to: "/", label: "Início (Mercado)", icon: Home, exact: true },
  { to: "/mural", label: "Mural Social", icon: MessageSquare },
  { to: "/noticias", label: "Notícias & Mídia", icon: Newspaper },
  { to: "/mercado", label: "Catálogo Geral", icon: ShoppingBag },
  { to: "/mobilidade", label: "Mobilidade & Fretes", icon: Car },
  { to: "/mapa", label: "Mapa & Moments", icon: MapPin },
  { to: "/agenda", label: "Eventos & Agenda", icon: Calendar },
  { to: "/diretorio", label: "Guia & Diretório", icon: Compass },
];

const CATEGORY_NICHES = [
  { to: "/turismo", label: "Turismo & Lazer", icon: Plane },
  { to: "/empregos", label: "Vagas & Empregos", icon: Briefcase },
  { to: "/classificados", label: "Classificados", icon: Tag },
  { to: "/mercado?niche=ofertas", label: "Ofertas Relâmpago", icon: Flame },
  { to: "/mercado?niche=gastronomia", label: "Gastronomia", icon: Utensils },
  { to: "/mercado?niche=mercado", label: "Mercado & Horti", icon: Store },
  { to: "/mercado?niche=beleza", label: "Beleza & Estética", icon: Scissors },
];

const USER_DESTINATIONS = [
  { to: "/conta", label: "Minha Conta", icon: User, exact: true },
  { to: "/conta/salvos", label: "Itens Salvos", icon: Bookmark },
];

export function ContextSidebar({ config }: ContextSidebarProps) {
  const location = useLocation();

  const isCurrentActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    if (item.to.includes("?")) {
      const [base, query] = item.to.split("?");
      return location.pathname === base && location.searchStr.includes(query);
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 py-6 px-4 bg-background justify-between select-none overflow-y-auto scrollbar-none z-20">
      <div className="space-y-6">
        {/* 1. Módulos Principais */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
            Explorar
          </span>
          <nav className="flex flex-col space-y-0.5 pt-1">
            {PRIMARY_DESTINATIONS.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-foreground text-background shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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

        {/* 2. Categorias & Nichos */}
        <div className="space-y-1 pt-3 border-t border-border">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80">
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
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-foreground text-background shadow-2xs"
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

        {/* 3. Minha Área */}
        <div className="space-y-1 pt-2 border-t border-border">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
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
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-foreground text-background shadow-2xs"
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

      {/* ── Botão de Ação Primária (+ PUBLICAR) ─────────────── */}
      <div className="pt-4 border-t border-border">
        <PublishSheet />
      </div>
    </aside>
  );
}
