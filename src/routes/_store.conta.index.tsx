import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCustomerOrders } from "@/services/order.functions";
import { getProfile, getUserSession } from "@/services/auth.functions";
import { formatDate } from "@/lib/datetime";
import { cn } from "@/lib/utils";

import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/conta/")({
  head: () => ({ meta: [{ title: "Minha Conta | Wider" }] }),
  loader: async () => {
    const session = await getUserSession().catch(() => null);
    if (!session || !session.user) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: "/conta" },
      });
    }
    const [ordersRes, profile] = await Promise.all([
      listCustomerOrders().catch(() => []),
      getProfile().catch(() => ({})),
    ]);
    const orders = ordersRes || [];
    return { orders, profile, session };
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
  { to: "/conta/metricas", label: "Painel Profissional & Métricas", badge: "Insights" },
  { to: "/conta/pedidos", label: "Meus Pedidos", badge: null },
  { to: "/conta/salvos", label: "Itens Salvos", badge: null },
  { to: "/conta/classificados", label: "Meus Desapegos", badge: null },
  { to: "/conta/viagens", label: "Minhas Viagens", badge: null },
  { to: "/conta/enderecos", label: "Endereços de Entrega", badge: null },
  { to: "/conta/pagamentos", label: "Formas de Pagamento", badge: null },
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
  const recentOrders = orders.slice(0, 3);
  const memberships = (session?.memberships as any[]) || [];

  const userName = profile?.fullName || session?.user?.user_metadata?.full_name || "Membro Wider";
  const userEmail = profile?.email || session?.user?.email || "";
  const userHandle = profile?.username || session?.user?.user_metadata?.username || userEmail.split("@")[0] || "membro";
  const userAvatar = profile?.avatarUrl || session?.user?.user_metadata?.avatar_url || "";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-6 px-4 sm:px-0">
      {/* ── 1. Header do Usuário (Padrão Threads / Apple HIG) ── */}
      <div className=" bg-card rounded-3xl p-5 sm:p-6  flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-16 rounded-3xl bg-muted  overflow-hidden shrink-0 flex items-center justify-center ">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="size-full object-cover" />
            ) : (
              <span className="text-xl font-black text-primary">{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate tracking-tight">{userName}</h1>
            <p className="text-xs text-muted-foreground font-mono truncate">@{userHandle} • {userEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs h-9 font-semibold flex-1 sm:flex-initial">
            <Link to="/conta/perfil">Editar Perfil</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs h-9 font-semibold flex-1 sm:flex-initial bg-foreground text-background">
            <Link to="/membro/$id" params={{ id: userHandle || session?.id || session?.user?.id || "" }}>Ver Perfil Público</Link>
          </Button>
        </div>
      </div>

      {/* ── 2. Espaços de Trabalho & Lojas ── */}
      <div className=" bg-card rounded-3xl p-5  space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground tracking-tight">Meus Negócios & Espaços</h2>
          <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-semibold h-8 text-primary">
            <Link to="/criar-negocio">Cadastrar Nova Loja</Link>
          </Button>
        </div>

        {memberships.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {memberships.map((m) => (
              <div
                key={m.store_id}
                className="p-3.5 rounded-2xl  bg-muted/20 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl bg-card  overflow-hidden shrink-0 flex items-center justify-center">
                    {m.logo_url ? (
                      <img src={m.logo_url} alt={m.name} className="size-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-primary">{m.name ? m.name.slice(0, 2).toUpperCase() : "LJ"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{m.name || "Loja"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono capitalize">{m.role || "proprietário"}</p>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-8">
                  <Link to="/workspace">Acessar</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-1">
            Você ainda não possui lojas cadastradas. Cadastre seu comércio ou serviço para começar a vender.
          </p>
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
              className="p-4 rounded-2xl  bg-card hover:border-foreground/30 hover:bg-muted/30 transition-all text-left block "
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
          <div className=" bg-card rounded-3xl p-8 text-center space-y-2">
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
                className="flex items-center justify-between  bg-card rounded-2xl p-4 "
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
    </div>
  );
}
