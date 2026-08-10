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
    <section>
      <h2 className="text-editorial text-2xl text-foreground mb-6">Meus Créditos</h2>

      <div className="mb-8 p-6 bg-secondary/30 border border-border flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            Saldo Disponível
          </p>
          <p className="text-4xl font-bold text-foreground mt-2">
            {formatMoney(credits.balance_cents)}
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4 text-foreground">Histórico de Transações</h3>
      {credits.customer_credit_transactions.length === 0 ? (
        <EmptyState
          title="Sem movimentações"
          description="Você ainda não possui transações de créditos registradas."
        />
      ) : (
        <div className="space-y-4">
          {credits.customer_credit_transactions.map((t: any) => (
            <div key={t.id} className="flex justify-between items-center p-4 border bg-card">
              <div>
                <p className="font-medium">{t.reason}</p>
                <p className="text-sm text-muted-foreground">{formatDate(t.created_at)}</p>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${t.amount_cents > 0 ? "text-success" : "text-destructive"}`}
                >
                  {t.amount_cents > 0 ? "+" : ""}
                  {formatMoney(t.amount_cents)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
