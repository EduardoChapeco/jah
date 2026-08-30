import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  User2,
  ExternalLink,
  Smartphone,
  Sparkles,
  Link as LinkIcon,
  MessageCircle,
  QrCode,
  Video,
  Layers,
  Palette,
  Share2,
  Copy,
  Check,
  Eye,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Facebook,
  Mail,
  Phone,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/state/states";
import { ImageUpload } from "@/components/ui/image-upload";
import { getLinkInBio, upsertLinkInBio } from "@/services/cms.functions";

export const Route = createFileRoute("/workspace/cms/bio")({
  head: () => ({ meta: [{ title: "Editor de Link da Bio & Perfil Público | Wider" }] }),
  loader: async () => {
    const res = await getLinkInBio().catch(() => null);
    return res || {};
  },
  component: CmsBioPage,
});

type BlockType = "link" | "whatsapp" | "pix" | "video" | "header";
type ThemeId = "clean" | "dark" | "glass" | "sunset" | "emerald" | "zine";

interface BioBlock {
  id: string;
  type: BlockType;
  label: string;
  url?: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  pixKey?: string;
  pixReceiver?: string;
  videoUrl?: string;
  isHighlighted?: boolean;
}

interface SocialLinks {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
}

const THEME_OPTIONS: { id: ThemeId; label: string; bgClass: string; cardClass: string }[] = [
  {
    id: "clean",
    label: "Clean Minimal (Apple)",
    bgClass: "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
    cardClass: "bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-400 text-zinc-900",
  },
  {
    id: "dark",
    label: "Dark Luxury (OLED)",
    bgClass: "bg-black text-white",
    cardClass: "bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-white",
  },
  {
    id: "glass",
    label: "Glassmorphism",
    bgClass: "bg-linear-to-br from-indigo-950 via-slate-900 to-black text-white",
    cardClass: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 text-white",
  },
  {
    id: "sunset",
    label: "Sunset Glow",
    bgClass: "bg-linear-to-b from-orange-500 via-rose-600 to-purple-900 text-white",
    cardClass: "bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 text-white",
  },
  {
    id: "emerald",
    label: "Neo Emerald",
    bgClass: "bg-linear-to-b from-emerald-950 via-teal-900 to-black text-white",
    cardClass: "bg-emerald-900/40 backdrop-blur-md border border-emerald-700/50 hover:bg-emerald-800/40 text-emerald-100",
  },
  {
    id: "zine",
    label: "Editorial Zine",
    bgClass: "bg-[#f4efe6] text-black",
    cardClass: "bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-black",
  },
];

