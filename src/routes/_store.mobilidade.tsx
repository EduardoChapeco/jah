import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Car,
  Bike,
  Zap,
  Truck,
  Boxes,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  Navigation,
  Crosshair,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  QrCode,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import {
  calculateMobilityQuote,
  createMobilityRequest,
  type MobilityServiceType,
  type MobilityRequestDTO,
  type MobilityQuoteEstimate,
} from "@/services/mobility.functions";
import { MapLibreCanvas, type MapPoint } from "@/components/mobility/maplibre-canvas";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/mobilidade")({
  head: () => ({
    meta: [
      { title: "Mobilidade, Corridas & Entregas — Wider" },
      {
        name: "description",
        content:
          "Chame corridas de carro ou moto, entregas expressas ou mudanças completas com tarifas justas e transparentes.",
      },
    ],
  }),
  component: MobilityPage,
});

const DEFAULT_ORIGIN: MapPoint = {
  lat: -27.1004,
  lng: -52.6152,
  label: "Av. Getúlio Vargas, 500 — Centro",
};

const ICONS_BY_TYPE: Record<string, typeof Car> = {
  ride_car: Car,
  ride_moto: Bike,
  delivery_express: Zap,
  freight_van: Truck,
  moving_truck: Boxes,
};

const PRESET_PLACES = [
  { name: "Centro", address: "Av. Getúlio Vargas, Centro", lat: -27.1004, lng: -52.6152 },
  { name: "Aeroporto", address: "Acesso Florenal Ribeiro, Quedas do Palmital", lat: -27.1352, lng: -52.6565 },
  { name: "Rodoviária", address: "Rua Líbano, 111, Passo dos Fortes", lat: -27.0875, lng: -52.6289 },
  { name: "Shopping", address: "Av. Fernando Machado, 4000, Líder", lat: -27.0812, lng: -52.6345 },
  { name: "Hospital Regional", address: "R. Florianópolis, 1448, Santa Maria", lat: -27.0934, lng: -52.6078 },
];

