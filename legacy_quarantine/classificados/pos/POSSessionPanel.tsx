import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownCircle, ArrowUpCircle, Receipt, StickyNote, Camera,
  XCircle, Banknote, CreditCard, QrCode, Clock, AlertTriangle,
  CheckCircle2, FileText, X, ChevronLeft, ShoppingCart,
} from "lucide-react";
import POSSalesTerminal from "./POSSalesTerminal";
import POSDeliveryMode from "./POSDeliveryMode";
import { toast } from "sonner";
import { format } from "date-fns";
import type { POSRegister, POSSession, POSMovement } from "@/hooks/usePOS";
import { useCreateMovement, usePOSMovements, useCloseSession, MOVEMENT_TYPES } from "@/hooks/usePOS";

interface Props {
  register: POSRegister;
  session: POSSession;
  companyId: string;
  teamMembers: any[];
  onBack: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: "limpeza", label: "Limpeza" },
  { value: "material", label: "Material" },
  { value: "combustivel", label: "Combustível" },
  { value: "alimentacao", label: "Alimentação equipe" },
  { value: "outros", label: "Outros" },
];

const SANGRIA_REASONS = [
  { value: "deposito", label: "Depósito bancário" },
  { value: "fornecedor", label: "Pagamento fornecedor" },
  { value: "outro", label: "Outro" },
];

type MovDialog = "sangria" | "suprimento" | "vale" | "despesa" | "nota" | "anotacao" | "fechar" | null;

