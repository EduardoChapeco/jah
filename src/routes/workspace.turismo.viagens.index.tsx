import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plane,
  Plus,
  Search,
  Calendar,
  Users,
  Compass,
  DollarSign,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Luggage,
  MapPin,
  Building2,
  Ticket,
  Banknote,
  Check,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  listStoreTrips,
  type TourismTripDTO,
} from "@/services/travel-lifecycle.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/turismo/viagens/")({
  head: () => ({ meta: [{ title: "Viagens & Reservas Confirmadas | Workspace JAH Master OS" }] }),
  loader: async () => {
    const trips = await listStoreTrips({ data: { status: "all" } }).catch(() => []);
    return { trips };
  },
  component: WorkspaceTripsListPage,
});

type TripStatus = "all" | "confirmed" | "in_progress" | "completed" | "cancelled";

interface StatusFilterItem {
  id: TripStatus;
  label: string;
  icon: React.ElementType;
  iconColor: string;
}

const STATUS_FILTERS: StatusFilterItem[] = [
  { id: "all", label: "Todas as Viagens", icon: Compass, iconColor: "text-muted-foreground" },
  { id: "confirmed", label: "Confirmadas", icon: CheckCircle2, iconColor: "text-emerald-500" },
  { id: "in_progress", label: "Em Andamento", icon: Clock, iconColor: "text-amber-500" },
  { id: "completed", label: "Concluídas", icon: Check, iconColor: "text-sky-500" },
  { id: "cancelled", label: "Canceladas", icon: AlertTriangle, iconColor: "text-rose-500" },
];

