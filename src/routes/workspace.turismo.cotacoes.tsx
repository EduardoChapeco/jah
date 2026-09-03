import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AirplaneTilt,
  MapPin,
  CalendarDots,
  Users,
  WhatsappLogo,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  Sparkle,
  SuitcaseSimple,
  ShieldCheck,
  Tag,
  ChatCircleDots,
  FileText,
  Plus,
  PencilSimple,
  Trash,
  ChartLineUp,
  Funnel,
  Buildings,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/commerce/page-header";
import { toast } from "sonner";
import {
  listAgencyTravelQuotes,
  createAgencyTravelQuote,
  updateAgencyTravelQuote,
  deleteAgencyTravelQuote,
  type TravelQuoteRequestDTO,
} from "@/services/tourism.functions";
import { listDestinations } from "@/services/travel-catalog.functions";
import { createTravelProposal } from "@/services/travel-proposal.functions";
import { formatDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/cotacoes")({
  head: () => ({
    meta: [{ title: "Central de Cotações & Leads de Viagens | Workspace" }],
  }),
  loader: async () => {
    const [quotes, destinations] = await Promise.all([
      listAgencyTravelQuotes({ data: { status: "all" } }).catch(() => []),
      listDestinations().catch(() => []),
    ]);
    return { quotes, destinations };
  },
  component: AgencyQuotesPage,
});

const STATUS_FILTERS = [
  { id: "all", label: "Todas Cotações" },
  { id: "new", label: "Novas" },
  { id: "analyzing", label: "Em Análise" },
  { id: "quoted", label: "Orçamento Enviado" },
  { id: "won", label: "Fechadas / Ganhas" },
  { id: "lost", label: "Perdidas" },
];

const TRIP_TYPE_OPTIONS = [
  { id: "air_package", label: "✈️ Pacote Completo (Voo + Hotel)" },
  { id: "hotel_only", label: "🏨 Somente Hospedagem / Resort" },
  { id: "cruise", label: "🚢 Cruzeiro Marítimo" },
  { id: "bus", label: "🚌 Excursão Rodoviária" },
  { id: "visa_assistance", label: "🛂 Assessoria de Visto / Passaporte" },
];

