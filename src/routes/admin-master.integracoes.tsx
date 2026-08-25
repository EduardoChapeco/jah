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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getPlatformApiIntegrations,
  updatePlatformApiIntegrations,
  type PlatformApiIntegrationsDTO,
} from "@/services/master.functions";

export const Route = createFileRoute("/admin-master/integracoes")({
  head: () => ({ meta: [{ title: "APIs & Integrações Globais | Wider Master" }] }),
  loader: async () => {
    try {
      const integrations = await getPlatformApiIntegrations();
      return { integrations };
    } catch {
      const fallback: PlatformApiIntegrationsDTO = {
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
          maps: "unconfigured",
          payments: "unconfigured",
          email: "unconfigured",
          sms: "unconfigured",
          logistics: "unconfigured",
        },
      };
      return { integrations: fallback };
    }
  },
  component: AdminMasterIntegracoesPage,
});

type TabType = "maps" | "payments" | "comms" | "logistics" | "ai" | "webhooks";

function AdminMasterIntegracoesPage() {
  const { integrations: initialData } = Route.useLoaderData();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("maps");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Form states
  const [formData, setFormData] = useState<PlatformApiIntegrationsDTO>(initialData);

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

  const renderStatusBadge = (status?: "active" | "testing" | "unconfigured" | "error") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-bold">
            <CheckCircle2 className="size-3" /> Ativo
          </Badge>
        );
      case "testing":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-bold">
            <Clock className="size-3" /> Sandbox
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 text-[11px] font-bold">
            <AlertCircle className="size-3" /> Falha
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 text-[11px]">
            Não Configurado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header com indicador de autoridade master */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 ">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Plug className="size-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              APIs & Conexões Globais
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gerenciamento central de tokens, gateways, mensageria e chaves de serviços externos do Wider.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 font-mono text-[11px]">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Multi-Tenant Root</span>
          </Badge>
        </div>
      </div>

      {/* Navegação por Abas de Serviços */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none ">
        <button
          type="button"
          onClick={() => setActiveTab("maps")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "maps"
              ? "bg-foreground text-background "
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <MapPin className="size-4" />
          <span>Mapas & Geolocalização</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "payments"
              ? "bg-foreground text-background "
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <CreditCard className="size-4" />
          <span>Pagamentos & Checkout</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("comms")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "comms"
              ? "bg-foreground text-background "
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Mail className="size-4" />
          <span>E-mail & SMS Transacional</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logistics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "logistics"
              ? "bg-foreground text-background "
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Truck className="size-4" />
          <span>Logística & Fretes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "ai"
              ? "bg-foreground text-background "
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Sparkles className="size-4" />
          <span>IA & LLM</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("webhooks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "webhooks"
              ? "bg-foreground text-background "
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Radio className="size-4" />
          <span>Webhooks & Segurança</span>
        </button>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ABA: MAPAS & GEOLOCALIZAÇÃO */}
        {activeTab === "maps" && (
          <div className="space-y-4 p-5 rounded-3xl  bg-card">
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <h3 className="text-sm font-bold text-foreground">Mapbox & MapLibre GL</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Alimenta a renderização de mapas vetoriais do Moments, Mobilidade e Diretório.
                </p>
              </div>
              {renderStatusBadge(formData.active_services?.maps)}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Mapbox Public Access Token</Label>
              <Input
                value={formData.mapbox_token || ""}
                onChange={(e) => handleInputChange("mapbox_token", e.target.value)}
                placeholder="pk.eyJ1IjoiamFoY29tbXVuaXR5IiwiYSI6..."
                className="font-mono text-xs h-10 rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Usado pelo componente <code>MapLibreCanvas</code> para carregar o estilo de mapa escuro e satélite.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold">Google Maps Geocoding API Key (Opcional)</Label>
              <Input
                value={formData.google_maps_api_key || ""}
                onChange={(e) => handleInputChange("google_maps_api_key", e.target.value)}
                placeholder="AIzaSy..."
                className="font-mono text-xs h-10 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* ABA: PAGAMENTOS & CHECKOUT */}
        {activeTab === "payments" && (
          <div className="space-y-4 p-5 rounded-3xl  bg-card">
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <h3 className="text-sm font-bold text-foreground">Stripe & Asaas (Split Global)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Processamento de cartões de crédito, PIX e repasses automatizados para lojistas.
                </p>
              </div>
              {renderStatusBadge(formData.active_services?.payments)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Stripe Publishable Key</Label>
                <Input
                  value={formData.stripe_public_key || ""}
                  onChange={(e) => handleInputChange("stripe_public_key", e.target.value)}
                  placeholder="pk_live_51..."
                  className="font-mono text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Stripe Secret Key</Label>
                <div className="relative">
                  <Input
                    type={visibleKeys.stripe_secret ? "text" : "password"}
                    value={formData.stripe_secret_key || ""}
                    onChange={(e) => handleInputChange("stripe_secret_key", e.target.value)}
                    placeholder="sk_live_51..."
                    className="font-mono text-xs h-10 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("stripe_secret")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys.stripe_secret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 ">
              <Label className="text-xs font-bold">Asaas API Key (PIX & Boleto Nativo BRL)</Label>
              <div className="relative">
                <Input
                  type={visibleKeys.asaas ? "text" : "password"}
                  value={formData.asaas_api_key || ""}
                  onChange={(e) => handleInputChange("asaas_api_key", e.target.value)}
                  placeholder="$aact_YTU5YTE0M2M6N2Z..."
                  className="font-mono text-xs h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("asaas")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {visibleKeys.asaas ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: COMUNICAÇÃO & MENSAGERIA */}
        {activeTab === "comms" && (
          <div className="space-y-4 p-5 rounded-3xl  bg-card">
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <h3 className="text-sm font-bold text-foreground">Resend & Twilio</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Disparo de códigos de verificação OTP, comprovantes de pedidos e alertas de sistema.
                </p>
              </div>
              {renderStatusBadge(formData.active_services?.email)}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Resend API Key (E-mail Transacional)</Label>
              <div className="relative">
                <Input
                  type={visibleKeys.resend ? "text" : "password"}
                  value={formData.resend_api_key || ""}
                  onChange={(e) => handleInputChange("resend_api_key", e.target.value)}
                  placeholder="re_123456789..."
                  className="font-mono text-xs h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("resend")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {visibleKeys.resend ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 ">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Twilio Account SID (SMS OTP)</Label>
                <Input
                  value={formData.twilio_account_sid || ""}
                  onChange={(e) => handleInputChange("twilio_account_sid", e.target.value)}
                  placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="font-mono text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Twilio Auth Token</Label>
                <div className="relative">
                  <Input
                    type={visibleKeys.twilio_token ? "text" : "password"}
                    value={formData.twilio_auth_token || ""}
                    onChange={(e) => handleInputChange("twilio_auth_token", e.target.value)}
                    placeholder="your_auth_token_here..."
                    className="font-mono text-xs h-10 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("twilio_token")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {visibleKeys.twilio_token ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: LOGÍSTICA & FRETES */}
        {activeTab === "logistics" && (
          <div className="space-y-4 p-5 rounded-3xl  bg-card">
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <h3 className="text-sm font-bold text-foreground">Melhor Envio & Correios</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cotação em tempo real e geração de etiquetas de postagem integrada.
                </p>
              </div>
              {renderStatusBadge(formData.active_services?.logistics)}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Melhor Envio Bearer Token</Label>
              <div className="relative">
                <Input
                  type={visibleKeys.melhor_envio ? "text" : "password"}
                  value={formData.melhor_envio_token || ""}
                  onChange={(e) => handleInputChange("melhor_envio_token", e.target.value)}
                  placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1Ni..."
                  className="font-mono text-xs h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("melhor_envio")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {visibleKeys.melhor_envio ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: IA & LLM */}
        {activeTab === "ai" && (
          <div className="space-y-4 p-5 rounded-3xl  bg-card">
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <h3 className="text-sm font-bold text-foreground">OpenAI / Gemini Platform Key</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Geração automática de descrições de produtos, SEO e moderação de conteúdo assistida.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">API Key</Label>
              <div className="relative">
                <Input
                  type={visibleKeys.openai ? "text" : "password"}
                  value={formData.openai_api_key || ""}
                  onChange={(e) => handleInputChange("openai_api_key", e.target.value)}
                  placeholder="sk-proj-..."
                  className="font-mono text-xs h-10 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("openai")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {visibleKeys.openai ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: WEBHOOKS & ASSINATURAS */}
        {activeTab === "webhooks" && (
          <div className="space-y-4 p-5 rounded-3xl  bg-card">
            <div className="flex items-center justify-between pb-3 ">
              <div>
                <h3 className="text-sm font-bold text-foreground">Segurança de Webhooks</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assinatura criptográfica HMAC para validação de eventos externos recebidos.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Webhook Signing Secret (HMAC-SHA256)</Label>
              <Input
                value={formData.webhook_secret || ""}
                onChange={(e) => handleInputChange("webhook_secret", e.target.value)}
                placeholder="whsec_..."
                className="font-mono text-xs h-10 rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Endpoints de webhook utilizam este segredo para rejeitar requisições forjadas ou não autorizadas.
              </p>
            </div>
          </div>
        )}

        {/* Botão de Salvar Global */}
        <div className="flex items-center justify-end gap-3 pt-4 ">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl font-bold text-xs gap-2 px-6 h-11 bg-foreground text-background hover:bg-foreground/90  cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Salvando Credenciais...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Salvar Configurações Globais</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
