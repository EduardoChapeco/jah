import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SheetPage } from "@/components/ui/sheet-page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listActiveBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type BannerDTO,
} from "@/services/banner.functions";
import { toast } from "sonner";
import { MediaUploader } from "@/components/ui/media-uploader";

export const Route = createFileRoute("/workspace/marketing/banners")({
  head: () => ({ meta: [{ title: "Banners da Loja | Workspace" }] }),
  loader: async () => {
    const banners = await listActiveBanners({ data: { placement: "store" } }).catch(() => []);
    return { banners };
  },
  component: WorkspaceStoreBannersPage,
});

function WorkspaceStoreBannersPage() {
  const { banners: initialBanners } = Route.useLoaderData();
  const [banners, setBanners] = useState<BannerDTO[]>(initialBanners || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "gif">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [targetType, setTargetType] = useState<"product" | "category" | "external_url">("product");
  const [targetUrl, setTargetUrl] = useState("");
  const [badgeText, setBadgeText] = useState("Promoção");
  const [ctaLabel, setCtaLabel] = useState("Ver Oferta");

  const [showOverlay, setShowOverlay] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showCta, setShowCta] = useState(false);

  const refreshBanners = async () => {
    const updated = await listActiveBanners({ data: { placement: "store" } }).catch(() => []);
    setBanners(updated);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setMediaUrl("");
    setMediaType("image");
    setTargetType("product");
    setTargetUrl("");
    setBadgeText("Promoção");
    setCtaLabel("Ver Oferta");
    setShowOverlay(false);
    setShowTitle(false);
    setShowDescription(false);
    setShowBadge(false);
    setShowCta(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BannerDTO) => {
    setEditingId(b.id);
    setTitle(b.title || "");
    setSubtitle(b.subtitle || "");
    setMediaUrl(b.media_url);
    setMediaType(b.media_type);
    setTargetType((b.target_type as any) || "product");
    setTargetUrl(b.target_url || "");
    setBadgeText(b.badge_text || "Promoção");
    setCtaLabel(b.cta_label || "Ver Oferta");
    setShowOverlay(Boolean(b.show_overlay));
    setShowTitle(Boolean(b.show_title));
    setShowDescription(Boolean(b.show_description));
    setShowBadge(Boolean(b.show_badge));
    setShowCta(Boolean(b.show_cta));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título identificador do banner.");
      return;
    }
    if (!mediaUrl.trim()) {
      toast.error("Selecione ou envie a imagem/mídia do banner.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBanner({
          data: {
            id: editingId,
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            media_url: mediaUrl,
            media_type: mediaType,
            target_type: targetType,
            target_url: targetUrl.trim() || null,
            badge_text: badgeText.trim() || null,
            cta_label: ctaLabel.trim() || null,
            placement: "store",
            show_overlay: showOverlay,
            show_title: showTitle,
            show_description: showDescription,
            show_badge: showBadge,
            show_cta: showCta,
          },
        });
        toast.success("Banner atualizado com sucesso!");
      } else {
        await createBanner({
          data: {
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            media_url: mediaUrl,
            media_type: mediaType,
            target_type: targetType,
            target_url: targetUrl.trim() || undefined,
            badge_text: badgeText.trim() || undefined,
            cta_label: ctaLabel.trim() || undefined,
            placement: "store",
            show_overlay: showOverlay,
            show_title: showTitle,
            show_description: showDescription,
            show_badge: showBadge,
            show_cta: showCta,
          },
        });
        toast.success("Banner criado com sucesso!");
      }
      setIsModalOpen(false);
      await refreshBanners();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar banner da loja."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (b: BannerDTO) => {
    try {
      await updateBanner({
        data: {
          id: b.id,
          is_active: !b.is_active,
        },
      });
      toast.success(b.is_active ? "Banner pausado." : "Banner ativado!");
      await refreshBanners();
    } catch {
      toast.error("Erro ao alterar status do banner.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este banner?")) return;
    try {
      await deleteBanner({ data: { id } });
      toast.success("Banner removido.");
      await refreshBanners();
    } catch {
      toast.error("Erro ao excluir banner.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Banners da Loja</h1>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl text-xs font-bold gap-2 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Novo Banner</span>
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="p-12 text-center border-0 rounded-2xl bg-card space-y-3">
          <ImageIcon className="size-10 mx-auto text-muted-foreground opacity-40" />
          <h2 className="text-sm font-bold text-foreground">Nenhum banner cadastrado</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Crie banners para destacar promoções, lançamentos ou categorias da sua loja.
          </p>
          <div className="pt-2">
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold h-9"
            >
              Criar Primeiro Banner
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className=" bg-card rounded-2xl overflow-hidden  flex flex-col justify-between group"
            >
              <div className="relative aspect-16/9 bg-muted overflow-hidden">
                <img
                  src={b.media_url}
                  alt={b.title}
                  className="size-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <Badge
                    variant={b.is_active ? "default" : "secondary"}
                    className="text-[10px] font-bold"
                  >
                    {b.is_active ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-foreground truncate">{b.title}</h3>
                  {b.target_url && (
                    <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                      Link: {b.target_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2  text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                  >
                    {b.is_active ? (
                      <>
                        <EyeOff className="size-3.5" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" />
                        <span>Ativar</span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      title="Editar Banner"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Excluir Banner"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SheetPage
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? "Editar Banner da Loja" : "Novo Banner da Loja"}
      >
        <form onSubmit={handleSave} className="space-y-5 p-4 sm:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold text-foreground">
              Título Identificador *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Ofertas de Fim de Semana, Coleção Inverno..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl text-sm h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Mídia do Banner (16:9) *</Label>
            <MediaUploader
              value={mediaUrl ? [mediaUrl] : []}
              onChange={(urls) => setMediaUrl(urls[0] || "")}
              accept="all"
              aspect={16 / 9}
              enableCrop={true}
              lockAspect={true}
              maxFiles={1}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Destino do Clique</Label>
              <Select
                value={targetType}
                onValueChange={(val: any) => setTargetType(val)}
              >
                <SelectTrigger className="rounded-xl text-xs h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Produto Específico</SelectItem>
                  <SelectItem value="category">Categoria da Loja</SelectItem>
                  <SelectItem value="external_url">Link Externo / WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetUrl" className="text-xs font-bold text-foreground">
                URL ou ID de Destino
              </Label>
              <Input
                id="targetUrl"
                placeholder="Ex: /produto/slug-do-item ou https://..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="rounded-xl text-sm h-11 font-mono text-xs"
              />
            </div>
          </div>
          <div className="p-4 rounded-2xl  bg-muted/20 space-y-3">
            <h4 className="text-xs font-bold text-foreground">Configuração Visual</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">Exibir Título sobre a Imagem</span>
                <Switch checked={showTitle} onCheckedChange={setShowTitle} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground font-medium">Exibir Botão de Ação (CTA)</span>
                <Switch checked={showCta} onCheckedChange={setShowCta} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 ">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl text-xs font-bold h-11 px-5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-11 px-6 bg-primary text-primary-foreground cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Banner</span>
              )}
            </Button>
          </div>
        </form>
      </SheetPage>
    </div>
  );
}