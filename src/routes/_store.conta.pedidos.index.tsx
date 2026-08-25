import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/state/states";
import { listCustomerOrders } from "@/services/order.functions";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/pedidos/")({
  head: () => ({ meta: [{ title: "Meus Pedidos" }] }),
  loader: async () => {
    const res = await listCustomerOrders();
    return res;
  },
  component: Page,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
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
  return map[status] || status;
}

function Page() {
  const orders = Route.useLoaderData();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      {/* ── 1. Top Navigation & Minimalist Header ── */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/conta"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Minha Conta
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-foreground">Pedidos</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Meus Pedidos
          </h1>
        </div>

        <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer">
          <Link to="/mercado">Ir às Compras</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">Nenhum pedido encontrado</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Você ainda não realizou compras. Explore as lojas e produtos do catálogo.
          </p>
          <div className="pt-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-9">
              <Link to="/mercado">Explorar Lojas</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link
              key={order.id}
              to="/conta/pedidos/$id"
              params={{ id: order.id }}
              className="block rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:border-border shadow-2xs group"
            >
              <div className="bg-muted/30 p-4 flex flex-wrap justify-between items-center gap-3 border-b border-border/40 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Data</span>
                  <p className="font-semibold text-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                  <p className="font-semibold text-foreground">{formatMoney(order.total_cents)}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Código</span>
                  <p className="font-mono font-bold text-foreground">#{order.public_token || order.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="secondary" className="text-[11px] font-semibold py-0.5 rounded-md">
                    {translateStatus(order.status)}
                  </Badge>
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    Ver Detalhes ↗
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-foreground truncate">{item.product_title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Qtd: {item.qty || item.quantity || 1} {item.variant_sku && `• SKU: ${item.variant_sku}`}
                      </p>
                    </div>
                    <p className="font-mono font-bold text-foreground shrink-0">
                      {formatMoney(
                        item.total_cents ??
                          (item.unit_price_cents || 0) * (item.qty || item.quantity || 1),
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
