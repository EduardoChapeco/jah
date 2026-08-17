import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wallet, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { getActiveRegister, addRegisterEntry } from "@/services/cash.functions";
import { formatDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/financeiro/caixa/lancamentos")({
  head: () => ({ meta: [{ title: "Lançamentos de Caixa" }] }),
  loader: () => getActiveRegister(),
  component: CaixaLancamentosPage,
});

function translateMethod(method: string) {
  const map: Record<string, string> = {
    cash: "Dinheiro",
    pix: "Pix",
    credit: "Crédito",
    debit: "Débito",
    other: "Outro",
  };
  return map[method] || method;
}

function CaixaLancamentosPage() {
  const register = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    amountCents: undefined as number | undefined,
    method: "cash" as "cash" | "credit" | "debit" | "pix" | "other",
    description: "",
    type: "in" as "in" | "out",
  });

  if (!register) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          <Link to="/workspace/financeiro/caixa">Voltar ao Caixa</Link>
        </div>
        <PageHeader title="Lançamentos do Caixa" />
        <EmptyState title="Nenhum caixa aberto" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = form.amountCents || 0;
    if (cents <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    setIsSaving(true);
    try {
      await addRegisterEntry({
        data: {
          registerId: register.id,
          amountCents: cents,
          type: form.type,
          method: form.method,
          description: form.description,
        },
      });
      toast.success("Lançamento adicionado!");
      setOpen(false);
      setForm({
        amountCents: undefined,
        method: "cash",
        description: "",
        type: "in",
      });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar lançamento");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="size-4" />
            <Link to="/workspace/financeiro/caixa">Voltar ao Caixa</Link>
          </div>
          <PageHeader title="Lançamentos do Caixa" />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Registrar Lançamento Manual</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry-type">Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as "in" | "out" }))}
                  >
                    <SelectTrigger id="entry-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-method">Forma de Pagamento</Label>
                  <Select
                    value={form.method}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, method: v as typeof form.method }))
                    }
                  >
                    <SelectTrigger id="entry-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                      <SelectItem value="debit">Débito</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-amount">Valor (R$)</Label>
                <CurrencyField
                  id="entry-amount"
                  placeholder="0,00"
                  value={form.amountCents}
                  onChange={(val) => setForm((f) => ({ ...f, amountCents: val }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry-desc">Descrição</Label>
                <Input
                  id="entry-desc"
                  placeholder="Ex: Pagamento fornecedor, retirada de troco..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                  minLength={3}
                />
              </div>
              <SheetFooter className="mt-8">
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? "Salvando..." : "Registrar"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border rounded-xl bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo Inicial</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMoney(register.initial_balance_cents)}
          </p>
        </div>
        <div className="border border-border rounded-xl bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo Atual</p>
          <p className="mt-1 text-2xl font-semibold text-success">
            {formatMoney(register.currentBalanceCents)}
          </p>
        </div>
        <div className="border border-border rounded-xl bg-card p-4 flex items-center gap-3">
          <Wallet className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="secondary" className="mt-1">
              Aberto
            </Badge>
          </div>
        </div>
      </div>

      {/* Lançamentos Table */}
      <div className="border border-border bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Extrato do Turno</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {register.recentEntries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{formatDateTime(entry.created_at)}</TableCell>
                  <TableCell className="font-medium text-foreground">{entry.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {translateMethod(entry.method)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${entry.amount_cents >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {entry.amount_cents >= 0 ? "+" : "-"}
                    {formatMoney(Math.abs(entry.amount_cents))}
                  </TableCell>
                </TableRow>
              ))}
              {register.recentEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground text-sm">
                    Nenhum lançamento registrado neste turno.
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
