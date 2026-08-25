import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Tag,
  ArrowRight,
  Tv,
  Pencil,
  Search,
  Filter,
  Sliders,
  ExternalLink,
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
  type BannerPlacement,
} from "@/services/banner.functions";
import { toast } from "sonner";
import { MediaUploader } from "@/components/ui/media-uploader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-master/banners")({
  head: () => ({ meta: [{ title: "Banners Globais & Vitrines por Nicho | Admin Master" }] }),
  loader: async () => {
    const banners = await listActiveBanners({ data: { placement: "all" } }).catch(() => []);
    return { banners };
  },
  component: AdminMasterBannersPage,
});

export const PLACEMENT_OPTIONS: { id: BannerPlacement; label: string; emoji: string }[] = [
  { id: "all", label: "Todas as Vitrines", emoji: "🌐" },
  { id: "home", label: "Início (Home Principal)", emoji: "🏠" },
  { id: "gastronomia", label: "Gastronomia & Delivery", emoji: "🍽️" },
  { id: "mercado", label: "Supermercado & Feira", emoji: "🛒" },
  { id: "farmacia", label: "Farmácia & Saúde", emoji: "💊" },
  { id: "bebidas", label: "Bebidas & Adega", emoji: "🍻" },
  { id: "acougue", label: "Açougue & Carnes", emoji: "🥩" },
  { id: "moda", label: "Moda & Vestuário", emoji: "👗" },
  { id: "eletronicos", label: "Eletrônicos & Tech", emoji: "📱" },
  { id: "pet", label: "Pet Shop & Animais", emoji: "🐾" },
  { id: "servicos", label: "Serviços & Profissionais", emoji: "💼" },
  { id: "imoveis", label: "Imóveis & Locação", emoji: "🏢" },
  { id: "construcao", label: "Construção & Reforma", emoji: "🔨" },
  { id: "casa", label: "Casa & Decoração", emoji: "🛋️" },
  { id: "beleza", label: "Beleza & Estética", emoji: "✂️" },
  { id: "limpeza", label: "Limpeza & Utilidades", emoji: "🧹" },
  { id: "livros", label: "Livros & Papelaria", emoji: "📚" },
  { id: "noticias", label: "Portal de Notícias", emoji: "📰" },
  { id: "agenda", label: "Agenda & Eventos", emoji: "📅" },
  { id: "turismo", label: "Turismo & Hospedagem", emoji: "✈️" },
  { id: "empregos", label: "Empregos & Vagas", emoji: "💼" },
  { id: "classificados", label: "Classificados P2P", emoji: "🏷️" },
  { id: "diretorio", label: "Diretório Comercial", emoji: "🧭" },
  { id: "mobilidade", label: "Mobilidade & Corridas", emoji: "🚗" },
  { id: "ofertas", label: "Ofertas & Promoções", emoji: "⚡" },
];

