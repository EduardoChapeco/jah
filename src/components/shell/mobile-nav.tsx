import { Link, useLocation } from "@tanstack/react-router";
import { Home, MapPin, ShoppingBag, User, LogIn } from "lucide-react";
import { QuickCreateModal } from "@/components/commerce/quick-create-modal";
import { useCartContext } from "@/lib/cart-context";

export interface MobileNavProps {
  session?: any;
}

export function MobileNav({ session }: MobileNavProps) {
  const location = useLocation();
  const { setIsCartOpen, globalCarts } = useCartContext();
  const isAuthenticated = Boolean(session?.user || session?.id);

  const isHome = location.pathname === "/";
  const isMap = location.pathname.startsWith("/mapa");
  const isProfile =
    location.pathname.startsWith("/conta/perfil") ||
    location.pathname.startsWith("/membro/");

  const user = session?.user || session;
  const userAvatar = user?.user_metadata?.avatar_url || user?.avatar_url || "";
  const totalItemCount = globalCarts.reduce((acc, c) => acc + c.itemCount, 0);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/97 backdrop-blur-md border-t border-border/50 z-40 flex items-center justify-around px-1 select-none pb-safe">
      {/* 1. Início */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] flex-1 py-2 text-[10px] font-semibold transition-colors ${
          isHome ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Home className={`size-5 transition-transform ${isHome ? "scale-110" : ""}`} />
        <span>Início</span>
      </Link>

      {/* 2. Mapa */}
      <Link
        to="/mapa"
        className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] flex-1 py-2 text-[10px] font-semibold transition-colors ${
          isMap ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <MapPin className={`size-5 transition-transform ${isMap ? "scale-110" : ""}`} />
        <span>Mapa</span>
      </Link>

      {/* 3. Ação Central de Criação (FAB + Sheet) */}
      <div className="flex items-center justify-center flex-1 min-h-[56px]">
        <QuickCreateModal />
      </div>

      {/* 4. Sacola de Compras */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] flex-1 py-2 text-[10px] font-semibold transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
        aria-label="Abrir sacola de compras"
      >
        <div className="relative">
          <ShoppingBag className="size-5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center leading-none">
              {totalItemCount > 9 ? "9+" : totalItemCount}
            </span>
          )}
        </div>
        <span>Sacola</span>
      </button>

      {/* 5. Perfil / Entrar */}
      {isAuthenticated ? (
        <Link
          to="/conta/perfil"
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] flex-1 py-2 text-[10px] font-semibold transition-colors ${
            isProfile ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {userAvatar ? (
            <div
              className={`size-6 rounded-full overflow-hidden flex-shrink-0 ${
                isProfile
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : "ring-1 ring-border"
              }`}
            >
              <img src={userAvatar} alt="Perfil" className="size-full object-cover" />
            </div>
          ) : (
            <User className={`size-5 transition-transform ${isProfile ? "scale-110" : ""}`} />
          )}
          <span>Perfil</span>
        </Link>
      ) : (
        <Link
          to="/entrar"
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] flex-1 py-2 text-[10px] font-semibold transition-colors ${
            location.pathname.startsWith("/entrar") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <LogIn className="size-5" />
          <span>Entrar</span>
        </Link>
      )}
    </nav>
  );
}
