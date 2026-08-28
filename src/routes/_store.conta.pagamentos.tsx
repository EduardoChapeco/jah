import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Receipt,
  FileText,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Handshake,
  UploadCloud,
  Loader2,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/state/states";
import { getCustomerInstallments } from "@/services/installments.functions";
import { getCustomerOrderPayments } from "@/services/payment.functions";
import { listUserReceivables, registerInstallmentPayment } from "@/services/receivables.functions";
import { formatMoney } from "@/lib/money";
import { Surface } from "@/components/ui/surface";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/pagamentos")({
  head: () => ({ meta: [{ title: "Central de Pagamentos & Parcelas" }] }),
  loader: async () => {
    const [plans, orders, receivables] = await Promise.all([
      getCustomerInstallments().catch(() => []),
      getCustomerOrderPayments().catch(() => []),
      listUserReceivables().catch(() => []),
    ]);
    return { plans, orders, receivables };
  },
  component: CustomerInstallmentsPage,
});

function translatePaymentStatus(status: string) {
  switch (status) {
    case "awaiting_payment":
    case "pending":
      return { label: "Aguardando Pagamento", variant: "secondary" as const, icon: Clock };
    case "paid":
    case "approved":
    case "completed":
      return { label: "Aprovado", variant: "default" as const, icon: CheckCircle2 };
    case "cancelled":
    case "failed":
      return { label: "Falha / Cancelado", variant: "destructive" as const, icon: AlertCircle };
    default:
      return { label: status, variant: "outline" as const, icon: FileText };
  }
}

function translatePaymentMethod(method?: string) {
  switch (method) {
    case "pix":
      return "PIX";
    case "credit_card":
      return "Cartão de Crédito";
    case "boleto":
      return "Boleto Bancário";
    case "manual":
      return "Transferência / Manual";
    default:
      return "Online";
  }
}

