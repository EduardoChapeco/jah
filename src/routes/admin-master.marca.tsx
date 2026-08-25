import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Image,
  Upload,
  Eye,
  Type,
  Palette,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { getPlatformBrandSettings, updatePlatformBrandSettings } from "@/services/master.functions";
import { getBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/admin-master/marca")({
  head: () => ({ meta: [{ title: "Identidade da Marca | Wider Master" }] }),
  loader: async () => {
    try {
      const brand = await getPlatformBrandSettings();
      return { brand };
    } catch {
      return {
        brand: {
          store_id: null,
          platform_name: "Wider",
          logo_url: null,
          favicon_url: null,
          show_name: true,
          show_logo: true,
          support_email: "contato@wider.com.br",
          support_whatsapp: null,
          support_hours: "Segunda a Sexta, das 08h às 18h",
          login_split_image_url: null,
          social_instagram: null,
          social_facebook: null,
          social_linkedin: null,
          address: null,
          city: null,
          state: null,
        },
      };
    }
  },
  component: AdminMasterMarcaPage,
});

function AdminMasterMarcaPage() {
  const { brand: initialBrand } = Route.useLoaderData();
  const router = useRouter();

  const [platformName, setPlatformName] = useState(initialBrand.platform_name || "Wider");
  const [showName, setShowName] = useState(initialBrand.show_name !== false);
  const [showLogo, setShowLogo] = useState(initialBrand.show_logo !== false);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialBrand.logo_url || null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(initialBrand.favicon_url || null);
  const [loginSplitImageUrl, setLoginSplitImageUrl] = useState<string | null>(initialBrand.login_split_image_url || null);
  const [supportEmail, setSupportEmail] = useState(initialBrand.support_email || "contato@wider.com.br");
  const [supportWhatsapp, setSupportWhatsapp] = useState(initialBrand.support_whatsapp || "");
  const [supportHours, setSupportHours] = useState(initialBrand.support_hours || "Segunda a Sexta, das 08h às 18h");
  const [socialInstagram, setSocialInstagram] = useState(initialBrand.social_instagram || "");
  const [socialFacebook, setSocialFacebook] = useState(initialBrand.social_facebook || "");
  const [socialLinkedin, setSocialLinkedin] = useState(initialBrand.social_linkedin || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingSplit, setIsUploadingSplit] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (
    file: File,
    path: string,
    setUrl: (url: string | null) => void,
    setLoading: (v: boolean) => void,
  ) => {
    setLoading(true);
    try {
      const db = getBrowserClient();
      const ext = file.name.split(".").pop() || "png";
      const filename = `${path}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await db.storage
        .from("brand-assets")
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = db.storage.from("brand-assets").getPublicUrl(filename);
      setUrl(urlData.publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Erro ao fazer upload. Verifique se o bucket 'brand-assets' existe no Supabase Storage.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updatePlatformBrandSettings({
        data: {
          platform_name: platformName,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          show_name: showName,
          show_logo: showLogo,
          support_email: supportEmail || undefined,
          support_whatsapp: supportWhatsapp || undefined,
          support_hours: supportHours || undefined,
          login_split_image_url: loginSplitImageUrl || undefined,
          social_instagram: socialInstagram || undefined,
          social_facebook: socialFacebook || undefined,
          social_linkedin: socialLinkedin || undefined,
        },
      });
      toast.success(
        "Identidade da marca e canais atualizados com sucesso!",
      );
      router.invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar configurações de marca.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4  pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Configurações Globais
            </span>
            <Badge
              variant="outline"
              className="text-[10px] rounded-full border-primary/30 text-primary"
            >
              <Globe className="size-3 mr-1 inline" /> Admin Master
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Identidade da Marca
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure o logo, favicon e o nome da plataforma. Estas alterações se propagam
            globalmente em todas as páginas.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="rounded-xl text-xs font-bold gap-2 h-9 px-5  shrink-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5" />
              <span>Salvar Alterações</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda — Configurações */}
        <div className="space-y-6">
          {/* Nome da Plataforma */}
          <div className="p-5 rounded-2xl  bg-card  space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Type className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Nome da Plataforma</p>
                <p className="text-[11px] text-muted-foreground">
                  Texto exibido na barra de navegação
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nome Exibido
                </Label>
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Ex: Wider, Minha Plataforma..."
                  className="text-sm rounded-xl h-9"
                  maxLength={64}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl  bg-muted/30">
                <div>
                  <p className="text-xs font-semibold text-foreground">Exibir nome na barra superior</p>
                  <p className="text-[11px] text-muted-foreground">Aparece ao lado da logo ou sozinho</p>
                </div>
                <Switch
                  checked={showName}
                  onCheckedChange={setShowName}
                  id="show-name-toggle"
                />
              </div>
            </div>
          </div>

          {/* Upload de Logo */}
          <div className="p-5 rounded-2xl  bg-card  space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Image className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Logo da Plataforma</p>
                <p className="text-[11px] text-muted-foreground">
                  PNG com fundo transparente, SVG ou WebP
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="h-24 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 flex items-center justify-center relative overflow-hidden">
              {logoUrl ? (
                <>
                  <img
                    src={logoUrl}
                    alt="Logo da plataforma"
                    className="max-h-16 max-w-[80%] object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLogoUrl(null)}
                    className="absolute top-2 right-2 size-7 rounded-xl bg-background/90 hover:bg-destructive/10 hover:text-destructive "
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground space-y-1">
                  <Image className="size-8 mx-auto opacity-25" />
                  <p className="text-xs">Nenhuma logo enviada</p>
                </div>
              )}
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/webp,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  handleUploadFile(file, "logo/platform-logo", setLogoUrl, setIsUploadingLogo);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="w-full rounded-xl text-xs font-bold h-9 gap-2"
            >
              {isUploadingLogo ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              <span>{isUploadingLogo ? "Enviando..." : "Fazer Upload da Logo"}</span>
            </Button>

            <div className="flex items-center justify-between p-3 rounded-xl  bg-muted/30">
              <div>
                <p className="text-xs font-semibold text-foreground">Exibir logo na barra superior</p>
                <p className="text-[11px] text-muted-foreground">Mostra a imagem ao lado ou no lugar do nome</p>
              </div>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} id="show-logo-toggle" />
            </div>
          </div>

          {/* Upload de Favicon */}
          <div className="p-5 rounded-2xl  bg-card  space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Palette className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Favicon (Ícone da Aba)</p>
                <p className="text-[11px] text-muted-foreground">
                  ICO, PNG 32×32 ou SVG • Máximo 1MB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl  bg-muted/20">
              <div className="size-10 rounded-xl  bg-background flex items-center justify-center overflow-hidden shrink-0">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="Favicon" className="size-7 object-contain" />
                ) : (
                  <Globe className="size-5 text-muted-foreground opacity-30" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {faviconUrl ? "Favicon personalizado ativo" : "Usando favicon padrão"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Exibido na aba do navegador e favoritos
                </p>
              </div>
              {faviconUrl && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFaviconUrl(null)}
                  className="size-7 rounded-xl hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>

            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/x-icon,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  handleUploadFile(
                    file,
                    "favicon/platform-favicon",
                    setFaviconUrl,
                    setIsUploadingFavicon,
                  );
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => faviconInputRef.current?.click()}
              disabled={isUploadingFavicon}
              className="w-full rounded-xl text-xs font-bold h-9 gap-2"
            >
              {isUploadingFavicon ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              <span>{isUploadingFavicon ? "Enviando..." : "Fazer Upload do Favicon"}</span>
            </Button>
          </div>

          {/* 4. Imagem do Split de Login / Cadastro */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Image className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Imagem do Split de Login</p>
                <p className="text-[11px] text-muted-foreground">
                  Banner lateral imersivo exibido nas telas de login e cadastro
                </p>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-muted/40 aspect-video max-h-40 flex items-center justify-center border border-border/40">
              {loginSplitImageUrl ? (
                <img
                  src={loginSplitImageUrl}
                  alt="Split de Login"
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground font-medium">
                  Nenhuma imagem personalizada (usando padrão editorial)
                </span>
              )}
            </div>

            <input
              ref={splitInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  handleUploadFile(
                    file,
                    "brand/login-split",
                    setLoginSplitImageUrl,
                    setIsUploadingSplit,
                  );
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => splitInputRef.current?.click()}
                disabled={isUploadingSplit}
                className="flex-1 rounded-xl text-xs font-bold h-9 gap-2 cursor-pointer"
              >
                {isUploadingSplit ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>{isUploadingSplit ? "Enviando..." : "Upload do Split Login"}</span>
              </Button>
              {loginSplitImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setLoginSplitImageUrl(null)}
                  className="size-9 rounded-xl hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 5. Canais Oficiais de Suporte & Atendimento */}
          <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Globe className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Canais Oficiais de Suporte</p>
                <p className="text-[11px] text-muted-foreground">
                  Exibidos na página pública /contato e nos rodapés institucionais
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">E-mail de Atendimento</Label>
                <Input
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="Ex: suporte@wider.com.br"
                  className="rounded-xl h-9 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">WhatsApp Oficial de Suporte</Label>
                <Input
                  value={supportWhatsapp}
                  onChange={(e) => setSupportWhatsapp(e.target.value)}
                  placeholder="Ex: +55 (49) 99999-9999"
                  className="rounded-xl h-9 text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Horário de Atendimento</Label>
                <Input
                  value={supportHours}
                  onChange={(e) => setSupportHours(e.target.value)}
                  placeholder="Ex: Segunda a Sexta, das 08h às 18h"
                  className="rounded-xl h-9 text-xs bg-muted/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Instagram Oficial</Label>
                  <Input
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="@wider.app"
                    className="rounded-xl h-8 text-xs bg-muted/20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">LinkedIn Oficial</Label>
                  <Input
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    placeholder="linkedin.com/company/wider"
                    className="rounded-xl h-8 text-xs bg-muted/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita — Preview ao Vivo */}
        <div>
          <div className="sticky top-6 space-y-4">
            <div className="p-5 rounded-2xl  bg-card  space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Eye className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Preview ao Vivo</p>
                  <p className="text-[11px] text-muted-foreground">
                    Como ficará a barra de navegação
                  </p>
                </div>
              </div>

              {/* Preview da TopBar */}
              <div className="rounded-xl  bg-background overflow-hidden ">
                <div className="px-3 py-2 flex items-center justify-between gap-2 ">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {showLogo && logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-6 max-w-[80px] object-contain" />
                    )}
                    {showName && (
                      <span className="font-black text-base tracking-tight text-foreground">
                        {platformName || "Wider"}
                      </span>
                    )}
                    {!showLogo && !showName && (
                      <span className="text-[10px] text-muted-foreground italic opacity-60">
                        (nada visível)
                      </span>
                    )}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/60 text-[10px] text-muted-foreground ">
                      <span>📍</span>
                      <span>Chapecó</span>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-1 max-w-[130px] mx-2">
                    <div className="w-full flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-[10px] text-muted-foreground ">
                      <span>🔍</span>
                      <span>Buscar...</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <div className="size-6 rounded-lg bg-muted  flex items-center justify-center text-[10px]">
                      🛍
                    </div>
                    <div className="size-6 rounded-lg bg-muted  flex items-center justify-center text-[10px]">
                      🔔
                    </div>
                    <div className="size-6 rounded-lg bg-primary text-primary-foreground border border-primary/30 flex items-center justify-center text-[10px] font-bold">
                      {(platformName?.[0] || "J").toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-muted/10 flex gap-1.5 overflow-hidden">
                  {["Ofertas", "Gastronomia", "Mercado"].map((c) => (
                    <span
                      key={c}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-card  text-muted-foreground shrink-0"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="px-3 py-2 text-[9px] text-muted-foreground/50 text-center">
                  ↑ Baseado nas suas configurações atuais
                </div>
              </div>

              {/* Preview da Aba */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Aba do Navegador
                </p>
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5  w-fit">
                  <div className="size-3.5 rounded overflow-hidden flex items-center justify-center bg-background  shrink-0">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="favicon" className="size-full object-contain" />
                    ) : (
                      <Globe className="size-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-[10px] text-foreground font-medium max-w-[110px] truncate">
                    {platformName || "Wider"} — Comunidade
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1">×</span>
                </div>
              </div>

              {!showLogo && !showName && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">
                    Ative pelo menos o nome ou a logo. Sem nenhum dos dois, a barra de navegação
                    ficará sem identidade visual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

