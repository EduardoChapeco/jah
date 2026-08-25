import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Tag,
  Car,
  Home as HomeIcon,
  Briefcase,
  Wrench,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Eye,
  Edit3,
  ImagePlus,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Check,
  Loader2,
  Phone,
  FileText,
  DollarSign,
  Layers,
  ChevronLeft,
  Building,
  Key,
  Truck,
  Package,
  CreditCard,
  QrCode,
  RefreshCw,
  Banknote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/money";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploader } from "@/components/ui/media-uploader";
import { ChoiceCard } from "@/components/ui/choice-card";
import { SquircleCard } from "@/components/ui/squircle-card";
import { CityCombobox, type StructuredLocationValue } from "@/components/ui/city-combobox";
import { upsertClassified } from "@/services/classifieds.functions";
import { z } from "zod";

const ClassifiedSearchSchema = z.object({
  tipo: z.string().optional(),
});

export const Route = createFileRoute("/_store/conta/classificados/novo")({
  validateSearch: ClassifiedSearchSchema,
  head: () => ({ meta: [{ title: "Criar Classificado — Wider" }] }),
  component: NovoClassificadoPage,
});

// ─── 1. Taxonomia Canônica de Tipos ──────────────────────────────────────────
export type ClassifiedNicheType = "imovel" | "desapego" | "veiculo" | "servico" | "vaga";

interface NicheDefinition {
  id: ClassifiedNicheType;
  canonicalCategory: "sale" | "vehicle" | "real_estate" | "service" | "job";
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  badge: string;
  gradient: string;
}

