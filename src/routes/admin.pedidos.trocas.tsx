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
import { listAdminRmas, approveRma } from "@/services/rma.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";
import { Search, Filter, Box, RefreshCcw, KanbanSquare, Table as TableIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/pedidos/trocas")({
  head: () => ({ meta: [{ title: "RMA: Trocas e Devoluções — Jah" }] }),
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

function getStatusBadge(status: string): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status) {
    case "pending": return "secondary";
    case "authorized": return "default";
    case "shipped_back": return "outline";
    case "received": return "default";
    case "inspected": return "secondary";
    case "resolved": return "success";
    case "rejected": return "destructive";
    default: return "outline";
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
  { id: "resolved", title: "Concluídas" }
];

function RmaDashboardPage() {
  const rmas = Route.useLoaderData();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const handleUpdate = async (rmaId: string, status: string, resolution?: "store_credit" | "refund" | "replacement") => {
    setProcessingId(rmaId);
    try {
      if (status === "authorized") {
        await approveRma({ data: { rmaId, resolution: resolution || "store_credit" } });
        toast.success("RMA Autorizado com sucesso! O cliente foi notificado.");
      } else {
        toast.error("Endpoint não implementado para este status nesta demonstração.");
      }
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro");
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
            onClick={() => handleUpdate(rma.id, "authorized", "store_credit")}
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
            onClick={() => toast.info("Simulando: Recebendo produto...")}
          >
            Registrar Recebimento
          </Button>
        )}
        {rma.status === "received" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => toast.info("Simulando: Inspecionando item...")}
          >
            Inspecionar
          </Button>
        )}
        {rma.status === "inspected" && (
          <Button
            size="sm"
            variant="default"
            className="w-full sm:w-auto bg-success text-success-foreground hover:bg-success/90"
            onClick={() => toast.success(`Vale compras gerado: ${formatMoney(rma.orderTotal)}`)}
          >
            Gerar Vale-Compras
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Gestão de RMA"
          description="Controle logístico de devoluções, trocas e garantias."
        />
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
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por pedido ou cliente..." className="pl-9 bg-background" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {rmas.length === 0 ? (
        <EmptyState
          title="Nenhum RMA aberto"
          description="Nenhuma solicitação de troca ou devolução no momento."
        />
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
              {rmas.map((rma: any) => (
                <TableRow key={rma.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(rma.requestedAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-medium">#{rma.orderToken}</TableCell>
                  <TableCell>{rma.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Box className="h-4 w-4" /> {translateType(rma.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(rma.status)}>{translateStatus(rma.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right flex justify-end">
                    {getActionButtons(rma)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => {
            const columnRmas = rmas.filter((r: any) => r.status === col.id);
            return (
              <div key={col.id} className="min-w-[300px] w-[300px] bg-muted/30 p-3 rounded-lg border flex flex-col gap-3">
                <div className="flex justify-between items-center font-medium px-1">
                  <span>{col.title}</span>
                  <Badge variant="outline" className="bg-background">{columnRmas.length}</Badge>
                </div>
                {columnRmas.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md bg-background/50">
                    Nenhum item
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columnRmas.map((rma: any) => (
                      <div key={rma.id} className="bg-card p-3 rounded-md shadow-sm border space-y-3">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
