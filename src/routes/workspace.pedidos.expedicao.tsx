import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Barcode, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Search,
  ScanLine
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  listPickingBatches, 
  scanBarcodePickItem, 
  generateShippingManifest 
} from "@/services/wms.functions";

export const Route = createFileRoute("/workspace/pedidos/expedicao")({
  head: () => ({ meta: [{ title: "WMS Expedição & Picking | JAH" }] }),
  component: WmsExpedicaoPage,
});

function WmsExpedicaoPage() {
  const queryClient = useQueryClient();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["wms-batches"],
    queryFn: () => listPickingBatches(),
  });

  const scanMutation = useMutation({
    mutationFn: (barcode: string) => {
      // Mock sessionId ou pegar da sessão ativa
      const sessionId = "00000000-0000-0000-0000-000000000000";
      return scanBarcodePickItem({ data: { sessionId, barcode } });
    },
    onSuccess: (data) => {
      toast.success(`Item "${data.matchedItemTitle}" conferido (${data.qtyPicked}/${data.qtyExpected})`);
      setBarcodeInput("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Código de barras não confere.");
    },
  });

  const manifestMutation = useMutation({
    mutationFn: () =>
      generateShippingManifest({
        data: {
          orderIds: ["00000000-0000-0000-0000-000000000000"],
          carrierName: "Transportadora Própria",
        },
      }),
    onSuccess: (res) => {
      toast.success(`Romaneio ${res.manifestCode} gerado com sucesso!`);
    },
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    scanMutation.mutate(barcodeInput.trim());
  };

  return (
    <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto">
      <PageHeader
        title="WMS • Separação & Expedição"
        description="Estação de picking em lote com conferência por leitor de código de barras e geração de romaneio."
      />

      {/* Layer 1: Terminal do Leitor Óptico / Barcode Scanner */}
      <div className="bg-card/70 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
            <Input
              autoFocus
              placeholder="Aponte o leitor ou digite o código de barras (EAN)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-12 h-14 min-h-[56px] text-base rounded-2xl bg-background font-mono shadow-inner"
            />
          </div>
          <Button
            type="submit"
            disabled={!barcodeInput.trim() || scanMutation.isPending}
            className="w-full sm:w-auto min-h-[56px] px-8 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg"
          >
            <Barcode className="h-5 w-5 mr-2" /> Bipar Produto
          </Button>
        </form>
      </div>

      {/* Layer 2: Lotes de Separação Ativos (Wave Picking) */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Ondas de Separação (Lotes Ativos)
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => manifestMutation.mutate()}
            className="min-h-[44px] rounded-xl text-xs font-semibold"
          >
            <Truck className="h-4 w-4 mr-1.5" /> Gerar Romaneio de Despacho
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando lotes de separação...</div>
        ) : batches.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum lote de separação em andamento no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batches.map((batch: any) => (
              <div key={batch.id} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-primary">{batch.batch_code}</span>
                  <Badge variant="secondary" className="capitalize text-xs rounded-lg">{batch.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Pedidos no Lote: <strong>{batch.total_orders}</strong></div>
                  <div>Itens Separados: <strong>{batch.total_picked} / {batch.total_items}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