function WorkspaceTripsListPage() {
  const { trips: initialTrips } = Route.useLoaderData();
  const [trips] = useState<TourismTripDTO[]>(initialTrips || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<TripStatus>("all");

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = trips.length;
    const confirmed = trips.filter((t) => t.status === "confirmed").length;
    const inProgress = trips.filter((t) => t.status === "in_progress").length;
    const totalRevenueCents = trips
      .filter((t) => t.status !== "cancelled")
      .reduce((acc, t) => acc + (t.total_cents || 0), 0);

    return { total, confirmed, inProgress, totalRevenueCents };
  }, [trips]);

  // Viagens filtradas
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesStatus =
        activeStatus === "all" ? true : trip.status === activeStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        trip.trip_number?.toLowerCase().includes(q) ||
        trip.title?.toLowerCase().includes(q) ||
        trip.destination_city?.toLowerCase().includes(q) ||
        trip.client_name?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [trips, activeStatus, searchQuery]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* ── 1. CABEÇALHO & ACTIONS (PADRÃO OPERACIONAL CLEAN) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/70 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground">Viagens & Reservas Confirmadas</h1>
            <Badge variant="outline" className="text-xs font-mono font-bold bg-muted/30">
              {metrics.total} {metrics.total === 1 ? "viagem" : "viagens"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Gestão unificada de passageiros, rooming list, PNRs de voos, contratos e vouchers oficiais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 h-9 border-border/70 bg-background hover:bg-muted">
            <Link to="/workspace/turismo/propostas">
              <FileSpreadsheet className="size-3.5 text-muted-foreground" />
              <span>Lâminas & Propostas</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 h-9 cursor-pointer shadow-xs">
            <Link to="/workspace/turismo/cotacoes">
              <Plus className="size-3.5" />
              <span>Nova Cotação</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. CARDS DE INDICADORES (KPIs) — ESTILO HARMONIOSO & SILENCIOSO COM PONTOS FOCAIS COLORIDOS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total de Viagens */}
        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1 shadow-2xs hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total de Viagens</span>
            <Plane className="size-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono">
            {metrics.total}
          </p>
          <p className="text-[11px] text-muted-foreground">Roteiros no portfólio</p>
        </div>

        {/* Card 2: Confirmadas */}
        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1 shadow-2xs hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Confirmadas</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.confirmed}
          </p>
          <p className="text-[11px] text-muted-foreground">Vouchers & PNRs emitidos</p>
        </div>

        {/* Card 3: Em Andamento */}
        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1 shadow-2xs hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Em Andamento</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {metrics.inProgress}
          </p>
          <p className="text-[11px] text-muted-foreground">Em execução / pré-embarque</p>
        </div>

        {/* Card 4: Faturamento */}
        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1 shadow-2xs hover:border-foreground/20 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Faturamento em Viagens</span>
            <Banknote className="size-4 text-violet-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono truncate">
            {formatMoney(metrics.totalRevenueCents)}
          </p>
          <p className="text-[11px] text-muted-foreground">Volume financeiro total</p>
        </div>
      </div>

      {/* ── 3. BARRA DE BUSCA & FILTROS DE STATUS (ESTILO LIMPO & HUMANO) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Abas de Filtro de Status */}
        <div className="h-11 p-1 rounded-xl bg-muted/30 border border-border/70 flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none shrink-0">
          {STATUS_FILTERS.map((s) => {
            const Icon = s.icon;
            const isActive = activeStatus === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStatus(s.id)}
                className={cn(
                  "rounded-lg px-3 sm:px-4 h-9 text-xs font-semibold gap-1.5 cursor-pointer flex items-center transition-all whitespace-nowrap",
                  isActive
                    ? "bg-background text-foreground shadow-2xs font-bold border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon className={cn("size-3.5", s.iconColor)} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input de Busca Integrado */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por destino, cliente, código..."
            className="pl-9.5 h-11 text-xs rounded-xl bg-card border-border/70 shadow-2xs focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* ── 4. LISTA DE VIAGENS COM CARDS PADRONIZADOS ── */}
      {filteredTrips.length === 0 ? (
        <div className="py-16 text-center space-y-4 rounded-2xl border border-dashed border-border/80 bg-muted/10">
          <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Compass className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Nenhuma viagem encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || activeStatus !== "all"
                ? "Nenhuma viagem corresponde aos filtros aplicados."
                : "Converta uma proposta aprovada para iniciar a gestão completa da viagem."}
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold">
            <Link to="/workspace/turismo/cotacoes">Ver Cotações & Leads</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => {
            const paxTotal = (trip.adults_count || 1) + (trip.children_count || 0);

            const statusColors: Record<string, string> = {
              confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
              completed: "bg-sky-500/10 text-sky-600 border-sky-500/20",
              cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
            };

            const statusLabels: Record<string, string> = {
              confirmed: "Confirmada",
              in_progress: "Em Andamento",
              completed: "Concluída",
              cancelled: "Cancelada",
            };

            return (
              <div
                key={trip.id}
                className="group relative rounded-2xl border border-border/70 bg-card hover:border-foreground/20 hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden shadow-2xs"
              >
                <div className="p-4 space-y-3">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase block">
                        {trip.trip_number}
                      </span>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {trip.destination_city || trip.title}
                      </h3>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 ${statusColors[trip.status] || ""}`}
                    >
                      {statusLabels[trip.status] || trip.status}
                    </Badge>
                  </div>

                  {/* Detalhes do Cliente */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{trip.client_name}</span>
                      <span className="text-[11px] text-muted-foreground">({paxTotal} pax)</span>
                    </div>

                    {(trip.travel_start_date || trip.travel_end_date) && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                        <span>
                          {trip.travel_start_date || "—"} até {trip.travel_end_date || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resumo de Serviços Inclusos */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {trip.flights?.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-medium border border-border/40">
                        <Plane className="size-3 text-sky-500" />
                        {trip.flights.length} voo(s)
                      </span>
                    )}
                    {trip.hotels?.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-medium border border-border/40">
                        <Building2 className="size-3 text-amber-500" />
                        {trip.hotels.length} hotel(s)
                      </span>
                    )}
                    {trip.transfers?.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-medium border border-border/40">
                        <Luggage className="size-3 text-emerald-500" />
                        Transfer
                      </span>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="p-4 pt-3 border-t border-border/60 bg-muted/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Valor Total</span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {formatMoney(trip.total_cents)}
                    </span>
                  </div>

                  <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1 h-8.5 px-3.5 cursor-pointer">
                    <Link to="/workspace/turismo/viagens/$id" params={{ id: trip.id }}>
                      <span>Gerenciar</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WorkspaceTripsListPage;
