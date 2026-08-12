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
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-4xl font-semibold font-black uppercase text-foreground flex items-center gap-3">
            <RefreshCw className="size-8 text-primary" strokeWidth={3} />
            Trocas e Devoluções
          </h2>
          <p className="text-foreground/80 font-medium mt-2">
            Acompanhe o status das suas solicitações de RMA.
          </p>
        </div>
        <Button
          className="rounded-md border border-border bg-primary text-primary-foreground font-black uppercase text-sm tracking-wider h-12 cursor-pointer"
          asChild
        >
          <Link to="/conta/pedidos">Solicitar via Pedido</Link>
        </Button>
      </div>

      {rmas.length === 0 ? (
        <div className="border border-dashed border-border bg-background p-12 flex flex-col items-center text-center gap-4">
          <Package className="size-16 text-foreground/30" strokeWidth={1.5} />
          <div>
            <p className="font-semibold text-2xl font-black uppercase">Nenhuma solicitação</p>
            <p className="text-sm text-foreground/70 font-medium max-w-md mx-auto mt-2 mb-6">
              Suas solicitações de troca e devolução aparecerão aqui. Para iniciar uma, acesse o
              detalhe do pedido.
            </p>
            <Button
              className="rounded-md border border-border bg-primary text-primary-foreground font-black uppercase text-sm cursor-pointer"
              asChild
            >
              <Link to="/conta/pedidos">Ver meus pedidos</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {rmas.map((rma: any) => (
            <div
              key={rma.id}
              className="border border-border bg-background shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col transition-all hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
            >
              <div className="p-5 border-b border-border flex flex-wrap items-start justify-between gap-4 bg-secondary">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    {TYPE_LABELS[rma.type] ?? "Devolução"} solicitada
                  </p>
                  <p className="text-xs font-mono font-bold text-foreground/70">
                    {formatDate(rma.requestedAt)}
                  </p>
                  {rma.orderToken && (
                    <p className="text-base font-black text-foreground font-semibold mt-2">
                      Pedido{" "}
                      <span className="bg-white px-2 py-0.5 border border-border">
                        #{rma.orderToken}
                      </span>
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider border border-border shadow-sm ${rma.status === "resolved" ? "bg-success text-white" : rma.status === "rejected" ? "bg-destructive text-white" : rma.status === "shipped_back" ? "bg-muted/30 text-foreground" : "bg-white text-foreground"}`}
                >
                  {STATUS_LABELS[rma.status] ?? rma.status}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {rma.notes && (
                  <div className="bg-primary/5 p-4 border-l border-border">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-1">
                      Nota do Cliente
                    </p>
                    <p className="text-sm font-medium text-foreground italic">"{rma.notes}"</p>
                  </div>
                )}

                {rma.orderTotal != null && (
                  <p className="text-sm font-black text-foreground uppercase tracking-wider">
                    Valor Envolvido:{" "}
                    <span className="text-primary font-semibold text-xl ml-1">
                      {formatMoney(rma.orderTotal)}
                    </span>
                  </p>
                )}

                {rma.trackingCode && (
                  <div className="mt-4 p-5 border border-border bg-white space-y-4 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 rotate-12 pointer-events-none">
                      <Truck className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-2 font-black text-foreground uppercase text-sm relative z-10">
                      <Truck className="h-5 w-5 text-primary" />
                      Logística Reversa ({rma.carrier})
                    </div>
                    <p className="text-sm font-medium text-foreground/80 relative z-10">
                      Vá até uma agência e informe o código de postagem abaixo:
                    </p>
                    <div className="bg-secondary p-4 border border-border text-center relative z-10">
                      <p className="text-2xl font-mono font-black text-foreground tracking-[0.2em] select-all">
                        {rma.trackingCode}
                      </p>
                    </div>
                    {rma.labelUrl && (
                      <Button
                        className="w-full rounded-md border border-border bg-primary text-primary-foreground font-black uppercase text-xs h-12 relative z-10 cursor-pointer"
                        asChild
                      >
                        <a href={rma.labelUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-5 w-5 mr-2" />
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
