import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Logo } from "@/components/commerce/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useCartContext } from "@/lib/cart-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const FALLBACK_NAV = [
  { url: "/", label: "Mural" },
  { url: "/agenda", label: "Agenda" },
  { url: "/mercado", label: "Mercado" },
  { url: "/diretorio", label: "Diretório" },
];

export function PublicHeader({
  menuItems = [],
  storeName,
  logoUrl,

  hideNameWithLogo = false,
}: {
  menuItems?: any[];
  storeName?: string;
  logoUrl?: string;

  hideNameWithLogo?: boolean;
}) {
  const navItems = menuItems.length > 0 ? menuItems : FALLBACK_NAV;
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { cart: contextCart, setIsCartOpen } = useCartContext();

  // Auto-focus search input when it opens
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate({ to: "/buscar", search: { q: searchQuery.trim() } });
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const totalItemCount = contextCart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 border-b-4 border-ink bg-paper pt-safe">
      <div className="mx-auto flex h-20 max-w-screen-xl items-center gap-4 px-4 md:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden shrink-0 border-2 border-ink shadow-hard hover-lift"
              aria-label="Abrir menu"
            >
              <Menu className="size-6 text-ink" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-paper border-r-4 border-ink p-6">
            <SheetHeader className="border-b-4 border-ink pb-4 mb-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo src={logoUrl} className="h-10" />
            </SheetHeader>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className="px-4 py-3 text-lg font-display uppercase tracking-wider text-ink border-2 border-transparent hover:border-ink hover:shadow-hard hover-lift transition-all"
                  activeProps={{ className: "bg-directory-yellow border-ink shadow-hard font-bold" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="flex items-center gap-3 shrink-0 hover-lift"
          aria-label={`${storeName || "Jah"} — início`}
        >
          <Logo src={logoUrl} className="max-h-12 w-auto h-auto" />
          {logoUrl && storeName && !hideNameWithLogo && (
            <span className="font-display font-bold text-2xl tracking-tighter uppercase text-ink hidden lg:inline-block">
              {storeName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-8 hidden items-center gap-3 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className="px-4 py-2 text-sm font-bold font-display uppercase tracking-wider text-ink border-2 border-transparent hover:border-ink hover:bg-paper hover:shadow-[2px_2px_0px_0px_#121212] transition-all -rotate-1 hover:rotate-0"
              activeProps={{ className: "bg-directory-yellow border-ink shadow-[2px_2px_0px_0px_#121212] rotate-0" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 flex-1 justify-end">
          {/* Expandable Search */}
          <div
            className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? "w-full max-w-[280px] opacity-100 mr-2" : "w-0 opacity-0 md:w-0 md:opacity-0"}`}
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-9 pl-9 pr-8 rounded-full border-border bg-accent/50 focus-visible:bg-background transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="size-3.5" />
              </button>
            </form>
          </div>

          {/* Search Trigger (hidden when search is open) */}
          {!isSearchOpen && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar"
              className="shrink-0 border-2 border-ink shadow-sm hover-lift"
            >
              <Search className="size-5 text-ink" aria-hidden />
            </Button>
          )}

          <ThemeToggle className="shrink-0 border-2 border-ink shadow-sm hover-lift" />

          <Button variant="outline" size="icon" asChild aria-label="Minha conta" className="shrink-0 border-2 border-ink shadow-sm hover-lift">
            <Link to="/conta">
              <User className="size-5 text-ink" aria-hidden />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCartOpen(true)}
            aria-label="Carrinho"
            className="relative shrink-0 border-2 border-ink shadow-sm hover-lift bg-directory-yellow text-ink"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {totalItemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-none border-2 border-ink bg-poster-red text-xs font-bold text-ivory shadow-[2px_2px_0px_0px_#121212] rotate-6">
                {totalItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
