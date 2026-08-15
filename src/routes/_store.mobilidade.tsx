import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Car,
  Bike,
  Zap,
  Truck,
  Boxes,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Package,
  Loader2,
  Phone,
  Navigation,
  Crosshair,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  QrCode,
  Banknote,
  AlertCircle,
  Route as RouteIcon,
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
  type MobilityQuoteEstimate,
  type MobilityRequestDTO,
} from "@/services/mobility.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/mobilidade")({
  head: () => ({
    meta: [
      { title: "Mobilidade, Corridas, Entregas & Mudanças — JAH" },
      {
        name: "description",
        content:
          "Chame corridas de carro ou moto, entregas expressas ou fretes e mudanças completas com mapa interativo e tarifas transparentes.",
      },
    ],
  }),
  component: FullMapMobilityPage,
});

interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

const DEFAULT_CENTER: GeoPoint = {
  lat: -27.1004,
  lng: -52.6152,
  label: "Centro — Chapecó, SC",
};

const PRESET_PLACES: Array<{ name: string; address: string; lat: number; lng: number }> = [
  { name: "Centro / Praça Coronel Bertaso", address: "Av. Getúlio Vargas, Centro", lat: -27.1004, lng: -52.6152 },
  { name: "Aeroporto Serafin Enoss Bertaso", address: "Acesso Florenal Ribeiro, Quedas do Palmital", lat: -27.1352, lng: -52.6565 },
  { name: "Rodoviária de Chapecó", address: "Rua Líbano, 111, Passo dos Fortes", lat: -27.0875, lng: -52.6289 },
  { name: "Shopping Pátio Chapecó", address: "Av. Fernando Machado, 4000, Líder", lat: -27.0812, lng: -52.6345 },
  { name: "Parque da Efapi (Tancredo Neves)", address: "R. Senador Attilio Fontana, Efapi", lat: -27.0755, lng: -52.6712 },
  { name: "Hospital Regional do Oeste (HRO)", address: "R. Florianópolis, 1448, Santa Maria", lat: -27.0934, lng: -52.6078 },
];

const MODALITIES: Array<{
  type: MobilityServiceType;
  title: string;
  subtitle: string;
  icon: typeof Car;
  badge?: string;
  basePrice: number;
  pricePerKm: number;
  etaMins: number;
}> = [
  {
    type: "ride_car",
    title: "Carro Privado",
    subtitle: "Até 4 passageiros com ar-condicionado",
    icon: Car,
    badge: "Popular",
    basePrice: 750,
    pricePerKm: 240,
    etaMins: 3,
  },
  {
    type: "ride_moto",
    title: "Moto Passageiro",
    subtitle: "Rápido e econômico para 1 pessoa",
    icon: Bike,
    badge: "Mais Rápido",
    basePrice: 500,
    pricePerKm: 160,
    etaMins: 2,
  },
  {
    type: "delivery_express",
    title: "Entrega Flash",
    subtitle: "Documentos, pacotes e compras urgentes",
    icon: Zap,
    badge: "Express",
    basePrice: 600,
    pricePerKm: 180,
    etaMins: 4,
  },
  {
    type: "freight_van",
    title: "Fiorino / Carga",
    subtitle: "Caixas médias e mercadorias comerciais",
    icon: Truck,
    badge: "Cargas",
    basePrice: 2800,
    pricePerKm: 350,
    etaMins: 8,
  },
  {
    type: "moving_truck",
    title: "Caminhão de Mudança",
    subtitle: "Mudança residencial completa com ajudantes",
    icon: Boxes,
    badge: "Mudanças",
    basePrice: 12000,
    pricePerKm: 550,
    etaMins: 15,
  },
];

// Veículos simulados ao redor no mapa para efeito dinâmico
const NEARBY_VEHICLES = [
  { id: "v1", type: "car", lat: -27.098, lng: -52.613, angle: 45, label: "Carro 3 min" },
  { id: "v2", type: "moto", lat: -27.103, lng: -52.617, angle: 120, label: "Moto 2 min" },
  { id: "v3", type: "car", lat: -27.095, lng: -52.619, angle: 280, label: "Carro 5 min" },
  { id: "v4", type: "van", lat: -27.106, lng: -52.611, angle: 15, label: "Fiorino 8 min" },
];

