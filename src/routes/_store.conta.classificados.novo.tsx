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
import {
  CANONICAL_VEHICLE_BRANDS,
  CANONICAL_TRANSMISSIONS,
  CANONICAL_FUELS,
  CANONICAL_VEHICLE_COLORS,
  CANONICAL_VEHICLE_OPTIONS,
  CANONICAL_VEHICLE_PROVENANCE,
  CANONICAL_GOODS_SEGMENTS,
  CANONICAL_ITEM_CONDITIONS,
  CANONICAL_SMARTPHONE_BRANDS,
  CANONICAL_COMPUTER_TYPES,
  CANONICAL_COMPUTER_BRANDS,
  CANONICAL_PROCESSORS,
  CANONICAL_RAM_OPTIONS,
  CANONICAL_STORAGE_OPTIONS,
  CANONICAL_APPLIANCE_TYPES,
  CANONICAL_APPLIANCE_BRANDS,
  CANONICAL_VOLTAGES,
  CANONICAL_GAME_CONSOLES,
  CANONICAL_FASHION_CATEGORIES,
  CANONICAL_FASHION_SIZES,
} from "@/lib/classifieds/canonical-taxonomy";
import {
  CANONICAL_EDUCATION_LEVELS,
  CANONICAL_EXPERIENCE_LEVELS,
  CANONICAL_JOB_REGIMES,
  CANONICAL_WORKPLACE_MODELS,
  CANONICAL_WORK_SCHEDULES,
  CANONICAL_SALARY_RANGES,
  CANONICAL_JOB_BENEFITS,
  SUGGESTED_JOB_SKILLS,
  getEducationLabel,
  getExperienceLabel,
  getRegimeLabel,
  getWorkplaceModelLabel,
} from "@/lib/classifieds/canonical-hiring";
import { ChevronDown, ChevronUp, CheckCircle, GraduationCap, Award, SlidersHorizontal } from "lucide-react";
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
// ─── 1. Taxonomia Canônica de Tipos ──────────────────────────────────────────
export type ClassifiedNicheType =
  | "hospedagem"
  | "imovel"
  | "desapego"
  | "veiculo"
  | "servico"
  | "vaga";

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
    id: "hospedagem",
    canonicalCategory: "real_estate",
    title: "Hospedagem & Temporada",
    subtitle: "Chalés, Cabanas, Pousadas & Airbnb",
    description:
      "Aluguel por diária, chalés com hidro, cabanas na serra, casas de campo, pousadas e suítes com check-in.",
    icon: Key,
    badge: "Diárias / Airbnb",
    gradient: "from-amber-500/10 via-rose-500/5 to-transparent",
  },
  {
    id: "imovel",
    canonicalCategory: "real_estate",
    title: "Imóvel (Venda & Aluguel)",
    subtitle: "Habitação, Locação Mensal & Comercial",
    description:
      "Casas, apartamentos, salas comerciais, galpões, terrenos e locação residencial ou comercial.",
    icon: HomeIcon,
    badge: "Alta Procura",
    gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
  },
  {
    id: "desapego",
    canonicalCategory: "sale",
    title: "Desapego & Bens Físicos",
    subtitle: "Eletrônicos, Móveis & Usados",
    description: "Eletrônicos, celulares, computadores, instrumentos musicais, moda, móveis e itens com envio.",
    icon: Tag,
    badge: "Envio & Retirada",
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const [jobWorkSchedule, setJobWorkSchedule] = useState("integral_44h");
  const [jobAcceptedMethods, setJobAcceptedMethods] = useState<string[]>([
    "perfil_wider",
    "upload_cv",
    "whatsapp",
  ]);
  const [customSkillInput, setCustomSkillInput] = useState("");
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

  // Specialized: Hospedagem & Temporada
  const [hospPropertyType, setHospPropertyType] = useState("Chalé / Cabana");
  const [hospGuests, setHospGuests] = useState("4");
  const [hospBedrooms, setHospBedrooms] = useState("1");
  const [hospBathrooms, setHospBathrooms] = useState("1");
  const [hospCleaningFeeCents, setHospCleaningFeeCents] = useState<number | undefined>(undefined);
  const [hospCheckinType, setHospCheckinType] = useState<"self_checkin" | "presential" | "front_desk">("self_checkin");
  const [hospCheckinTime, setHospCheckinTime] = useState("14:00");
  const [hospCheckoutTime, setHospCheckoutTime] = useState("11:00");
  const [hospAmenities, setHospAmenities] = useState<string[]>([
    "Wi-Fi Alta Velocidade",
    "Ar-condicionado",
    "Cozinha Equipada",
    "Estacionamento Gratuito",
  ]);
  const [hospRules, setHospRules] = useState<string[]>([
    "Proibido Fumar",
    "Silêncio após às 22h",
  ]);

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

  // Specialized: Desapego & Itens Gerais (Microfase 77B)
  const [desapegoCategory, setDesapegoCategory] = useState<
    "smartphones" | "computadores" | "eletronicos" | "moveis" | "eletrodomesticos" | "moda_brecho" | "garagem" | "outros"
  >("smartphones");
  const [itemCondition, setItemCondition] = useState<
    "novo" | "usado_excelente" | "usado_bom" | "com_marcas"
  >("usado_excelente");
  const [itemWarranty, setItemWarranty] = useState("");
  // Smartphones contextuais para mensuração
  const [phoneBrand, setPhoneBrand] = useState("Apple");
  const [phoneModel, setPhoneModel] = useState("iPhone 15 Pro");
  const [phoneStorage, setPhoneStorage] = useState("256GB");
  const [phoneBatteryHealth, setPhoneBatteryHealth] = useState("95");
  const [phoneAccessories, setPhoneAccessories] = useState<string[]>([
    "Carregador Original",
    "Caixa Original",
    "Nota Fiscal",
  ]);
  // Computadores Canônicos
  const [computerType, setComputerType] = useState("Notebook");
  const [computerBrand, setComputerBrand] = useState("Dell");
  const [computerProcessor, setComputerProcessor] = useState("Intel Core i5");
  const [computerRam, setComputerRam] = useState("16 GB");
  const [computerStorage, setComputerStorage] = useState("512 GB SSD");

  // Eletrodomésticos Canônicos
  const [applianceType, setApplianceType] = useState("Geladeira / Refrigerador");
  const [applianceBrand, setApplianceBrand] = useState("Brastemp");
  const [applianceVoltage, setApplianceVoltage] = useState("220V");

  // Games Canônicos
  const [gameConsole, setGameConsole] = useState("PlayStation 5");

  // Moda / Brechó Canônico
  const [fashionCategory, setFashionCategory] = useState("Roupas em Geral");
  const [fashionBrand, setFashionBrand] = useState("");

  // Veículo Procedência
  const [vehicleProvenance, setVehicleProvenance] = useState<string[]>([]);

  // Móveis & Brechó
  const [furnitureRoom, setFurnitureRoom] = useState("Sala");
  const [furnitureMaterial, setFurnitureMaterial] = useState("Madeira Maciça");
  const [fashionGender, setFashionGender] = useState("Unissex");
  const [fashionSize, setFashionSize] = useState("M");

  // Specialized: Oportunidade / Vaga (Microfase 77B)
  const [jobRole, setJobRole] = useState("");
  const [jobModel, setJobModel] = useState<"presencial" | "hibrido" | "remoto">("presencial");
  const [jobRegime, setJobRegime] = useState<"CLT" | "PJ" | "Estágio" | "Freelancer">("CLT");
  const [jobSalaryRange, setJobSalaryRange] = useState("");
  const [jobMinEducation, setJobMinEducation] = useState("Ensino Médio Completo");
  const [jobExperienceLevel, setJobExperienceLevel] = useState("Júnior (1 a 2 anos)");
  const [jobApplicationType, setJobApplicationType] = useState<"perfil_wider" | "whatsapp" | "email_cv">("perfil_wider");
  const [jobBenefits, setJobBenefits] = useState<string[]>([
    "Vale Refeição / Alimentação",
    "Vale Transporte",
    "Plano de Saúde",
  ]);
  const [jobSkills, setJobSkills] = useState<string[]>(["Atendimento", "Comunicação"]);
  const [newSkillInput, setNewSkillInput] = useState("");

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
        // Só define delivery_mode se for desapego (bens físicos)!
        delivery_mode: niche.id === "desapego" ? deliveryMode : undefined,
        accepts_pix: acceptsPix,
        accepts_card: acceptsCard,
        accepts_cash: acceptsCash,
        accepts_trade: acceptsTrade,
        max_installments: acceptsCard ? parseInt(maxInstallments) || 12 : 1,
        free_shipping_local: niche.id === "desapego" ? freeShippingLocal : false,
      };

      if (niche.id === "hospedagem") {
        attributes.deal_type = "temporada";
        attributes.rental_period = "diaria";
        attributes.property_type = hospPropertyType;
        attributes.bedrooms = parseInt(hospBedrooms) || 1;
        attributes.bathrooms = parseInt(hospBathrooms) || 1;
        attributes.max_guests = parseInt(hospGuests) || 1;
        attributes.cleaning_fee_cents = hospCleaningFeeCents ?? null;
        attributes.amenities = hospAmenities;
        attributes.checkin_type = hospCheckinType;
        attributes.checkin_time = hospCheckinTime;
        attributes.checkout_time = hospCheckoutTime;
        attributes.house_rules = hospRules;
      } else if (niche.id === "imovel") {
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
        attributes.provenance = vehicleProvenance;
      } else if (niche.id === "servico") {
        attributes.modality = serviceModality;
        attributes.service_area = serviceArea;
        attributes.estimated_duration = serviceDuration;
        attributes.pricing_type = servicePricingType;
      } else if (niche.id === "desapego") {
        attributes.niche = "desapego";
        attributes.desapego_subcategory = desapegoCategory;
        attributes.condition = itemCondition;
        attributes.warranty = itemWarranty;
        if (desapegoCategory === "smartphones") {
          attributes.brand = phoneBrand;
          attributes.model = phoneModel;
          attributes.storage = phoneStorage;
          attributes.battery_health = phoneBatteryHealth ? parseInt(phoneBatteryHealth) : undefined;
          attributes.accessories = phoneAccessories;
        } else if (desapegoCategory === "computadores") {
          attributes.computer_type = computerType;
          attributes.brand = computerBrand;
          attributes.processor = computerProcessor;
          attributes.ram = computerRam;
          attributes.storage = computerStorage;
        } else if (desapegoCategory === "eletrodomesticos") {
          attributes.appliance_type = applianceType;
          attributes.brand = applianceBrand;
          attributes.voltage = applianceVoltage;
        } else if (desapegoCategory === "games" || (desapegoCategory as string) === "games_consoles") {
          attributes.console = gameConsole;
        } else if (desapegoCategory === "moveis") {
          attributes.room = furnitureRoom;
          attributes.material = furnitureMaterial;
        } else if (desapegoCategory === "moda_brecho") {
          attributes.fashion_category = fashionCategory;
          attributes.gender = fashionGender;
          attributes.size = fashionSize;
          attributes.brand = fashionBrand;
        }
      } else if (niche.id === "vaga") {
        attributes.niche = "vaga";
        attributes.role = jobRole || title;
        attributes.work_model = jobModel;
        attributes.regime = jobRegime;
        attributes.work_schedule = jobWorkSchedule;
        attributes.salary_range = jobSalaryRange;
        attributes.min_education = jobMinEducation;
        attributes.experience_level = jobExperienceLevel;
        attributes.application_methods = jobAcceptedMethods;
        attributes.benefits = jobBenefits;
        attributes.skills = jobSkills;
      }

      const res = await upsertClassified({
        data: {
          category: niche.canonicalCategory,
          title: title.trim(),
          content: description.trim(),
          price_cents: priceCents ?? null,
          deal_type:
            niche.id === "hospedagem"
              ? "temporada"
              : niche.id === "imovel"
                ? reDealType
                : undefined,
          property_type:
            niche.id === "hospedagem"
              ? hospPropertyType
              : niche.id === "imovel"
                ? rePropertyType
                : undefined,
          bedrooms:
            niche.id === "hospedagem"
              ? parseInt(hospBedrooms) || 1
              : niche.id === "imovel"
                ? parseInt(reBedrooms) || undefined
                : undefined,
          bathrooms:
            niche.id === "hospedagem"
              ? parseInt(hospBathrooms) || 1
              : niche.id === "imovel"
                ? parseInt(reBathrooms) || undefined
                : undefined,
          suites: niche.id === "imovel" ? parseInt(reSuites) || undefined : undefined,
          parking_spots: niche.id === "imovel" ? parseInt(reParking) || undefined : undefined,
          area_sqm: niche.id === "imovel" ? parseInt(reAreaSqm) || undefined : undefined,
          amenities:
            niche.id === "hospedagem"
              ? hospAmenities
              : niche.id === "imovel"
                ? reAmenities
                : undefined,
          max_guests: niche.id === "hospedagem" ? parseInt(hospGuests) || 1 : undefined,
          cleaning_fee_cents:
            niche.id === "hospedagem" ? (hospCleaningFeeCents ?? 0) : undefined,
          rental_period: niche.id === "hospedagem" ? "diaria" : undefined,
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
                  niche.id === "hospedagem"
                    ? "Ex: Chalé na Serra com Hidro e Vista Panorâmica"
                    : niche.id === "imovel"
                      ? "Ex: Apartamento 2 Quartos no Centro com Garagem"
                      : niche.id === "veiculo"
                        ? "Ex: Honda Civic 2.0 EXL Automático 2021"
                        : niche.id === "servico"
                          ? "Ex: Manutenção Elétrica Residencial & Comercial"
                          : niche.id === "vaga"
                            ? "Ex: Analista Financeiro Sênior (Híbrido)"
                            : "Ex: iPhone 15 Pro Max 256GB Impecável na Caixa"
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
                placeholder={
                  niche.id === "hospedagem"
                    ? "Descreva a atmosfera do espaço, comodidades, localização, distâncias de pontos turísticos e regras de convivência..."
                    : "Descreva todos os detalhes, histórico, diferenciais e informações importantes..."
                }
                className="rounded-xl text-xs bg-background resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-medium">
                  {niche.id === "hospedagem"
                    ? "Valor da Diária (R$)"
                    : niche.id === "imovel" && reDealType === "aluguel"
                      ? "Aluguel Mensal (R$)"
                      : niche.id === "servico"
                        ? "Valor Base / Orçamento (R$)"
                        : niche.id === "vaga"
                          ? "Remuneração / Salário (R$)"
                          : "Valor (R$)"}
                </Label>
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

          /* Section 2: Ficha Técnica Especializada & Mensuração Canônica */
          <div className="bg-card rounded-2xl border border-border/70 overflow-hidden shadow-xs">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer select-none bg-muted/20 hover:bg-muted/30 transition-colors"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <SlidersHorizontal className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">2. Ficha Técnica & Parâmetros Especializados</span>
                    <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/15 text-primary border-primary/20">
                      Modo Avançado
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Preencha os parâmetros do nicho para habilitar filtros avançados, métricas e mensuração no portal.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2.5 rounded-lg text-xs gap-1.5 text-muted-foreground">
                <span>{isAdvancedOpen ? "Recolher" : "Expandir"}</span>
                {isAdvancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            </div>

            {isAdvancedOpen && (
              <div className="p-5 pt-2 space-y-5 border-t border-border/50">
          {/* Hospedagem & Temporada */}
          {niche.id === "hospedagem" && (
            <div className="bg-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Key className="size-4 text-primary" />
                  <span>2. Detalhes da Estadia & Check-in</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  Temporada / Diária
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Tipo de Estadia</Label>
                  <Select value={hospPropertyType} onValueChange={setHospPropertyType}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chalé / Cabana">Chalé / Cabana na Serra</SelectItem>
                      <SelectItem value="Apartamento Inteiro">Apartamento Inteiro</SelectItem>
                      <SelectItem value="Casa de Campo / Sítio">Casa de Campo / Sítio</SelectItem>
                      <SelectItem value="Casa de Praia">Casa de Praia</SelectItem>
                      <SelectItem value="Loft / Studio Moderno">Loft / Studio Moderno</SelectItem>
                      <SelectItem value="Quarto Privativo">Quarto Privativo em Residência</SelectItem>
                      <SelectItem value="Pousada / Suíte">Pousada / Suíte Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Modalidade de Check-in</Label>
                  <Select value={hospCheckinType} onValueChange={(v: any) => setHospCheckinType(v)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self_checkin">🔑 Self Check-in (Fechadura Eletrônica / Cofre)</SelectItem>
                      <SelectItem value="presential">🤝 Check-in Presencial com o Anfitrião</SelectItem>
                      <SelectItem value="front_desk">🏢 Portaria / Recepção 24h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Hóspedes Máx.</Label>
                  <Input
                    value={hospGuests}
                    onChange={(e) => setHospGuests(e.target.value)}
                    placeholder="4"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Quartos</Label>
                  <Input
                    value={hospBedrooms}
                    onChange={(e) => setHospBedrooms(e.target.value)}
                    placeholder="1"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Banheiros</Label>
                  <Input
                    value={hospBathrooms}
                    onChange={(e) => setHospBathrooms(e.target.value)}
                    placeholder="1"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Taxa de Limpeza (R$)</Label>
                  <CurrencyField
                    value={hospCleaningFeeCents}
                    onChange={setHospCleaningFeeCents}
                    placeholder="0,00"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Horário Check-in</Label>
                  <Input
                    value={hospCheckinTime}
                    onChange={(e) => setHospCheckinTime(e.target.value)}
                    placeholder="14:00"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Horário Check-out</Label>
                  <Input
                    value={hospCheckoutTime}
                    onChange={(e) => setHospCheckoutTime(e.target.value)}
                    placeholder="11:00"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              {/* Comodidades Selecionáveis */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs text-foreground font-medium">Comodidades Disponíveis</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Wi-Fi Alta Velocidade",
                    "Ar-condicionado",
                    "Lareira",
                    "Jacuzzi / Hidro",
                    "Cozinha Equipada",
                    "Vista Panorâmica",
                    "Pet Friendly",
                    "Estacionamento Gratuito",
                    "Churrasqueira",
                    "Piscina Privativa",
                    "Roupa de Cama & Banho",
                    "Espaço Home Office",
                  ].map((amenity) => {
                    const active = hospAmenities.includes(amenity);
                    return (
                      <div
                        key={amenity}
                        onClick={() => toggleItem(hospAmenities, setHospAmenities, amenity)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          active
                            ? "border-primary/50 bg-primary/10 text-foreground font-semibold"
                            : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox checked={active} />
                        <span className="truncate">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Regras da Casa */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs text-foreground font-medium">Regras da Hospedagem</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Permitido Pets",
                    "Proibido Fumar",
                    "Festas / Eventos Não Permitidos",
                    "Silêncio após às 22h",
                  ].map((rule) => {
                    const active = hospRules.includes(rule);
                    return (
                      <div
                        key={rule}
                        onClick={() => toggleItem(hospRules, setHospRules, rule)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          active
                            ? "border-primary/50 bg-primary/10 text-foreground font-semibold"
                            : "border-border/60 bg-background/50 text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox checked={active} />
                        <span className="truncate">{rule}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Imóvel */}
          {niche.id === "imovel" && (
            <div className=" bg-card rounded-2xl p-5 space-y-4 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <HomeIcon className="size-4 text-primary" />
                <span>2. Ficha Técnica do Imóvel</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

          {/* Veículo */}
          {niche.id === "vaga" && (
                <div className="rounded-2xl p-4 bg-muted/25 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-primary" />
                      <span>Ficha da Oportunidade</span>
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-medium text-primary border-primary/30">
                      {jobRole || "Cargo a definir"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Escolaridade</span>
                      <span className="font-semibold">{getEducationLabel(jobMinEducation)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Experiência</span>
                      <span className="font-semibold">{getExperienceLabel(jobExperienceLevel)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Regime</span>
                      <span className="font-semibold">{getRegimeLabel(jobRegime)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Modelo</span>
                      <span className="font-semibold">{getWorkplaceModelLabel(jobModel)}</span>
                    </div>
                  </div>

                  {jobBenefits.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1.5">
                        Benefícios Oferecidos
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobBenefits.map((b) => (
                          <Badge key={b} variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20">
                            ✓ {b}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobSkills.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1.5">
                        Habilidades Desejadas
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {jobSkills.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {niche.id === "veiculo" && (
            <div className=" bg-card rounded-2xl p-5 space-y-4 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Car className="size-4 text-primary" />
                <span>2. Ficha Técnica do Veículo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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

          {/* Desapego & Bens Físicos Avançado (Microfase 77B) */}
          {niche.id === "desapego" && (
            <div className="bg-card rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Tag className="size-4 text-primary" />
                  <span>2. Subcategoria & Especificações do Item</span>
                </div>
                
              </div>

              {/* Seletor de Subcategoria de Desapego */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-medium">Tipo de Item / Segmento</Label>
                <Select value={desapegoCategory} onValueChange={(v: any) => setDesapegoCategory(v)}>
                  <SelectTrigger className="h-10 rounded-xl text-xs bg-background font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smartphones">📱 Celulares & Smartphones</SelectItem>
                    <SelectItem value="computadores">💻 Notebooks, PCs & Acessórios</SelectItem>
                    <SelectItem value="eletronicos">📺 Eletrônicos & Som em Geral</SelectItem>
                    <SelectItem value="eletrodomesticos">🧊 Eletrodomésticos & Cozinha</SelectItem>
                    <SelectItem value="moveis">🛋️ Móveis & Decoração de Ambientes</SelectItem>
                    <SelectItem value="moda_brecho">👗 Brechó de Roupas & Acessórios</SelectItem>
                    <SelectItem value="garagem">📦 Venda de Garagem & Ferramentas</SelectItem>
                    <SelectItem value="outros">🏷️ Outros Bens Pessoais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seção Específica para Smartphones & Celulares com Seletores Canônicos */}
              {desapegoCategory === "smartphones" && (
                <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-4">
                  <div className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Ficha Técnica Canônica de Smartphone
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Marca do Aparelho</Label>
                      <Select value={phoneBrand} onValueChange={(v) => {
                        setPhoneBrand(v);
                        if (v === "Apple") setPhoneModel("iPhone 15 Pro");
                        else if (v === "Samsung") setPhoneModel("Galaxy S24");
                        else if (v === "Xiaomi") setPhoneModel("Redmi Note 13 Pro 5G");
                        else if (v === "Motorola") setPhoneModel("Edge 50 Ultra");
                      }}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Apple">Apple</SelectItem>
                          <SelectItem value="Samsung">Samsung</SelectItem>
                          <SelectItem value="Xiaomi">Xiaomi</SelectItem>
                          <SelectItem value="Motorola">Motorola</SelectItem>
                          <SelectItem value="Outra">Outra Marca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Modelo da Linha</Label>
                      <Select value={phoneModel} onValueChange={setPhoneModel}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {phoneBrand === "Apple" && (
                            <>
                              <SelectItem value="iPhone 16 Pro Max">iPhone 16 Pro Max</SelectItem>
                              <SelectItem value="iPhone 16 Pro">iPhone 16 Pro</SelectItem>
                              <SelectItem value="iPhone 16">iPhone 16</SelectItem>
                              <SelectItem value="iPhone 15 Pro Max">iPhone 15 Pro Max</SelectItem>
                              <SelectItem value="iPhone 15 Pro">iPhone 15 Pro</SelectItem>
                              <SelectItem value="iPhone 15">iPhone 15</SelectItem>
                              <SelectItem value="iPhone 14 Pro">iPhone 14 Pro</SelectItem>
                              <SelectItem value="iPhone 14">iPhone 14</SelectItem>
                              <SelectItem value="iPhone 13">iPhone 13</SelectItem>
                              <SelectItem value="iPhone 12">iPhone 12</SelectItem>
                              <SelectItem value="iPhone 11">iPhone 11</SelectItem>
                            </>
                          )}
                          {phoneBrand === "Samsung" && (
                            <>
                              <SelectItem value="Galaxy S24 Ultra">Galaxy S24 Ultra</SelectItem>
                              <SelectItem value="Galaxy S24+">Galaxy S24+</SelectItem>
                              <SelectItem value="Galaxy S24">Galaxy S24</SelectItem>
                              <SelectItem value="Galaxy S23 Ultra">Galaxy S23 Ultra</SelectItem>
                              <SelectItem value="Galaxy S23">Galaxy S23</SelectItem>
                              <SelectItem value="Galaxy Z Fold 5">Galaxy Z Fold 5</SelectItem>
                              <SelectItem value="Galaxy Z Flip 5">Galaxy Z Flip 5</SelectItem>
                              <SelectItem value="Galaxy A54 5G">Galaxy A54 5G</SelectItem>
                            </>
                          )}
                          {phoneBrand === "Xiaomi" && (
                            <>
                              <SelectItem value="Xiaomi 14">Xiaomi 14</SelectItem>
                              <SelectItem value="Redmi Note 13 Pro 5G">Redmi Note 13 Pro 5G</SelectItem>
                              <SelectItem value="Redmi Note 12">Redmi Note 12</SelectItem>
                              <SelectItem value="Poco X6 Pro">Poco X6 Pro</SelectItem>
                              <SelectItem value="Poco F5">Poco F5</SelectItem>
                            </>
                          )}
                          {phoneBrand === "Motorola" && (
                            <>
                              <SelectItem value="Edge 50 Ultra">Edge 50 Ultra</SelectItem>
                              <SelectItem value="Edge 40 Neo">Edge 40 Neo</SelectItem>
                              <SelectItem value="Moto G84 5G">Moto G84 5G</SelectItem>
                              <SelectItem value="Moto G54 5G">Moto G54 5G</SelectItem>
                            </>
                          )}
                          {phoneBrand === "Outra" && (
                            <SelectItem value="Outro Modelo">Outro Modelo</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Armazenamento Interno</Label>
                      <Select value={phoneStorage} onValueChange={setPhoneStorage}>
                        <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="64GB">64 GB</SelectItem>
                          <SelectItem value="128GB">128 GB</SelectItem>
                          <SelectItem value="256GB">256 GB</SelectItem>
                          <SelectItem value="512GB">512 GB</SelectItem>
                          <SelectItem value="1TB">1 TB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Saúde da Bateria (%)</Label>
                      <Input
                        type="number"
                        min="50"
                        max="100"
                        value={phoneBatteryHealth}
                        onChange={(e) => setPhoneBatteryHealth(e.target.value)}
                        placeholder="Ex: 95"
                        className="h-9 rounded-xl text-xs bg-background font-mono"
                      />
                    </div>
                  </div>

                  {/* Acessórios Inclusos */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs text-foreground font-medium">Acessórios Inclusos no Aparelho</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Carregador Original",
                        "Caixa Original",
                        "Nota Fiscal",
                        "Cabo USB-C",
                        "Capinha / Película",
                        "Fone de Ouvido",
                      ].map((item) => {
                        const isSelected = phoneAccessories.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setPhoneAccessories((prev) =>
                                isSelected ? prev.filter((x) => x !== item) : [...prev, item]
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-background border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Móveis & Decoração */}
              {desapegoCategory === "moveis" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/20 border border-border/60">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium">Ambiente do Móvel</Label>
                    <Select value={furnitureRoom} onValueChange={setFurnitureRoom}>
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sala">Sala de Estar / Jantar</SelectItem>
                        <SelectItem value="Quarto">Quarto / Closet</SelectItem>
                        <SelectItem value="Cozinha">Cozinha / Área Gourmet</SelectItem>
                        <SelectItem value="Escritório">Home Office / Escritório</SelectItem>
                        <SelectItem value="Varanda">Varanda / Jardim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium">Material Principal</Label>
                    <Select value={furnitureMaterial} onValueChange={setFurnitureMaterial}>
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Madeira Maciça">Madeira Maciça</SelectItem>
                        <SelectItem value="MDF / MDP">MDF / MDP Laminado</SelectItem>
                        <SelectItem value="Metal / Aço">Metal / Aço Industrial</SelectItem>
                        <SelectItem value="Estofado / Linho">Estofado / Linho / Veludo</SelectItem>
                        <SelectItem value="Vidro / Espelho">Vidro / Espelho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Brechó de Roupas */}
              {desapegoCategory === "moda_brecho" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/20 border border-border/60">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium">Gênero / Faixa</Label>
                    <Select value={fashionGender} onValueChange={setFashionGender}>
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Infantil">Infantil / Kids</SelectItem>
                        <SelectItem value="Unissex">Unissex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium">Tamanho da Peça</Label>
                    <Select value={fashionSize} onValueChange={setFashionSize}>
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PP">PP / 36</SelectItem>
                        <SelectItem value="P">P / 38</SelectItem>
                        <SelectItem value="M">M / 40</SelectItem>
                        <SelectItem value="G">G / 42</SelectItem>
                        <SelectItem value="GG">GG / 44</SelectItem>
                        <SelectItem value="XGG">XGG / Plus Size</SelectItem>
                        <SelectItem value="Calçado">Calçado (informar no texto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Estado de Conservação Geral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Estado de Conservação</Label>
                  <Select value={itemCondition} onValueChange={(v: any) => setItemCondition(v)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo / Lacrado na Caixa</SelectItem>
                      <SelectItem value="usado_excelente">Usado - Em Estado de Novo</SelectItem>
                      <SelectItem value="usado_bom">Usado - Bom Estado de Uso</SelectItem>
                      <SelectItem value="com_marcas">Usado - Com Marcas Visíveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Garantia / Procedência</Label>
                  <Input
                    value={itemWarranty}
                    onChange={(e) => setItemWarranty(e.target.value)}
                    placeholder="Ex: 3 meses de garantia, NF em mãos"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Serviço Profissional */}
          {niche.id === "servico" && (
            <div className="bg-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Wrench className="size-4 text-primary" />
                <span>2. Escopo & Atendimento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Modalidade de Atendimento</Label>
                  <Select value={serviceModality} onValueChange={(v: any) => setServiceModality(v)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial no Estabelecimento</SelectItem>
                      <SelectItem value="domicilio">Em Domicílio (Atende no Local)</SelectItem>
                      <SelectItem value="remoto">100% Remoto / Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Região de Atendimento</Label>
                  <Input
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="Ex: Toda a cidade e região"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Oportunidade / Vaga Master InfoJobs & Gupy Style */}
          {niche.id === "vaga" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Briefcase className="size-4 text-primary" />
                  <span>Parâmetros de Contratação & Mensuração</span>
                </div>
                
              </div>

              {/* Cargo / Título Profissional */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-medium">Cargo / Ocupação Profissional *</Label>
                <Input
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Ex: Assistente Administrativo, Desenvolvedor Fullstack, Vendedor"
                  className="h-10 rounded-xl text-xs bg-background"
                />
              </div>

              {/* Grid de 2 Colunas: Escolaridade Mínima e Tempo de Experiência Mensuráveis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-primary" />
                    <Label className="text-xs text-foreground font-medium">Escolaridade Mínima Exigida *</Label>
                  </div>
                  <Select value={jobMinEducation} onValueChange={setJobMinEducation}>
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_EDUCATION_LEVELS.map((edu) => (
                        <SelectItem key={edu.value} value={edu.value}>
                          {edu.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Award className="size-3.5 text-primary" />
                    <Label className="text-xs text-foreground font-medium">Experiência Profissional Mínima *</Label>
                  </div>
                  <Select value={jobExperienceLevel} onValueChange={setJobExperienceLevel}>
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_EXPERIENCE_LEVELS.map((exp) => (
                        <SelectItem key={exp.value} value={exp.value}>
                          {exp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid de 3 Colunas: Regime, Modelo e Jornada */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Regime de Contratação</Label>
                  <Select value={jobRegime} onValueChange={(v: any) => setJobRegime(v)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_JOB_REGIMES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Modelo de Trabalho</Label>
                  <Select value={jobModel} onValueChange={(v: any) => setJobModel(v)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_WORKPLACE_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Jornada de Trabalho</Label>
                  <Select value={jobWorkSchedule} onValueChange={setJobWorkSchedule}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_WORK_SCHEDULES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Faixa Salarial Mensurável */}
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground font-medium">Faixa Salarial / Remuneração Estimada</Label>
                <Select value={jobSalaryRange} onValueChange={setJobSalaryRange}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANONICAL_SALARY_RANGES.map((sal) => (
                      <SelectItem key={sal.value} value={sal.value}>
                        {sal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Benefícios Oferecidos em Tags Clicáveis */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground font-medium">Benefícios Oferecidos pela Empresa</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">{jobBenefits.length} selecionado(s)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CANONICAL_JOB_BENEFITS.map((ben) => {
                    const active = jobBenefits.includes(ben);
                    return (
                      <button
                        key={ben}
                        type="button"
                        onClick={() => {
                          setJobBenefits((prev) =>
                            active ? prev.filter((b) => b !== ben) : [...prev, ben]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? "bg-primary/15 border-primary text-primary font-semibold"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {ben}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Habilidades & Competências com Tags Interativas */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground font-medium">Competências & Habilidades Desejadas</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">{jobSkills.length} adicionada(s)</span>
                </div>

                {/* Tags Ativas */}
                <div className="flex flex-wrap gap-1.5 min-h-7">
                  {jobSkills.map((sk) => (
                    <Badge
                      key={sk}
                      variant="secondary"
                      className="text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-lg gap-1.5 bg-primary/10 text-primary border-primary/20"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => setJobSkills((prev) => prev.filter((s) => s !== sk))}
                        className="hover:text-destructive text-primary/70 transition-colors cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Input de Adicionar Nova Habilidade */}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customSkillInput.trim() && !jobSkills.includes(customSkillInput.trim())) {
                          setJobSkills((prev) => [...prev, customSkillInput.trim()]);
                          setCustomSkillInput("");
                        }
                      }
                    }}
                    placeholder="Adicionar habilidade personalizada e pressionar Enter..."
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (customSkillInput.trim() && !jobSkills.includes(customSkillInput.trim())) {
                        setJobSkills((prev) => [...prev, customSkillInput.trim()]);
                        setCustomSkillInput("");
                      }
                    }}
                    className="h-9 px-3 rounded-xl text-xs"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Sugestões Rápidas */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground block font-medium">Sugestões comuns:</span>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_JOB_SKILLS.filter((s) => !jobSkills.includes(s)).slice(0, 6).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setJobSkills((prev) => [...prev, sug])}
                        className="px-2 py-0.5 rounded-md text-[10px] border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Formas de Candidatura Aceitas */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-xs text-foreground font-medium">Formas de Candidatura Permitidas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "perfil_wider", label: "Perfil Profissional Wider (1-Clique)", desc: "Currículo digital sincronizado" },
                    { id: "upload_cv", label: "Upload de Currículo (PDF/DOCX)", desc: "Arquivo anexado direto" },
                    { id: "whatsapp", label: "Contato via WhatsApp Oficial", desc: "Triagem imediata por mensagem" },
                  ].map((method) => {
                    const selected = jobAcceptedMethods.includes(method.id);
                    return (
                      <div
                        key={method.id}
                        onClick={() => {
                          setJobAcceptedMethods((prev) =>
                            selected ? (prev.length > 1 ? prev.filter((m) => m !== method.id) : prev) : [...prev, method.id]
                          );
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          selected
                            ? "bg-primary/5 border-primary text-foreground"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selected} />
                          <span className="text-xs font-semibold">{method.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 pl-6">{method.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
              </div>
            )}
          </div>

          {/* Section 3 (Exclusivo para Desapego & Bens Físicos): Logística de Envio & Formas de Pagamento */}
          {niche.id === "desapego" && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <Truck className="size-4 text-primary" />
                    <span>3. Logística de Envio & Retirada</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                    Wider Express
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">Modalidade de Envio / Retirada</Label>
                  <Select value={deliveryMode} onValueChange={(v: any) => setDeliveryMode(v)}>
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">📦 Entrega Expressa Wider & Retirada em Mãos (Recomendado)</SelectItem>
                      <SelectItem value="pickup">🏠 Somente Retirada no Local</SelectItem>
                      <SelectItem value="local_delivery">🛵 Somente Entrega Local (Motoboy / Frota)</SelectItem>
                      <SelectItem value="shipping">🚚 Envio Nacional (Correios / Transportadora)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <Checkbox
                    id="free-shipping"
                    checked={freeShippingLocal}
                    onCheckedChange={(c) => setFreeShippingLocal(!!c)}
                  />
                  <Label htmlFor="free-shipping" className="text-xs text-foreground font-medium cursor-pointer">
                    Oferecer frete grátis para entrega local na minha cidade
                  </Label>
                </div>
              </div>

              {/* Formas de Pagamento Aceitas */}
              <div className="bg-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <CreditCard className="size-4 text-primary" />
                    <span>Formas de Pagamento Aceitas</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              lockAspect={true}
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
                    {niche.id === "hospedagem" && parsedPriceCents && (
                      <span className="text-xs font-semibold text-muted-foreground">/diária</span>
                    )}
                    {niche.id === "imovel" && reDealType === "aluguel" && parsedPriceCents && (
                      <span className="text-xs font-semibold text-muted-foreground">/mês</span>
                    )}
                    {negotiable && (
                      <Badge variant="secondary" className="text-[10px]">
                        Aceita Propostas
                      </Badge>
                    )}
                  </div>

                  {niche.id === "hospedagem" && hospCleaningFeeCents && hospCleaningFeeCents > 0 && (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      + Taxa de Limpeza: <strong className="text-foreground">{formatMoney(hospCleaningFeeCents)}</strong> (taxa única por estadia)
                    </p>
                  )}

                  {parsedPriceCents && acceptsCard && parseInt(maxInstallments) > 1 && niche.id !== "hospedagem" && (
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <CreditCard className="size-3 text-primary" />
                      <span>
                        ou em até <strong>{maxInstallments}x de {formatMoney(Math.round(parsedPriceCents / (parseInt(maxInstallments) || 1)))}</strong>
                      </span>
                    </p>
                  )}
                </div>

                {/* Badges Semânticos de Acordo com o Nicho */}
                {niche.id === "hospedagem" && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <Key className="size-3 text-primary" />
                      <span>
                        {hospCheckinType === "self_checkin"
                          ? "Self Check-in (Fechadura Eletrônica)"
                          : hospCheckinType === "front_desk"
                            ? "Portaria 24h"
                            : "Check-in Presencial"}
                      </span>
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <span>{hospGuests} Hóspedes máx.</span>
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                      <span>{hospPropertyType}</span>
                    </Badge>
                    {acceptsPix && (
                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                        <QrCode className="size-3 text-emerald-600" />
                        <span>PIX</span>
                      </Badge>
                    )}
                    {acceptsCard && (
                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                        <CreditCard className="size-3 text-blue-600" />
                        <span>Cartão</span>
                      </Badge>
                    )}
                  </div>
                )}

                {niche.id === "desapego" && (
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
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {itemCondition === "novo"
                        ? "Novo / Na Caixa"
                        : itemCondition === "usado_excelente"
                          ? "Usado - Como Novo"
                          : itemCondition === "usado_bom"
                            ? "Usado - Bom Estado"
                            : "Usado - Com Marcas"}
                    </Badge>
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
                )}

                {(niche.id === "veiculo" || niche.id === "desapego") && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {acceptsPix && (
                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                        <QrCode className="size-3 text-emerald-600" />
                        <span>PIX</span>
                      </Badge>
                    )}
                    {acceptsCard && (
                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                        <CreditCard className="size-3 text-blue-600" />
                        <span>Cartão</span>
                      </Badge>
                    )}
                    {acceptsCash && (
                      <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                        <Banknote className="size-3 text-slate-600" />
                        <span>Dinheiro</span>
                      </Badge>
                    )}
                  </div>
                )}

                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap pt-2 ">
                  {description ||
                    "A descrição detalhada do anúncio aparecerá aqui conforme você digita no formulário à esquerda..."}
                </p>
              </div>

              {/* Simulador de Frete & Logística Wider Express na Prévia (Apenas para Desapego) */}
              {niche.id === "desapego" && (deliveryMode === "both" || deliveryMode === "local_delivery" || deliveryMode === "shipping") && (
                <div className="border border-primary/30 rounded-2xl p-4 bg-primary/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Truck className="size-4 text-primary" />
                      <span>Simulação de Frete & Entrega (Comprador)</span>
                    </div>
                    <Badge variant="default" className="text-[9px] font-mono bg-primary text-primary-foreground">
                      Wider Express
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
              {niche.id === "hospedagem" && (
                <div className="rounded-xl p-4 bg-muted/20 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Key className="size-3.5 text-primary" />
                    <span>Detalhes da Estadia & Regras</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Tipo</span>
                      <span className="font-semibold">{hospPropertyType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Capacidade</span>
                      <span className="font-semibold font-mono">{hospGuests} hóspedes</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Check-in</span>
                      <span className="font-semibold font-mono">A partir de {hospCheckinTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Check-out</span>
                      <span className="font-semibold font-mono">Até às {hospCheckoutTime}</span>
                    </div>
                  </div>
                  {hospAmenities.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1.5">
                        Comodidades
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {hospAmenities.map((a) => (
                          <Badge key={a} variant="outline" className="text-[10px] bg-background">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  <span>
                    {niche.id === "hospedagem"
                      ? "Consultar Datas & Reservar (WhatsApp)"
                      : niche.id === "imovel"
                        ? "Agendar Visita ao Imóvel (WhatsApp)"
                        : niche.id === "veiculo"
                          ? "Agendar Test Drive & Proposta (WhatsApp)"
                          : niche.id === "servico"
                            ? "Solicitar Orçamento Técnico (WhatsApp)"
                            : niche.id === "vaga"
                              ? "Enviar Currículo / Candidatar-se (WhatsApp)"
                              : "Comprar / Falar com o Vendedor (WhatsApp)"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
