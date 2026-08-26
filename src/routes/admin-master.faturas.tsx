import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getPlatformInvoicesList,
  getPlatformStoresList,
  updateInvoiceStatus,
  createPlatformInvoice,
} from "@/services/master.functions";
import { formatMoney, parseMoney } from "@/lib/money";
import { DollarSign, Plus, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ErrorState } from "@/components/state/states";

export const Route = createFileRoute("/admin-master/faturas")({
  head: () => ({ meta: [{ title: "Faturas & Planos | Admin Master" }] }),
  loader: async () => {
    try {
      const [invoices, stores] = await Promise.all([
        getPlatformInvoicesList().catch(() => []),
        getPlatformStoresList().catch(() => []),
      ]);
      return { invoices: invoices || [], stores: stores || [] };
    } catch {
      return { invoices: [], stores: [] };
    }
  },
  component: MasterFaturasPage,
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-20">
      <ErrorState
        title="Faturas Indisponíveis"
        description="Não foi possível carregar as faturas e planos da plataforma. Tente novamente."
        onRetry={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
      />
    </div>
  ),
});

function MasterFaturasPage() {
  const { invoices, stores } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Form states
  const [storeId, setStoreId] = useState("");
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleUpdateStatus = async (
    invoiceId: string,
    newStatus: "pending" | "paid" | "overdue" | "cancelled",
  ) => {
    if (!confirm(`Confirmar alteração de status para: ${newStatus.toUpperCase()}?`)) return;

    setLoadingAction(invoiceId);
    try {
      await updateInvoiceStatus({ data: { invoiceId, status: newStatus } });
      toast.success("Status da fatura atualizado.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !description || !amountStr || !dueDate) {
      toast.error("Preencha todos os campos da fatura.");
      return;
    }

    const amountCents = parseMoney(amountStr);
    if (amountCents <= 0) {
      toast.error("Valor inválido.");
      return;
    }

    setLoadingAction("creating");
    try {
      await createPlatformInvoice({
        data: {
          storeId,
          description,
          amountCents,
          dueDate: new Date(dueDate).toISOString(),
        },
      });
      toast.success("Fatura emitida com sucesso.");
      setIsCreating(false);
      setStoreId("");
      setDescription("");
      setAmountStr("");
      setDueDate("");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Faturas & Planos</h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {invoices.length} {invoices.length === 1 ? "fatura" : "faturas"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestão de cobranças, repasses e faturamento do ecossistema.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          size="sm"
          className="rounded-xl font-medium gap-1.5 h-9 px-4 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>{isCreating ? "Fechar Formulário" : "Emitir Fatura"}</span>
        </Button>
      </div>

      {/* Manual Invoice Form */}
      {isCreating && (
        <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <p className="text-sm font-semibold text-foreground">Nova Cobrança Manual</p>
          <form
            onSubmit={handleCreateInvoice}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Loja</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="h-9 rounded-xl bg-background text-xs">
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição</Label>
              <Input
                placeholder="Ex: Mensalidade - Outubro"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 rounded-xl bg-background text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor (R$)</Label>
              <Input
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="h-9 rounded-xl bg-background text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Vencimento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-xl bg-background text-xs"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={loadingAction === "creating"}
                className="rounded-xl text-xs font-semibold px-4"
              >
                {loadingAction === "creating" ? "Emitindo..." : "Confirmar Emissão"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices Table Card */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/40 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Loja</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Vencimento</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-semibold text-foreground">
                    {inv.description || "Assinatura Mensal"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.stores?.name || "Global"}</td>
                  <td className="px-5 py-3 font-bold text-foreground">{formatMoney(inv.amount_cents)}</td>
                  <td className="px-5 py-3 text-muted-foreground text-[11px]">
                    {format(new Date(inv.due_date || inv.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "default"
                          : inv.status === "overdue"
                            ? "destructive"
                            : "secondary"
                      }
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5",
                        inv.status === "paid" ? "bg-emerald-600/90 text-white" : ""
                      )}
                    >
                      {inv.status === "paid"
                        ? "Pago"
                        : inv.status === "overdue"
                          ? "Vencido"
                          : "Pendente"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-500/10"
                          disabled={loadingAction === inv.id}
                          onClick={() => handleUpdateStatus(inv.id, "paid")}
                        >
                          Marcar Pago
                        </Button>
                      )}
                      {inv.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10"
                          disabled={loadingAction === inv.id}
                          onClick={() => handleUpdateStatus(inv.id, "cancelled")}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Nenhuma fatura registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
