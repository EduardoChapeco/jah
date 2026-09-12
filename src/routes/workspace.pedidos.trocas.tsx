import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listExchanges, updateExchangeStatus } from "@/services/exchanges.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";
import {
  Search,
  KanbanSquare,
  Table as TableIcon,
  CheckCircle2,
  Gift,
  RefreshCw,
  Banknote,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { formatDate } from "@/lib/datetime";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/workspace/pedidos/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções | Workspace Wider OS" }] }),
  loader: async () => {
    try {
      const data = await listExchanges();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("[loader:workspace.pedidos.trocas] Unhandled loader error:", err);
      return [];
    }
  },
  component: ExchangesDashboardPage,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
    requested: "Solicitada",
    approved: "Em Andamento",
    completed: "Concluída",
    rejected: "Rejeitada",
  };
  return map[status] || status;
}

function getStatusBadge(
  status: string,
): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "requested":
      return "secondary";
    case "approved":
      return "default";
    case "completed":
      return "success";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

const KANBAN_COLUMNS = [
  { id: "requested", title: "Novas" },
  { id: "approved", title: "Em Andamento" },
  { id: "completed", title: "Concluídas" },
  { id: "rejected", title: "Rejeitadas" },
];

function ResolutionDrawer({
  exchange,
  isOpen,
  onClose,
  onResolved,
}: {
  exchange: any;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionType, setResolutionType] = useState<"store_credit" | "refund" | "replacement">(
    "store_credit",
  );
  const [refundCents, setRefundCents] = useState<number>(exchange?.orderTotal || 0);

  useEffect(() => {
    if (exchange?.orderTotal) {
      setRefundCents(exchange.orderTotal);
    }
  }, [exchange]);

  const handleResolve = async () => {
    if (refundCents < 0) {
      toast.error("Valor inválido");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateExchangeStatus({
        data: {
          exchangeId: exchange.id,
          status: "completed",
          resolutionType,
          refundCents,
        },
      });
      toast.success("Troca concluída com sucesso!");
      onResolved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao concluir troca");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent size="wide" className="sm:max-w-xl md:max-w-2xl flex flex-col h-full bg-background border-l border-border/60">
        <SheetHeader>
          <SheetTitle>Finalizar Troca / Devolução</SheetTitle>
          <SheetDescription>
            Pedido #{exchange?.orderToken} — Defina a resolução para o cliente.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 flex-1 overflow-y-auto">
          <div className="p-4 bg-muted/30 border border-border/60 rounded-xl space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Resumo da Solicitação</h4>
            <p className="text-xs text-muted-foreground">Motivo: {exchange?.reason}</p>
            <p className="text-xs text-muted-foreground font-bold font-mono">
              Valor do Pedido: {formatMoney(exchange?.orderTotal || 0)}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                Tipo de Resolução
              </Label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionType("store_credit")}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl text-left transition-colors ${
                    resolutionType === "store_credit"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <Gift
                    className={`size-5 shrink-0 ${resolutionType === "store_credit" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm text-foreground">Vale-Compras (Recomendado)</p>
                    <p className="text-xs text-muted-foreground">
                      Gera automaticamente um Gift Card com saldo para o cliente reutilizar na loja
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionType("refund")}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl text-left transition-colors ${
                    resolutionType === "refund"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <Banknote
                    className={`size-5 shrink-0 ${resolutionType === "refund" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm text-foreground">Estorno Financeiro</p>
                    <p className="text-xs text-muted-foreground">
                      Devolução integral ou parcial do valor pago via Pix ou Cartão
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setResolutionType("replacement")}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl text-left transition-colors ${
                    resolutionType === "replacement"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <RefreshCw
                    className={`size-5 shrink-0 ${resolutionType === "replacement" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm text-foreground">Substituição por Outro Item</p>
                    <p className="text-xs text-muted-foreground">
                      Entrega de novo produto com compensação de saldo direto no balcão
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {(resolutionType === "store_credit" || resolutionType === "refund") && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Valor da Resolução
                </Label>
                <CurrencyField
                  value={refundCents}
                  onChange={(val) => setRefundCents(val ?? 0)}
                  className="font-mono font-bold text-lg h-12 bg-background border-border/80 rounded-xl"
                />
              </div>
            )}

            <Button
              className="w-full mt-4 font-bold rounded-xl h-11"
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Finalizando..." : "Concluir Troca & Gerar Resolução"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ExchangesDashboardPage() {
  const rawExchanges = Route.useLoaderData();
  const exchanges = Array.isArray(rawExchanges) ? rawExchanges : [];
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvingExchange, setResolvingExchange] = useState<any>(null);

  const filteredExchanges = exchanges.filter((ex: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ex.orderToken?.toLowerCase().includes(q) ||
      ex.customerName?.toLowerCase().includes(q) ||
      ex.reason?.toLowerCase().includes(q)
    );
  });

  const handleUpdateStatus = async (exchangeId: string, status: "approved" | "rejected") => {
    setProcessingId(exchangeId);
    try {
      await updateExchangeStatus({ data: { exchangeId, status } });
      toast.success(`Troca ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso!`);
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao atualizar troca.");
    } finally {
      setProcessingId(null);
    }
  };

  const getActionButtons = (exchange: any) => {
    return (
      <div className="flex flex-wrap gap-2">
        {exchange.status === "requested" && (
          <>
            <Button
              size="sm"
              variant="default"
              className="rounded-xl h-9 text-xs font-semibold"
              onClick={() => handleUpdateStatus(exchange.id, "approved")}
              disabled={processingId === exchange.id}
            >
              Aprovar Recebimento
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-9 text-xs font-semibold text-destructive hover:bg-destructive/10"
              onClick={() => handleUpdateStatus(exchange.id, "rejected")}
              disabled={processingId === exchange.id}
            >
              <XCircle className="size-3.5 mr-1" /> Rejeitar
            </Button>
          </>
        )}
        {exchange.status === "approved" && (
          <Button
            size="sm"
            variant="default"
            className="rounded-xl h-9 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setResolvingExchange(exchange)}
            disabled={processingId === exchange.id}
          >
            <CheckCircle2 className="size-3.5 mr-1" /> Finalizar Resolução
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Trocas & Devoluções" />
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-lg h-8 text-xs font-semibold"
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-3.5 w-3.5 mr-1.5" /> Kanban
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-lg h-8 text-xs font-semibold"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-3.5 w-3.5 mr-1.5" /> Tabela
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente ou motivo..."
            className="pl-9 h-10 bg-card border-border/70 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredExchanges.length === 0 ? (
        <EmptyState title="Nenhuma solicitação de troca encontrada" />
      ) : viewMode === "table" ? (
        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/20">
                <TableHead>Data</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExchanges.map((ex: any) => (
                <TableRow key={ex.id} className="border-border/50">
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {formatDate(ex.requestedAt)}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-xs">#{ex.orderToken}</TableCell>
                  <TableCell className="text-xs font-medium">{ex.customerName}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={ex.reason}>
                    {ex.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(ex.status)} className="text-[11px] font-medium">
                      {translateStatus(ex.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">{getActionButtons(ex)}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 items-start min-h-[500px]">
          {KANBAN_COLUMNS.map((col) => {
            const columnExchanges = filteredExchanges.filter((r: any) => r.status === col.id);
            return (
              <div
                key={col.id}
                className="min-w-[300px] w-[300px] bg-muted/20 border border-border/60 p-3.5 flex flex-col gap-3 rounded-2xl"
              >
                <div className="flex justify-between items-center font-medium px-1">
                  <span className="font-bold text-xs text-foreground uppercase tracking-wider">{col.title}</span>
                  <Badge variant="outline" className="bg-card font-mono text-[10px]">
                    {columnExchanges.length}
                  </Badge>
                </div>
                {columnExchanges.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-6 text-center border border-dashed border-border/60 rounded-xl bg-card/40">
                    Nenhum item nesta etapa
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columnExchanges.map((ex: any) => (
                      <div
                        key={ex.id}
                        className="bg-card border border-border/60 p-4 rounded-xl space-y-3 shadow-2xs"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-bold font-mono text-xs text-foreground">#{ex.orderToken}</p>
                            <p className="text-xs text-muted-foreground font-medium">{ex.customerName}</p>
                          </div>
                          <Badge variant={getStatusBadge(ex.status)} className="text-[10px]">
                            {translateStatus(ex.status)}
                          </Badge>
                        </div>

                        <div className="text-xs text-foreground p-2.5 bg-muted/30 border border-border/40 rounded-lg">
                          <span className="font-semibold text-muted-foreground">Motivo:</span> {ex.reason}
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                          <span>{formatMoney(ex.orderTotal || 0)}</span>
                          <span>{formatDate(ex.requestedAt)}</span>
                        </div>

                        {ex.status !== "completed" && ex.status !== "rejected" && (
                          <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
                            {getActionButtons(ex)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {resolvingExchange && (
        <ResolutionDrawer
          exchange={resolvingExchange}
          isOpen={!!resolvingExchange}
          onClose={() => setResolvingExchange(null)}
          onResolved={() => {
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}
