import { createFileRoute, Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";
import { listCustomerRmas } from "@/services/rma.functions";
import { RefreshCw, Package, Truck, FileText } from "lucide-react";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções" }] }),
  loader: async () => {
    const res = await listCustomerRmas();
    return res;
  },
  component: Page,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando Análise",
  authorized: "Aguardando Envio",
  shipped_back: "Em Trânsito",
  received: "Recebido pela Loja",
  inspected: "Em Inspeção",
  resolved: "Resolvido",
  rejected: "Recusado",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  pending: "secondary",
  authorized: "default",
  shipped_back: "outline",
  received: "default",
  inspected: "secondary",
  resolved: "success",
  rejected: "destructive",
};

const TYPE_LABELS: Record<string, string> = {
  return: "Devolução",
  exchange: "Troca",
  warranty: "Garantia",
};

function Page() {
  const rmas = Route.useLoaderData();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-editorial text-2xl text-foreground">Trocas e Devoluções</h2>
        <Button size="sm" asChild>
          <Link to="/conta/pedidos">
            <RefreshCw className="size-3.5 mr-1.5" aria-hidden />
            Solicitar via Pedido
          </Link>
        </Button>
      </div>

      {rmas.length === 0 ? (
        <EmptyState
          title="Nenhuma solicitação"
          description="Suas solicitações de troca e devolução aparecem aqui. Para iniciar uma, acesse o detalhe do pedido."
          action={
            <Button asChild>
              <Link to="/conta/pedidos">Ver pedidos</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {rmas.map((rma: any) => (
            <div key={rma.id} className="border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    {TYPE_LABELS[rma.type] ?? "Devolução"} solicitada em {formatDate(rma.requestedAt)}
                  </p>
                  {rma.orderToken && (
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      Pedido <span className="text-primary">#{rma.orderToken}</span>
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_VARIANTS[rma.status] ?? "secondary"}>
                  {STATUS_LABELS[rma.status] ?? rma.status}
                </Badge>
              </div>
              {rma.notes && <p className="mt-3 text-sm text-muted-foreground">Nota: {rma.notes}</p>}
              {rma.orderTotal != null && (
                <p className="mt-2 text-sm font-medium text-foreground">
                  Valor Total do Pedido: {formatMoney(rma.orderTotal)}
                </p>
              )}
              {rma.trackingCode && (
                <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-md space-y-3">
                  <div className="flex items-center gap-2 font-medium text-primary text-sm">
                    <Truck className="h-4 w-4" />
                    Logística Reversa Autorizada ({rma.carrier})
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A sua solicitação foi aprovada. Vá até uma agência e informe o código de postagem abaixo:
                  </p>
                  <p className="text-xl font-mono font-bold text-foreground tracking-wider p-3 bg-background border text-center rounded-md select-all">
                    {rma.trackingCode}
                  </p>
                  {rma.labelUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={rma.labelUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Baixar Declaração / Etiqueta
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
