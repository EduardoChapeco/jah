import { Link, useLocation } from "@tanstack/react-router";
import { type ContextConfig } from "@/lib/navigation-registry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishSheet } from "@/components/commerce/publish-sheet";
import {
  Home,
  MapPin,
  ShoppingBag,
  Calendar,
  Compass,
  User,
  Plus,
  Sparkles,
  Flame,
  Tag,
  Bookmark,
} from "lucide-react";

export interface ContextSidebarProps {
  config: ContextConfig;
}

export function ContextSidebar({ config }: ContextSidebarProps) {
  const location = useLocation();

  // Rotas canônicas principais para a navegação contextual
  const NAV_ITEMS = [
    { to: "/", label: "Mural", icon: Home, exact: true },
    { to: "/mapa", label: "Mapa & Moments", icon: MapPin },
    { to: "/mercado", label: "Mercado", icon: ShoppingBag },
    { to: "/agenda", label: "Eventos", icon: Calendar },
    { to: "/diretorio", label: "Diretório", icon: Compass },
    { to: "/conta", label: "Minha Conta", icon: User },
  ];

  const isCurrentActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 py-6 px-4 bg-background border-r border-border/80 justify-between select-none overflow-y-auto scrollbar-none z-20">
      {/* ── 1. Lista de Navegação Contextual com Botões Maiores ── */}
      <div className="space-y-6">
        <nav className="flex flex-col space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-zinc-100 dark:bg-zinc-800 text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon
                  className={`size-4.5 shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── 2. Botão de Ação Primária (+ PUBLICAR) ─────────────── */}
      <div className="pt-4 border-t border-border/60">
        <PublishSheet />
      </div>
    </aside>
  );
}
