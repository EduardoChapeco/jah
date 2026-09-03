import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, Calendar, QrCode, MapPin, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import { listCustomerOrders } from "@/services/order.functions";

export const Route = createFileRoute("/_store/conta/ingressos")({
  head: () => ({ meta: [{ title: "Meus Ingressos & Eventos — Wider" }] }),
  loader: async () => {
    const orders = (await listCustomerOrders().catch(() => [])) || [];
    // Filtra itens de ingresso ou eventos
    const ticketOrders = orders.filter((order: any) =>
      order.order_items?.some(
        (i: any) => i.item_type === "ticket" || i.item_type === "event" || i.product_title?.toLowerCase().includes("ingresso"),
      ),
    );
    return ticketOrders;
  },
  component: CustomerTicketsPage,
});

function CustomerTicketsPage() {
  const ticketOrders = Route.useLoaderData() as any[];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      {/* ── 1. Top Header Unificado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/conta"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Minha Conta
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold tracking-wider">
              Ingressos
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Meus Ingressos & Eventos
          </h1>
          <p className="text-xs text-muted-foreground">
            Acesse seus ingressos digitais, credenciais com QR Code e histórico de eventos na comunidade.
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer self-start sm:self-auto">
          <Link to="/agenda">Ver Agenda Cultural</Link>
        </Button>
      </div>

      {/* ── 2. Lista de Ingressos ou Empty State ── */}
      {ticketOrders.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Ticket className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">Nenhum ingresso encontrado</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você ainda não possui ingressos comprados para shows, festivais, palestras ou eventos culturais na plataforma.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild className="rounded-xl text-xs font-bold h-9 px-5">
              <Link to="/agenda">Explorar Próximos Eventos</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ticketOrders.map((order: any) => {
            const ticketItem = order.order_items?.[0];
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-2xs hover:border-border transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Ticket className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {ticketItem?.product_title || "Ingresso Oficial"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {formatDate(order.created_at)}
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <QrCode className="size-4 text-primary" />
                    <span>Acesso Digital Válido</span>
                  </div>
                  <span className="font-bold font-mono text-primary">
                    {formatMoney(order.total_cents)}
                  </span>
                </div>

                <Button asChild size="sm" className="w-full rounded-xl text-xs font-bold h-9">
                  <Link to="/conta/pedidos/$id" params={{ id: order.id }}>
                    Ver Comprovante & QR Code
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomerTicketsPage;
