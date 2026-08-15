import { Link, useLocation } from "@tanstack/react-router";
import { LocationMasterPill } from "@/components/location/location-master-pill";
import { Flame, ShoppingBag, Calendar, Sparkles, Utensils, Scissors, Compass, Search } from "lucide-react";

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

        {/* 2. Barra de Busca Global Inteligente no Desktop (Sem duplicação de botões do sidebar) */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-6">
          <Link
            to="/buscar"
            className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium border border-border/60 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Buscar produtos, lojas, serviços e desapegos...</span>
            </div>
            <kbd className="hidden xl:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground bg-background rounded-md border border-border shadow-2xs">
              ⌘K
            </kbd>
          </Link>
        </div>

        {/* 3. Espaço reservado para o UtilityCluster no Desktop */}
        <div className="w-28 hidden lg:block shrink-0" />
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
