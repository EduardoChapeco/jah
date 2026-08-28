import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Truck,
  Plus,
  Copy,
  ExternalLink,
  MapPin,
  Clock,
  KeyRound,
  DollarSign,
  Loader2,
  Trash2,
  Settings2,
  Car,
  Bike,
  Zap,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listDispatches, createDispatch, type DispatchRecord } from "@/services/dispatch.functions";
import {
  listLogisticsPriceTables,
  saveLogisticsPriceTable,
  deleteLogisticsPriceTable,
  type MobilityServiceType,
} from "@/services/mobility.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/pedidos/frota")({
  head: () => ({ meta: [{ title: "Frota & Despacho de Entregas | Wider" }] }),
  loader: async () => {
    const [dispatches, priceTables] = await Promise.all([
      listDispatches().catch(() => []),
      listLogisticsPriceTables().catch(() => []),
    ]);
    return { dispatches, priceTables };
  },
  component: FrotaEntregasPage,
});

function FrotaEntregasPage() {
  const { dispatches: initialDispatches, priceTables: initialPriceTables } = Route.useLoaderData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dispatches" | "pricing">("dispatches");

  // Dispatches state
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(initialDispatches);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for dispatch
  const [orderNumber, setOrderNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [feeReal, setFeeReal] = useState("10.00");

  // Pricing Table states
  const [priceTables, setPriceTables] = useState<any[]>(initialPriceTables);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const [priceFormName, setPriceFormName] = useState("Tarifa Padrão");
  const [priceFormServiceType, setPriceFormServiceType] = useState<MobilityServiceType>("delivery_express");
  const [priceFormBaseFee, setPriceFormBaseFee] = useState("5.00");
  const [priceFormKmRate, setPriceFormKmRate] = useState("2.50");
  const [priceFormMinuteRate, setPriceFormMinuteRate] = useState("0.30");
  const [priceFormHelperFee, setPriceFormHelperFee] = useState("50.00");
  const [priceFormMinFare, setPriceFormMinFare] = useState("10.00");

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !courierName || !deliveryAddress || !recipientName) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const feeCents = Math.round(parseFloat(feeReal || "0") * 100);
      const created = await createDispatch({
        data: {
          orderId: "ord_" + Math.random().toString(36).substring(2, 9),
          orderNumber,
          courierName,
          courierPhone: courierPhone || undefined,
          deliveryAddress,
          recipientName,
          recipientPhone: recipientPhone || undefined,
          deliveryFeeCents: feeCents,
        },
      });

      setDispatches([created, ...dispatches]);
      setIsOpen(false);
      setOrderNumber("");
      setCourierName("");
      setCourierPhone("");
      setRecipientName("");
      setRecipientPhone("");
      setDeliveryAddress("");
      toast.success("Despacho criado com sucesso! Link Mágico gerado.");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao criar despacho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePriceTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrice(true);
    try {
      const baseFeeCents = Math.round(parseFloat(priceFormBaseFee || "0") * 100);
      const kmRateCents = Math.round(parseFloat(priceFormKmRate || "0") * 100);
      const minuteRateCents = Math.round(parseFloat(priceFormMinuteRate || "0") * 100);
      const helperFeeCents = Math.round(parseFloat(priceFormHelperFee || "0") * 100);
      const minFareCents = Math.round(parseFloat(priceFormMinFare || "0") * 100);

      const saved = await saveLogisticsPriceTable({
        data: {
          name: priceFormName,
          service_type: priceFormServiceType,
          base_fee_cents: baseFeeCents,
          km_rate_cents: kmRateCents,
          minute_rate_cents: minuteRateCents,
          helper_fee_cents: helperFeeCents,
          min_fare_cents: minFareCents,
          is_active: true,
        },
      });

      setPriceTables([...priceTables.filter((p) => p.id !== saved.id), saved]);
      setIsPriceModalOpen(false);
      toast.success("Tabela de tarifas salva no banco com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar tabela de preço.");
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleDeletePriceTable = async (id: string) => {
    try {
      await deleteLogisticsPriceTable({ data: { id } });
      setPriceTables(priceTables.filter((p) => p.id !== id));
      toast.success("Tabela de tarifas removida.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover.");
    }
  };

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/entrega/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Mágico do Entregador copiado!");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4  pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Frota, Entregadores & Mobilidade
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerencie despachos em tempo real e tabelas de preços de frete e corridas.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1 ">
            <button
              type="button"
              onClick={() => setActiveTab("dispatches")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "dispatches"
                  ? "bg-background text-foreground "
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Despachos Ativos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pricing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "pricing"
                  ? "bg-background text-foreground "
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tabelas de Tarifas ({priceTables.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── ABA 1: DESPACHOS ATIVOS ─────────────────────────────────── */}
      {activeTab === "dispatches" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-10 px-4 font-semibold text-xs bg-foreground text-background hover:opacity-90 gap-1.5">
                  <Plus className="size-4" />
                  <span>Novo Despacho</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:rounded-2xl bg-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Despachar Pedido para Entrega
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Gera um Link Mágico com mapa e PIN de confirmação para o entregador.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateDispatch} className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Nº do Pedido *</Label>
                      <Input
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="Ex: 1042"
                        className="h-9 rounded-xl text-xs bg-background"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground">Taxa da Entrega (R$)</Label>
                      <Input
                        value={feeReal}
                        onChange={(e) => setFeeReal(e.target.value)}
                        placeholder="10.00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground">Endereço de Entrega *</Label>
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, Número, Bairro"
                      className="h-9 rounded-xl text-xs bg-background"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Nome do Cliente *</Label>
                      <Input
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nome do cliente"
                        className="h-9 rounded-xl text-xs bg-background"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground">WhatsApp Cliente</Label>
                      <Input
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="(49) 99999-9999"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Nome do Entregador *</Label>
                      <Input
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="Motoboy / Motorista"
                        className="h-9 rounded-xl text-xs bg-background"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground">WhatsApp Entregador</Label>
                      <Input
                        value={courierPhone}
                        onChange={(e) => setCourierPhone(e.target.value)}
                        placeholder="(49) 98888-8888"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 mt-2"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Gerando Despacho...</span>
                      </div>
                    ) : (
                      <span>Criar Despacho & Link Mágico</span>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {dispatches.length === 0 ? (
            <div className="p-12 text-center border-0 rounded-2xl bg-muted/20 space-y-2">
              <Truck className="size-8 mx-auto text-muted-foreground opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">Nenhum despacho ativo</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Despache pedidos para motoboys e acompanhe as entregas com confirmação de PIN em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dispatches.map((d) => (
                <div key={d.id} className="rounded-2xl  bg-card p-4 space-y-3 ">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-foreground">
                        Pedido #{d.order_number}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{d.recipient_name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3" />
                        {d.delivery_address}
                      </p>
                    </div>
                    <Badge variant={d.status === "delivered" ? "outline" : "secondary"} className="text-xs">
                      {d.status === "delivered" ? "Entregue" : "Em Trânsito"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Entregador</span>
                      <p className="font-semibold text-foreground truncate">{d.courier_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Taxa</span>
                      <p className="font-semibold text-foreground">{formatMoney(d.delivery_fee_cents)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <KeyRound className="size-2.5" /> PIN Cliente
                      </span>
                      <p className="font-mono font-bold text-foreground">{d.pin_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(d.delivery_token)}
                      className="flex-1 rounded-xl text-xs font-semibold gap-1.5 h-8"
                    >
                      <Copy className="size-3.5" />
                      Copiar Link Mágico
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="rounded-xl size-8">
                      <Link to="/entrega/$token" params={{ token: d.delivery_token }} target="_blank">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABA 2: TABELAS DE PREÇO & TARIFAS ────────────────────────── */}
      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Configure as tarifas de saída, valor por KM e ajudantes que alimentam a precificação real do app.
            </p>

            <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-10 px-4 font-semibold text-xs bg-foreground text-background hover:opacity-90 gap-1.5">
                  <Plus className="size-4" />
                  <span>Adicionar Tabela de Tarifa</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:rounded-2xl bg-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Nova Tabela de Tarifa de Mobilidade / Frete
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Define o cálculo exato de saída, km rodado e ajudantes para o modal selecionado.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSavePriceTable} className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-medium text-foreground">Nome da Tabela</Label>
                    <Input
                      value={priceFormName}
                      onChange={(e) => setPriceFormName(e.target.value)}
                      placeholder="Ex: Tarifa Chapecó Centro"
                      className="h-9 rounded-xl text-xs bg-background"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground">Modalidade do Veículo</Label>
                    <select
                      value={priceFormServiceType}
                      onChange={(e: any) => setPriceFormServiceType(e.target.value)}
                      className="w-full h-9 rounded-xl text-xs bg-background  px-3 text-foreground"
                    >
                      <option value="delivery_express">Entrega Flash (Moto / Bike)</option>
                      <option value="ride_moto">Moto Passageiro</option>
                      <option value="ride_car">Carro / Motorista Privado</option>
                      <option value="freight_van">Utilitário / Fiorino / Van</option>
                      <option value="moving_truck">Caminhão de Mudança</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Taxa de Partida (R$)</Label>
                      <Input
                        value={priceFormBaseFee}
                        onChange={(e) => setPriceFormBaseFee(e.target.value)}
                        placeholder="5.00"
                        className="h-9 rounded-xl text-xs bg-background"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground">Valor por KM (R$)</Label>
                      <Input
                        value={priceFormKmRate}
                        onChange={(e) => setPriceFormKmRate(e.target.value)}
                        placeholder="2.50"
                        className="h-9 rounded-xl text-xs bg-background"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-foreground">Tarifa Mínima (R$)</Label>
                      <Input
                        value={priceFormMinFare}
                        onChange={(e) => setPriceFormMinFare(e.target.value)}
                        placeholder="10.00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground">Por Minuto (R$)</Label>
                      <Input
                        value={priceFormMinuteRate}
                        onChange={(e) => setPriceFormMinuteRate(e.target.value)}
                        placeholder="0.30"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-foreground">Ajudante Mudança</Label>
                      <Input
                        value={priceFormHelperFee}
                        onChange={(e) => setPriceFormHelperFee(e.target.value)}
                        placeholder="50.00"
                        className="h-9 rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingPrice}
                    className="w-full h-10 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 mt-2"
                  >
                    {isSavingPrice ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span>Salvando no Banco...</span>
                      </div>
                    ) : (
                      <span>Salvar Tabela de Tarifas</span>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {priceTables.length === 0 ? (
            <div className="p-12 text-center border-0 rounded-2xl bg-muted/20 space-y-2">
              <DollarSign className="size-8 mx-auto text-muted-foreground opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">Nenhuma tabela de tarifa ativa</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Adicione tabelas de preços por modalidade para ativar a cobertura e o cálculo dinâmico no app.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {priceTables.map((tbl) => (
                <div key={tbl.id} className="rounded-2xl  bg-card p-4 space-y-3 ">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono mb-1">
                        {tbl.service_type}
                      </Badge>
                      <h4 className="text-sm font-semibold text-foreground">{tbl.name}</h4>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePriceTable(tbl.id)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                      aria-label="Remover tabela de tarifa"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Taxa Partida</span>
                      <p className="font-semibold text-foreground">{formatMoney(tbl.base_fee_cents)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Por KM</span>
                      <p className="font-semibold text-foreground">{formatMoney(tbl.km_rate_cents)}/km</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Tarifa Mínima</span>
                      <p className="font-semibold text-foreground">{formatMoney(tbl.min_fare_cents)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Ajudante</span>
                      <p className="font-semibold text-foreground">{formatMoney(tbl.helper_fee_cents)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
