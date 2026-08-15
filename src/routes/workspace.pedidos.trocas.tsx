import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
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
import { formatDate } from "../lib/datetime";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/workspace/pedidos/trocas")({
  head: () => ({ meta: [{ title: "Trocas e Devoluções" }] }),
  loader: async () => {
    return await listExchanges();
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

  // Default to full order total, but user can change it
  const [refundValue, setRefundValue] = useState<string>(
    (exchange?.orderTotal / 100 || 0).toFixed(2),
  );

  const handleResolve = async () => {
    const valCents = Math.round(parseFloat(refundValue.replace(",", ".")) * 100);

    if (isNaN(valCents) || valCents < 0) {
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
          refundCents: valCents,
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
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Finalizar Troca / Devolução</SheetTitle>
          <SheetDescription>
            Pedido #{exchange?.orderToken} - Determine a resolução financeira para o cliente.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 flex-1">
          <div className="p-4 surface-subtle border border-border rounded-xl space-y-2">
            <h4 className="font-semibold text-sm">Resumo da Solicitação</h4>
            <p className="text-sm text-muted-foreground">Motivo: {exchange?.reason}</p>
            <p className="text-sm text-muted-foreground font-bold">
              Valor do Pedido: {formatMoney(exchange?.orderTotal || 0)}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Tipo de Resolução</Label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setResolutionType("store_credit")}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-colors ${
                    resolutionType === "store_credit"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Gift
                    className={`size-5 ${resolutionType === "store_credit" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm">Vale-Compras (Prioridade)</p>
                    <p className="text-xs text-muted-foreground">
                      Gera um Gift Card para o cliente usar na loja
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setResolutionType("refund")}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-colors ${
                    resolutionType === "refund"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Banknote
                    className={`size-5 ${resolutionType === "refund" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm">Estorno Financeiro</p>
                    <p className="text-xs text-muted-foreground">
                      Devolve o dinheiro (Pix, Cartão, Dinheiro)
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setResolutionType("replacement")}
                  className={`flex items-center gap-3 p-3 border rounded-xl text-left transition-colors ${
                    resolutionType === "replacement"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RefreshCw
                    className={`size-5 ${resolutionType === "replacement" ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-semibold text-sm">Substituição</p>
                    <p className="text-xs text-muted-foreground">
                      O cliente pegou outro produto de mesmo valor
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {(resolutionType === "store_credit" || resolutionType === "refund") && (
              <div className="space-y-2 mt-4">
                <Label className="text-sm font-semibold">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={refundValue}
                  onChange={(e) => setRefundValue(e.target.value)}
                  className="font-bold text-lg h-12"
                />
              </div>
            )}

            <Button
              size="lg"
              className="w-full mt-4 font-bold"
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Finalizando..." : "Confirmar e Concluir Troca"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ExchangesDashboardPage() {
  const exchanges = Route.useLoaderData();
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
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro");
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
              className="w-full sm:w-auto"
              onClick={() => handleUpdateStatus(exchange.id, "approved")}
              disabled={processingId === exchange.id}
            >
              Aprovar Recebimento
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => handleUpdateStatus(exchange.id, "rejected")}
              disabled={processingId === exchange.id}
            >
              <XCircle className="size-4 mr-1" /> Rejeitar
            </Button>
          </>
        )}
        {exchange.status === "approved" && (
          <Button
            size="sm"
            variant="default"
            className="w-full sm:w-auto bg-success text-success-foreground hover:bg-success/90"
            onClick={() => setResolvingExchange(exchange)}
            disabled={processingId === exchange.id}
          >
            <CheckCircle2 className="size-4 mr-1" /> Finalizar Resolução
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Trocas e Devoluções" />
        <div className="flex surface-subtle p-1 rounded-xl border border-border">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-4 w-4 mr-2" /> Kanban
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4 mr-2" /> Tabela
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente ou motivo..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredExchanges.length === 0 ? (
        <EmptyState title="Nenhuma solicitação de troca encontrada" />
      ) : viewMode === "table" ? (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow key={ex.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(ex.requestedAt)}</TableCell>
                  <TableCell className="font-medium">#{ex.orderToken}</TableCell>
                  <TableCell>{ex.customerName}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={ex.reason}>
                    {ex.reason}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(ex.status)}>{translateStatus(ex.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right flex flex-col justify-end items-end gap-2">
                    {getActionButtons(ex)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[600px]">
          {KANBAN_COLUMNS.map((col) => {
            const columnExchanges = filteredExchanges.filter((r: any) => r.status === col.id);
            return (
              <div
                key={col.id}
                className="min-w-[320px] w-[320px] surface-subtle p-3 border border-border flex flex-col gap-3 rounded-xl"
              >
                <div className="flex justify-between items-center font-medium px-1">
                  <span className="font-bold text-foreground">{col.title}</span>
                  <Badge variant="outline" className="bg-background">
                    {columnExchanges.length}
                  </Badge>
                </div>
                {columnExchanges.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-xl bg-background/50">
                    Nenhum item
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columnExchanges.map((ex: any) => (
                      <div
                        key={ex.id}
                        className="bg-card p-4 rounded-xl border border-border space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">#{ex.orderToken}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {ex.customerName}
                            </p>
                          </div>
                          <Badge variant={getStatusBadge(ex.status)} className="text-[10px]">
                            {translateStatus(ex.status)}
                          </Badge>
                        </div>

                        <div className="text-xs text-foreground p-2 surface-subtle rounded-lg border border-border">
                          <span className="font-semibold text-muted-foreground">Motivo:</span>{" "}
                          {ex.reason}
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Valor: {formatMoney(ex.orderTotal || 0)}</span>
                          <span>{formatDate(ex.requestedAt)}</span>
                        </div>

                        {ex.status !== "completed" && ex.status !== "rejected" && (
                          <div className="pt-3 border-t flex flex-col gap-2">
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
