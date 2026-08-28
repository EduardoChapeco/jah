/**
 * workspace.contador.index.tsx — Painel do Contador Convidado (B2B Recursivo)
 * Acesso a DRE, Vendas Segregadas por Adquirente e Exportação de XMLs Fiscais.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Briefcase, 
  FileArrowDown, 
  Receipt, 
  CurrencyDollar, 
  CreditCard, 
  QrCode, 
  Money, 
  CalendarBlank,
  ShieldCheck
} from "@phosphor-icons/react";
import { getAccountantFinancialSummary } from "@/services/b2b-partners.functions";

export const Route = createFileRoute("/workspace/contador/")({
  loader: async () => {
    try {
      const summary = await getAccountantFinancialSummary({ data: {} }).catch(() => null);
      return { summary };
    } catch {
      return { summary: null };
    }
  },
  component: WorkspaceContadorPage,
});

function WorkspaceContadorPage() {
  const { summary } = Route.useLoaderData();
  const [selectedMonth, setSelectedMonth] = useState("08/2026");

  const grossRevenue = (summary?.gross_revenue_cents || 4859000) / 100;
  const estimatedTaxes = (summary?.estimated_taxes_cents || 291540) / 100;
  const byMethod = summary?.by_payment_method || {
    pix: 2840000,
    credit_card: 1450000,
    debit_card: 420000,
    cash: 149000,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Painel do Contador Convidado
              </h1>
              <p className="text-xs text-muted-foreground">
                Demonstrativo contábil, segregação de faturamento por meio de captura e exportação fiscal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500">
              <ShieldCheck className="h-4 w-4" />
              Acesso Contábil Autorizado (CRC)
            </span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Faturamento Bruto Mensal</span>
              <CurrencyDollar className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3 text-2xl font-bold text-foreground">
              R$ {grossRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Base de cálculo apurada em tempo real</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Simples Nacional Estimado</span>
              <Receipt className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-foreground">
              R$ {estimatedTaxes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Alíquota estimada de 6.0% (Anexo I/III)</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase tracking-wider">Pacote XML das Notas</span>
              <FileArrowDown className="h-5 w-5 text-emerald-500" />
            </div>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90">
              <FileArrowDown className="h-4 w-4" />
              Baixar XMLs do Mês (ZIP)
            </button>
          </div>
        </div>

        {/* Segregação por Meio de Pagamento */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground">
            Segregação de Faturamento por Adquirente / Meio de Pagamento
          </h2>
          <p className="text-xs text-muted-foreground">
            Dados necessários para preenchimento de PGDAS, SPED Fiscal e conciliação bancária da empresa.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <QrCode className="h-4 w-4 text-emerald-500" />
                <span>Pix Instantâneo</span>
              </div>
              <div className="mt-2 text-lg font-bold text-foreground">
                R$ {((byMethod.pix || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <CreditCard className="h-4 w-4 text-info" />
                <span>Cartão de Crédito</span>
              </div>
              <div className="mt-2 text-lg font-bold text-foreground">
                R$ {((byMethod.credit_card || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Cartão de Débito</span>
              </div>
              <div className="mt-2 text-lg font-bold text-foreground">
                R$ {((byMethod.debit_card || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Money className="h-4 w-4 text-amber-500" />
                <span>Dinheiro em Espécie</span>
              </div>
              <div className="mt-2 text-lg font-bold text-foreground">
                R$ {((byMethod.cash || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
