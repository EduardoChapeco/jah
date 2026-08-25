import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Sparkles,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const MODULE_TABS: Array<{ id: HotpageModule; label: string }> = [
  { id: "all", label: "Todas as Páginas" },
  { id: "home", label: "Início" },
  { id: "gastronomia", label: "Gastronomia" },
  { id: "mercado", label: "Supermercado" },
  { id: "farmacia", label: "Farmácia" },
  { id: "bebidas", label: "Bebidas" },
  { id: "acougue", label: "Açougue" },
  { id: "moda", label: "Moda" },
  { id: "eletronicos", label: "Eletrônicos" },
  { id: "pet", label: "Pet Shop" },
  { id: "servicos", label: "Serviços" },
  { id: "imoveis", label: "Imóveis" },
  { id: "construcao", label: "Construção" },
  { id: "casa", label: "Casa" },
  { id: "beleza", label: "Beleza" },
  { id: "limpeza", label: "Limpeza" },
  { id: "livros", label: "Livros" },
  { id: "noticias", label: "Notícias" },
  { id: "agenda", label: "Agenda" },
  { id: "turismo", label: "Turismo" },
  { id: "empregos", label: "Empregos" },
  { id: "classificados", label: "Classificados" },
  { id: "diretorio", label: "Diretório" },
  { id: "mobilidade", label: "Mobilidade" },
  { id: "ofertas", label: "Ofertas" },
];

export const Route = createFileRoute("/admin-master/botoes")({
  head: () => ({ meta: [{ title: "Botões & Hotpages | Admin Master" }] }),
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
        setHotpages((prev) => [...prev, created]);
        toast.success("Botão cadastrado com sucesso!");
      }
      setIsSheetOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar botão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este botão?")) return;
    try {
      await deleteHotpage({ data: { id } });
      setHotpages((prev) => prev.filter((h) => h.id !== id));
      toast.success("Botão removido.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir botão.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Botões & Hotpages</h1>
            <Badge variant="secondary" className="text-xs font-normal">
              {hotpages.length} {hotpages.length === 1 ? "botão" : "botões"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie os chips de navegação rápida e hotpages do ecossistema.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="rounded-xl font-medium gap-1.5 h-9 px-4 cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Novo Botão</span>
        </Button>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MODULE_TABS.map((tab) => {
          const count =
            tab.id === "all"
              ? hotpages.length
              : hotpages.filter((h) => h.module === tab.id).length;
          const isActive = selectedModuleTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedModuleTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/60"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Items */}
      {filteredHotpages.length === 0 ? (
        <div className="py-12 px-6 text-center rounded-2xl bg-card/50 border border-border/60 space-y-3">
          <div className="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Sparkles className="size-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Nenhum botão cadastrado nesta seção</p>
          <Button
            onClick={handleOpenCreate}
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-medium gap-1.5"
          >
            <Plus className="size-3.5" /> Adicionar Botão
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredHotpages.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl bg-card p-3.5 space-y-2.5 flex flex-col justify-between hover:border-primary/40 transition-colors border border-border/60 shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {item.module}
                  </span>
                  {item.badge_label && (
                    <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
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

                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                    {item.target_route || `/${item.slug}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/40">
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => handleOpenEdit(item)}
                  title="Editar"
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-7 p-0 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => handleDelete(item.id)}
                  title="Excluir"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet Drawer */}
      <SheetPage
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={editingId ? "Editar Botão" : "Novo Botão"}
        description="Configure o direcionamento, textura e ícone do botão."
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Título do Botão</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ofertas do Dia"
              className="h-9 rounded-xl bg-card text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ofertas-do-dia"
                className="h-9 rounded-xl bg-card text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Rota de Destino</Label>
              <Input
                value={targetRoute}
                onChange={(e) => setTargetRoute(e.target.value)}
                placeholder="/mercado?tag=ofertas"
                className="h-9 rounded-xl bg-card text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Módulo / Página</Label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value as HotpageModule)}
                className="w-full h-9 rounded-xl border border-border/70 bg-card px-3 text-xs"
              >
                {MODULE_TABS.filter((t) => t.id !== "all").map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Badge de Destaque</Label>
              <Input
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Novo, Promo, etc."
                className="h-9 rounded-xl bg-card text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mídia de Fundo (Opcional)</Label>
            <MediaUploader
              value={bgMediaUrl ? [bgMediaUrl] : []}
              onChange={(urls) => {
                const url = urls[0] || "";
                setBgMediaUrl(url);
                const isVideo = url.endsWith(".mp4") || url.endsWith(".webm");
                setBgMediaType(isVideo ? "video" : url ? "image" : "none");
              }}
              bucket="cms-media"
              folder="botoes"
              maxFiles={1}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSheetOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold px-4"
            >
              {isSubmitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Botão"}
            </Button>
          </div>
        </form>
      </SheetPage>
    </div>
  );
}
