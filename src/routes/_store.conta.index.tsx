import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCustomerOrders } from "@/services/order.functions";
import { getProfile, getUserSession } from "@/services/auth.functions";
import { getMyStoresList } from "@/services/store.functions";
import { formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { redirect } from "@tanstack/react-router";
import { Shield, Store, LayoutDashboard, ArrowUpRight, Plus, Eye, Edit3, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_store/conta/")({
  head: () => ({ meta: [{ title: "Minha Conta | Wider" }] }),
  loader: async () => {
    const session = await getUserSession().catch(() => null);
    const [ordersRes, profile, storesRes] = await Promise.all([
      listCustomerOrders().catch(() => []),
      getProfile().catch(() => ({})),
      getMyStoresList().catch(() => []),
    ]);
    const orders = ordersRes || [];
    const stores = storesRes || [];
    return { orders, profile, session, stores };
  },
  component: AccountDashboardPage,
});

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  awaiting_payment: "Aguardando Pagamento",
  paid: "Pago",
  processing: "Em Separação",
  ready_for_pickup: "Pronto para Retirada",
  shipped: "Enviado",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  return_requested: "Devolução Solicitada",
  returned: "Devolvido",
};

const ACCOUNT_SECTIONS = [
  { to: "/conta/seguranca", label: "Segurança & Dispositivos Conectados", badge: "Proteção" },
  { to: "/conta/metricas", label: "Painel Profissional & Métricas", badge: "Insights" },
  { to: "/conta/pedidos", label: "Meus Pedidos", badge: null },
  { to: "/conta/agendamentos", label: "Minha Agenda & Horários", badge: "Serviços" },
  { to: "/conta/pacotes", label: "Meus Pacotes & Sessões", badge: null },
  { to: "/conta/salvos", label: "Itens Salvos", badge: null },
  { to: "/conta/classificados", label: "Meus Desapegos", badge: null },
  { to: "/conta/viagens", label: "Minhas Viagens", badge: null },
  { to: "/conta/enderecos", label: "Endereços de Entrega", badge: null },
  { to: "/conta/pagamentos", label: "Formas de Pagamento", badge: null },
  { to: "/conta/tokens", label: "Meus Tokens & Fidelidade", badge: "Cashback" },
  { to: "/conta/creditos", label: "Carteira & Créditos", badge: null },
  { to: "/conta/gift-cards", label: "Vales-Presente", badge: null },
  { to: "/conta/negociacoes", label: "Negociações & Trocas", badge: null },
  { to: "/conta/avaliacoes", label: "Minhas Avaliações", badge: null },
  { to: "/conta/trocas", label: "Trocas & Devoluções", badge: null },
  { to: "/conta/suporte", label: "Ajuda & Suporte", badge: null },
] as const;

