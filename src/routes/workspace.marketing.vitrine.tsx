import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Layout,
  Sparkles,
  Tag,
  Grid,
  Store,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listSurfaceSections,
  upsertSurfaceSection,
  deleteSurfaceSection,
  type SurfaceSectionDTO,
  type SurfaceSectionType,
  type SurfaceDataSource,
  type SurfaceRankingStrategy,
  type SurfaceLayoutVariant,
} from "@/services/surface-cms.functions";

export const Route = createFileRoute("/workspace/marketing/vitrine")({
  head: () => ({ meta: [{ title: "Vitrine da Loja | Workspace Wider" }] }),
  component: WorkspaceStoreVitrineCMSPage,
});

const STORE_SECTION_TYPES: Array<{ id: SurfaceSectionType; label: string; icon: any }> = [
  { id: "product_rail", label: "Carrossel de Produtos", icon: Tag },
  { id: "flash_deal_rail", label: "Promoções & Ofertas Relâmpago", icon: Sparkles },
  { id: "grid_4col", label: "Grade de Produtos (4 Colunas)", icon: Grid },
  { id: "bento_grid", label: "Bento Box em Destaque", icon: Layout },
];

const STORE_DATA_SOURCES: Array<{ id: SurfaceDataSource; label: string }> = [
  { id: "all_products", label: "Todos os Produtos da Minha Loja" },
  { id: "flash_deals", label: "Apenas Itens com Desconto" },
  { id: "top_sellers", label: "Mais Vendidos da Loja" },
];

const STORE_RANKING_OPTIONS: Array<{ id: SurfaceRankingStrategy; label: string }> = [
  { id: "random_shuffle", label: "Embaralhar Itens (Shuffle)" },
  { id: "discount", label: "Maior Desconto" },
  { id: "popularity", label: "Mais Populares" },
  { id: "recency", label: "Mais Recentes" },
];

function WorkspaceStoreVitrineCMSPage() {
  const [sections, setSections] = useState<SurfaceSectionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SurfaceSectionDTO | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState<SurfaceSectionType>("product_rail");
  const [dataSource, setDataSource] = useState<SurfaceDataSource>("all_products");
  const [rankingStrategy, setRankingStrategy] = useState<SurfaceRankingStrategy>("random_shuffle");
  const [layoutVariant, setLayoutVariant] = useState<SurfaceLayoutVariant>("rail_standard");
  const [itemLimit, setItemLimit] = useState(12);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStoreSections = async () => {
    setIsLoading(true);
    try {
      const res = await listSurfaceSections({ data: { surfaceSlug: "store_private" } });
      setSections(res.sections || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar seções.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreSections();
  }, []);

  const handleOpenNew = () => {
    setEditingSection(null);
    setTitle("");
    setSubtitle("");
    setType("product_rail");
    setDataSource("all_products");
    setRankingStrategy("random_shuffle");
    setLayoutVariant("rail_standard");
    setItemLimit(12);
    setIsActive(true);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (sec: SurfaceSectionDTO) => {
    setEditingSection(sec);
    setTitle(sec.title);
    setSubtitle(sec.subtitle || "");
    setType(sec.type);
    setDataSource(sec.data_source);
    setRankingStrategy(sec.ranking_strategy);
    setLayoutVariant(sec.layout_variant);
    setItemLimit(sec.item_limit || 12);
    setIsActive(sec.is_active);
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Título da seção é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertSurfaceSection({
        data: {
          id: editingSection?.id,
          surface_id: "store_private",
          title,
          subtitle: subtitle.trim() || null,
          type,
          data_source: dataSource,
          ranking_strategy: rankingStrategy,
          layout_variant: layoutVariant,
          item_limit: itemLimit,
          sort_order: editingSection ? editingSection.sort_order : sections.length + 1,
          is_active: isActive,
        },
      });

      toast.success("Seção salva com sucesso!");
      setIsSheetOpen(false);
      fetchStoreSections();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta seção da sua vitrine?")) return;
    try {
      await deleteSurfaceSection({ data: { sectionId: id } });
      toast.success("Seção removida!");
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── PageHeader Canônico ── */}
      <PageHeader
        eyebrow="Vitrine & Divulgação"
        title="Vitrine da Loja"
        actions={
          <Button
            onClick={handleOpenNew}
            size="sm"
            className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground h-9"
          >
            <Plus className="size-3.5" />
            <span>Nova Seção</span>
          </Button>
        }
      />

      {/* ── Conteúdo Principal ── */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : sections.length === 0 ? (
        <div className="py-12 text-center space-y-4 border border-dashed border-border/70 rounded-2xl bg-card/40">
          <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Store className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Nenhuma seção personalizada</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Organize os carrosséis, promoções e blocos de destaque exibidos no seu perfil de loja.
            </p>
          </div>
          <Button onClick={handleOpenNew} size="sm" variant="outline" className="rounded-xl text-xs font-bold h-9">
            <Plus className="size-3.5 mr-1" />
            Criar Primeira Seção
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((sec) => {
            const typeConfig = STORE_SECTION_TYPES.find((t) => t.id === sec.type);
            const Icon = typeConfig?.icon || Tag;

            return (
              <div
                key={sec.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card ${
                  sec.is_active ? "border-border/80 shadow-2xs" : "border-border/40 opacity-60 bg-muted/20"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {sec.title}
                    </h3>
                    {sec.subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate">{sec.subtitle}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{typeConfig?.label}</span>
                      <span>•</span>
                      <span>Limite: {sec.item_limit} itens</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleOpenEdit(sec)}
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer border-border/60"
                    title="Editar Seção"
                  >
                    <Pencil className="size-3.5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(sec.id)}
                    className="size-8 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Excluir Seção"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Side Sheet: Nova / Editar Seção ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col p-0 gap-0 overflow-hidden bg-card border-l border-border">
          <SheetHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <SlidersHorizontal className="size-4.5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-foreground">
                  {editingSection ? "Editar Seção da Vitrine" : "Nova Seção da Vitrine"}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure o layout, carrossel e ordenação dos itens exibidos.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título da Seção</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Destaques da Semana, Mais Vendidos..."
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Subtítulo (Opcional)</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Os produtos favoritos dos clientes"
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo de Seção</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {STORE_SECTION_TYPES.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Fonte de Dados</Label>
                <Select value={dataSource} onValueChange={(v: any) => setDataSource(v)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {STORE_DATA_SOURCES.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Estratégia de Ordenação</Label>
              <Select value={rankingStrategy} onValueChange={(v: any) => setRankingStrategy(v)}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {STORE_RANKING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/60">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Exibir na Vitrine</span>
                <span className="text-[11px] text-muted-foreground block">Seção visível publicamente aos clientes</span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <SheetFooter className="p-4 border-t border-border/80 bg-muted/10 gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSheetOpen(false)}
              className="h-10 rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={isSubmitting}
              onClick={handleSave}
              className="h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSubmitting ? "Salvando..." : "Salvar Seção"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
