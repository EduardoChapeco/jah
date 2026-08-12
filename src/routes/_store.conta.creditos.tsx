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
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-foreground">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-4xl font-semibold font-black flex items-center gap-3 uppercase">
          <span className="bg-secondary text-foreground px-3 py-1 border border-border shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-2">
            Meus
          </span>
          Créditos
        </h1>
        <p className="mt-4 text-foreground/80 font-medium">
          Acompanhe seu saldo em carteira (Store Credit) e histórico de recebimentos/estornos.
        </p>
      </div>

      <div className="border border-border shadow-sm bg-secondary p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-4 -top-8 text-foreground/5 rotate-12 scale-150 pointer-events-none">
          <span className="font-semibold text-9xl">$</span>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-foreground font-black uppercase tracking-widest bg-white inline-block px-2 py-0.5 border border-border shadow-sm mb-4">
            Saldo Disponível
          </p>
          <p className="text-6xl font-semibold font-black text-primary drop-shadow-sm">
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
        <h3 className="text-2xl font-semibold font-black uppercase border-b border-border pb-2">
          Histórico de Transações
        </h3>
        {credits.customer_credit_transactions.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center bg-background flex flex-col items-center gap-4">
            <span className="text-4xl">🧾</span>
            <div className="space-y-2">
              <p className="font-semibold text-2xl font-black uppercase">Sem movimentações</p>
              <p className="text-sm text-foreground/70 font-medium">
                Você ainda não possui transações de créditos registradas.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {credits.customer_credit_transactions.map((t: any) => (
              <div
                key={t.id}
                className="flex justify-between items-center p-5 border border-border bg-background hover:shadow-sm hover:-translate-y-1 transition-all"
              >
                <div>
                  <p className="font-black text-foreground uppercase text-sm">{t.reason}</p>
                  <p className="text-xs font-mono font-bold text-foreground/60 mt-1">
                    {formatDate(t.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold text-2xl font-black ${t.amount_cents > 0 ? "text-success" : "text-primary"}`}
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
