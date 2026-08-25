import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Store,
  Save,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Upload,
  Image as ImageIcon,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  HelpCircle,
  ListChecks,
} from "lucide-react";
import {
  getStoreSettings,
  saveStoreSettings,
  getWorkingHours,
  saveWorkingHours,
  getPolicies,
  savePolicies,
} from "@/services/store.functions";
import { uploadStoreMedia } from "@/services/storage.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CitySelect } from "@/components/ui/city-select";
import { CHAPECO_NEIGHBORHOODS, type NeighborhoodPreset } from "@/lib/constants/cities";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/configuracoes/")({
  loader: async () => {
    try {
      const [settingsRes, hoursRes, policiesRes] = await Promise.all([
        getStoreSettings().catch(() => null),
        getWorkingHours().catch(() => null),
        getPolicies().catch(() => null),
      ]);
      return {
        store: settingsRes,
        workingHours: hoursRes,
        policies: policiesRes?.policies || {},
      };
    } catch {
      return {
        store: null,
        workingHours: null,
        policies: {},
      };
    }
  },
  component: WorkspaceConfiguracoesPage,
});

const DAYS_MAP = [
  { key: "mon", label: "Segunda-feira" },
  { key: "tue", label: "Terça-feira" },
  { key: "wed", label: "Quarta-feira" },
  { key: "thu", label: "Quinta-feira" },
  { key: "fri", label: "Sexta-feira" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export default function WorkspaceConfiguracoesPage() {
  const { store, workingHours: initialHours, policies: initialPolicies } = Route.useLoaderData();

  // Estados da Loja
  const [name, setName] = useState(store?.name || "");
  const [description, setDescription] = useState(store?.description || "");
  const [logoUrl, setLogoUrl] = useState(store?.settings?.logoUrl || (store as any)?.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(store?.settings?.bannerUrl || (store as any)?.banner_url || "");
  const [faviconUrl, setFaviconUrl] = useState(store?.settings?.faviconUrl || "");
  const [phone, setPhone] = useState(store?.phone || "");
  const [email, setEmail] = useState(store?.email || "");
  const [cnpj, setCnpj] = useState(store?.cnpj || "");
  const [address, setAddress] = useState(store?.address || "");
  const [city, setCity] = useState(store?.city || "");
  const [state, setState] = useState(store?.state || "");
  const [zipCode, setZipCode] = useState(store?.zip_code || "");

  // Horários
  const [hours, setHours] = useState<any>(initialHours || {});

  // Políticas
  const [privacyPolicy, setPrivacyPolicy] = useState(initialPolicies?.privacy_policy || "");
  const [returnPolicy, setReturnPolicy] = useState(initialPolicies?.return_policy || "");
  const [terms, setTerms] = useState(initialPolicies?.terms || "");

  // Perguntas Customizadas de Checkout
  const [customFields, setCustomFields] = useState<any[]>(
    store?.settings?.custom_checkout_fields || [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = target === "logo" ? setIsUploadingLogo : setIsUploadingBanner;
    const setUrl = target === "logo" ? setLogoUrl : setBannerUrl;

    setUploading(true);
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
            setUrl(res.url);
            toast.success(`${target === "logo" ? "Logotipo" : "Banner"} carregado com sucesso.`);
          }
        } catch (err: any) {
          toast.error(err.message || "Erro ao fazer upload da imagem.");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Falha ao ler arquivo.");
    }
  };

  const handleSaveAll = async () => {
    if (!name.trim()) {
      toast.error("O nome da loja é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Salva Dados da Loja e Perguntas de Checkout
      await saveStoreSettings({
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          bannerUrl: bannerUrl.trim() || undefined,
          faviconUrl: faviconUrl.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          cnpj: cnpj.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim().toUpperCase() || undefined,
          zip_code: zipCode.trim() || undefined,
          custom_checkout_fields: customFields,
        },
      });

      // 2. Salva Políticas
      await savePolicies({
        data: {
          privacy_policy: privacyPolicy,
          return_policy: returnPolicy,
          terms,
        },
      }).catch(() => null);

      // 3. Salva Horários se existirem
      if (hours && Object.keys(hours).length > 0) {
        await saveWorkingHours({ data: hours }).catch(() => null);
      }

      toast.success("Configurações da loja salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Header Minimalista & Direto ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Configurações
          </h1>
          <Badge variant="outline" className="text-xs bg-muted/50 text-foreground border-border font-medium">
            {store?.name || "Minha Loja"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5  h-9">
            <Link to="/workspace/lojas">
              <Store className="size-3.5" />
              <span>Ver Lojas</span>
            </Link>
          </Button>

          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 bg-foreground text-background hover:bg-foreground/90  h-9"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>Salvar Alterações</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── 2. Abas de Governança ── */}
      <Tabs defaultValue="geral" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 bg-muted/60 p-1 rounded-2xl">
          <TabsTrigger value="geral" className="rounded-xl text-xs font-semibold">
            Marca & Vitrine
          </TabsTrigger>
          <TabsTrigger value="contato" className="rounded-xl text-xs font-semibold">
            Contato & Endereço
          </TabsTrigger>
          <TabsTrigger value="horarios" className="rounded-xl text-xs font-semibold">
            Horários de Atendimento
          </TabsTrigger>
          <TabsTrigger value="politicas" className="rounded-xl text-xs font-semibold">
            Políticas da Loja
          </TabsTrigger>
          <TabsTrigger value="checkout" className="rounded-xl text-xs font-semibold">
            Campos de Checkout
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: Marca & Vitrine */}
        <TabsContent value="geral" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-6 ">
            <div className=" pb-4">
              <h2 className="text-base font-bold text-foreground">Identidade Visual da Loja</h2>
              <p className="text-xs text-muted-foreground">
                Estes elementos aparecem na vitrine pública, no cabeçalho e nas sacolas de compras.
              </p>
            </div>

            {/* Banner / Capa */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Capa de Cabeçalho (Banner)</Label>
              <div className="relative h-40 w-full rounded-3xl  overflow-hidden bg-muted/40 group">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Capa da Loja"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <ImageIcon className="size-8 opacity-40" />
                    <span className="text-xs">Nenhum banner cadastrado</span>
                  </div>
                )}

                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
                  {isUploadingBanner ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="size-4" />
                      <span>Fazer Upload de Capa</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "banner")}
                    disabled={isUploadingBanner}
                  />
                </label>
              </div>
              <Input
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Ou insira a URL direta da imagem..."
                className="rounded-xl text-xs h-9"
              />
            </div>

            {/* Logotipo */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Logotipo Oficial</Label>
              <div className="flex items-center gap-4">
                <div className="relative size-20 rounded-2xl  overflow-hidden bg-muted/50 shrink-0 group">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground">
                      <Store className="size-8 opacity-40" />
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                    {isUploadingLogo ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      disabled={isUploadingLogo}
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-1.5">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="URL do logotipo (PNG ou SVG transparente)..."
                    className="rounded-xl text-xs h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Recomendado: 512x512px com fundo limpo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nome Comercial da Loja *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Wider Store"
                  className="rounded-xl text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Favicon (Ícone de Aba do Navegador)</Label>
                <Input
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://.../favicon.ico"
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Slogan & Bio da Loja</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Apresente sua proposta de valor e diferenciais..."
                rows={3}
                className="rounded-2xl text-xs resize-none"
              />
            </div>
          </Card>
        </TabsContent>

        {/* ABA 2: Contato & Endereço */}
        <TabsContent value="contato" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-5 ">
            <div className=" pb-4">
              <h2 className="text-base font-bold text-foreground">Canais de Contato & Localização</h2>
              <p className="text-xs text-muted-foreground">
                Dados utilizados para emissão de pedidos, frete local e comunicação com o cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Phone className="size-3 text-primary" />
                  WhatsApp Comercial
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(49) 99999-9999"
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Mail className="size-3 text-primary" />
                  E-mail da Loja
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@minhaloja.com.br"
                  className="rounded-xl text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">CNPJ / CPF</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-4">
              <CitySelect
                stateValue={state}
                cityValue={city}
                onStateChange={setState}
                onCityChange={setCity}
              />

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Endereço Físico / Balcão</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, complemento e bairro"
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 3: Horários de Atendimento */}
        <TabsContent value="horarios" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-4 ">
            <div className=" pb-4">
              <h2 className="text-base font-bold text-foreground">Grade de Horários de Funcionamento</h2>
              <p className="text-xs text-muted-foreground">
                Define os momentos em que a loja aceita pedidos imediatos para entrega ou retirada no balcão.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {DAYS_MAP.map((day) => {
                const daySchedule = hours[day.key] || { open: true, intervals: [{ from: "09:00", to: "18:00" }] };
                const isOpen = daySchedule.open;
                const interval = daySchedule.intervals?.[0] || { from: "09:00", to: "18:00" };

                return (
                  <div
                    key={day.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl  bg-muted/20 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isOpen}
                        onCheckedChange={(checked) => {
                          setHours((prev: any) => ({
                            ...prev,
                            [day.key]: {
                              ...daySchedule,
                              open: checked,
                            },
                          }));
                        }}
                      />
                      <span className="font-semibold text-xs text-foreground w-28">
                        {day.label}
                      </span>
                    </div>

                    {isOpen ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">Das</span>
                        <Input
                          type="time"
                          value={interval.from}
                          onChange={(e) => {
                            setHours((prev: any) => ({
                              ...prev,
                              [day.key]: {
                                open: true,
                                intervals: [{ from: e.target.value, to: interval.to }],
                              },
                            }));
                          }}
                          className="w-24 rounded-xl text-xs h-8"
                        />
                        <span className="text-[11px] text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={interval.to}
                          onChange={(e) => {
                            setHours((prev: any) => ({
                              ...prev,
                              [day.key]: {
                                open: true,
                                intervals: [{ from: interval.from, to: e.target.value }],
                              },
                            }));
                          }}
                          className="w-24 rounded-xl text-xs h-8"
                        />
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                        Fechado o dia todo
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* ABA 4: Políticas da Loja */}
        <TabsContent value="politicas" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-5 ">
            <div className=" pb-4">
              <h2 className="text-base font-bold text-foreground">Políticas & Termos Comerciais</h2>
              <p className="text-xs text-muted-foreground">
                Exibidos no rodapé da loja e nas páginas de checkout para garantir conformidade jurídica.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Termos de Compra & Uso</Label>
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Escreva os termos de uso aplicáveis à sua loja..."
                  rows={4}
                  className="rounded-2xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Política de Trocas e Devoluções</Label>
                <Textarea
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  placeholder="Instruções sobre prazos de 7 dias, condições do produto e reembolso..."
                  rows={4}
                  className="rounded-2xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Política de Privacidade</Label>
                <Textarea
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="Como sua loja trata os dados dos clientes e LGPD..."
                  rows={4}
                  className="rounded-2xl text-xs"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 5: Perguntas de Checkout Personalizadas */}
        <TabsContent value="checkout" className="space-y-6">
          <Card className="p-6 rounded-3xl border-border bg-card space-y-6 ">
            <div className="flex items-center justify-between gap-3  pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ListChecks className="size-4 text-primary" />
                <span>Campos de Checkout</span>
              </h2>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setCustomFields((prev) => [
                    ...prev,
                    {
                      id: `field_${Date.now()}`,
                      label: "",
                      placeholder: "",
                      type: "text",
                      required: true,
                      help_text: "",
                    },
                  ]);
                }}
                className="rounded-xl text-xs font-bold gap-1.5 shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Adicionar Pergunta</span>
              </Button>
            </div>

            {customFields.length === 0 ? (
              <div className="p-8 rounded-3xl border-0 bg-muted/20 text-center space-y-2">
                <div className="size-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                  <ListChecks className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Nenhum campo personalizado ativo</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Exemplos úteis: "Placa do Carro" (oficinas), "Nome para Gravação a Laser" (presentes), "Restrições de Alergia" (comidas) ou "Porte do Pet" (banho e tosa).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, idx) => (
                  <div
                    key={field.id || idx}
                    className="p-4 rounded-2xl  bg-muted/20 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-foreground">
                        Pergunta #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setCustomFields((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="size-7 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-[11px] font-bold">Título da Pergunta / Label *</Label>
                        <Input
                          value={field.label || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, label: val } : f)),
                            );
                          }}
                          placeholder="ex: Placa do Veículo, Nome para Gravação, etc."
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">Tipo de Resposta</Label>
                        <select
                          value={field.type || "text"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, type: val } : f)),
                            );
                          }}
                          className="w-full h-9 px-2.5 rounded-xl  bg-card text-xs font-semibold"
                        >
                          <option value="text">Texto Curto</option>
                          <option value="textarea">Texto Longo (Mensagem)</option>
                          <option value="date">Data</option>
                          <option value="number">Número</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold">Texto de Exemplo (Placeholder)</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, placeholder: val } : f)),
                            );
                          }}
                          placeholder="ex: ABC-1234 ou Maria & João"
                          className="rounded-xl text-xs h-9"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-card ">
                        <div>
                          <Label className="text-xs font-bold block">Resposta Obrigatória</Label>
                          <span className="text-[10px] text-muted-foreground">
                            Cliente não consegue pagar sem preencher
                          </span>
                        </div>
                        <Switch
                          checked={field.required ?? true}
                          onCheckedChange={(checked) => {
                            setCustomFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, required: checked } : f)),
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
