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
  ScanLine,
  Printer,
  ExternalLink,
  Clock,
  ShoppingBag,
  Store,
  Utensils
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
import { 
  listMarketplaceExternalOrders,
  type ExternalOrderDTO
} from "@/services/marketplace-hub.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/pedidos/expedicao")({
  head: () => ({ meta: [{ title: "WMS Expedição & Picking | Wider OS" }] }),
  component: WmsExpedicaoPage,
});

function WmsExpedicaoPage() {
  const queryClient = useQueryClient();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["wms-batches"],
    queryFn: () => listPickingBatches(),
  });

  const { data: externalOrders = [] } = useQuery({
    queryKey: ["marketplace-external-orders", channelFilter],
    queryFn: () => listMarketplaceExternalOrders({ data: { platform: channelFilter } }),
  });

  const selectedBatch = batches.find((b: any) => b.id === selectedBatchId) || batches[0] || null;
  const activeSessionId = selectedBatch?.sessions?.[0]?.id || null;
  const batchOrderIds: string[] = selectedBatch?.sessions
    ? selectedBatch.sessions.map((s: any) => s.order_id).filter(Boolean)
    : [];

  const scanMutation = useMutation({
    mutationFn: (barcode: string) => {
      if (!activeSessionId) {
        throw new Error("Selecione um lote com sessões ativas para conferência de produtos.");
      }
      return scanBarcodePickItem({ data: { sessionId: activeSessionId, barcode } });
    },
    onSuccess: (data) => {
      toast.success(`Item "${data.matchedItemTitle}" conferido (${data.qtyPicked}/${data.qtyExpected})`);
      setBarcodeInput("");
      queryClient.invalidateQueries({ queryKey: ["wms-batches"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Código de barras não confere com os itens pendentes deste lote.");
    },
  });

  const manifestMutation = useMutation({
    mutationFn: () => {
      if (!selectedBatch || batchOrderIds.length === 0) {
        throw new Error("Selecione um lote que contenha pedidos para emitir o romaneio.");
      }
      return generateShippingManifest({
        data: {
          batchId: selectedBatch.id,
          orderIds: batchOrderIds,
          carrierName: "Transportadora Própria",
        },
      });
    },
    onSuccess: (res) => {
      toast.success(`Romaneio ${res.manifestCode} gerado com sucesso para ${res.totalOrders} pedidos!`);
      queryClient.invalidateQueries({ queryKey: ["wms-batches"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Falha ao gerar romaneio de despacho.");
    },
  });

  const handlePrintThermalLabels = async () => {
    // 1. Se Web Serial estiver disponível, tenta despachar comandos ZPL puros
    if (typeof navigator !== "undefined" && "serial" in navigator && externalOrders.length > 0) {
      try {
        const { buildZplShippingLabel, sendZplToSerialPrinter } = await import("@/lib/thermal-printer");
        const firstOrder = externalOrders[0];
        const zplCode = buildZplShippingLabel({
          carrierName: "Correios / Transportadora",
          serviceType: "Expresso",
          trackingNumber: firstOrder.tracking_number || `BR${firstOrder.external_order_id.padStart(9, "0")}X`,
          orderNumber: firstOrder.external_order_id,
          batchCode: selectedBatch?.batch_code,
          recipient: {
            name: firstOrder.buyer_name || "Destinatário",
            street: "Av. Central",
            number: "100",
            neighborhood: "Centro",
            city: "Chapecó",
            state: "SC",
            zipCode: "89800-000",
          },
          sender: {
            storeName: "Wider Hub Logístico",
            city: "Chapecó",
            state: "SC",
            zipCode: "89801-000",
          },
          channelSource: firstOrder.platform,
          totalItemsCount: firstOrder.items?.length || 1,
        });

        await sendZplToSerialPrinter(zplCode);
        toast.success("Etiqueta ZPL (100x150mm) transmitida com sucesso para a impressora térmica USB!");
        return;
      } catch (serialErr: any) {
        if (serialErr.message?.includes("Nenhuma porta")) {
          // Usuário cancelou o seletor serial, faz fallback para diálogo do navegador
        } else {
          console.warn("[thermal] Falha na transmissão serial ZPL, usando fallback visual:", serialErr);
        }
      }
    }

    // Fallback padrão: diálogo visual de impressão
    toast.info("Enviando etiquetas (100x150mm) para a impressora do sistema...");
    window.print();
  };

  const handleConnectEscPos = async () => {
    if (typeof navigator !== "undefined" && "serial" in navigator) {
      try {
        const { buildEscPosReceipt, sendBytesToSerialPrinter } = await import("@/lib/thermal-printer");
        const testReceiptBytes = buildEscPosReceipt({
          storeName: "Wider Platform",
          orderNumber: "TEST-01",
          orderDate: new Date().toLocaleDateString("pt-BR"),
          items: [{ name: "Teste de Conexao Termica", qty: 1, priceCents: 0 }],
          subtotalCents: 0,
          totalCents: 0,
          paymentMethod: "TESTE",
          notes: "Impressora ESC/POS comunicando com sucesso via Web Serial API.",
        });

        await sendBytesToSerialPrinter(testReceiptBytes);
        toast.success("Impressora ESC/POS conectada e comprovante de teste impresso com sucesso!");
      } catch (e: any) {
        if (!e.message?.includes("Nenhuma porta")) {
          toast.info("Para conexão térmica em rede/LAN, configure o IP do terminal no driver RawBT.");
        }
      }
    } else {
      toast.info("Web Serial não disponível neste navegador. Utilize Google Chrome ou Edge para conexão direta USB.");
      window.print();
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    scanMutation.mutate(barcodeInput.trim());
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          eyebrow="Logística & Expedição"
          title="Conferência & Picking (WMS)" 
          description="Separação por ondas (wave picking), conferência ótica por código de barras e impressão de etiquetas térmicas."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl text-xs font-medium cursor-pointer"
            onClick={handleConnectEscPos}
          >
            <Printer className="size-4 mr-1.5" /> Impressora Térmica
          </Button>
          <Button
            className="h-10 rounded-xl text-xs font-semibold bg-foreground text-background cursor-pointer"
            onClick={handlePrintThermalLabels}
          >
            Imprimir Etiquetas 100x150
          </Button>
        </div>
      </div>

      {/* Layer 1: Scanner Barcode Input */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" /> Leitor Ótico de Código de Barras
          </h3>
          {activeSessionId && (
            <Badge variant="outline" className="text-xs font-mono">
              Sessão Ativa: {activeSessionId.substring(0, 8)}
            </Badge>
          )}
        </div>

        <form onSubmit={handleScanSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Aponte o leitor ou digite o EAN / SKU / Código de Barras do item..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-9 h-11 rounded-xl text-sm"
              autoFocus
              disabled={scanMutation.isPending}
            />
          </div>
          <Button 
            type="submit" 
            disabled={scanMutation.isPending || !barcodeInput.trim()}
            className="h-11 px-5 rounded-xl font-semibold bg-foreground text-background cursor-pointer"
          >
            <Barcode className="h-5 w-5 mr-2" /> Bipar Produto
          </Button>
        </form>
      </div>

      {/* Layer 2: Lotes de Separação Ativos (Wave Picking) */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Ondas de Separação (Lotes Ativos)
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!selectedBatch || batchOrderIds.length === 0 || manifestMutation.isPending}
            onClick={() => manifestMutation.mutate()}
            className="h-10 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Truck className="h-4 w-4 mr-1.5" /> Gerar Romaneio ({batchOrderIds.length} pedidos)
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando lotes de separação...</div>
        ) : batches.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum lote de separação em andamento no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batches.map((batch: any) => {
              const isSelected = selectedBatch?.id === batch.id;
              return (
                <div 
                  key={batch.id} 
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-3 ${
                    isSelected 
                      ? "bg-primary/5 border-primary shadow-xs ring-2 ring-primary/20" 
                      : "bg-muted/40 border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-primary">{batch.batch_code}</span>
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <Badge className="text-[10px] bg-primary text-primary-foreground font-semibold">Ativo</Badge>
                      )}
                      <Badge variant="secondary" className="capitalize text-xs rounded-lg">{batch.status}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Pedidos no Lote: <strong>{batch.total_orders || batch.sessions?.length || 0}</strong></div>
                    <div>Itens Separados: <strong>{batch.total_picked || 0} / {batch.total_items || 0}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Layer 3: Pedidos Multicanal & Expedição Integrada */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Fila de Despacho Multicanal
            </h3>
            <p className="text-xs text-muted-foreground">Pedidos integrados do Mercado Livre, iFood, Shopee e loja própria prontos para expedição.</p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "mercadolivre", "ifood", "shopee"].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  channelFilter === ch ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {ch === "all" ? "Todos" : ch === "mercadolivre" ? "Mercado Livre" : ch === "ifood" ? "iFood" : "Shopee"}
              </button>
            ))}
          </div>
        </div>

        {externalOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Nenhum pedido externo aguardando despacho no filtro selecionado.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {externalOrders.map((ord: ExternalOrderDTO) => (
              <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">#{ord.external_order_id}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {ord.platform}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ord.buyer_name || "Cliente Final"} • {ord.items?.length || 1} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{formatMoney(ord.total_amount_cents)}</p>
                  <p className="text-[10px] text-muted-foreground">Taxa: {formatMoney(ord.marketplace_fee_cents)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WmsExpedicaoPage;
