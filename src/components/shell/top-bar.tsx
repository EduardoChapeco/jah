import { Link, useLocation } from "@tanstack/react-router";
import { GLOBAL_DESTINATIONS } from "@/lib/navigation-registry";
import { LocationMasterPill } from "@/components/location/location-master-pill";
import { Flame, ShoppingBag, Calendar, Sparkles, Utensils, Scissors, Compass } from "lucide-react";

const MOBILE_QUICK_CHIPS = [
  { to: "/mercado?niche=ofertas", label: "⚡ Ofertas", icon: Flame },
  { to: "/mercado?niche=gastronomia", label: "🍔 Gastronomia", icon: Utensils },
  { to: "/mercado", label: "🛍️ Mercado", icon: ShoppingBag },
  { to: "/agenda", label: "📅 Eventos", icon: Calendar },
  { to: "/mercado?niche=beleza", label: "✂️ Beleza", icon: Scissors },
  { to: "/mercado?niche=viagens", label: "✈️ Viagens", icon: Compass },
];

export function TopBar() {
  const location = useLocation();

  const isCurrentActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-md border-b border-border/80 select-none">
      {/* ── Camada 1: Topo Principal (Logo + Localização + Utility) ── */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* 1. Logo Jah & Location Pill */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/"
            className="font-display font-black text-2xl tracking-tight text-foreground hover:opacity-90 transition-opacity shrink-0"
          >
            Jah
          </Link>

          {/* Master Location Pill with Long Press GPS / Click Modal */}
          <LocationMasterPill />
        </div>

        {/* 2. Links Centrais em Pílula (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1.5 mx-auto">
          {GLOBAL_DESTINATIONS.map((item) => {
            const active = isCurrentActive(item);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? "bg-zinc-100 dark:bg-zinc-800 text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. Espaço reservado para o UtilityCluster no Desktop */}
        <div className="w-28 hidden lg:block" />
      </div>

      {/* ── Camada 2: Sub-header Mobile de Hotpages & Atalhos (Estilo Facebook) ── */}
      <div className="lg:hidden flex items-center gap-1.5 px-4 py-1.5 overflow-x-auto scrollbar-none border-t border-border/40 bg-muted/20">
        {MOBILE_QUICK_CHIPS.map((chip) => {
          const isSelected =
            location.pathname.startsWith(chip.to.split("?")[0]) &&
            (chip.to.includes("?") ? location.searchStr.includes(chip.to.split("?")[1]) : true);

          return (
            <Link
              key={chip.label}
              to={chip.to as any}
              className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
