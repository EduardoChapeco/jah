import { createFileRoute } from "@tanstack/react-router";
import { getCustomerCredits } from "@/services/credits.functions";
import { formatMoney } from "@/lib/money";
import { EmptyState, ErrorState } from "@/components/state/states";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/creditos")({
  head: () => ({ meta: [{ title: "Meus Créditos" }] }),
  loader: async () => {
    const res = await getCustomerCredits();
    return res;
  },
  component: Page,
});

function Page() {
  const credits = Route.useLoaderData();

  return (
    <div className="space-y-8 w-full font-sans text-foreground">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus Créditos</h1>
        <p className="mt-4 text-foreground/80 font-medium">
          Acompanhe seu saldo em carteira (Store Credit) e histórico de recebimentos/estornos.
        </p>
      </div>

      <div className="border border-border bg-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-xl">
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Disponível</p>
          <p className="text-4xl font-semibold text-foreground">
            {formatMoney(credits.balance_cents)}
          </p>
        </div>
        <div className="relative z-10 hidden md:block">
          <p className="text-xs text-foreground/80 max-w-[200px] font-medium font-mono text-right">
            O saldo é aplicado automaticamente na etapa de pagamento do Checkout.
          </p>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <h3 className="text-lg font-semibold border-b border-border pb-2">
          Histórico de Transações
        </h3>
        {credits.customer_credit_transactions.length === 0 ? (
          <div className="border border-border rounded-lg p-10 text-center flex flex-col items-center gap-4">
            <span className="text-4xl">🧾</span>
            <div className="space-y-1">
              <p className="font-semibold text-lg">Sem movimentações</p>
              <p className="text-sm text-muted-foreground">
                Você ainda não possui transações de créditos registradas.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {credits.customer_credit_transactions.map((t: any) => (
              <div
                key={t.id}
                className="flex justify-between items-center p-4 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{t.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(t.created_at)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold text-lg ${t.amount_cents > 0 ? "text-success" : "text-foreground"}`}
                  >
                    {t.amount_cents > 0 ? "+" : ""}
                    {formatMoney(t.amount_cents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
