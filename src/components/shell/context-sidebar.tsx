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
} from "lucide-react";

export interface ContextSidebarProps {
  config: ContextConfig;
}

const PRIMARY_DESTINATIONS = [
  { to: "/", label: "Início (Mercado)", icon: Home, exact: true },
  { to: "/mural", label: "Mural Social", icon: MessageSquare },
  { to: "/mercado", label: "Catálogo Geral", icon: ShoppingBag },
  { to: "/mapa", label: "Mapa & Moments", icon: MapPin },
  { to: "/agenda", label: "Eventos & Agenda", icon: Calendar },
  { to: "/diretorio", label: "Guia & Diretório", icon: Compass },
];

const CATEGORY_NICHES = [
  { to: "/mercado?niche=ofertas", label: "⚡ Ofertas Relâmpago", icon: Flame },
  { to: "/mercado?niche=gastronomia", label: "🍔 Gastronomia", icon: Utensils },
  { to: "/mercado?niche=mercado", label: "🛍️ Mercado & Horti", icon: Store },
  { to: "/mercado?niche=beleza", label: "✂️ Beleza & Estética", icon: Scissors },
  { to: "/mercado?niche=empregos", label: "💼 Vagas & Empregos", icon: Briefcase },
  { to: "/mercado?niche=viagens", label: "✈️ Viagens & Lazer", icon: Plane },
  { to: "/conta/classificados", label: "🏷️ Classificados", icon: Tag },
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
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 py-6 px-4 bg-background border-r border-border/80 justify-between select-none overflow-y-auto scrollbar-none z-20">
      <div className="space-y-6">
        {/* 1. Módulos Principais */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon
                    className={`size-4 shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. Categorias & Nichos */}
        <div className="space-y-1 pt-2 border-t border-border/60">
          <span className="px-3 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
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
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary/10 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 3. Minha Área */}
        <div className="space-y-1 pt-2 border-t border-border/60">
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
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Botão de Ação Primária (+ PUBLICAR) ─────────────── */}
      <div className="pt-4 border-t border-border/60">
        <PublishSheet />
      </div>
    </aside>
  );
}

