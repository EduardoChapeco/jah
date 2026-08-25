import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Utensils,
  ShoppingBag,
  Store,
  Scissors,
  Pill,
  Dog,
  Ticket,
  Smartphone,
  Briefcase,
  Building2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  ShieldCheck,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Clock,
  Truck,
  FileText,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CitySelect } from "@/components/ui/city-select";
import { CHAPECO_NEIGHBORHOODS, type NeighborhoodPreset } from "@/lib/constants/cities";
import { provisionBusiness } from "@/services/onboarding.functions";
import { uploadStoreMedia } from "@/services/storage.functions";
import { getUserSession } from "@/services/auth.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/criar-negocio")({
  head: () => ({ meta: [{ title: "Cadastrar Nova Loja / Negócio | Wider" }] }),
  validateSearch: (search: Record<string, unknown>): { segment?: string } => {
    return {
      segment: (search.segment as string) || undefined,
    };
  },
  beforeLoad: async ({ location }) => {
    const session = await getUserSession();
    if (!session) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname },
      });
    }
  },
  component: CriarNegocioPage,
});

interface SegmentDefinition {
  id: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge: string;
}

const BUSINESS_SEGMENTS: SegmentDefinition[] = [
  {
    id: "gastronomy",
    title: "Gastronomia & Restaurante",
    desc: "Restaurantes, lanchonetes, pizzarias, marmitarias, cafés e bares.",
    icon: Utensils,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    badge: "PDV & Delivery",
  },
  {
    id: "mercado",
    title: "Mercado & Supermercado",
    desc: "Hortifrutis, mercearias, empórios, conveniências e açougues.",
    icon: Store,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    badge: "Gôndola & Pesagem",
  },
  {
    id: "ecommerce",
    title: "Moda & Vestuário",
    desc: "Lojas de roupas, calçados, bolsas, acessórios e artigos esportivos.",
    icon: ShoppingBag,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    badge: "Cores & Tamanhos",
  },
  {
    id: "services",
    title: "Serviços, Beleza & Saúde",
    desc: "Salões, barbearias, estética, consultorias e atendimentos.",
    icon: Scissors,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    badge: "Agendamentos",
  },
  {
    id: "pharmacy",
    title: "Farmácia & Drogaria",
    desc: "Medicamentos, suplementos, dermocosméticos e perfumaria.",
    icon: Pill,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    badge: "Entrega Rápida",
  },
  {
    id: "pet",
    title: "Pet Shop & Veterinária",
    desc: "Rações, medicamentos veterinários, acessórios e banho & tosa.",
    icon: Dog,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    badge: "Produtos & Cuidados",
  },
  {
    id: "electronics",
    title: "Eletrônicos & Informática",
    desc: "Smartphones, periféricos, peças, informática e assistência técnica.",
    icon: Smartphone,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    badge: "Garantia & Séries",
  },
  {
    id: "event_producer",
    title: "Eventos & Ingressos",
    desc: "Shows, festas, festivais, venda de ingressos e check-in com QR.",
    icon: Ticket,
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
    badge: "Lotes & Ingressos",
  },
  {
    id: "creator",
    title: "Profissional Autônomo",
    desc: "Orçamentos, serviços sob medida, propostas e faturas.",
    icon: Briefcase,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
    badge: "Propostas & CRM",
  },
  {
    id: "collective",
    title: "Coletivo Cultural & ONG",
    desc: "Associações, projetos comunitários e coletivos locais.",
    icon: Building2,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
    badge: "Comunidade",
  },
];

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

