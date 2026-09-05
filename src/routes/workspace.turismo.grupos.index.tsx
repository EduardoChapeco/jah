import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
 Bus,
 Plus,
 Calendar,
 Users,
 MapPin,
 Clock,
 Search,
 CheckCircle2,
 Trash,
 TrendingUp,
 DollarSign,
 Ticket,
 UserCheck,
 Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/commerce/page-header";
import { toast } from "sonner";
import {
 listAgencyGroupTours,
 deleteGroupTour,
 type GroupTourDTO,
} from "@/services/group-tours.functions";
import { getStoreSettings } from "@/services/store.functions";
import { listVehicleLayouts } from "@/services/vehicle-layouts.functions";
import { NicheOperationalGuard } from "@/components/workspace/niche-operational-guard";
import { NewGroupTourSheet } from "@/components/tourism/groups/new-group-tour-sheet";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/grupos/")({
 head: () => ({ meta: [{ title: "Grupos Terrestres & Excursões | Workspace Wider OS" }] }),
 loader: async () => {
 const store = await getStoreSettings().catch(() => null);
 const storeId = store?.id || "";
 const [tours, layouts] = await Promise.all([
 listAgencyGroupTours().catch(() => []),
 storeId ? listVehicleLayouts({ data: { store_id: storeId } }).catch(() => []) : [],
 ]);
 return { tours: tours || [], layouts: layouts || [], store };
 },
 component: WorkspaceGroupToursIndexPage,
});

