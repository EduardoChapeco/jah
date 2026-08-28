import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plug,
  MapPin,
  CreditCard,
  Mail,
  Truck,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Save,
  Radio,
  Layers,
  Plus,
  Trash2,
  Sliders,
  Terminal,
  Activity,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPlatformApiIntegrations,
  updatePlatformApiIntegrations,
  type PlatformApiIntegrationsDTO,
} from "@/services/master.functions";
import {
  listApiKeyPools,
  saveApiKeyToPool,
  toggleApiKeyStatus,
  deleteApiKeyFromPool,
  listMasterPrompts,
  saveMasterPrompt,
  type ApiKeyPoolDTO,
  type MasterPromptDTO,
  type ApiProvider,
} from "@/services/api-orchestrator.functions";

export const Route = createFileRoute("/admin-master/integracoes")({
  head: () => ({ meta: [{ title: "APIs, Pools & Orquestrador Global | Wider Master" }] }),
  loader: async () => {
    try {
      const [integrations, pools, prompts] = await Promise.all([
        getPlatformApiIntegrations().catch(() => ({
          mapbox_token: "",
          stripe_public_key: "",
          stripe_secret_key: "",
          asaas_api_key: "",
          resend_api_key: "",
          sendgrid_api_key: "",
          twilio_account_sid: "",
          twilio_auth_token: "",
          melhor_envio_token: "",
          google_maps_api_key: "",
          openai_api_key: "",
          webhook_secret: "",
          active_services: {
            maps: "active" as const,
            payments: "unconfigured" as const,
            email: "unconfigured" as const,
            sms: "unconfigured" as const,
            logistics: "unconfigured" as const,
          },
        })),
        listApiKeyPools().catch(() => []),
        listMasterPrompts().catch(() => []),
      ]);

      return { integrations, pools, prompts };
    } catch {
      return {
        integrations: {
          mapbox_token: "",
          stripe_public_key: "",
          stripe_secret_key: "",
          asaas_api_key: "",
          resend_api_key: "",
          sendgrid_api_key: "",
          twilio_account_sid: "",
          twilio_auth_token: "",
          melhor_envio_token: "",
          google_maps_api_key: "",
          openai_api_key: "",
          webhook_secret: "",
        },
        pools: [],
        prompts: [],
      };
    }
  },
  component: AdminMasterIntegracoesPage,
});

type TabType = "pools" | "prompts" | "maps" | "payments" | "comms" | "logistics" | "webhooks";

