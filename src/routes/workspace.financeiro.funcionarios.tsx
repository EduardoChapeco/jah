import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SheetPage } from "@/components/ui/sheet-page";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";
import { listEmployeesBalance, registerFinancialEvent } from "@/services/hr.functions";
import { Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/workspace/financeiro/funcionarios")({
  head: () => ({ meta: [{ title: "Folha e Comissões" }] }),
  loader: async () => {
    return await listEmployeesBalance();
  },
  component: HrFinancePage,
});

function HrFinancePage() {
  const staffBalances = Route.useLoaderData();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "advance" as any,
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleOpenModal = (emp: any) => {
    setSelectedEmp(emp);
    setFormData({ amount: "", type: "advance", description: "" });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const amountCents = Math.round(parseFloat(formData.amount.replace(",", ".")) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error("Insira um valor válido.");
      return;
    }
    if (formData.description.length < 3) {
      toast.error("Insira uma descrição válida.");
      return;
    }

    setLoading(true);
    try {
      await registerFinancialEvent({
        data: {
          employeeId: selectedEmp.id,
          amountCents,
          type: formData.type,
          description: formData.description,
        },
      });
      toast.success("Lançamento efetuado com sucesso!");
      setModalOpen(false);
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao registrar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gestão de RH & Comissões" />

      {staffBalances.length === 0 ? (
        <EmptyState title="Nenhum funcionário encontrado" />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {staffBalances.map((emp: any) => (
            <div
              key={emp.id}
              className="bg-card rounded-2xl border border-border/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0 border border-primary/20">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{emp.name}</h3>
                  <Badge variant="outline" className="mt-1 border-border/30">
                    {emp.role}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-semibold">Saldo a Receber</p>
                  <p
                    className={`text-2xl font-bold ${emp.balanceCents < 0 ? "text-destructive" : "text-success"}`}
                  >
                    {formatMoney(emp.balanceCents)}
                  </p>
                </div>
                <Button onClick={() => handleOpenModal(emp)}>Lançar Evento / Vale</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction SheetPage */}
      <SheetPage
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Lançamento de Folha & Vales"
        description={`Registrando lançamento para ${selectedEmp?.name || "colaborador"}`}
        size="default"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={loading} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="rounded-xl font-bold bg-primary text-primary-foreground">
              {loading ? "Registrando..." : "Confirmar Lançamento"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold">Tipo de Lançamento</Label>
            <Select
              value={formData.type}
              onValueChange={(v: any) => setFormData((prev) => ({ ...prev, type: v }))}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="advance">
                  <div className="flex items-center text-destructive font-medium">
                    <ArrowDownRight className="w-4 h-4 mr-2" /> Vale / Adiantamento (Débito)
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <ArrowUpRight className="w-4 h-4 mr-2" /> Bônus / Ajuste (Crédito)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Ex: 150.00"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              className="h-10 rounded-xl font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">Descrição / Motivo</Label>
            <Input
              placeholder="Ex: Adiantamento para transporte"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </SheetPage>
    </div>
  );
}
