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
import { listAdminRmas, updateRmaStatus, resolveRmaWithCredit, inspectRmaItem } from "@/services/rma.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";
import {
  Search,
  Box,
  KanbanSquare,
  Table as TableIcon,
  FileText,
  Truck,
  CheckCircle2,
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
  head: () => ({ meta: [{ title: "RMA: Trocas e Devoluções" }] }),
  loader: async () => {
    return await listAdminRmas();
  },
  component: RmaDashboardPage,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
    pending: "Aguardando Análise",
    authorized: "Aguardando Envio",
    shipped_back: "Em Trânsito",
    received: "Recebida",
    inspected: "Inspecionada",
    resolved: "Concluída",
    rejected: "Rejeitada",
  };
  return map[status] || status;
}

function getStatusBadge(
  status: string,
): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "pending":
      return "secondary";
    case "authorized":
      return "default";
    case "shipped_back":
      return "outline";
    case "received":
      return "default";
    case "inspected":
      return "secondary";
    case "resolved":
      return "success";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function translateType(type: string) {
  if (type === "return") return "Devolução";
  if (type === "exchange") return "Troca";
  if (type === "warranty") return "Garantia";
  return type;
}

const KANBAN_COLUMNS = [
  { id: "pending", title: "Novas" },
  { id: "authorized", title: "Autorizadas" },
  { id: "received", title: "Recebidas" },
  { id: "inspected", title: "Inspecionadas" },
  { id: "resolved", title: "Concluídas" },
];