export default function AgencyQuotesPage() {
  const { quotes: initialQuotes, destinations: initialDestinations } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [tripTypeFilter, setTripTypeFilter] = useState("all");

  // Modais
  const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
  const [managingQuote, setManagingQuote] = useState<TravelQuoteRequestDTO | null>(null);

  // Form State: Nova Cotação
  const [newName, setNewName] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOriginCity, setNewOriginCity] = useState("Chapecó");
  const [newDestinationCity, setNewDestinationCity] = useState("");
  const [newDepartureDate, setNewDepartureDate] = useState("");
  const [newReturnDate, setNewReturnDate] = useState("");
  const [newAdults, setNewAdults] = useState(2);
  const [newChildren, setNewChildren] = useState(0);
  const [newTripType, setNewTripType] = useState<"air_package" | "hotel_only" | "cruise" | "bus" | "visa_assistance">("air_package");
  const [newBudgetTier, setNewBudgetTier] = useState<"economy" | "standard" | "premium" | "luxury">("standard");
  const [newQuoteAmount, setNewQuoteAmount] = useState("");
  const [newSpecialNotes, setNewSpecialNotes] = useState("");
  const [newAgencyNotes, setNewAgencyNotes] = useState("");

  // Edit State: Gestão de Lead Existente
  const [editStatus, setEditStatus] = useState<"new" | "analyzing" | "quoted" | "won" | "lost">("new");
  const [editAgencyNotes, setEditAgencyNotes] = useState("");
  const [editQuoteAmount, setEditQuoteAmount] = useState("");

  const { data: quotes } = useQuery({
    queryKey: ["agency-travel-quotes", selectedStatus],
    queryFn: () => listAgencyTravelQuotes({ data: { status: selectedStatus as any } }),
    initialData: initialQuotes,
  });

  const { data: destinations } = useQuery({
    queryKey: ["travel-destinations"],
    queryFn: () => listDestinations(),
    initialData: initialDestinations,
  });

  // Métricas do CRM
  const metrics = useMemo(() => {
    const list = quotes || [];
    const total = list.length;
    const newCount = list.filter((q) => q.status === "new").length;
    const analyzingCount = list.filter((q) => q.status === "analyzing").length;
    const quotedCount = list.filter((q) => q.status === "quoted").length;
    const wonCount = list.filter((q) => q.status === "won").length;
    const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;
    const totalVolumeCents = list.reduce((acc, q) => acc + (q.quote_amount_cents || 0), 0);

    return { total, newCount, analyzingCount, quotedCount, wonCount, conversionRate, totalVolumeCents };
  }, [quotes]);

  // Filtro na Lista
  const filteredQuotes = useMemo(() => {
    return (quotes || []).filter((q) => {
      if (selectedStatus !== "all" && q.status !== selectedStatus) return false;
      if (tripTypeFilter !== "all" && q.trip_type !== tripTypeFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return (
          q.contact_name.toLowerCase().includes(s) ||
          q.destination_city.toLowerCase().includes(s) ||
          q.origin_city.toLowerCase().includes(s) ||
          (q.contact_whatsapp && q.contact_whatsapp.includes(s))
        );
      }
      return true;
    });
  }, [quotes, selectedStatus, tripTypeFilter, search]);

  // Mutações
  const createQuoteMutation = useMutation({
    mutationFn: () => {
      const amountCents = newQuoteAmount ? Math.round(parseFloat(newQuoteAmount.replace(/\D/g, ""))) : undefined;
      return createAgencyTravelQuote({
        data: {
          contact_name: newName,
          contact_whatsapp: newWhatsapp,
          contact_email: newEmail || null,
          origin_city: newOriginCity,
          destination_city: newDestinationCity,
          departure_date: newDepartureDate || null,
          return_date: newReturnDate || null,
          adults_count: newAdults,
          children_count: newChildren,
          trip_type: newTripType,
          budget_tier: newBudgetTier,
          special_notes: newSpecialNotes || null,
          agency_notes: newAgencyNotes || null,
          quote_amount_cents: amountCents,
          status: "new",
        },
      });
    },
    onSuccess: () => {
      toast.success("Cotação cadastrada com sucesso no CRM!");
      queryClient.invalidateQueries({ queryKey: ["agency-travel-quotes"] });
      setIsNewSheetOpen(false);
      resetNewForm();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao cadastrar cotação."),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: () => {
      if (!managingQuote) throw new Error("Cotação não selecionada.");
      const amountCents = editQuoteAmount ? Math.round(parseFloat(editQuoteAmount.replace(/\D/g, ""))) : null;
      return updateAgencyTravelQuote({
        data: {
          id: managingQuote.id,
          status: editStatus,
          agency_notes: editAgencyNotes,
          quote_amount_cents: amountCents,
        },
      });
    },
    onSuccess: () => {
      toast.success("Lead atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agency-travel-quotes"] });
      setManagingQuote(null);
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao atualizar lead."),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: string) => deleteAgencyTravelQuote({ data: { id } }),
    onSuccess: () => {
      toast.success("Cotação removida!");
      queryClient.invalidateQueries({ queryKey: ["agency-travel-quotes"] });
      setManagingQuote(null);
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao remover cotação."),
  });

  const createProposalMutation = useMutation({
    mutationFn: (q: TravelQuoteRequestDTO) =>
      createTravelProposal({
        data: {
          quoteId: q.id,
          title: `Proposta: ${q.destination_city} (${q.adults_count} adultos)`,
          clientName: q.contact_name,
          clientWhatsapp: q.contact_whatsapp,
          destinationCity: q.destination_city,
          travelStartDate: q.departure_date || undefined,
          travelEndDate: q.return_date || undefined,
          adultsCount: q.adults_count,
          childrenCount: q.children_count,
        },
      }),
    onSuccess: (res) => {
      toast.success("Lâmina criada! Abrindo Studio...");
      navigate({ to: "/workspace/turismo/propostas/$id", params: { id: res.id } });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao criar proposta."),
  });

  const resetNewForm = () => {
    setNewName("");
    setNewWhatsapp("");
    setNewEmail("");
    setNewOriginCity("Chapecó");
    setNewDestinationCity("");
    setNewDepartureDate("");
    setNewReturnDate("");
    setNewAdults(2);
    setNewChildren(0);
    setNewQuoteAmount("");
    setNewSpecialNotes("");
    setNewAgencyNotes("");
  };

  const openManageModal = (q: TravelQuoteRequestDTO) => {
    setManagingQuote(q);
    setEditStatus(q.status as any);
    setEditAgencyNotes(q.agency_notes || "");
    setEditQuoteAmount(q.quote_amount_cents ? (q.quote_amount_cents / 100).toFixed(2) : "");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Top Header & Primary Actions ── */}
      <PageHeader
        eyebrow="CRM de Vendas"
        title="Central de Cotações & Leads"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsNewSheetOpen(true)}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 h-9 px-3.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              <span>Nova Cotação (Balcão / WhatsApp)</span>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 h-9">
              <Link to="/workspace/turismo/propostas">
                <FileText size={16} weight="bold" />
                <span>Ver Lâminas / Studio</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── 2. Dashboard de Métricas de CRM (Apple HIG / Clean) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Leads</span>
          <span className="text-xl font-black text-foreground">{metrics.total}</span>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-none">
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">Novas Cotações</span>
          <span className="text-xl font-black text-foreground">{metrics.newCount}</span>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-none">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Em Análise</span>
          <span className="text-xl font-black text-foreground">{metrics.analyzingCount}</span>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-none">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Orçamentos</span>
          <span className="text-xl font-black text-foreground">{metrics.quotedCount}</span>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-none">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Fechadas ({metrics.conversionRate}%)</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{metrics.wonCount}</span>
        </Card>
        <Card className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-none col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Volume Orçado</span>
          <span className="text-sm font-black text-foreground">{formatMoney(metrics.totalVolumeCents)}</span>
        </Card>
      </div>

      {/* ── 3. Barra de Filtros de Status & Busca ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedStatus(f.id)}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={tripTypeFilter} onValueChange={setTripTypeFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-card border-border/60 w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="air_package">✈️ Aéreo + Hotel</SelectItem>
              <SelectItem value="hotel_only">🏨 Somente Hotel</SelectItem>
              <SelectItem value="cruise">🚢 Cruzeiro</SelectItem>
              <SelectItem value="bus">🚌 Rodoviário</SelectItem>
              <SelectItem value="visa_assistance">🛂 Visto</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, destino ou WhatsApp..."
            className="h-10 max-w-xs rounded-xl text-xs bg-card border-border/60"
          />
        </div>
      </div>

      {/* ── 4. Lista de Cotações Recebidas ── */}
      {filteredQuotes.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
          <AirplaneTilt size={40} className="mx-auto text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Nenhuma cotação encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Cadastre leads recebidos no balcão ou WhatsApp pelo botão acima, ou aguarde novos pedidos pelo portal público.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsNewSheetOpen(true)}
            className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5"
          >
            <Plus size={16} weight="bold" />
            <span>Cadastrar Primeira Cotação</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.map((q) => {
            const cleanWhatsapp = (q.contact_whatsapp || "").replace(/\D/g, "");
            const tripTypeLabel =
              q.trip_type === "air_package"
                ? "✈️ Voo + Hotel"
                : q.trip_type === "hotel_only"
                  ? "🏨 Somente Hotel"
                  : q.trip_type === "cruise"
                    ? "🚢 Cruzeiro"
                    : q.trip_type === "bus"
                      ? "🚌 Rodoviário"
                      : "🛂 Visto Americano";

            const waMessage = encodeURIComponent(
              `Olá ${q.contact_name}! Sou da agência de viagens no Wider e recebi sua solicitação de cotação para ${q.destination_city} (${q.adults_count} adultos${q.children_count > 0 ? `, ${q.children_count} crianças` : ""}). Preparei algumas opções incríveis para você!`
            );

            const statusBadgeVariant =
              q.status === "won"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : q.status === "quoted"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  : q.status === "analyzing"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    : q.status === "lost"
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : "bg-muted text-muted-foreground";

            const statusLabel =
              q.status === "new"
                ? "Nova Cotação"
                : q.status === "analyzing"
                  ? "Em Análise"
                  : q.status === "quoted"
                    ? "Orçamento Enviado"
                    : q.status === "won"
                      ? "Fechada / Ganha"
                      : "Perdida";

            return (
              <Card
                key={q.id}
                className="p-5 rounded-2xl border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between shadow-none"
              >
                <div className="space-y-3">
                  {/* Top Header do Card */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {tripTypeLabel}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {q.quote_amount_cents && q.quote_amount_cents > 0 && (
                        <span className="text-xs font-mono font-black text-foreground px-2 py-0.5 rounded-md bg-muted/60">
                          {formatMoney(q.quote_amount_cents)}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border ${statusBadgeVariant}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Rota da Viagem: Origem -> Destino */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-muted-foreground" />
                        <span>{q.origin_city} {q.origin_iata && `(${q.origin_iata})`}</span>
                      </span>
                      <span>→</span>
                      <span className="text-primary font-black">
                        {q.destination_city} {q.destination_iata && `(${q.destination_iata})`}
                      </span>
                    </div>

                    {(q.departure_date || q.return_date) && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 font-mono">
                        <CalendarDots size={12} />
                        <span>
                          {q.departure_date ? formatDate(q.departure_date) : "Data a definir"} até{" "}
                          {q.return_date ? formatDate(q.return_date) : "Data a definir"}
                        </span>
                        {q.flexible_dates && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                            +/- 3 dias
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detalhes de Passageiros */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-foreground shrink-0" />
                      <span className="font-bold text-foreground">
                        {q.adults_count} {q.adults_count === 1 ? "Adulto" : "Adultos"}
                      </span>
                      <span>•</span>
                      <span>
                        {q.children_count > 0
                          ? `${q.children_count} ${q.children_count === 1 ? "Criança" : "Crianças"}`
                          : "Sem crianças"}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{q.budget_tier}</span>
                    </div>

                    {q.special_notes && (
                      <p className="text-[11px] italic bg-muted/20 p-2.5 rounded-xl border border-border/40 text-muted-foreground line-clamp-2">
                        "{q.special_notes}"
                      </p>
                    )}

                    {q.agency_notes && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                        <span className="font-bold block text-[10px] uppercase">Nota Interna do Consultor:</span>
                        <span>{q.agency_notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé & Ações do Lead */}
                <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {q.contact_name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {q.contact_whatsapp}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openManageModal(q)}
                      className="rounded-xl font-bold text-xs h-8 px-2.5 border-border gap-1 cursor-pointer"
                    >
                      <PencilSimple size={13} weight="bold" />
                      <span>Gerenciar</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={createProposalMutation.isPending}
                      onClick={() => createProposalMutation.mutate(q)}
                      className="rounded-xl font-bold text-xs h-8 px-2.5 border-border gap-1 cursor-pointer text-primary"
                    >
                      <Sparkle size={13} weight="bold" />
                      <span>Criar Lâmina</span>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="rounded-xl font-bold text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <a
                        href={`https://wa.me/55${cleanWhatsapp}?text=${waMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsappLogo size={14} weight="bold" />
                        <span>WhatsApp</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 5. Sheet Lateral: Nova Cotação Balcão / WhatsApp ── */}
      <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
          <SheetHeader>
            <SheetTitle className="text-base font-bold">Nova Cotação / Lead Balcão</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre o lead atendido no balcão ou WhatsApp para acompanhamento no CRM.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 text-xs">
            {/* Dados do Cliente */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Nome do Passageiro Principal *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Carlos Eduardo de Souza"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">WhatsApp / Celular *</Label>
                <Input
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  placeholder="(49) 99999-9999"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">E-mail (opcional)</Label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Rota & Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Cidade Origem</Label>
                <Input
                  value={newOriginCity}
                  onChange={(e) => setNewOriginCity(e.target.value)}
                  placeholder="Chapecó"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Destino Almejado *</Label>
                <Input
                  value={newDestinationCity}
                  onChange={(e) => setNewDestinationCity(e.target.value)}
                  placeholder="Ex: Porto de Galinhas, PE"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Atalho de Destinos Cadastrados */}
            {destinations && destinations.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground block">Destinos Cadastrados no Banco:</span>
                <div className="flex flex-wrap gap-1">
                  {destinations.slice(0, 6).map((d: any) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setNewDestinationCity(`${d.name}, ${d.state}`)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Data Ida Prevista</Label>
                <Input
                  type="date"
                  value={newDepartureDate}
                  onChange={(e) => setNewDepartureDate(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Data Volta Prevista</Label>
                <Input
                  type="date"
                  value={newReturnDate}
                  onChange={(e) => setNewReturnDate(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Passageiros e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Adultos</Label>
                <Input
                  type="number"
                  min={1}
                  value={newAdults}
                  onChange={(e) => setNewAdults(parseInt(e.target.value) || 1)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Crianças</Label>
                <Input
                  type="number"
                  min={0}
                  value={newChildren}
                  onChange={(e) => setNewChildren(parseInt(e.target.value) || 0)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Tipo de Viagem</Label>
                <Select value={newTripType} onValueChange={(v: any) => setNewTripType(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {TRIP_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">Padrão Orçamentário</Label>
                <Select value={newBudgetTier} onValueChange={(v: any) => setNewBudgetTier(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="economy">Econômico</SelectItem>
                    <SelectItem value="standard">Padrão / Conforto</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="luxury">Luxo / 5 Estrelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Valor Orçado Inicial (R$)</Label>
              <Input
                value={newQuoteAmount}
                onChange={(e) => setNewQuoteAmount(e.target.value)}
                placeholder="Ex: 4850,00"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Solicitação / Preferências do Cliente</Label>
              <Textarea
                value={newSpecialNotes}
                onChange={(e) => setNewSpecialNotes(e.target.value)}
                placeholder="Ex: Quer hotel pé na areia com piscina aquecida para crianças."
                className="rounded-xl text-xs resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Notas Internas do Consultor (Privado)</Label>
              <Textarea
                value={newAgencyNotes}
                onChange={(e) => setNewAgencyNotes(e.target.value)}
                placeholder="Ex: Cliente tem flexibilidade de datas. Oferecer pacote com voo LATAM."
                className="rounded-xl text-xs resize-none"
                rows={2}
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewSheetOpen(false)}
                className="rounded-xl text-xs font-bold h-9"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!newName || !newWhatsapp || !newDestinationCity || createQuoteMutation.isPending}
                onClick={() => createQuoteMutation.mutate()}
                className="rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground gap-1.5"
              >
                {createQuoteMutation.isPending ? "Gravando..." : "Salvar no CRM"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── 6. Sheet: Gestão de Lead Existente ── */}
      <Sheet open={!!managingQuote} onOpenChange={(o) => !o && setManagingQuote(null)}>
        <SheetContent
          side="right"
          className="sm:max-w-md w-full max-sm:!h-[100dvh] max-sm:!inset-0 max-sm:!rounded-none border-l p-0 overflow-y-auto bg-card flex flex-col justify-between"
        >
          <div className="p-6 space-y-4">
            <SheetHeader>
              <SheetTitle className="text-base font-bold">
                Gerenciar Lead: {managingQuote?.contact_name}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Atualize o status da negociação, proposta orçada e notas de atendimento.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                <span className="text-[11px] font-bold block text-foreground">
                  {managingQuote?.destination_city} ({managingQuote?.adults_count} adultos)
                </span>
                <span className="text-[10px] font-mono text-muted-foreground block">
                  {managingQuote?.contact_whatsapp}
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Fase / Status do Lead</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="new">Nova Cotação</SelectItem>
                    <SelectItem value="analyzing">Em Análise / Montando Roteiro</SelectItem>
                    <SelectItem value="quoted">Orçamento Enviado ao Cliente</SelectItem>
                    <SelectItem value="won">Fechada / Venda Concretizada</SelectItem>
                    <SelectItem value="lost">Perdida / Sem Interesse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Valor do Orçamento Final (R$)</Label>
                <Input
                  value={editQuoteAmount}
                  onChange={(e) => setEditQuoteAmount(e.target.value)}
                  placeholder="Ex: 5890.00"
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Notas Internas da Negociação</Label>
                <Textarea
                  value={editAgencyNotes}
                  onChange={(e) => setEditAgencyNotes(e.target.value)}
                  placeholder="Ex: Cliente fechou voo com seguro. Enviado voucher."
                  className="rounded-xl text-xs resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleteQuoteMutation.isPending}
              onClick={() => {
                if (confirm("Deseja realmente remover esta cotação?")) {
                  deleteQuoteMutation.mutate(managingQuote!.id);
                }
              }}
              className="text-destructive text-xs rounded-xl h-9 hover:bg-destructive/10"
            >
              <Trash size={14} className="mr-1" />
              <span>Excluir</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setManagingQuote(null)}
                className="rounded-xl text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateQuoteMutation.isPending}
                onClick={() => updateQuoteMutation.mutate()}
                className="rounded-xl text-xs h-9 font-bold bg-primary text-primary-foreground"
              >
                {updateQuoteMutation.isPending ? "Salvando..." : "Atualizar Lead"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

