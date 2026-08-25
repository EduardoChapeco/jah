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

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success"
> = {
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
    <section className="font-sans text-foreground space-y-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4  pb-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <RefreshCw className="size-6 text-primary" strokeWidth={2.5} />
            Trocas e Devoluções
          </h2>
          <p className="text-muted-foreground mt-2">
            Acompanhe o status das suas solicitações de RMA.
          </p>
        </div>
        <Button className="h-10 px-4" asChild>
          <Link to="/conta/pedidos">Solicitar via Pedido</Link>
        </Button>
      </div>

      {rmas.length === 0 ? (
        <div className=" rounded-lg bg-card p-12 flex flex-col items-center text-center gap-4">
          <Package className="size-12 text-muted-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-semibold text-lg">Nenhuma solicitação</p>
            <p className="text-sm text-foreground/70 font-medium max-w-md mx-auto mt-2 mb-6">
              Suas solicitações de troca e devolução aparecerão aqui. Para iniciar uma, acesse o
              detalhe do pedido.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/conta/pedidos">Ver meus pedidos</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {rmas.map((rma: any) => (
            <div
              key={rma.id}
              className=" bg-card rounded-lg flex flex-col transition-all hover:"
            >
              <div className="p-4  flex flex-wrap items-start justify-between gap-4 bg-muted/50 rounded-t-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" strokeWidth={2.5} />
                    {TYPE_LABELS[rma.type] ?? "Devolução"} solicitada
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(rma.requestedAt)}</p>
                  {rma.orderToken && (
                    <p className="text-sm font-medium text-foreground mt-2">
                      Pedido{" "}
                      <span className="font-mono text-muted-foreground">#{rma.orderToken}</span>
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_VARIANTS[rma.status] ?? "secondary"}>
                  {STATUS_LABELS[rma.status] ?? rma.status}
                </Badge>
              </div>

              <div className="p-4 space-y-4">
                {rma.notes && (
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Nota do Cliente
                    </p>
                    <p className="text-sm text-foreground">"{rma.notes}"</p>
                  </div>
                )}

                {rma.orderTotal != null && (
                  <p className="text-sm text-foreground">
                    Valor Envolvido:{" "}
                    <span className="text-primary font-semibold ml-1">
                      {formatMoney(rma.orderTotal)}
                    </span>
                  </p>
                )}

                {rma.trackingCode && (
                  <div className="mt-4 p-4  rounded-xl bg-card space-y-4 relative overflow-hidden">
                    <div className="flex items-center gap-2 font-semibold text-foreground text-sm relative z-10">
                      <Truck className="h-4 w-4 text-primary" />
                      Logística Reversa ({rma.carrier})
                    </div>
                    <p className="text-sm text-muted-foreground relative z-10">
                      Vá até uma agência e informe o código de postagem abaixo:
                    </p>
                    <div className="bg-muted p-3 rounded-xl text-center relative z-10">
                      <p className="text-lg font-mono font-semibold tracking-wider text-foreground select-all">
                        {rma.trackingCode}
                      </p>
                    </div>
                    {rma.labelUrl && (
                      <Button className="w-full h-10 relative z-10" asChild>
                        <a href={rma.labelUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          Baixar Declaração / Etiqueta
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