function CmsBioPage() {
  const router = useRouter();
  const initialData = Route.useLoaderData();

  const [activeTab, setActiveTab] = useState<"blocks" | "social" | "theme" | "profile">("blocks");
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    avatar_url: initialData.avatar_url || "",
    theme: (initialData.theme as ThemeId) || "clean",
    socials: (initialData.socials as SocialLinks) || {},
    links: Array.isArray(initialData.links) ? (initialData.links as BioBlock[]) : [],
  });

  const [isSaving, setIsSaving] = useState(false);

  const selectedTheme = useMemo(() => {
    return THEME_OPTIONS.find((t) => t.id === formData.theme) || THEME_OPTIONS[0];
  }, [formData.theme]);

  const handleAddBlock = (type: BlockType = "link") => {
    const newBlock: BioBlock = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      label:
        type === "whatsapp"
          ? "Fale Conosco no WhatsApp"
          : type === "pix"
            ? "Apoiar via Chave PIX"
            : type === "video"
              ? "Assista ao Nosso Vídeo"
              : type === "header"
                ? "Destaques & Novidades"
                : "Novo Link / Botão",
      url: type === "header" ? undefined : "https://",
    };

    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, newBlock],
    }));
  };

  const handleBlockChange = (index: number, field: keyof BioBlock, value: any) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const handleRemoveBlock = (index: number) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const handleSocialChange = (network: keyof SocialLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [network]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("O Título ou Nome do Perfil é obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      await upsertLinkInBio({
        data: {
          title: formData.title,
          description: formData.description,
          avatar_url: formData.avatar_url,
          links: formData.links,
          theme: formData.theme,
          socials: formData.socials,
        } as any,
      });
      toast.success("Link da Bio publicado e atualizado com sucesso!");
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar Perfil da Bio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-screen">
      <PageHeader
        eyebrow="Cultural, CMS & Zines"
        title="Editor de Link da Bio & Perfil Público"
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-xl font-bold text-xs h-9"
            >
              <a href="/bio/loja" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5 mr-1.5" />
                <span>Ver Link Público</span>
              </a>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs"
            >
              <Save className="size-3.5" />
              <span>{isSaving ? "Publicando..." : "Salvar & Publicar"}</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Painel de Configuração (Esquerda 7 Cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-11 p-1 bg-muted/60 rounded-2xl">
              <TabsTrigger value="blocks" className="rounded-xl font-bold text-xs gap-1.5">
                <Layers className="size-3.5" />
                <span>Blocos & Links</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl font-bold text-xs gap-1.5">
                <User2 className="size-3.5" />
                <span>Identidade</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="rounded-xl font-bold text-xs gap-1.5">
                <Share2 className="size-3.5" />
                <span>Redes Sociais</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="rounded-xl font-bold text-xs gap-1.5">
                <Palette className="size-3.5" />
                <span>Temas & Estilo</span>
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: Blocos & Links ── */}
            <TabsContent value="blocks" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Blocos do Perfil</h3>
                  <p className="text-xs text-muted-foreground">
                    Adicione links de produtos, botões de contato, chave PIX ou vídeos.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => handleAddBlock("link")}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold h-8 gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>Link</span>
                  </Button>
                  <Button
                    onClick={() => handleAddBlock("whatsapp")}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold h-8 gap-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>WhatsApp</span>
                  </Button>
                  <Button
                    onClick={() => handleAddBlock("pix")}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold h-8 gap-1 text-primary dark:text-primary"
                  >
                    <QrCode className="size-3.5" />
                    <span>PIX</span>
                  </Button>
                  <Button
                    onClick={() => handleAddBlock("header")}
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs font-bold h-8"
                  >
                    <span>Divisor</span>
                  </Button>
                </div>
              </div>

              {formData.links.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-3xl space-y-3 bg-muted/10">
                  <Sparkles className="size-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-bold text-foreground">Nenhum botão cadastrado ainda</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Clique em um dos botões acima para adicionar links de produtos, WhatsApp ou chave PIX.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.links.map((block, index) => (
                    <div
                      key={block.id || index}
                      className="p-4 rounded-2xl bg-card border border-border/70 space-y-3 shadow-2xs group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="size-4 text-muted-foreground/60 cursor-move" />
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {block.type === "link"
                              ? "Link"
                              : block.type === "whatsapp"
                                ? "WhatsApp"
                                : block.type === "pix"
                                  ? "Chave PIX"
                                  : block.type === "video"
                                    ? "Vídeo Embed"
                                    : "Título / Divisor"}
                          </Badge>
                          {block.isHighlighted && (
                            <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                              Destaque
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleBlockChange(index, "isHighlighted", !block.isHighlighted)
                            }
                          >
                            {block.isHighlighted ? "Remover Destaque" : "Destacar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveBlock(index)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Campos Dinâmicos por Tipo de Bloco */}
                      {block.type === "header" ? (
                        <div>
                          <Label className="text-xs font-bold">Texto do Divisor / Cabeçalho</Label>
                          <Input
                            value={block.label}
                            onChange={(e) => handleBlockChange(index, "label", e.target.value)}
                            placeholder="Ex: Nossos Serviços Mais Procurados"
                            className="h-9 text-xs rounded-xl mt-1 font-bold"
                          />
                        </div>
                      ) : block.type === "pix" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-bold">Rótulo do Bloco</Label>
                            <Input
                              value={block.label}
                              onChange={(e) => handleBlockChange(index, "label", e.target.value)}
                              placeholder="Ex: Apoiar via Chave PIX"
                              className="h-9 text-xs rounded-xl mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold">Chave PIX</Label>
                            <Input
                              value={block.pixKey || ""}
                              onChange={(e) => handleBlockChange(index, "pixKey", e.target.value)}
                              placeholder="Email, CPF, CNPJ ou Aleatória"
                              className="h-9 text-xs rounded-xl mt-1 font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-bold">Nome do Favorecido / Banco</Label>
                            <Input
                              value={block.pixReceiver || ""}
                              onChange={(e) => handleBlockChange(index, "pixReceiver", e.target.value)}
                              placeholder="Ex: Wider Tecnologia LTDA (Nubank)"
                              className="h-9 text-xs rounded-xl mt-1"
                            />
                          </div>
                        </div>
                      ) : block.type === "whatsapp" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-bold">Texto do Botão</Label>
                            <Input
                              value={block.label}
                              onChange={(e) => handleBlockChange(index, "label", e.target.value)}
                              placeholder="Ex: Fale com nossa equipe"
                              className="h-9 text-xs rounded-xl mt-1 font-bold"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold">WhatsApp (com DDD)</Label>
                            <Input
                              value={block.url || ""}
                              onChange={(e) => handleBlockChange(index, "url", e.target.value)}
                              placeholder="49998812233 ou https://wa.me/..."
                              className="h-9 text-xs rounded-xl mt-1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-bold">Mensagem Padrão (Opcional)</Label>
                            <Input
                              value={block.subtitle || ""}
                              onChange={(e) => handleBlockChange(index, "subtitle", e.target.value)}
                              placeholder="Ex: Olá! Gostaria de saber mais sobre os produtos."
                              className="h-9 text-xs rounded-xl mt-1"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-bold">Título do Botão</Label>
                            <Input
                              value={block.label}
                              onChange={(e) => handleBlockChange(index, "label", e.target.value)}
                              placeholder="Ex: Ver Catálogo Completo"
                              className="h-9 text-xs rounded-xl mt-1 font-bold"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold">URL de Destino</Label>
                            <Input
                              value={block.url || ""}
                              onChange={(e) => handleBlockChange(index, "url", e.target.value)}
                              placeholder="https://..."
                              className="h-9 text-xs rounded-xl mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold">Subtítulo / Descrição Curta (Opcional)</Label>
                            <Input
                              value={block.subtitle || ""}
                              onChange={(e) => handleBlockChange(index, "subtitle", e.target.value)}
                              placeholder="Ex: Frete grátis para toda a região"
                              className="h-9 text-xs rounded-xl mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold">Selo Promocional / Badge (Opcional)</Label>
                            <Input
                              value={block.badge || ""}
                              onChange={(e) => handleBlockChange(index, "badge", e.target.value)}
                              placeholder="Ex: NOVO ou 20% OFF"
                              className="h-9 text-xs rounded-xl mt-1 font-mono uppercase"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── TAB 2: Identidade do Perfil ── */}
            <TabsContent value="profile" className="space-y-4 pt-4">
              <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="shrink-0">
                    <Label className="text-xs font-bold block mb-2">Foto de Perfil / Logo</Label>
                    <ImageUpload
                      value={formData.avatar_url}
                      onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                      variant="avatar"
                      aspectPreset="square"
                      bucket="cms-media"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <Label htmlFor="title" className="text-xs font-bold">Nome do Perfil / Título Principal</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: @wider.oficial ou Restaurante Sabor & Arte"
                        className="h-10 text-xs rounded-xl mt-1 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs font-bold">Biografia / Descrição Curta</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Conte quem você é, seu segmento, endereço ou slogan em poucas linhas..."
                    className="resize-none h-24 text-xs rounded-2xl mt-1 leading-relaxed"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 3: Redes Sociais ── */}
            <TabsContent value="social" className="space-y-4 pt-4">
              <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Canais Sociais & Contato</h3>
                  <p className="text-xs text-muted-foreground">
                    Os ícones sociais serão exibidos de forma fluida no topo ou rodapé do seu perfil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Instagram className="size-3.5 text-primary" />
                      <span>Instagram (@usuario)</span>
                    </Label>
                    <Input
                      value={formData.socials.instagram || ""}
                      onChange={(e) => handleSocialChange("instagram", e.target.value)}
                      placeholder="@minhaloja ou url"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <MessageCircle className="size-3.5 text-emerald-500" />
                      <span>WhatsApp Geral</span>
                    </Label>
                    <Input
                      value={formData.socials.whatsapp || ""}
                      onChange={(e) => handleSocialChange("whatsapp", e.target.value)}
                      placeholder="49999881122"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Youtube className="size-3.5 text-destructive" />
                      <span>YouTube</span>
                    </Label>
                    <Input
                      value={formData.socials.youtube || ""}
                      onChange={(e) => handleSocialChange("youtube", e.target.value)}
                      placeholder="https://youtube.com/@..."
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Linkedin className="size-3.5 text-info" />
                      <span>LinkedIn</span>
                    </Label>
                    <Input
                      value={formData.socials.linkedin || ""}
                      onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Twitter className="size-3.5 text-sky-500" />
                      <span>X (Antigo Twitter)</span>
                    </Label>
                    <Input
                      value={formData.socials.twitter || ""}
                      onChange={(e) => handleSocialChange("twitter", e.target.value)}
                      placeholder="@minhaloja"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Mail className="size-3.5 text-amber-500" />
                      <span>Email Comercial</span>
                    </Label>
                    <Input
                      value={formData.socials.email || ""}
                      onChange={(e) => handleSocialChange("email", e.target.value)}
                      placeholder="contato@minhaloja.com.br"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB 4: Temas & Estilo Visual ── */}
            <TabsContent value="theme" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = formData.theme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setFormData({ ...formData, theme: theme.id })}
                      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{theme.label}</span>
                        {isSelected && (
                          <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">
                            Ativo
                          </Badge>
                        )}
                      </div>
                      <div className={`p-4 rounded-2xl ${theme.bgClass} flex flex-col gap-2`}>
                        <div className="size-8 rounded-full bg-muted/60 mx-auto" />
                        <div className="h-2 w-20 bg-muted/60 rounded-full mx-auto" />
                        <div className={`h-7 rounded-xl ${theme.cardClass} flex items-center justify-center text-[10px] font-bold`}>
                          Exemplo de Botão
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Truthful Live Preview Mockup Smartphone (Direita 5 Cols) ── */}
        <div className="lg:col-span-5 sticky top-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Smartphone className="size-4" />
            <span>Truthful Live Preview</span>
          </div>

          {/* Frame do Smartphone */}
          <div className="w-[340px] h-[660px] rounded-[44px] bg-zinc-900 p-3 border-4 border-zinc-800 flex flex-col">
            <div className="w-full h-full rounded-[34px] overflow-y-auto scrollbar-none flex flex-col transition-colors duration-300 relative">
              {/* Dynamic Theme Background */}
              <div className={`min-h-full w-full p-5 flex flex-col items-center justify-start space-y-5 ${selectedTheme.bgClass}`}>
                {/* Header do Perfil */}
                <div className="flex flex-col items-center text-center space-y-2 pt-4">
                  <div className="size-20 rounded-full bg-muted/40 border-2 border-white/20 overflow-hidden flex items-center justify-center">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <User2 className="size-8 opacity-60" />
                    )}
                  </div>
                  <div className="space-y-1 max-w-[260px]">
                    <h2 className="text-base font-black tracking-tight leading-tight">
                      {formData.title || "Nome da Sua Marca"}
                    </h2>
                    {formData.description && (
                      <p className="text-xs opacity-80 leading-relaxed line-clamp-3">
                        {formData.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ícones de Redes Sociais */}
                {Object.values(formData.socials).some(Boolean) && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    {formData.socials.instagram && (
                      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center opacity-80">
                        <Instagram className="size-3.5" />
                      </div>
                    )}
                    {formData.socials.whatsapp && (
                      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center opacity-80">
                        <MessageCircle className="size-3.5" />
                      </div>
                    )}
                    {formData.socials.youtube && (
                      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center opacity-80">
                        <Youtube className="size-3.5" />
                      </div>
                    )}
                    {formData.socials.linkedin && (
                      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center opacity-80">
                        <Linkedin className="size-3.5" />
                      </div>
                    )}
                    {formData.socials.email && (
                      <div className="size-7 rounded-full bg-white/10 flex items-center justify-center opacity-80">
                        <Mail className="size-3.5" />
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Blocos */}
                <div className="w-full space-y-2.5 flex-1 pb-6">
                  {formData.links.map((block, idx) => {
                    if (block.type === "header") {
                      return (
                        <div key={idx} className="pt-2 pb-1 text-center">
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                            {block.label}
                          </span>
                        </div>
                      );
                    }

                    if (block.type === "pix") {
                      return (
                        <div
                          key={idx}
                          className={`w-full p-3 rounded-2xl flex flex-col gap-1.5 transition-all text-xs ${selectedTheme.cardClass}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5">
                              <QrCode className="size-3.5 text-primary" />
                              <span>{block.label}</span>
                            </span>
                            <Badge variant="outline" className="text-[9px] font-mono">
                              PIX
                            </Badge>
                          </div>
                          {block.pixReceiver && (
                            <span className="text-[10px] opacity-75">{block.pixReceiver}</span>
                          )}
                          <div className="mt-1 flex items-center justify-between p-1.5 rounded-lg bg-black/20 font-mono text-[10px]">
                            <span className="truncate pr-2">{block.pixKey || "Chave PIX"}</span>
                            <Copy className="size-3 shrink-0 opacity-70" />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-2 text-xs transition-transform duration-200 ${selectedTheme.cardClass} ${
                          block.isHighlighted ? "ring-2 ring-amber-400" : ""
                        }`}
                      >
                        <div className="flex-1 text-left truncate space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {block.type === "whatsapp" ? (
                              <MessageCircle className="size-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <LinkIcon className="size-3.5 opacity-60 shrink-0" />
                            )}
                            <span className="font-bold truncate">{block.label}</span>
                          </div>
                          {block.subtitle && (
                            <p className="text-[10px] opacity-75 truncate">{block.subtitle}</p>
                          )}
                        </div>

                        {block.badge && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500 text-white shrink-0">
                            {block.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rodapé Powered by Wider */}
                <div className="pt-2 pb-2 text-[10px] opacity-50 font-bold uppercase tracking-widest">
                  Wider Community
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
