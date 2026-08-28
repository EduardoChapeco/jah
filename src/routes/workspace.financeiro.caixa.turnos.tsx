import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDateTime } from "@/lib/datetime";
import { History, ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

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
import { listRegisterHistory } from "@/services/cash.functions";
import type { CashRegisterHistoryItem, CashRegisterStatus } from "@/lib/cash";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/financeiro/caixa/turnos")({
  head: () => ({ meta: [{ title: "Turnos de Caixa" }] }),
  loader: async () => {
    return await listRegisterHistory();
  },
  component: ShiftsPage,
});

function ShiftsPage() {
  const shifts = Route.useLoaderData();

  const getStatusBadge = (status: CashRegisterStatus) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Aberto</Badge>;
      case "closed":
        return <Badge variant="secondary">Fechado</Badge>;
      case "discrepancy":
        return <Badge variant="destructive">Diferença</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        <Link to="/workspace/financeiro/caixa">Voltar ao Caixa</Link>
      </div>

      <PageHeader title="Histórico de Turnos" />

      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abertura</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead className="text-right">Fundo Inicial</TableHead>
                <TableHead className="text-right">Entradas (+)</TableHead>
                <TableHead className="text-right">Saídas (-)</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Apurado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((s: CashRegisterHistoryItem) => {
                const expectedValue = s.initial_balance_cents + s.incomeCents - s.expenseCents;
                const discrepancyValue =
                  s.final_balance_cents !== null ? s.final_balance_cents - expectedValue : 0;

                return (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono">
                      {formatDateTime(s.opened_at)}
                    </TableCell>
                    <TableCell
                      className="font-medium max-w-[120px] truncate"
                      title={s.opened_by_profile?.full_name || "Desconhecido"}
                    >
                      {s.opened_by_profile?.full_name || "Desconhecido"}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {s.closed_at ? formatDateTime(s.closed_at) : "Aberto"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(s.initial_balance_cents)}
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      +{formatMoney(s.incomeCents)}
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      -{formatMoney(s.expenseCents)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(expectedValue)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {s.final_balance_cents !== null ? formatMoney(s.final_balance_cents) : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${discrepancyValue === 0 ? "text-muted-foreground" : discrepancyValue > 0 ? "text-success" : "text-destructive"}`}
                    >
                      {s.final_balance_cents !== null
                        ? `${discrepancyValue > 0 ? "+" : ""}${formatMoney(discrepancyValue)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(s.status)}</TableCell>
                  </TableRow>
                );
              })}
              {shifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                    Nenhum turno registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
