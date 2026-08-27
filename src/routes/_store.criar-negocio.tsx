import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  Clock,
  Truck,
  FileText,
  Trash2,
  Plus,
  Users,
  Mail,
  Shield,
  CheckCircle2,
  Search,
  CheckCircle,
  Building2,
  ChevronRight,
  UserPlus,
  Bike,
  ShieldCheck,
  Zap,
  BadgePercent,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySelect } from "@/components/ui/city-select";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  BUSINESS_SEGMENTS,
  BUSINESS_CATEGORIES,
  type BusinessSegment,
} from "@/lib/constants/business-segments";
import { CHAPECO_NEIGHBORHOODS, type NeighborhoodPreset } from "@/lib/constants/cities";
import { provisionBusiness } from "@/services/onboarding.functions";
import { uploadStoreMedia } from "@/services/storage.functions";
import { getUserSession } from "@/services/auth.functions";
import { getPublicLogisticsPresentation } from "@/services/master.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/criar-negocio")({
  head: () => ({ meta: [{ title: "Cadastrar Nova Loja / Negócio | Wider" }] }),
  validateSearch: (search: Record<string, unknown>): { segment?: string } => {
    return {
      segment: (search.segment as string) || undefined,
    };
  },
  loader: async () => {
    const logisticsInfo = await getPublicLogisticsPresentation().catch(() => null);
    return { logisticsInfo };
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

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface InvitedTeamMember {
  email: string;
  fullName: string;
  role: "admin" | "manager" | "seller" | "finance" | "content" | "support" | "stock";
}

function CriarNegocioPage() {
  const { logisticsInfo } = Route.useLoaderData();
  const search = Route.useSearch();
  const initialSegment = search?.segment || "";
  const foundInitial = BUSINESS_SEGMENTS.find((s) => s.id === initialSegment);

  const [step, setStep] = useState<OnboardingStep>(foundInitial ? 2 : 1);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(
    foundInitial ? foundInitial.id : "gastronomy"
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Etapa 4: Operação & Entrega
  const [hasDelivery, setHasDelivery] = useState(true);
  const [hasPickup, setHasPickup] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodPreset[]>(CHAPECO_NEIGHBORHOODS);
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("23:00");

  // Etapa 5: Documentos Opcionais
  const [complianceDocs, setComplianceDocs] = useState<Array<{ name: string; url: string }>>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Etapa 6: Equipe & Membros
  const [teamMembers, setTeamMembers] = useState<InvitedTeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<InvitedTeamMember["role"]>("seller");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSegment =
    BUSINESS_SEGMENTS.find((s) => s.id === selectedSegmentId) || BUSINESS_SEGMENTS[0];

  // Filtro de nichos na Etapa 1
  const filteredSegments = useMemo(() => {
    return BUSINESS_SEGMENTS.filter((seg) => {
      const matchesCategory =
        activeCategoryFilter === "todas" || seg.category === activeCategoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        seg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryFilter, searchQuery]);

  const handleSelectNicheAndProceed = (nicheId: string) => {
    setSelectedSegmentId(nicheId);
    setStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
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
            setComplianceDocs((prev) => [...prev, { name: file.name, url: res.url }]);
            toast.success("Documento anexado com sucesso!");
          }
        } catch (err: any) {
          toast.error(err.message || "Erro no upload.");
        } finally {
          setIsUploadingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
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

  const handleAddTeamMember = () => {
    const cleanEmail = newMemberEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Informe um e-mail válido para o colaborador.");
      return;
    }

    if (teamMembers.some((m) => m.email === cleanEmail)) {
      toast.error("Este e-mail já foi adicionado à lista.");
      return;
    }

    setTeamMembers((prev) => [
      ...prev,
      {
        email: cleanEmail,
        fullName: newMemberName.trim(),
        role: newMemberRole,
      },
    ]);
    setNewMemberEmail("");
    setNewMemberName("");
    setNewMemberRole("seller");
    toast.success("Membro adicionado à lista de convites!");
  };

  const handleRemoveTeamMember = (emailToRemove: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.email !== emailToRemove));
  };

  const handleSubmitAll = async () => {
    if (!name || name.trim().length < 2) {
      toast.error("Informe o nome do seu negócio.");
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
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
          deliveryZones: hasDelivery ? neighborhoods.filter((n) => n.active) : [],
          complianceDocuments: complianceDocs,
          teamMembers: teamMembers.length > 0 ? teamMembers : undefined,
        },
      });

      if (result?.storeId) {
        window.document.cookie = `wider_active_tenant=${result.storeId}; path=/; max-age=31536000; SameSite=Lax`;
      }

      toast.success("Negócio cadastrado com sucesso! Bem-vindo ao Workspace.");
      window.location.href = "/workspace";
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) || "Erro ao cadastrar negócio."
      );
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { number: 1, label: "Nicho" },
    { number: 2, label: "Identificação" },
    { number: 3, label: "Identidade Visual" },
    { number: 4, label: "Operação" },
    { number: 5, label: "Documentos" },
    { number: 6, label: "Equipe" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-4 space-y-6 animate-in fade-in duration-200">
      {/* ── Top Navigation Bar / Stepper Ampliado ── */}
      {step > 1 && (
        <div className="bg-card p-4 rounded-3xl border border-border/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((prev) => Math.max(1, prev - 1) as OnboardingStep)}
                className="h-8 rounded-xl px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                <span>Voltar</span>
              </Button>
              <div className="h-4 w-px bg-border/80" />
              <div className="flex items-center gap-2">
                <div className={cn("size-6 rounded-lg flex items-center justify-center text-xs font-bold", selectedSegment.iconBg, selectedSegment.iconColor)}>
                  <selectedSegment.icon className="size-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
                  {name || selectedSegment.title}
                </span>
                <Badge variant="outline" className="text-[10px] hidden sm:inline-flex bg-muted/30">
                  {selectedSegment.badge}
                </Badge>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="h-8 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground ml-auto sm:ml-0"
            >
              Trocar Segmento
            </Button>
          </div>

          {/* Stepper Horizontal Limpo & Ampliado */}
          <div className="overflow-x-auto no-scrollbar scrollbar-none pt-1">
            <div className="grid grid-cols-6 gap-2 min-w-[580px]">
              {stepsList.map((s) => {
                const isActive = step === s.number;
                const isPassed = step > s.number;

                return (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => {
                      if (isPassed || s.number === 1) {
                        setStep(s.number as OnboardingStep);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left transition-all",
                      isActive && "bg-primary text-primary-foreground font-bold ",
                      isPassed && "bg-muted/40 text-foreground hover:bg-muted/60 cursor-pointer",
                      !isActive && !isPassed && "text-muted-foreground/60 opacity-60 cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "size-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        isActive && "bg-white/20 text-white",
                        isPassed && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        !isActive && !isPassed && "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {isPassed ? <Check className="size-3.5" /> : s.number}
                    </div>
                    <span className="text-xs truncate font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 1: SELETOR DE NICHOS COM STORY CARDS EM CARROSSEL ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Header da Etapa 1 */}
          <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1">
              Etapa 1 • Escolha seu Nicho
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Qual é o modelo do seu negócio?
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecione o segmento principal para configurarmos automaticamente o catálogo, estoque, PDV e regras operacionais.
            </p>
          </div>

          {/* Filtros e Busca Rápida */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70">
            {/* Categorias Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
              {BUSINESS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
                    activeCategoryFilter === cat.id
                      ? "bg-foreground text-background font-bold"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Busca Rápida */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar segmento..."
                className="h-9 pl-9 rounded-xl text-xs bg-background"
              />
            </div>
          </div>

          {/* Grid / Carrosséis de Story Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSegments.map((segment) => {
              const isSelected = selectedSegmentId === segment.id;
              const IconComp = segment.icon;

              return (
                <div
                  key={segment.id}
                  onClick={() => handleSelectNicheAndProceed(segment.id)}
                  className={cn(
                    "group relative h-[360px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border flex flex-col justify-between p-5 select-none active:scale-[0.98]",
                    isSelected
                      ? "border-primary ring-2 ring-primary "
                      : "border-border/80 hover:border-foreground/40 hover:"
                  )}
                >
                  {/* Imagem de Fundo em Alta Resolução */}
                  <img
                    src={segment.coverImage}
                    alt={segment.title}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradiente Escurecido de Contraste */}
                  <div className={cn("absolute inset-0 bg-gradient-to-b opacity-90 transition-opacity group-hover:opacity-95", segment.gradient)} />

                  {/* Topo do Story Card */}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <div className={cn("size-10 rounded-2xl flex items-center justify-center backdrop-blur-md bg-black/40 border border-white/20 text-white")}>
                      <IconComp className="size-5" />
                    </div>
                    <Badge className="bg-white/15 backdrop-blur-md text-white border-white/20 text-[10px] font-bold px-2.5 py-1">
                      {segment.badge}
                    </Badge>
                  </div>

                  {/* Base do Story Card */}
                  <div className="relative z-10 space-y-2.5 text-white">
                    <div>
                      <h3 className="font-bold text-base tracking-tight leading-snug">
                        {segment.title}
                      </h3>
                      <p className="text-xs text-white/80 line-clamp-2 mt-1 leading-relaxed">
                        {segment.shortDesc}
                      </p>
                    </div>

                    {/* Módulos em Micro-Pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {segment.modules.slice(0, 2).map((mod, mIdx) => (
                        <span
                          key={mIdx}
                          className="text-[10px] bg-black/40 backdrop-blur-sm border border-white/15 text-white/90 px-2 py-0.5 rounded-full"
                        >
                          ✓ {mod}
                        </span>
                      ))}
                    </div>

                    {/* Botão de Ação no Hover */}
                    <div className="pt-2">
                      <div className="w-full py-2 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-transform group-hover:translate-x-0.5">
                        <span>Selecionar & Avançar</span>
                        <ChevronRight className="size-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSegments.length === 0 && (
            <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border/80 space-y-2">
              <p className="text-sm font-bold text-foreground">Nenhum segmento encontrado</p>
              <p className="text-xs text-muted-foreground">
                Tente buscar com outros termos ou selecione "Todos os Segmentos".
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategoryFilter("todas");
                  setSearchQuery("");
                }}
                className="mt-2 rounded-xl text-xs font-bold"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 2: IDENTIFICAÇÃO & LOCALIZAÇÃO ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-6">
            <div className="space-y-1 pb-2 border-b border-border/60">
              <h2 className="text-lg font-bold text-foreground">Identificação do Negócio</h2>
              <p className="text-xs text-muted-foreground">
                Informe o nome oficial e a localização onde sua unidade atenderá clientes e entregas.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nome da Loja / Estabelecimento *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Armazém do Sabor, Boutique Chic, Dr. Pet..."
                  className="h-11 rounded-xl text-sm bg-background font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    CNPJ ou CPF (Opcional)
                  </Label>
                  <Input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="h-11 rounded-xl text-xs bg-background font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    WhatsApp / Telefone de Contato
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(49) 99999-9999"
                    className="h-11 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  E-mail Comercial da Loja
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@sualoja.com.br"
                  className="h-11 rounded-xl text-xs bg-background"
                />
              </div>

              {/* Seletor de Cidades Canônico */}
              <div className="space-y-1.5 pt-2">
                <CitySelect
                  stateValue={state}
                  cityValue={city}
                  onStateChange={(uf: string) => setState(uf)}
                  onCityChange={(c: string) => setCity(c)}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Endereço Físico (Rua, Número, Bairro)
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Av. Getúlio Vargas, 1200 - Centro"
                  className="h-11 rounded-xl text-xs bg-background"
                />
              </div>
            </div>

            {/* Ações da Etapa 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="rounded-xl text-xs font-bold gap-1"
              >
                <ArrowLeft className="size-3.5" /> Escolher outro nicho
              </Button>
              <Button
                onClick={() => {
                  if (!name.trim()) {
                    toast.error("Informe o nome do seu negócio.");
                    return;
                  }
                  setStep(3);
                }}
                className="rounded-xl text-xs font-bold h-11 px-6 gap-2"
              >
                <span>Avançar para Identidade Visual</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 3: IDENTIDADE VISUAL COM CROPPER & ZOOM ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-6">
            <div className="space-y-1 pb-2 border-b border-border/60">
              <h2 className="text-lg font-bold text-foreground">Identidade Visual da Loja</h2>
              <p className="text-xs text-muted-foreground">
                Personalize a capa panorâmica e o logotipo oficial. Use o controle de corte e zoom interativo.
              </p>
            </div>

            <div className="space-y-6">
              {/* Banner de Capa (21:9) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Capa de Cabeçalho (Banner da Loja)</Label>
                <ImageUpload
                  value={bannerUrl}
                  onChange={(url) => {
                    setBannerUrl(url);
                    toast.success("Capa da loja configurada!");
                  }}
                  onRemove={() => setBannerUrl("")}
                  bucket="cms-media"
                  aspectPreset="banner"
                  className="w-full"
                  helperText="Formato panorâmico (21:9 / 16:9). Arraste ou dê zoom no diálogo de enquadramento."
                />
              </div>

              {/* Logotipo Oficial (1:1) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Logotipo Oficial da Loja</Label>
                <div className="flex items-center gap-4">
                  <ImageUpload
                    value={logoUrl}
                    onChange={(url) => {
                      setLogoUrl(url);
                      toast.success("Logotipo atualizado!");
                    }}
                    onRemove={() => setLogoUrl("")}
                    bucket="cms-media"
                    aspectPreset="square"
                    className="w-24 h-24 shrink-0"
                    helperText="Quadrado (1:1)"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Formato Quadrado (Recomendado 512x512px)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Aparece no topo do catálogo, nos comprovantes de pedidos e nas buscas da vitrine.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações da Etapa 3 */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="rounded-xl text-xs font-bold gap-1"
              >
                <ArrowLeft className="size-3.5" /> Voltar aos dados
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="rounded-xl text-xs font-bold h-11 px-6 gap-2"
              >
                <span>Avançar para Operação & Entrega</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 4: OPERAÇÃO & LOGÍSTICA ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 4: OPERAÇÃO & LOGÍSTICA (MOTOLINK / ENTREGA INTEGRADA) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* 1. Banner & Apresentação de Logística Democratizada */}
          <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-sm">
            {/* Imagem Responsiva com Tag Picture */}
            <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-muted">
              <picture>
                {logisticsInfo?.image_mobile_url && (
                  <source
                    media="(max-width: 640px)"
                    srcSet={logisticsInfo.image_mobile_url}
                  />
                )}
                {logisticsInfo?.image_tablet_url && (
                  <source
                    media="(max-width: 1024px)"
                    srcSet={logisticsInfo.image_tablet_url}
                  />
                )}
                <img
                  src={
                    logisticsInfo?.image_desktop_url ||
                    "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1600&q=80"
                  }
                  alt="Logística Integrada e Entregadores"
                  className="size-full object-cover"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Informações Sobrepostas no Banner */}
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 border-none shadow-sm">
                    {logisticsInfo?.badge || "Zero Taxa de Intermediação"}
                  </Badge>
                  <span className="text-[11px] text-white/80 font-medium">
                    Rede Aberta & Descentralizada
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  {logisticsInfo?.title || "Logística Integrada & MotoLink"}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
                  {logisticsInfo?.subtitle ||
                    "Você não precisa ter motoboy próprio nem pagar taxas abusivas. Conecte-se aos entregadores autônomos da sua cidade com 1 clique."}
                </p>
              </div>
            </div>

            {/* Grid de 4 Pilares da Entrega Democratizada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5 bg-card/60 divide-y sm:divide-y-0 sm:divide-x divide-border/50 border-t border-border/60">
              <div className="pt-3 sm:pt-0 sm:px-3 space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BadgePercent className="size-3.5 text-emerald-500 shrink-0" />
                  <span>Sem Taxa de Frete</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Economize até 30% por entrega. O valor vai 100% para o condutor.
                </p>
              </div>

              <div className="pt-3 sm:pt-0 sm:px-3 space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  <span>Ficha do Motoboy</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Consulte foto, placa, modelo da moto, contato e avaliações reais.
                </p>
              </div>

              <div className="pt-3 sm:pt-0 sm:px-3 space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-sky-500 shrink-0" />
                  <span>Frota de Confiança</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Favorite seus entregadores parceiros e bloqueie condutores indesejados.
                </p>
              </div>

              <div className="pt-3 sm:pt-0 sm:px-3 space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="size-3.5 text-amber-500 shrink-0" />
                  <span>MotoLink em 1 Clique</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Despache pedidos gerando link GPS no WhatsApp do motoboy e cliente.
                </p>
              </div>
            </div>

            {/* Ficha Ilustrativa do Motoboy & Disclaimer de Transparência */}
            <div className="p-5 bg-muted/20 border-t border-border/60 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    <Bike className="size-6" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-foreground">Exemplo: Ficha de Entregador Parceiro</p>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-bold">
                        Selo Verificado
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Honda CG 160 Fan • Placa: ABC-1D23 • WhatsApp verificado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs font-bold gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    <span>4.9 (218 entregas)</span>
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Favorito em 14 lojas
                  </Badge>
                </div>
              </div>

              {/* Termo de Esclarecimento Legal */}
              <div className="p-3.5 rounded-2xl bg-background border border-border/60 text-[11px] text-muted-foreground leading-relaxed space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Transparência da Plataforma Wider</span>
                </p>
                <p>
                  {logisticsInfo?.disclaimer ||
                    "A Wider é uma infraestrutura tecnológica aberta. Não intermediamos pagamentos de fretes nem cobramos comissão entre entregadores e empresas. A relação comercial e operacional é direta e independente entre as partes."}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Configurações Operacionais da Loja */}
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-6">
            <div className="space-y-1 pb-2 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground">Configurações de Atendimento da Loja</h3>
              <p className="text-xs text-muted-foreground">
                Selecione as modalidades que sua loja atenderá no catálogo e defina horários de funcionamento.
              </p>
            </div>

            <div className="space-y-5">
              {/* Modalidades de Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Truck className="size-4 text-primary" />
                      <span>Delivery & MotoLink</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Entregas no endereço do cliente via motoboys ou frota própria.
                    </p>
                  </div>
                  <Switch checked={hasDelivery} onCheckedChange={setHasDelivery} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Store className="size-4 text-primary" />
                      <span>Retirada no Balcão</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Permita que clientes retirem pessoalmente na sua loja.
                    </p>
                  </div>
                  <Switch checked={hasPickup} onCheckedChange={setHasPickup} />
                </div>
              </div>

              {/* Horário de Atendimento */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Horário Padrão de Atendimento</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Abertura</span>
                    <Input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-background font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Fechamento</span>
                    <Input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="h-10 rounded-xl text-xs bg-background font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bairros e Taxas de Entrega */}
              {hasDelivery && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      Bairros Atendidos & Taxas de Entrega ({city})
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {neighborhoods.filter((n) => n.active).length} de {neighborhoods.length} bairros
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-border/70 divide-y divide-border/40 bg-background/50">
                    {neighborhoods.map((n, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/20"
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={n.active}
                            onChange={() => handleToggleNeighborhood(idx)}
                            className="rounded border-border text-primary size-4"
                          />
                          <span className={cn(n.active ? "font-medium text-foreground" : "text-muted-foreground line-through")}>
                            {n.name}
                          </span>
                        </label>

                        {n.active && (
                          <div className="flex items-center gap-1.5 w-28">
                            <CurrencyField
                              compact
                              currencySymbol="R$"
                              allowZero={true}
                              value={n.defaultFeeCents}
                              onChange={(cents) =>
                                handleUpdateNeighborhoodFee(idx, cents ?? 0)
                              }
                              placeholder="0,00"
                              className="w-full h-7 text-xs rounded-lg font-mono text-right"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ações da Etapa 4 */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setStep(3)}
                className="rounded-xl text-xs font-bold gap-1"
              >
                <ArrowLeft className="size-3.5" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(5)}
                className="rounded-xl text-xs font-bold h-11 px-6 gap-2"
              >
                <span>Avançar para Documentos</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 5: DOCUMENTOS OPCIONAIS & COMPLIANCE ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-6">
            <div className="space-y-1 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Documentos & Regularização</h2>
                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Anexe cartão CNPJ, alvarás ou documentos de sócios. Você também pode anexar depois nas configurações.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-dashed border-border/80 rounded-2xl p-6 text-center bg-background/50 hover:bg-muted/20 transition-colors">
                <FileText className="size-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-xs font-bold text-foreground">
                  Anexar Cartão CNPJ, Alvará ou Contrato Social
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Formatos aceitos: PDF, PNG ou JPG (até 10MB)
                </p>
                <label className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity">
                  {isUploadingDoc ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  <span>{isUploadingDoc ? "Enviando..." : "Selecionar Arquivo"}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleDocUpload}
                    disabled={isUploadingDoc}
                  />
                </label>
              </div>

              {complianceDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">Documentos Anexados ({complianceDocs.length})</p>
                  <div className="space-y-1.5">
                    {complianceDocs.map((doc, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="size-4 text-primary shrink-0" />
                          <span className="font-medium truncate">{doc.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setComplianceDocs((prev) => prev.filter((_, i) => i !== dIdx))}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ações da Etapa 5 */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setStep(4)}
                className="rounded-xl text-xs font-bold gap-1"
              >
                <ArrowLeft className="size-3.5" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(6)}
                className="rounded-xl text-xs font-bold h-11 px-6 gap-2"
              >
                <span>Avançar para Convite de Equipe</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ETAPA 6: CONVITE DE EQUIPE & PERMISSÕES ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/70 space-y-6">
            <div className="space-y-1 pb-2 border-b border-border/60">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Equipe & Permissões</h2>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                  Última Etapa
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Convide sócios, gerentes, atendentes e operadores. Usuários existentes recebem acesso imediato; novos usuários recebem link para definir senha.
              </p>
            </div>

            {/* Formulário de Adição de Membro */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserPlus className="size-3.5 text-primary" />
                <span>Adicionar Colaborador à Loja</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">E-mail do Colaborador *</Label>
                  <Input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="colaborador@email.com"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nome (Opcional)</Label>
                  <Input
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Nome completo"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Cargo / Papel</Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(val: any) => setNewMemberRole(val)}
                  >
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="seller">Vendedor / PDV</SelectItem>
                      <SelectItem value="finance">Financeiro</SelectItem>
                      <SelectItem value="stock">Estoquista</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTeamMember}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Plus className="size-3.5" /> Adicionar à Lista
                </Button>
              </div>
            </div>

            {/* Lista de Membros Adicionados */}
            {teamMembers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground">
                  Membros Prontos para Convite ({teamMembers.length})
                </p>
                <div className="space-y-2">
                  {teamMembers.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border/70 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {m.fullName ? m.fullName.charAt(0).toUpperCase() : m.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{m.fullName || m.email}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{m.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold capitalize bg-muted/40">
                          {m.role === "admin"
                            ? "Administrador"
                            : m.role === "manager"
                            ? "Gerente"
                            : m.role === "seller"
                            ? "Vendedor"
                            : m.role === "finance"
                            ? "Financeiro"
                            : m.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTeamMember(m.email)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-border/70 space-y-1">
                <Users className="size-6 mx-auto text-muted-foreground opacity-40 mb-1" />
                <p className="text-xs font-medium text-foreground">Nenhum membro adicionado ainda</p>
                <p className="text-[11px] text-muted-foreground">
                  Você também pode convidar sócios e colaboradores a qualquer momento pelo menu de Configurações da Loja.
                </p>
              </div>
            )}

            {/* Ações Finais */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border/60">
              <Button
                variant="ghost"
                onClick={() => setStep(5)}
                disabled={isSubmitting}
                className="w-full sm:w-auto rounded-xl text-xs font-bold gap-1 order-2 sm:order-1"
              >
                <ArrowLeft className="size-3.5" /> Voltar
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  onClick={handleSubmitAll}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-xl text-xs font-bold h-11 px-8 gap-2 bg-primary text-primary-foreground "
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Criando Loja & Provisionando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      <span>Concluir e Abrir Meu Negócio</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
