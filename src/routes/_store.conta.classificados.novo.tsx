import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { upsertClassified } from "@/services/classifieds.functions";
import { z } from "zod";
import { formatMoney } from "@/lib/money";

const ClassifiedSearchSchema = z.object({
  tipo: z.string().optional(),
});

export const Route = createFileRoute("/_store/conta/classificados/novo")({
  validateSearch: ClassifiedSearchSchema,
  head: () => ({ meta: [{ title: "Criar Classificado — JAH" }] }),
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
              className="w-full text-left group relative border border-border hover:border-primary/50 bg-card hover:bg-card/80 rounded-2xl p-5 md:p-6 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Common Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceReal, setPriceReal] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [locationName, setLocationName] = useState("");
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
  const [reCondoReal, setReCondoReal] = useState("");
  const [reIptuReal, setReIptuReal] = useState("");
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

  // Specialized: Desapego
  const [itemCondition, setItemCondition] = useState<
    "novo" | "usado_excelente" | "usado_bom" | "com_marcas"
  >("usado_excelente");
  const [itemDelivery, setItemDelivery] = useState<"retirada" | "envio" | "ambos">("ambos");
  const [itemWarranty, setItemWarranty] = useState("");

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
      };

      if (niche.id === "imovel") {
        attributes.deal_type = reDealType;
        attributes.property_type = rePropertyType;
        attributes.area_sqm = reAreaSqm;
        attributes.bedrooms = reBedrooms;
        attributes.suites = reSuites;
        attributes.bathrooms = reBathrooms;
        attributes.parking_spots = reParking;
        attributes.condo_cents = reCondoReal ? parseInt(reCondoReal.replace(/\D/g, "")) : null;
        attributes.iptu_cents = reIptuReal ? parseInt(reIptuReal.replace(/\D/g, "")) : null;
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
        attributes.delivery_method = itemDelivery;
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

      const priceCents = priceReal
        ? Math.round(parseFloat(priceReal.replace(/\D/g, "")) || 0)
        : null;

      const res = await upsertClassified({
        data: {
          category: niche.canonicalCategory,
          title: title.trim(),
          content: description.trim(),
          price_cents: priceCents,
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
      navigate({ to: "/classificados/$id", params: { id: res.id } });
    } catch (err: any) {
      console.error("Erro ao publicar classificado:", err);
      toast.error(err?.message || "Erro ao publicar anúncio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedPriceCents = priceReal
    ? Math.round(parseFloat(priceReal.replace(/\D/g, "")) || 0)
    : null;

  return (
    <div className="space-y-4">
      {/* ── Topbar Operacional Compacta ──────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
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
              className={`px-3 py-1 rounded-md transition-colors ${mobileTab === "edit" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground"}`}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1 rounded-md transition-colors ${mobileTab === "preview" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground"}`}
            >
              Prévia ({images.length})
            </button>
          </div>

          <Button
            onClick={handlePublish}
            disabled={isSubmitting || isUploadingMedia}
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs h-9 px-4"
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
          <div className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-2xs">
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    R$
                  </span>
                  <Input
                    value={priceReal}
                    onChange={(e) => setPriceReal(e.target.value)}
                    placeholder="0,00"
                    className="pl-9 h-10 rounded-xl text-xs bg-background font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-medium block">&nbsp;</Label>
                <div
                  className="flex items-center gap-2.5 h-10 px-3 rounded-xl border border-border/80 bg-background/60 hover:bg-muted/30 transition-colors cursor-pointer"
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

          {/* Section 2: Campos Especializados do Domínio */}
          {niche.id === "imovel" && (
            <div className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-2xs">
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
                  <Input
                    value={reCondoReal}
                    onChange={(e) => setReCondoReal(e.target.value)}
                    placeholder="Ex: 350,00"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">IPTU Mensal (R$)</Label>
                  <Input
                    value={reIptuReal}
                    onChange={(e) => setReIptuReal(e.target.value)}
                    placeholder="Ex: 80,00"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {niche.id === "veiculo" && (
            <div className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-2xs">
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
          <div className="border border-border bg-card rounded-2xl p-5 space-y-3 shadow-2xs">
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
              maxFiles={8}
            />
          </div>

          {/* Section 4: Localização & WhatsApp */}
          <div className="border border-border bg-card rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <MapPin className="size-4 text-primary" />
              <span>4. Localização & Contato</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-foreground font-medium">
                Bairro / Cidade (Público)
              </Label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Centro, Chapecó - SC"
                className="h-10 rounded-xl text-xs bg-background"
              />
              <p className="text-[10px] text-muted-foreground">
                Para sua privacidade, o número da residência nunca é divulgado.
              </p>
            </div>

            <div className="space-y-1.5">
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
          <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm">
            {/* Header da Prévia */}
            <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between text-xs">
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
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/60 border border-border flex items-center justify-center">
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

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-black text-primary font-mono">
                    {parsedPriceCents ? formatMoney(parsedPriceCents) : "A Combinar"}
                  </span>
                  {negotiable && (
                    <Badge variant="secondary" className="text-[10px]">
                      Aceita Propostas
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap pt-2 border-t border-border/60">
                  {description ||
                    "A descrição detalhada do anúncio aparecerá aqui conforme você digita no formulário à esquerda..."}
                </p>
              </div>

              {/* Ficha Técnica na Prévia */}
              {niche.id === "imovel" && (
                <div className="border border-border/80 rounded-xl p-4 bg-muted/20 space-y-2">
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
                <div className="border border-border/80 rounded-xl p-4 bg-muted/20 space-y-2">
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