const NICHE_CARDS: NicheDefinition[] = [
  {
    id: "imovel",
    canonicalCategory: "real_estate",
    title: "Imóvel",
    subtitle: "Habitação, Locação & Comercial",
    description:
      "Casas, apartamentos, salas comerciais, terrenos, temporada e locação residencial.",
    icon: HomeIcon,
    badge: "Alta Procura",
    gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
  },
  {
    id: "desapego",
    canonicalCategory: "sale",
    title: "Desapego & Itens Gerais",
    subtitle: "Bens Pessoais & Usados",
    description: "Eletrônicos, instrumentos musicais, móveis, moda, itens seminovos e desapegos.",
    icon: Tag,
    badge: "P2P Direto",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  {
    id: "veiculo",
    canonicalCategory: "vehicle",
    title: "Veículo",
    subtitle: "Automotivo & Náutico",
    description: "Carros de passeio, motocicletas, caminhões, utilitários e veículos comerciais.",
    icon: Car,
    badge: "Ficha Técnica",
    gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
  },
  {
    id: "servico",
    canonicalCategory: "service",
    title: "Serviço Profissional",
    subtitle: "Autônomos & Especialistas",
    description: "Trabalhos técnicos, consultorias, serviços domésticos, manutenção e freelancers.",
    icon: Wrench,
    badge: "Agendável",
    gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
  },
  {
    id: "vaga",
    canonicalCategory: "job",
    title: "Oportunidade / Vaga",
    subtitle: "Contratação & Carreiras",
    description:
      "Vagas de emprego, parcerias, estágios e oportunidades profissionais para a comunidade.",
    icon: Briefcase,
    badge: "Talentos",
    gradient: "from-rose-500/10 via-red-500/5 to-transparent",
  },
];

function NovoClassificadoPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const selectedType = search?.tipo as ClassifiedNicheType | undefined;

  const activeNiche = useMemo(() => {
    return NICHE_CARDS.find((n) => n.id === selectedType);
  }, [selectedType]);

  // Se nenhum tipo estiver selecionado, renderiza a Camada 2 (CreateTypePicker Full-Page)
  if (!activeNiche) {
    return (
      <CreateTypePicker
        onSelect={(typeId) =>
          navigate({ to: "/conta/classificados/novo", search: { tipo: typeId } })
        }
      />
    );
  }

  // Se um tipo estiver selecionado, renderiza a Camada 3 (Specialized Editor + Live Truthful Preview)
  return (
    <SpecializedClassifiedEditor
      niche={activeNiche}
      onBack={() => navigate({ to: "/conta/classificados/novo", search: {} })}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMADA 2: CreateTypePicker (Full-Page 16:9 Vertical Stack)
// ─────────────────────────────────────────────────────────────────────────────
function CreateTypePicker({ onSelect }: { onSelect: (typeId: ClassifiedNicheType) => void }) {
  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 space-y-6">
      {/* Header Discreto */}
      <div className="space-y-1.5 text-center md:text-left">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          O que você quer anunciar?
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Escolha uma categoria para abrir o editor especializado com ferramentas dedicadas.
        </p>
      </div>

      {/* Stack Vertical de Cards 16:9 Confortáveis */}
      <div className="space-y-3.5">
        {NICHE_CARDS.map((niche) => {
          const Icon = niche.icon;
          return (
            <button
              key={niche.id}
              onClick={() => onSelect(niche.id)}
              className="w-full text-left group relative  hover:border-primary/50 bg-card hover:bg-card/80 rounded-2xl p-5 md:p-6 transition-all duration-200  hover: cursor-pointer overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Background gradient sutil */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${niche.gradient} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              <div className="relative z-10 flex items-start sm:items-center gap-4 flex-1">
                <div className="size-12 md:size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="size-6 md:size-7" />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {niche.title}
                    </h2>
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {niche.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/80 font-medium">{niche.subtitle}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {niche.description}
                  </p>
                </div>
              </div>

              <div className="relative z-10 hidden sm:flex items-center justify-center size-9 rounded-full bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <ChevronRight className="size-5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMADA 3: Specialized Editor + Live Truthful Preview
// ─────────────────────────────────────────────────────────────────────────────
function SpecializedClassifiedEditor({
  niche,
  onBack,
}: {
  niche: NicheDefinition;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Common Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number | undefined>(undefined);
  const [negotiable, setNegotiable] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [structuredLoc, setStructuredLoc] = useState<StructuredLocationValue | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [activePreviewImage, setActivePreviewImage] = useState(0);

  // Specialized: Imóvel
  const [reDealType, setReDealType] = useState<"aluguel" | "venda" | "temporada">("aluguel");
  const [rePropertyType, setRePropertyType] = useState("Apartamento");
  const [reAreaSqm, setReAreaSqm] = useState("");
  const [reBedrooms, setReBedrooms] = useState("2");
  const [reSuites, setReSuites] = useState("1");
  const [reBathrooms, setReBathrooms] = useState("2");
  const [reParking, setReParking] = useState("1");
  const [reCondoCents, setReCondoCents] = useState<number | undefined>(undefined);
  const [reIptuCents, setReIptuCents] = useState<number | undefined>(undefined);
  const [reFurnished, setReFurnished] = useState("Semi-mobiliado");
  const [reAmenities, setReAmenities] = useState<string[]>([]);

  // Specialized: Veículo
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleVersion, setVehicleVersion] = useState("");
  const [vehicleYearFab, setVehicleYearFab] = useState("");
  const [vehicleYearModel, setVehicleYearModel] = useState("");
  const [vehicleKm, setVehicleKm] = useState("");
  const [vehicleFuel, setVehicleFuel] = useState("Flex");
  const [vehicleTransmission, setVehicleTransmission] = useState("Automático");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleFeatures, setVehicleFeatures] = useState<string[]>([]);

  // Specialized: Desapego & Itens Gerais
  const [itemCondition, setItemCondition] = useState<
    "novo" | "usado_excelente" | "usado_bom" | "com_marcas"
  >("usado_excelente");
  const [itemWarranty, setItemWarranty] = useState("");

  // Specialized: Logística Avançada & Formas de Pagamento
  const [deliveryMode, setDeliveryMode] = useState<"both" | "pickup" | "local_delivery" | "shipping">("both");
  const [acceptsPix, setAcceptsPix] = useState(true);
  const [acceptsCard, setAcceptsCard] = useState(true);
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsTrade, setAcceptsTrade] = useState(false);
  const [maxInstallments, setMaxInstallments] = useState("12");
  const [freeShippingLocal, setFreeShippingLocal] = useState(false);

  // Specialized: Serviço
  const [serviceModality, setServiceModality] = useState<"presencial" | "remoto" | "domicilio">(
    "presencial",
  );
  const [serviceArea, setServiceArea] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePricingType, setServicePricingType] = useState<"fixo" | "por_hora" | "a_combinar">(
    "fixo",
  );

  // Specialized: Vaga
  const [jobRole, setJobRole] = useState("");
  const [jobModel, setJobModel] = useState<"presencial" | "hibrido" | "remoto">("presencial");
  const [jobRegime, setJobRegime] = useState<"CLT" | "PJ" | "Estágio" | "Freelancer">("CLT");
  const [jobSalaryRange, setJobSalaryRange] = useState("");

  const toggleItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handlePublish = async () => {
    if (!title.trim() || title.length < 3) {
      toast.error("O título do anúncio deve ter pelo menos 3 caracteres.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast.error("A descrição do anúncio deve ter pelo menos 10 caracteres.");
      return;
    }
    if (isUploadingMedia) {
      toast.error("Aguarde o término do envio das fotos antes de publicar.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Monta os atributos dinâmicos específicos da categoria
      const attributes: Record<string, any> = {
        niche: niche.id,
        city: structuredLoc?.city || undefined,
        state: structuredLoc?.state || undefined,
        neighborhood: structuredLoc?.neighborhood || undefined,
        delivery_mode: deliveryMode,
        accepts_pix: acceptsPix,
        accepts_card: acceptsCard,
        accepts_cash: acceptsCash,
        accepts_trade: acceptsTrade,
        max_installments: acceptsCard ? parseInt(maxInstallments) || 12 : 1,
        free_shipping_local: freeShippingLocal,
      };

      if (niche.id === "imovel") {
        attributes.deal_type = reDealType;
        attributes.property_type = rePropertyType;
        attributes.area_sqm = reAreaSqm;
        attributes.bedrooms = reBedrooms;
        attributes.suites = reSuites;
        attributes.bathrooms = reBathrooms;
        attributes.parking_spots = reParking;
        attributes.condo_cents = reCondoCents ?? null;
        attributes.iptu_cents = reIptuCents ?? null;
        attributes.furnished = reFurnished;
        attributes.amenities = reAmenities;
      } else if (niche.id === "veiculo") {
        attributes.brand = vehicleBrand;
        attributes.model = vehicleModel;
        attributes.version = vehicleVersion;
        attributes.year_fab = vehicleYearFab;
        attributes.year_model = vehicleYearModel;
        attributes.mileage_km = vehicleKm;
        attributes.fuel_type = vehicleFuel;
        attributes.transmission = vehicleTransmission;
        attributes.color = vehicleColor;
        attributes.features = vehicleFeatures;
      } else if (niche.id === "desapego") {
        attributes.condition = itemCondition;
        attributes.warranty = itemWarranty;
      } else if (niche.id === "servico") {
        attributes.modality = serviceModality;
        attributes.service_area = serviceArea;
        attributes.estimated_duration = serviceDuration;
        attributes.pricing_type = servicePricingType;
      } else if (niche.id === "vaga") {
        attributes.role = jobRole;
        attributes.work_model = jobModel;
        attributes.regime = jobRegime;
        attributes.salary_range = jobSalaryRange;
      }

      const res = await upsertClassified({
        data: {
          category: niche.canonicalCategory,
          title: title.trim(),
          content: description.trim(),
          price_cents: priceCents ?? null,
          negotiable,
          whatsapp: whatsapp.trim() || undefined,
          contact_whatsapp: whatsapp.trim() || undefined,
          location_name: locationName.trim() || undefined,
          images: images,
          attributes,
          status: "active",
        },
      });

      toast.success("Anúncio publicado com sucesso!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classifieds-master-list"] }),
        queryClient.invalidateQueries({ queryKey: ["classifieds"] }),
      ]).catch(() => null);
      navigate({ to: "/classificados/$id", params: { id: res.id } });
    } catch (err: any) {
      console.error("Erro ao publicar classificado:", err);
      toast.error(err?.message || "Erro ao publicar anúncio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedPriceCents = priceCents ?? null;

  return (
    <div className="space-y-4">
      {/* ── Topbar Operacional Compacta ──────────────────────────── */}
      <div className="flex items-center justify-between  pb-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="rounded-xl text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Trocar Categoria</span>
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-muted-foreground text-xs">/</span>
            <Badge variant="outline" className="text-xs font-semibold gap-1.5">
              <niche.icon className="size-3.5 text-primary" />
              <span>{niche.title}</span>
            </Badge>
          </div>
        </div>

        {/* Mobile Switcher & Publicar Action */}
        <div className="flex items-center gap-2">
          {/* Mobile Edit/Preview Tabs */}
          <div className="flex md:hidden bg-muted p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMobileTab("edit")}
              className={`px-3 py-1 rounded-md transition-colors ${mobileTab === "edit" ? "bg-card text-foreground  font-bold" : "text-muted-foreground"}`}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1 rounded-md transition-colors ${mobileTab === "preview" ? "bg-card text-foreground  font-bold" : "text-muted-foreground"}`}
            >
              Prévia ({images.length})
            </button>
          </div>

          <Button
            onClick={handlePublish}
            disabled={isSubmitting || isUploadingMedia}
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground  h-9 px-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Check className="size-4" />
                <span>Publicar Anúncio</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Grid Principal: Editor (42%) + Truthful Preview (58%) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Formulário Especializado com Scroll Dedicado */}
        <aside
          className={`md:col-span-5 space-y-6 ${mobileTab === "edit" ? "block" : "hidden md:block"} max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 scrollbar-none`}
        >
          {/* Section 1: Informações Fundamentais */}
          <div className=" bg-card rounded-2xl p-5 space-y-4 ">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <FileText className="size-4 text-primary" />
              <span>1. Informações do Anúncio</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-foreground font-medium">Título do Anúncio *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  niche.id === "imovel"
                    ? "Ex: Apartamento 2 Quartos no Centro com Garagem"
                    : niche.id === "veiculo"
                      ? "Ex: Honda Civic 2.0 EXL Automático 2021"
                      : "Ex: Título descritivo do item..."
                }
                className="h-10 rounded-xl text-xs bg-background font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-foreground font-medium">Descrição Completa *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva todos os detalhes, histórico, diferenciais e informações importantes..."
                className="rounded-xl text-xs bg-background resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-medium">Valor (R$)</Label>
                <CurrencyField
                  value={priceCents}
                  onChange={setPriceCents}
                  placeholder="0,00"
                  className="h-10 rounded-xl text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium block">&nbsp;</Label>
                <div
                  className="flex items-center gap-2.5 h-10 px-3 rounded-xl  bg-background/60 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setNegotiable(!negotiable)}
                >
                  <Checkbox
                    id="neg-check"
                    checked={negotiable}
                    onCheckedChange={(c) => setNegotiable(!!c)}
                  />
                  <Label
                    htmlFor="neg-check"
                    className="text-xs text-foreground cursor-pointer font-medium select-none"
                  >
                    Aceita Propostas
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Logística de Entrega & Formas de Pagamento */}
          <div className=" bg-card rounded-2xl p-5 space-y-4 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Truck className="size-4 text-primary" />
                <span>Logística de Entrega & Pagamento</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                Wider Logística
              </Badge>
            </div>

            {/* Modalidade de Entrega */}
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground font-medium">Modalidade de Envio / Retirada</Label>
              <Select value={deliveryMode} onValueChange={(v: any) => setDeliveryMode(v)}>
                <SelectTrigger className="h-10 rounded-xl text-xs bg-background font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">📦 Entrega Expressa JAH & Retirada em Mãos (Recomendado)</SelectItem>
                  <SelectItem value="pickup">🏠 Somente Retirada no Local</SelectItem>
                  <SelectItem value="local_delivery">🛵 Somente Entrega Local (Motoboy / Frota)</SelectItem>
                  <SelectItem value="shipping">🚚 Envio Nacional (Correios / Transportadora)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Formas de Pagamento Aceitas */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs text-foreground font-medium">Formas de Pagamento Aceitas</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    acceptsPix ? "border-primary/50 bg-primary/5 text-foreground" : "border-border/80 bg-background/50 text-muted-foreground"
                  }`}
                  onClick={() => setAcceptsPix(!acceptsPix)}
                >
                  <Checkbox checked={acceptsPix} onCheckedChange={(c) => setAcceptsPix(!!c)} />
                  <div className="flex items-center gap-1.5 text-xs font-medium select-none">
                    <QrCode className="size-3.5 text-primary" />
                    <span>PIX Direto</span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    acceptsCard ? "border-primary/50 bg-primary/5 text-foreground" : "border-border/80 bg-background/50 text-muted-foreground"
                  }`}
                  onClick={() => setAcceptsCard(!acceptsCard)}
                >
                  <Checkbox checked={acceptsCard} onCheckedChange={(c) => setAcceptsCard(!!c)} />
                  <div className="flex items-center gap-1.5 text-xs font-medium select-none">
                    <CreditCard className="size-3.5 text-primary" />
                    <span>Cartão</span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    acceptsTrade ? "border-primary/50 bg-primary/5 text-foreground" : "border-border/80 bg-background/50 text-muted-foreground"
                  }`}
                  onClick={() => setAcceptsTrade(!acceptsTrade)}
                >
                  <Checkbox checked={acceptsTrade} onCheckedChange={(c) => setAcceptsTrade(!!c)} />
                  <div className="flex items-center gap-1.5 text-xs font-medium select-none">
                    <RefreshCw className="size-3.5 text-primary" />
                    <span>Aceita Troca</span>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    acceptsCash ? "border-primary/50 bg-primary/5 text-foreground" : "border-border/80 bg-background/50 text-muted-foreground"
                  }`}
                  onClick={() => setAcceptsCash(!acceptsCash)}
                >
                  <Checkbox checked={acceptsCash} onCheckedChange={(c) => setAcceptsCash(!!c)} />
                  <div className="flex items-center gap-1.5 text-xs font-medium select-none">
                    <Banknote className="size-3.5 text-primary" />
                    <span>Dinheiro</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcelamento se aceitar cartão */}
            {acceptsCard && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground font-medium">Parcelamento Máximo</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">Em até {maxInstallments}x</span>
                </div>
                <Select value={maxInstallments} onValueChange={setMaxInstallments}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x (À Vista)</SelectItem>
                    <SelectItem value="3">Até 3x</SelectItem>
                    <SelectItem value="6">Até 6x</SelectItem>
                    <SelectItem value="10">Até 10x</SelectItem>
                    <SelectItem value="12">Até 12x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Section 2: Campos Especializados do Domínio */}
          {niche.id === "imovel" && (
            <div className=" bg-card rounded-2xl p-5 space-y-4 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <HomeIcon className="size-4 text-primary" />
                <span>2. Ficha Técnica do Imóvel</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Operação</Label>
                  <Select value={reDealType} onValueChange={(v: any) => setReDealType(v)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aluguel">Aluguel Mensal</SelectItem>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="temporada">Temporada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Tipo de Imóvel</Label>
                  <Input
                    value={rePropertyType}
                    onChange={(e) => setRePropertyType(e.target.value)}
                    placeholder="Apartamento, Casa, etc."
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Área Útil (m²)</Label>
                  <Input
                    value={reAreaSqm}
                    onChange={(e) => setReAreaSqm(e.target.value)}
                    placeholder="75"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Quartos</Label>
                  <Input
                    value={reBedrooms}
                    onChange={(e) => setReBedrooms(e.target.value)}
                    placeholder="2"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Vagas Garagem</Label>
                  <Input
                    value={reParking}
                    onChange={(e) => setReParking(e.target.value)}
                    placeholder="1"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Condomínio (R$)</Label>
                  <CurrencyField
                    value={reCondoCents}
                    onChange={setReCondoCents}
                    placeholder="0,00"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">IPTU Mensal (R$)</Label>
                  <CurrencyField
                    value={reIptuCents}
                    onChange={setReIptuCents}
                    placeholder="0,00"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {niche.id === "veiculo" && (
            <div className=" bg-card rounded-2xl p-5 space-y-4 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Car className="size-4 text-primary" />
                <span>2. Ficha Técnica do Veículo</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Marca *</Label>
                  <Input
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    placeholder="Ex: Honda, Toyota, VW"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Modelo *</Label>
                  <Input
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Ex: Civic, Corolla, Golf"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Ano Fab.</Label>
                  <Input
                    value={vehicleYearFab}
                    onChange={(e) => setVehicleYearFab(e.target.value)}
                    placeholder="2021"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Ano Mod.</Label>
                  <Input
                    value={vehicleYearModel}
                    onChange={(e) => setVehicleYearModel(e.target.value)}
                    placeholder="2022"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Km Atual</Label>
                  <Input
                    value={vehicleKm}
                    onChange={(e) => setVehicleKm(e.target.value)}
                    placeholder="45.000"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Câmbio</Label>
                  <Select value={vehicleTransmission} onValueChange={setVehicleTransmission}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automático">Automático</SelectItem>
                      <SelectItem value="CVT">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Combustível</Label>
                  <Select value={vehicleFuel} onValueChange={setVehicleFuel}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flex">Flex (Álcool/Gasolina)</SelectItem>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                      <SelectItem value="Elétrico">Elétrico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Fotos & Mídias com Upload Seguro */}
          <div className=" bg-card rounded-2xl p-5 space-y-3 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <ImagePlus className="size-4 text-primary" />
                <span>3. Galeria de Fotos e Vídeos</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {images.length} adicionada(s)
              </span>
            </div>

            <MediaUploader
              value={images}
              onChange={setImages}
              onUploadingStateChange={setIsUploadingMedia}
              bucket="post-media"
              folder="classifieds"
              aspect={4 / 3}
              enableCrop={true}
              maxFiles={8}
            />
          </div>

          {/* Section 4: Localização Padronizada & WhatsApp */}
          <div className=" bg-card rounded-2xl p-5 space-y-4 ">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <MapPin className="size-4 text-primary" />
              <span>4. Localização & Contato</span>
            </div>

            <CityCombobox
              value={locationName}
              onChange={(formatted, struct) => {
                setLocationName(formatted);
                if (struct) setStructuredLoc(struct);
              }}
              label="Bairro e Cidade do Anúncio *"
            />

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs text-foreground font-medium">
                WhatsApp para Contato Direto
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(49) 99999-9999"
                  className="pl-8 h-10 rounded-xl text-xs bg-background font-mono"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Painel Direito: Live Truthful Preview (Mobg Style Fiel) */}
        <main
          className={`md:col-span-7 ${mobileTab === "preview" ? "block" : "hidden md:block"} sticky top-20`}
        >
          <div className=" bg-card rounded-2xl overflow-hidden ">
            {/* Header da Prévia */}
            <div className="bg-muted/50 px-4 py-2.5  flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-foreground">
                <Eye className="size-3.5 text-primary" />
                Prévia Fiel em Tempo Real
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Mobg Layout
              </Badge>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* Galeria de Fotos da Prévia */}
              <div className="space-y-2">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/60  flex items-center justify-center">
                  {images.length > 0 ? (
                    <img
                      src={images[activePreviewImage] || images[0]}
                      alt="Prévia"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-6 text-center">
                      <ImagePlus className="size-10 stroke-[1.5]" />
                      <p className="text-xs">
                        Adicione fotos no editor para visualizar a galeria pública
                      </p>
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePreviewImage(idx)}
                        className={`size-14 rounded-lg overflow-hidden border shrink-0 transition-all ${
                          activePreviewImage === idx
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border opacity-70"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumb ${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações Principais */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs font-semibold">
                    {niche.title}
                  </Badge>
                  {locationName && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      {locationName}
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                  {title || "Título do Anúncio aparecerá aqui..."}
                </h1>

                <div className="space-y-1 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary font-mono">
                      {parsedPriceCents ? formatMoney(parsedPriceCents) : "A Combinar"}
                    </span>
                    {negotiable && (
                      <Badge variant="secondary" className="text-[10px]">
                        Aceita Propostas
                      </Badge>
                    )}
                  </div>

                  {parsedPriceCents && acceptsCard && parseInt(maxInstallments) > 1 && (
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <CreditCard className="size-3 text-primary" />
                      <span>
                        ou em até <strong>{maxInstallments}x de {formatMoney(Math.round(parsedPriceCents / (parseInt(maxInstallments) || 1)))}</strong>
                      </span>
                    </p>
                  )}
                </div>

                {/* Badges de Formas de Pagamento e Entrega */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {deliveryMode === "both" && (
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <Truck className="size-3 text-primary" />
                      <span>Retirada & Entrega Local</span>
                    </Badge>
                  )}
                  {deliveryMode === "local_delivery" && (
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <Truck className="size-3 text-primary" />
                      <span>Entrega Wider Express</span>
                    </Badge>
                  )}
                  {deliveryMode === "pickup" && (
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <Package className="size-3 text-primary" />
                      <span>Somente Retirada</span>
                    </Badge>
                  )}
                  {deliveryMode === "shipping" && (
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <Truck className="size-3 text-primary" />
                      <span>Envio Nacional</span>
                    </Badge>
                  )}
                  {acceptsPix && (
                    <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                      <QrCode className="size-3 text-emerald-600" />
                      <span>PIX</span>
                    </Badge>
                  )}
                  {acceptsTrade && (
                    <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                      <RefreshCw className="size-3 text-amber-600" />
                      <span>Aceita Troca</span>
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap pt-2 ">
                  {description ||
                    "A descrição detalhada do anúncio aparecerá aqui conforme você digita no formulário à esquerda..."}
                </p>
              </div>

              {/* Simulador de Frete & Logística JAH Express na Prévia */}
              {(deliveryMode === "both" || deliveryMode === "local_delivery" || deliveryMode === "shipping") && (
                <div className="border border-primary/30 rounded-2xl p-4 bg-primary/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Truck className="size-4 text-primary" />
                      <span>Simulação de Frete & Entrega (Comprador)</span>
                    </div>
                    <Badge variant="default" className="text-[9px] font-mono bg-primary text-primary-foreground">
                      JAH Express
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-background ">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Truck className="size-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-foreground">Entrega Expressa Motoboy</p>
                          <p className="text-[10px] text-muted-foreground">Chega hoje em até 2 horas</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-primary font-mono">
                        {freeShippingLocal ? "Grátis" : "R$ 12,00"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-background ">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-foreground">
                          <Package className="size-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-foreground">Ponto PUDO / Locker Wider</p>
                          <p className="text-[10px] text-muted-foreground">Retire no ponto credenciado</p>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-foreground font-mono">
                        R$ 5,00
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ficha Técnica na Prévia */}
              {niche.id === "imovel" && (
                <div className=" rounded-xl p-4 bg-muted/20 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Especificações do Imóvel
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Finalidade</span>
                      <span className="font-semibold capitalize">{reDealType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Área</span>
                      <span className="font-semibold font-mono">
                        {reAreaSqm ? `${reAreaSqm} m²` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Quartos</span>
                      <span className="font-semibold font-mono">{reBedrooms || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Vagas</span>
                      <span className="font-semibold font-mono">{reParking || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {niche.id === "veiculo" && (
                <div className=" rounded-xl p-4 bg-muted/20 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Ficha Técnica Automotiva
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Marca/Modelo</span>
                      <span className="font-semibold">
                        {vehicleBrand} {vehicleModel}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ano</span>
                      <span className="font-semibold font-mono">
                        {vehicleYearFab || "—"}/{vehicleYearModel || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Km</span>
                      <span className="font-semibold font-mono">
                        {vehicleKm ? `${vehicleKm} km` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Câmbio</span>
                      <span className="font-semibold">{vehicleTransmission}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Contato na Prévia */}
              <div className="pt-2">
                <Button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-emerald-600 text-white font-bold text-xs gap-2 h-11 opacity-90 cursor-not-allowed"
                >
                  <Phone className="size-4" />
                  <span>Conversar no WhatsApp (Prévia)</span>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
