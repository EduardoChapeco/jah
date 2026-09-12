import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wallet, ArrowLeft, Download } from "lucide-react";
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
 head: () => ({ meta: [{ title: "Lançamentos de Caixa | Workspace Wider OS" }] }),
  loader: async () => {
    try {
      const register = await getActiveRegister().catch(() => null);
      return { register: register || null };
    } catch (err) {
      console.error("[loader:workspace.financeiro.caixa.lancamentos] Unhandled loader error:", err);
      return { register: null };
    }
  },
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

function renderChannelBadge(source?: string) {
  switch (source) {
    case "mercadolivre":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-medium">Mercado Livre</Badge>;
    case "ifood":
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px] font-medium">iFood</Badge>;
    case "shopee":
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px] font-medium">Shopee</Badge>;
    case "amazon":
      return <Badge variant="outline" className="bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/30 text-[10px] font-medium">Amazon</Badge>;
    case "classifieds":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] font-medium">Classificados</Badge>;
    default:
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] font-medium">Loja Física / PDV</Badge>;
  }
}

function CaixaLancamentosPage() {
  const { register } = (Route.useLoaderData() as any) || {};
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

 const handleExportCsv = () => {
 try {
 const headers = ["Data e Hora", "Tipo", "Descricao", "Metodo", "Valor (BRL)"];
 const rows = (register.recentEntries || []).map((entry: any) => {
 const isOut = entry.amount_cents < 0;
 const tipo = isOut ? "Saida" : "Entrada";
 const desc = `"${(entry.description || "").replace(/"/g, '""')}"`;
 const metodo = translateMethod(entry.method);
 const valor = (entry.amount_cents / 100).toFixed(2).replace(".", ",");
 return [formatDateTime(entry.created_at), tipo, desc, metodo, valor].join(";");
 });

 const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
 const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.setAttribute("href", url);
 link.setAttribute("download", `extrato_caixa_${new Date().toISOString().slice(0, 10)}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
 toast.success("Extrato exportado em CSV com sucesso!");
 } catch {
 toast.error("Erro ao gerar arquivo CSV.");
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const cents = form.amountCents || 0;
 if (cents <= 0) {
 toast.error("Informe um valor maior que zero.");
 return;
 }
 setIsSaving(true);
 try {
 const finalCents = form.type === "out" ? -Math.abs(cents) : Math.abs(cents);
 await addRegisterEntry({
 data: {
 registerId: register.id,
 amountCents: finalCents,
 method: form.method,
 description: form.description || (form.type === "out" ? "Sangria de caixa" : "Suprimento de caixa"),
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
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
 <ArrowLeft className="size-4" />
 <Link to="/workspace/financeiro/caixa">Voltar ao Caixa</Link>
 </div>
 <PageHeader title="Lançamentos do Caixa" />
 </div>

 <div className="flex items-center gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={handleExportCsv}
 className="rounded-xl text-xs font-bold gap-2 cursor-pointer"
 >
 <Download className="size-4" />
 <span>Exportar CSV</span>
 </Button>

 <Sheet open={open} onOpenChange={setOpen}>
 <SheetTrigger asChild>
 <Button className="rounded-xl text-xs font-bold gap-2 cursor-pointer">
 <Plus className="size-4" />
 Novo Lançamento
 </Button>
 </SheetTrigger>
 <SheetContent>
 <SheetHeader>
 <SheetTitle>Registrar Lançamento Manual</SheetTitle>
 </SheetHeader>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className=" rounded-xl bg-card p-4">
 <p className="text-sm text-muted-foreground">Saldo Inicial</p>
 <p className="mt-1 text-2xl font-semibold">
 {formatMoney(register.initial_balance_cents)}
 </p>
 </div>
 <div className=" rounded-xl bg-card p-4">
 <p className="text-sm text-muted-foreground">Saldo Atual</p>
 <p className="mt-1 text-2xl font-semibold text-success">
 {formatMoney(register.currentBalanceCents)}
 </p>
 </div>
 <div className=" rounded-xl bg-card p-4 flex items-center gap-3">
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
 <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
 <div className="p-4 border-b border-border/40">
 <h3 className="font-semibold text-foreground">Extrato do Turno</h3>
 </div>
 <div className="overflow-x-auto no-scrollbar">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Data/Hora</TableHead>
 <TableHead>Descrição</TableHead>
 <TableHead>Canal</TableHead>
 <TableHead>Método</TableHead>
 <TableHead className="text-right">Valor</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {register.recentEntries.map((entry: any) => (
 <TableRow key={entry.id}>
 <TableCell className="text-sm">{formatDateTime(entry.created_at)}</TableCell>
 <TableCell className="font-medium text-foreground">
 <div>{entry.description}</div>
 {entry.marketplace_fee_cents > 0 && (
 <div className="text-[11px] text-muted-foreground">
 Taxa canal: -{formatMoney(entry.marketplace_fee_cents)} • Líq: {formatMoney(entry.net_payout_cents || (entry.amount_cents - entry.marketplace_fee_cents))}
 </div>
 )}
 </TableCell>
 <TableCell>
 {renderChannelBadge(entry.channel_source)}
 </TableCell>
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
 <TableCell colSpan={5} className="text-center h-24 text-muted-foreground text-sm">
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
