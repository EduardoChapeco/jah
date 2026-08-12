import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getPlatformMetrics,
  getPlatformStoresList,
  getPlatformInvoicesList,
  toggleStoreStatus,
} from "@/services/master.functions";
import { formatMoney } from "@/lib/money";
import { Surface } from "@/components/ui/surface";
import { DollarSign, Store, Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin-master/")({
  head: () => ({ meta: [{ title: "Master Dashboard" }] }),
  loader: async () => {
    const [metrics, stores, invoices] = await Promise.all([
      getPlatformMetrics(),
      getPlatformStoresList(),
      getPlatformInvoicesList(),
    ]);
    return { metrics, stores, invoices };
  },
  component: AdminMasterDashboard,
});

function AdminMasterDashboard() {
  const { metrics, stores, invoices } = Route.useLoaderData();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStore = async (storeId: string, currentStatus: boolean) => {
    if (!confirm(`Deseja realmente ${currentStatus ? "bloquear" : "desbloquear"} esta loja?`))
      return;

    setLoadingId(storeId);
    try {
      await toggleStoreStatus({ data: { storeId, isActive: !currentStatus } });
      toast.success("Status da loja alterado com sucesso.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Visão Global</h1>
        <p className="text-muted-foreground mt-1">Supervisão da plataforma Jah Community.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-border bg-card rounded-md shadow-xs p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <DollarSign className="size-32" />
          </div>
          <div className="p-4 bg-primary/10 text-primary rounded-xl">
            <DollarSign className="size-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Receita (Paga)
            </p>
            <p className="text-3xl font-black text-foreground">
              {formatMoney(metrics.totalRevenueCents)}
            </p>
          </div>
        </div>

        <div className="border border-border bg-card rounded-md shadow-xs p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Activity className="size-32" />
          </div>
          <div className="p-4 bg-warning/10 text-warning rounded-xl">
            <Activity className="size-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Receita Pendente
            </p>
            <p className="text-3xl font-black text-foreground">
              {formatMoney(metrics.pendingRevenueCents)}
            </p>
          </div>
        </div>

        <div className="border border-border bg-card rounded-md shadow-xs p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Store className="size-32" />
          </div>
          <div className="p-4 bg-ink/10 text-foreground rounded-xl">
            <Store className="size-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Total de Lojas
            </p>
            <p className="text-3xl font-black text-foreground">{metrics.totalStores}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stores Table */}
        <div className="border border-border bg-card rounded-md shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-bold flex items-center gap-2">
              <Store className="size-4 text-primary" /> Ecossistema de Lojas
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Loja</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stores.map((store: any) => (
                  <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">
                      {store.name}
                      <p className="text-xs text-muted-foreground font-normal">/{store.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {store.is_active ? (
                        <Badge variant="default" className="bg-success text-white">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Bloqueada</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={store.is_active ? "outline" : "default"}
                        disabled={loadingId === store.id}
                        onClick={() => handleToggleStore(store.id, store.is_active)}
                      >
                        {store.is_active ? "Bloquear" : "Desbloquear"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="border border-border bg-card rounded-md shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-bold flex items-center gap-2">
              <DollarSign className="size-4 text-warning" /> Últimas Faturas Geradas
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b font-medium uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Loja</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-xs">
                      {inv.description || "Fatura"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.stores?.name}</td>
                    <td className="px-4 py-3 font-bold">{formatMoney(inv.amount_cents)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          inv.status === "paid"
                            ? "default"
                            : inv.status === "overdue"
                              ? "destructive"
                              : "secondary"
                        }
                        className={inv.status === "paid" ? "bg-success" : ""}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma fatura gerada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
