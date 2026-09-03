import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  User,
  Plane,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Luggage,
  Clock,
  Car,
  Compass,
  ArrowRight,
  FileCheck2,
  Image as ImageIcon,
  FileText,
  Boxes,
  Wrench,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyField } from "@/components/ui/currency-field";
import { PageHeader } from "@/components/commerce/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  createTravelProposal,
  updateTravelProposal,
  type FlightSegmentDTO,
  type HotelOptionDTO,
  type ItineraryDayDTO,
  type PricingBreakdownDTO,
} from "@/services/travel-proposal.functions";
import { createQuote, type QuoteItemInput } from "@/services/quotes.functions";
import { getStoreSettings } from "@/services/store.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/orcamentos/novo")({
  head: () => ({ meta: [{ title: "Novo Orçamento Comercial | Workspace Wider" }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    return { store };
  },
  component: NovoOrcamentoRouterPage,
});

function NovoOrcamentoRouterPage() {
  const { store } = Route.useLoaderData();
  const segment = (store?.segment || store?.type || "").toLowerCase();
  const isTourism =
    segment.includes("turis") ||
    segment.includes("viag") ||
    segment.includes("hotel") ||
    segment.includes("pousad");

  if (isTourism) {
    return <NovoOrcamentoTravelosPage />;
  }

  return <NovoOrcamentoComercialUniversalPage />;
}

function NovoOrcamentoTravelosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"geral" | "voos" | "hospedagem" | "roteiro" | "financeiro">("geral");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Dados Principais da Proposta / Cliente
  const [proposalData, setProposalData] = useState({
    title: "",
    subtitle: "",
    clientName: "",
    clientWhatsapp: "",
    clientEmail: "",
    destinationCity: "",
    travelStartDate: "",
    travelEndDate: "",
    adultsCount: 2,
    childrenCount: 0,
    coverImageUrl: "",
  });

  // 2. Trechos Aéreos (Flight Segments)
  // 2. Trechos Aéreos (Flight Segments) — inicia vazio, gestor adiciona
  const [flights, setFlights] = useState<FlightSegmentDTO[]>([]);

  // 3. Hotéis e Resorts
  // 3. Hotéis e Resorts — inicia vazio, gestor adiciona
  const [hotels, setHotels] = useState<HotelOptionDTO[]>([]);

  // 4. Roteiro Dia a Dia (Itinerário)
  // 4. Roteiro Dia a Dia — inicia vazio, gestor adiciona
  const [itinerary, setItinerary] = useState<ItineraryDayDTO[]>([]);

  // 5. Precificação & Condições Financeiras (Integer Cents)
  const [currency, setCurrency] = useState<"BRL" | "USD" | "EUR">("BRL");
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [costPerPersonCents, setCostPerPersonCents] = useState<number>(0);
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [boardingTaxCents, setBoardingTaxCents] = useState<number>(0);
  const [discountCents, setDiscountCents] = useState<number>(0);
  const [maxInstallments, setMaxInstallments] = useState<number>(1);
  const [validUntilDays, setValidUntilDays] = useState<number>(3);

  // Cálculos Automáticos
  const totalPax = Math.max(1, proposalData.adultsCount + proposalData.childrenCount);
  const basePriceCents = Math.round(costPerPersonCents * (1 + markupPercent / 100)) * totalPax;
  const totalPriceCents = Math.max(0, basePriceCents + (boardingTaxCents * totalPax) - discountCents);
  const installmentValueCents = Math.round(totalPriceCents / maxInstallments);

  // Inclusos e Não Inclusos
  const [includesText, setIncludesText] = useState(
    "• Passagens aéreas ida e volta com bagagem despachada\n• Hospedagem com regime All-Inclusive\n• Traslados privativos Aeroporto / Hotel / Aeroporto\n• Seguro viagem internacional completo com cobertura médica\n• Suporte 24h da agência via WhatsApp durante toda a viagem"
  );
  const [excludesText, setExcludesText] = useState(
    "• Despesas de caráter pessoal e passeios opcionais não citados\n• Taxas turísticas governamentais locais pagas no destino"
  );

  // Ações de Adição e Remoção
  const handleAddFlight = () => {
    setFlights((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "return",
        airline_name: "LATAM Airlines",
        origin_iata: "CUN",
        origin_city: "Cancún",
        destination_iata: "GRU",
        destination_city: "São Paulo",
        departure_time: "16:00",
        arrival_time: "23:50",
        baggage_included: "1x 23kg despachada + 1x 10kg mão",
        cabin_class: "Econômica",
        stops_count: 0,
      },
    ]);
  };

  const handleAddHotel = () => {
    setHotels((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        hotel_name: "Hotel Boutique Central",
        stars: 4,
        room_type: "Suíte Standard",
        board_basis: "breakfast",
        checkin_date: "",
        checkout_date: "",
        nights_count: 3,
        amenities: ["Wi-Fi", "Piscina", "Café da Manhã"],
      },
    ]);
  };

  const handleAddItineraryDay = () => {
    setItinerary((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        day_number: prev.length + 1,
        title: `Dia ${prev.length + 1} — Exploração & Lazer`,
        description: "Dia dedicado a passeios guiados, gastronomia local e compras.",
        included_meals: ["Café da Manhã"],
      },
    ]);
  };

  // Submissão & Criação no Banco
  const handleSaveProposal = async (openStudio: boolean = true) => {
    if (!proposalData.clientName.trim() || !proposalData.clientWhatsapp.trim()) {
      toast.error("Preencha o Nome e WhatsApp do Cliente.");
      setActiveTab("geral");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Cria a proposta/orçamento no banco
      const res = await createTravelProposal({
        data: {
          clientName: proposalData.clientName,
          clientWhatsapp: proposalData.clientWhatsapp,
          title: proposalData.title,
          destinationCity: proposalData.destinationCity || "Destino Especial",
        },
      });

      if (!res?.id) throw new Error("Falha ao gerar ID do orçamento");

      // 2. Atualiza todos os dados detalhados (voos, hotéis, roteiro, financeiro)
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validUntilDays);

      await updateTravelProposal({
        data: {
          id: res.id,
          patch: {
            title: proposalData.title,
            subtitle: proposalData.subtitle,
            cover_image_url: proposalData.coverImageUrl,
            client_name: proposalData.clientName,
            client_whatsapp: proposalData.clientWhatsapp,
            client_email: proposalData.clientEmail || null,
            destination_city: proposalData.destinationCity,
            travel_start_date: proposalData.travelStartDate || null,
            travel_end_date: proposalData.travelEndDate || null,
            adults_count: proposalData.adultsCount,
            children_count: proposalData.childrenCount,
            flights,
            hotels,
            itinerary,
            includes: includesText.split("\n").filter((l) => l.trim().length > 0),
            excludes: excludesText.split("\n").filter((l) => l.trim().length > 0),
            pricing: {
              currency,
              base_price_cents: basePriceCents,
              boarding_tax_cents: boardingTaxCents * totalPax,
              other_taxes_cents: 0,
              discount_cents: discountCents,
              total_price_cents: totalPriceCents,
              installments_options: [
                {
                  installments_count: maxInstallments,
                  installment_value_cents: installmentValueCents,
                  method: "credit_card",
                  has_interest: false,
                },
                {
                  installments_count: 1,
                  installment_value_cents: Math.round(totalPriceCents * 0.95),
                  method: "pix",
                  has_interest: false,
                },
              ],
            },
            valid_until: validUntilDate.toISOString(),
            status: "draft",
          },
        },
      });

      toast.success("Orçamento Travelos criado com sucesso!");

      if (openStudio) {
        navigate({
          to: "/workspace/turismo/propostas/$id",
          params: { id: res.id },
        });
      } else {
        navigate({
          to: "/workspace/orcamentos/$id",
          params: { id: res.id },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar proposta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full p-4 sm:p-6 pb-24">
      {/* Topo / Breadcrumb & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl size-9">
            <Link to="/workspace/orcamentos">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-lg border-primary/30 text-primary bg-primary/10 font-bold">
                Travelos & TravelAgências Standard
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Total: {formatMoney(totalPriceCents)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Novo Orçamento & Roteiro sob Medida
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleSaveProposal(false)}
            disabled={isSubmitting}
            variant="outline"
            className="h-10 rounded-xl text-xs font-bold gap-1.5"
          >
            <span>Salvar Rascunho</span>
          </Button>
          <Button
            onClick={() => handleSaveProposal(true)}
            disabled={isSubmitting}
            className="h-10 rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-sm cursor-pointer"
          >
            <Sparkles className="size-4" />
            <span>Salvar & Abrir Lâmina Visual</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Abas do Construtor Travelos */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full space-y-6">
        <TabsList className="grid grid-cols-5 w-full h-12 p-1 bg-muted/60 rounded-2xl">
          <TabsTrigger value="geral" className="rounded-xl font-bold text-xs gap-1.5">
            <User className="size-3.5" />
            <span>1. Cliente & Destino</span>
          </TabsTrigger>
          <TabsTrigger value="voos" className="rounded-xl font-bold text-xs gap-1.5">
            <Plane className="size-3.5" />
            <span>2. Aéreo & Voos ({flights.length})</span>
          </TabsTrigger>
          <TabsTrigger value="hospedagem" className="rounded-xl font-bold text-xs gap-1.5">
            <Building2 className="size-3.5" />
            <span>3. Hotéis ({hotels.length})</span>
          </TabsTrigger>
          <TabsTrigger value="roteiro" className="rounded-xl font-bold text-xs gap-1.5">
            <Compass className="size-3.5" />
            <span>4. Roteiro Dia a Dia ({itinerary.length})</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="rounded-xl font-bold text-xs gap-1.5">
            <DollarSign className="size-3.5" />
            <span>5. Financeiro & Lâmina</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── ABA 1: CLIENTE & DESTINO ─── */}
        <TabsContent value="geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco Cliente */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span>Passageiro Principal / Contratante</span>
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nome Completo *</Label>
                  <Input
                    value={proposalData.clientName}
                    onChange={(e) => setProposalData({ ...proposalData, clientName: e.target.value })}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="h-10 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">WhatsApp / Celular *</Label>
                    <Input
                      value={proposalData.clientWhatsapp}
                      onChange={(e) => setProposalData({ ...proposalData, clientWhatsapp: e.target.value })}
                      placeholder="Ex: (11) 99999-8888"
                      className="h-10 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">E-mail (Opcional)</Label>
                    <Input
                      type="email"
                      value={proposalData.clientEmail}
                      onChange={(e) => setProposalData({ ...proposalData, clientEmail: e.target.value })}
                      placeholder="cliente@email.com"
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco Destino e Datas */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>Destino & Configuração da Viagem</span>
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Título da Proposta *</Label>
                  <Input
                    value={proposalData.title}
                    onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                    placeholder="Ex: Férias em Cancún & Riviera Maya All-Inclusive"
                    className="h-10 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Cidade / Destino Principal</Label>
                  <Input
                    value={proposalData.destinationCity}
                    onChange={(e) => setProposalData({ ...proposalData, destinationCity: e.target.value })}
                    placeholder="Ex: Cancún, México"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Foto de Capa da Proposta de Viagem</Label>
                  <ImageUpload
                    value={proposalData.coverImageUrl}
                    onChange={(url) => setProposalData({ ...proposalData, coverImageUrl: url })}
                    onRemove={() => setProposalData({ ...proposalData, coverImageUrl: "" })}
                    bucket="cms-media"
                    aspectPreset="widescreen"
                    helperText="Foto panorâmica de capa da proposta que o cliente verá (16:9)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Data de Ida</Label>
                    <Input
                      type="date"
                      value={proposalData.travelStartDate}
                      onChange={(e) => setProposalData({ ...proposalData, travelStartDate: e.target.value })}
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Data de Retorno</Label>
                    <Input
                      type="date"
                      value={proposalData.travelEndDate}
                      onChange={(e) => setProposalData({ ...proposalData, travelEndDate: e.target.value })}
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Adultos (Pagantes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={proposalData.adultsCount}
                      onChange={(e) => setProposalData({ ...proposalData, adultsCount: Number(e.target.value) || 1 })}
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Crianças (CHD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={proposalData.childrenCount}
                      onChange={(e) => setProposalData({ ...proposalData, childrenCount: Number(e.target.value) || 0 })}
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── ABA 2: VOOS & AÉREO ─── */}
        <TabsContent value="voos" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Malha Aérea & Trechos de Voo</h3>
              <p className="text-xs text-muted-foreground">Adicione voos de ida, volta e conexões com horários e bagagem inclusa.</p>
            </div>
            <Button onClick={handleAddFlight} variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
              <Plus className="size-3.5" />
              <span>Adicionar Trecho</span>
            </Button>
          </div>

          {flights.map((flight, idx) => (
            <div key={flight.id} className="p-5 rounded-3xl bg-card border border-border/80 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5 rounded-lg">
                    Trecho {idx + 1}: {flight.type === "outbound" ? "Ida" : flight.type === "return" ? "Volta" : "Interno"}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">{flight.airline_name}</span>
                </div>
                {flights.length > 1 && (
                  <Button
                    onClick={() => setFlights((prev) => prev.filter((f) => f.id !== flight.id))}
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Cia Aérea</Label>
                  <Input
                    value={flight.airline_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, airline_name: val } : f)));
                    }}
                    placeholder="LATAM / Gol / Azul / TAP"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Nº do Voo</Label>
                  <Input
                    value={flight.flight_number || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, flight_number: val } : f)));
                    }}
                    placeholder="LA8100"
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Origem (IATA / Cidade)</Label>
                  <Input
                    value={`${flight.origin_iata} - ${flight.origin_city}`}
                    onChange={(e) => {
                      const [iata, city] = e.target.value.split("-");
                      setFlights((prev) =>
                        prev.map((f) =>
                          f.id === flight.id ? { ...f, origin_iata: (iata || "").trim(), origin_city: (city || "").trim() } : f
                        )
                      );
                    }}
                    placeholder="GRU - São Paulo"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Destino (IATA / Cidade)</Label>
                  <Input
                    value={`${flight.destination_iata} - ${flight.destination_city}`}
                    onChange={(e) => {
                      const [iata, city] = e.target.value.split("-");
                      setFlights((prev) =>
                        prev.map((f) =>
                          f.id === flight.id ? { ...f, destination_iata: (iata || "").trim(), destination_city: (city || "").trim() } : f
                        )
                      );
                    }}
                    placeholder="CUN - Cancún"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Horário de Partida & Chegada</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={flight.departure_time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, departure_time: val } : f)));
                      }}
                      placeholder="08:30"
                      className="h-9 rounded-xl text-xs font-mono"
                    />
                    <span>➔</span>
                    <Input
                      value={flight.arrival_time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, arrival_time: val } : f)));
                      }}
                      placeholder="14:45"
                      className="h-9 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Franquia de Bagagem</Label>
                  <Input
                    value={flight.baggage_included || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, baggage_included: val } : f)));
                    }}
                    placeholder="1x 23kg despachada + 10kg mão"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Classe da Cabine</Label>
                  <Select
                    value={flight.cabin_class || "Econômica"}
                    onValueChange={(val) =>
                      setFlights((prev) => prev.map((f) => (f.id === flight.id ? { ...f, cabin_class: val } : f)))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Econômica">Econômica</SelectItem>
                      <SelectItem value="Premium Economy">Premium Economy</SelectItem>
                      <SelectItem value="Executiva (Business)">Executiva (Business)</SelectItem>
                      <SelectItem value="Primeira Classe">Primeira Classe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ─── ABA 3: HOSPEDAGEM ─── */}
        <TabsContent value="hospedagem" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Hospedagem, Resorts & Hotéis</h3>
              <p className="text-xs text-muted-foreground">Cadastre as opções de hotel com regime de alimentação e noites.</p>
            </div>
            <Button onClick={handleAddHotel} variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
              <Plus className="size-3.5" />
              <span>Adicionar Hotel</span>
            </Button>
          </div>

          {hotels.map((hotel, idx) => (
            <div key={hotel.id} className="p-5 rounded-3xl bg-card border border-border/80 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5 rounded-lg">
                    Opção {idx + 1}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">{hotel.hotel_name}</span>
                  <span className="text-xs text-amber-500">{"★".repeat(hotel.stars || 5)}</span>
                </div>
                {hotels.length > 1 && (
                  <Button
                    onClick={() => setHotels((prev) => prev.filter((h) => h.id !== hotel.id))}
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Nome do Hotel / Resort</Label>
                  <Input
                    value={hotel.hotel_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, hotel_name: val } : h)));
                    }}
                    placeholder="Ex: Hard Rock Hotel Cancún"
                    className="h-9 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Tipo de Quarto / Acomodação</Label>
                  <Input
                    value={hotel.room_type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, room_type: val } : h)));
                    }}
                    placeholder="Ex: Deluxe Vista Mar King"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Regime de Alimentação</Label>
                  <Select
                    value={hotel.board_basis}
                    onValueChange={(val: any) =>
                      setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, board_basis: val } : h)))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_inclusive">All-Inclusive (Tudo Incluso)</SelectItem>
                      <SelectItem value="breakfast">Café da Manhã Incluso</SelectItem>
                      <SelectItem value="half_board">Meia Pensão (Café + Jantar)</SelectItem>
                      <SelectItem value="full_board">Pensão Completa (Café + Almoço + Jantar)</SelectItem>
                      <SelectItem value="none">Apenas Hospedagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Foto de Capa do Hotel</Label>
                  <ImageUpload
                    value={hotel.image_url}
                    onChange={(url) => setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, image_url: url } : h)))}
                    onRemove={() => setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, image_url: "" } : h)))}
                    bucket="cms-media"
                    aspectPreset="widescreen"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Número de Noites</Label>
                  <Input
                    type="number"
                    min={1}
                    value={hotel.nights_count}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setHotels((prev) => prev.map((h) => (h.id === hotel.id ? { ...h, nights_count: val } : h)));
                    }}
                    className="h-9 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ─── ABA 4: ROTEIRO DIA A DIA ─── */}
        <TabsContent value="roteiro" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Roteiro Visual & Itinerário Dia a Dia</h3>
              <p className="text-xs text-muted-foreground">Monte o cronograma diário com fotos dos pontos turísticos e atividades.</p>
            </div>
            <Button onClick={handleAddItineraryDay} variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
              <Plus className="size-3.5" />
              <span>Adicionar Dia</span>
            </Button>
          </div>

          <div className="space-y-3">
            {itinerary.map((day, idx) => (
              <div key={day.id} className="p-5 rounded-3xl bg-card border border-border/80 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 rounded-lg border-primary/30 text-primary bg-primary/10">
                    Dia {idx + 1}
                  </Badge>
                  {itinerary.length > 1 && (
                    <Button
                      onClick={() => setItinerary((prev) => prev.filter((d) => d.id !== day.id))}
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Título do Dia</Label>
                    <Input
                      value={day.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, title: val } : d)));
                      }}
                      placeholder="Ex: Passeio em Chichén Itzá & Cenotes Sagrados"
                      className="h-9 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Foto de Destaque da Atração</Label>
                    <ImageUpload
                      value={day.image_url}
                      onChange={(url) => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, image_url: url } : d)))}
                      onRemove={() => setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, image_url: "" } : d)))}
                      bucket="cms-media"
                      aspectPreset="widescreen"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">Descrição da Experiência</Label>
                  <Textarea
                    value={day.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItinerary((prev) => prev.map((d) => (d.id === day.id ? { ...d, description: val } : d)));
                    }}
                    placeholder="Descreva as atividades, horários de saída, paradas e dicas..."
                    className="rounded-xl text-xs min-h-[60px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── ABA 5: FINANCEIRO & LÂMINA ─── */}
        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco de Valores e Margem */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-600" />
                <span>Composição de Custos & Margem de Lucro</span>
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Moeda Base</Label>
                    <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real Brasileiro (BRL R$)</SelectItem>
                        <SelectItem value="USD">Dólar Americano (USD $)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR €)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currency !== "BRL" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Câmbio Travado</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(Number(e.target.value) || 1)}
                        className="h-10 rounded-xl text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Custo / Pessoa (R$)</Label>
                    <Input
                      type="number"
                      value={costPerPersonCents / 100}
                      onChange={(e) => setCostPerPersonCents(Math.round(Number(e.target.value) * 100) || 0)}
                      className="h-10 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Margem / Markup (%)</Label>
                    <Input
                      type="number"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(Number(e.target.value) || 0)}
                      className="h-10 rounded-xl text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Taxas de Embarque / Pessoa</Label>
                    <Input
                      type="number"
                      value={boardingTaxCents / 100}
                      onChange={(e) => setBoardingTaxCents(Math.round(Number(e.target.value) * 100) || 0)}
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Desconto Geral (R$)</Label>
                    <Input
                      type="number"
                      value={discountCents / 100}
                      onChange={(e) => setDiscountCents(Math.round(Number(e.target.value) * 100) || 0)}
                      className="h-10 rounded-xl text-xs font-mono text-destructive"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passageiros:</span>
                    <span className="font-bold">{totalPax} pessoa(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor por Passageiro:</span>
                    <span className="font-bold">{formatMoney(Math.round(totalPriceCents / totalPax))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-border/60">
                    <span className="text-foreground">Total do Pacote:</span>
                    <span className="text-primary">{formatMoney(totalPriceCents)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Opção Parcelada:</span>
                    <span className="font-mono">{maxInstallments}x de {formatMoney(installmentValueCents)} sem juros</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusos e Condições */}
            <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck2 className="size-4 text-primary" />
                <span>Itens Inclusos & Termos</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Itens Inclusos no Pacote</Label>
                  <Textarea
                    value={includesText}
                    onChange={(e) => setIncludesText(e.target.value)}
                    className="rounded-xl text-xs min-h-[90px] font-mono leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Itens Não Inclusos</Label>
                  <Textarea
                    value={excludesText}
                    onChange={(e) => setExcludesText(e.target.value)}
                    className="rounded-xl text-xs min-h-[60px] font-mono leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Validade da Cotação (Dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={validUntilDays}
                    onChange={(e) => setValidUntilDays(Number(e.target.value) || 3)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QuoteLineItem {
  id: string;
  item_type: "product_variant" | "service" | "rental_equipment" | "manual_item";
  name: string;
  description: string;
  sku: string;
  unit_price_cents: number;
  quantity: number;
  discount_cents: number;
}

function NovoOrcamentoComercialUniversalPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cliente
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Condições & Termos
  const [conditions, setConditions] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [validUntilDays, setValidUntilDays] = useState(7);

  // Itens do Orçamento
  const [items, setItems] = useState<QuoteLineItem[]>([
    {
      id: crypto.randomUUID(),
      item_type: "manual_item",
      name: "",
      description: "",
      sku: "",
      unit_price_cents: 0,
      quantity: 1,
      discount_cents: 0,
    },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item_type: "manual_item",
        name: "",
        description: "",
        sku: "",
        unit_price_cents: 0,
        quantity: 1,
        discount_cents: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("O orçamento precisa de ao menos 1 item.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<QuoteLineItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // Cálculos
  const subtotalCents = items.reduce((acc, i) => acc + i.unit_price_cents * i.quantity, 0);
  const totalDiscountCents = items.reduce((acc, i) => acc + i.discount_cents, 0);
  const totalCents = Math.max(0, subtotalCents - totalDiscountCents);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerData.name.trim()) {
      toast.error("Informe o nome do cliente ou razão social.");
      return;
    }

    const validItems = items.filter((i) => i.name.trim().length > 0 && i.unit_price_cents > 0);
    if (validItems.length === 0) {
      toast.error("Informe ao menos 1 item com nome e valor válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validUntilDays);

      const payload = {
        guest_name: customerData.name.trim(),
        guest_email: customerData.email.trim() || undefined,
        guest_phone: customerData.phone.trim() || undefined,
        valid_until: validUntilDate.toISOString(),
        conditions: conditions.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
        items: validItems.map((i, idx) => ({
          item_type: i.item_type,
          name: i.name.trim(),
          description: i.description.trim() || undefined,
          sku: i.sku.trim() || undefined,
          unit_price_cents: i.unit_price_cents,
          quantity: i.quantity,
          discount_cents: i.discount_cents,
          position: idx,
        })),
      };

      await createQuote({ data: payload });

      toast.success("Orçamento comercial criado com sucesso!");
      navigate({ to: "/workspace/orcamentos" });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar o orçamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        eyebrow="Vendas & Propostas"
        title="Novo Orçamento Comercial"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild size="sm" className="rounded-xl text-xs font-bold">
              <Link to="/workspace/orcamentos">
                <ArrowLeft className="mr-1.5 size-3.5" />
                Voltar aos Orçamentos
              </Link>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Gerando Orçamento...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Salvar Orçamento</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Dados do Cliente + Tabela de Itens (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Identificação do Cliente */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <User className="size-4 text-primary" />
              <span>Destinatário / Cliente</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-medium">Nome / Razão Social *</Label>
                <Input
                  value={customerData.name}
                  onChange={(e) => setCustomerData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Ana Clara ou Empresa LTDA"
                  className="h-10 rounded-xl text-xs"
                  required
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-medium">E-mail</Label>
                <Input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="contato@cliente.com"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs font-medium">WhatsApp / Telefone</Label>
                <Input
                  value={customerData.phone}
                  onChange={(e) => setCustomerData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(49) 99999-0000"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Itens do Orçamento */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Package className="size-4 text-primary" />
                <span>Itens, Produtos & Serviços ({items.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="rounded-xl text-xs font-bold gap-1.5 h-8"
              >
                <Plus className="size-3.5" />
                <span>Adicionar Linha</span>
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal = item.unit_price_cents * item.quantity - item.discount_cents;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-muted/20 border border-border/70 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                          #{idx + 1}
                        </Badge>
                        <Select
                          value={item.item_type}
                          onValueChange={(val: any) => handleUpdateItem(item.id, { item_type: val })}
                        >
                          <SelectTrigger className="h-7 text-[11px] rounded-lg w-44 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product_variant">Produto / Mercadoria</SelectItem>
                            <SelectItem value="service">Serviço / Atendimento</SelectItem>
                            <SelectItem value="rental_equipment">Locação de Equipamento</SelectItem>
                            <SelectItem value="manual_item">Item Avulso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="size-7 text-muted-foreground hover:text-destructive rounded-lg"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-5 space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          Nome do Item / Descrição *
                        </Label>
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          placeholder="Ex: Consultoria Técnica, Vestido de Noiva, Câmera 4K"
                          className="h-9 text-xs rounded-xl bg-background"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Qtd</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="h-9 text-xs rounded-xl font-mono text-center bg-background"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Valor Un. (R$)</Label>
                        <CurrencyField
                          value={item.unit_price_cents}
                          onChange={(val) => handleUpdateItem(item.id, { unit_price_cents: val })}
                          className="h-9 text-xs rounded-xl font-mono bg-background"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">Total da Linha</Label>
                        <div className="h-9 px-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-end font-mono font-bold text-xs text-foreground">
                          {formatMoney(Math.max(0, lineTotal))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Condições Comerciais & Observações */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <FileCheck2 className="size-4 text-primary" />
              <span>Condições Comerciais & Termos</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Condições de Pagamento & Entrega</Label>
                <Textarea
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Ex: Pagamento 50% de entrada e 50% na entrega. Prazo de execução: 15 dias úteis."
                  className="rounded-xl text-xs min-h-[70px]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Observações Internas (Uso Exclusivo da Equipe)</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Ex: Negociação aprovada pelo gerente com 5% de margem extra."
                  className="rounded-xl text-xs min-h-[50px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Resumo Financeiro & Validade (4 Cols Sticky) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <DollarSign className="size-4 text-primary" />
              <span>Balanço da Proposta</span>
            </h3>

            <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal dos Itens:</span>
                <span className="font-mono font-bold text-foreground">{formatMoney(subtotalCents)}</span>
              </div>

              {totalDiscountCents > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Descontos Aplicados:</span>
                  <span className="font-mono font-bold">-{formatMoney(totalDiscountCents)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black pt-3 border-t border-border/80 text-foreground">
                <span>Valor Total:</span>
                <span className="text-primary font-mono">{formatMoney(totalCents)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 space-y-1.5">
              <Label className="text-xs font-bold">Validade da Proposta (Dias)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={validUntilDays}
                onChange={(e) => setValidUntilDays(Number(e.target.value) || 7)}
                className="h-10 rounded-xl text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground leading-tight">
                Após este período, a proposta será marcada como expirada automaticamente.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-2 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Salvar e Emitir Orçamento</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
