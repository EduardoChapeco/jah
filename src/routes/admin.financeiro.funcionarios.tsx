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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { EmptyState } from "@/components/state/states";
import { listEmployeesBalance, registerFinancialEvent } from "@/services/hr.functions";
import { Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/financeiro/funcionarios")({
  head: () => ({ meta: [{ title: "Folha e Comissões — Jah" }] }),
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
    description: ""
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
          description: formData.description
        }
      });
      toast.success("Lançamento efetuado com sucesso!");
      setModalOpen(false);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de RH & Comissões"
        description="Acompanhe o saldo dinâmico de comissões e registre vales/adiantamentos para a equipe."
      />

      {staffBalances.length === 0 ? (
        <EmptyState
          title="Nenhum funcionário encontrado"
          description="Sua loja ainda não possui funcionários cadastrados."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {staffBalances.map((emp: any) => (
            <div key={emp.id} className="bg-card border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{emp.name}</h3>
                  <Badge variant="outline" className="mt-1">{emp.role}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Saldo a Receber</p>
                  <p className={`text-2xl font-bold ${emp.balanceCents < 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatMoney(emp.balanceCents)}
                  </p>
                </div>
                <Button onClick={() => handleOpenModal(emp)}>
                  Lançar Evento / Vale
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Transaction Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançamento Financeiro</DialogTitle>
            <DialogDescription>
              Registrando lançamento para <strong>{selectedEmp?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Lançamento</Label>
              <Select value={formData.type} onValueChange={(v: any) => setFormData(prev => ({...prev, type: v}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">
                    <div className="flex items-center text-destructive">
                      <ArrowDownRight className="w-4 h-4 mr-2" /> Vale / Adiantamento (Débito)
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center text-success">
                      <ArrowUpRight className="w-4 h-4 mr-2" /> Bônus / Ajuste (Crédito)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Ex: 150.00"
                value={formData.amount}
                onChange={e => setFormData(prev => ({...prev, amount: e.target.value}))}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição / Motivo</Label>
              <Input 
                placeholder="Ex: Adiantamento para transporte"
                value={formData.description}
                onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Registrando..." : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
