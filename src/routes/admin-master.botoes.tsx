import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Trash,
  Sparkle,
  PencilSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/ui/media-uploader";
import { SheetPage } from "@/components/ui/sheet-page";
import {
  listHotpages,
  createHotpage,
  updateHotpage,
  deleteHotpage,
  type HotpageDTO,
  type HotpageModule,
  type HotpageBgMediaType,
  type HotpageBgTexture,
} from "@/services/hotpage.functions";
import { DynamicMediaChip } from "@/components/commerce/dynamic-media-chip";
import { toast } from "sonner";

const MODULE_TABS: Array<{ id: HotpageModule; label: string; emoji: string }> = [
  { id: "all", label: "Todas as Páginas", emoji: "🌐" },
  { id: "home", label: "Home Principal", emoji: "🏠" },
  { id: "gastronomia", label: "Gastronomia & Delivery", emoji: "🍽️" },
  { id: "mercado", label: "Supermercado & Feira", emoji: "🛒" },
  { id: "farmacia", label: "Farmácia & Saúde", emoji: "💊" },
  { id: "bebidas", label: "Bebidas & Adega", emoji: "🍻" },
  { id: "acougue", label: "Açougue & Carnes", emoji: "🥩" },
  { id: "moda", label: "Moda & Vestuário", emoji: "👗" },
  { id: "eletronicos", label: "Eletrônicos & Tech", emoji: "📱" },
  { id: "pet", label: "Pet Shop", emoji: "🐾" },
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

export const Route = createFileRoute("/admin-master/botoes")({
  head: () => ({ meta: [{ title: "Gestão Global de Botões & Hotpages | Admin Master" }] }),
  loader: async () => {
    const hotpages = await listHotpages({ data: { module: "all" } }).catch(() => []);
    return { hotpages };
  },
  component: AdminMasterBotoesPage,
});

function AdminMasterBotoesPage() {
  const { hotpages: initialHotpages } = Route.useLoaderData();
  const [hotpages, setHotpages] = useState<HotpageDTO[]>(initialHotpages || []);
  const [selectedModuleTab, setSelectedModuleTab] = useState<HotpageModule>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [targetRoute, setTargetRoute] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [module, setModule] = useState<HotpageModule>("home");
  const [sortOrder, setSortOrder] = useState(0);

  // Background Media & Texture states
  const [bgMediaType, setBgMediaType] = useState<HotpageBgMediaType>("none");
  const [bgMediaUrl, setBgMediaUrl] = useState("");
  const [bgTexture, setBgTexture] = useState<HotpageBgTexture>("none");
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(40);
  const [bgColor, setBgColor] = useState("");

  const filteredHotpages =
    selectedModuleTab === "all"
      ? hotpages
      : hotpages.filter((h) => h.module === selectedModuleTab);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setTargetRoute("");
    setBadgeLabel("");
    setDescription("");
    setCoverImageUrl("");
    setCustomIconUrl("");
    setModule(selectedModuleTab === "all" ? "home" : selectedModuleTab);
    setSortOrder(0);
    setBgMediaType("none");
    setBgMediaUrl("");
    setBgTexture("none");
    setBgOverlayOpacity(40);
    setBgColor("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (item: HotpageDTO) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSlug(item.slug);
    setTargetRoute(item.target_route || "");
    setBadgeLabel(item.badge_label || "");
    setDescription(item.description || "");
    setCoverImageUrl(item.cover_image_url || "");
    setCustomIconUrl(item.custom_icon_url || item.icon_url || "");
    setModule(item.module || "home");
    setSortOrder(item.sort_order || 0);
    setBgMediaType(item.bg_media_type || "none");
    setBgMediaUrl(item.bg_media_url || "");
    setBgTexture(item.bg_texture || "none");
    setBgOverlayOpacity(item.bg_overlay_opacity ?? 40);
    setBgColor(item.bg_color || "");
    setIsSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error("Preencha o título e o slug.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateHotpage({
          data: {
            id: editingId,
            title: title.trim(),
            slug: slug.trim().toLowerCase(),
            target_route: targetRoute.trim() || undefined,
            badge_label: badgeLabel.trim() || undefined,
            description: description.trim() || undefined,
            cover_image_url: coverImageUrl || undefined,
            custom_icon_url: customIconUrl || undefined,
            module,
            sort_order: sortOrder,
            bg_media_type: bgMediaType,
            bg_media_url: bgMediaUrl || undefined,
            bg_texture: bgTexture,
            bg_overlay_opacity: bgOverlayOpacity,
            bg_color: bgColor || undefined,
          },
        });
        setHotpages((prev) => prev.map((h) => (h.id === editingId ? updated : h)));
        toast.success("Botão atualizado com sucesso!");
      } else {
        const created = await createHotpage({
          data: {
            title: title.trim(),
            slug: slug.trim().toLowerCase(),
            target_route: targetRoute.trim() || undefined,
            badge_label: badgeLabel.trim() || undefined,
            description: description.trim() || undefined,
            cover_image_url: coverImageUrl || undefined,
            custom_icon_url: customIconUrl || undefined,
            module,
            sort_order: sortOrder,
            bg_media_type: bgMediaType,
            bg_media_url: bgMediaUrl || undefined,
            bg_texture: bgTexture,
            bg_overlay_opacity: bgOverlayOpacity,
            bg_color: bgColor || undefined,
          },
        });
        setHotpages((prev) => [created, ...prev]);
        toast.success("Botão criado com sucesso!");
      }
      setIsSheetOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar botão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este botão da plataforma?")) return;
    try {
      await deleteHotpage({ data: { id } });
      setHotpages((prev) => prev.filter((h) => h.id !== id));
      toast.success("Botão removido com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir botão.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkle className="size-6 text-primary" weight="bold" />
            Botões Globais & Hotpages da Plataforma
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Controle mestre de todos os chips de navegação, mídias e texturas do sub-header global.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="h-11 px-5 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-2 cursor-pointer"
        >
          <Plus className="size-4" weight="bold" />
          <span>Novo Botão</span>
        </Button>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MODULE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedModuleTab(tab.id)}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
              selectedModuleTab === tab.id
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid of Items */}
      {filteredHotpages.length === 0 ? (
        <div className="border-0 rounded-2xl p-12 text-center bg-card/40">
          <p className="text-sm font-semibold text-muted-foreground">Nenhum botão cadastrado neste módulo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredHotpages.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl bg-card p-4 space-y-3 flex flex-col justify-between hover:border-primary/40 transition-all border border-border/40"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5">
                    {item.module}
                  </Badge>
                  {item.badge_label && (
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                      {item.badge_label}
                    </span>
                  )}
                </div>

                <div className="pt-1 flex justify-center">
                  <DynamicMediaChip
                    label={item.title}
                    to={item.target_route || `/${item.slug}`}
                    badge={item.badge_label}
                    icon_url={item.custom_icon_url || item.icon_url}
                    bg_media_type={item.bg_media_type}
                    bg_media_url={item.bg_media_url}
                    bg_color={item.bg_color}
                    bg_overlay_opacity={item.bg_overlay_opacity}
                    bg_texture={item.bg_texture}
                  />
                </div>

                <div className="text-center pt-2">
                  <h2 className="text-xs font-bold text-foreground truncate">{item.title}</h2>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {item.target_route || `/${item.slug}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-border/40">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                  onClick={() => handleOpenEdit(item)}
                >
                  <PencilSimple className="size-3.5 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Sheet */}
      <SheetPage
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={editingId ? "Editar Botão / Hotpage" : "Novo Botão / Hotpage"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          {/* Live Preview */}
          <div className="bg-muted/40 rounded-xl p-4 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Preview em Tempo Real
            </span>
            <DynamicMediaChip
              label={title || "Nome do Botão"}
              to={targetRoute || "#"}
              badge={badgeLabel || null}
              icon_url={customIconUrl || null}
              bg_media_type={bgMediaType}
              bg_media_url={bgMediaUrl || null}
              bg_color={bgColor || null}
              bg_overlay_opacity={bgOverlayOpacity}
              bg_texture={bgTexture}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Título / Label</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ofertas"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Slug Identificador</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ex: ofertas"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Rota de Destino (URL)</Label>
              <Input
                value={targetRoute}
                onChange={(e) => setTargetRoute(e.target.value)}
                placeholder="Ex: /ofertas"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Módulo da Plataforma</Label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as HotpageModule)}
                className="w-full h-10 px-3 bg-card rounded-xl text-xs font-medium border border-border"
              >
                {MODULE_TABS.filter((t) => t.id !== "all").map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ícone e Mídia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Ícone Customizado (PNG / SVG)</Label>
              <MediaUploader
                value={customIconUrl ? [customIconUrl] : []}
                onChange={(urls) => setCustomIconUrl(urls[0] || "")}
                maxFiles={1}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Mídia de Fundo (MP4 / WebM / GIF)</Label>
              <MediaUploader
                value={bgMediaUrl ? [bgMediaUrl] : []}
                onChange={(urls) => {
                  const url = urls[0] || "";
                  setBgMediaUrl(url);
                  if (url) {
                    setBgMediaType(url.endsWith(".mp4") || url.endsWith(".webm") ? "video" : "image");
                  } else {
                    setBgMediaType("none");
                  }
                }}
                maxFiles={1}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              className="h-10 rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSubmitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Botão"}
            </Button>
          </div>
        </form>
      </SheetPage>
    </div>
  );
}