function InspectionDrawer({ rma, isOpen, onClose, onInspected }: { rma: any, isOpen: boolean, onClose: () => void, onInspected: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const items = rma?.items || [];
  
  // State for each item's inspection form
  const [inspectionData, setInspectionData] = useState<Record<string, { condition: string, destination: string, qty: number }>>({});

  const handleDataChange = (itemId: string, field: string, value: string | number) => {
    setInspectionData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleInspect = async (item: any) => {
    const data = inspectionData[item.id] || {};
    const qtyToInspect = data.qty || (item.qty - item.qty_received);
    const condition = data.condition || "perfect";
    const destination = data.destination || "restock";

    if (qtyToInspect <= 0 || qtyToInspect > (item.qty - item.qty_received)) {
      toast.error("Quantidade inválida");
      return;
    }

    setIsSubmitting(true);
    try {
      await inspectRmaItem({
        data: {
          rmaItemId: item.id,
          qty: qtyToInspect,
          condition: condition as any,
          destination: destination as any,
          notes: "Inspecionado via painel"
        }
      });
      toast.success("Item inspecionado!");
      onInspected();
    } catch (e: any) {
      toast.error(e.message || "Erro ao inspecionar item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Inspecionar Caixa / Quarentena</SheetTitle>
          <SheetDescription>
            Pedido #{rma?.orderToken} - Analise cada item devolvido e determine seu destino físico antes do estorno financeiro.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6 flex-1">
          {items.map((item: any) => {
            const product = item.order_items?.product_variants?.products?.name || "Produto Desconhecido";
            const price = item.order_items?.unit_price_cents || 0;
            const remainingQty = item.qty - item.qty_received;
            const isFullyInspected = remainingQty === 0;

            return (
              <div key={item.id} className="p-4 bg-muted/30 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{product}</h4>
                    <p className="text-xs text-muted-foreground">Motivo: {item.reason}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(price)} un.</p>
                  </div>
                  {isFullyInspected ? (
                    <Badge variant="success" className="text-xs"><CheckCircle2 className="size-3 mr-1" /> Inspecionado</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Falta Inspecionar: {remainingQty}</Badge>
                  )}
                </div>

                {!isFullyInspected && (
                  <div className="grid gap-3 pt-3 border-t border-border/50">
                    <div>
                      <Label className="text-xs text-muted-foreground">Condição Física</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={inspectionData[item.id]?.condition || "perfect"}
                        onChange={(e) => handleDataChange(item.id, "condition", e.target.value)}
                      >
                        <option value="perfect">Perfeito / Sem Avaria</option>
                        <option value="damaged">Danificado / Avariado</option>
                        <option value="wrong_item">Produto Incorreto</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Destino Físico (Quarentena)</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={inspectionData[item.id]?.destination || "restock"}
                        onChange={(e) => handleDataChange(item.id, "destination", e.target.value)}
                      >
                        <option value="restock">Prateleira (Restock Imediato)</option>
                        <option value="quarantine">Quarentena (Aguardar Análise)</option>
                        <option value="discard">Descarte (Lixo)</option>
                        <option value="return_to_supplier">Devolver ao Fornecedor</option>
                      </select>
                    </div>
                    <Button size="sm" onClick={() => handleInspect(item)} disabled={isSubmitting}>
                      Registrar Item
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {items.length > 0 && items.every((i: any) => i.qty === i.qty_received) && (
            <div className="text-center p-4 bg-success/10 text-success-foreground rounded-lg border border-success/20">
              <CheckCircle2 className="size-6 mx-auto mb-2" />
              <p className="font-semibold">Caixa Totalmente Inspecionada</p>
              <p className="text-xs mt-1">O RMA já está apto para o estorno financeiro.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RmaDashboardPage() {
  const rmas = Route.useLoaderData();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingRma, setInspectingRma] = useState<any>(null);

  const filteredRmas = rmas.filter((rma: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rma.orderToken?.toLowerCase().includes(q) ||
      rma.customerName?.toLowerCase().includes(q) ||
      rma.type?.toLowerCase().includes(q)
    );
  });

  const handleUpdate = async (
    rmaId: string,
    status: string,
  ) => {
    setProcessingId(rmaId);
    try {
      if (status === "authorized") {
        await updateRmaStatus({ data: { rmaId, status: "authorized" } });
        toast.success("RMA Autorizado com sucesso! O cliente foi notificado.");
      } else if (status === "received") {
        await updateRmaStatus({ data: { rmaId, status: "received" } });
        toast.success("Produto recebido no centro logístico.");
      } else if (status === "resolved") {
        const res = await resolveRmaWithCredit({ data: { rmaId } });
        toast.success(`Vale compras gerado: ${formatMoney(res.creditAmount)}`);
      } else {
        toast.error("Endpoint não implementado para este status nesta demonstração.");
      }
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro");
    } finally {
      setProcessingId(null);
    }
  };

  const getActionButtons = (rma: any) => {
    return (
      <div className="flex flex-wrap gap-2">
        {rma.status === "pending" && (
          <Button
            size="sm"
            variant="default"
            className="w-full sm:w-auto"
            onClick={() => handleUpdate(rma.id, "authorized")}
            disabled={processingId === rma.id}
          >
            Autorizar
          </Button>
        )}
        {rma.status === "authorized" && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => handleUpdate(rma.id, "received")}
            disabled={processingId === rma.id}
          >
            Registrar Recebimento
          </Button>
        )}
        {rma.status === "received" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30"
            onClick={() => setInspectingRma(rma)}
            disabled={processingId === rma.id}
          >
            Inspecionar Caixa
          </Button>
        )}
        {rma.status === "inspected" && (
          <Button
            size="sm"
            variant="default"
            className="w-full sm:w-auto bg-success text-success-foreground hover:bg-success/90"
            onClick={() => handleUpdate(rma.id, "resolved")}
            disabled={processingId === rma.id}
          >
            Gerar Vale-Compras
          </Button>
        )}
      </div>
    );
  };

  const getLogisticsInfo = (rma: any) => {
    if (!rma.trackingCode) return null;
    return (
      <div className="mt-3 p-3 bg-muted/40 rounded-md border text-sm space-y-2">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <Truck className="h-4 w-4 text-primary" />
          Logística Reversa ({rma.carrier})
        </div>
        <p className="text-muted-foreground text-xs font-mono">Rastreio: {rma.trackingCode}</p>
        {rma.labelUrl && (
          <Button size="sm" variant="outline" asChild className="w-full text-xs h-7 mt-1">
            <a href={rma.labelUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="h-3 w-3 mr-2" />
              Imprimir Etiqueta
            </a>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Gestão de RMA" description="Autorizações, Logística Reversa e Quarentena de Produtos" />
        <div className="flex bg-muted p-1 rounded-md">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4 mr-2" /> Tabela
          </Button>
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <KanbanSquare className="h-4 w-4 mr-2" /> Kanban
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido ou cliente..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredRmas.length === 0 ? (
        <EmptyState title="Nenhum RMA aberto" />
      ) : viewMode === "table" ? (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRmas.map((rma: any) => (
                <TableRow key={rma.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(rma.requestedAt)}</TableCell>
                  <TableCell className="font-medium">#{rma.orderToken}</TableCell>
                  <TableCell>{rma.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Box className="h-4 w-4" /> {translateType(rma.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(rma.status)}>
                      {translateStatus(rma.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex flex-col justify-end items-end gap-2">
                    {getActionButtons(rma)}
                    {getLogisticsInfo(rma)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnRmas = filteredRmas.filter((r: any) => r.status === col.id);
            return (
              <div
                key={col.id}
                className="min-w-[300px] w-[300px] bg-muted/30 p-3 border flex flex-col gap-3 rounded-md"
              >
                <div className="flex justify-between items-center font-medium px-1">
                  <span>{col.title}</span>
                  <Badge variant="outline" className="bg-background">
                    {columnRmas.length}
                  </Badge>
                </div>
                {columnRmas.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md bg-background/50">
                    Nenhum item
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columnRmas.map((rma: any) => (
                      <div
                        key={rma.id}
                        className="bg-card p-3 rounded-md shadow-sm border space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">#{rma.orderToken}</p>
                            <p className="text-xs text-muted-foreground">{rma.customerName}</p>
                          </div>
                          <Badge variant={getStatusBadge(rma.status)} className="text-[10px]">
                            {translateType(rma.type)}
                          </Badge>
                        </div>
                        <div className="pt-2 border-t flex flex-col gap-2">
                          {getActionButtons(rma)}
                        </div>
                        {getLogisticsInfo(rma)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {inspectingRma && (
        <InspectionDrawer 
          rma={inspectingRma} 
          isOpen={!!inspectingRma} 
          onClose={() => setInspectingRma(null)} 
          onInspected={() => {
            router.invalidate();
          }}
        />
      )}
    </div>
  );
}
