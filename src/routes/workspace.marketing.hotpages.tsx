import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Eye,
  Pencil,
  ArrowRight,
  Shield,
  Layers,
  Image as ImageIcon,
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
  listHotpages,
  saveHotpage,
  deleteHotpage,
  type HotpageDTO,
} from "@/services/hotpage.functions";
import { getUserSession } from "@/services/auth.functions";
import { toast } from "sonner";
import { MediaUploader } from "@/components/ui/media-uploader";
import { DynamicMediaChip } from "@/components/commerce/dynamic-media-chip";

export const Route = createFileRoute("/workspace/marketing/hotpages")({
  head: () => ({ meta: [{ title: "Destaques & Hotpages da Loja | Workspace" }] }),
  loader: async () => {
    const [hotpages, session] = await Promise.all([
      listHotpages({ data: { module: "home" } }).catch(() => []),
      getUserSession().catch(() => null),
    ]);
    return { hotpages, session };
  },
  component: WorkspaceStoreHotpagesPage,
});

function WorkspaceStoreHotpagesPage() {
  const { hotpages: initialHotpages, session } = Route.useLoaderData();
  const [hotpages, setHotpages] = useState<HotpageDTO[]>(initialHotpages || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [targetRoute, setTargetRoute] = useState("");
  const [bgMediaType, setBgMediaType] = useState<"none" | "image" | "video" | "gif">("none");
  const [bgMediaUrl, setBgMediaUrl] = useState("");
  const [bgTexture, setBgTexture] = useState<"none" | "noise" | "dots" | "grid" | "mesh" | "glass">("none");
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(40);
  const [showTitle, setShowTitle] = useState(true);
  const [showBadge, setShowBadge] = useState(true);

  const isPlatformAdmin = session?.role === "platform_admin";

  const refreshList = async () => {
    const updated = await listHotpages({ data: { module: "home" } }).catch(() => []);
    setHotpages(updated);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setSlug(`destaque-${Date.now()}`);
    setBadgeLabel("Novidade");
    setTargetRoute("/perfil-da-loja");
    setBgMediaType("none");
    setBgMediaUrl("");
    setBgTexture("none");
    setBgOverlayOpacity(40);
    setShowTitle(true);
    setShowBadge(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: HotpageDTO) => {
    setEditingId(h.id);
    setTitle(h.title);
    setSlug(h.slug);
    setBadgeLabel(h.badge_label || "");
    setTargetRoute(h.target_route || "");
    setBgMediaType(h.bg_media_type || "none");
    setBgMediaUrl(h.bg_media_url || "");
    setBgTexture(h.bg_texture || "none");
    setBgOverlayOpacity(h.bg_overlay_opacity ?? 40);
    setShowTitle(h.show_title !== false);
    setShowBadge(h.show_badge !== false);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("O título do destaque é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveHotpage({
        data: {
          id: editingId || undefined,
          slug: slug.trim() || `hotpage-${Date.now()}`,
          title: title.trim(),
          badge_label: badgeLabel.trim() || undefined,
          target_route: targetRoute.trim() || undefined,
          bg_media_type: bgMediaType,
          bg_media_url: bgMediaUrl || undefined,
          bg_texture: bgTexture,
          bg_overlay_opacity: bgOverlayOpacity,
          show_title: showTitle,
          show_badge: showBadge,
          module: "home",
          is_active: true,
          sort_order: 0,
        },
      });

      toast.success(editingId ? "Destaque atualizado!" : "Destaque criado com sucesso!");
      setIsModalOpen(false);
      await refreshList();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar destaque.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este destaque?")) return;
    try {
      await deleteHotpage({ data: { id } });
      toast.success("Destaque removido.");
      await refreshList();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir destaque.");
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Top Banner Informativo se for Admin Master */}
      {isPlatformAdmin && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-primary shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-foreground">Você é Administrador Master Global</p>
              <p className="text-muted-foreground">
                Para gerenciar os botões, categorias e sub-headers de todas as 25 vitrines públicas da cidade, use a Central Global.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold shrink-0">
            <Link to="/admin-master/botoes">
              <span>Central de Botões Master</span>
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <span>Destaques & Hotpages da Loja</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Crie botões e cards de campanhas rápidas com texturas e mídias para seu perfil público.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="rounded-xl font-bold text-xs h-9 bg-primary text-primary-foreground gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Novo Destaque</span>
        </Button>
      </div>

      {/* Grade de Destaques Ativos */}
      {hotpages.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-card rounded-3xl border border-border/60 p-8">
          <Layers className="size-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">Nenhum destaque cadastrado</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Adicione cartões especiais para promover combos, lançamentos ou seções exclusivas.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="rounded-xl font-bold text-xs">
            <Plus className="size-3.5 mr-1" /> Criar Primeiro Destaque
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotpages.map((h) => (
            <div
              key={h.id}
              className="p-4 rounded-3xl bg-card border border-border/70 space-y-3 shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {h.badge_label || "Card"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {h.bg_texture !== "none" ? `Textura: ${h.bg_texture}` : "Padrão"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground line-clamp-1">{h.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{h.target_route || "/loja"}</p>

                {/* Mini Preview do Chip */}
                <div className="pt-2">
                  <DynamicMediaChip
                    label={h.title}
                    badge={h.badge_label || undefined}
                    bg_media_type={h.bg_media_type || undefined}
                    bg_media_url={h.bg_media_url || undefined}
                    bg_texture={h.bg_texture as any || undefined}
                    bg_overlay_opacity={h.bg_overlay_opacity ?? undefined}
                    to={h.target_route || undefined}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
                <Button
                  onClick={() => handleOpenEdit(h)}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 rounded-xl text-xs font-semibold gap-1"
                >
                  <Pencil className="size-3" /> Editar
                </Button>
                <Button
                  onClick={() => handleDelete(h.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 rounded-xl text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Lateral de Criação/Edição com Live Preview */}
      <SheetPage
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? "Editar Destaque" : "Novo Destaque da Loja"}
        description="Personalize o texto, mídia de fundo e destino do card."
      >
        <div className="space-y-5 p-1 pb-16">
          {/* Live Preview */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border border-border/50">
            <span className="text-[11px] font-bold text-muted-foreground">Pré-Visualização em Tempo Real</span>
            <DynamicMediaChip
              label={title || "Nome do Destaque"}
              badge={badgeLabel || undefined}
              bg_media_type={bgMediaType}
              bg_media_url={bgMediaUrl || undefined}
              bg_texture={bgTexture as any}
              bg_overlay_opacity={bgOverlayOpacity}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Título do Destaque *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Combo Família ou Oferta do Dia"
              className="rounded-xl text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Badge / Tag</Label>
              <Input
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Ex: 20% OFF, Novo"
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Rota de Destino</Label>
              <Input
                value={targetRoute}
                onChange={(e) => setTargetRoute(e.target.value)}
                placeholder="Ex: /cardapio"
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          {/* Mídia de Fundo */}
          <div className="space-y-2 pt-2 border-t border-border/30">
            <Label className="text-xs font-bold">Tipo de Mídia de Fundo</Label>
            <Select
              value={bgMediaType}
              onValueChange={(val: any) => setBgMediaType(val)}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">Nenhuma (Cor padrão)</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo MP4</SelectItem>
                <SelectItem value="gif">GIF Animado</SelectItem>
              </SelectContent>
            </Select>

            {bgMediaType !== "none" && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs">Upload de Mídia ou URL</Label>
                <MediaUploader
                  value={bgMediaUrl ? [bgMediaUrl] : []}
                  onChange={(urls) => setBgMediaUrl(urls[0] || "")}
                />
              </div>
            )}
          </div>

          {/* Textura */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Textura Visual</Label>
            <Select
              value={bgTexture}
              onValueChange={(val: any) => setBgTexture(val)}
            >
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">Sem Textura</SelectItem>
                <SelectItem value="noise">Noise Gradiente Suave</SelectItem>
                <SelectItem value="dots">Pontilhismo (Dots)</SelectItem>
                <SelectItem value="grid">Grid Técnico</SelectItem>
                <SelectItem value="mesh">Mesh Gradient</SelectItem>
                <SelectItem value="glass">Glassmorphism</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Switches de Exibição */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Exibir Título</Label>
              <Switch checked={showTitle} onCheckedChange={setShowTitle} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Exibir Badge</Label>
              <Switch checked={showBadge} onCheckedChange={setShowBadge} />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2">
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground min-w-[100px]"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : "Salvar Destaque"}
            </Button>
          </div>
        </div>
      </SheetPage>
    </div>
  );
}
