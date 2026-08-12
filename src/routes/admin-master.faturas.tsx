import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getPlatformInvoicesList,
  getPlatformStoresList,
  updateInvoiceStatus,
  createPlatformInvoice,
} from "@/services/master.functions";
import { formatMoney, parseMoney } from "@/lib/money";
import { Surface } from "@/components/ui/surface";
import { DollarSign, FileText, Plus, Receipt } from "lucide-react";
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

export const Route = createFileRoute("/admin-master/faturas")({
  head: () => ({ meta: [{ title: "Faturamentos - Master" }] }),
  loader: async () => {
    const [invoices, stores] = await Promise.all([
      getPlatformInvoicesList(),
      getPlatformStoresList(),
    ]);
    return { invoices, stores };
  },
  component: MasterFaturasPage,
});

function MasterFaturasPage() {
  const { invoices, stores } = Route.useLoaderData();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Form states for manual invoice
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
      toast.success("Status atualizado com sucesso.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !description || !amountStr || !dueDate) {
      toast.error("Preencha todos os campos para emitir a fatura.");
      return;
    }

    const amountCents = parseMoney(amountStr);
    if (amountCents <= 0) {
      toast.error("O valor deve ser maior que zero.");
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
      toast.error((e instanceof Error ? e.message : String(e)));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <DollarSign className="size-8" />
            Faturamentos da Plataforma
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de cobranças, repasses e assinaturas das lojas do ecossistema.
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="font-bold">
          {isCreating ? (
            "Cancelar"
          ) : (
            <>
              <Plus className="size-4 mr-2" /> Emitir Nova Fatura
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <div className="border border-border bg-card rounded-md shadow-xs p-6 bg-muted/20 border-primary/20">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Receipt className="size-5 text-primary" />
            Emitir Fatura Avulsa
          </h2>
          <form
            onSubmit={handleCreateInvoice}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <div className="space-y-2">
              <Label>Loja Destinatária</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição da Cobrança</Label>
              <Input
                placeholder="Ex: Mensalidade - Outubro"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <Button
              type="submit"
              disabled={loadingAction === "creating"}
              className="w-full lg:col-span-4"
            >
              {loadingAction === "creating" ? "Emitindo..." : "Emitir Cobrança"}
            </Button>
          </form>
        </div>
      )}

      <div className="border border-border bg-card rounded-md shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Histórico de Faturas
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Fatura</th>
                <th className="px-6 py-4">Negócio</th>
                <th className="px-6 py-4">Emissão</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv: any) => {
                const isPaid = inv.status === "paid";
                const isOverdue = inv.status === "overdue";
                const isCancelled = inv.status === "cancelled";

                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{inv.description}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {inv.stores?.name}{" "}
                      <span className="text-[10px] block opacity-70">/{inv.stores?.slug}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {format(new Date(inv.created_at), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {format(new Date(inv.due_date), "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-foreground text-base">
                      {formatMoney(inv.amount_cents)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={
                          isPaid
                            ? "default"
                            : isOverdue
                              ? "destructive"
                              : isCancelled
                                ? "outline"
                                : "secondary"
                        }
                        className={
                          isPaid ? "bg-success text-white" : isCancelled ? "opacity-50" : ""
                        }
                      >
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPaid ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingAction === inv.id}
                          onClick={() => handleUpdateStatus(inv.id, "pending")}
                          className="font-bold text-[10px]"
                        >
                          Reverter Pago
                        </Button>
                      ) : isCancelled ? (
                        <span className="text-muted-foreground text-xs font-mono">-</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-success text-white hover:bg-success/90 font-bold text-[10px]"
                            disabled={loadingAction === inv.id}
                            onClick={() => handleUpdateStatus(inv.id, "paid")}
                          >
                            Marcar Paga
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-[10px]"
                            disabled={loadingAction === inv.id}
                            onClick={() => handleUpdateStatus(inv.id, "cancelled")}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhuma fatura encontrada.
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