function AdminMasterBannersPage() {
  const { banners: initialBanners } = Route.useLoaderData();
  const [banners, setBanners] = useState<BannerDTO[]>(initialBanners || []);
  const [selectedPlacementTab, setSelectedPlacementTab] = useState<BannerPlacement>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [placement, setPlacement] = useState<BannerPlacement>("home");
  const [badgeText, setBadgeText] = useState("Destaque");
  const [ctaLabel, setCtaLabel] = useState("Conferir");
  const [bannerFormat, setBannerFormat] = useState<"hero" | "slim">("hero");
  const [gradientStyle, setGradientStyle] = useState<string>("blue");

  // Customization Switches (PADRÃO: DESATIVADO PARA VISUAL 100% CLEAN)
  const [showOverlay, setShowOverlay] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showCta, setShowCta] = useState(false);

  const refreshBanners = async () => {
    const updated = await listActiveBanners({ data: { placement: "all" } }).catch(() => []);
    setBanners(updated);
  };

  const handleOpenCreate = (preselectedPlacement?: BannerPlacement) => {
    const targetPlacement =
      preselectedPlacement && preselectedPlacement !== "all"
        ? preselectedPlacement
        : selectedPlacementTab !== "all"
        ? selectedPlacementTab
        : "home";

    setEditingId(null);
    setBannerFormat("hero");
    setGradientStyle("blue");
    setTitle("");
    setSubtitle("");
    setMediaUrl("");
    setTargetUrl("");
    setPlacement(targetPlacement);
    setShowOverlay(false);
    setShowTitle(false);
    setShowDescription(false);
    setShowBadge(false);
    setShowCta(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: BannerDTO) => {
    setEditingId(banner.id);
    setBannerFormat((banner as any).format || "hero");
    setGradientStyle((banner as any).gradient_style || "blue");
    setTitle(banner.title || "");
    setSubtitle(banner.subtitle || "");
    setMediaType(banner.media_type || "image");
    setMediaUrl(banner.media_url || "");
    setTargetType(banner.target_type || "hotpage");
    setTargetUrl(banner.target_url || "");
    setPlacement(banner.placement || "home");
    setBadgeText(banner.badge_text || "Destaque");
    setCtaLabel(banner.cta_label || "Conferir");
    setShowOverlay(banner.show_overlay === true);
    setShowTitle(banner.show_title === true);
    setShowDescription(banner.show_description === true);
    setShowBadge(banner.show_badge === true);
    setShowCta(banner.show_cta === true);
    setIsModalOpen(true);
  };

  const handleToggleOverlay = async (id: string, newOverlayValue: boolean) => {
    try {
      await updateBanner({
        data: {
          id,
          show_overlay: newOverlayValue,
          show_title: newOverlayValue,
          show_description: newOverlayValue,
          show_badge: newOverlayValue,
          show_cta: newOverlayValue,
        },
      });
      toast.success(newOverlayValue ? "Textos ativados no banner." : "Banner configurado como Arte Limpa.");
      refreshBanners();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar modo do banner.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      toast.error("Selecione ou informe a URL da mídia do banner.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBanner({
          data: {
            id: editingId,
            title: title || "Banner Oficial Wider",
            subtitle: subtitle || null,
            media_type: mediaType,
            media_url: mediaUrl,
            target_type: targetType,
            target_url: targetUrl || null,
            placement,
            badge_text: badgeText || null,
            cta_label: ctaLabel || null,
            show_title: showTitle,
            show_description: showDescription,
            show_overlay: showOverlay,
            show_badge: showBadge,
            show_cta: showCta,
          },
        });
        toast.success("Banner atualizado com sucesso!");
      } else {
        await createBanner({
          data: {
            title: title || "Banner Oficial Wider",
            subtitle: subtitle || undefined,
            media_type: mediaType,
            media_url: mediaUrl,
            target_type: targetType,
            target_url: targetUrl || undefined,
            placement,
            badge_text: badgeText || undefined,
            cta_label: ctaLabel || undefined,
            show_title: showTitle,
            show_description: showDescription,
            show_overlay: showOverlay,
            show_badge: showBadge,
            show_cta: showCta,
            is_active: true,
          },
        });
        toast.success(`Banner publicado para ${placement.toUpperCase()} com sucesso!`);
      }

      setIsModalOpen(false);
      refreshBanners();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao salvar banner.");
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

  // Filtragem por Nicho / Placement selecionado e busca
  const filteredBanners = banners.filter((b) => {
    const matchesPlacement =
      selectedPlacementTab === "all" ? true : b.placement === selectedPlacementTab;
    const matchesSearch =
      !searchTerm ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.placement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.target_url && b.target_url.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesPlacement && matchesSearch;
  });

  const activePlacementInfo = PLACEMENT_OPTIONS.find((p) => p.id === selectedPlacementTab);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Governança de Vitrines & Banners
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
            Banners Segmentados por Nicho & Mercado
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cada marketplace e página possui seus próprios banners independentes. Selecione o nicho abaixo para gerenciar sua vitrine.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => handleOpenCreate()}
            className="rounded-xl font-bold gap-2 text-xs h-10 px-4 bg-primary text-primary-foreground cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            <span>
              {selectedPlacementTab === "all"
                ? "Novo Banner Global"
                : `+ Banner em ${activePlacementInfo?.label.split(" ")[0]}`}
            </span>
          </Button>
        </div>
      </div>

      {/* ── SELETOR DE NICHOS / NAVEGADOR DE MERCADOS (TABS) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Filtrar por Nicho de Mercado ({PLACEMENT_OPTIONS.length - 1} nichos)
          </span>
          <span className="text-xs text-muted-foreground">
            Exibindo <strong>{filteredBanners.length}</strong> banners
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {PLACEMENT_OPTIONS.map((opt) => {
            const count =
              opt.id === "all"
                ? banners.length
                : banners.filter((b) => b.placement === opt.id).length;
            const isActive = selectedPlacementTab === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => setSelectedPlacementTab(opt.id)}
                className={cn(
                  "px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60"
                )}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Busca Rápida */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, destino ou nicho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card text-xs border-border/70"
          />
        </div>
      </div>

      {/* Grid de Banners Ativos do Nicho */}
      {filteredBanners.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border/60 space-y-4">
          <div className="size-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto text-2xl">
            {activePlacementInfo?.emoji || "🖼️"}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Nenhum banner personalizado em {activePlacementInfo?.label}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Neste momento, esta página está exibindo os banners de fallback padrão do sistema. Crie o primeiro banner exclusivo para este mercado!
            </p>
          </div>
          <Button
            onClick={() => handleOpenCreate(selectedPlacementTab)}
            className="rounded-xl font-bold text-xs gap-2"
          >
            <Plus className="size-4" /> Criar Banner para {activePlacementInfo?.label}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanners.map((banner) => {
            const placementObj = PLACEMENT_OPTIONS.find((p) => p.id === banner.placement);

            return (
              <div
                key={banner.id}
                className="group relative rounded-3xl bg-card border border-border/70 overflow-hidden flex flex-col shadow-2xs hover:border-primary/50 transition-all"
              >
                {/* Media Preview (21:9) */}
                <div className="relative aspect-21/9 w-full bg-muted overflow-hidden">
                  {banner.media_type === "video" ? (
                    <video
                      src={banner.media_url}
                      className="size-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={banner.media_url}
                      alt={banner.title}
                      className="size-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  )}

                  {/* Badges de Nicho e Modo */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="bg-black/75 text-white backdrop-blur-md text-[10px] font-mono font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/10"
                    >
                      <span>{placementObj?.emoji || "🏷️"}</span>
                      <span>{banner.placement.toUpperCase()}</span>
                    </Badge>
                    {banner.show_overlay ? (
                      <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                        Texto Ativado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-black/50 text-white border-white/20 text-[9px] font-bold backdrop-blur-xs"
                      >
                        Arte Limpa
                      </Badge>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="absolute top-2.5 right-2.5 z-10 size-7 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                    title="Desativar banner"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Info & Action Footer */}
                <div className="p-4 flex flex-col justify-between gap-3 text-xs flex-1">
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground truncate text-xs">{banner.title}</p>
                    <p className="text-muted-foreground truncate text-[11px] font-mono">
                      {banner.target_url || "/"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground">Texto:</span>
                      <Switch
                        checked={banner.show_overlay === true}
                        onCheckedChange={(checked) => handleToggleOverlay(banner.id, checked)}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {banner.target_url && (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Testar link de destino"
                        >
                          <a href={banner.target_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(banner)}
                        className="h-8 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer"
                      >
                        <Pencil className="size-3" />
                        <span>Editar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Sheet de Criação & Edição */}
      <SheetPage
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? "Editar Banner do Nicho" : "Criar Banner para Vitrine"}
        description="Selecione o nicho de mercado correto, envie a arte limpa 21:9 e informe o link de destino."
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="h-10 px-6 rounded-xl text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
            >
              {isSubmitting
                ? "Salvando..."
                : editingId
                ? "Salvar Alterações"
                : "Publicar no Nicho"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          {/* Upload de Mídia */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">Mídia do Banner (Foto ou Vídeo 21:9)</Label>
            <MediaUploader
              bucket="cms-media"
              folder="banners"
              maxFiles={1}
              accept="all"
              aspect={21 / 9}
              enableCrop={true}
              lockAspect={true}
              value={mediaUrl ? [mediaUrl] : []}
              onChange={(urls) => {
                if (urls.length > 0) setMediaUrl(urls[0]);
              }}
            />
            {mediaUrl && (
              <p className="text-[11px] text-emerald-600 font-mono truncate">
                Mídia selecionada: {mediaUrl}
              </p>
            )}
          </div>

          {/* Nicho / Onde Exibir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nicho / Vitrine de Destino *</Label>
              <Select value={placement} onValueChange={(val: any) => setPlacement(val)}>
                <SelectTrigger className="rounded-xl h-10 text-xs bg-muted/20">
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {PLACEMENT_OPTIONS.filter((p) => p.id !== "all").map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span>{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Link de Destino ao Clicar *</Label>
              <Input
                placeholder="Ex: /gastronomia?categoria=burgers"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="rounded-xl h-10 text-xs bg-muted/20"
              />
            </div>
          </div>

          {/* Configuração de Textos & Overlay */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Exibir Textos Sobre a Imagem</p>
                <p className="text-[11px] text-muted-foreground">
                  Por padrão, desativado para manter arte limpa 100% visual.
                </p>
              </div>
              <Switch checked={showOverlay} onCheckedChange={setShowOverlay} />
            </div>

            {showOverlay && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Título Principal</Label>
                  <Input
                    placeholder="Ex: Festival Gastronômico da Comunidade"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Subtítulo / Descrição</Label>
                  <Input
                    placeholder="Ex: Pratos autorais com até 30% OFF nesta semana"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Texto da Tag</Label>
                    <Input
                      placeholder="Ex: Destaque"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="rounded-xl h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Texto do Botão CTA</Label>
                    <Input
                      placeholder="Ex: Conferir"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      className="rounded-xl h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </SheetPage>
    </div>
  );
}
