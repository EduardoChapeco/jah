import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import { listUserReceivables, registerInstallmentPayment } from "@/services/receivables.functions";

import { ImageUpload } from "@/components/ui/image-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/workspace/financeiro/recebiveis")({
  head: () => ({ meta: [{ title: "Contas a Receber" }] }),
  loader: async () => {
    try {
      const receivables = await listUserReceivables();
      return { receivables };
    } catch {
      return { receivables: [] };
    }
  },
  component: ReceivablesDashboard,
});

function ReceivablesDashboard() {
  const { receivables: initialData } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const { data: receivables } = useQuery({
    queryKey: ["receivables-list"],
    queryFn: () => listUserReceivables(),
    initialData,
  });

  const { mutate: payInstallment, isPending: isPaying } = useMutation({
    mutationFn: registerInstallmentPayment,
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["receivables-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar pagamento.");
    }
  });

  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;
    
    payInstallment({
      data: {
        installmentId: selectedInstallment.id,
        paymentMethod: "PIX",
        paymentProofUrl: proofUrl || undefined,
        notes: paymentNotes || undefined,
      }
    });
    setIsPayModalOpen(false);
    setProofUrl("");
    setPaymentNotes("");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageHeader
        title="Contas a Receber e Pagar (P2P)"
      />
      <p className="text-muted-foreground text-sm max-w-2xl">
        Gestão financeira de seus acordos e contratos. Acompanhe as parcelas recebíveis ou faturas pendentes que você precisa pagar a outras partes.
      </p>

      {receivables.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/10 rounded-3xl p-8 border border-dashed">
          <Banknote size={48} className="text-muted-foreground/30 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Nenhuma conta encontrada</h2>
          <p className="text-sm text-muted-foreground">Você ainda não tem acordos financeiros firmados.</p>
        </div>
      ) : (
        <div className="grid gap-6 mt-6">
          {receivables.map((rec: any) => {
            const isCreditor = rec.creditor?.id !== undefined; // Actually depends on logged in user, but UI groups it globally here for simplicity as listUserReceivables handles OR.
            return (
              <div key={rec.id} className="bg-card rounded-3xl border shadow-sm overflow-hidden">
                {/* Header do Recebível */}
                <div className="p-6 border-b bg-muted/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Receipt size={20} className="text-primary" /> {rec.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1"><FileText size={14}/> Total: {formatMoney(rec.total_cents)}</span>
                      <span className="flex items-center gap-1"><Calendar size={14}/> {rec.installments_count} Parcelas</span>
                    </div>
                  </div>
                  <div>
                    <Badge variant={rec.status === 'active' ? 'default' : rec.status === 'settled' ? 'secondary' : 'destructive'} className="text-sm">
                      {rec.status === 'active' ? 'Ativo' : rec.status === 'settled' ? 'Quitado' : rec.status}
                    </Badge>
                  </div>
                </div>

                {/* Lista de Parcelas */}
                <div className="p-6">
                  <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Cronograma de Parcelas</h4>
                  <div className="space-y-3">
                    {rec.installments?.sort((a: any, b: any) => a.installment_number - b.installment_number).map((inst: any) => {
                      const isOverdue = new Date(inst.due_date) < new Date() && inst.status === "pending";
                      return (
                        <div key={inst.id} className={`flex items-center justify-between p-4 rounded-2xl border ${isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-background'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${inst.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                              {inst.installment_number}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{formatMoney(inst.amount_cents)}</p>
                              <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                                <Clock size={12} /> Vence: {formatDate(inst.due_date)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant={inst.status === 'paid' ? 'outline' : 'secondary'} className={inst.status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}>
                              {inst.status === 'paid' ? 'Pago' : inst.status === 'pending' ? 'Pendente' : inst.status}
                            </Badge>
                            
                            {inst.status === "pending" && (
                              <Button 
                                size="sm" 
                                className="rounded-xl"
                                onClick={() => {
                                  setSelectedInstallment(inst);
                                  setIsPayModalOpen(true);
                                }}
                              >
                                Dar Baixa
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Baixa de Pagamento */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o recebimento (ou pagamento) da Parcela {selectedInstallment?.installment_number} no valor de {selectedInstallment ? formatMoney(selectedInstallment.amount_cents) : ''}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Comprovante de Pagamento (Foto / Anexo)</Label>
              <ImageUpload
                value={proofUrl}
                onChange={(url) => setProofUrl(url)}
                onRemove={() => setProofUrl("")}
                bucket="cms-media"
                aspectPreset="square"
                className="w-28 h-28"
                helperText="Foto ou print do comprovante"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Observações</Label>
              <Textarea 
                placeholder="Ex: Transferência via PIX recebida na conta..." 
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="rounded-2xl text-xs resize-none"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-xs rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPaying}>
              <CheckCircle2 className="mr-2 size-4" /> Confirmar Liquidação
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
