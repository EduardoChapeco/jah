import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sliders,
  Plus,
  Trash,
  Tag,
  Eye,
  Sparkle,
  Image,
  PencilSimple,
} from "@phosphor-icons/react";
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
  listHotpages,
  createHotpage,
  updateHotpage,
  deleteHotpage,
  type HotpageDTO,
} from "@/services/hotpage.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/marketing/hotpages")({
  head: () => ({ meta: [{ title: "Gestão de Cards de Categorias & Ícones | JAH Workspace" }] }),
  loader: async () => {
    const hotpages = await listHotpages({ data: { module: "all" } }).catch(() => []);
    return { hotpages };
  },
  component: WorkspaceHotpagesPage,
});

function WorkspaceHotpagesPage() {
  const { hotpages: initialHotpages } = Route.useLoaderData();
  const [hotpages, setHotpages] = useState<HotpageDTO[]>(initialHotpages || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [customIconUrl, setCustomIconUrl] = useState("");
  const [module, setModule] = useState<
    "home" | "mercado" | "marketplace" | "noticias" | "agenda" | "events" | "diretorio" | "all"
  >("home");
  const [sortOrder, setSortOrder] = useState(0);

  // Customization Switches (Clean Media Mode)
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showBadge, setShowBadge] = useState(true);

  const refreshHotpages = async () => {
    const updated = await listHotpages({ data: { module: "all" } }).catch(() => []);
    setHotpages(updated);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setBadgeLabel("Destaque");
    setDescription("");
    setCoverImageUrl("");
    setCustomIconUrl("");
    setModule("home");
    setSortOrder(hotpages.length);
    setShowTitle(true);
    setShowDescription(true);
    setShowOverlay(true);
    setShowBadge(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hp: HotpageDTO) => {
    setEditingId(hp.id);
    setTitle(hp.title);
    setSlug(hp.slug);
    setBadgeLabel(hp.badge_label || "");
    setDescription(hp.description || "");
    setCoverImageUrl(hp.cover_image_url || "");
    setCustomIconUrl(hp.custom_icon_url || hp.icon_url || "");
    setModule(hp.module || "home");
    setSortOrder(hp.sort_order || 0);
    setShowTitle(hp.show_title !== false);
    setShowDescription(hp.show_description !== false);
    setShowOverlay(hp.show_overlay !== false);
    setShowBadge(hp.show_badge !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da categoria/hotpage.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Informe o slug identificador.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateHotpage({
          data: {
            id: editingId,
            title,
            slug: slug.toLowerCase().trim(),
            badge_label: badgeLabel || null,
            description: description || null,
            cover_image_url: coverImageUrl || null,
            icon_url: customIconUrl || null,
            custom_icon_url: customIconUrl || null,
            module,
            sort_order: sortOrder,
            show_title: showTitle,
            show_description: showDescription,
            show_overlay: showOverlay,
            show_badge: showBadge,
          },
        });
        toast.success("Categoria e ícone atualizados com sucesso!");
      } else {
        await createHotpage({
          data: {
            title,
            slug: slug.toLowerCase().trim(),
            badge_label: badgeLabel || undefined,
            description: description || undefined,
            cover_image_url: coverImageUrl || undefined,
            icon_url: customIconUrl || undefined,
            custom_icon_url: customIconUrl || undefined,
            module,
            sort_order: sortOrder,
            show_title: showTitle,
            show_description: showDescription,
            show_overlay: showOverlay,
            show_badge: showBadge,
          },
        });
        toast.success("Categoria criada com sucesso!");
      }
      setIsModalOpen(false);
      await refreshHotpages();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao salvar categoria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover esta categoria/hotpage?")) return;
    try {
      await deleteHotpage({ data: { id } });
      toast.success("Categoria removida com sucesso.");
      await refreshHotpages();
    } catch {
      toast.error("Erro ao remover categoria.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background">
              Descoberta & Categorias
            </span>
            <span className="text-xs text-muted-foreground font-mono">Customização de Ícones & Mídias</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Cards de Categorias & Ícones Customizados
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure cards panorâmicos e suba imagens/ícones personalizados para cada categoria exibida no Super App.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="rounded-xl font-bold gap-2">
          <Plus size={16} weight="bold" />
          <span>Nova Categoria</span>
        </Button>
      </div>

      {/* Grid de Hotpages Cadastradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {hotpages.map((hp) => {
          const showT = hp.show_title !== false;
          const showO = hp.show_overlay !== false && (showT || hp.badge_label);
          const iconUrl = hp.custom_icon_url || hp.icon_url;

          return (
            <div
              key={hp.id}
              className="group relative flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-2xs hover-elevate transition-all"
            >
              {/* Visual Card Preview */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                {hp.cover_image_url ? (
                  <img
                    src={hp.cover_image_url}
                    alt={hp.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="size-full bg-muted flex items-center justify-center">
                    <Tag size={32} className="text-muted-foreground/40" />
                  </div>
                )}

                {showO && (
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                )}

                <div className="absolute inset-0 p-3 flex flex-col justify-between z-10 pointer-events-none">
                  <div className="flex items-center justify-between">
                    {hp.show_badge !== false && hp.badge_label && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-foreground text-background shadow-xs">
                        {hp.badge_label}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-mono ml-auto">
                      /{hp.slug}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {iconUrl && (
                      <div className="size-6 rounded-md bg-white/20 backdrop-blur-md p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        <img src={iconUrl} alt="Icon" className="size-full object-contain" />
                      </div>
                    )}
                    {showT && (
                      <h3 className="text-xs font-black text-white line-clamp-1 drop-shadow-xs">
                        {hp.title}
                      </h3>
                    )}
                  </div>
                </div>
              </div>

              {/* Management Controls */}
              <div className="p-3 border-t border-border flex items-center justify-between bg-card text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground truncate max-w-[140px]">{hp.title}</p>
                  <p className="text-[10px] text-muted-foreground">Módulo: {hp.module || "home"}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(hp)}
                    className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                  >
                    <PencilSimple size={14} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(hp.id)}
                    className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição com Live Preview */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
            <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
              <Sliders size={20} weight="bold" className="text-foreground" />
              <span>{editingId ? "Editar Categoria & Ícone" : "Nova Categoria"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure imagens de capa, suba URLs de ícones customizados e defina o comportamento de exibição.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* ── 1. Live Preview Panorâmico ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Eye size={14} weight="bold" className="text-foreground" />
                  Live Preview do Card
                </span>
                <span className="text-[10px] font-mono lowercase">vitrine pública</span>
              </div>

              <div className="relative aspect-16/10 sm:aspect-21/9 w-full rounded-2xl border border-border overflow-hidden shadow-xs bg-zinc-900 flex items-end">
                {coverImageUrl ? (
                  <img
                    src={coverImageUrl}
                    alt="Preview"
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Tag size={36} className="text-muted-foreground/30" />
                  </div>
                )}

                {showOverlay && (
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                )}

                <div className="relative p-4 z-10 w-full space-y-1">
                  {showBadge && badgeLabel && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background shadow-xs">
                      {badgeLabel}
                    </span>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {customIconUrl && (
                      <div className="size-6 rounded-md bg-white/20 backdrop-blur-md p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        <img src={customIconUrl} alt="Icon Preview" className="size-full object-contain" />
                      </div>
                    )}
                    {showTitle && (
                      <h3 className="text-sm sm:text-base font-black text-white drop-shadow-xs">
                        {title || "Título da Categoria"}
                      </h3>
                    )}
                  </div>

                  {showDescription && description && (
                    <p className="text-xs text-zinc-300 line-clamp-1 drop-shadow-xs">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── 2. Campos Básicos ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold">
                  Título da Categoria
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Gastronomia & Sabores"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-bold">
                  Slug Identificador (URL)
                </Label>
                <Input
                  id="slug"
                  placeholder="Ex: gastronomia"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-xl h-10 font-mono"
                />
              </div>
            </div>

            {/* ── 2.5. Imagem / Ícone Customizado da Categoria (Upload / URL) ── */}
            <div className="space-y-1.5 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Image size={16} weight="bold" className="text-foreground" />
                <Label htmlFor="customIcon" className="text-xs font-bold">
                  Ícone Customizado da Categoria (URL da Imagem / PNG / SVG)
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Suba o link do ícone ou imagem ilustrativa da categoria. Ele será exibido na barra estilo iFood e nos menus.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Input
                  id="customIcon"
                  placeholder="https://.../icon-farmacia.png"
                  value={customIconUrl}
                  onChange={(e) => setCustomIconUrl(e.target.value)}
                  className="rounded-xl h-10 font-mono text-xs flex-1"
                />
                {customIconUrl && (
                  <div className="size-10 rounded-xl border border-border bg-card p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={customIconUrl} alt="Icon" className="size-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="badge" className="text-xs font-bold">
                  Texto do Badge
                </Label>
                <Input
                  id="badge"
                  placeholder="Ex: Em Alta"
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module" className="text-xs font-bold">
                  Módulo / Seção
                </Label>
                <select
                  id="module"
                  value={module}
                  onChange={(e) => setModule(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="home">Home Principal (/)</option>
                  <option value="mercado">Mercado & Produtos (/mercado)</option>
                  <option value="noticias">Portal de Notícias (/noticias)</option>
                  <option value="agenda">Agenda Cultural & Eventos (/agenda)</option>
                  <option value="diretorio">Guia & Diretório de Serviços (/diretorio)</option>
                  <option value="all">Todas as Páginas</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sort" className="text-xs font-bold">
                  Ordem de Exibição
                </Label>
                <Input
                  id="sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="media" className="text-xs font-bold">
                URL da Imagem de Capa Panorâmica
              </Label>
              <Input
                id="media"
                placeholder="https://images.unsplash.com/..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            {/* ── 3. Switches de Customização Visual (Modo Mídia Limpa) ── */}
            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Personalização Visual (Modo Mídia Limpa)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
                  <span className="text-xs font-semibold text-foreground">Exibir Título</span>
                  <input
                    type="checkbox"
                    checked={showTitle}
                    onChange={(e) => setShowTitle(e.target.checked)}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
                  <span className="text-xs font-semibold text-foreground">Exibir Badge</span>
                  <input
                    type="checkbox"
                    checked={showBadge}
                    onChange={(e) => setShowBadge(e.target.checked)}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
                  <span className="text-xs font-semibold text-foreground">Exibir Overlay Escuro</span>
                  <input
                    type="checkbox"
                    checked={showOverlay}
                    onChange={(e) => setShowOverlay(e.target.checked)}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/40 transition-colors">
                  <span className="text-xs font-semibold text-foreground">Exibir Descrição</span>
                  <input
                    type="checkbox"
                    checked={showDescription}
                    onChange={(e) => setShowDescription(e.target.checked)}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* ── 4. Ações do Formulário ── */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Salvando..."
                className="rounded-xl font-bold"
              >
                {editingId ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
