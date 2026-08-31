import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Bus,
  Plus,
  ArrowUpRight,
  Calendar,
  Users,
  MapPin,
  Clock,
  Search,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  listAgencyGroupTours,
  createGroupTour,
  type GroupTourDTO,
} from "@/services/group-tours.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/grupos/")({
  head: () => ({ meta: [{ title: "Grupos Terrestres & Excursões | Workspace Wider" }] }),
  loader: async () => {
    const tours = await listAgencyGroupTours().catch(() => []);
    return { tours };
  },
  component: WorkspaceGroupToursIndexPage,
});

function WorkspaceGroupToursIndexPage() {
  const { tours: initialTours } = Route.useLoaderData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [departureCity, setDepartureCity] = useState("São Miguel do Oeste, SC");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("06:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("20:00");
  const [totalSeats, setTotalSeats] = useState(46);
  const [priceCents, setPriceCents] = useState(0);

  const { data: tours, refetch } = useQuery({
    queryKey: ["agency-group-tours", selectedStatus, search],
    queryFn: () =>
      listAgencyGroupTours({
        data: {
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialTours,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createGroupTour({
        data: {
          title,
          destination,
          departureCity,
          departureDate,
          departureTime,
          returnDate,
          returnTime,
          totalSeats,
          priceCents,
        },
      }),
    onSuccess: (res) => {
      toast.success("Excursão cadastrada com sucesso!");
      setIsNewModalOpen(false);
      navigate({ to: "/workspace/turismo/grupos/$id" as any, params: { id: res.id } as any });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao cadastrar grupo."),
  });

  const toursList = tours || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER DO WORKSPACE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Operações Rodoviárias
            </span>
            <Badge variant="outline" className="text-[10px] font-mono font-bold">
              {toursList.length} Viagens
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Grupos Terrestres & Ônibus
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerencie mapa de assentos (2x2), alocação de passageiros, rooming list de hotéis e manifesto ANTT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 gap-1.5">
                <Plus className="size-4" />
                <span>Nova Excursão</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md sm:rounded-3xl p-6 bg-card border-border">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground">
                  Cadastrar Viagem em Grupo Terrestre
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!title || !destination || !departureDate || !returnDate) {
                    toast.error("Preencha todos os campos obrigatórios.");
                    return;
                  }
                  createMutation.mutate();
                }}
                className="space-y-3.5 pt-2 text-xs"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Título da Viagem *</Label>
                  <Input
                    placeholder="Ex: Excursão Beto Carrero & Praias"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Origem / Cidade Saída *</Label>
                    <Input
                      value={departureCity}
                      onChange={(e) => setDepartureCity(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Destino Principal *</Label>
                    <Input
                      placeholder="Ex: Penha / Balneário Camboriú"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Data de Saída *</Label>
                    <Input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Data de Retorno *</Label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Capacidade Ônibus</Label>
                    <select
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(Number(e.target.value))}
                      className="w-full h-10 rounded-xl bg-background border border-border px-2 text-xs"
                    >
                      <option value={42}>42 Lugares (Leito Turismo)</option>
                      <option value={46}>46 Lugares (Semi-Leito)</option>
                      <option value={50}>50 Lugares (Executivo)</option>
                      <option value={60}>60 Lugares (Double Decker)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Valor por Pessoa (Centavos)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 85000 para R$ 850,00"
                      value={priceCents}
                      onChange={(e) => setPriceCents(Number(e.target.value))}
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full h-11 rounded-xl text-xs font-bold bg-foreground text-background mt-2"
                >
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar e Configurar Mapa"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── 2. GRID DE VIAGENS EM GRUPO ── */}
      {toursList.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
          <Bus className="size-10 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Nenhum grupo cadastrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Cadastre sua primeira viagem em grupo para controlar poltronas e quartos de hotel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toursList.map((t: GroupTourDTO) => {
            const occupiedSeats = t.seats.filter((s) => s.status === "reserved").length;
            const occupancyPct = Math.round((occupiedSeats / t.total_seats) * 100);

            return (
              <Card
                key={t.id}
                className="p-5 rounded-2xl border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {t.destination}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold">
                      {t.status === "open" ? "Inscrições Abertas" : t.status === "confirmed" ? "Confirmada" : t.status}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{t.title}</h3>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-foreground shrink-0" />
                      <span>{t.departure_date} até {t.return_date}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-foreground shrink-0" />
                      <span>Saída: {t.departure_city}</span>
                    </p>
                  </div>

                  {/* Barra de Ocupação de Poltronas */}
                  <div className="space-y-1 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Ocupação do Ônibus:</span>
                      <span className="font-mono text-foreground">{occupiedSeats}/{t.total_seats} ({occupancyPct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Button asChild size="sm" className="w-full rounded-xl text-xs font-bold h-9 bg-foreground text-background">
                  <Link to="/workspace/turismo/grupos/$id" params={{ id: t.id } as any}>
                    Gerenciar Mapa & Rooming List
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