function AccountDashboardPage() {
  const loaderData = (Route.useLoaderData() || {}) as any;
  const orders = loaderData.orders || [];
  const profile = loaderData.profile || null;
  const session = loaderData.session || null;
  const rawStores = (loaderData.stores as any[]) || [];
  const sessionMemberships = (session?.memberships as any[]) || [];
  const profileMemberships = (profile?.memberships as any[]) || [];
  const stores =
    rawStores.length > 0
      ? rawStores
      : sessionMemberships.length > 0
        ? sessionMemberships
        : profileMemberships;
  const recentOrders = orders.slice(0, 3);
  const navigate = useNavigate();

  const userRole = profile?.role || session?.role || session?.user?.user_metadata?.role || "customer";
  const isMasterAdmin = userRole === "platform_admin" || userRole === "master" || userRole === "admin";

  const userName = profile?.fullName || session?.fullName || session?.user?.user_metadata?.full_name || "Membro Wider";
  const userEmail = profile?.email || session?.email || session?.user?.email || "";
  const userHandle = profile?.username || session?.username || session?.user?.user_metadata?.username || userEmail.split("@")[0] || "membro";
  const userAvatar = profile?.avatarUrl || session?.avatarUrl || session?.user?.user_metadata?.avatar_url || "";

  // Seta o cookie de tenant ativo e navega para o workspace da loja correta
  const handleOpenWorkspace = (storeId: string) => {
    window.document.cookie = `wider_active_tenant=${storeId}; path=/; max-age=31536000; SameSite=Lax`;
    navigate({ to: "/workspace" });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-6 px-4 sm:px-0">
      {/* ── 1. Header do Usuário (Padrão Threads / Apple HIG) ── */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-16 rounded-2xl bg-muted overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="size-full object-cover" />
            ) : (
              <span className="text-xl font-black text-primary">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight">{userName}</h1>
              {isMasterAdmin && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                  MASTER ADMIN
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">@{userHandle} • {userEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {isMasterAdmin && (
            <Button asChild size="sm" variant="default" className="rounded-xl text-xs h-9 font-bold bg-primary text-primary-foreground gap-1.5 shadow-xs">
              <Link to="/admin-master">
                <Shield className="size-3.5" />
                <span>Painel Admin Master</span>
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-9 font-semibold flex-1 sm:flex-initial">
            <Link to="/conta/perfil">Editar Perfil</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs h-9 font-semibold flex-1 sm:flex-initial bg-foreground text-background">
            <Link to="/membro/$id" params={{ id: userHandle || session?.id || session?.user?.id || "" }}>Ver Perfil Público</Link>
          </Button>
        </div>
      </div>

      {/* ── 2. Meus Negócios — Acesso Direto ao Workspace por Loja ── */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">Meus Negócios & Espaços</h2>
            {stores.length > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {stores.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold h-8">
              <Link to="/workspace">
                <span>Entrar no Workspace</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold h-8 text-primary">
              <Link to="/criar-negocio">
                <span>+ Cadastrar Nova Loja</span>
              </Link>
            </Button>
          </div>
        </div>

        {stores.length > 0 ? (
          <div className="divide-y divide-border/40">
            {stores.map((st) => (
              <div
                key={st.id}
                className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-xl bg-card border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                    {st.logo_url ? (
                      <img src={st.logo_url} alt={st.name} className="size-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-primary">{st.name ? st.name.slice(0, 2).toUpperCase() : "LJ"}</span>
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{st.name || "Loja"}</p>
                      {st.role && (
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                          {st.role}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {st.city ? `${st.city}, ${st.state || ""}` : "Loja Ativa"} • {st.product_count ?? 0} produtos cadastrados
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-semibold h-8"
                  >
                    <Link to="/perfil-da-loja" search={{ storeId: st.id }}>
                      Ver Vitrine
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleOpenWorkspace(st.id)}
                    className="rounded-xl text-xs font-bold h-8 bg-foreground text-background hover:bg-foreground/90 shrink-0 cursor-pointer"
                  >
                    Abrir Workspace
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Você ainda não possui lojas vinculadas diretamente ao seu perfil.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-primary text-primary-foreground">
                <Link to="/workspace">Acessar Workspace Geral Wider</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                <Link to="/criar-negocio">Cadastrar Minha Empresa</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Atalhos da Conta (Grade Limpa Padrão Threads) ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight px-1">Serviços & Atividades</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {ACCOUNT_SECTIONS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="p-4 rounded-2xl border border-border/60 bg-card hover:border-foreground/30 hover:bg-muted/30 transition-all text-left block"
            >
              <span className="text-xs sm:text-sm font-bold text-foreground block truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── 4. Pedidos Recentes ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-foreground tracking-tight">Pedidos Recentes</h2>
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold h-8">
            <Link to="/conta/pedidos">Ver todos</Link>
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-8 text-center space-y-2">
            <p className="text-xs text-muted-foreground">Você ainda não realizou nenhum pedido na comunidade.</p>
            <div className="pt-1">
              <Button size="sm" asChild className="rounded-xl font-bold text-xs">
                <Link to="/mercado">Explorar Lojas e Ofertas</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between bg-card rounded-2xl border border-border/60 p-4"
              >
                <div>
                  <p className="text-xs font-bold text-foreground font-mono">#{order.public_token || order.id?.slice(0, 8)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground font-mono">
                    {formatMoney(order.total_cents || 0)}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold rounded-full">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. Aparência & Tema ── */}
      <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-3">
        <h2 className="text-sm font-bold text-foreground tracking-tight">Aparência & Tema</h2>
        <ThemeSelector />
      </div>
    </div>
  );
}
