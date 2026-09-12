import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Grid,
  Building2,
  Calendar,
  Compass,
  ArrowLeft,
  Share2,
  Bookmark,
  CheckCircle2,
  Plane,
  Sun,
  CloudRain,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  X,
  Maximize2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import { registerClassifiedLead } from "@/services/company-mvp.functions";
import { MapLibreCanvas } from "@/components/mobility/maplibre-canvas";
import { FavoriteButton } from "@/components/common/favorite-button";
import { cn } from "@/lib/utils";
import { TravelBookingDossierModal } from "./travel-booking-dossier-modal";

export interface InstagramTravelViewProps {
  classified: any;
  isOwner?: boolean;
  onOpenBookingModal?: () => void;
  onOpenProposalModal?: () => void;
}

export function InstagramTravelView({
  classified,
  isOwner = false,
  onOpenBookingModal,
  onOpenProposalModal,
}: InstagramTravelViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"grid" | "resort" | "itinerary" | "explore">("grid");
  const [activeStoryModal, setActiveStoryModal] = useState<any | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isBookingDossierOpen, setIsBookingDossierOpen] = useState(false);

  const attrs = classified?.attributes || {};
  const images: string[] =
    (Array.isArray(classified?.images) && classified.images.length > 0 ? classified.images : null) ||
    (Array.isArray(classified?.photos) && classified.photos.length > 0 ? classified.photos : null) ||
    (Array.isArray(classified?.media) && classified.media.length > 0 ? classified.media : null) ||
    [];

  // Dados Canônicos de Viagem & Resort
  const durationText = attrs.duration_text || "5D / 4N";
  const mealPlanText = attrs.meal_plan || "All Incl.";
  const guestsText = attrs.guests_text || "2 Adultos";
  const datesText = attrs.dates_text || "Consulte datas de saída";

  const storyHighlights = attrs.story_highlights && attrs.story_highlights.length > 0
    ? attrs.story_highlights
    : images.length > 0
    ? [
        { id: "h1", title: "Destaque", image: images[0] },
        ...(images[1] ? [{ id: "h2", title: "Detalhes", image: images[1] }] : []),
        ...(images[2] ? [{ id: "h3", title: "Ambientes", image: images[2] }] : []),
      ]
    : [];

  const bioBullets: string[] = attrs.bio_bullets && attrs.bio_bullets.length > 0
    ? attrs.bio_bullets
    : [
        "🌴 All Inclusive: refeições, snacks e bebidas liberadas",
        "✈️ Voo ida e volta com transfer in/out já inclusos",
        "🏖️ Acesso direto à praia, piscina natural e lago ecológico",
        "⭐ Acomodação climatizada com varanda arejada",
      ];

  const flightDetails = attrs.flight_details || {
    price_text: "R$ 1.139+",
    duration_text: "Voo direto ou conexão rápida",
    origin_text: "Saindo das principais capitais",
    destination_iata: "Aeroporto local",
  };

  const weatherForecast = attrs.weather_forecast || [
    { day: "Hoje", temp: "28°", condition: "sun" },
    { day: "Amanhã", temp: "27°", condition: "sun" },
    { day: "Sex", temp: "29°", condition: "sun" },
  ];

  const itineraryDays = attrs.itinerary_days && attrs.itinerary_days.length > 0
    ? attrs.itinerary_days
    : images.length > 0
    ? [
        {
          day_number: 1,
          date: "Dia 1",
          title: "Chegada e Relaxamento",
          description: "Check-in e recepção de boas-vindas.",
          image: images[0],
        },
      ]
    : [];

  const nearbyRecommendations: any[] = Array.isArray(attrs.nearby_recommendations)
    ? attrs.nearby_recommendations
    : [];

  // Cálculo Dinâmico de Parcelas
  const priceCents = classified?.price_cents || 0;
  const maxInstallments = attrs.max_installments || 12;
  const installmentCents = priceCents > 0 ? Math.round(priceCents / maxInstallments) : 0;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title: classified.title,
        text: classified.content?.slice(0, 100),
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  };

  const handleOpenAction = async () => {
    // 1. Gravar lead no banco de forma persistente (Tabela deals)
    if (classified?.id) {
      try {
        registerClassifiedLead({
          data: {
            classifiedId: classified.id,
            proposedPriceCents: priceCents,
            message: `Reserva iniciada via Vitrine/Vitrine Imersiva para "${classified.title}". Valor: ${formatMoney(priceCents)}`,
          },
        }).catch((err) => {
          console.warn("[InstagramTravelView] Aviso ao registrar lead assíncrono:", err);
        });
      } catch (err) {
        // Silencioso
      }
    }

    // 2. Abrir Dossiê Dinâmico de Proposta & Reserva com formulário completo
    setIsBookingDossierOpen(true);
  };

  const handleWhatsAppDirect = async () => {
    if (!classified?.contact_whatsapp) return;
    if (classified.id) {
      try {
        registerClassifiedLead({
          data: {
            classifiedId: classified.id,
            proposedPriceCents: priceCents,
            message: `Contato direto via WhatsApp no Vitrine Imersiva para "${classified.title}"`,
          },
        }).catch(() => {});
      } catch {}
    }
    await trackAndOpenWhatsApp({
      phone: classified.contact_whatsapp,
      entityType: "classified",
      entityId: classified.id,
      entityTitle: classified.title,
      customMessage: `Olá! Vi o anúncio "${classified.title}" no Waesy (${maxInstallments}x de ${formatMoney(installmentCents)}) e gostaria de mais informações!`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans select-none">
      {/* ── Top Bar Fixo de Navegação ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/40 px-3 py-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ to: "/classificados" })}
          className="p-2 -ml-1 text-foreground hover:bg-muted rounded-full transition-colors active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm tracking-tight text-foreground truncate max-w-[200px] sm:max-w-[300px]">
            {classified?.title || "Pacote Turístico"}
          </span>
          <span className="size-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-foreground hover:bg-muted rounded-full transition-colors active:scale-95"
            aria-label="Compartilhar"
          >
            <Share2 className="size-4.5" />
          </button>
          <FavoriteButton
            entityId={classified.id}
            entityType="classified"
            title={classified.title}
            className="size-9"
          />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* ── Perfil do Resort / Anunciante (Header Editorial) ── */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Avatar Circular com Story Ring Gradiente */}
          <div className="relative shrink-0">
            <div className="size-20 sm:size-22 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
              <img
                src={images[0]}
                alt={classified.title}
                className="size-full rounded-full object-cover border-2 border-background"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-5.5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs border-2 border-background">
              <CheckCircle2 className="size-3.5 fill-white text-blue-500" />
            </div>
          </div>

          {/* Estatísticas em 3 Colunas Canônicas */}
          <div className="flex-1 grid grid-cols-3 gap-1 text-center divide-x divide-border/30">
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                {durationText}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Duração</span>
            </div>

            <div className="flex flex-col pl-1">
              <span className="font-display font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                {mealPlanText}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Regime</span>
            </div>

            <div className="flex flex-col pl-1">
              <span className="font-display font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                {guestsText}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">Hóspedes</span>
            </div>
          </div>
        </div>

        {/* ── Título, Subtítulo & Bullets com Emojis ── */}
        <div className="space-y-2">
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg text-foreground tracking-tight leading-snug">
              {classified.title}
            </h1>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
              <span>{classified.location_name || "Brasil"}</span>
              <span>•</span>
              <span className="text-foreground/80">{datesText}</span>
            </p>
          </div>

          <div className="space-y-1 pt-1 text-xs text-foreground/90 leading-relaxed">
            {bioBullets.map((bullet, idx) => (
              <p key={idx} className="flex items-start gap-1.5">
                <span>{bullet}</span>
              </p>
            ))}
          </div>
        </div>

        {/* ── Botões de Ação Direta ── */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleOpenAction}
            className="flex-1 h-11 rounded-full bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-xs active:scale-[0.98] transition-all"
          >
            Reservar Agora
          </Button>

          <Button
            variant="outline"
            onClick={() => setActiveTab("explore")}
            className="flex-1 h-11 rounded-full border-border/80 text-foreground font-semibold text-xs hover:bg-muted active:scale-[0.98] transition-all"
          >
            Detalhes do Voo
          </Button>
        </div>

        {/* ── Destaques de Stories Circulares (Story Highlights) ── */}
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2 -mx-1 px-1">
          {storyHighlights.map((hl: any, index: number) => (
            <button
              key={hl.id || index}
              type="button"
              onClick={() => setActiveStoryModal(hl)}
              className="flex flex-col items-center gap-1.5 shrink-0 group active:scale-95 transition-all"
            >
              <div className="size-15 sm:size-16 rounded-full p-[2px] bg-border hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 transition-all">
                <img
                  src={hl.image || images[0]}
                  alt={hl.title}
                  className="size-full rounded-full object-cover border border-background"
                />
              </div>
              <span className="text-[11px] font-medium text-foreground tracking-tight max-w-[64px] truncate">
                {hl.title}
              </span>
            </button>
          ))}
        </div>

        {/* ── 4 Abas Canônicas (Grid, Resort, Itinerário, Explore) ── */}
        <div className="border-t border-border/40 pt-1">
          <div className="grid grid-cols-4 border-b border-border/40">
            <button
              type="button"
              onClick={() => setActiveTab("grid")}
              className={cn(
                "py-3 flex items-center justify-center border-b-2 transition-colors",
                activeTab === "grid"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-label="Galeria de Fotos"
            >
              <Grid className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("resort")}
              className={cn(
                "py-3 flex items-center justify-center border-b-2 transition-colors",
                activeTab === "resort"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-label="Detalhes da Estrutura"
            >
              <Building2 className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("itinerary")}
              className={cn(
                "py-3 flex items-center justify-center border-b-2 transition-colors",
                activeTab === "itinerary"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-label="Roteiro Dia a Dia"
            >
              <Calendar className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={cn(
                "py-3 flex items-center justify-center border-b-2 transition-colors",
                activeTab === "explore"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-label="Explore Voos e Mapa"
            >
              <Compass className="size-5" />
            </button>
          </div>

          {/* ── Conteúdo da Aba 1: Grid 3x3 de Fotos ── */}
          {activeTab === "grid" && (
            <div className="pt-3">
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFullscreenImage(img)}
                    className="relative aspect-square bg-muted overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={img}
                      alt={`Foto ${i + 1}`}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="size-4 text-white drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Conteúdo da Aba 2: Resort / Dossiê ── */}
          {activeTab === "resort" && (
            <div className="pt-4 space-y-4">
              {/* Tags de Destaque */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="rounded-lg text-xs font-medium px-2.5 py-1">
                  🌿 Eco-friendly
                </Badge>
                <Badge variant="secondary" className="rounded-lg text-xs font-medium px-2.5 py-1">
                  🏖️ Pé na Areia
                </Badge>
                <Badge variant="secondary" className="rounded-lg text-xs font-medium px-2.5 py-1">
                  🍹 Pensão Completa
                </Badge>
              </div>

              {/* Card de Parcelamento Comercial */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    Condição Exclusiva
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    Melhor Tarifa
                  </Badge>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground tracking-tight font-display">
                    {maxInstallments}x {formatMoney(installmentCents)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">sem juros</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Valor total à vista: <strong className="text-foreground">{formatMoney(priceCents)}</strong> para {guestsText}
                </p>
              </div>

              {/* Descrição Completa */}
              <div className="space-y-1.5 text-xs text-foreground/80 leading-relaxed bg-muted/20 p-4 rounded-2xl border border-border/30">
                <h3 className="font-bold text-foreground text-sm">Sobre esta experiência</h3>
                <p className="whitespace-pre-line">{classified.content}</p>
              </div>
            </div>
          )}

          {/* ── Conteúdo da Aba 3: Itinerário Timeline Dia a Dia ── */}
          {activeTab === "itinerary" && (
            <div className="pt-4 space-y-6">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border">
                {itineraryDays.map((item: any, idx: number) => (
                  <div key={idx} className="relative space-y-2">
                    {/* Marcador Numérico */}
                    <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-background border-2 border-foreground flex items-center justify-center text-[10px] font-bold text-foreground">
                      {item.day_number || idx + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                          {item.date}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>

                      {item.image && (
                        <div className="pt-1.5">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-36 object-cover rounded-xl border border-border/40"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recomendações Próximas */}
              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">
                    Recomendações Próximas
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Curadoria selecionada para além do All Inclusive
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nearbyRecommendations.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors"
                    >
                      <img
                        src={rec.image || images[0]}
                        alt={rec.title}
                        className="size-16 rounded-xl object-cover shrink-0 border border-border/30"
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-foreground truncate">{rec.title}</h4>
                          <span className="text-[11px] font-bold text-amber-500 shrink-0">
                            ★ {rec.rating || "4.8"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{rec.category}</p>
                        <p className="text-[10px] text-foreground/70 flex items-center gap-1 pt-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span>{rec.distance}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Conteúdo da Aba 4: Explore (Voos, Clima & Mapa) ── */}
          {activeTab === "explore" && (
            <div className="pt-4 space-y-4">
              {/* Card de Voo */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-foreground text-background flex items-center justify-center">
                      <Plane className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Como chegar</h4>
                      <p className="text-[11px] text-muted-foreground">{flightDetails.duration_text}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-foreground font-display">
                    {flightDetails.price_text}
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  {flightDetails.origin_text}
                </p>
              </div>

              {/* Previsão do Clima */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Sun className="size-4 text-amber-500" />
                    <span>Clima Previsto</span>
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-medium">Médias Históricas</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {weatherForecast.map((w: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-background border border-border/30">
                      <span className="text-[10.5px] text-muted-foreground block">{w.day}</span>
                      <span className="font-extrabold text-sm text-foreground my-0.5 block">{w.temp}</span>
                      <div className="flex justify-center">
                        {w.condition === "rain" ? (
                          <CloudRain className="size-4 text-blue-400" />
                        ) : (
                          <Sun className="size-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapa Interativo MapLibre Canvas */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" />
                  <span>Localização no Mapa</span>
                </h4>
                <div className="h-56 w-full rounded-2xl overflow-hidden border border-border/40 relative">
                  <MapLibreCanvas
                    center={[
                      classified.location_lng || -39.0287,
                      classified.location_lat || -14.7891,
                    ]}
                    zoom={13}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Barra Inferior Flutuante Fixa (Sticky Thumb Zone Bar) ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 p-3 max-w-xl mx-auto flex items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {maxInstallments}x
            </span>
            <span className="text-base sm:text-lg font-black text-foreground tracking-tight font-display truncate">
              {formatMoney(installmentCents)}
            </span>
          </div>
          <span className="text-[10.5px] text-muted-foreground truncate">
            Total: {formatMoney(priceCents)} ({guestsText})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {classified?.contact_whatsapp && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleWhatsAppDirect}
              className="size-11 rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all shrink-0"
              title="Falar no WhatsApp"
            >
              <MessageCircle className="size-5" />
            </Button>
          )}

          <Button
            onClick={handleOpenAction}
            className="h-11 px-5 sm:px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 font-extrabold text-xs tracking-tight shadow-md active:scale-95 transition-all shrink-0"
          >
            Reservar Pacote
          </Button>
        </div>
      </div>

      {/* ── Modal de Story Individual ── */}
      {activeStoryModal && (
        <Dialog open={!!activeStoryModal} onOpenChange={() => setActiveStoryModal(null)}>
          <DialogContent className="max-w-sm p-4 rounded-2xl bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">
                {activeStoryModal.title}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-2">
              <img
                src={activeStoryModal.image || images[0]}
                alt={activeStoryModal.title}
                className="w-full h-80 object-cover rounded-xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Modal de Imagem em Tela Cheia ── */}
      {fullscreenImage && (
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="max-w-2xl p-2 bg-black/95 border-none">
            <img
              src={fullscreenImage}
              alt="Ampliação"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* ── Modal de Dossiê Dinâmico de Viagem & Proposta Oficial ── */}
      <TravelBookingDossierModal
        open={isBookingDossierOpen}
        onOpenChange={setIsBookingDossierOpen}
        classified={classified}
      />
    </div>
  );
}
