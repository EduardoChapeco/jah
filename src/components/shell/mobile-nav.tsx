import { Link, useLocation } from "@tanstack/react-router";
import { Home, MapPin, ShoppingBag, User, Plus } from "lucide-react";
import { PublishSheet } from "@/components/commerce/publish-sheet";

export interface MobileNavProps {
  session?: any;
}

export function MobileNav({ session }: MobileNavProps) {
  const location = useLocation();

  const isHome = location.pathname === "/";
  const isMap = location.pathname.startsWith("/mapa");
  const isMarket = location.pathname.startsWith("/mercado");
  const isAccount = location.pathname.startsWith("/conta");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-md border-t border-border/80 z-40 flex items-center justify-around px-2 pb-safe select-none">
      {/* 1. Mural */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
          isHome ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Home className="size-5" />
        <span>Mural</span>
      </Link>

      {/* 2. Mapa */}
      <Link
        to="/mapa"
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
          isMap ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MapPin className="size-5" />
        <span>Mapa</span>
      </Link>

      {/* 3. Center Create Action */}
      <div className="-mt-4 flex items-center justify-center">
        <PublishSheet />
      </div>

      {/* 4. Mercado */}
      <Link
        to="/mercado"
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
          isMarket ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ShoppingBag className="size-5" />
        <span>Mercado</span>
      </Link>

      {/* 5. Conta */}
      <Link
        to="/conta"
        className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
          isAccount ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="size-5" />
        <span>Conta</span>
      </Link>
    </nav>
  );
}
