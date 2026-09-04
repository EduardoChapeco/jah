import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Search,
  Plane,
  Clock,
  Phone,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Send,
  Users,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/commerce/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getStoreSettings } from '@/services/store.functions';
import {
  listDepartureCards,
  createDepartureCard,
  updateDepartureStage,
  deleteDepartureCard,
} from '@/services/travel-departures.functions';
import { DEPARTURE_STAGES, type DepartureStage, type DepartureCardDTO } from '@/types/travel-departures';

export const Route = createFileRoute('/workspace/turismo/embarques')({
  head: () => ({ meta: [{ title: 'Kanban de Embarques & Pós-Venda | Workspace' }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    return { store };
  },
  component: WorkspaceDeparturesKanbanPage,
});

function WorkspaceDeparturesKanbanPage() {
  const { store } = Route.useLoaderData();
  const storeId = store?.id || '';

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [passengersCount, setPassengersCount] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  const { data: cards = [], refetch, isLoading } = useQuery({
    queryKey: ['travel-departures', storeId],
    queryFn: () => listDepartureCards({ data: { store_id: storeId } }),
  });

  const filtered = cards.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.destination.toLowerCase().includes(search.toLowerCase())
  );

  const handleStageMove = async (id: string, currentStage: DepartureStage, direction: 'next' | 'prev') => {
    const stageIds = DEPARTURE_STAGES.map((s) => s.id);
    const currIdx = stageIds.indexOf(currentStage);
    const targetIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;
    if (targetIdx < 0 || targetIdx >= stageIds.length) return;

    const nextStage = stageIds[targetIdx];
    try {
      await updateDepartureStage({ data: { id, stage: nextStage } });
      toast.success('Embarque avançado para ' + DEPARTURE_STAGES[targetIdx].label);
      refetch();
    } catch (err: any) {
      toast.error('Erro ao mover estágio: ' + err?.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o cartão de ${name}?`)) return;
    try {
      await deleteDepartureCard({ data: { id } });
      toast.success('Cartão removido!');
      refetch();
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err?.message);
    }
  };

  const handleCreate = async () => {
    if (!clientName.trim() || !destination.trim() || !departureDate) {
      toast.error('Preencha os campos obrigatórios (Cliente, Destino e Data).');
      return;
    }

    setSubmitting(true);
    try {
      await createDepartureCard({
        data: {
          store_id: storeId,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim() || null,
          destination: destination.trim(),
          departure_date: new Date(departureDate).toISOString(),
          passengers_count: parseInt(passengersCount, 10) || 1,
        },
      });
      toast.success('Embarque adicionado ao Kanban!');
      setModalOpen(false);
      setClientName('');
      setDestination('');
      refetch();
    } catch (err: any) {
      toast.error('Erro ao criar: ' + err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Kanban Operacional de Embarques & Pós-Venda"
        description="Esteira de esteira de passageiros: reservas confirmadas, emissão de vouchers, check-in aéreo 48h, suporte em viagem e pós-venda."
      >
        <Button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-md h-10 px-4 cursor-pointer"
        >
          <Plus className="size-4" /> Novo Embarque
        </Button>
      </PageHeader>

      {/* Barra de Busca */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar passageiro ou destino..."
            className="h-10 pl-9 rounded-xl text-xs bg-muted/20"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Total de {cards.length} viagens em pipeline
        </span>
      </div>

      {/* Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {DEPARTURE_STAGES.map((col) => {
          const colCards = filtered.filter((c) => c.stage === col.id);
          return (
            <div
              key={col.id}
              className="p-3.5 rounded-2xl bg-muted/20 border border-border flex flex-col space-y-3 min-h-[500px]"
            >
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-bold text-foreground">{col.label}</h3>
                  <p className="text-[10px] text-muted-foreground">{col.desc}</p>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5">
                  {colCards.length}
                </Badge>
              </div>

              <div className="space-y-2.5 flex-1">
                {colCards.length === 0 ? (
                  <div className="h-32 rounded-2xl border border-dashed border-border/60 flex items-center justify-center text-[11px] text-muted-foreground">
                    Sem viagens
                  </div>
                ) : (
                  colCards.map((card) => {
                    const daysUntil = Math.ceil(
                      (new Date(card.departure_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={card.id}
                        className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/50 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-foreground leading-tight">{card.client_name}</h4>
                          <span
                            className={'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ' + (
                              daysUntil <= 2
                                ? 'bg-rose-500/15 text-rose-600 animate-pulse'
                                : daysUntil <= 7
                                ? 'bg-amber-500/15 text-amber-600'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {daysUntil > 0 ? `em ${daysUntil}d` : daysUntil === 0 ? 'HOJE' : `${Math.abs(daysUntil)}d atrás`}
                          </span>
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <MapPin className="size-3 text-primary shrink-0" /> {card.destination}
                          </p>
                          <p className="flex items-center gap-1 font-mono text-[10px]">
                            <Calendar className="size-3 text-muted-foreground shrink-0" />
                            {new Date(card.departure_date).toLocaleDateString('pt-BR')} ({card.passengers_count} pax)
                          </p>
                        </div>

                        {/* Ações de Avanço */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={col.id === 'booked'}
                            onClick={() => handleStageMove(card.id, card.stage, 'prev')}
                            className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Voltar etapa"
                          >
                            <ArrowLeft className="size-3" />
                          </Button>

                          <div className="flex items-center gap-1">
                            {card.client_phone && (
                              <a
                                href={`https://wa.me/55${card.client_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                                title="WhatsApp"
                              >
                                <Send className="size-3" />
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(card.id, card.client_name)}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={col.id === 'post_trip'}
                            onClick={() => handleStageMove(card.id, card.stage, 'next')}
                            className="h-7 w-7 p-0 rounded-lg text-primary hover:bg-primary/10"
                            title="Avançar etapa"
                          >
                            <ArrowRight className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md p-5 rounded-2xl bg-card border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Novo Embarque no Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Passageiro Titular *</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do passageiro" className="h-9 text-xs rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="font-bold">WhatsApp</label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(49) 99999-9999" className="h-9 text-xs rounded-xl font-mono" />
              </div>
              <div className="space-y-1">
                <label className="font-bold">Destino Principal *</label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ex: Gramado, RS ou Cancún" className="h-9 text-xs rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold">Data de Embarque *</label>
                  <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold">Nº Passageiros</label>
                  <Input type="number" value={passengersCount} onChange={(e) => setPassengersCount(e.target.value)} min="1" className="h-9 text-xs rounded-xl font-mono" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl text-xs">Cancelar</Button>
              <Button type="button" disabled={submitting} onClick={handleCreate} className="rounded-xl bg-primary text-primary-foreground text-xs font-bold px-4">
                {submitting ? 'Salvando...' : 'Criar Embarque'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
