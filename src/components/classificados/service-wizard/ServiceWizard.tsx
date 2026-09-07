import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Save, ArrowLeft, ArrowRight, Plus, Trash2, Upload, ImageIcon, GripVertical, Clock, MapPin, Calendar, Settings, Wrench, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useCreateAd, useCategories, uploadAdPhoto } from "@/hooks/useAds";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES ───
interface PackageItem {
  name: string;
  description: string;
  includes: string[];
  price: string;
  duration: string;
}

interface AdditionalCost {
  name: string;
  value: string;
  type: "fixed" | "variable";
}

interface ServiceForm {
  // Tab 1 — Offering
  photos: string[];
  beforeAfter: { before: string; after: string }[];
  serviceType: string;
  title: string;
  description: string;
  included: string[];
  notIncluded: string[];
  differentials: string[];
  // Tab 2 — Pricing
  pricingModel: string;
  fixedPrice: string;
  hourlyRate: string;
  minHours: string;
  unitRate: string;
  unitType: string;
  packages: PackageItem[];
  additionalCosts: AdditionalCost[];
  regionPricingEnabled: boolean;
  regionPricing: { region: string; basePrice: string; extraFee: string }[];
  // Tab 3 — Location
  serviceModes: string[];
  cities: string[];
  neighborhoods: string[];
  maxRadius: number;
  travelFeeEnabled: boolean;
  travelFeePerKm: string;
  requiresTeam: boolean;
  teamSize: string;
  teamProfiles: string[];
  autoWorkOrder: boolean;
  requiresProducts: boolean;
  // Tab 4 — Schedule
  defaultDuration: string;
  customDurationEnabled: boolean;
  customDuration: string;
  bufferTime: string;
  simultaneousSlots: string;
  scheduleType: string;
  confirmationType: string;
  confirmDeadline: string;
  minAdvance: string;
  maxFutureDays: string;
  availableSlots: Record<string, { active: boolean; start: string; end: string }>;
  // Tab 5 — Extras
  warrantyEnabled: boolean;
  warrantyPeriod: string;
  warrantyDescription: string;
  cancellationPolicy: string;
  lateCancelFeeEnabled: boolean;
  lateCancelFeePercent: string;
  autoContractEnabled: boolean;
  contractTemplate: string;
  budgetFormEnabled: boolean;
  budgetFields: string[];
  crossSellProducts: string[];
  responsibleProfessional: string;
  // Common
  city: string;
  neighborhood: string;
  plan: "free" | "featured" | "premium";
}

const TABS = [
  { label: "O que você oferece", icon: Wrench },
  { label: "Como você cobra", icon: DollarSign },
  { label: "Onde e como atende", icon: MapPin },
  { label: "Agenda", icon: Calendar },
  { label: "Configurações", icon: Settings },
] as const;

const SERVICE_TYPES = [
  "Limpeza doméstica", "Manutenção elétrica", "Manutenção hidráulica", "Pintura",
  "Marcenaria", "Jardinagem", "Informática/TI", "Design gráfico", "Fotografia/Vídeo",
  "Saúde e beleza", "Cuidador/Babá", "Professor/Tutor", "Advocacia/Jurídico",
  "Contabilidade", "Pet (banho, tosa)", "Mudança e transporte", "Mecânica automotiva",
  "Ar-condicionado", "Pedreiro/Construção", "Consultoria", "Marketing digital",
  "Costura/Alfaiataria", "Culinária/Chef", "Outro",
];

