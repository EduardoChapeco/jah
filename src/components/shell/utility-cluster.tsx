import { NotificationsPopover } from "@/components/notifications/notifications-popover";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Search,
  ShoppingBag,
  Bell,
  LogOut,
  User,
  Store,
  Check,
  Plus,
  LayoutDashboard,
  Settings,
  Package,
  Tag,
  Bookmark,
  Edit3,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "@/services/auth.functions";
import { setTenantContext } from "@/services/identity.functions";
import { useCartContext } from "@/lib/cart-context";
import { toast } from "sonner";

export interface UtilityClusterProps {
  session?: any;
  embedded?: boolean;
}

export function UtilityCluster({ session, embedded = false }: UtilityClusterProps) {
  const router = useRouter();
  const { setIsCartOpen, globalCarts } = useCartContext();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  const memberships = (session?.memberships as any[]) || [];
  const activeStoreId = session?.store_id;
  const totalItemCount = globalCarts.reduce((acc, c) => acc + c.itemCount, 0);

  // Identity extraction
  const user = session?.user || session;
  const userName =
    user?.user_metadata?.full_name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Membro Wider";
  const userHandle =
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "membro";
  const userAvatar = user?.user_metadata?.avatar_url || user?.avatar_url || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const isPlatformAdmin =
    user?.role === "platform_admin" ||
    session?.role === "platform_admin" ||
    user?.user_metadata?.role === "platform_admin";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    router.navigate({
      to: "/buscar",
      search: { q: searchQuery.trim() },
    });
  };

  const handleSwitchStore = async (storeId: string) => {
    if (storeId === activeStoreId || isSwitching) return;
    setIsSwitching(true);
    try {
      if (typeof window !== "undefined") {
        window.document.cookie = `wider_active_tenant=${storeId}; path=/; max-age=31536000; SameSite=Lax`;
      }
      await setTenantContext({ data: { store_id: storeId } }).catch(() => null);
      toast.success("Espaço de trabalho alternado com sucesso!");
      window.location.reload();
    } catch {
      toast.error("Erro ao alternar loja.");
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sessão encerrada.");
      window.location.href = "/";
    } catch {
      toast.error("Erro ao sair.");
    }
  };

  return (
    <>
      <div
        className={`flex items-center gap-1 sm:gap-2 shrink-0 ${
          embedded ? "" : "h-10 px-2 rounded-2xl bg-card  "
        }`}
      >
        {/* 1. Busca Rápida — Visível apenas quando a barra de busca central estiver oculta */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(true)}
          className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-95 cursor-pointer lg:hidden"
          title="Buscar"
        >
          <Search className="size-4" />
        </Button>

        {/* 2. Sacola de Compras */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCartOpen(true)}
          className="size-8 rounded-xl relative text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-95 cursor-pointer"
          title="Sacola de Compras"
        >
          <ShoppingBag className="size-4" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-lg flex items-center justify-center  animate-scale-in">
              {totalItemCount}
            </span>
          )}
        </Button>

        {/* 3. Notificações */}
        <NotificationsPopover session={session} />

        {/* 4. Alternador de Tema Dark/Light */}
        <ThemeToggle className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-95 cursor-pointer" />

        <div className="h-4 w-px bg-border/60 mx-0.5" />

        {/* 5. Perfil / Auth Menu */}
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="size-8 shrink-0 rounded-xl overflow-hidden  focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:scale-105 active:scale-95  cursor-pointer"
                aria-label="Menu de Perfil e Conta"
              >
                <Avatar className="size-full rounded-none">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-72 rounded-3xl p-2 bg-card space-y-1"
            >
              {/* Header do Perfil Pessoal */}
              <DropdownMenuLabel className="font-normal p-2.5 pb-2">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="size-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-primary">{userInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate leading-tight">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">@{userHandle}</p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              {/* Ações da Conta Pessoal */}
              <div className="space-y-0.5">
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-bold text-foreground px-3 py-2 hover:bg-muted/60">
                  <Link to="/membro/$id" params={{ id: userHandle && userHandle !== "membro" ? userHandle : (session.id || session.user?.id || "") }}>
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-medium text-foreground/90 px-3 py-2 hover:bg-muted/60">
                  <Link to="/conta/perfil">Editar Perfil</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-medium text-foreground/90 px-3 py-2 hover:bg-muted/60">
                  <Link to="/conta/pedidos">Meus Pedidos & Compras</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-medium text-foreground/90 px-3 py-2 hover:bg-muted/60">
                  <Link to="/conta/classificados">Meus Desapegos & Anúncios</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-medium text-foreground/90 px-3 py-2 hover:bg-muted/60">
                  <Link to="/conta/salvos">Itens Salvos</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-medium text-foreground/90 px-3 py-2 hover:bg-muted/60">
                  <Link to="/conta">Configurações da Conta</Link>
                </DropdownMenuItem>
              </div>

              {/* ── Acesso Direto ao Workspace / Gestão da Loja ── */}
              <DropdownMenuSeparator className="my-1" />
              <div className="p-1 space-y-1">
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-bold bg-foreground text-background hover:bg-foreground/90 px-3 py-2 flex items-center justify-between">
                  <Link to="/workspace">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="size-3.5" />
                      <span>Entrar no Workspace</span>
                    </div>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </DropdownMenuItem>
              </div>

              {/* ── Gestão de Negócios & Espaços (Multiloja Transparente) ── */}
              {memberships.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Minhas Lojas ({memberships.length})
                    </span>
                    <Link
                      to="/conta/lojas"
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver Todas</span>
                      <ArrowUpRight className="size-2.5" />
                    </Link>
                  </div>

                  <div className="space-y-0.5 px-1">
                    {memberships.slice(0, 3).map((m: any) => {
                      const isCurrent = m.store_id === activeStoreId;
                      return (
                        <button
                          key={m.store_id}
                          type="button"
                          disabled={isSwitching}
                          onClick={() => handleSwitchStore(m.store_id)}
                          className={cn(
                            "w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer",
                            isCurrent
                              ? "bg-primary/10 text-primary font-bold"
                              : "hover:bg-muted/60 text-foreground/90 font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-5 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {m.logo_url ? (
                                <img src={m.logo_url} alt={m.name} className="size-full object-cover" />
                              ) : (
                                <Store className="size-3 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs truncate leading-tight">{m.name || "Minha Loja"}</p>
                            </div>
                          </div>
                          {isCurrent ? (
                            <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/20 shrink-0">
                              Ativo
                            </span>
                          ) : (
                            <ArrowUpRight className="size-3 text-muted-foreground/70 shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 flex items-center gap-1.5 mt-1">
                      <Link to="/criar-negocio">
                        <Plus className="size-3.5" />
                        <span>Cadastrar Outro Negócio</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </div>
              ) : (
                <div className="p-1">
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-bold bg-primary/10 text-primary hover:bg-primary/15 px-3 py-2">
                    <Link to="/criar-negocio">
                      <Plus className="size-3.5 mr-1.5" />
                      <span>Cadastrar Meu Negócio</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
              )}

              {/* ── Atalho VIP: Painel Global Master (Super Admin) ── */}
              {isPlatformAdmin && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <div className="p-1">
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-xs font-black bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-2 flex items-center justify-between">
                      <Link to="/admin-master">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="size-3.5" />
                          <span>Painel Global Master</span>
                        </div>
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </>
              )}

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xl cursor-pointer text-xs font-semibold text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive px-3 py-2"
              >
                Encerrar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            size="sm"
            className="h-8 rounded-xl px-3.5 text-xs font-bold bg-primary text-primary-foreground"
          >
            <Link to="/entrar">Entrar</Link>
          </Button>
        )}
      </div>

      {/* Modal de Busca Rápida */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg sm:rounded-2xl p-4 sm:top-[20%] sm:translate-y-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Buscar no Wider</DialogTitle>
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