export default function WorkspaceGroupToursIndexPage() {
 const { tours: initialTours, layouts = [], store } = (Route.useLoaderData as any)();
 const queryClient = useQueryClient();
 const navigate = useNavigate();
 const [search, setSearch] = useState("");
 const [selectedStatus, setSelectedStatus] = useState("all");
 const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);

 const { data: tours } = useQuery({
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

 const deleteMutation = useMutation({
 mutationFn: (id: string) => deleteGroupTour({ data: { id } }),
 onSuccess: () => {
 toast.success("Excursão excluída com sucesso!");
 queryClient.invalidateQueries({ queryKey: ["agency-group-tours"] });
 },
 onError: (err: any) => toast.error(err?.message || "Erro ao excluir excursão."),
 });

 const toursList = tours || [];

 // Métricas Executivas da Frota & Grupos
 const metrics = useMemo(() => {
 const totalTours = toursList.length;
 let totalSeatsOffered = 0;
 let totalSeatsOccupied = 0;
 let totalVolumeCents = 0;

 toursList.forEach((t: GroupTourDTO) => {
 totalSeatsOffered += t.total_seats || 0;
 const occ = (t.seats || []).filter((s) => s.status === "reserved").length;
 totalSeatsOccupied += occ;
 totalVolumeCents += occ * (t.price_cents || 0);
 });

 const averageOccupancyPct =
 totalSeatsOffered > 0 ? Math.round((totalSeatsOccupied / totalSeatsOffered) * 100) : 0;

 return {
 totalTours,
 totalSeatsOffered,
 totalSeatsOccupied,
 averageOccupancyPct,
 totalVolumeCents,
 };
 }, [toursList]);

 // Filtro na Lista
 const filteredTours = useMemo(() => {
 return toursList.filter((t: GroupTourDTO) => {
 if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
 if (search.trim()) {
 const q = search.toLowerCase();
 return (
 t.title.toLowerCase().includes(q) ||
 t.destination.toLowerCase().includes(q) ||
 t.departure_city.toLowerCase().includes(q)
 );
 }
 return true;
 });
 }, [toursList, selectedStatus, search]);

 const defaultDepartureCity = store?.city
 ? `${store.city}, ${store.state || "SC"}`
 : "São Miguel do Oeste, SC";

 return (
 <NicheOperationalGuard
 targetNiche="tourism"
 toolTitle="Grupos Terrestres & Excursões"
 toolDescription="Gestão de excursões rodoviárias, controle de lotação de assentos em mapa 2D, check-in de embarque e rooming list de passageiros."
 store={store}
 >
 <div className="space-y-6 animate-in fade-in duration-200">
 {/* ── 1. HEADER DO WORKSPACE ── */}
 <PageHeader
 eyebrow="Turismo & Rodoviário"
 title="Grupos Terrestres & Excursões"
 actions={
 <div className="flex items-center gap-2">
 <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 h-9">
 <Link to={"/workspace/turismo/frota" as any}>
 <Bus className="size-4 text-primary" />
 <span>Gerenciar Frota (Assentos 2D)</span>
 </Link>
 </Button>
 <Button
 type="button"
 size="sm"
 onClick={() => setIsNewSheetOpen(true)}
 className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 h-9 px-4 cursor-pointer shadow-xs"
 >
 <Plus className="size-4" />
 <span>Nova Excursão (Studio)</span>
 </Button>
 </div>
 }
 />

 {/* ── 2. DASHBOARD DE MÉTRICAS EXECUTIVAS ── */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <Card className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Excursões Ativas
 </span>
 <span className="text-2xl font-black text-foreground">{metrics.totalTours}</span>
 <p className="text-[11px] text-muted-foreground">Grupos cadastrados</p>
 </Card>

 <Card className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Poltronas Ofertadas
 </span>
 <span className="text-2xl font-black text-foreground">{metrics.totalSeatsOffered}</span>
 <p className="text-[11px] text-muted-foreground">Capacidade total</p>
 </Card>

 <Card className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Lotação Média
 </span>
 <span className="text-2xl font-black text-foreground">
 {metrics.averageOccupancyPct}%
 </span>
 <p className="text-[11px] text-muted-foreground">
 {metrics.totalSeatsOccupied} assentos ocupados
 </p>
 </Card>

 <Card className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
 Volume Confirmado
 </span>
 <span className="text-2xl font-black text-foreground font-mono">
 {formatMoney(metrics.totalVolumeCents)}
 </span>
 <p className="text-[11px] text-muted-foreground">Receita em reservas</p>
 </Card>
 </div>

 {/* ── 3. FILTROS & BUSCA RÁPIDA ── */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar ">
 {[
 { id: "all", label: "Todas Excursões" },
 { id: "open", label: "Inscrições Abertas" },
 { id: "confirmed", label: "Confirmadas" },
 { id: "closed", label: "Encerradas" },
 ].map((f) => (
 <Button
 key={f.id}
 type="button"
 size="sm"
 variant={selectedStatus === f.id ? "default" : "outline"}
 onClick={() => setSelectedStatus(f.id)}
 className="rounded-xl text-xs font-bold h-8 px-3 cursor-pointer"
 >
 {f.label}
 </Button>
 ))}
 </div>

 <div className="relative w-full sm:w-64">
 <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <Input
 placeholder="Buscar por título ou cidade..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="h-8 pl-8 text-xs rounded-xl"
 />
 </div>
 </div>

 {/* ── 4. GRID DE VIAGENS EM GRUPO ── */}
 {filteredTours.length === 0 ? (
 <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
 <Bus className="size-12 mx-auto text-muted-foreground/40" />
 <h3 className="text-sm font-bold text-foreground">Nenhuma excursão encontrada</h3>
 <p className="text-xs text-muted-foreground max-w-sm mx-auto">
 Utilize o Studio de Excursões para cadastrar sua viagem com roteiro, ônibus virtual da frota e pontos de embarque.
 </p>
 <Button
 size="sm"
 onClick={() => setIsNewSheetOpen(true)}
 className="rounded-xl text-xs font-bold gap-1.5 h-9 mt-2"
 >
 <Plus className="size-4" />
 <span>Criar Primeira Excursão</span>
 </Button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredTours.map((t: GroupTourDTO) => {
 const occupiedSeats = (t.seats || []).filter((s) => s.status === "reserved").length;
 const occupancyPct = Math.round((occupiedSeats / t.total_seats) * 100);

 return (
 <Card
 key={t.id}
 className="rounded-2xl border border-border/70 bg-card overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs"
 >
 {/* Foto de Capa ou Banner de Destino */}
 {t.cover_image_url ? (
 <div className="h-36 w-full overflow-hidden relative bg-muted">
 <img
 src={t.cover_image_url}
 alt={t.title}
 className="w-full h-full object-cover"
 />
 <div className="absolute top-3 left-3">
 <Badge className="bg-black/70 backdrop-blur-md text-white border-none text-[10px] font-bold">
 {t.destination}
 </Badge>
 </div>
 <div className="absolute top-3 right-3">
 <Badge
 variant="secondary"
 className="bg-card/90 backdrop-blur-md text-foreground text-[10px] font-bold uppercase"
 >
 {t.status === "open" ? "Aberto" : t.status === "confirmed" ? "Confirmado" : t.status}
 </Badge>
 </div>
 </div>
 ) : (
 <div className="p-4 pb-0 flex items-center justify-between">
 <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
 {t.destination}
 </span>
 <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold">
 {t.status === "open" ? "Aberto" : t.status === "confirmed" ? "Confirmado" : t.status}
 </Badge>
 </div>
 )}

 <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
 <div className="space-y-2">
 <div className="flex items-center justify-between gap-2">
 <h3 className="text-sm font-bold text-foreground line-clamp-1">{t.title}</h3>
 </div>

 {t.vehicle_layout_name && (
 <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
 <Bus className="size-3.5 text-primary shrink-0" />
 <span className="font-bold text-foreground truncate">
 {t.vehicle_layout_name}
 </span>
 </div>
 )}

 <div className="space-y-1 text-xs text-muted-foreground">
 <p className="flex items-center gap-1.5">
 <Calendar className="size-3.5 text-foreground shrink-0" />
 <span>
 {t.departure_date} às {t.departure_time} até {t.return_date}
 </span>
 </p>
 <p className="flex items-center gap-1.5">
 <MapPin className="size-3.5 text-foreground shrink-0" />
 <span>Saída: {t.departure_city}</span>
 </p>
 </div>

 {/* Barra de Ocupação de Poltronas */}
 <div className="space-y-1.5 pt-2 border-t border-border/50">
 <div className="flex items-center justify-between text-xs font-bold">
 <span className="text-muted-foreground text-[11px]">Ocupação:</span>
 <span className="font-mono text-foreground text-[11px]">
 {occupiedSeats}/{t.total_seats} ({occupancyPct}%)
 </span>
 </div>
 <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
 <div
 className={`h-full transition-all duration-300 ${
 occupancyPct >= 80
 ? "bg-emerald-500"
 : occupancyPct >= 50
 ? "bg-primary"
 : "bg-amber-500"
 }`}
 style={{ width: `${occupancyPct}%` }}
 />
 </div>
 </div>

 {/* Preço por Pessoa */}
 <div className="pt-2 flex items-center justify-between">
 <span className="text-[11px] text-muted-foreground">Valor por pessoa:</span>
 <span className="text-base font-black text-foreground font-mono">
 {formatMoney(t.price_cents)}
 </span>
 </div>
 </div>

 {/* Ações Operacionais */}
 <div className="pt-3 border-t border-border/50 space-y-2">
 <div className="grid grid-cols-2 gap-2">
 <Button
 asChild
 size="sm"
 className="rounded-xl text-xs font-bold h-9 bg-foreground text-background"
 >
 <Link to="/workspace/turismo/grupos/$id" params={{ id: t.id } as any}>
 Mapa de Assentos
 </Link>
 </Button>

 <Button
 asChild
 size="sm"
 variant="outline"
 className="rounded-xl text-xs font-bold h-9 gap-1"
 >
 <Link
 to={"/workspace/turismo/grupos/$id/embarque" as any}
 params={{ id: t.id } as any}
 >
 <UserCheck className="size-3.5 text-emerald-600" />
 <span>Embarque</span>
 </Link>
 </Button>
 </div>

 <div className="flex items-center justify-between pt-1">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => {
 if (confirm(`Deseja realmente excluir a excursão "${t.title}"?`)) {
 deleteMutation.mutate(t.id);
 }
 }}
 className="text-[11px] text-destructive hover:bg-destructive/10 h-7 px-2 rounded-lg"
 >
 <Trash className="size-3 mr-1" />
 <span>Excluir</span>
 </Button>

 <span className="text-[10px] text-muted-foreground font-mono">
 ID: {t.id.slice(0, 8)}
 </span>
 </div>
 </div>
 </div>
 </Card>
 );
 })}
 </div>
 )}

 {/* ── 5. STUDIO SHEET DE NOVA EXCURSÃO ── */}
 <NewGroupTourSheet
 open={isNewSheetOpen}
 onOpenChange={setIsNewSheetOpen}
 layouts={layouts}
 defaultDepartureCity={defaultDepartureCity}
 onSuccess={(newTourId) => {
 queryClient.invalidateQueries({ queryKey: ["agency-group-tours"] });
 navigate({
 to: "/workspace/turismo/grupos/$id" as any,
 params: { id: newTourId } as any,
 });
 }}
 />
 </div>
 </NicheOperationalGuard>
 );
}
