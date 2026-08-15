import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  Package,
  MapPin,
  CreditCard,
  Heart,
  RefreshCw,
  Tag,
  Store,
  ArrowRight,
  Handshake,
} from "lucide-react";

import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCustomerOrders } from "@/services/order.functions";
import { getProfile } from "@/services/auth.functions";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/")({
  head: () => ({ meta: [{ title: "Minha Conta | JAH" }] }),
  loader: async () => {
    const [ordersRes, profile] = await Promise.all([listCustomerOrders(), getProfile()]);
    const orders = ordersRes || [];
    return { orders, profile };
  },
  component: Page,
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

const QUICK_ACCESS = [
  {
    to: "/conta/classificados",
    label: "Meus Anúncios",
    icon: Tag,
    description: "Gerencie seus classificados",
  },
  { to: "/conta/pedidos", label: "Pedidos", icon: Package, description: "Acompanhe seus pedidos" },
  {
    to: "/conta/gift-cards",
    label: "Vales-Presente",
    icon: ShoppingBag,
    description: "Saldo e resgate de vales",
  },
  {
    to: "/conta/enderecos",
    label: "Endereços",
    icon: MapPin,
    description: "Gerencie seus endereços",
  },
  {
    to: "/conta/pagamentos",
    label: "Pagamentos",
    icon: CreditCard,
    description: "Formas de pagamento",
  },
  {
    to: "/conta/negociacoes",
    label: "Negociações",
    icon: Handshake,
    description: "Propostas e trocas",
  },
  {
    to: "/conta/avaliacoes",
    label: "Avaliações",
    icon: Heart,
    description: "Seus produtos avaliados",
  },
  {
    to: "/conta/trocas",
    label: "Trocas & Devoluções",
    icon: RefreshCw,
    description: "Solicitações de RMA",
  },
] as const;

function Page() {
  const { orders, profile } = Route.useLoaderData();
  const recentOrders = orders.slice(0, 3);

  return (
    <section className="space-y-6">
      {/* Resumo de Identidade do Membro */}
      <div className="border border-border bg-card rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="font-bold text-lg text-foreground">{profile.fullName || profile.email}</h2>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs h-9 font-semibold gap-1.5"
          >
            <Link to="/conta/classificados/novo">
              <Tag className="size-3.5 text-primary" />
              <span>Anunciar Desapego</span>
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-xl text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Link to="/criar-negocio">
              <Store className="size-3.5" />
              <span>Criar Espaço</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner de Espaço de Trabalho */}
      <div className="border border-primary/20 bg-primary/5 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Store className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Quer vender produtos, ingressos ou serviços?
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crie seu espaço de trabalho e acesse o Painel Operacional (Catálogo, Estoque, PDV e
              Pedidos).
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="rounded-xl text-xs font-bold shrink-0">
          <Link to="/criar-negocio">
            Criar Espaço
            <ArrowRight className="size-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Quick access grid */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 w-full">
          {QUICK_ACCESS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col gap-2 border border-border bg-card rounded-xl p-4 hover:bg-accent transition-colors"
            >
              <item.icon className="size-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Pedidos Recentes</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/conta/pedidos">Ver todos</Link>
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="border border-border bg-card rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não realizou nenhum pedido.</p>
            <Button size="sm" className="mt-4 rounded-xl" asChild>
              <Link to="/mercado">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between border border-border bg-card rounded-xl p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">#{order.public_token}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {formatMoney(order.total_cents)}
                  </p>
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
