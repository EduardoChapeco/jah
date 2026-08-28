import React, { useState, useEffect } from "react";
import { SheetPage } from "@/components/ui/sheet-page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
} from "lucide-react";
import { updateStoreDetails } from "@/services/store.functions";
import { uploadStoreMedia } from "@/services/storage.functions";
import { toast } from "sonner";

export interface QuickStoreData {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  cnpj?: string | null;
  description?: string | null;
  status?: "active" | "draft" | "maintenance";
}

interface QuickStoreEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: QuickStoreData | null;
  onSuccess?: () => void;
}

const STORE_TYPES = [
  { value: "ecommerce", label: "Loja Virtual / E-commerce" },
  { value: "physical_store", label: "Loja Física / Varejo Local" },
  { value: "food_service", label: "Alimentação / Restaurante / Bar" },
  { value: "event_producer", label: "Produtora de Eventos / Espaço Cultural" },
  { value: "creator", label: "Criador de Conteúdo / Artista" },
  { value: "services", label: "Prestador de Serviços / Autônomo" },
  { value: "coletivo", label: "Coletivo Cultural / Associação" },
];

export function QuickStoreEditorDialog({
  open,
  onOpenChange,
  store,
  onSuccess,
}: QuickStoreEditorDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("ecommerce");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [status, setStatus] = useState<"active" | "draft" | "maintenance">("active");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setSlug(store.slug || "");
      setType(store.type || "ecommerce");
      setDescription(store.description || "");
      setLogoUrl(store.logo_url || "");
      setBannerUrl(store.banner_url || "");
      setPhone(store.phone || "");
      setEmail(store.email || "");
      setCity(store.city || "");
      setState(store.state || "");
      setAddress(store.address || "");
      setCnpj(store.cnpj || "");
      setStatus(store.status || "active");
    }
  }, [store]);

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
            toast.success(`${target === "logo" ? "Logotipo" : "Capa"} carregado com sucesso.`);
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
      toast.error("Falha ao ler arquivo de imagem.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    if (name.trim().length < 2) {
      toast.error("O nome do espaço deve ter pelo menos 2 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      await updateStoreDetails({
        data: {
          store_id: store.id,
          name: name.trim(),
          slug: slug.trim() || undefined,
          type,
          description: description.trim() || null,
          logo_url: logoUrl.trim() || null,
          banner_url: bannerUrl.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          city: city.trim() || null,
          state: state.trim().toUpperCase() || null,
          address: address.trim() || null,
          cnpj: cnpj.trim() || null,
          status,
        },
      });

      toast.success(`Informações de "${name}" atualizadas com sucesso!`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar alterações da loja.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-3xl sm:p-6 border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Store className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Configurações da Loja & Espaço
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Altere instantaneamente a identidade visual, dados cadastrais e canais de contato da sua unidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 rounded-2xl mb-4">
              <TabsTrigger value="visual" className="rounded-xl text-xs font-semibold">
                Identidade Visual
              </TabsTrigger>
              <TabsTrigger value="dados" className="rounded-xl text-xs font-semibold">
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="contato" className="rounded-xl text-xs font-semibold">
                Contato & Local
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: Identidade Visual */}
            <TabsContent value="visual" className="space-y-4">
              {/* Capa / Banner */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Banner de Cabeçalho / Capa
                </Label>
                <div className="relative h-28 w-full rounded-2xl  overflow-hidden bg-muted/40 group">
                  {bannerUrl ? (
                    <img
                      src={bannerUrl}
                      alt="Capa da Loja"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                      <ImageIcon className="size-6 opacity-40" />
                      <span className="text-[11px]">Nenhum banner cadastrado</span>
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
                    {isUploadingBanner ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="size-4" />
                        <span>Trocar Capa</span>
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
                  placeholder="Ou cole a URL direta da imagem de capa..."
                  className="rounded-xl text-xs h-8"
                />
              </div>

              {/* Logotipo */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Logotipo / Ícone da Marca
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative size-16 rounded-2xl  overflow-hidden bg-muted/50 shrink-0 group">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo da Loja"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <Store className="size-7 opacity-40" />
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
                      placeholder="URL do logotipo (PNG ou SVG recomendado)..."
                      className="rounded-xl text-xs h-9"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use imagem quadrada (ex: 400x400) com fundo transparente ou sólido.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: Dados Básicos */}
            <TabsContent value="dados" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Nome do Negócio *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cantina do Lago"
                    className="rounded-xl text-xs h-9"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Slug da Vitrine *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-muted-foreground">
                      wider.com.br/
                    </span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="cantina-do-lago"
                      className="rounded-xl text-xs h-9 pl-24 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Segmento / Categoria</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-xl text-xs h-9">
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {STORE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Status Operacional</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger className="rounded-xl text-xs h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="active" className="text-xs text-emerald-600 font-semibold">
                        ● Aberto ao Público (Ativo)
                      </SelectItem>
                      <SelectItem value="maintenance" className="text-xs text-amber-600 font-semibold">
                        ● Em Manutenção / Pausado
                      </SelectItem>
                      <SelectItem value="draft" className="text-xs text-muted-foreground font-semibold">
                        ● Rascunho / Configuração
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Bio / Descrição Comercial</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte um pouco sobre a história da sua marca, especialidades e diferenciais..."
                  rows={3}
                  className="rounded-2xl text-xs resize-none"
                />
              </div>
            </TabsContent>

            {/* ABA 3: Contato & Local */}
            <TabsContent value="contato" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Phone className="size-3 text-primary" />
                    WhatsApp / Telefone Comercial
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
                    E-mail Comercial
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@minhaloja.com.br"
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Endereço Completo</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro..."
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Cidade</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Miguel do Oeste"
                    className="rounded-xl text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Estado (UF)</Label>
                  <Input
                    value={state}
                    maxLength={2}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SC"
                    className="rounded-xl text-xs h-9 uppercase font-mono"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3  flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl text-xs font-bold gap-1.5 "
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
