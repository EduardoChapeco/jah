import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  ShoppingBag,
  User,
  LogOut,
  LayoutDashboard,
  Bookmark,
  Tag,
  Store,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCartContext } from "@/lib/cart-context";
import { signOut } from "@/services/auth.functions";
import { setTenantContext } from "@/services/identity.functions";
import { toast } from "sonner";

export interface UtilityClusterProps {
  session?: any;
  embedded?: boolean;
  className?: string;
}

export function UtilityCluster({ session, embedded = false, className = "" }: UtilityClusterProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const { cart: contextCart, globalCarts, setIsCartOpen } = useCartContext();

  const totalItemCount =
    globalCarts && globalCarts.length > 0
      ? globalCarts.reduce((acc, c) => acc + (c.itemCount || 0), 0)
      : contextCart?.itemCount || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate({ to: "/buscar", search: { q: searchQuery.trim() } });
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSwitchStore = async (storeId: string) => {
    setIsSwitching(true);
    try {
      await setTenantContext({ data: { store_id: storeId } });
      // Seta cookie no cliente também para consistência imediata
      window.document.cookie = `jah_active_tenant=${storeId}; path=/; max-age=31536000; SameSite=Lax`;
      toast.success("Contexto alterado.");
      window.location.href = "/workspace";
    } catch {
      toast.error("Erro ao alternar espaço de trabalho.");
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sessão encerrada.");
      window.location.href = "/entrar";
    } catch {
      toast.error("Erro ao encerrar sessão.");
    }
  };

  const userInitial = session?.email?.charAt(0).toUpperCase() || "U";
  const userHandle = session?.email?.split("@")[0] || "membro";
  const memberships = (session?.memberships as any[]) || [];
  const activeStoreId = session?.store_id;

  return (
    <>
      <div
        className={
          embedded
            ? `flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-2 py-1 rounded-full border border-border/60 shadow-2xs shrink-0 ${className}`
            : `fixed top-3.5 right-4 md:right-8 z-40 flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/60 shadow-xs ${className}`
        }
      >
        {/* 1. Busca Rápida */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="size-7.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Buscar"
        >
          <Search className="size-3.5" />
        </Button>

        {/* 2. Sacola de Compras */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCartOpen(true)}
          className="size-7.5 rounded-full relative text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Sacola de Compras"
        >
          <ShoppingBag className="size-3.5" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-scale-in">
              {totalItemCount}
            </span>
          )}
        </Button>

        <div className="h-4 w-px bg-border/60 mx-0.5" />

        {/* 3. Perfil / Auth Menu */}
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="size-7 rounded-full overflow-hidden border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:scale-105"
              >
                <Avatar className="size-full">
                  <AvatarImage src="" alt={userHandle} />
                  <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl p-2 border-border shadow-xs"
            >
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <p className="text-xs font-bold text-foreground">@{userHandle}</p>
                <p className="text-[11px] text-muted-foreground truncate">{session.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Meus Espaços de Trabalho */}
              {memberships.length > 0 && (
                <>
                  <div className="px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Espaços de Trabalho
                    </span>
                  </div>
                  {memberships.map((m) => {
                    const isActive = m.store_id === activeStoreId;
                    return (
                      <DropdownMenuItem
                        key={m.store_id}
                        onClick={() => handleSwitchStore(m.store_id)}
                        disabled={isSwitching}
                        className="rounded-xl cursor-pointer text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Store className="size-3.5 text-primary shrink-0" />
                          <span className="truncate font-medium">{m.name || "Espaço"}</span>
                        </div>
                        {isActive && <Check className="size-3.5 text-primary shrink-0 ml-1" />}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                <Link to="/workspace">
                  <LayoutDashboard className="size-3.5 mr-2 text-primary" />
                  <span className="font-semibold text-primary">Painel Operacional</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                <Link to="/criar-negocio">
                  <Plus className="size-3.5 mr-2 text-muted-foreground" />
                  <span>Criar Novo Espaço</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                <Link to="/conta">
                  <User className="size-3.5 mr-2" />
                  <span>Minha Conta</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                <Link to="/conta/classificados">
                  <Tag className="size-3.5 mr-2" />
                  <span>Meus Anúncios</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs">
                <Link to="/conta/salvos">
                  <Bookmark className="size-3.5 mr-2" />
                  <span>Itens Salvos</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xl cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <LogOut className="size-3.5 mr-2" />
                <span>Encerrar Sessão</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full px-3.5 text-xs font-bold bg-primary text-primary-foreground"
          >
            <Link to="/entrar">Entrar</Link>
          </Button>
        )}
      </div>

      {/* Modal de Busca Rápida */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-4 top-[20%] translate-y-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Buscar na JAH</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar posts, produtos, classificados, eventos ou membros..."
              className="h-12 pl-10 pr-4 text-sm bg-muted/30 rounded-xl border-border focus-visible:ring-primary"
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