const DAYS = [
  { key: "seg", label: "Seg" }, { key: "ter", label: "Ter" }, { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" }, { key: "sex", label: "Sex" }, { key: "sab", label: "Sáb" }, { key: "dom", label: "Dom" },
];

const defaultSlots: Record<string, { active: boolean; start: string; end: string }> = Object.fromEntries(
  DAYS.map(d => [d.key, { active: ["seg", "ter", "qua", "qui", "sex"].includes(d.key), start: "08:00", end: "18:00" }])
);

const emptyForm: ServiceForm = {
  photos: [], beforeAfter: [], serviceType: "", title: "", description: "",
  included: [], notIncluded: [], differentials: [],
  pricingModel: "", fixedPrice: "", hourlyRate: "", minHours: "",
  unitRate: "", unitType: "m²", packages: [], additionalCosts: [],
  regionPricingEnabled: false, regionPricing: [],
  serviceModes: [], cities: [], neighborhoods: [], maxRadius: 20,
  travelFeeEnabled: false, travelFeePerKm: "", requiresTeam: false,
  teamSize: "", teamProfiles: [], autoWorkOrder: false, requiresProducts: false,
  defaultDuration: "1h", customDurationEnabled: false, customDuration: "",
  bufferTime: "0", simultaneousSlots: "1", scheduleType: "hora_marcada",
  confirmationType: "manual", confirmDeadline: "24h",
  minAdvance: "2h", maxFutureDays: "30",
  availableSlots: defaultSlots,
  warrantyEnabled: false, warrantyPeriod: "", warrantyDescription: "",
  cancellationPolicy: "24h", lateCancelFeeEnabled: false, lateCancelFeePercent: "",
  autoContractEnabled: false, contractTemplate: "",
  budgetFormEnabled: false, budgetFields: [],
  crossSellProducts: [], responsibleProfessional: "",
  city: "", neighborhood: "", plan: "free",
};

export default function ServiceWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createAd = useCreateAd();
  const { data: dbCategories } = useCategories();

  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [activeTab, setActiveTab] = useState(0);
  const [uploading, setUploading] = useState(false);

  const patch = (p: Partial<ServiceForm>) => setForm(prev => ({ ...prev, ...p }));

  if (!user) {
    return (
      <div className="container py-20 text-center space-y-4">
        <p className="text-lg text-muted-foreground">Você precisa estar logado.</p>
        <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        if (file.size > 20 * 1024 * 1024) { toast.error("Máximo 20MB"); continue; }
        const url = await uploadAdPhoto(user.id, file);
        patch({ photos: [...form.photos, url] });
      }
    } catch (err: any) { toast.error(err.message); }
    setUploading(false);
  };

  const handleBeforeAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after", index: number) => {
    if (!e.target.files?.[0] || !user) return;
    setUploading(true);
    try {
      const url = await uploadAdPhoto(user.id, e.target.files[0]);
      const updated = [...form.beforeAfter];
      if (!updated[index]) updated[index] = { before: "", after: "" };
      updated[index][type] = url;
      patch({ beforeAfter: updated });
    } catch (err: any) { toast.error(err.message); }
    setUploading(false);
  };

  // ─── Dynamic list helpers ───
  const addToList = (key: keyof ServiceForm) => {
    const val = form[key];
    if (Array.isArray(val)) patch({ [key]: [...val, ""] } as any);
  };
  const updateListItem = (key: keyof ServiceForm, i: number, value: string) => {
    const arr = [...(form[key] as string[])];
    arr[i] = value;
    patch({ [key]: arr } as any);
  };
  const removeListItem = (key: keyof ServiceForm, i: number) => {
    const arr = [...(form[key] as string[])];
    arr.splice(i, 1);
    patch({ [key]: arr } as any);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); setActiveTab(0); return; }
    if (!form.serviceType) { toast.error("Tipo de serviço é obrigatório"); setActiveTab(0); return; }

    const category = dbCategories?.find((c) => c.slug === "servicos");

    const features: Record<string, any> = {
      tipo_servico: form.serviceType,
      included: form.included.filter(Boolean),
      not_included: form.notIncluded.filter(Boolean),
      differentials: form.differentials.filter(Boolean),
      pricing_model: form.pricingModel,
      service_modes: form.serviceModes,
      cities: form.cities.filter(Boolean),
      neighborhoods: form.neighborhoods.filter(Boolean),
      max_radius: form.maxRadius,
      travel_fee_enabled: form.travelFeeEnabled,
      travel_fee_per_km: form.travelFeePerKm,
      requires_team: form.requiresTeam,
      team_size: form.teamSize,
      team_profiles: form.teamProfiles.filter(Boolean),
      auto_work_order: form.autoWorkOrder,
      requires_products: form.requiresProducts,
      schedule_type: form.scheduleType,
      confirmation_type: form.confirmationType,
      confirm_deadline: form.confirmDeadline,
      min_advance: form.minAdvance,
      max_future_days: form.maxFutureDays,
      default_duration: form.defaultDuration,
      custom_duration: form.customDuration,
      buffer_time: form.bufferTime,
      simultaneous_slots: form.simultaneousSlots,
      available_slots: form.availableSlots,
      warranty_enabled: form.warrantyEnabled,
      warranty_period: form.warrantyPeriod,
      warranty_description: form.warrantyDescription,
      cancellation_policy: form.cancellationPolicy,
      late_cancel_fee_enabled: form.lateCancelFeeEnabled,
      late_cancel_fee_percent: form.lateCancelFeePercent,
      auto_contract: form.autoContractEnabled,
      contract_template: form.contractTemplate,
      budget_form_enabled: form.budgetFormEnabled,
      budget_fields: form.budgetFields.filter(Boolean),
      cross_sell_products: form.crossSellProducts.filter(Boolean),
      responsible_professional: form.responsibleProfessional,
    };

    const extras: Record<string, any> = {
      packages: form.packages,
      additional_costs: form.additionalCosts,
      region_pricing_enabled: form.regionPricingEnabled,
      region_pricing: form.regionPricing,
      before_after: form.beforeAfter.filter(ba => ba.before || ba.after),
    };

    // Determine price
    let price: number | null = null;
    if (form.pricingModel === "fixed" && form.fixedPrice) price = Number(form.fixedPrice);
    else if (form.pricingModel === "hourly" && form.hourlyRate) price = Number(form.hourlyRate);
    else if (form.pricingModel === "unit" && form.unitRate) price = Number(form.unitRate);
    else if (form.pricingModel === "packages" && form.packages.length > 0 && form.packages[0].price) price = Number(form.packages[0].price);

    const priceType = form.pricingModel === "budget" ? "consult" as const : "fixed" as const;

    try {
      const ad = await createAd.mutateAsync({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price,
        price_type: priceType,
        category_id: category?.id || null,
        subcategory: form.serviceType,
        plan: form.plan,
        photos: form.photos,
        location: { city: form.city.trim(), neighborhood: form.neighborhood.trim() } as any,
        features: features as any,
        extras: extras as any,
      });
      toast.success("Serviço publicado com sucesso!");
      navigate(`/anuncio/${ad.id}`);
    } catch (err: any) { toast.error("Erro ao publicar: " + err.message); }
  };

  // ─── Dynamic list renderer ───
  const renderDynamicList = (key: keyof ServiceForm, placeholder: string, max?: number) => {
    const items = form[key] as string[];
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder={placeholder} value={item} onChange={e => updateListItem(key, i, e.target.value)} className="h-10 text-sm flex-1" />
            <button type="button" onClick={() => removeListItem(key, i)} className="w-10 h-10 rounded-[var(--r2)] border border-border flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(!max || items.length < max) && (
          <button type="button" onClick={() => addToList(key)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        )}
      </div>
    );
  };

  // ─── Pill selector ───
  const renderPills = (options: string[], value: string, onChange: (v: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-xs font-medium border-[1.5px] transition-all ${
            value === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
          }`}>{opt}</button>
      ))}
    </div>
  );

  // ─── Multi pills ───
  const renderMultiPills = (options: string[], values: string[], onChange: (v: string[]) => void) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = values.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => onChange(active ? values.filter(v => v !== opt) : [...values, opt])}
            className={`px-4 py-2 rounded-full text-xs font-medium border-[1.5px] transition-all flex items-center gap-1.5 ${
              active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
            }`}>
            {active && <Check className="w-3 h-3" />}{opt}
          </button>
        );
      })}
    </div>
  );

  // ─── Section card ───
  const Section = ({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) => (
    <div className="bg-card border-[1.5px] border-border rounded-[var(--r5)] p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="container max-w-4xl py-6 space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/criar-anuncio")} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-lg font-[800] text-foreground">Novo Serviço</h1>
        <Button onClick={handleSubmit} disabled={createAd.isPending} size="sm" className="bg-primary text-primary-foreground font-bold gap-1.5">
          <Save className="w-3.5 h-3.5" />
          {createAd.isPending ? "Publicando..." : "Publicar"}
        </Button>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border mb-1 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === i ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
        <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${((activeTab + 1) / TABS.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

          {/* ═══ TAB 1: O QUE VOCÊ OFERECE ═══ */}
          {activeTab === 0 && (
            <div className="space-y-6">
              {/* Photos */}
              <Section title="Fotos & Portfólio" hint="Fotos de trabalhos realizados têm 3x mais contatos">
                {form.photos.length === 0 ? (
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-[var(--r4)] py-12 cursor-pointer hover:border-primary/40 transition-all">
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Clique para adicionar fotos</p>
                    <p className="text-xs text-muted-foreground">Até 20 fotos · Máx. 20MB cada</p>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {form.photos.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-[var(--r3)] overflow-hidden border-[1.5px] border-border group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => patch({ photos: form.photos.filter((_, j) => j !== i) })}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-[var(--r3)] border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 cursor-pointer transition-all">
                        <Upload className="w-5 h-5" />
                        <span className="text-[10px]">{uploading ? "Enviando..." : "Adicionar"}</span>
                        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                {/* Before & After */}
                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-sm font-semibold text-foreground">Antes e Depois</p>
                  {form.beforeAfter.map((ba, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="flex-1 space-y-1">
                        <label className="block">
                          <span className="text-[10px] font-medium text-muted-foreground">Antes</span>
                          {ba.before ? (
                            <div className="w-full h-20 rounded-[var(--r3)] overflow-hidden border border-border relative group">
                              <img src={ba.before} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-20 rounded-[var(--r3)] border-2 border-dashed border-border flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="image/*" onChange={e => handleBeforeAfterUpload(e, "before", i)} className="hidden" />
                            </div>
                          )}
                        </label>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">→</span>
                      <div className="flex-1 space-y-1">
                        <label className="block">
                          <span className="text-[10px] font-medium text-muted-foreground">Depois</span>
                          {ba.after ? (
                            <div className="w-full h-20 rounded-[var(--r3)] overflow-hidden border border-border relative group">
                              <img src={ba.after} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-20 rounded-[var(--r3)] border-2 border-dashed border-border flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="image/*" onChange={e => handleBeforeAfterUpload(e, "after", i)} className="hidden" />
                            </div>
                          )}
                        </label>
                      </div>
                      <button onClick={() => patch({ beforeAfter: form.beforeAfter.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => patch({ beforeAfter: [...form.beforeAfter, { before: "", after: "" }] })}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Adicionar par</button>
                </div>
              </Section>

              {/* Service Type + Title */}
              <Section title="Informações do Serviço">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Tipo de serviço *</label>
                    <select value={form.serviceType} onChange={e => patch({ serviceType: e.target.value })}
                      className="flex h-12 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                      <option value="">Selecione...</option>
                      {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Título do serviço *</label>
                    <Input placeholder="Ex: Instalação e manutenção elétrica residencial" value={form.title} onChange={e => patch({ title: e.target.value })} className="h-12" maxLength={120} />
                    <p className="text-xs text-muted-foreground text-right mt-1">{form.title.length}/120</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Descrição detalhada</label>
                    <Textarea placeholder="Descreva o serviço em detalhes..." value={form.description} onChange={e => patch({ description: e.target.value })} className="min-h-[120px]" maxLength={5000} />
                    <p className="text-xs text-muted-foreground text-right mt-1">{form.description.length}/5000</p>
                  </div>
                </div>
              </Section>

              {/* Included / Not Included / Differentials */}
              <Section title="O que está incluso">
                {renderDynamicList("included", "Ex: Mão de obra, materiais básicos...")}
              </Section>
              <Section title="O que NÃO está incluso">
                {renderDynamicList("notIncluded", "Ex: Materiais especiais, frete...")}
              </Section>
              <Section title="Diferenciais" hint="Máximo 3 diferenciais">
                {renderDynamicList("differentials", "Ex: 10 anos de experiência", 3)}
              </Section>

              {/* Location basic */}
              <Section title="Localização">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Cidade</label>
                    <Input placeholder="São Paulo" value={form.city} onChange={e => patch({ city: e.target.value })} className="h-10" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Bairro</label>
                    <Input placeholder="Centro" value={form.neighborhood} onChange={e => patch({ neighborhood: e.target.value })} className="h-10" />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ═══ TAB 2: COMO VOCÊ COBRA ═══ */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <Section title="Modelo de Preço">
                {renderPills(["Preço fixo", "Por hora", "Por unidade", "Orçamento", "Pacotes"], 
                  form.pricingModel === "fixed" ? "Preço fixo" : form.pricingModel === "hourly" ? "Por hora" : form.pricingModel === "unit" ? "Por unidade" : form.pricingModel === "budget" ? "Orçamento" : form.pricingModel === "packages" ? "Pacotes" : "",
                  (v) => {
                    const map: Record<string, string> = { "Preço fixo": "fixed", "Por hora": "hourly", "Por unidade": "unit", "Orçamento": "budget", "Pacotes": "packages" };
                    patch({ pricingModel: map[v] || "" });
                  }
                )}

                {form.pricingModel === "fixed" && (
                  <div className="pt-4">
                    <label className="text-sm font-medium text-foreground mb-2 block">Preço fixo (R$)</label>
                    <Input type="number" placeholder="150.00" value={form.fixedPrice} onChange={e => patch({ fixedPrice: e.target.value })} className="h-12 text-lg font-bold" />
                  </div>
                )}

                {form.pricingModel === "hourly" && (
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">R$/hora</label>
                      <Input type="number" placeholder="80" value={form.hourlyRate} onChange={e => patch({ hourlyRate: e.target.value })} className="h-12" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Mínimo de horas</label>
                      <Input type="number" placeholder="2" value={form.minHours} onChange={e => patch({ minHours: e.target.value })} className="h-12" />
                    </div>
                  </div>
                )}

                {form.pricingModel === "unit" && (
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">R$ por unidade</label>
                      <Input type="number" placeholder="25" value={form.unitRate} onChange={e => patch({ unitRate: e.target.value })} className="h-12" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Unidade</label>
                      <select value={form.unitType} onChange={e => patch({ unitType: e.target.value })}
                        className="flex h-12 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                        <option value="m²">m²</option><option value="km">km</option><option value="kg">kg</option><option value="unidade">unidade</option>
                      </select>
                    </div>
                  </div>
                )}

                {form.pricingModel === "budget" && (
                  <p className="text-sm text-muted-foreground pt-2">Sem preço público — cliente solicita orçamento personalizado.</p>
                )}
              </Section>

              {/* Packages */}
              {form.pricingModel === "packages" && (
                <Section title="Pacotes">
                  <div className="space-y-4">
                    {form.packages.map((pkg, i) => (
                      <div key={i} className="bg-muted/30 border border-border rounded-[var(--r4)] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">Pacote {i + 1}</span>
                          <button onClick={() => patch({ packages: form.packages.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <Input placeholder="Nome do pacote" value={pkg.name} onChange={e => { const u = [...form.packages]; u[i] = { ...u[i], name: e.target.value }; patch({ packages: u }); }} className="h-10" />
                        <Textarea placeholder="Descrição" value={pkg.description} onChange={e => { const u = [...form.packages]; u[i] = { ...u[i], description: e.target.value }; patch({ packages: u }); }} className="min-h-[60px]" />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">O que inclui:</p>
                          {pkg.includes.map((inc, j) => (
                            <div key={j} className="flex gap-2">
                              <Input placeholder="Item incluso" value={inc} onChange={e => {
                                const u = [...form.packages]; const items = [...u[i].includes]; items[j] = e.target.value; u[i] = { ...u[i], includes: items }; patch({ packages: u });
                              }} className="h-8 text-xs flex-1" />
                              <button onClick={() => {
                                const u = [...form.packages]; const items = [...u[i].includes]; items.splice(j, 1); u[i] = { ...u[i], includes: items }; patch({ packages: u });
                              }} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                          <button onClick={() => {
                            const u = [...form.packages]; u[i] = { ...u[i], includes: [...u[i].includes, ""] }; patch({ packages: u });
                          }} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar item</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Preço (R$)</label>
                            <Input type="number" placeholder="150" value={pkg.price} onChange={e => { const u = [...form.packages]; u[i] = { ...u[i], price: e.target.value }; patch({ packages: u }); }} className="h-10" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Duração</label>
                            <select value={pkg.duration} onChange={e => { const u = [...form.packages]; u[i] = { ...u[i], duration: e.target.value }; patch({ packages: u }); }}
                              className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-3 text-sm">
                              <option value="">Selecione</option>
                              <option value="1h">1 hora</option><option value="2h">2 horas</option><option value="4h">4 horas</option>
                              <option value="day">1 dia</option><option value="week">1 semana</option><option value="month">1 mês</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => patch({ packages: [...form.packages, { name: "", description: "", includes: [], price: "", duration: "" }] })}
                      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus className="w-4 h-4" /> Criar pacote</button>
                  </div>
                </Section>
              )}

              {/* Additional Costs */}
              <Section title="Custos Adicionais" hint="Ex: Deslocamento, material extra...">
                <div className="space-y-3">
                  {form.additionalCosts.map((cost, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input placeholder="Nome do custo" value={cost.name} onChange={e => { const u = [...form.additionalCosts]; u[i] = { ...u[i], name: e.target.value }; patch({ additionalCosts: u }); }} className="h-10 flex-1" />
                      <Input placeholder="R$" type="number" value={cost.value} onChange={e => { const u = [...form.additionalCosts]; u[i] = { ...u[i], value: e.target.value }; patch({ additionalCosts: u }); }} className="h-10 w-24" />
                      <select value={cost.type} onChange={e => { const u = [...form.additionalCosts]; u[i] = { ...u[i], type: e.target.value as "fixed" | "variable" }; patch({ additionalCosts: u }); }}
                        className="h-10 rounded-[var(--r3)] border-[1.5px] border-input bg-background px-2 text-xs w-24">
                        <option value="fixed">Fixo</option><option value="variable">Variável</option>
                      </select>
                      <button onClick={() => patch({ additionalCosts: form.additionalCosts.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => patch({ additionalCosts: [...form.additionalCosts, { name: "", value: "", type: "fixed" }] })}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Adicionar custo</button>
                </div>
              </Section>

              {/* Region Pricing */}
              <Section title="Tabela de preço por região">
                <div className="flex items-center gap-3">
                  <Switch checked={form.regionPricingEnabled} onCheckedChange={v => patch({ regionPricingEnabled: v })} />
                  <span className="text-sm text-foreground">Ativar preço por região</span>
                </div>
                {form.regionPricingEnabled && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                      <span>Região/Bairro</span><span>Preço base (R$)</span><span>Taxa extra (R$)</span>
                    </div>
                    {form.regionPricing.map((r, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 items-center">
                        <Input placeholder="Bairro" value={r.region} onChange={e => { const u = [...form.regionPricing]; u[i] = { ...u[i], region: e.target.value }; patch({ regionPricing: u }); }} className="h-9 text-xs" />
                        <Input placeholder="100" type="number" value={r.basePrice} onChange={e => { const u = [...form.regionPricing]; u[i] = { ...u[i], basePrice: e.target.value }; patch({ regionPricing: u }); }} className="h-9 text-xs" />
                        <div className="flex gap-1">
                          <Input placeholder="20" type="number" value={r.extraFee} onChange={e => { const u = [...form.regionPricing]; u[i] = { ...u[i], extraFee: e.target.value }; patch({ regionPricing: u }); }} className="h-9 text-xs flex-1" />
                          <button onClick={() => patch({ regionPricing: form.regionPricing.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => patch({ regionPricing: [...form.regionPricing, { region: "", basePrice: "", extraFee: "" }] })}
                      className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar região</button>
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ═══ TAB 3: ONDE E COMO ATENDE ═══ */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <Section title="Forma de Atendimento">
                {renderMultiPills(
                  ["Vai até o cliente", "Cliente vem ao meu local", "Online / Remoto", "Alocação de equipe"],
                  form.serviceModes,
                  v => patch({ serviceModes: v })
                )}
              </Section>

              {form.serviceModes.includes("Vai até o cliente") && (
                <Section title="Área de Atendimento">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Cidades atendidas</label>
                      {renderDynamicList("cities", "Ex: São Paulo, Campinas...")}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Bairros atendidos</label>
                      {renderDynamicList("neighborhoods", "Ex: Centro, Jardins...")}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Raio máximo: {form.maxRadius} km</label>
                      <Slider value={[form.maxRadius]} onValueChange={([v]) => patch({ maxRadius: v })} min={1} max={100} step={1} className="w-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.travelFeeEnabled} onCheckedChange={v => patch({ travelFeeEnabled: v })} />
                      <span className="text-sm text-foreground">Taxa de deslocamento</span>
                    </div>
                    {form.travelFeeEnabled && (
                      <Input type="number" placeholder="R$/km" value={form.travelFeePerKm} onChange={e => patch({ travelFeePerKm: e.target.value })} className="h-10 w-32" />
                    )}
                  </div>
                </Section>
              )}

              <Section title="Equipe">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.requiresTeam} onCheckedChange={v => patch({ requiresTeam: v })} />
                    <span className="text-sm text-foreground">Requer equipe</span>
                  </div>
                  {form.requiresTeam && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Nº de profissionais</label>
                        <Input type="number" placeholder="3" value={form.teamSize} onChange={e => patch({ teamSize: e.target.value })} className="h-10 w-24" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Perfis necessários</label>
                        {renderDynamicList("teamProfiles", "Ex: Eletricista, Ajudante...")}
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={form.autoWorkOrder} onCheckedChange={v => patch({ autoWorkOrder: v })} />
                        <span className="text-sm text-foreground">OS (Ordem de Serviço) automática</span>
                      </div>
                    </>
                  )}
                </div>
              </Section>

              <Section title="Materiais e Produtos">
                <div className="flex items-center gap-3">
                  <Switch checked={form.requiresProducts} onCheckedChange={v => patch({ requiresProducts: v })} />
                  <span className="text-sm text-foreground">Este serviço consome produtos/materiais</span>
                </div>
                {form.requiresProducts && (
                  <p className="text-xs text-muted-foreground pt-2">Vincule produtos do seu catálogo na aba Configurações → Produto vinculado.</p>
                )}
              </Section>
            </div>
          )}

          {/* ═══ TAB 4: AGENDA ═══ */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <Section title="Duração do Serviço">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Duração padrão</label>
                    <select value={form.defaultDuration} onChange={e => patch({ defaultDuration: e.target.value })}
                      className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                      <option value="30min">30 minutos</option><option value="1h">1 hora</option><option value="2h">2 horas</option>
                      <option value="4h">4 horas</option><option value="day">1 dia</option><option value="week">1 semana</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={form.customDurationEnabled} onCheckedChange={v => patch({ customDurationEnabled: v })} />
                    <span className="text-sm text-foreground">Duração personalizada</span>
                  </div>
                  {form.customDurationEnabled && (
                    <Input placeholder="Ex: 3 horas e 30 min" value={form.customDuration} onChange={e => patch({ customDuration: e.target.value })} className="h-10" />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Buffer entre atendimentos</label>
                      <select value={form.bufferTime} onChange={e => patch({ bufferTime: e.target.value })}
                        className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                        <option value="0">Sem intervalo</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hora</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Atendimentos simultâneos</label>
                      <Input type="number" placeholder="1" value={form.simultaneousSlots} onChange={e => patch({ simultaneousSlots: e.target.value })} className="h-10" />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Slots de Horário" hint="Configure os horários disponíveis por dia da semana">
                <div className="space-y-2">
                  {DAYS.map(day => {
                    const slot = form.availableSlots[day.key];
                    return (
                      <div key={day.key} className={`flex items-center gap-3 px-3 py-2 rounded-[var(--r3)] border border-border ${slot.active ? "" : "opacity-50"}`}>
                        <Switch checked={slot.active} onCheckedChange={v => {
                          const u = { ...form.availableSlots, [day.key]: { ...slot, active: v } };
                          patch({ availableSlots: u });
                        }} />
                        <span className="text-sm font-medium w-10">{day.label}</span>
                        {slot.active && (
                          <>
                            <Input type="time" value={slot.start} onChange={e => {
                              const u = { ...form.availableSlots, [day.key]: { ...slot, start: e.target.value } };
                              patch({ availableSlots: u });
                            }} className="h-8 w-28 text-xs" />
                            <span className="text-muted-foreground text-xs">até</span>
                            <Input type="time" value={slot.end} onChange={e => {
                              const u = { ...form.availableSlots, [day.key]: { ...slot, end: e.target.value } };
                              patch({ availableSlots: u });
                            }} className="h-8 w-28 text-xs" />
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => {
                      const u = { ...form.availableSlots };
                      DAYS.forEach(d => { u[d.key] = { ...u[d.key], start: "08:00", end: "12:00" }; });
                      patch({ availableSlots: u });
                    }} className="text-[10px] text-primary hover:underline px-2 py-1 border border-primary/20 rounded-full">Manhã toda</button>
                    <button onClick={() => {
                      const u = { ...form.availableSlots };
                      DAYS.forEach(d => { u[d.key] = { ...u[d.key], start: "13:00", end: "18:00" }; });
                      patch({ availableSlots: u });
                    }} className="text-[10px] text-primary hover:underline px-2 py-1 border border-primary/20 rounded-full">Tarde toda</button>
                    <button onClick={() => {
                      const u = { ...form.availableSlots };
                      DAYS.forEach(d => { u[d.key] = { ...u[d.key], start: "08:00", end: "18:00", active: true }; });
                      patch({ availableSlots: u });
                    }} className="text-[10px] text-primary hover:underline px-2 py-1 border border-primary/20 rounded-full">Dia inteiro</button>
                  </div>
                </div>
              </Section>

              <Section title="Tipo de Agendamento">
                {renderPills(["Na hora (walk-in)", "Hora marcada", "Janela de tempo", "Recorrente"],
                  form.scheduleType === "walkin" ? "Na hora (walk-in)" : form.scheduleType === "hora_marcada" ? "Hora marcada" : form.scheduleType === "window" ? "Janela de tempo" : form.scheduleType === "recurring" ? "Recorrente" : "",
                  v => {
                    const map: Record<string, string> = { "Na hora (walk-in)": "walkin", "Hora marcada": "hora_marcada", "Janela de tempo": "window", "Recorrente": "recurring" };
                    patch({ scheduleType: map[v] || "" });
                  }
                )}
              </Section>

              <Section title="Confirmação">
                <div className="space-y-4">
                  {renderPills(["Automática", "Manual"],
                    form.confirmationType === "auto" ? "Automática" : "Manual",
                    v => patch({ confirmationType: v === "Automática" ? "auto" : "manual" })
                  )}
                  {form.confirmationType === "manual" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Prazo para confirmar</label>
                      <select value={form.confirmDeadline} onChange={e => patch({ confirmDeadline: e.target.value })}
                        className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                        <option value="1h">1 hora</option><option value="4h">4 horas</option><option value="24h">24 horas</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Antecedência mínima</label>
                      <select value={form.minAdvance} onChange={e => patch({ minAdvance: e.target.value })}
                        className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                        <option value="0">Sem antecedência</option><option value="1h">1 hora</option><option value="2h">2 horas</option>
                        <option value="4h">4 horas</option><option value="24h">24 horas</option><option value="48h">48 horas</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Máx. dias no futuro</label>
                      <select value={form.maxFutureDays} onChange={e => patch({ maxFutureDays: e.target.value })}
                        className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                        <option value="7">7 dias</option><option value="14">14 dias</option><option value="30">30 dias</option><option value="90">90 dias</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ═══ TAB 5: CONFIGURAÇÕES EXTRAS ═══ */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <Section title="Garantia do Serviço">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.warrantyEnabled} onCheckedChange={v => patch({ warrantyEnabled: v })} />
                    <span className="text-sm text-foreground">Oferecer garantia</span>
                  </div>
                  {form.warrantyEnabled && (
                    <>
                      <Input placeholder="Prazo: Ex: 90 dias, 1 ano" value={form.warrantyPeriod} onChange={e => patch({ warrantyPeriod: e.target.value })} className="h-10" />
                      <Textarea placeholder="Descreva as condições da garantia..." value={form.warrantyDescription} onChange={e => patch({ warrantyDescription: e.target.value })} className="min-h-[80px]" />
                    </>
                  )}
                </div>
              </Section>

              <Section title="Política de Cancelamento">
                <div className="space-y-4">
                  {renderPills(["Livre", "Até 24h", "Até 2h", "Sem cancelamento"], form.cancellationPolicy, v => patch({ cancellationPolicy: v }))}
                  <div className="flex items-center gap-3">
                    <Switch checked={form.lateCancelFeeEnabled} onCheckedChange={v => patch({ lateCancelFeeEnabled: v })} />
                    <span className="text-sm text-foreground">Multa por cancelamento tardio</span>
                  </div>
                  {form.lateCancelFeeEnabled && (
                    <div className="flex items-center gap-2">
                      <Input type="number" placeholder="50" value={form.lateCancelFeePercent} onChange={e => patch({ lateCancelFeePercent: e.target.value })} className="h-10 w-24" />
                      <span className="text-sm text-muted-foreground">% do valor</span>
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Contrato Automático">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.autoContractEnabled} onCheckedChange={v => patch({ autoContractEnabled: v })} />
                    <span className="text-sm text-foreground">Enviar contrato digital automaticamente</span>
                  </div>
                  {form.autoContractEnabled && (
                    <select value={form.contractTemplate} onChange={e => patch({ contractTemplate: e.target.value })}
                      className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-4 text-sm">
                      <option value="">Selecione o template</option>
                      <option value="service_basic">Serviço básico</option>
                      <option value="service_maintenance">Manutenção</option>
                      <option value="service_consulting">Consultoria</option>
                    </select>
                  )}
                </div>
              </Section>

              <Section title="Formulário de Orçamento" hint="Para quando o modelo de preço é Orçamento">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.budgetFormEnabled} onCheckedChange={v => patch({ budgetFormEnabled: v })} />
                    <span className="text-sm text-foreground">Formulário customizado de orçamento</span>
                  </div>
                  {form.budgetFormEnabled && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Campos do formulário</label>
                      {renderDynamicList("budgetFields", "Ex: Endereço completo, Metragem, Tipo de serviço...")}
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Produto Vinculado (Cross-sell)" hint="Vincule produtos do catálogo ao serviço">
                {renderDynamicList("crossSellProducts", "Nome do produto vinculado")}
              </Section>

              <Section title="Profissional Responsável">
                <Input placeholder="Nome do profissional responsável" value={form.responsibleProfessional} onChange={e => patch({ responsibleProfessional: e.target.value })} className="h-10" />
              </Section>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
        <Button variant="ghost" size="sm" disabled={activeTab === 0} onClick={() => setActiveTab(activeTab - 1)} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Anterior
        </Button>
        <p className="text-xs text-muted-foreground">{activeTab + 1} de {TABS.length}</p>
        {activeTab < TABS.length - 1 ? (
          <Button variant="ghost" size="sm" onClick={() => setActiveTab(activeTab + 1)} className="gap-1.5">
            Próximo <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createAd.isPending} size="sm" className="bg-primary text-primary-foreground font-bold gap-1.5">
            <Save className="w-3.5 h-3.5" /> {createAd.isPending ? "Publicando..." : "Publicar Serviço"}
          </Button>
        )}
      </div>
    </div>
  );
}
