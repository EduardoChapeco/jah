import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Truck,
  Plus,
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  KeyRound,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listDispatches, createDispatch, type DispatchRecord } from "@/services/dispatch.functions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/pedidos/frota")({
  head: () => ({ meta: [{ title: "Frota & Despacho de Entregas | JAH" }] }),
  loader: async () => {
    return await listDispatches();
  },
  component: FrotaEntregasPage,
});

function FrotaEntregasPage() {
  const initialDispatches = Route.useLoaderData();
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(initialDispatches);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [orderNumber, setOrderNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [feeReal, setFeeReal] = useState("10.00");

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
      // Reset form
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

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/entrega/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link Mágico do Entregador copiado!");
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Truck className="size-5 text-primary" />
            Frota & Despacho de Delivery
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerencie motoboys, gere links mágicos sem login e acompanhe validações por PIN.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-semibold gap-2 shadow-xs">
              <Plus className="size-4" />
              Novo Despacho / Chamar Motoboy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="size-5 text-primary" />
                Despachar Pedido com Motoboy
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Gere um link temporário com navegação e PIN de 4 dígitos para o entregador.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateDispatch} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Número do Pedido *</Label>
                  <Input
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ex: #4829"
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Taxa da Corrida (R$) *</Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={feeReal}
                    onChange={(e) => setFeeReal(e.target.value)}
                    className="h-9 text-xs rounded-xl font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nome do Entregador / Motoboy *</Label>
                  <Input
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">WhatsApp do Entregador</Label>
                  <Input
                    value={courierPhone}
                    onChange={(e) => setCourierPhone(e.target.value)}
                    placeholder="Ex: (49) 98877-6655"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nome do Cliente *</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: Amanda Lima"
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Telefone do Cliente</Label>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Ex: (49) 99988-7766"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Endereço de Entrega Completo *</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ex: Rua Marechal Deodoro, 120, Apto 302 - Centro"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl font-semibold gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Gerando Link Mágico...
                  </>
                ) : (
                  <>
                    <Truck className="size-4" />
                    Criar e Despachar
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Despachos */}
      {dispatches.length === 0 ? (
        <div className="squircle-soft border border-border bg-card p-12 text-center space-y-3 shadow-xs">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Truck className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Nenhum despacho ativo</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Quando você despachar pedidos para motoboys ou entregadores parceiros, os links mágicos
            e status aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dispatches.map((d) => (
            <div
              key={d.id}
              className="squircle-soft border border-border bg-card p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold text-primary">
                    Pedido #{d.order_number}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">{d.recipient_name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 text-muted-foreground" />
                    {d.delivery_address}
                  </p>
                </div>
                <Badge
                  variant={d.status === "delivered" ? "default" : "secondary"}
                  className="rounded-full text-[10px] font-bold uppercase"
                >
                  {d.status === "delivered" ? "Entregue" : "Em Trânsito"}
                </Badge>
              </div>

              {/* Informações do Entregador e PIN */}
              <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Entregador
                  </span>
                  <p className="font-bold text-foreground truncate">{d.courier_name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Taxa</span>
                  <p className="font-bold text-primary">{formatMoney(d.delivery_fee_cents)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
                    <KeyRound className="size-2.5 text-primary" /> PIN Cliente
                  </span>
                  <p className="font-mono font-black text-foreground">{d.pin_code}</p>
                </div>
              </div>

              {/* Ações do Link Mágico */}
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
  );
}
