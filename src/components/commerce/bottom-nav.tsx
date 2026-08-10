import { Link } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, User, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function BottomNav({ storeType }: { storeType?: string }) {
  // Configuração dinâmica das abas (Tabs) baseada no tipo da loja PWA
  const items = [
    { to: "/", label: "Mural", icon: Home, exact: true },
  ];

  if (storeType === "event_producer") {
    items.push({ to: "/agenda", label: "Agenda", icon: LayoutGrid, exact: false });
  } else if (storeType === "band" || storeType === "creator") {
    items.push({ to: "/perfil-da-loja", label: "Portfólio", icon: LayoutGrid, exact: false });
    items.push({ to: "/mercado", label: "Loja", icon: ShoppingBag, exact: false });
  } else {
    items.push({ to: "/mercado", label: "Catálogo", icon: LayoutGrid, exact: false });
  }

  items.push({ to: "/buscar", label: "Buscar", icon: Search, exact: false });
  
  // A Sacola é controlada via SlideOut no Header, mas mantemos atalho no BottomNav
  items.push({ to: "/conta", label: "Conta", icon: User, exact: false });
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-safe md:hidden"
    >
      <ul className="mx-auto flex max-w-screen-sm items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-2 text-nav font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Canonical alias (see COMPONENT_CATALOG.md). */
export const MobileBottomNav = BottomNav;
