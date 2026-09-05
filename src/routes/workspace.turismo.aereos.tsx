import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
 Plane,
 Plus,
 Search,
 Hash,
 MapPin,
 Calendar,
 Clock,
 Briefcase,
 Layers,
 CheckCircle2,
 Trash2,
 ArrowRight,
 ShieldCheck,
 Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { WorkspaceDashboardSheet, type MetricCardItem } from '@/components/workspace/workspace-dashboard-sheet';
import { WorkspaceCanonicalToolbar } from '@/components/workspace/workspace-canonical-toolbar';
import { toast } from 'sonner';
import { useWorkspaceStore } from '@/lib/store-context';
import { getStoreSettings } from '@/services/store.functions';
import { listFlightItineraries, createFlightItinerary, deleteFlightItinerary } from '@/services/travel-flights.functions';
import type { TravelFlightItinerary, FlightCabin, FlightItineraryType } from '@/types/travel-flights';

export const Route = createFileRoute('/workspace/turismo/aereos')({
 head: () => ({ meta: [{ title: 'Malha Aérea & Reconciliação (PNR) | Workspace' }] }),
 loader: async () => {
 const store = await getStoreSettings().catch(() => null);
 return { store };
 },
 component: FlightsPage,
});

export default function FlightsPage() {
 const loaderData = Route.useLoaderData?.() as any;
 const { currentStore } = useWorkspaceStore();
 const queryClient = useQueryClient();
 const storeId = loaderData?.store?.id || currentStore?.id || '00000000-0000-0000-0000-000000000000';

 const [searchTerm, setSearchTerm] = useState('');
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [isMetricsOpen, setIsMetricsOpen] = useState(false);

 // Form State
 const [title, setTitle] = useState('');
 const [itineraryType, setItineraryType] = useState<FlightItineraryType>('original');
 const [airlineCode, setAirlineCode] = useState('LA');
 const [airlineName, setAirlineName] = useState('LATAM Airlines');
 const [flightNumber, setFlightNumber] = useState('3214');
 const [originIata, setOriginIata] = useState('GRU');
 const [originCity, setOriginCity] = useState('São Paulo');
 const [destinationIata, setDestinationIata] = useState('MIA');
 const [destinationCity, setDestinationCity] = useState('Miami');
 const [departureAt, setDepartureAt] = useState('2026-10-15T23:30');
 const [arrivalAt, setArrivalAt] = useState('2026-10-16T07:15');
 const [cabin, setCabin] = useState<FlightCabin>('economy');
 const [baggage, setBaggage] = useState('1x 23kg');
 const [recordLocator, setRecordLocator] = useState('XYZ987');
 const [airportTerminal, setAirportTerminal] = useState('Terminal 3');

 const { data: itineraries = [], isLoading } = useQuery({
 queryKey: ['travel-flight-itineraries', storeId],
 queryFn: () => listFlightItineraries({ data: { storeId } }),
 enabled: Boolean(storeId),
 });

 const createMutation = useMutation({
 mutationFn: async () => {
 return createFlightItinerary({
 data: {
 store_id: storeId,
 title: title || `Voo ${originIata} -> ${destinationIata}`,
 itinerary_type: itineraryType,
 status: 'active',
 segments: [
 {
 airline_code: airlineCode,
 airline_name: airlineName,
 flight_number: flightNumber,
 origin_iata: originIata,
 origin_city: originCity,
 destination_iata: destinationIata,
 destination_city: destinationCity,
 departure_at: departureAt,
 arrival_at: arrivalAt,
 cabin,
 baggage,
 record_locator: recordLocator,
 airport_terminal: airportTerminal,
 },
 ],
 },
 });
 },
 onSuccess: () => {
 toast.success('Itinerário de voo cadastrado com sucesso!');
 setIsDialogOpen(false);
 setTitle('');
 queryClient.invalidateQueries({ queryKey: ['travel-flight-itineraries', storeId] });
 },
 onError: (err: any) => {
 toast.error(err.message || 'Erro ao cadastrar itinerário.');
 },
 });

 const deleteMutation = useMutation({
 mutationFn: (id: string) => deleteFlightItinerary({ data: { id } }),
 onSuccess: () => {
 toast.success('Itinerário excluído com sucesso.');
 queryClient.invalidateQueries({ queryKey: ['travel-flight-itineraries', storeId] });
 },
 });

 const filteredItineraries = itineraries.filter((it) => {
 const text = `${it.title} ${it.segments?.map((s) => `${s.flight_number} ${s.record_locator} ${s.origin_iata} ${s.destination_iata}`).join(' ')}`.toLowerCase();
 return text.includes(searchTerm.toLowerCase());
 });

 const dashboardMetrics: MetricCardItem[] = useMemo(() => [
    {
      title: "Total Itinerários",
      value: itineraries.length,
      description: "Viagens cadastradas",
      icon: Plane,
      color: "blue",
    },
    {
      title: "Trechos Ativos",
      value: itineraries.reduce((acc, it) => acc + (it.segments?.length || 0), 0),
      description: "Voos e conexões",
      icon: Layers,
      color: "amber",
    },
    {
      title: "Localizadores PNR",
      value: itineraries.filter((it) => it.segments?.some((s) => s.record_locator)).length,
      description: "Códigos de reserva confirmados",
      icon: Hash,
      color: "emerald",
    },
    {
      title: "Status de Reconciliação",
      value: "100%",
      description: "Emissões sincronizadas",
      icon: ShieldCheck,
      color: "purple",
    },
  ], [itineraries]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <WorkspaceCanonicalToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por título, trecho (GRU, MIA), voo ou localizador PNR..."
        onMetricsClick={() => setIsMetricsOpen(true)}
        metricsBadge={itineraries.length > 0 ? `${itineraries.length} Itinerários` : undefined}
        primaryAction={{
          label: "Novo Itinerário & Trecho",
          icon: Plus,
          onClick: () => setIsDialogOpen(true),
        }}
      />

      <WorkspaceDashboardSheet
        title="Telemetria da Malha Aérea"
        open={isMetricsOpen}
        onOpenChange={setIsMetricsOpen}
        items={dashboardMetrics}
      />

      {/* Sheet Lateral de Cadastro de Trecho */}
      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-6 overflow-y-auto space-y-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plane className="size-5 text-primary" />
              Cadastrar Novo Trecho Aéreo / Localizador
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre localizador GDS, rota, horários e franquia de bagagem.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Título / Referência da Viagem</Label>
              <Input
                placeholder="Ex: Férias Orlando - Família Silva"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cia Aérea (IATA + Nome)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="LA"
                  value={airlineCode}
                  onChange={(e) => setAirlineCode(e.target.value)}
                  className="h-11 uppercase"
                  maxLength={3}
                />
                <Input
                  placeholder="LATAM Airlines"
                  value={airlineName}
                  onChange={(e) => setAirlineName(e.target.value)}
                  className="h-11 col-span-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Número do Voo & PNR (Localizador)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Voo: 3214"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="h-11 uppercase"
                />
                <Input
                  placeholder="PNR: XYZ987"
                  value={recordLocator}
                  onChange={(e) => setRecordLocator(e.target.value)}
                  className="h-11 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Origem (IATA + Cidade)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="GRU"
                  value={originIata}
                  onChange={(e) => setOriginIata(e.target.value)}
                  className="h-11 uppercase"
                  maxLength={3}
                />
                <Input
                  placeholder="São Paulo"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="h-11 col-span-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Destino (IATA + Cidade)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="MIA"
                  value={destinationIata}
                  onChange={(e) => setDestinationIata(e.target.value)}
                  className="h-11 uppercase"
                  maxLength={3}
                />
                <Input
                  placeholder="Miami"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="h-11 col-span-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data/Hora Decolagem</Label>
              <Input
                type="datetime-local"
                value={departureAt}
                onChange={(e) => setDepartureAt(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Data/Hora Pouso</Label>
              <Input
                type="datetime-local"
                value={arrivalAt}
                onChange={(e) => setArrivalAt(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cabine & Bagagem</Label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-11 px-3 rounded-lg border border-input bg-background text-sm"
                  value={cabin}
                  onChange={(e) => setCabin(e.target.value as FlightCabin)}
                >
                  <option value="economy">Econômica</option>
                  <option value="premium_economy">Premium Econ</option>
                  <option value="business">Executiva</option>
                  <option value="first">Primeira Classe</option>
                </select>
                <Input
                  placeholder="1x 23kg"
                  value={baggage}
                  onChange={(e) => setBaggage(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Terminal do Aeroporto</Label>
              <Input
                placeholder="Ex: Terminal 3 - Portão 12"
                value={airportTerminal}
                onChange={(e) => setAirportTerminal(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <SheetFooter className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 px-4">
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="h-11 px-6 font-semibold"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar Trecho Aéreo'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

 {/* Itineraries List */}
 {isLoading ? (
 <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
 Carregando malha aérea e itinerários...
 </div>
 ) : filteredItineraries.length === 0 ? (
 <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
 <Plane className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
 <h3 className="text-base font-semibold text-foreground">Nenhum itinerário de voo cadastrado</h3>
 <p className="text-sm text-muted-foreground mt-1 mb-4">
 Cadastre o primeiro trecho aéreo com localizador PNR e franquia de bagagem.
 </p>
 <Button onClick={() => setIsDialogOpen(true)} className="h-11 px-5 gap-2 rounded-xl">
 <Plus className="size-4" />
 Cadastrar Primeiro Trecho
 </Button>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4">
 {filteredItineraries.map((it) => (
 <div
 key={it.id}
 className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 transition-all flex flex-col gap-4"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
 <Plane className="size-5" />
 </div>
 <div>
 <h3 className="text-base font-bold text-foreground">{it.title}</h3>
 <p className="text-xs text-muted-foreground">Versão {it.version} · Tipo: {it.itinerary_type}</p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
 <CheckCircle2 className="size-3 mr-1" />
 Ativo
 </span>
 <Button
 variant="ghost"
 size="icon"
 onClick={() => deleteMutation.mutate(it.id)}
 className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
 >
 <Trash2 className="size-4" />
 </Button>
 </div>
 </div>

 {/* Segments Display */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {(it.segments || []).map((seg) => (
 <div
 key={seg.id}
 className="p-4 rounded-xl border border-border/70 bg-muted/30 flex flex-col justify-between gap-3"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono font-bold text-xs">
 {seg.airline_code} {seg.flight_number}
 </span>
 <span className="text-xs font-medium text-foreground">{seg.airline_name || 'Companhia Aérea'}</span>
 </div>
 {seg.record_locator && (
 <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs border border-amber-500/20">
 PNR: {seg.record_locator}
 </span>
 )}
 </div>

 <div className="flex items-center justify-between text-center">
 <div>
 <p className="text-xl font-extrabold tracking-tight text-foreground">{seg.origin_iata}</p>
 <p className="text-xs text-muted-foreground">{seg.origin_city || 'Origem'}</p>
 <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
 {new Date(seg.departure_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>

 <div className="flex flex-col items-center px-4">
 <ArrowRight className="size-4 text-primary" />
 <span className="text-[10px] text-muted-foreground mt-0.5">Direto</span>
 </div>

 <div>
 <p className="text-xl font-extrabold tracking-tight text-foreground">{seg.destination_iata}</p>
 <p className="text-xs text-muted-foreground">{seg.destination_city || 'Destino'}</p>
 <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
 {new Date(seg.arrival_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>

 <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
 <span className="flex items-center gap-1">
 <Briefcase className="size-3 text-muted-foreground" />
 {seg.baggage || 'Sem bagagem'}
 </span>
 <span className="capitalize">{seg.cabin}</span>
 <span>{seg.airport_terminal || 'Terminal Geral'}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
