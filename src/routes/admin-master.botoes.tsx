import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/ui/media-uploader";
import { SheetPage } from "@/components/ui/sheet-page";
import {
  listHotpages,
  createHotpage,
  updateHotpage,
  deleteHotpage,
  type HotpageDTO,
  type HotpageModule,
} from "@/services/hotpage.functions";
import { DestinationPicker } from "@/components/ui/destination-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODULE_TABS: Array<{ id: HotpageModule; label: string }> = [
  { id: "all", label: "Todas as Páginas" },
  { id: "home", label: "Início (Home)" },
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

const SearchSchema = z.object({
  module: z.string().optional(),
});

export const Route = createFileRoute("/admin-master/botoes")({
  validateSearch: (search: Record<string, unknown>) => SearchSchema.parse(search),
  head: () => ({ meta: [{ title: "Hotpages & Capas 16:9 | Admin Master" }] }),
  loader: async () => {
    const hotpages = await listHotpages({ data: { module: "all" } }).catch(() => []);
    return { hotpages };
  },
  component: AdminMasterHotpagesPage,
});

function AdminMasterHotpagesPage() {
  const { hotpages: initialHotpages } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const [hotpages, setHotpages] = useState<HotpageDTO[]>(initialHotpages || []);
  const [selectedModuleTab, setSelectedModuleTab] = useState<HotpageModule>(
    (search.module as HotpageModule) || "all"
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states puros de Hotpage 16:9
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [targetRoute, setTargetRoute] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [module, setModule] = useState<HotpageModule>("home");
  const [sortOrder, setSortOrder] = useState(0);

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
    setModule(selectedModuleTab === "all" ? "home" : selectedModuleTab);
    setSortOrder(0);
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
    setCoverImageUrl(item.cover_image_url || (item as any).bg_media_url || "");
    setModule(item.module || "home");
    setSortOrder(item.sort_order || 0);
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
            title,
            slug,
            target_route: targetRoute || `/destaques/${slug}`,
            badge_label: badgeLabel || null,
            description: description || null,
            cover_image_url: coverImageUrl || null,
            module,
            sort_order: Number(sortOrder) || 0,
          },
        });

        setHotpages((prev) =>
          prev.map((h) => (h.id === editingId ? { ...h, ...updated, cover_image_url: coverImageUrl } : h))
        );
        toast.success("Hotpage atualizada com sucesso!");
      } else {
        const created = await createHotpage({
          data: {
            title,
            slug,
            target_route: targetRoute || `/destaques/${slug}`,
            badge_label: badgeLabel || undefined,
            description: description || undefined,
            cover_image_url: coverImageUrl || undefined,
            module,
            sort_order: Number(sortOrder) || 0,
          },
        });

        setHotpages((prev) => [created, ...prev]);
        toast.success("Nova Hotpage cadastrada!");
      }

      setIsSheetOpen(false);
      resetForm();
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar Hotpage.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta Hotpage?")) return;
    try {
      await deleteHotpage({ data: { id } });
      setHotpages((prev) => prev.filter((h) => h.id !== id));
      toast.success("Hotpage excluída com sucesso.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-foreground font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Hotpages & Capas Editoriais (Cards 16:9)</span>
            <Badge variant="outline" className="text-xs">
              {filteredHotpages.length} cadastradas
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cards visuais panorâmicos e coleções temáticas da vitrine
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl font-bold text-xs gap-1.5 h-10 px-4"
        >
          <Plus className="size-4" />
          <span>Nova Hotpage / Capa 16:9</span>
        </Button>
      </div>

      {/* Tabs por Módulo / Nicho */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/40">
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
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Cards 16:9 Cadastrados */}
      {filteredHotpages.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/60 rounded-3xl p-8 space-y-3 bg-muted/10">
          <Sparkles className="size-10 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Nenhuma Hotpage neste módulo</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Crie cards 16:9 de coleções, eventos temáticos e destaques para enriquecer o trilho de descoberta deste mercado.
          </p>
          <Button onClick={handleOpenCreate} size="sm" className="rounded-xl font-bold text-xs">
            Criar Primeira Hotpage
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredHotpages.map((item) => {
            const cover = item.cover_image_url || (item as any).bg_media_url;
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                {/* Visual Canônico 16:9 da Hotpage */}
                <div>
                  <div className="relative aspect-16/9 w-full bg-muted/40 overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={item.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground gap-1 p-2">
                        <ImageIcon className="size-6 text-muted-foreground/50" />
                        <span className="text-[10px] font-semibold text-center leading-tight">
                          Sem Imagem de Capa
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay Editorial */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Tag do Módulo */}
                    <span className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-black/70 text-white/90 px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-xs border border-white/10">
                      {item.module || "home"}
                    </span>

                    {/* Badge Promocional */}
                    {item.badge_label && (
                      <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider bg-white/25 backdrop-blur-md text-white px-2 py-0.5 rounded-md border border-white/20 shadow-xs">
                        {item.badge_label}
                      </span>
                    )}

                    {/* Título sobreposto no terço inferior */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-left">
                      <p className="text-xs font-bold text-white leading-tight drop- truncate">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  {/* Informações de Rota e Descrição */}
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {item.target_route || `/destaques/${item.slug}`}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé de Gestão */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/10">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Ordem: {item.sort_order ?? 0}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => handleDelete(item.id)}
                      title="Excluir"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet Drawer de Criação / Edição de Hotpage */}
      <SheetPage
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title={editingId ? "Editar Hotpage / Capa 16:9" : "Nova Hotpage / Capa 16:9"}
        description="Configure a foto de capa 16:9, badge, título, nicho e destino da landing page."
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-1 max-h-[85vh] overflow-y-auto pr-1">
          {/* Live Preview 16:9 no Topo do Drawer */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye className="size-3.5 text-primary" />
              Pré-visualização do Card 16:9
            </span>

            <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-card border border-border/80 shadow-xs">
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="Preview Capa" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground text-xs font-semibold">
                  Foto de Capa 16:9 (Alta Resolução)
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

              <span className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-black/70 text-white/90 px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-xs border border-white/10">
                {module || "home"}
              </span>

              {badgeLabel && (
                <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider bg-white/25 backdrop-blur-md text-white px-2 py-0.5 rounded-md border border-white/20 shadow-xs">
                  {badgeLabel}
                </span>
              )}

              <div className="absolute bottom-2.5 left-3 right-3 text-left">
                <p className="text-sm font-bold text-white leading-tight drop- truncate">
                  {title || "Título da Hotpage"}
                </p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Título da Hotpage / Coleção *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Festival de Hambúrguer, Ofertas da Semana, Guia de Vinhos..."
              className="h-10 rounded-xl bg-card text-xs"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Slug Identificador (URL) *</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="festival-hamburguer"
              className="h-10 rounded-xl bg-card text-xs font-mono"
              required
            />
          </div>

          {/* Módulo e Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Módulo / Vitrine *</Label>
              <Select value={module} onValueChange={(val: any) => setModule(val)}>
                <SelectTrigger className="h-10 rounded-xl bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {MODULE_TABS.filter((t) => t.id !== "all").map((tab) => (
                    <SelectItem key={tab.id} value={tab.id} className="text-xs">
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Badge Promocional</Label>
              <Input
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Ex: SABOR, ECONOMIA, FRESCOR"
                className="h-10 rounded-xl bg-card text-xs"
              />
            </div>
          </div>

          {/* Upload da Capa 16:9 */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-bold flex items-center justify-between">
              <span>Foto de Capa do Card (16:9) *</span>
              <span className="text-[10px] text-primary font-bold">16:9 Panorâmica</span>
            </Label>
            <MediaUploader
              value={coverImageUrl ? [coverImageUrl] : []}
              onChange={(urls) => setCoverImageUrl(urls[0] || "")}
              bucket="cms-media"
              folder="hotpages"
              aspect={16 / 9}
              lockAspect={true}
              cropShape="rect"
              accept="image"
              maxFiles={1}
            />
          </div>

          {/* Seletor Canônico de Destino da Página / Link */}
          <DestinationPicker
            value={targetRoute}
            onChange={(url) => {
              setTargetRoute(url);
              if (!slug) {
                const autoSlug = url.replace(/[^a-zA-Z0-9-]/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
                setSlug(autoSlug || "destaque");
              }
            }}
            label="Página de Destino ao Clicar"
            helperText="Deixe em branco para abrir a landing page automática /destaques/slug."
          />

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Descrição da Coleção (Opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o tema da hotpage, condições especiais ou seleção de estabelecimentos..."
              rows={3}
              className="rounded-xl bg-card text-xs resize-none"
            />
          </div>

          {/* Ordem de Exibição */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Ordem de Exibição (Sort Order)</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="0"
              className="h-10 rounded-xl bg-card text-xs font-mono"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-bold text-xs min-w-28"
            >
              {isSubmitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Hotpage"}
            </Button>
          </div>
        </form>
      </SheetPage>
    </div>
  );
}