function CustomerInstallmentsPage() {
  const { plans, orders, receivables } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [notes, setNotes] = useState("");

  const payInstallmentMutation = useMutation({
    mutationFn: registerInstallmentPayment,
    onSuccess: () => {
      toast.success("Pagamento da parcela registrado com sucesso!");
      setPaymentModalOpen(false);
      setSelectedInstallment(null);
      setPaymentProofUrl("");
      setNotes("");
      router.invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registrar quitação da parcela.");
    },
  });

  const handleOpenPay = (inst: any) => {
    setSelectedInstallment(inst);
    setPaymentModalOpen(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInstallment) return;
    payInstallmentMutation.mutate({
      data: {
        installmentId: selectedInstallment.id,
        paymentMethod: "PIX",
        paymentProofUrl: paymentProofUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      },
    });
  };

  const hasAnyData =
    plans.length > 0 || orders.length > 0 || (receivables && receivables.length > 0);

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <EmptyState title="Nenhum histórico de pagamento ou cobrança" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Seção 1: Pagamentos de Pedidos */}
      {orders.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Pagamentos de Pedidos
            </h2>
            <p className="text-sm text-muted-foreground">
              Status de pagamentos PIX, Cartões e transferências de seus pedidos mais recentes.
            </p>
          </div>

          <Surface variant="default" padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status do Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => {
                  const payment = order.payments?.[0] || {};
                  const statusInfo = translatePaymentStatus(payment.status || order.status);
                  const Icon = statusInfo.icon;
                  const needsPayment =
                    order.status === "awaiting_payment" || payment.status === "pending";

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">#{order.public_token}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        {translatePaymentMethod(order.payment_method || payment.method)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatMoney(order.total_cents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusInfo.variant}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          size="sm"
                          variant={needsPayment ? "default" : "outline"}
                          className="font-medium"
                        >
                          <Link to="/conta/pedidos/$id" params={{ id: order.id }}>
                            {needsPayment ? "Pagar / Anexar Comprovante" : "Ver Detalhes"}
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Surface>
        </section>
      )}

      {/* Seção 2: Recebíveis e Parcelas P2P */}
      {receivables && receivables.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              Recebíveis & Parcelas de Negociações (P2P)
            </h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe as parcelas de vendas parceladas, contratos e acordos entre membros.
            </p>
          </div>

          <div className="space-y-6">
            {receivables.map((rec: any) => (
              <Surface variant="default" padding="none" key={rec.id}>
                <div className="flex flex-row items-center justify-between p-6 bg-muted/30 ">
                  <div>
                    <h3 className="text-lg flex items-center font-bold">
                      <FileText className="mr-2 h-5 w-5 text-primary" />
                      {rec.title || "Acordo P2P"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total:{" "}
                      <strong className="text-foreground">
                        {formatMoney(rec.total_amount_cents)}
                      </strong>{" "}
                      • {rec.total_installments} parcelas
                    </p>
                  </div>
                  <Badge
                    variant={
                      rec.status === "settled"
                        ? "default"
                        : rec.status === "defaulted"
                          ? "destructive"
                          : "outline"
                    }
                    className="uppercase text-[10px]"
                  >
                    {rec.status === "settled"
                      ? "Quitado"
                      : rec.status === "active"
                        ? "Em Aberto"
                        : rec.status}
                  </Badge>
                </div>

                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Pagamento</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(rec.installments || []).map((inst: any) => {
                        const isLate =
                          inst.status === "pending" && new Date(inst.due_date) < new Date();
                        const isPaid = inst.status === "paid";

                        return (
                          <TableRow key={inst.id}>
                            <TableCell className="font-medium">
                              {inst.installment_number}ª Parcela
                            </TableCell>
                            <TableCell>{formatDate(inst.due_date)}</TableCell>
                            <TableCell className="font-semibold font-mono">
                              {formatMoney(inst.amount_cents)}
                            </TableCell>
                            <TableCell>
                              {isPaid ? (
                                <Badge variant="default" className="bg-emerald-600">
                                  Paga
                                </Badge>
                              ) : isLate ? (
                                <Badge variant="destructive">Em Atraso</Badge>
                              ) : (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {inst.paid_at ? formatDate(inst.paid_at) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenPay(inst)}
                                  className="h-8 text-xs font-semibold rounded-xl"
                                >
                                  Quitar Parcela
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Surface>
            ))}
          </div>
        </section>
      )}

      {/* Seção 3: Carnês e Crediário */}
      {plans.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Carnês e Crediário da Loja
            </h2>
            <p className="text-sm text-muted-foreground">
              Seus parcelamentos ativos via crediário e faturas de carnê.
            </p>
          </div>

          <div className="space-y-6">
            {plans.map((plan: any) => (
              <Surface variant="default" padding="none" key={plan.id}>
                <div className="flex flex-row items-center justify-between p-6 bg-muted/30 ">
                  <div>
                    <h3 className="text-lg flex items-center font-bold">
                      <FileText className="mr-2 h-5 w-5" />
                      Pedido #{plan.orderToken}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gerado em {formatDate(plan.createdAt)} — Total: {formatMoney(plan.totalCents)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      plan.status === "active"
                        ? "default"
                        : plan.status === "paid_off"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {plan.status === "active"
                      ? "Ativo"
                      : plan.status === "paid_off"
                        ? "Quitado"
                        : "Em Atraso"}
                  </Badge>
                </div>
                <div className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Pagamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plan.installments.map((inst: any, idx: number) => {
                        const isLate =
                          inst.status === "pending" && new Date(inst.dueDate) < new Date();
                        return (
                          <TableRow key={inst.id}>
                            <TableCell className="font-medium">{idx + 1}ª</TableCell>
                            <TableCell>{formatDate(inst.dueDate)}</TableCell>
                            <TableCell>{formatMoney(inst.amountCents)}</TableCell>
                            <TableCell>
                              {inst.status === "paid" ? (
                                <Badge variant="default" className="bg-success hover:bg-success">
                                  Paga
                                </Badge>
                              ) : isLate ? (
                                <Badge variant="destructive">Atrasada</Badge>
                              ) : (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                            </TableCell>
                            <TableCell>{inst.paidAt ? formatDate(inst.paidAt) : "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Surface>
            ))}
          </div>
        </section>
      )}

      {/* Modal de Quitação de Parcela */}
      {selectedInstallment && (
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-md sm:rounded-2xl sm:p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-foreground">
                Quitar {selectedInstallment.installment_number}ª Parcela
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Valor:{" "}
                <strong className="text-foreground">
                  {formatMoney(selectedInstallment.amount_cents)}
                </strong>{" "}
                • Vencimento: {formatDate(selectedInstallment.due_date)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Link do Comprovante de Pagamento (opcional)
                </Label>
                <Input
                  value={paymentProofUrl}
                  onChange={(e) => setPaymentProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 rounded-xl text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Observações / Código da Transação</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pago via PIX pelo banco Nubank às 14:30"
                  rows={3}
                  className="rounded-xl text-xs bg-background resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={handleConfirmPay}
                  disabled={payInstallmentMutation.isPending}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                >
                  {payInstallmentMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Pagamento</span>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