export default function POSSessionPanel({ register, session, companyId, teamMembers, onBack }: Props) {
  const { data: movements } = usePOSMovements(session.id);
  const createMovement = useCreateMovement();
  const closeSessionMut = useCloseSession();

  const [dialog, setDialog] = useState<MovDialog>(null);
  const [showSalesTerminal, setShowSalesTerminal] = useState(false);

  // Movement form states
  const [movAmount, setMovAmount] = useState("");
  const [movReason, setMovReason] = useState("");
  const [movDesc, setMovDesc] = useState("");
  const [movCategory, setMovCategory] = useState("");
  const [movEmployee, setMovEmployee] = useState("");
  const [movAuth, setMovAuth] = useState("");
  const [movNote, setMovNote] = useState("");

  // Closing form
  const [closingCash, setClosingCash] = useState("");
  const [closingConfirm, setClosingConfirm] = useState(false);
  const [closingNotes, setClosingNotes] = useState("");

  const resetForm = () => {
    setMovAmount(""); setMovReason(""); setMovDesc(""); setMovCategory("");
    setMovEmployee(""); setMovAuth(""); setMovNote("");
  };

  const submitMovement = (type: string, amount: number, desc: string, category?: string, employeeId?: string) => {
    createMovement.mutate({
      session_id: session.id, type, amount, description: desc || null,
      category: category || null, authorized_by: movAuth || null,
      photo_url: null, employee_id: employeeId || null,
    }, {
      onSuccess: () => { resetForm(); setDialog(null); toast.success("Movimentação registrada!"); },
      onError: () => toast.error("Erro ao registrar movimentação"),
    });
  };

  // Compute totals from movements
  const sangrias = movements?.filter(m => m.type === "sangria") || [];
  const suprimentos = movements?.filter(m => m.type === "suprimento") || [];
  const despesas = movements?.filter(m => m.type === "despesa") || [];
  const vales = movements?.filter(m => m.type === "vale") || [];
  const notas = movements?.filter(m => m.type === "nota") || [];
  const anotacoes = movements?.filter(m => m.type === "anotacao") || [];

  const totalSangrias = sangrias.reduce((a, m) => a + m.amount, 0);
  const totalSuprimentos = suprimentos.reduce((a, m) => a + m.amount, 0);
  const totalDespesas = despesas.reduce((a, m) => a + m.amount, 0);
  const totalVales = vales.reduce((a, m) => a + m.amount, 0);

  const expectedCash = session.opening_balance + (session.total_cash || 0) + totalSuprimentos - totalSangrias - totalDespesas - totalVales;

  const handleClose = () => {
    if (!closingConfirm) { toast.error("Confirme o fechamento"); return; }
    const actualCash = Number(closingCash) || 0;
    const diff = actualCash - expectedCash;
    closeSessionMut.mutate({
      id: session.id, actual_cash: actualCash,
      closing_balance: expectedCash, difference: diff,
      notes: closingNotes || null,
    }, {
      onSuccess: () => { setDialog(null); toast.success("Caixa fechado!"); onBack(); },
    });
  };

  const diffValue = closingCash ? (Number(closingCash) || 0) - expectedCash : null;
  const diffColor = diffValue === null ? "" : diffValue === 0 ? "text-[hsl(var(--badge-green))]" : Math.abs(diffValue) <= 5 ? "text-[hsl(var(--badge-orange))]" : "text-destructive";

  // If register is in delivery mode, show delivery interface directly
  if (register.operation_mode === "delivery") {
    return (
      <POSDeliveryMode
        register={register}
        session={session}
        companyId={companyId}
        onBack={onBack}
      />
    );
  }

  if (showSalesTerminal) {
    return (
      <POSSalesTerminal
        register={register}
        session={session}
        companyId={companyId}
        onBack={() => setShowSalesTerminal(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-[800] text-foreground">{register.name}</h1>
          <p className="text-xs text-muted-foreground">
            Aberto às {format(new Date(session.opened_at), "HH:mm")} · Fundo: R$ {session.opening_balance.toFixed(2)}
          </p>
        </div>
        <Badge className="text-xs">Aberto</Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Vendas", value: session.total_sales || 0, icon: Banknote },
          { label: "Dinheiro", value: session.total_cash || 0, icon: Banknote },
          { label: "PIX", value: session.total_pix || 0, icon: QrCode },
          { label: "Cartão", value: (session.total_card || 0) + (session.total_other || 0), icon: CreditCard },
        ].map(s => (
          <Card key={s.label} className="border border-border p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-[800] text-foreground">R$ {s.value.toFixed(2)}</p>
          </Card>
        ))}
      </div>

      {/* Open PDV */}
      <Button className="w-full h-12 text-base font-[800] bg-primary text-primary-foreground gap-2"
        onClick={() => setShowSalesTerminal(true)}>
        <ShoppingCart className="w-5 h-5" /> Abrir Tela de Vendas (PDV)
      </Button>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { key: "sangria" as const, label: "Sangria", icon: ArrowDownCircle, color: "text-destructive" },
          { key: "suprimento" as const, label: "Suprimento", icon: ArrowUpCircle, color: "text-[hsl(var(--badge-green))]" },
          { key: "vale" as const, label: "Vale", icon: FileText, color: "text-[hsl(var(--badge-orange))]" },
          { key: "despesa" as const, label: "Despesa", icon: Receipt, color: "text-[hsl(var(--badge-purple))]" },
          { key: "nota" as const, label: "Foto Nota", icon: Camera, color: "text-[hsl(var(--badge-blue))]" },
          { key: "anotacao" as const, label: "Anotar", icon: StickyNote, color: "text-muted-foreground" },
        ].map(btn => {
          const Icon = btn.icon;
          return (
            <Button key={btn.key} variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs border-border"
              onClick={() => { resetForm(); setDialog(btn.key); }}>
              <Icon className={`w-5 h-5 ${btn.color}`} />
              {btn.label}
            </Button>
          );
        })}
      </div>

      {/* Close register button */}
      <Button variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
        onClick={() => { setClosingCash(""); setClosingConfirm(false); setClosingNotes(""); setDialog("fechar"); }}>
        <XCircle className="w-4 h-4" /> Fechar Caixa
      </Button>

      {/* Movement history */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Movimentações ({movements?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!movements || movements.length === 0) ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma movimentação registrada nesta sessão.</p>
          ) : (
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {movements.map(m => {
                const isOut = ["sangria", "despesa", "vale"].includes(m.type);
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isOut ? "bg-destructive/10" : m.type === "anotacao" ? "bg-muted" : "bg-[hsl(var(--badge-green))]/10"}`}>
                      {isOut ? <ArrowDownCircle className="w-3.5 h-3.5 text-destructive" /> :
                        m.type === "anotacao" ? <StickyNote className="w-3.5 h-3.5 text-muted-foreground" /> :
                        m.type === "nota" ? <Camera className="w-3.5 h-3.5 text-[hsl(var(--badge-blue))]" /> :
                        <ArrowUpCircle className="w-3.5 h-3.5 text-[hsl(var(--badge-green))]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground capitalize">{MOVEMENT_TYPES[m.type as keyof typeof MOVEMENT_TYPES] || m.type}</span>
                      {m.description && <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      {m.type !== "anotacao" && (
                        <span className={`font-bold text-sm ${isOut ? "text-destructive" : "text-[hsl(var(--badge-green))]"}`}>
                          {isOut ? "-" : "+"}R$ {m.amount.toFixed(2)}
                        </span>
                      )}
                      <p className="text-[9px] text-muted-foreground">{format(new Date(m.created_at), "HH:mm")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── DIALOGS ── */}

      {/* SANGRIA */}
      <Dialog open={dialog === "sangria"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownCircle className="w-5 h-5 text-destructive" /> Sangria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Valor retirado (R$) *</Label><Input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="0.00" /></div>
            <div>
              <Label>Motivo *</Label>
              <Select value={movReason} onValueChange={setMovReason}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{SANGRIA_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Autorizado por (senha)</Label><Input type="password" value={movAuth} onChange={e => setMovAuth(e.target.value)} placeholder="Senha gerencial" /></div>
            <Button className="w-full" disabled={!movAmount || !movReason || createMovement.isPending}
              onClick={() => submitMovement("sangria", Number(movAmount), SANGRIA_REASONS.find(r => r.value === movReason)?.label || movReason)}>
              Registrar Sangria
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUPRIMENTO */}
      <Dialog open={dialog === "suprimento"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpCircle className="w-5 h-5 text-[hsl(var(--badge-green))]" /> Suprimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Valor (R$) *</Label><Input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Motivo</Label><Input value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Troco adicional, reforço..." /></div>
            <div><Label>Autorização (senha)</Label><Input type="password" value={movAuth} onChange={e => setMovAuth(e.target.value)} placeholder="Senha gerencial" /></div>
            <Button className="w-full" disabled={!movAmount || createMovement.isPending}
              onClick={() => submitMovement("suprimento", Number(movAmount), movDesc)}>
              Registrar Suprimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VALE */}
      <Dialog open={dialog === "vale"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-[hsl(var(--badge-orange))]" /> Vale (Adiantamento)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={movEmployee} onValueChange={setMovEmployee}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$) *</Label><Input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Observação</Label><Input value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Motivo do adiantamento" /></div>
            <Button className="w-full" disabled={!movAmount || !movEmployee || createMovement.isPending}
              onClick={() => submitMovement("vale", Number(movAmount), movDesc, undefined, movEmployee)}>
              Registrar Vale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DESPESA */}
      <Dialog open={dialog === "despesa"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-[hsl(var(--badge-purple))]" /> Despesa Operacional</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria *</Label>
              <Select value={movCategory} onValueChange={setMovCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor (R$) *</Label><Input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Descrição</Label><Textarea value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Detalhe da despesa" rows={2} /></div>
            <div>
              <Label className="text-xs">Foto da nota/comprovante (opcional)</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-[var(--r3)] p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <Camera className="w-6 h-6 mx-auto mb-1 opacity-40" />
                Clique para tirar foto ou fazer upload
              </div>
            </div>
            <Button className="w-full" disabled={!movAmount || !movCategory || createMovement.isPending}
              onClick={() => submitMovement("despesa", Number(movAmount), movDesc, movCategory)}>
              Registrar Despesa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FOTO DE NOTA (modo rápido) */}
      <Dialog open={dialog === "nota"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-[hsl(var(--badge-blue))]" /> Foto de Nota</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-[var(--r3)] p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
              <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">Aponte para o QR Code da NF-e</p>
              <p className="text-[10px] text-muted-foreground mt-1">Ou tire foto do cupom para registro</p>
            </div>
            <Separator />
            <div><Label>Valor (R$)</Label><Input type="number" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="Preenchido automaticamente pelo QR" /></div>
            <div><Label>Descrição</Label><Input value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="CNPJ emissor, itens..." /></div>
            <Button className="w-full" disabled={createMovement.isPending}
              onClick={() => submitMovement("nota", Number(movAmount) || 0, movDesc || "Nota fiscal registrada")}>
              Salvar Nota
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ANOTAÇÃO */}
      <Dialog open={dialog === "anotacao"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><StickyNote className="w-5 h-5" /> Anotação do Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Anotação *</Label><Textarea value={movNote} onChange={e => setMovNote(e.target.value)} placeholder='Ex: "Cliente reclamou do produto X", "Troca feita para João"' rows={4} /></div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Timestamp automático · Visível apenas para a gerência</p>
            <Button className="w-full" disabled={!movNote.trim() || createMovement.isPending}
              onClick={() => {
                createMovement.mutate({
                  session_id: session.id, type: "anotacao", amount: 0,
                  description: movNote.trim(), category: null, authorized_by: null,
                  photo_url: null, employee_id: null,
                }, {
                  onSuccess: () => { setMovNote(""); setDialog(null); toast.success("Anotação salva!"); },
                });
              }}>
              Salvar Anotação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FECHAMENTO */}
      <Dialog open={dialog === "fechar"} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive" /> Fechar Caixa — {register.name}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-muted/50 rounded-[var(--r3)] p-4 space-y-2 text-sm">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-3">Resumo da sessão</h4>
              <div className="grid grid-cols-2 gap-y-1.5">
                <span className="text-muted-foreground">Abertura (fundo):</span>
                <span className="font-medium text-right">R$ {session.opening_balance.toFixed(2)}</span>
                <span className="text-muted-foreground">Vendas em dinheiro:</span>
                <span className="font-medium text-right">R$ {(session.total_cash || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Suprimentos:</span>
                <span className="font-medium text-[hsl(var(--badge-green))] text-right">+R$ {totalSuprimentos.toFixed(2)}</span>
                <span className="text-muted-foreground">Sangrias:</span>
                <span className="font-medium text-destructive text-right">-R$ {totalSangrias.toFixed(2)}</span>
                <span className="text-muted-foreground">Despesas:</span>
                <span className="font-medium text-destructive text-right">-R$ {totalDespesas.toFixed(2)}</span>
                <span className="text-muted-foreground">Vales:</span>
                <span className="font-medium text-destructive text-right">-R$ {totalVales.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">SALDO ESPERADO:</span>
                <span className="text-lg font-[800] text-foreground">R$ {expectedCash.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-muted/30 rounded-[var(--r3)] p-4 space-y-1.5 text-sm">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-2">Vendas por forma de pagamento</h4>
              <div className="grid grid-cols-2 gap-y-1">
                <span className="text-muted-foreground">Dinheiro:</span>
                <span className="font-medium text-right">R$ {(session.total_cash || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">PIX:</span>
                <span className="font-medium text-right">R$ {(session.total_pix || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Cartão débito/crédito:</span>
                <span className="font-medium text-right">R$ {(session.total_card || 0).toFixed(2)}</span>
                <span className="text-muted-foreground">Outros:</span>
                <span className="font-medium text-right">R$ {(session.total_other || 0).toFixed(2)}</span>
              </div>
              <Separator className="my-1.5" />
              <div className="flex justify-between">
                <span className="font-bold">TOTAL VENDAS:</span>
                <span className="font-bold">R$ {(session.total_sales || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Physical count */}
            <div className="space-y-3">
              <div>
                <Label className="font-bold">Dinheiro contado (R$) *</Label>
                <Input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)} placeholder="0.00" className="mt-1 h-12 text-lg font-bold" />
              </div>
              {diffValue !== null && (
                <div className={`flex items-center gap-2 p-3 rounded-[var(--r3)] ${diffValue === 0 ? "bg-[hsl(var(--badge-green))]/10" : Math.abs(diffValue) <= 5 ? "bg-[hsl(var(--badge-orange))]/10" : "bg-destructive/10"}`}>
                  {diffValue === 0 ? <CheckCircle2 className="w-4 h-4 text-[hsl(var(--badge-green))]" /> :
                    <AlertTriangle className={`w-4 h-4 ${Math.abs(diffValue) <= 5 ? "text-[hsl(var(--badge-orange))]" : "text-destructive"}`} />}
                  <span className={`text-sm font-bold ${diffColor}`}>
                    Diferença: R$ {diffValue >= 0 ? "+" : ""}{diffValue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div><Label>Observações do fechamento</Label><Textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)} placeholder="Notas sobre o fechamento..." rows={2} /></div>

            {/* Confirmation */}
            <div className="flex items-start gap-2 p-3 rounded-[var(--r3)] border border-border">
              <Checkbox id="confirm-close" checked={closingConfirm} onCheckedChange={v => setClosingConfirm(!!v)} />
              <label htmlFor="confirm-close" className="text-xs text-foreground leading-relaxed cursor-pointer">
                Confirmo que conferi o dinheiro em caixa e que as informações acima estão corretas.
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
