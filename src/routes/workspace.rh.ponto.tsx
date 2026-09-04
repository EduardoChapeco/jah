import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Clock, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  FileText, 
  Filter,
  CheckCircle2,
  Edit3,
  Search,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listEmployeeTimeEntries, adjustTimeEntry } from "@/services/hr.functions";
import { formatDateTime, formatTimeOnly } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/rh/ponto")({
  head: () => ({ meta: [{ title: "Espelho de Ponto Eletrônico | Gestão RH JAH" }] }),
  component: WorkspaceRHPontoPage,
});

function WorkspaceRHPontoPage() {
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchEmployee, setSearchEmployee] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["employee-time-entries"],
    queryFn: () => listEmployeeTimeEntries({ data: {} }),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { entryId: string; reason: string }) =>
      adjustTimeEntry({ data }),
    onSuccess: () => {
      toast.success("Ponto ajustado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["employee-time-entries"] });
      setSelectedEntry(null);
      setAdjustmentReason("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao ajustar registro de ponto.");
    },
  });

  const filteredEntries = entries.filter((entry: any) => {
    if (filterType !== "all" && entry.entry_type !== filterType) return false;
    if (searchEmployee) {
      const name = entry.employee?.full_name?.toLowerCase() || "";
      if (!name.includes(searchEmployee.toLowerCase())) return false;
    }
    return true;
  });

  const ENTRY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    clock_in: { label: "Entrada", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    lunch_out: { label: "Saída Almoço", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    lunch_in: { label: "Volta Almoço", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    clock_out: { label: "Saída", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    overtime_in: { label: "Início H. Extra", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    overtime_out: { label: "Fim H. Extra", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  };

  return (
    <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Espelho de Ponto Eletrônico"
        description="Monitoramento em tempo real de jornada, geolocalização com GPS e auditoria de batidas."
      />

      {/* Layer 1: Filtros e Barra de Controle Apple HIG */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/60 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador..."
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-background/50 min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-2 sm:pb-0">
          {["all", "clock_in", "lunch_out", "lunch_in", "clock_out"].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className="h-10 rounded-xl px-3.5 min-h-[44px] text-xs font-medium shrink-0"
            >
              {type === "all" ? "Todos os Pontos" : ENTRY_TYPE_LABELS[type]?.label || type}
            </Button>
          ))}
        </div>
      </div>

      {/* Layer 2: Tabela de Registros com Elevação e Touch Targets */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-3.5 px-4">Colaborador</th>
                <th className="py-3.5 px-4">Tipo de Batida</th>
                <th className="py-3.5 px-4">Data & Horário</th>
                <th className="py-3.5 px-4">Geolocalização / IP</th>
                <th className="py-3.5 px-4">Origem</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Carregando espelho de ponto...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Nenhum registro de ponto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry: any) => {
                  const typeInfo = ENTRY_TYPE_LABELS[entry.entry_type] || {
                    label: entry.entry_type,
                    color: "bg-muted text-foreground border-border",
                  };
                  return (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {entry.employee?.full_name?.slice(0, 2).toUpperCase() || "RH"}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold">{entry.employee?.full_name || "Colaborador"}</div>
                            <div className="text-xs text-muted-foreground">{entry.employee?.job_title || "Cargo não informado"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={`rounded-lg px-2.5 py-1 text-xs border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs">{formatDateTime(entry.recorded_at)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>{entry.geolocation?.address || entry.ip_address || "Terminal Verificado"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-muted-foreground capitalize">{entry.source.replace("_", " ")}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="text-xs rounded-lg">
                          {entry.status === "verified" ? "Verificado" : entry.status === "adjusted" ? "Ajustado" : entry.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                          className="h-9 px-3 rounded-xl min-h-[44px] min-w-[44px] text-xs"
                        >
                          <Edit3 className="h-4 w-4 mr-1.5" /> Ajustar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ajuste de Ponto */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ajustar Registro de Ponto</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 p-3.5 rounded-xl border border-border text-xs space-y-1">
                <div><strong>Colaborador:</strong> {selectedEntry.employee?.full_name}</div>
                <div><strong>Batida Atual:</strong> {formatDateTime(selectedEntry.recorded_at)} ({selectedEntry.entry_type})</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Justificativa do Ajuste (Obrigatória)</label>
                <Input
                  placeholder="Ex: Esquecimento de batida na saída para almoço / Falha de conexão"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="min-h-[44px] rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedEntry(null)} className="rounded-xl min-h-[44px]">
              Cancelar
            </Button>
            <Button
              disabled={!adjustmentReason.trim() || adjustMutation.isPending}
              onClick={() => {
                if (selectedEntry) {
                  adjustMutation.mutate({ entryId: selectedEntry.id, reason: adjustmentReason });
                }
              }}
              className="rounded-xl min-h-[44px]"
            >
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
