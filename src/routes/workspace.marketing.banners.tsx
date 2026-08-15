import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Loader2,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  listActiveBanners,
  createBanner,
  deleteBanner,
  type BannerDTO,
} from "@/services/banner.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/marketing/banners")({
  head: () => ({ meta: [{ title: "Gestão de Banners de Topo | JAH Workspace" }] }),
  loader: async () => {
    const banners = await listActiveBanners({ data: { placement: "all" } }).catch(() => []);
    return { banners };
  },
  component: WorkspaceBannersPage,
});

function WorkspaceBannersPage() {
  const { banners: initialBanners } = Route.useLoaderData();
  const [banners, setBanners] = useState<BannerDTO[]>(initialBanners || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "gif">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [targetType, setTargetType] = useState<
    "category" | "product" | "hotpage" | "store" | "external_url"
  >("hotpage");
  const [targetUrl, setTargetUrl] = useState("");
  const [targetId, setTargetId] = useState("");
  const [placement, setPlacement] = useState<
    "home" | "marketplace" | "events" | "classifieds" | "all"
  >("home");
  const [badgeText, setBadgeText] = useState("Destaque");
  const [ctaLabel, setCtaLabel] = useState("Conferir");

  const refreshBanners = async () => {
    const updated = await listActiveBanners({ data: { placement: "all" } }).catch(() => []);
    setBanners(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título do banner.");
      return;
    }
    if (!mediaUrl.trim()) {
      toast.error("Informe a URL da mídia (imagem, GIF ou vídeo).");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBanner({
        data: {
          title,
          subtitle: subtitle || undefined,
          media_type: mediaType,
          media_url: mediaUrl,
          target_type: targetType,
          target_id: targetId || undefined,
          target_url: targetUrl || undefined,
          placement,
          badge_text: badgeText || undefined,
          cta_label: ctaLabel || undefined,
          is_active: true,
        },
      });

      toast.success("Banner criado e ativado com sucesso!");
      setIsModalOpen(false);
      // Reset form
      setTitle("");
      setSubtitle("");
      setMediaUrl("");
      refreshBanners();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao criar banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este banner?")) return;
    try {
      await deleteBanner({ data: { id } });
      toast.success("Banner removido.");
      refreshBanners();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover banner.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Marketing & Vitrines
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Banners de Topo Universais
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gerencie banners de alta visibilidade com proporção fixa, suporte a Vídeo/GIF/Imagem e
            links contextuais.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground text-xs gap-2 shadow-xs"
        >
          <Plus className="size-4" />
          <span>Novo Banner</span>
        </Button>
      </div>

      {/* Banner List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            {/* 16:9 Banner Preview */}
            <div className="relative aspect-16/9 w-full bg-muted overflow-hidden">
              {b.media_type === "video" ? (
                <video
                  src={b.media_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="size-full object-cover"
                />
              ) : (
                <img
                  src={b.media_url}
                  alt={b.title}
                  className="size-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Overlay preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 sm:p-6 flex flex-col justify-end text-white">
                {b.badge_text && (
                  <span className="w-fit px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider mb-1">
                    {b.badge_text}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-black leading-tight line-clamp-1">
                  {b.title}
                </h3>
                {b.subtitle && <p className="text-xs text-zinc-300 line-clamp-1">{b.subtitle}</p>}
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-bold">
                {b.media_type === "video" ? (
                  <Video className="size-3 text-sky-400" />
                ) : (
                  <ImageIcon className="size-3 text-amber-400" />
                )}
                <span className="uppercase">{b.media_type}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center justify-between border-t border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                  {b.placement}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                  {b.cta_label || "Conferir"}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(b.id)}
                className="size-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-3 bg-muted/20 rounded-3xl border border-dashed border-border p-8">
            <Sparkles className="size-8 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-foreground text-sm">Nenhum banner cadastrado</h3>
            <p className="text-xs text-muted-foreground">
              Crie seu primeiro banner com vídeo ou imagem para impulsionar suas campanhas.
            </p>
          </div>
        )}
      </div>

      {/* Minimalist Modal Creator */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl p-6 sm:p-8 rounded-3xl border border-border bg-background shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black tracking-tight">
              Criar Banner Minimalista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Suba mídia de alta qualidade com proporção fixa e conecte diretamente ao seu produto
              ou categoria.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            {/* Live 16:9 Crop Preview */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Preview em Tempo Real (16:9 Fiel)
              </Label>
              <div className="relative aspect-16/9 w-full rounded-2xl border border-border bg-muted overflow-hidden flex items-center justify-center">
                {mediaUrl ? (
                  mediaType === "video" ? (
                    <video
                      src={mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="size-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={title || "Preview"}
                      className="size-full object-cover"
                    />
                  )
                ) : (
                  <div className="text-center text-muted-foreground space-y-1">
                    <ImageIcon className="size-8 mx-auto stroke-1" />
                    <p className="text-xs">Insira a URL da mídia abaixo para visualizar</p>
                  </div>
                )}

                {/* Simulated Content */}
                {mediaUrl && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 flex flex-col justify-end text-white">
                    {badgeText && (
                      <span className="w-fit px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider mb-1">
                        {badgeText}
                      </span>
                    )}
                    <h4 className="text-lg font-black leading-tight line-clamp-1">
                      {title || "Título do Banner"}
                    </h4>
                    {subtitle && <p className="text-xs text-zinc-300 line-clamp-1">{subtitle}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Mídia
                </Label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="image">Imagem Estática (JPG/PNG/WebP)</option>
                  <option value="video">Vídeo em Loop (MP4/WebM)</option>
                  <option value="gif">GIF Animado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Onde Exibir (Placement)
                </Label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="home">Home Principal</option>
                  <option value="marketplace">Mercado & Produtos</option>
                  <option value="events">Agenda Cultural & Eventos</option>
                  <option value="classifieds">Classificados</option>
                  <option value="all">Todas as Páginas</option>
                </select>
              </div>
            </div>

            {/* Media URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                URL da Mídia
              </Label>
              <Input
                placeholder="https://images.unsplash.com/... ou https://meusite.com/video.mp4"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="h-11 rounded-xl text-xs bg-card"
                required
              />
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Título Principal
                </Label>
                <Input
                  placeholder="Ex: Festival de Burger Artesanal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 rounded-xl text-xs bg-card"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subtítulo / Chamada
                </Label>
                <Input
                  placeholder="Ex: Blends especiais com entrega grátis"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-11 rounded-xl text-xs bg-card"
                />
              </div>
            </div>

            {/* Action & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Texto da Tag / Badge
                </Label>
                <Input
                  placeholder="Ex: Destaque da Semana"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="h-11 rounded-xl text-xs bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Botão de Ação (CTA)
                </Label>
                <Input
                  placeholder="Ex: Pedir Agora"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="h-11 rounded-xl text-xs bg-card"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-11 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Publicar Banner"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