function CriarNegocioPage() {
  const search = Route.useSearch();
  const initialSegment = search?.segment || "";
  const foundInitial = BUSINESS_SEGMENTS.find((s) => s.id === initialSegment);

  const [step, setStep] = useState<OnboardingStep>(foundInitial ? 2 : 1);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(
    foundInitial ? foundInitial.id : "gastronomy"
  );

  // Etapa 2: Dados Básicos & Cidade
  const [name, setName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("SC");
  const [city, setCity] = useState("Chapecó");
  const [address, setAddress] = useState("");

  // Etapa 3: Identidade Visual
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Etapa 4: Operação & Entrega
  const [hasDelivery, setHasDelivery] = useState(true);
  const [hasPickup, setHasPickup] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodPreset[]>(CHAPECO_NEIGHBORHOODS);
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("23:00");

  // Etapa 5: Documentos & Sócios
  const [complianceDocs, setComplianceDocs] = useState<Array<{ name: string; url: string }>>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSegment =
    BUSINESS_SEGMENTS.find((s) => s.id === selectedSegmentId) || BUSINESS_SEGMENTS[0];

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "banner" | "doc"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "logo") setIsUploadingLogo(true);
    else if (target === "banner") setIsUploadingBanner(true);
    else setIsUploadingDoc(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await uploadStoreMedia({
            data: {
              fileName: file.name,
              fileType: file.type,
              base64Data,
              bucket: "cms-media",
            },
          });
          if (res?.url) {
            if (target === "logo") {
              setLogoUrl(res.url);
              toast.success("Logotipo carregado com sucesso!");
            } else if (target === "banner") {
              setBannerUrl(res.url);
              toast.success("Banner de cabeçalho carregado!");
            } else {
              setComplianceDocs((prev) => [...prev, { name: file.name, url: res.url }]);
              toast.success("Documento anexado com sucesso!");
            }
          }
        } catch (err: any) {
          toast.error(err.message || "Erro no upload.");
        } finally {
          setIsUploadingLogo(false);
          setIsUploadingBanner(false);
          setIsUploadingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingLogo(false);
      setIsUploadingBanner(false);
      setIsUploadingDoc(false);
      toast.error("Falha ao ler arquivo.");
    }
  };

  const handleToggleNeighborhood = (index: number) => {
    setNeighborhoods((prev) =>
      prev.map((item, i) => (i === index ? { ...item, active: !item.active } : item))
    );
  };

  const handleUpdateNeighborhoodFee = (index: number, feeCents: number) => {
    setNeighborhoods((prev) =>
      prev.map((item, i) => (i === index ? { ...item, defaultFeeCents: feeCents } : item))
    );
  };

  const handleSubmitAll = async () => {
    if (!name || name.trim().length < 2) {
      toast.error("Informe o nome do seu negócio.");
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      // Montar horários de atendimento padrão da semana
      const workingHours = {
        mon: { open: true, intervals: [{ from: openTime, to: closeTime }] },
        tue: { open: true, intervals: [{ from: openTime, to: closeTime }] },
        wed: { open: true, intervals: [{ from: openTime, to: closeTime }] },
        thu: { open: true, intervals: [{ from: openTime, to: closeTime }] },
        fri: { open: true, intervals: [{ from: openTime, to: closeTime }] },
        sat: { open: true, intervals: [{ from: openTime, to: closeTime }] },
        sun: { open: false, intervals: [] },
      };

      const result = await provisionBusiness({
        data: {
          name: name.trim(),
          type: selectedSegment.id as any,
          document: docNumber ? docNumber.trim() : undefined,
          city,
          state,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          logoUrl: logoUrl || undefined,
          bannerUrl: bannerUrl || undefined,
          workingHours,
          deliveryZones: neighborhoods.filter((n) => n.active),
          complianceDocuments: complianceDocs,
        },
      });

      if (result?.storeId) {
        window.document.cookie = `wider_active_tenant=${result.storeId}; path=/; max-age=31536000; SameSite=Lax`;
      }

      toast.success("Loja criada com sucesso! Bem-vindo.");
      window.location.href = "/workspace";
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) || "Erro ao cadastrar negócio."
      );
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { number: 1, label: "Segmento" },
    { number: 2, label: "Identificação" },
    { number: 3, label: "Identidade Visual" },
    { number: 4, label: "Operação & Entrega" },
    { number: 5, label: "Documentos" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-6 animate-in fade-in duration-200">
      {/* ── Sub-Header & Menu Tabs de Onboarding ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 ">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">
              {step === 1
                ? "Qual é o segmento do seu negócio?"
                : `Cadastrar Loja • ${selectedSegment.title}`}
            </h1>
          </div>
        </div>

        {/* Stepper Tabs no Topo */}
        <div className="overflow-x-auto no-scrollbar scrollbar-none py-1">
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl  min-w-max">
            {stepsList.map((s) => {
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              const canGo = s.number === 1 || Boolean(name || step >= s.number);

              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => canGo && setStep(s.number as OnboardingStep)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-foreground text-background "
                      : isCompleted
                      ? "bg-card text-foreground "
                      : "text-muted-foreground/60"
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full flex items-center justify-center text-[10px] font-mono",
                      isActive
                        ? "bg-background text-foreground"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check size={10} strokeWidth={3} /> : s.number}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ETAPA 1: ESCOLHA DO SEGMENTO ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {BUSINESS_SEGMENTS.map((seg) => {
              const Icon = seg.icon;
              const isSelected = selectedSegmentId === seg.id;

              return (
                <div
                  key={seg.id}
                  onClick={() => {
                    setSelectedSegmentId(seg.id);
                    setStep(2);
                  }}
                  className={cn(
                    "group p-4 rounded-2xl border bg-card hover:bg-muted/30 cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ",
                    isSelected ? "border-primary ring-1 ring-primary" : "border-border/80"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "size-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                          seg.iconBg,
                          seg.iconColor
                        )}
                      >
                        <Icon className="size-5 stroke-[2]" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                      >
                        {seg.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {seg.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {seg.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 flex items-center justify-between text-xs font-bold text-primary ">
                    <span>Selecionar e Continuar</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ETAPA 2: DADOS BÁSICOS & CIDADE COM SELECT ── */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl  bg-card  space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-foreground">
                Nome da Loja / Negócio *
              </Label>
              <Input
                id="name"
                placeholder="Ex: Hamburgueria Central, LOV Modas, Emporio dos Pães..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoFocus
                className="rounded-xl text-sm h-11"
              />
            </div>

            {/* SELETOR DE ESTADO E CIDADE DO BRASIL */}
            <CitySelect
              stateValue={state}
              cityValue={city}
              onStateChange={setState}
              onCityChange={setCity}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-foreground">
                  WhatsApp Comercial *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(49) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl text-sm h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="document" className="text-xs font-bold text-foreground">
                  CNPJ ou CPF <span className="text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Input
                  id="document"
                  placeholder="00.000.000/0001-00"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="rounded-xl text-sm h-11"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-bold text-foreground">
                  Endereço da Sede / Balcão <span className="text-muted-foreground font-normal">(Rua e Número)</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Ex: Av. Getúlio Vargas, 1000 - Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl text-sm h-11"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-xl text-xs font-bold h-10 px-5"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  toast.error("Informe o nome do seu negócio.");
                  return;
                }
                setStep(3);
              }}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-foreground text-background cursor-pointer"
            >
              <span>Avançar: Identidade Visual</span>
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ETAPA 3: IDENTIDADE VISUAL & MÍDIA ── */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl  bg-card  space-y-5">
            {/* Banner de Capa */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Capa de Cabeçalho (Banner da Loja)</Label>
              <div className="relative h-36 w-full rounded-2xl  overflow-hidden bg-muted/40 group flex items-center justify-center">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Capa" className="size-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground space-y-1">
                    <ImageIcon className="size-7 mx-auto opacity-40" />
                    <p className="text-xs">Nenhum banner selecionado</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
                  {isUploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{bannerUrl ? "Alterar Capa" : "Upload de Capa"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "banner")}
                  />
                </label>
              </div>
            </div>

            {/* Logotipo Oficial */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Logotipo Oficial da Loja</Label>
              <div className="flex items-center gap-4">
                <div className="relative size-20 rounded-2xl  overflow-hidden bg-muted/50 shrink-0 group flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="size-full object-cover" />
                  ) : (
                    <Store className="size-7 text-muted-foreground opacity-40" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                    {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "logo")}
                    />
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Formato Quadrado (Recomendado 500x500px)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Aparece no topo do cardápio, recibos de pedidos e vitrine pública.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="rounded-xl text-xs font-bold h-10 px-5"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-foreground text-background cursor-pointer"
            >
              <span>Avançar: Operação & Entrega</span>
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ETAPA 4: OPERAÇÃO & TABELA DE BAIRROS DE ENTREGA ── */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl  bg-card  space-y-5">
            {/* Modalidades de Atendimento */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setHasDelivery(!hasDelivery)}
                className={cn(
                  "p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                  hasDelivery ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card border-border/80"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Truck size={18} className="text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Delivery Próprio</p>
                    <p className="text-[10px] text-muted-foreground">Entregas por Bairro</p>
                  </div>
                </div>
                <Switch checked={hasDelivery} onCheckedChange={setHasDelivery} />
              </div>

              <div
                onClick={() => setHasPickup(!hasPickup)}
                className={cn(
                  "p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all",
                  hasPickup ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card border-border/80"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Store size={18} className="text-primary" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Retirada no Balcão</p>
                    <p className="text-[10px] text-muted-foreground">Grátis para o cliente</p>
                  </div>
                </div>
                <Switch checked={hasPickup} onCheckedChange={setHasPickup} />
              </div>
            </div>

            {/* Horário Padrão de Atendimento */}
            <div className="space-y-2 pt-1 ">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock size={13} className="text-primary" /> Horário Diário de Funcionamento
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-bold">Abertura</Label>
                  <Input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-bold">Fechamento</Label>
                  <Input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tabela de Bairros de Chapecó e Região */}
            {hasDelivery && (
              <div className="space-y-2.5 pt-2 ">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-foreground">
                      Tabela de Bairros Atendidos ({city})
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Ative ou desative bairros e ajuste os valores de entrega.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold font-mono">
                    {neighborhoods.filter((n) => n.active).length} Bairros Ativos
                  </Badge>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-border/30">
                  {neighborhoods.map((neigh, index) => (
                    <div
                      key={neigh.name}
                      className={cn(
                        "pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs",
                        !neigh.active && "opacity-40"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Switch
                          checked={neigh.active}
                          onCheckedChange={() => handleToggleNeighborhood(index)}
                        />
                        <span className="font-bold text-foreground truncate">{neigh.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">Taxa:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-bold">R$</span>
                          <input
                            type="number"
                            step="0.5"
                            value={(neigh.defaultFeeCents / 100).toFixed(2)}
                            onChange={(e) =>
                              handleUpdateNeighborhoodFee(
                                index,
                                Math.round(Number(e.target.value) * 100)
                              )
                            }
                            className="w-16 h-7 text-xs font-mono font-bold px-1.5 rounded-lg  bg-card text-right outline-none"
                            disabled={!neigh.active}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="rounded-xl text-xs font-bold h-10 px-5"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() => setStep(5)}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-foreground text-background cursor-pointer"
            >
              <span>Avançar: Documentação</span>
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ETAPA 5: CONFORMIDADE & DOCUMENTOS DA EMPRESA ── */}
      {step === 5 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl  bg-card  space-y-5">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                Documentos da Empresa
              </h2>
              <p className="text-xs text-muted-foreground">
                Envie documentos como CNPJ ou identidade se desejar adiantar a verificação da loja.
              </p>
            </div>

            {/* Upload de Documentos */}
            <div className="border-0 rounded-2xl p-6 text-center space-y-3 bg-muted/20">
              <FileText className="size-8 mx-auto text-muted-foreground opacity-50" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Anexar Documentos (PDF, PNG ou JPG)</p>
                <p className="text-[10px] text-muted-foreground">
                  Comprovante de CNPJ, Alvará ou Documento de Identidade
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card  text-xs font-bold text-foreground hover:bg-muted cursor-pointer ">
                {isUploadingDoc ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>Selecionar Arquivo</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "doc")}
                />
              </label>
            </div>

            {/* Lista de Documentos Anexados */}
            {complianceDocs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Documentos Anexados:</Label>
                <div className="space-y-1.5">
                  {complianceDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl  bg-muted/30 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-primary shrink-0" />
                        <span className="font-bold text-foreground truncate">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setComplianceDocs((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                        aria-label="Remover Documento"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(4)}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl text-xs font-bold h-11 px-5"
            >
              Voltar
            </Button>

            <Button
              type="button"
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              size="lg"
              className="w-full sm:w-auto rounded-xl text-xs font-bold h-11 px-8 gap-2 bg-primary text-primary-foreground  cursor-pointer active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Criando sua loja...</span>
                </>
              ) : (
                <>
                  <span>Criar Loja</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
