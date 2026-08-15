import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  Users,
  CreditCard,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/logistica/faturas")({
  head: () => ({
    meta: [{ title: "Faturas & Repasses de Frota | JAH Workspace" }],
  }),
  component: WorkspaceLogisticsInvoicesPage,
});

interface InvoiceItem {
  id: string;
  courier_name: string;
  courier_phone: string;
  period: string;
  total_rides: number;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_payable_cents: number;
  status: "paid" | "pending";
  paid_at: string | null;
}

const SEED_INVOICES: InvoiceItem[] = [
  {
    id: "inv-001",
    courier_name: "Marcos Vinícius",
    courier_phone: "(49) 99881-2233",
    period: "01/08 a 15/08/2026",
    total_rides: 48,
    gross_amount_cents: 89000,
    platform_fee_cents: 8900,
    net_payable_cents: 80100,
    status: "paid",
    paid_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "inv-002",
    courier_name: "Transportes Rápidos Chapecó",
    courier_phone: "(49) 3322-1100",
    period: "01/08 a 15/08/2026",
    total_rides: 112,
    gross_amount_cents: 345000,
    platform_fee_cents: 34500,
    net_payable_cents: 310500,
    status: "pending",
    paid_at: null,
  },
  {
    id: "inv-003",
    courier_name: "Leandro Fretes & Mudanças",
    courier_phone: "(49) 99123-4567",
    period: "01/08 a 15/08/2026",
    total_rides: 14,
    gross_amount_cents: 280000,
    platform_fee_cents: 28000,
    net_payable_cents: 252000,
    status: "pending",
    paid_at: null,
  },
];

function WorkspaceLogisticsInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(SEED_INVOICES);

  const handleMarkAsPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: "paid", paid_at: new Date().toISOString() }
          : inv,
      ),
    );
    toast.success("Fatura marcada como liquidada e comprovante gerado!");
  };

  const totalPendingCents = invoices
    .filter((i) => i.status === "pending")
    .reduce((acc, i) => acc + i.net_payable_cents, 0);

  const totalPaidCents = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.net_payable_cents, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Faturas & Fechamentos de Frota
          </h1>
          <p className="text-xs text-muted-foreground">
            Controle de repasses quinzenais para motoristas autônomos e empresas de logística parceiras.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Pendente de Repasse
          </span>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {formatMoney(totalPendingCents)}
          </p>
          <span className="text-[11px] text-muted-foreground">
            Aguardando baixa financeira do ciclo atual
          </span>
        </div>

        <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Liquidado (Últimos 30 dias)
          </span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {formatMoney(totalPaidCents)}
          </p>
          <span className="text-[11px] text-muted-foreground">
            Repasses efetuados com comprovante PIX
          </span>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-5 border-b border-border/50 bg-muted/20">
          <h2 className="text-sm font-bold text-foreground">Demonstrativo de Repasses</h2>
        </div>

        <div className="divide-y divide-border/50">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:bg-muted/20 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm">{inv.courier_name}</span>
                  <Badge
                    className={
                      inv.status === "paid"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    }
                  >
                    {inv.status === "paid" ? "Liquidado" : "Pendente"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {inv.courier_phone} • Ciclo: {inv.period} ({inv.total_rides} corridas/entregas)
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Valor Líquido
                  </span>
                  <p className="font-mono font-black text-base text-foreground">
                    {formatMoney(inv.net_payable_cents)}
                  </p>
                </div>

                {inv.status === "pending" ? (
                  <Button
                    onClick={() => handleMarkAsPaid(inv.id)}
                    className="h-10 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Dar Baixa PIX</span>
                  </Button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    <span>Pago em {formatDate(inv.paid_at!)}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
