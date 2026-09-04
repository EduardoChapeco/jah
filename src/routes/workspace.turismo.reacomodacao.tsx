import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Building,
  User,
  ShieldAlert,
  FileText,
  Utensils,
  Hotel,
  RefreshCw,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useWorkspaceStore } from '@/lib/store-context';
import { getStoreSettings } from '@/services/store.functions';
import {
  listFlightChangeCases,
  createFlightChangeCase,
  updateChangeCaseWorkflow,
  calculateAnacRights,
} from '@/services/travel-reaccommodation.functions';
import type {
  TravelFlightChangeCase,
  ChangeReason,
  ReaccommodationPriority,
  ReaccommodationWorkflowStatus,
} from '@/types/travel-reaccommodation';

export const Route = createFileRoute('/workspace/turismo/reacomodacao')({
  head: () => ({ meta: [{ title: 'Central de Reacomodação (ANAC 400) | Workspace' }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    return { store };
  },
  component: ReaccommodationPage,
});

export default function ReaccommodationPage() {
  const loaderData = Route.useLoaderData?.() as any;
  const { currentStore } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const storeId = loaderData?.store?.id || currentStore?.id || '00000000-0000-0000-0000-000000000000';

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [changeReason, setChangeReason] = useState<ChangeReason>('flight_cancelled');
  const [priority, setPriority] = useState<ReaccommodationPriority>('urgent');
  const [delayHours, setDelayHours] = useState(5);
  const [passengerNotes, setPassengerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const previewRights = calculateAnacRights(changeReason, delayHours);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['travel-flight-change-cases', storeId],
    queryFn: () => listFlightChangeCases({ data: { storeId } }),
    enabled: Boolean(storeId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createFlightChangeCase({
        data: {
          store_id: storeId,
          change_reason: changeReason,
          priority,
          delay_hours: delayHours,
          passenger_notes: passengerNotes,
          internal_notes: internalNotes,
        },
      });
    },
    onSuccess: () => {
      toast.success('Incidente de voo registrado com sucesso!');
      setIsDialogOpen(false);
      setPassengerNotes('');
      setInternalNotes('');
      queryClient.invalidateQueries({ queryKey: ['travel-flight-change-cases', storeId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao registrar caso.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (args: { id: string; status: ReaccommodationWorkflowStatus }) =>
      updateChangeCaseWorkflow({
        data: {
          id: args.id,
          workflow_status: args.status,
        },
      }),
    onSuccess: () => {
      toast.success('Status do caso atualizado!');
      queryClient.invalidateQueries({ queryKey: ['travel-flight-change-cases', storeId] });
    },
  });

  const getReasonLabel = (r: ChangeReason) => {
    switch (r) {
      case 'flight_cancelled':
        return 'Voo Cancelado';
      case 'delay_over_4h':
        return 'Atraso Superior a 4 Horas';
      case 'connection_lost':
        return 'Perda de Conexão';
      case 'overbooking':
        return 'Preterição de Embarque (Overbooking)';
      case 'schedule_change':
        return 'Alteração de Malha Programada';
    }
  };

  const getPriorityBadge = (p: ReaccommodationPriority) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'normal':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'low':
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const filteredCases = cases.filter((c) => {
    const text = `${c.change_reason} ${c.passenger_notes || ''} ${c.internal_notes || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="size-6 text-amber-500" />
            Central de Reacomodação Aérea & Contingência (ANAC 400)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de incidentes de voos, direitos regulatórios do passageiro, voos congêneres e reembolsos.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-5 gap-2 text-sm font-semibold rounded-xl shadow-sm bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="size-4" />
              Abrir Ocorrência / Reacomodação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-amber-500" />
                Registrar Incidente Aéreo & Calcular Direitos ANAC 400
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Motivo da Contingência</Label>
                <select
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-medium"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value as ChangeReason)}
                >
                  <option value="flight_cancelled">Cancelamento de Voo pela Cia Aérea</option>
                  <option value="delay_over_4h">Atraso Superior a 4 Horas no Aeroporto</option>
                  <option value="connection_lost">Perda de Voo de Conexão</option>
                  <option value="overbooking">Preterição de Embarque (Overbooking)</option>
                  <option value="schedule_change">Alteração de Malha / Horário Prévia</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Prioridade Operacional</Label>
                <select
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ReaccommodationPriority)}
                >
                  <option value="urgent">Urgente (Passageiro no Aeroporto)</option>
                  <option value="high">Alta (Viagem nas Próximas 24h)</option>
                  <option value="normal">Normal (Viagem nos Próximos Dias)</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Atraso Estimado (Horas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={delayHours}
                  onChange={(e) => setDelayHours(Number(e.target.value))}
                  className="h-11"
                />
              </div>

              {/* ANAC 400 Regulatory Rights Box */}
              <div className="md:col-span-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <ShieldAlert className="size-4" />
                  Direitos Regulatórios Calculados (Resolução ANAC 400/2016)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Utensils className="size-3.5 text-muted-foreground" />
                    <span>
                      Voucher Alimentação:{' '}
                      <strong className={previewRights.material_assistance.food_voucher ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {previewRights.material_assistance.food_voucher ? 'OBRIGATÓRIO (Atraso >= 2h)' : 'Não obrigatório'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hotel className="size-3.5 text-muted-foreground" />
                    <span>
                      Hospedagem & Transfer:{' '}
                      <strong className={previewRights.material_assistance.lodging_and_transfer ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {previewRights.material_assistance.lodging_and_transfer ? 'OBRIGATÓRIO (Atraso >= 4h)' : 'Não obrigatório'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-3.5 text-muted-foreground" />
                    <span>
                      Voo de Terceiro/Congênere:{' '}
                      <strong className={previewRights.reaccommodation_options.competitor_flights ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {previewRights.reaccommodation_options.competitor_flights ? 'PERMITIDO' : 'Apenas Própria Cia'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>
                      Reembolso Integral 100%:{' '}
                      <strong className={previewRights.reaccommodation_options.full_refund_eligible ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {previewRights.reaccommodation_options.full_refund_eligible ? 'DIREITO DO PASSAGEIRO' : 'Sujeito a Regra'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Relato do Passageiro / Situação</Label>
                <Textarea
                  placeholder="Ex: Passageiro está no aeroporto de Guarulhos e o voo LA3214 foi cancelado por manutenção da aeronave..."
                  value={passengerNotes}
                  onChange={(e) => setPassengerNotes(e.target.value)}
                  className="min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Notas Internas da Agência</Label>
                <Input
                  placeholder="Ex: Contatado plantão da consolidadora para solicitar reacomodação em voo da American Airlines."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 px-4">
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="h-11 px-6 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {createMutation.isPending ? 'Registrando...' : 'Registrar Ocorrência'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Casos em Análise</p>
            <p className="text-2xl font-bold text-foreground">
              {cases.filter((c) => c.workflow_status === 'pending_analysis').length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Casos Urgentes</p>
            <p className="text-2xl font-bold text-foreground">
              {cases.filter((c) => c.priority === 'urgent').length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Reacomodações Concluídas</p>
            <p className="text-2xl font-bold text-foreground">
              {cases.filter((c) => c.workflow_status === 'rebooking_confirmed' || c.workflow_status === 'closed').length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <RefreshCw className="size-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Taxa de Resolução</p>
            <p className="text-2xl font-bold text-foreground">98.4%</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar incidentes por motivo, detalhes ou notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 pl-10 rounded-xl"
        />
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Carregando ocorrências e casos de contingência...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
          <CheckCircle2 className="size-10 text-emerald-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-foreground">Nenhuma contingência aérea ativa</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Todos os voos monitorados estão operando pontualmente conforme a malha prevista.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="h-11 px-5 gap-2 rounded-xl">
            <Plus className="size-4" />
            Registrar Ocorrência Preventiva
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-amber-500/40 transition-all flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{getReasonLabel(c.change_reason)}</h3>
                    <p className="text-xs text-muted-foreground">
                      Aberto em {c.created_at ? new Date(c.created_at).toLocaleString('pt-BR') : 'Hoje'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge(c.priority)}`}>
                    Prioridade: {c.priority.toUpperCase()}
                  </span>
                  <select
                    className="h-8 px-2.5 text-xs rounded-lg border border-input bg-background font-medium"
                    value={c.workflow_status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: c.id,
                        status: e.target.value as ReaccommodationWorkflowStatus,
                      })
                    }
                  >
                    <option value="pending_analysis">Em Análise</option>
                    <option value="alternatives_sent">Alternativas Enviadas</option>
                    <option value="client_accepted">Aceito pelo Cliente</option>
                    <option value="client_rejected">Recusado pelo Cliente</option>
                    <option value="rebooking_confirmed">Reacomodação Confirmada</option>
                    <option value="refund_requested">Reembolso Solicitado</option>
                    <option value="closed">Encerrado / Resolvido</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              {c.passenger_notes && (
                <div className="p-3 rounded-xl bg-muted/40 text-xs text-foreground flex flex-col gap-1 border border-border/40">
                  <strong className="text-muted-foreground font-semibold">Situação Relatada:</strong>
                  <span>{c.passenger_notes}</span>
                </div>
              )}

              {/* Direct Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="size-4 text-amber-500" />
                  <span>Resolução ANAC 400 ativa para este incidente.</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-1.5 text-xs"
                    onClick={() => {
                      const text = encodeURIComponent(
                        `Olá! Notamos uma alteração no seu voo e já estamos agindo com a companhia aérea para sua reacomodação imediata.`
                      );
                      window.open(`https://wa.me/?text=${text}`, '_blank');
                    }}
                  >
                    <PhoneCall className="size-3.5 text-emerald-500" />
                    Acionar Passageiro (WhatsApp)
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
