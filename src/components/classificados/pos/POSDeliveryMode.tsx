import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Truck, ChevronLeft, MapPin, Banknote, QrCode, CreditCard, Smartphone,
  CheckCircle2, XCircle, Clock, Camera, Package, ArrowRightLeft,
  AlertTriangle, Pen,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { POSRegister, POSSession, POSMovement } from "@/hooks/usePOS";
import { useCreateMovement, usePOSMovements, useCloseSession } from "@/hooks/usePOS";

interface Props {
  register: POSRegister;
  session: POSSession;
  companyId: string;
  onBack: () => void;
}

interface DeliveryItem {
  id: string;
  customer: string;
  address: string;
  amount: number;
  paymentMethod: string;
  status: "pending" | "delivered" | "not_delivered";
  receivedAmount?: number;
  actualPayment?: string;
  notes?: string;
}

const PAYMENT_OPTIONS = [
  { value: "pix_paid", label: "PIX (já pago)", icon: QrCode },
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "card", label: "Cartão (maquininha)", icon: CreditCard },
  { value: "online_paid", label: "Já pago online", icon: Smartphone },
];

export default function POSDeliveryMode({ register, session, companyId, onBack }: Props) {
  const { data: movements } = usePOSMovements(session.id);
  const createMovement = useCreateMovement();
  const closeSessionMut = useCloseSession();

  // Deliveries (simulated from movements of type "entrega" + local state)
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(() => {
    // Seed sample deliveries from session context
    return [
      { id: "1", customer: "Maria Silva", address: "Rua das Flores, 123 - Centro", amount: 89.90, paymentMethod: "cash", status: "pending" },
      { id: "2", customer: "João Oliveira", address: "Av. Brasil, 456 - Jardim", amount: 145.00, paymentMethod: "pix_paid", status: "pending" },
      { id: "3", customer: "Ana Costa", address: "Rua do Comércio, 789 - Vila Nova", amount: 52.50, paymentMethod: "online_paid", status: "pending" },
    ];
  });

  const [receiveDialog, setReceiveDialog] = useState<string | null>(null);
  const [handoverDialog, setHandoverDialog] = useState(false);
  const [closingDialog, setClosingDialog] = useState(false);

  // Receive form
  const [receivePayment, setReceivePayment] = useState("");
  const [receiveCash, setReceiveCash] = useState("");
  const [receiveNotes, setReceiveNotes] = useState("");

  // Handover form
  const [handoverAmount, setHandoverAmount] = useState("");
  const [handoverReceiver, setHandoverReceiver] = useState("");
  const [handoverConfirm, setHandoverConfirm] = useState(false);

  // Closing
  const [closingCash, setClosingCash] = useState("");
  const [closingConfirm, setClosingConfirm] = useState(false);

  const activeDelivery = deliveries.find(d => d.id === receiveDialog);

  // Stats
  const delivered = deliveries.filter(d => d.status === "delivered");
  const pending = deliveries.filter(d => d.status === "pending");
  const notDelivered = deliveries.filter(d => d.status === "not_delivered");

  const totalCashInHand = delivered
    .filter(d => d.actualPayment === "cash")
    .reduce((sum, d) => sum + (d.receivedAmount || d.amount), 0);

  const handoverMovements = movements?.filter(m => m.type === "repasse") || [];
  const totalHandedOver = handoverMovements.reduce((sum, m) => sum + m.amount, 0);
  const currentCashInHand = totalCashInHand - totalHandedOver + session.opening_balance;

  const totalDelivered = delivered.reduce((sum, d) => sum + d.amount, 0);

  // Mark as delivered
  const handleMarkDelivered = () => {
    if (!receiveDialog || !receivePayment) return;
    const delivery = deliveries.find(d => d.id === receiveDialog);
    if (!delivery) return;

    const receivedAmt = receivePayment === "cash" ? (Number(receiveCash) || delivery.amount) : delivery.amount;

    setDeliveries(prev =>
      prev.map(d =>
        d.id === receiveDialog
          ? { ...d, status: "delivered" as const, actualPayment: receivePayment, receivedAmount: receivedAmt, notes: receiveNotes }
          : d
      )
    );

    // Register movement
    const payLabel = PAYMENT_OPTIONS.find(p => p.value === receivePayment)?.label || receivePayment;
    createMovement.mutate({
      session_id: session.id,
      type: "suprimento",
      amount: receivedAmt,
      description: `Entrega: ${delivery.customer} — ${payLabel}`,
      category: "entrega",
      authorized_by: null,
      photo_url: null,
      employee_id: null,
    });

    setReceiveDialog(null);
    setReceivePayment("");
    setReceiveCash("");
    setReceiveNotes("");
    toast.success("Entrega registrada!");
  };

  const handleMarkNotDelivered = (id: string) => {
    setDeliveries(prev =>
      prev.map(d => d.id === id ? { ...d, status: "not_delivered" as const } : d)
    );
    toast.info("Marcado como não entregue");
  };

  // Handover cash
  const handleHandover = () => {
    if (!handoverConfirm || !handoverAmount) return;
    const amt = Number(handoverAmount);
    if (amt <= 0) return;

    createMovement.mutate({
      session_id: session.id,
      type: "repasse",
      amount: amt,
      description: `Repasse para: ${handoverReceiver || "Caixa central"}`,
      category: "repasse",
      authorized_by: null,
      photo_url: null,
      employee_id: null,
    }, {
      onSuccess: () => {
        setHandoverDialog(false);
        setHandoverAmount("");
        setHandoverReceiver("");
        setHandoverConfirm(false);
        toast.success("Repasse registrado!");
      },
    });
  };

  // Close session
  const handleClose = () => {
    if (!closingConfirm) return;
    const actualCash = Number(closingCash) || 0;
    closeSessionMut.mutate({
      id: session.id,
      actual_cash: actualCash,
      closing_balance: currentCashInHand,
      difference: actualCash - currentCashInHand,
      notes: `Entregas: ${delivered.length} realizadas, ${notDelivered.length} não entregues`,
    }, {
      onSuccess: () => {
        setClosingDialog(false);
        toast.success("Caixa do entregador fechado!");
        onBack();
      },
    });
  };

  const changeDue = receivePayment === "cash" && receiveCash
    ? (Number(receiveCash) || 0) - (activeDelivery?.amount || 0)
    : null;

  const closingDiff = closingCash ? (Number(closingCash) || 0) - currentCashInHand : null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-[800] text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-[hsl(var(--badge-green))]" />
            {register.name} — Entregador
          </h1>
          <p className="text-xs text-muted-foreground">
            Aberto às {format(new Date(session.opened_at), "HH:mm")} · Fundo: R$ {session.opening_balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border border-border p-3 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pendentes</p>
          <p className="text-2xl font-[800] text-foreground">{pending.length}</p>
        </Card>
        <Card className="border border-border p-3 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Entregues</p>
          <p className="text-2xl font-[800] text-[hsl(var(--badge-green))]">{delivered.length}</p>
        </Card>
        <Card className="border border-border p-3 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dinheiro em mãos</p>
          <p className="text-xl font-[800] text-foreground">R$ {currentCashInHand.toFixed(2)}</p>
        </Card>
      </div>

      {/* ── SECTION 1: ENTREGAS DO DIA ── */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            Entregas do dia ({deliveries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {deliveries.map(d => {
              const statusConfig = {
                pending: { label: "A entregar", color: "bg-[hsl(var(--badge-orange))]/10 text-[hsl(var(--badge-orange))]", icon: Clock },
                delivered: { label: "Entregue", color: "bg-[hsl(var(--badge-green))]/10 text-[hsl(var(--badge-green))]", icon: CheckCircle2 },
                not_delivered: { label: "Não entregue", color: "bg-destructive/10 text-destructive", icon: XCircle },
              };
              const sc = statusConfig[d.status];
              const StatusIcon = sc.icon;

              return (
                <div key={d.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{d.customer}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{d.address}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-[800] text-foreground">R$ {d.amount.toFixed(2)}</p>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${sc.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {sc.label}
                      </Badge>
                    </div>
                  </div>

                  {d.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-10 bg-[hsl(var(--badge-green))] hover:bg-[hsl(var(--badge-green))]/90 text-white font-bold gap-1.5"
                        onClick={() => {
                          setReceiveDialog(d.id);
                          setReceivePayment("");
                          setReceiveCash("");
                          setReceiveNotes("");
                        }}>
                        <CheckCircle2 className="w-4 h-4" /> Entregue
                      </Button>
                      <Button size="sm" variant="outline" className="h-10 border-destructive/30 text-destructive gap-1.5"
                        onClick={() => handleMarkNotDelivered(d.id)}>
                        <XCircle className="w-4 h-4" /> Não entregue
                      </Button>
                    </div>
                  )}

                  {d.status === "delivered" && d.actualPayment && (
                    <p className="text-[10px] text-muted-foreground">
                      Pago via: {PAYMENT_OPTIONS.find(p => p.value === d.actualPayment)?.label}
                      {d.receivedAmount && d.actualPayment === "cash" && ` · Recebido: R$ ${d.receivedAmount.toFixed(2)}`}
                    </p>
                  )}
                </div>
              );
            })}

            {deliveries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma entrega designada.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 3: MEU CAIXA DO DIA ── */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-muted-foreground" />
            Meu caixa do dia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-[var(--r3)] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fundo inicial:</span>
              <span className="font-medium">R$ {session.opening_balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recebido em dinheiro:</span>
              <span className="font-medium text-[hsl(var(--badge-green))]">+R$ {totalCashInHand.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Já repassado:</span>
              <span className="font-medium text-destructive">-R$ {totalHandedOver.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Total em mãos:</span>
              <span className="text-lg font-[800] text-foreground">R$ {currentCashInHand.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 h-12 font-bold gap-2" variant="outline"
              onClick={() => {
                setHandoverAmount(currentCashInHand.toFixed(2));
                setHandoverReceiver("");
                setHandoverConfirm(false);
                setHandoverDialog(true);
              }}>
              <ArrowRightLeft className="w-4 h-4" /> Repassar dinheiro
            </Button>
            <Button className="flex-1 h-12 font-bold gap-2 border-destructive/30 text-destructive" variant="outline"
              onClick={() => {
                setClosingCash("");
                setClosingConfirm(false);
                setClosingDialog(true);
              }}>
              <XCircle className="w-4 h-4" /> Fechar caixa
            </Button>
          </div>

          {/* Handover history */}
          {handoverMovements.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Repasses realizados</p>
              {handoverMovements.map(m => (
                <div key={m.id} className="flex items-center justify-between text-xs p-2 rounded-[var(--r2)] bg-muted/30">
                  <span className="text-muted-foreground">{m.description}</span>
                  <div className="text-right">
                    <span className="font-bold text-foreground">R$ {m.amount.toFixed(2)}</span>
                    <span className="text-[9px] text-muted-foreground ml-2">{format(new Date(m.created_at), "HH:mm")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── DIALOG: REGISTRAR RECEBIMENTO ── */}
      <Dialog open={!!receiveDialog} onOpenChange={o => !o && setReceiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--badge-green))]" /> Registrar Entrega
            </DialogTitle>
          </DialogHeader>
          {activeDelivery && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-[var(--r3)] p-3 text-sm">
                <p className="font-bold text-foreground">{activeDelivery.customer}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeDelivery.address}</p>
                <p className="text-lg font-[800] text-foreground mt-2">R$ {activeDelivery.amount.toFixed(2)}</p>
              </div>

              <div>
                <Label className="font-bold text-sm">Como o cliente pagou?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PAYMENT_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const selected = receivePayment === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReceivePayment(opt.value)}
                        className={`flex items-center gap-2 p-3 rounded-[var(--r3)] border-[1.5px] text-left transition-all text-sm ${
                          selected ? "border-primary bg-primary/[0.04]" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {receivePayment === "cash" && (
                <div className="space-y-3">
                  <div>
                    <Label>Valor recebido (R$)</Label>
                    <Input
                      type="number"
                      value={receiveCash}
                      onChange={e => setReceiveCash(e.target.value)}
                      placeholder={activeDelivery.amount.toFixed(2)}
                      className="h-12 text-lg font-bold mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[50, 100, 200].map(v => (
                      <Button key={v} variant="outline" size="sm" className="flex-1"
                        onClick={() => setReceiveCash(String(v))}>
                        R$ {v}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => setReceiveCash(activeDelivery.amount.toFixed(2))}>
                      Exato
                    </Button>
                  </div>
                  {changeDue !== null && changeDue > 0 && (
                    <div className="bg-[hsl(var(--badge-orange))]/10 rounded-[var(--r3)] p-3 text-center">
                      <p className="text-xs text-muted-foreground">Troco</p>
                      <p className="text-xl font-[800] text-[hsl(var(--badge-orange))]">R$ {changeDue.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs">Foto da assinatura do recebimento (opcional)</Label>
                <div className="mt-1 border-2 border-dashed border-border rounded-[var(--r3)] p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <Pen className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  Toque para assinar ou tirar foto
                </div>
              </div>

              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea value={receiveNotes} onChange={e => setReceiveNotes(e.target.value)}
                  placeholder="Ex: Deixado na portaria" rows={2} className="mt-1" />
              </div>

              <Button className="w-full h-12 text-base font-bold bg-[hsl(var(--badge-green))] hover:bg-[hsl(var(--badge-green))]/90 text-white"
                disabled={!receivePayment || createMovement.isPending}
                onClick={handleMarkDelivered}>
                Confirmar Entrega
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: REPASSAR DINHEIRO ── */}
      <Dialog open={handoverDialog} onOpenChange={o => !o && setHandoverDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> Repassar Dinheiro
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-[var(--r3)] p-3 text-center">
              <p className="text-xs text-muted-foreground">Dinheiro disponível em mãos</p>
              <p className="text-2xl font-[800] text-foreground">R$ {currentCashInHand.toFixed(2)}</p>
            </div>

            <div>
              <Label>Valor a repassar (R$) *</Label>
              <Input type="number" value={handoverAmount} onChange={e => setHandoverAmount(e.target.value)}
                className="h-12 text-lg font-bold mt-1" />
            </div>

            <div>
              <Label>Quem recebeu *</Label>
              <Input value={handoverReceiver} onChange={e => setHandoverReceiver(e.target.value)}
                placeholder="Nome do responsável" className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">Assinatura de quem recebeu</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-[var(--r3)] p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <Pen className="w-6 h-6 mx-auto mb-1 opacity-40" />
                Toque para assinar
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-[var(--r3)] border border-border">
              <Checkbox id="confirm-handover" checked={handoverConfirm} onCheckedChange={v => setHandoverConfirm(!!v)} />
              <label htmlFor="confirm-handover" className="text-xs text-foreground leading-relaxed cursor-pointer">
                Confirmo que estou entregando o valor acima ao responsável indicado.
              </label>
            </div>

            <Button className="w-full h-12 text-base font-bold"
              disabled={!handoverConfirm || !handoverAmount || !handoverReceiver || createMovement.isPending}
              onClick={handleHandover}>
              Confirmar Repasse
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: FECHAR CAIXA ENTREGADOR ── */}
      <Dialog open={closingDialog} onOpenChange={o => !o && setClosingDialog(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" /> Conferência Final — {register.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-[var(--r3)] p-4 space-y-2 text-sm">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Resumo do dia</h4>
              <div className="grid grid-cols-2 gap-y-1.5">
                <span className="text-muted-foreground">Entregas realizadas:</span>
                <span className="font-medium text-right">{delivered.length}</span>
                <span className="text-muted-foreground">Não entregues:</span>
                <span className="font-medium text-right text-destructive">{notDelivered.length}</span>
                <span className="text-muted-foreground">Total vendido:</span>
                <span className="font-medium text-right">R$ {totalDelivered.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-y-1.5">
                <span className="text-muted-foreground">Fundo inicial:</span>
                <span className="font-medium text-right">R$ {session.opening_balance.toFixed(2)}</span>
                <span className="text-muted-foreground">Dinheiro recebido:</span>
                <span className="font-medium text-right text-[hsl(var(--badge-green))]">+R$ {totalCashInHand.toFixed(2)}</span>
                <span className="text-muted-foreground">Repassado:</span>
                <span className="font-medium text-right text-destructive">-R$ {totalHandedOver.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">ESPERADO EM MÃOS:</span>
                <span className="text-lg font-[800] text-foreground">R$ {currentCashInHand.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label className="font-bold">Dinheiro contado (R$) *</Label>
              <Input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)}
                placeholder="0.00" className="h-12 text-lg font-bold mt-1" />
            </div>

            {closingDiff !== null && (
              <div className={`flex items-center gap-2 p-3 rounded-[var(--r3)] ${
                closingDiff === 0 ? "bg-[hsl(var(--badge-green))]/10" : Math.abs(closingDiff) <= 5 ? "bg-[hsl(var(--badge-orange))]/10" : "bg-destructive/10"
              }`}>
                {closingDiff === 0 ? <CheckCircle2 className="w-4 h-4 text-[hsl(var(--badge-green))]" /> :
                  <AlertTriangle className={`w-4 h-4 ${Math.abs(closingDiff) <= 5 ? "text-[hsl(var(--badge-orange))]" : "text-destructive"}`} />}
                <span className={`text-sm font-bold ${
                  closingDiff === 0 ? "text-[hsl(var(--badge-green))]" : Math.abs(closingDiff) <= 5 ? "text-[hsl(var(--badge-orange))]" : "text-destructive"
                }`}>
                  Diferença: R$ {closingDiff >= 0 ? "+" : ""}{closingDiff.toFixed(2)}
                </span>
              </div>
            )}

            <div>
              <Label className="text-xs">Foto do dinheiro + assinatura</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-[var(--r3)] p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <Camera className="w-6 h-6 mx-auto mb-1 opacity-40" />
                Tirar foto do dinheiro para registro
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-[var(--r3)] border border-border">
              <Checkbox id="confirm-close-delivery" checked={closingConfirm} onCheckedChange={v => setClosingConfirm(!!v)} />
              <label htmlFor="confirm-close-delivery" className="text-xs text-foreground leading-relaxed cursor-pointer">
                Confirmo que o valor acima foi conferido e assinado pelo operador do caixa central.
              </label>
            </div>

            <Button className="w-full h-12 text-base font-bold" variant="destructive"
              disabled={!closingConfirm || !closingCash || closeSessionMut.isPending}
              onClick={handleClose}>
              {closeSessionMut.isPending ? "Fechando..." : "Confirmar Fechamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