function AdminMasterIntegracoesPage() {
  const { integrations: initialData, pools: initialPools, prompts: initialPrompts } = Route.useLoaderData();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("pools");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Form states
  const [formData, setFormData] = useState<PlatformApiIntegrationsDTO>(initialData);
  const [pools, setPools] = useState<ApiKeyPoolDTO[]>(initialPools);
  const [prompts, setPrompts] = useState<MasterPromptDTO[]>(initialPrompts);

  // Modal: Nova Chave na Pool
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyProvider, setNewKeyProvider] = useState<ApiProvider>("firecrawl");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeySecret, setNewKeySecret] = useState("");
  const [newKeyPriority, setNewKeyPriority] = useState(1);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);

  // Modal: Editar Prompt Master
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<MasterPromptDTO | null>(null);
  const [promptSlug, setPromptSlug] = useState("");
  const [promptTitle, setPromptTitle] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [promptSystemInstruction, setPromptSystemInstruction] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [promptModel, setPromptModel] = useState("gemini-1.5-flash");
  const [promptTemperature, setPromptTemperature] = useState(0.2);

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (key: keyof PlatformApiIntegrationsDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updatePlatformApiIntegrations({
        data: {
          mapbox_token: formData.mapbox_token,
          stripe_public_key: formData.stripe_public_key,
          stripe_secret_key: formData.stripe_secret_key,
          asaas_api_key: formData.asaas_api_key,
          resend_api_key: formData.resend_api_key,
          sendgrid_api_key: formData.sendgrid_api_key,
          twilio_account_sid: formData.twilio_account_sid,
          twilio_auth_token: formData.twilio_auth_token,
          melhor_envio_token: formData.melhor_envio_token,
          google_maps_api_key: formData.google_maps_api_key,
          openai_api_key: formData.openai_api_key,
          webhook_secret: formData.webhook_secret,
        },
      });

      toast.success("Credenciais e integrações atualizadas com sucesso!");
      await router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar integrações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ações da Pool de Chaves
  const handleSaveKeyToPool = async () => {
    if (!newKeyLabel.trim() || !newKeySecret.trim()) {
      toast.error("Preencha o rótulo e a chave de API.");
      return;
    }

    try {
      const created = await saveApiKeyToPool({
        data: {
          provider: newKeyProvider,
          label: newKeyLabel,
          apiKey: newKeySecret,
          priority: newKeyPriority,
          rateLimitPerMinute: newKeyRateLimit,
        },
      });

      toast.success("Chave adicionada ao pool com sucesso!");
      setIsNewKeyModalOpen(false);
      setNewKeyLabel("");
      setNewKeySecret("");
      setPools((prev) => [created as any, ...prev]);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao cadastrar chave no pool.");
    }
  };

  const handleToggleKey = async (id: string, currentStatus: boolean) => {
    try {
      await toggleApiKeyStatus({ data: { id, isActive: !currentStatus } });
      setPools((prev) =>
        prev.map((k) => (k.id === id ? { ...k, is_active: !currentStatus } : k)),
      );
      toast.success(`Chave ${!currentStatus ? "ativada" : "desativada"} na rotação.`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao alternar chave.");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Deseja remover esta chave da pool?")) return;
    try {
      await deleteApiKeyFromPool({ data: { id } });
      setPools((prev) => prev.filter((k) => k.id !== id));
      toast.success("Chave removida da pool.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir chave.");
    }
  };

  // Ações de Prompts Master
  const handleOpenEditPrompt = (prompt?: MasterPromptDTO) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setPromptSlug(prompt.slug);
      setPromptTitle(prompt.title);
      setPromptDescription(prompt.description || "");
      setPromptSystemInstruction(prompt.system_instruction);
      setPromptTemplate(prompt.prompt_template);
      setPromptModel(prompt.target_model);
      setPromptTemperature(prompt.temperature);
    } else {
      setEditingPrompt(null);
      setPromptSlug("");
      setPromptTitle("");
      setPromptDescription("");
      setPromptSystemInstruction("Você é um assistente de catálogo de alto padrão...");
      setPromptTemplate("Analise o conteúdo:\n{{raw_content}}\n\nRetorne JSON...");
      setPromptModel("gemini-1.5-flash");
      setPromptTemperature(0.2);
    }
    setIsPromptModalOpen(true);
  };

  const handleSavePrompt = async () => {
    if (!promptSlug.trim() || !promptTitle.trim() || !promptSystemInstruction.trim()) {
      toast.error("Preencha todos os campos obrigatórios do prompt.");
      return;
    }

    try {
      const saved = await saveMasterPrompt({
        data: {
          id: editingPrompt?.id,
          slug: promptSlug,
          title: promptTitle,
          description: promptDescription,
          systemInstruction: promptSystemInstruction,
          promptTemplate: promptTemplate,
          targetProvider: "gemini",
          targetModel: promptModel,
          temperature: promptTemperature,
          isDefault: editingPrompt ? editingPrompt.is_default : false,
        },
      });

      toast.success("Prompt Master salvo com sucesso!");
      setIsPromptModalOpen(false);
      if (editingPrompt) {
        setPrompts((prev) => prev.map((p) => (p.id === saved.id ? (saved as any) : p)));
      } else {
        setPrompts((prev) => [saved as any, ...prev]);
      }
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar Prompt Master.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header com indicador de autoridade master */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="size-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Orquestrador de APIs & Pools de Chaves
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gerenciamento central com rotação automática, failover server-side, prompts master e limites anti-abuso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 font-mono text-[11px]">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Vault Seguro Server-Side</span>
          </Badge>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("pools")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "pools"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Layers className="size-4" />
          <span>Pool de Chaves & Rotação</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prompts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "prompts"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Terminal className="size-4" />
          <span>Prompts Master (IA)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maps")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "maps"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <MapPin className="size-4" />
          <span>Mapas (OSM & Google)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "payments"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <CreditCard className="size-4" />
          <span>Pagamentos (Asaas & Stripe)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comms")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "comms"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Mail className="size-4" />
          <span>E-mail & WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("webhooks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "webhooks"
              ? "bg-foreground text-background shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Radio className="size-4" />
          <span>Webhooks & Segurança</span>
        </button>
      </div>

      {/* ── ABA 1: POOL DE CHAVES & ROTAÇÃO ── */}
      {activeTab === "pools" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Pools de Chaves de APIs</h2>
              <p className="text-xs text-muted-foreground">
                Cadastre múltiplas chaves para Firecrawl, Steel.dev, Gemini Flash e Groq com failover automático contra erro 429.
              </p>
            </div>
            <Button
              onClick={() => setIsNewKeyModalOpen(true)}
              className="rounded-xl font-bold text-xs h-9 gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Adicionar Chave à Pool</span>
            </Button>
          </div>

          {pools.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-3xl space-y-3 bg-muted/10">
              <Zap className="size-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Nenhuma chave cadastrada na pool</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Adicione suas chaves corporativas para habilitar a importação inteligente de produtos e processamento de IA.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pools.map((key) => (
                <div
                  key={key.id}
                  className="p-5 rounded-3xl bg-card border border-border/70 space-y-3 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="font-mono uppercase text-[10px] font-bold">
                        {key.provider}
                      </Badge>
                      <span className="font-bold text-sm text-foreground">{key.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={key.is_active}
                        onCheckedChange={() => handleToggleKey(key.id, key.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteKey(key.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono bg-muted/40 p-2.5 rounded-xl">
                    <span className="text-muted-foreground">{key.masked_key}</span>
                    <span className="text-[11px] text-foreground font-bold">
                      {key.daily_request_count} reqs hoje
                    </span>
                  </div>

                  {key.last_error_message && (
                    <div className="text-[11px] text-rose-500 bg-rose-500/10 p-2 rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="size-3 shrink-0" />
                      <span className="truncate">{key.last_error_message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABA 2: PROMPTS MASTER (IA) ── */}
      {activeTab === "prompts" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Prompts Master da Plataforma</h2>
              <p className="text-xs text-muted-foreground">
                Governança central dos templates e diretrizes de sistema que orientam a extração e refinamento de dados.
              </p>
            </div>
            <Button
              onClick={() => handleOpenEditPrompt()}
              className="rounded-xl font-bold text-xs h-9 gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Novo Prompt Master</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-5 rounded-3xl bg-card border border-border/70 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{prompt.title}</span>
                    {prompt.is_default && (
                      <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">
                        Padrão da Plataforma
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl font-bold text-xs h-8"
                    onClick={() => handleOpenEditPrompt(prompt)}
                  >
                    Editar Prompt
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {prompt.description || "Sem descrição"}
                </p>

                <div className="p-3 bg-muted/40 rounded-2xl font-mono text-[11px] space-y-1 text-muted-foreground">
                  <div className="font-bold text-foreground">Instrução de Sistema:</div>
                  <div className="line-clamp-2">{prompt.system_instruction}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA 3: MAPAS (OSM vs GOOGLE) ── */}
      {activeTab === "maps" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground">Provedor de Mapas Ativo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Por padrão, o Wider utiliza OpenStreetMap / MapLibre (100% gratuito e open-source).
                </p>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-bold text-xs">
                <CheckCircle2 className="size-3" /> MapLibre OpenStreetMap Ativo
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="google_maps_api_key" className="text-xs font-bold">
                  Chave Google Maps API (Opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="google_maps_api_key"
                    type={visibleKeys["google_maps"] ? "text" : "password"}
                    value={formData.google_maps_api_key || ""}
                    onChange={(e) => handleInputChange("google_maps_api_key", e.target.value)}
                    placeholder="AIzaSy..."
                    className="h-10 text-xs font-mono pr-10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("google_maps")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys["google_maps"] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Se preenchido, você pode habilitar o Google Maps como provedor primário de geocodificação.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs h-9 gap-1.5">
                <Save className="size-3.5" />
                <span>Salvar Configuração de Mapas</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── ABA 4: PAGAMENTOS (ASAAS & STRIPE) ── */}
      {activeTab === "payments" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Gateways de Pagamento (PIX & Cartão)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure as credenciais de liquidação central do Asaas e Stripe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="asaas_api_key" className="text-xs font-bold">Asaas API Key (PIX Nacional)</Label>
                <Input
                  id="asaas_api_key"
                  type={visibleKeys["asaas"] ? "text" : "password"}
                  value={formData.asaas_api_key || ""}
                  onChange={(e) => handleInputChange("asaas_api_key", e.target.value)}
                  placeholder="$aact_..."
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stripe_secret_key" className="text-xs font-bold">Stripe Secret Key</Label>
                <Input
                  id="stripe_secret_key"
                  type={visibleKeys["stripe"] ? "text" : "password"}
                  value={formData.stripe_secret_key || ""}
                  onChange={(e) => handleInputChange("stripe_secret_key", e.target.value)}
                  placeholder="sk_live_..."
                  className="h-10 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs h-9 gap-1.5">
                <Save className="size-3.5" />
                <span>Salvar Gateways de Pagamento</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── ABA 5: E-MAIL & WHATSAPP ── */}
      {activeTab === "comms" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Comunicação & Mensageria</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envio transacional de comprovantes e alertas por E-mail (Resend) e WhatsApp.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resend_api_key" className="text-xs font-bold">Resend API Key (E-mail Transacional)</Label>
              <Input
                id="resend_api_key"
                type={visibleKeys["resend"] ? "text" : "password"}
                value={formData.resend_api_key || ""}
                onChange={(e) => handleInputChange("resend_api_key", e.target.value)}
                placeholder="re_..."
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs h-9 gap-1.5">
                <Save className="size-3.5" />
                <span>Salvar Mensageria</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* ── ABA 6: WEBHOOKS ── */}
      {activeTab === "webhooks" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Segurança de Webhooks (HMAC SHA-256)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Segredo criptográfico compartilhado para validação de webhooks de pagamento e entregas.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="webhook_secret" className="text-xs font-bold">Webhook Secret</Label>
              <Input
                id="webhook_secret"
                type={visibleKeys["webhook"] ? "text" : "password"}
                value={formData.webhook_secret || ""}
                onChange={(e) => handleInputChange("webhook_secret", e.target.value)}
                placeholder="whsec_..."
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold text-xs h-9 gap-1.5">
                <Save className="size-3.5" />
                <span>Salvar Segredo de Webhook</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Modal: Adicionar Chave à Pool */}
      <Dialog open={isNewKeyModalOpen} onOpenChange={setIsNewKeyModalOpen}>
        <DialogContent className="sm:max-w-md sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Adicionar Chave à Pool</DialogTitle>
            <DialogDescription className="text-xs">
              A chave será criptografada e armazenada de forma segura no servidor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Provedor do Serviço</Label>
              <Select value={newKeyProvider} onValueChange={(v: any) => setNewKeyProvider(v)}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="firecrawl">Firecrawl (Web Scraping)</SelectItem>
                  <SelectItem value="steel">Steel.dev (Browser Automation)</SelectItem>
                  <SelectItem value="gemini">Google Gemini Flash</SelectItem>
                  <SelectItem value="groq">Groq (Llama 3 / Mixtral)</SelectItem>
                  <SelectItem value="google_maps">Google Maps API</SelectItem>
                  <SelectItem value="resend">Resend (E-mail)</SelectItem>
                  <SelectItem value="asaas">Asaas Pagamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Rótulo / Identificação</Label>
              <Input
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="Ex: Firecrawl Chave 01 (Plano Pro)"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Chave Secreta de API (Secret Key)</Label>
              <Input
                type="password"
                value={newKeySecret}
                onChange={(e) => setNewKeySecret(e.target.value)}
                placeholder="sk_... ou AIza..."
                className="h-10 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Prioridade (1 = Alta)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newKeyPriority}
                  onChange={(e) => setNewKeyPriority(Number(e.target.value))}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Limite / Minuto</Label>
                <Input
                  type="number"
                  min={1}
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewKeyModalOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSaveKeyToPool} className="rounded-xl font-bold text-xs">
              Salvar Chave no Pool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Prompt Master */}
      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <DialogContent className="sm:max-w-2xl sm:rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingPrompt ? "Editar Prompt Master" : "Novo Prompt Master de IA"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina as instruções de sistema e o template de extração de dados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Slug Identificador</Label>
                <Input
                  value={promptSlug}
                  onChange={(e) => setPromptSlug(e.target.value)}
                  placeholder="product_importer_custom"
                  className="h-9 text-xs font-mono rounded-xl"
                  disabled={editingPrompt?.is_default}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Título do Prompt</Label>
                <Input
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                  placeholder="Importador Gastronômico"
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Descrição</Label>
              <Input
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Explique o propósito deste prompt..."
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Instruções de Sistema (System Prompt)</Label>
              <Textarea
                value={promptSystemInstruction}
                onChange={(e) => setPromptSystemInstruction(e.target.value)}
                placeholder="Você é um assistente sênior..."
                className="text-xs h-24 rounded-xl leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Template com Variáveis ({`{{raw_content}}`})</Label>
              <Textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Analise o conteúdo abaixo: {{raw_content}}..."
                className="text-xs font-mono h-32 rounded-xl leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Modelo LLM</Label>
                <Input
                  value={promptModel}
                  onChange={(e) => setPromptModel(e.target.value)}
                  placeholder="gemini-1.5-flash ou llama-3.1-70b"
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Temperatura (Criatividade: 0.0 - 1.0)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={1}
                  value={promptTemperature}
                  onChange={(e) => setPromptTemperature(Number(e.target.value))}
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromptModalOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSavePrompt} className="rounded-xl font-bold text-xs">
              Salvar Prompt Master
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