function MobilityPage() {
  const [selectedService, setSelectedService] = useState<MobilityServiceType>("ride_car");

  // Route Coordinates
  const [origin, setOrigin] = useState<MapPoint>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<MapPoint | null>(null);

  // Address Inputs
  const [originText, setOriginText] = useState(origin.label || "");
  const [destinationText, setDestinationText] = useState("");

  // Map Pin Mode
  const [pinMode, setPinMode] = useState<"origin" | "destination" | null>(null);

  // Additional Details
  const [showDetails, setShowDetails] = useState(false);
  const [buildingNumber, setBuildingNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [helpersCount, setHelpersCount] = useState<number>(0);
  const [propertyType, setPropertyType] = useState<"ground" | "elevator" | "stairs">("ground");
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");

  // Request State
  const [activeRequest, setActiveRequest] = useState<MobilityRequestDTO | null>(null);
  const [requestStatus, setRequestStatus] = useState<"idle" | "searching" | "confirmed">("idle");

  // Distance Calculation
  const routeStats = useMemo(() => {
    if (!destination) {
      return { distanceKm: 3.8, durationMin: 10 };
    }
    const dLat = (destination.lat - origin.lat) * 111;
    const dLng = (destination.lng - origin.lng) * 111 * Math.cos((origin.lat * Math.PI) / 180);
    const straightDist = Math.sqrt(dLat * dLat + dLng * dLng);
    const distanceKm = Math.max(1.2, Math.round(straightDist * 1.3 * 10) / 10);
    const durationMin = Math.max(3, Math.round(distanceKm * 2.5) + 2);
    return { distanceKm, durationMin };
  }, [origin, destination]);

  // Consulta cotação dinâmica de tarifas reais do banco de dados (logistics_price_tables)
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["mobility-quotes", routeStats.distanceKm, helpersCount],
    queryFn: () =>
      calculateMobilityQuote({
        data: {
          origin_address: originText || origin.label || "Origem",
          destination_address: destinationText || destination?.label || "Destino",
          distance_km: routeStats.distanceKm,
          helpers_count: helpersCount,
        },
      }),
    staleTime: 30000,
  });

  const availableModals: MobilityQuoteEstimate[] = quotes || [];
  const selectedQuote = availableModals.find((q) => q.service_type === selectedService) || availableModals[0];

  const computedPriceCents = useMemo(() => {
    if (!selectedQuote) return 0;
    let price = selectedQuote.estimated_price_cents;
    if (selectedService === "moving_truck" && propertyType === "stairs") {
      price += 3500;
    }
    return price;
  }, [selectedQuote, selectedService, propertyType]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => createMobilityRequest({ data: payload }),
    onSuccess: (data) => {
      setActiveRequest(data);
      setRequestStatus("confirmed");
      toast.success("Solicitação enviada! Conectando com motoristas parceiros.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao solicitar.");
      setRequestStatus("idle");
    },
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.info("Geolocalização não disponível.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: MapPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Minha Localização Atual",
        };
        setOrigin(point);
        setOriginText("Minha Localização (GPS)");
        toast.success("Localização atual identificada!");
      },
      () => {
        toast.error("Não foi possível acessar a localização.");
      },
    );
  };

  const handleSelectPresetDestination = (place: typeof PRESET_PLACES[0]) => {
    const point: MapPoint = {
      lat: place.lat,
      lng: place.lng,
      label: place.address,
    };
    setDestination(point);
    setDestinationText(place.name);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!pinMode) return;
    if (pinMode === "origin") {
      setOrigin({ lat, lng, label: `Localização (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setOriginText(`Ponto de Partida (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      toast.success("Origem fixada no mapa!");
    } else {
      setDestination({ lat, lng, label: `Destino (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setDestinationText(`Ponto de Entrega (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      toast.success("Destino fixado no mapa!");
    }
    setPinMode(null);
  };

  const handleSubmitRequest = () => {
    if (!destination && !destinationText) {
      toast.error("Informe o endereço de destino.");
      return;
    }

    if (!selectedQuote) {
      toast.error("Nenhuma modalidade com tarifa ativa disponível.");
      return;
    }

    setRequestStatus("searching");

    const payload = {
      customer_name: recipientName || "Cliente Wider",
      customer_phone: recipientPhone || "(49) 99999-9999",
      service_type: selectedService,
      origin_address: originText || origin.label || "Origem selecionada",
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_address: destinationText || destination?.label || "Destino selecionado",
      destination_lat: destination?.lat || origin.lat + 0.02,
      destination_lng: destination?.lng || origin.lng + 0.02,
      distance_km: routeStats.distanceKm,
      estimated_price_cents: computedPriceCents,
      helpers_count: helpersCount,
      payment_method: paymentMethod,
      notes: [
        buildingNumber ? `Nº: ${buildingNumber}` : "",
        complement ? `Compl: ${complement}` : "",
        referencePoint ? `Ref: ${referencePoint}` : "",
        recipientName ? `Contato: ${recipientName}` : "",
        recipientPhone ? `Tel: ${recipientPhone}` : "",
        selectedService === "moving_truck" ? `Ajudantes: ${helpersCount}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="relative w-full h-[100dvh] min-h-0 bg-background overflow-hidden">
      {/* Botão Flutuante Voltar */}
      <div className="absolute top-3 left-3 z-30 pointer-events-auto">
        <Link
          to="/"
          aria-label="Voltar ao Início (Mobilidade)"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card/90 backdrop-blur-md  text-xs font-bold text-foreground  hover:bg-card active:scale-95 transition-all cursor-pointer"
        >
          <Navigation size={14} className="rotate-180" />
          <span>Início</span>
        </Link>
      </div>

      {/* ── 1. MAPA FULL-SCREEN MAPLIBRE (100% FULL BLEED VIEWPORT) ── */}
      <div className="absolute inset-0 size-full z-0">
        <MapLibreCanvas
          origin={origin}
          destination={destination}
          pinMode={pinMode}
          onMapClick={handleMapClick}
          className="size-full"
        />

        {/* Floating Route Info Pill */}
        {destination && (
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-card/90 backdrop-blur-md  text-foreground  text-xs font-mono font-bold">
            <span className="font-bold">{routeStats.distanceKm} km</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">~{routeStats.durationMin} min</span>
          </div>
        )}

        {/* Pin Picking Mode Banner */}
        {pinMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-foreground text-background text-xs font-bold  flex items-center gap-2">
            <span>Clique no mapa para posicionar {pinMode === "origin" ? "a Origem" : "o Destino"}</span>
            <button
              onClick={() => setPinMode(null)}
              className="ml-2 hover:opacity-75"
              aria-label="Cancelar seleção no mapa"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. PAINEL FLUTUANTE DE PEDIDO (MODAL LATERAL ESQUERDO FULL VERTICAL) ── */}
      <div className="
        absolute z-30
        /* Mobile: Bottom Sheet ancorado embaixo */
        bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl
        /* Desktop: Card flutuante lateral esquerdo */
        sm:bottom-3 sm:top-3 sm:left-3 sm:right-auto sm:w-[420px] sm:max-h-none sm:rounded-3xl
        overflow-y-auto scrollbar-none  bg-card/95 backdrop-blur-md p-5 text-foreground  space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-left-4 duration-300
      ">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 ">
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              Mobilidade & Entregas
            </h1>
            <p className="text-xs text-muted-foreground">
              Tarifas diretas e motoristas locais
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
          >
            <Link to="/conta/mobilidade">
              <Clock className="size-3.5 mr-1.5" />
              Minhas Corridas
            </Link>
          </Button>
        </div>

        {/* ── SELETOR DE MODALIDADES VINDAS DO BANCO DE DADOS ── */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Modalidade
          </span>

          {isLoadingQuotes && (
            <div className="py-6 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Calculando tarifas da região...</span>
            </div>
          )}

          {!isLoadingQuotes && availableModals.length === 0 && (
            <div className="p-3.5 rounded-xl bg-muted/40 border-0 text-center space-y-1">
              <AlertCircle className="size-5 mx-auto text-muted-foreground opacity-60" />
              <p className="text-xs font-medium text-foreground">
                Sem atendimento ou tabela de tarifas configurada
              </p>
              <p className="text-[11px] text-muted-foreground">
                Nenhuma empresa de logística ou motorista cadastrou tarifas ativas para esta região.
              </p>
            </div>
          )}

          {!isLoadingQuotes && availableModals.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableModals.map((mod) => {
                const Icon = ICONS_BY_TYPE[mod.service_type] || Car;
                const isSelected = selectedService === mod.service_type;
                return (
                  <button
                    key={mod.service_type}
                    type="button"
                    onClick={() => setSelectedService(mod.service_type)}
                    className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      isSelected
                        ? "bg-muted border-foreground/30 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`size-4 mb-2 ${isSelected ? "text-foreground" : "text-muted-foreground"}`} />
                    <div>
                      <span className="text-xs font-semibold text-foreground block leading-tight">
                        {mod.label}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground mt-0.5 block">
                        {formatMoney(mod.estimated_price_cents)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CAMPOS DE ENDEREÇO ── */}
        <div className="space-y-3 pt-1">
          {/* Origem */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-medium text-foreground">
                Ponto de Partida
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Navigation className="size-3" />
                  <span>GPS</span>
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={() => setPinMode("origin")}
                  className={`text-xs flex items-center gap-1 ${pinMode === "origin" ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Crosshair className="size-3" />
                  <span>Pin</span>
                </button>
              </div>
            </div>
            <Input
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              placeholder="Endereço de partida..."
              className="h-10 rounded-xl bg-background border-border text-sm"
            />
          </div>

          {/* Destino */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-medium text-foreground">
                Destino / Entrega
              </Label>
              <button
                type="button"
                onClick={() => setPinMode("destination")}
                className={`text-xs flex items-center gap-1 ${pinMode === "destination" ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Crosshair className="size-3" />
                <span>Fixar no Mapa</span>
              </button>
            </div>
            <Input
              value={destinationText}
              onChange={(e) => setDestinationText(e.target.value)}
              placeholder="Para onde vamos?"
              className="h-10 rounded-xl bg-background border-border text-sm"
            />
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_PLACES.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPresetDestination(p)}
                className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── IDENTIFICAÇÃO COMPLETA DO IMÓVEL (ACCORDION) ── */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-medium text-muted-foreground hover:text-foreground "
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              <span>Número, complemento e contato</span>
            </span>
            {showDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showDetails && (
            <div className="p-3.5 rounded-xl bg-muted/40  space-y-2.5 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Número</Label>
                  <Input
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    placeholder="Ex: 500"
                    className="h-8 rounded-lg bg-background text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Complemento</Label>
                  <Input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Apto 102"
                    className="h-8 rounded-lg bg-background text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Ponto de Referência</Label>
                <Input
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(e.target.value)}
                  placeholder="Ex: Em frente à praça"
                  className="h-8 rounded-lg bg-background text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome do Passageiro/Contato</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nome"
                    className="h-8 rounded-lg bg-background text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefone / WhatsApp</Label>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="(49) 99999-9999"
                    className="h-8 rounded-lg bg-background text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AJUDANTES PARA MUDANÇA (QUANDO APLICÁVEL) ── */}
        {selectedService === "moving_truck" && (
          <div className="p-3.5 rounded-xl bg-muted/40  space-y-3">
            <span className="text-xs font-semibold text-foreground block">
              Configurações da Mudança
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ajudantes de Carga:</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setHelpersCount(num)}
                    className={`size-7 rounded-lg text-xs font-medium transition-colors ${
                      helpersCount === num
                        ? "bg-foreground text-background font-semibold"
                        : "bg-background  text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 ">
              <span className="text-muted-foreground">Tipo de Acesso:</span>
              <select
                value={propertyType}
                onChange={(e: any) => setPropertyType(e.target.value)}
                className="bg-background  rounded-lg px-2 py-1 text-xs text-foreground"
              >
                <option value="ground">Casa Térrea</option>
                <option value="elevator">Com Elevador</option>
                <option value="stairs">Com Escadas (+R$ 35)</option>
              </select>
            </div>
          </div>
        )}

        {/* ── PREÇO ESTIMADO & PAGAMENTO ── */}
        {availableModals.length > 0 && (
          <div className="p-3.5 rounded-xl  bg-muted/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">
                Valor Estimado
              </span>
              <span className="font-semibold text-lg text-foreground">
                {formatMoney(computedPriceCents)}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-background p-1 rounded-lg ">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${paymentMethod === "pix" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Pix"
              >
                <QrCode className="size-3.5" />
                <span>Pix</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${paymentMethod === "card" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Cartão"
              >
                <CreditCard className="size-3.5" />
                <span>Cartão</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${paymentMethod === "cash" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Dinheiro"
              >
                <Banknote className="size-3.5" />
                <span>Dinheiro</span>
              </button>
            </div>
          </div>
        )}

        {/* ── BOTÃO DE AÇÃO PRINCIPAL ── */}
        <Button
          type="button"
          onClick={handleSubmitRequest}
          disabled={createMutation.isPending || requestStatus === "searching" || availableModals.length === 0}
          className="w-full h-11 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {createMutation.isPending || requestStatus === "searching" ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Conectando com motoristas...</span>
            </div>
          ) : availableModals.length === 0 ? (
            <span>Sem Cobertura no Momento</span>
          ) : (
            <span>Confirmar e Chamar {selectedQuote?.label || "Serviço"}</span>
          )}
        </Button>

        {/* ── STATUS APÓS SOLICITAÇÃO ── */}
        {requestStatus === "confirmed" && activeRequest && (
          <div className="p-4 rounded-xl  bg-muted/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-foreground" />
                <span className="text-xs font-semibold text-foreground">Chamado Enviado</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                #{activeRequest.id.slice(0, 8)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sua solicitação foi enviada. Você pode acompanhar o deslocamento em tempo real.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" className="flex-1 rounded-lg text-xs font-semibold bg-foreground text-background">
                <Link to="/conta/mobilidade">Acompanhar Trajeto</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRequestStatus("idle");
                  setActiveRequest(null);
                }}
                className="rounded-lg text-xs font-medium"
              >
                Novo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