function FullMapMobilityPage() {
  const navigate = useNavigate();

  // Selected Service
  const [selectedService, setSelectedService] = useState<MobilityServiceType>("ride_car");

  // Route Points
  const [origin, setOrigin] = useState<GeoPoint>({
    lat: -27.1004,
    lng: -52.6152,
    label: "Av. Getúlio Vargas, 500 — Centro",
  });
  const [destination, setDestination] = useState<GeoPoint | null>(null);

  // Address Inputs Search text
  const [originText, setOriginText] = useState(origin.label);
  const [destinationText, setDestinationText] = useState("");

  // Map Pin Picking Mode
  const [pinMode, setPinMode] = useState<"origin" | "destination" | null>(null);

  // Additional Details Drawer / Accordion
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [buildingNumber, setBuildingNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [helpersCount, setHelpersCount] = useState<number>(0);
  const [propertyType, setPropertyType] = useState<"ground" | "elevator" | "stairs">("ground");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card_app" | "money" | "card_driver">("pix");

  // Active Request Status
  const [activeRequest, setActiveRequest] = useState<MobilityRequestDTO | null>(null);
  const [requestStatus, setRequestStatus] = useState<"idle" | "searching" | "confirmed">("idle");

  // Distance & Estimate Calculation
  const routeStats = useMemo(() => {
    if (!destination) {
      return { distanceKm: 4.2, durationMin: 12 };
    }
    // Haversine rough estimate
    const dLat = (destination.lat - origin.lat) * 111;
    const dLng = (destination.lng - origin.lng) * 111 * Math.cos((origin.lat * Math.PI) / 180);
    const straightDist = Math.sqrt(dLat * dLat + dLng * dLng);
    const distanceKm = Math.max(1.5, Math.round(straightDist * 1.35 * 10) / 10);
    const durationMin = Math.max(4, Math.round(distanceKm * 2.5) + 3);
    return { distanceKm, durationMin };
  }, [origin, destination]);

  // Current selected modality config
  const currentModality = MODALITIES.find((m) => m.type === selectedService) || MODALITIES[0];

  // Calculated Price in Cents
  const computedPriceCents = useMemo(() => {
    let price = currentModality.basePrice + Math.round(routeStats.distanceKm * currentModality.pricePerKm);
    if (selectedService === "moving_truck") {
      price += helpersCount * 4500;
      if (propertyType === "stairs") price += 3500;
    }
    return price;
  }, [currentModality, routeStats.distanceKm, selectedService, helpersCount, propertyType]);

  // Create Request Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => createMobilityRequest({ data: payload }),
    onSuccess: (data) => {
      setActiveRequest(data);
      setRequestStatus("confirmed");
      toast.success("Corrida solicitada com sucesso! Conectando com motorista.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao solicitar corrida.");
      setRequestStatus("idle");
    },
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.info("Geolocalização não suportada no seu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Minha Localização Atual",
        };
        setOrigin(point);
        setOriginText("Minha Localização Atual (GPS)");
        toast.success("Localização atual identificada!");
      },
      () => {
        toast.error("Não foi possível obter sua localização.");
      },
    );
  };

  const handleSelectPresetDestination = (place: typeof PRESET_PLACES[0]) => {
    const point = {
      lat: place.lat,
      lng: place.lng,
      label: place.address,
    };
    setDestination(point);
    setDestinationText(place.name);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Converte posição percentual na tela para coordenada em Chapecó
    const lat = DEFAULT_CENTER.lat + (0.5 - y) * 0.06;
    const lng = DEFAULT_CENTER.lng + (x - 0.5) * 0.08;

    if (pinMode === "origin") {
      setOrigin({ lat, lng, label: `Ponto no Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setOriginText(`Local Coleta (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      toast.success("Origem fixada no mapa!");
    } else {
      setDestination({ lat, lng, label: `Destino no Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setDestinationText(`Local Entrega (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      toast.success("Destino fixado no mapa!");
    }
    setPinMode(null);
  };

  const handleSubmitRequest = () => {
    if (!destination && !destinationText) {
      toast.error("Informe o endereço de destino.");
      return;
    }

    setRequestStatus("searching");

    const payload = {
      customer_name: recipientName || "Cliente JAH",
      customer_phone: recipientPhone || "(49) 99999-9999",
      service_type: selectedService,
      origin_address: originText || origin.label,
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
        recipientName ? `Destinatário: ${recipientName}` : "",
        recipientPhone ? `Tel: ${recipientPhone}` : "",
        selectedService === "moving_truck" ? `Ajudantes: ${helpersCount} | Tipo: ${propertyType}` : "",
        `Pagamento: ${paymentMethod}`,
      ]
        .filter(Boolean)
        .join(" | "),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden flex flex-col md:flex-row select-none">
      {/* ── 1. MAPA FULL-BLEED INTERATIVO ───────────────────────────── */}
      <div
        onClick={handleMapClick}
        className={`relative flex-1 w-full h-full bg-[#12161a] overflow-hidden cursor-${pinMode ? "crosshair" : "grab"}`}
      >
        {/* Camada Visual de Ruas & Topografia Vetorial */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px]" />

        {/* Linhas de Ruas & Grid Cartográfico Urbano */}
        <svg className="absolute inset-0 size-full pointer-events-none opacity-40">
          <line x1="0%" y1="30%" x2="100%" y2="30%" stroke="#334155" strokeWidth="3" />
          <line x1="0%" y1="65%" x2="100%" y2="65%" stroke="#334155" strokeWidth="4" />
          <line x1="35%" y1="0%" x2="35%" y2="100%" stroke="#334155" strokeWidth="4" />
          <line x1="70%" y1="0%" x2="70%" y2="100%" stroke="#334155" strokeWidth="3" />
          <line x1="15%" y1="15%" x2="85%" y2="85%" stroke="#1e293b" strokeWidth="6" />

          {/* Rota traçada (Polyline animada quando houver destino) */}
          <path
            d="M 350 380 Q 480 320 620 420"
            fill="none"
            stroke="var(--color-primary, #10b981)"
            strokeWidth="5"
            strokeDasharray="8 4"
            className="animate-pulse"
          />
        </svg>

        {/* ── Veículos Animados no Mapa ── */}
        {NEARBY_VEHICLES.map((v) => (
          <div
            key={v.id}
            className="absolute z-20 flex flex-col items-center transition-all duration-1000"
            style={{
              top: `${45 + (v.lat - DEFAULT_CENTER.lat) * 2000}%`,
              left: `${50 + (v.lng - DEFAULT_CENTER.lng) * 2000}%`,
            }}
          >
            <div className="size-8 rounded-full bg-zinc-900 border-2 border-primary text-primary flex items-center justify-center shadow-lg shadow-primary/20">
              {v.type === "moto" ? <Bike className="size-4" /> : v.type === "van" ? <Truck className="size-4" /> : <Car className="size-4" />}
            </div>
            <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono whitespace-nowrap">
              {v.label}
            </span>
          </div>
        ))}

        {/* ── Marcador de ORIGEM (Pin Verde) ── */}
        <div
          className="absolute z-30 flex flex-col items-center -translate-x-1/2 -translate-y-full"
          style={{ top: "55%", left: "38%" }}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute size-8 rounded-full bg-emerald-500/30 animate-ping" />
            <div className="size-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white">
              <MapPin className="size-5" />
            </div>
          </div>
          <div className="mt-1 px-2.5 py-1 rounded-xl bg-black/90 text-white text-[11px] font-bold shadow-md whitespace-nowrap border border-white/10">
            Partida / Coleta
          </div>
        </div>

        {/* ── Marcador de DESTINO (Pin Vermelho) ── */}
        <div
          className="absolute z-30 flex flex-col items-center -translate-x-1/2 -translate-y-full"
          style={{ top: "42%", left: "68%" }}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute size-8 rounded-full bg-red-500/30 animate-ping" />
            <div className="size-9 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white">
              <Crosshair className="size-5" />
            </div>
          </div>
          <div className="mt-1 px-2.5 py-1 rounded-xl bg-black/90 text-white text-[11px] font-bold shadow-md whitespace-nowrap border border-white/10">
            {destinationText || "Destino Escolhido"}
          </div>
        </div>

        {/* ── Tag Flutuante de Distância e Tempo na Rota ── */}
        <div className="absolute top-20 right-6 z-30 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-white shadow-xl">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <RouteIcon className="size-4" />
            <span>{routeStats.distanceKm} km</span>
          </div>
          <span className="text-zinc-600">•</span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
            <Clock className="size-4 text-primary" />
            <span>~{routeStats.durationMin} min</span>
          </div>
        </div>

        {/* ── Indicador de Modo Pin Ativo ── */}
        {pinMode && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-2xl animate-bounce flex items-center gap-2">
            <Crosshair className="size-4 animate-spin" />
            <span>Clique em qualquer ponto do mapa para fixar {pinMode === "origin" ? "a Origem" : "o Destino"}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPinMode(null);
              }}
              className="ml-2 size-5 rounded-full bg-black/30 flex items-center justify-center"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. FLOATING ACTION PANEL (MODAL DE PEDIDO COMPLETO) ────────── */}
      <div className="relative md:absolute md:top-4 md:left-4 z-40 w-full md:w-[440px] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none rounded-3xl border border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl p-5 text-white shadow-2xl space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Car className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Mobilidade & Entregas
              </h2>
              <p className="text-[11px] text-zinc-400">
                Tarifas diretas sem intermediários
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <Link to="/conta/mobilidade">
              <Clock className="size-3.5 mr-1 text-primary" />
              Minhas Corridas
            </Link>
          </Button>
        </div>

        {/* ── SELETOR DE MODALIDADES (CARRO / MOTO / FIORINO / MUDANÇA) ── */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Escolha o Serviço
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODALITIES.map((mod) => {
              const Icon = mod.icon;
              const isSelected = selectedService === mod.type;
              return (
                <button
                  key={mod.type}
                  onClick={() => setSelectedService(mod.type)}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-primary/15 border-primary text-white shadow-md ring-1 ring-primary"
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Icon className={`size-4 ${isSelected ? "text-primary" : "text-zinc-400"}`} />
                    {mod.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-primary text-primary-foreground">
                        {mod.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white block leading-tight">{mod.title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
                    {formatMoney(
                      mod.basePrice + Math.round(routeStats.distanceKm * mod.pricePerKm),
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CAMPOS DE ORIGEM & DESTINO COM AUTO-COMPLETE & PIN ── */}
        <div className="space-y-3 pt-2">
          {/* Origem */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                Origem (Partida / Coleta)
              </Label>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUseCurrentLocation}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                  title="Usar GPS"
                >
                  <Navigation className="size-3" />
                  <span>Meu GPS</span>
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  onClick={() => setPinMode("origin")}
                  className={`text-[10px] flex items-center gap-0.5 ${pinMode === "origin" ? "text-primary font-bold" : "text-zinc-400 hover:text-white"}`}
                >
                  <Crosshair className="size-3" />
                  <span>Pin Mapa</span>
                </button>
              </div>
            </div>
            <Input
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              placeholder="Ex: Av. Getúlio Vargas, 500 — Centro"
              className="h-10 rounded-2xl bg-zinc-900 border-zinc-800 text-xs text-white"
            />
          </div>

          {/* Destino */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                Destino (Chegada / Entrega)
              </Label>
              <button
                onClick={() => setPinMode("destination")}
                className={`text-[10px] flex items-center gap-0.5 ${pinMode === "destination" ? "text-primary font-bold" : "text-zinc-400 hover:text-white"}`}
              >
                <Crosshair className="size-3" />
                <span>Pin no Mapa</span>
              </button>
            </div>
            <Input
              value={destinationText}
              onChange={(e) => setDestinationText(e.target.value)}
              placeholder="Ex: Rua Marechal Deodoro ou Shopping..."
              className="h-10 rounded-2xl bg-zinc-900 border-zinc-800 text-xs text-white"
            />
          </div>

          {/* Locais Rápidos / Atalhos Frequentes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_PLACES.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPresetDestination(p)}
                className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-medium text-zinc-300 whitespace-nowrap transition-colors"
              >
                📍 {p.name.split("/")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* ── IDENTIFICAÇÃO COMPLETA DO ENDEREÇO (OPCIONAL/DETALHES) ── */}
        <div className="pt-1">
          <button
            onClick={() => setShowAddressDetails(!showAddressDetails)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-zinc-300 hover:text-white border-t border-zinc-800/60"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              <span>Identificação Completa (Nº, Apto, Contato)</span>
            </span>
            {showAddressDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showAddressDetails && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 mt-2 animate-in fade-in-50">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-zinc-400">Número do Imóvel</Label>
                  <Input
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    placeholder="Ex: 1420"
                    className="h-8 rounded-xl bg-zinc-950 border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-400">Complemento / Apto</Label>
                  <Input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex: Bloco B Apto 302"
                    className="h-8 rounded-xl bg-zinc-950 border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-zinc-400">Ponto de Referência</Label>
                <Input
                  value={referencePoint}
                  onChange={(e) => setReferencePoint(e.target.value)}
                  placeholder="Ex: Em frente à farmácia São João"
                  className="h-8 rounded-xl bg-zinc-950 border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-zinc-400">Quem recebe / Passageiro</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nome da pessoa"
                    className="h-8 rounded-xl bg-zinc-950 border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-400">Telefone / WhatsApp</Label>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="(49) 99999-9999"
                    className="h-8 rounded-xl bg-zinc-950 border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AJUDANTES PARA MUDANÇA (SE MUDANÇA SELECIONADA) ── */}
        {selectedService === "moving_truck" && (
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <span className="text-[10px] font-bold uppercase text-primary tracking-wider block">
              Configurações da Mudança
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-300">Ajudantes de Carga:</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setHelpersCount(num)}
                    className={`size-7 rounded-xl text-xs font-bold transition-colors ${
                      helpersCount === num
                        ? "bg-primary text-primary-foreground"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-xs text-zinc-300">Tipo de Imóvel:</span>
              <select
                value={propertyType}
                onChange={(e: any) => setPropertyType(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 text-xs text-white"
              >
                <option value="ground">Casa Térrea</option>
                <option value="elevator">Apê c/ Elevador</option>
                <option value="stairs">Apê c/ Escadas (+R$ 35)</option>
              </select>
            </div>
          </div>
        )}

        {/* ── FORMA DE PAGAMENTO & PREÇO TOTAL ── */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
              Tarifa Estimada
            </span>
            <span className="font-mono font-black text-xl text-emerald-400">
              {formatMoney(computedPriceCents)}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setPaymentMethod("pix")}
              className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${paymentMethod === "pix" ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white"}`}
              title="Pix Automático"
            >
              <QrCode className="size-3.5" />
              <span>Pix</span>
            </button>
            <button
              onClick={() => setPaymentMethod("card_driver")}
              className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${paymentMethod === "card_driver" ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white"}`}
              title="Maquininha do Motorista"
            >
              <CreditCard className="size-3.5" />
              <span>Cartão</span>
            </button>
            <button
              onClick={() => setPaymentMethod("money")}
              className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${paymentMethod === "money" ? "bg-primary text-primary-foreground" : "text-zinc-400 hover:text-white"}`}
              title="Dinheiro"
            >
              <Banknote className="size-3.5" />
              <span>Dinheiro</span>
            </button>
          </div>
        </div>

        {/* ── BOTÃO DE AÇÃO PRINCIPAL ── */}
        <Button
          onClick={handleSubmitRequest}
          disabled={createMutation.isPending || requestStatus === "searching"}
          className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {createMutation.isPending || requestStatus === "searching" ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Localizando Motorista Próximo...</span>
            </>
          ) : (
            <>
              <Car className="size-5" />
              <span>Confirmar e Chamar {currentModality.title}</span>
            </>
          )}
        </Button>

        {/* ── MODAL / STATUS QUANDO O CHAMADO É CRIADO ── */}
        {requestStatus === "confirmed" && activeRequest && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 space-y-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-400" />
                <span className="text-xs font-bold">Chamado Registrado!</span>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                Código: #{activeRequest.id.slice(0, 6).toUpperCase()}
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-200">
              Despachando para motoristas e transportadores na sua região. Você pode acompanhar o status ao vivo.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                <Link to="/conta/mobilidade">Acompanhar ao Vivo</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRequestStatus("idle");
                  setActiveRequest(null);
                }}
                className="rounded-xl border-emerald-700 text-emerald-300 text-xs font-bold"
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
