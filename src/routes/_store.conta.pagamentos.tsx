import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Receipt,
  FileText,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
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
import { EmptyState } from "@/components/state/states";
import { getCustomerInstallments } from "@/services/installments.functions";
import { getCustomerOrderPayments } from "@/services/payment.functions";
import { formatMoney } from "@/lib/money";
import { Surface } from "@/components/ui/surface";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/pagamentos")({
  head: () => ({ meta: [{ title: "Central de Pagamentos" }] }),
  loader: async () => {
    const [plans, orders] = await Promise.all([
      getCustomerInstallments().catch(() => []),
      getCustomerOrderPayments().catch(() => []),
    ]);
    return { plans, orders };
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
  const { plans, orders } = Route.useLoaderData();

  if (plans.length === 0 && orders.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Central de Pagamentos" />
        <EmptyState title="Nenhum histórico de pagamento" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Central de Pagamentos" />

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

      {/* Seção 2: Carnês e Crediário */}
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
                <div className="flex flex-row items-center justify-between p-6 bg-muted/30 border-b border-border/20">
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
    </div>
  );
}
