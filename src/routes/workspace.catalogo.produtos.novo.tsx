import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Eye,
  ShoppingBag,
  Sparkles,
  Package,
  Tag,
  DollarSign,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MediaUploader } from "@/components/ui/media-uploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createProduct,
  listCategories,
  listProductTypes,
  listOptionGroups,
} from "@/services/admin-catalog.functions";
import { importProductFromUrl } from "@/services/api-orchestrator.functions";
import { getStoreSettings } from "@/services/store.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/catalogo/produtos/novo")({
  head: () => ({ meta: [{ title: "Criar Novo Produto | Workspace Wider" }] }),
  loader: async () => {
    try {
      const [catsRes, typesRes, groupsRes, storeRes] = await Promise.all([
        listCategories().catch(() => []),
        listProductTypes().catch(() => []),
        listOptionGroups().catch(() => []),
        getStoreSettings().catch(() => null),
      ]);
      return {
        categories: catsRes || [],
        productTypes: typesRes || [],
        optionGroupsList: groupsRes || [],
        store: storeRes,
      };
    } catch (e) {
      console.warn("[workspace.catalogo.produtos.novo] Falha no loader, usando fallback:", e);
      return {
        categories: [],
        productTypes: [],
        optionGroupsList: [],
        store: null,
      };
    }
  },
  component: UnifiedNewProductPage,
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function UnifiedNewProductPage() {
  const { categories, productTypes, optionGroupsList, store } = Route.useLoaderData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("basico");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mídias
  const [images, setImages] = useState<string[]>([]);
  const [activePreviewImage, setActivePreviewImage] = useState(0);

  // Grupos de Opções / Adicionais selecionados
  const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<string[]>([]);

  // Modal: Importador Inteligente por URL
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importTone, setImportTone] = useState<"profissional" | "persuasivo" | "tecnico" | "minimalista">("profissional");
  const [isImporting, setIsImporting] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      short_description: "",
      description: "",
      price_cents: 0,
      compare_at_cents: 0,
      cost_cents: 0,
      category_id: "",
      type_id: "",
      brand: "",
      sku: "",
      selling_unit: "un",
      stock: 10,
      show_stock_publicly: false,
      is_physical: true,
      weight_kg: 0.5,
      width_cm: 15,
      height_cm: 10,
      length_cm: 20,
      preparation_time_days: 0,
      status: "published" as "published" | "draft" | "archived",
    },
  });

  const formValues = watch();

  // Cálculo de Margem e Lucro
  const grossProfitCents = Math.max(0, (formValues.price_cents || 0) - (formValues.cost_cents || 0));
  const marginPercent =
    formValues.price_cents > 0
      ? Math.round((grossProfitCents / formValues.price_cents) * 100)
      : 0;

  // Auto-gerar slug a partir do título
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("title", val);
    setValue("slug", slugify(val));
  };

  const onSubmit = async (data: any) => {
    if (!data.title.trim()) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }

    if (data.price_cents <= 0) {
      toast.error("Informe um preço de venda válido maior que zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedSlug = data.slug.trim() || slugify(data.title);
      const categoryIds = data.category_id ? [data.category_id] : [];

      await createProduct({
        data: {
          title: data.title.trim(),
          slug: generatedSlug,
          description: data.description || null,
          short_description: data.short_description || null,
          status: data.status || "published",
          brand: data.brand || null,
          price_cents: data.price_cents,
          compare_at_cents: data.compare_at_cents > 0 ? data.compare_at_cents : null,
          cost_cents: data.cost_cents > 0 ? data.cost_cents : null,
          type_id: data.type_id || null,
          is_physical: data.is_physical,
          weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
          width_cm: data.width_cm ? Number(data.width_cm) : null,
          height_cm: data.height_cm ? Number(data.height_cm) : null,
          length_cm: data.length_cm ? Number(data.length_cm) : null,
          preparation_time_days: data.preparation_time_days
            ? Number(data.preparation_time_days)
            : null,
          show_stock_publicly: data.show_stock_publicly ?? false,
          media_urls: images,
          category_ids: categoryIds,
          option_group_ids: selectedOptionGroupIds.length > 0 ? selectedOptionGroupIds : undefined,
          variants: [
            {
              sku: String(data.sku || `${generatedSlug}-default`),
              attributes: {},
              stock: Number(data.stock || 10),
              price_cents: Number(data.price_cents),
              price_override_cents: null,
              image_url: images[0] || null,
            },
          ],
        },
      });

      toast.success("Produto cadastrado com sucesso no catálogo!");
      navigate({ to: "/workspace/catalogo/produtos" });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar o produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportProduct = async () => {
    if (!importUrl.trim()) {
      toast.error("Informe a URL do produto para importar.");
      return;
    }
    setIsImporting(true);
    try {
      const imported = await importProductFromUrl({
        data: { url: importUrl.trim(), tone: importTone },
      });
      if (imported) {
        if (imported.title) {
          setValue("title", imported.title);
          setValue("slug", slugify(imported.title));
        }
        if (imported.description) setValue("description", imported.description);
        if (imported.price_cents) setValue("price_cents", imported.price_cents);
        if (imported.brand) setValue("brand", imported.brand);
        const importedImages = (imported as any).media_urls || (imported as any).images;
        if (Array.isArray(importedImages) && importedImages.length > 0) {
          setImages(importedImages);
        }
        toast.success("Informações do produto importadas com IA!");
        setIsImportModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao extrair produto via IA.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Limpo ── */}
      <PageHeader
        eyebrow="Catálogo"
        title="Criar Novo Produto"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Importar com IA</span>
            </Button>
            <Button variant="outline" asChild size="sm" className="rounded-xl text-xs font-bold">
              <Link to="/workspace/catalogo/produtos">
                <ArrowLeft className="mr-1.5 size-3.5" />
                Voltar
              </Link>
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Publicar Produto</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* ── Dialog: Importador Inteligente por URL ── */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Importar Produto com Inteligência Artificial</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cole o link de uma página da web ou cardápio online para preencher o formulário automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL do Produto / Página</Label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://exemplo.com.br/produto/item"
                className="h-10 text-xs rounded-xl"
                disabled={isImporting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tom da Descrição do Produto</Label>
              <Select
                value={importTone}
                onValueChange={(v: any) => setImportTone(v)}
                disabled={isImporting}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="profissional">Profissional & Elegante</SelectItem>
                  <SelectItem value="persuasivo">Persuasivo & Vendedor (Copywriting)</SelectItem>
                  <SelectItem value="tecnico">Técnico & Detalhado (Especificações)</SelectItem>
                  <SelectItem value="minimalista">Minimalista & Direto ao Ponto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isImporting}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportProduct}
              disabled={isImporting || !importUrl.trim()}
              className="rounded-xl font-bold text-xs gap-1.5"
            >
              {isImporting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Extrair & Preencher</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Grid Principal: Formulário por Abas (5/12) + Preview Real da Vitrine (7/12) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: FORMULÁRIO ERGONÔMICO (5 COLUNAS) */}
        <div className="lg:col-span-5 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-2xl h-10 mb-4">
              <TabsTrigger value="basico" className="rounded-xl text-xs font-bold">
                Básico
              </TabsTrigger>
              <TabsTrigger value="preco" className="rounded-xl text-xs font-bold">
                Preço
              </TabsTrigger>
              <TabsTrigger value="midias" className="rounded-xl text-xs font-bold">
                Fotos
              </TabsTrigger>
              <TabsTrigger value="opcoes" className="rounded-xl text-xs font-bold">
                Opções
              </TabsTrigger>
            </TabsList>

            {/* ── ABA 1: INFORMAÇÕES BÁSICAS ── */}
            <TabsContent value="basico" className="space-y-4 m-0">
              <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Tag className="size-4 text-primary" />
                  <span>Identificação do Produto</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Nome do Produto *</Label>
                  <Input
                    value={formValues.title}
                    onChange={handleTitleChange}
                    placeholder="Ex: Tênis Esportivo Air Runner Preto"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Categoria</Label>
                    <Select
                      value={formValues.category_id}
                      onValueChange={(val) => setValue("category_id", val)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Marca / Fabricante</Label>
                    <Input
                      {...register("brand")}
                      placeholder="Ex: Nike, Coca-Cola, Autoral"
                      className="h-10 rounded-xl text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Slug URL</Label>
                    <Input
                      {...register("slug")}
                      placeholder="tenis-esportivo-air-runner"
                      className="h-10 rounded-xl text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Unidade de Venda</Label>
                    <Select
                      value={formValues.selling_unit}
                      onValueChange={(val) => setValue("selling_unit", val)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-background font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                        <SelectItem value="kg">Quilo (kg)</SelectItem>
                        <SelectItem value="g">Grama (g)</SelectItem>
                        <SelectItem value="l">Litro (l)</SelectItem>
                        <SelectItem value="ml">Mililitro (ml)</SelectItem>
                        <SelectItem value="cx">Caixa (cx)</SelectItem>
                        <SelectItem value="fd">Fardo (fd)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Resumo Curto</Label>
                  <Input
                    {...register("short_description")}
                    placeholder="Ex: Conforto extremo com solado amortecedor"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Descrição Completa</Label>
                  <Textarea
                    {...register("description")}
                    rows={4}
                    placeholder="Descreva as características, materiais, tamanhos e diferenciais do produto..."
                    className="rounded-xl text-xs bg-background"
                  />
                </div>
              </div>

              {/* Logística & Frete */}
              <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Truck className="size-4 text-primary" />
                  <span>Logística & Frete</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("weight_kg", { valueAsNumber: true })}
                      placeholder="0.5"
                      className="h-10 rounded-xl text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Tempo de Preparo (dias)</Label>
                    <Input
                      type="number"
                      {...register("preparation_time_days", { valueAsNumber: true })}
                      placeholder="0"
                      className="h-10 rounded-xl text-xs bg-background font-mono"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── ABA 2: PREÇO & ESTOQUE ── */}
            <TabsContent value="preco" className="space-y-4 m-0">
              <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <DollarSign className="size-4 text-primary" />
                  <span>Precificação & Margens</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Preço de Venda (R$) *</Label>
                    <Controller
                      control={control}
                      name="price_cents"
                      render={({ field }) => (
                        <CurrencyField
                          value={field.value}
                          onChange={field.onChange}
                          className="h-10 rounded-xl text-xs bg-background font-mono font-bold"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Preço De (Comparativo)</Label>
                    <Controller
                      control={control}
                      name="compare_at_cents"
                      render={({ field }) => (
                        <CurrencyField
                          value={field.value}
                          onChange={field.onChange}
                          className="h-10 rounded-xl text-xs bg-background font-mono"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Preço de Custo (R$)</Label>
                    <Controller
                      control={control}
                      name="cost_cents"
                      render={({ field }) => (
                        <CurrencyField
                          value={field.value}
                          onChange={field.onChange}
                          className="h-10 rounded-xl text-xs bg-background font-mono"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Status do Produto</Label>
                    <Select
                      value={formValues.status}
                      onValueChange={(val: any) => setValue("status", val)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Publicado (Visível)</SelectItem>
                        <SelectItem value="draft">Rascunho (Oculto)</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Estoque Inicial</Label>
                    <Input
                      type="number"
                      {...register("stock", { valueAsNumber: true })}
                      placeholder="10"
                      className="h-10 rounded-xl text-xs bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Código SKU</Label>
                    <Input
                      {...register("sku")}
                      placeholder="Ex: TEN-RUN-001"
                      className="h-10 rounded-xl text-xs bg-background font-mono"
                    />
                  </div>
                </div>

                {/* Toggle de Visibilidade de Estoque */}
                <Controller
                  control={control}
                  name="show_stock_publicly"
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/20 border border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">Exibir disponibilidade na vitrine</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          Quando ativo, clientes veem o indicador de estoque ou esgotado.
                        </p>
                      </div>
                      <Switch
                        id="new_show_stock_publicly"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </div>
            </TabsContent>

            {/* ── ABA 3: FOTOS & MÍDIAS ── */}
            <TabsContent value="midias" className="space-y-4 m-0">
              <div className="bg-card rounded-2xl p-5 space-y-3 border border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <ImagePlus className="size-4 text-primary" />
                    <span>Galeria de Imagens</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {images.length} foto(s)
                  </span>
                </div>

                <MediaUploader
                  value={images}
                  onChange={setImages}
                  bucket="cms-media"
                  folder="products"
                  aspect={1}
                  enableCrop={true}
                  maxFiles={8}
                />
              </div>
            </TabsContent>

            {/* ── ABA 4: ADICIONAIS & MODIFICADORES ── */}
            <TabsContent value="opcoes" className="space-y-4 m-0">
              <div className="bg-card rounded-2xl p-5 space-y-3 border border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <SlidersHorizontal className="size-4 text-primary" />
                    <span>Adicionais & Modificadores</span>
                  </div>
                  <Link
                    to="/workspace/catalogo/atributos"
                    className="text-[11px] text-primary hover:underline font-medium"
                    target="_blank"
                  >
                    Gerenciar grupos
                  </Link>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selecione quais grupos de complementos estarão ativos neste item:
                </p>

                {optionGroupsList && optionGroupsList.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {optionGroupsList.map((grp: any) => {
                      const isChecked = selectedOptionGroupIds.includes(grp.id);
                      return (
                        <label
                          key={grp.id}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors text-xs select-none",
                            isChecked
                              ? "border-primary bg-primary/5 text-foreground font-semibold"
                              : "border-border/80 bg-background text-muted-foreground hover:border-foreground/30",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary size-4"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOptionGroupIds((prev) => [...prev, grp.id]);
                              } else {
                                setSelectedOptionGroupIds((prev) => prev.filter((id) => id !== grp.id));
                              }
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{grp.display_name || grp.internal_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {grp.values?.length || 0} opção(ões) • {grp.is_required ? "Obrigatório" : "Opcional"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center border-dashed rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">
                      Nenhum grupo de adicionais cadastrado na loja.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* COLUNA DIREITA: PREVIEW REAL DA VITRINE (7 COLUNAS STICKY) */}
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          <div className="bg-card rounded-3xl overflow-hidden border border-border/80 shadow-sm">
            {/* Header do Mockup */}
            <div className="bg-muted/40 px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Preview Real da Vitrine (Página do Produto)
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Live Preview
              </Badge>
            </div>

            {/* Corpo do Mockup Fiel ao E-commerce */}
            <div className="p-6 space-y-6">
              {/* Galeria de Fotos */}
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-2xl bg-muted/40 overflow-hidden relative border flex items-center justify-center">
                  {images.length > 0 && images[activePreviewImage] ? (
                    <img
                      src={images[activePreviewImage]}
                      alt={formValues.title}
                      className="size-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                      <Package className="size-12 stroke-[1.2]" />
                      <span className="text-xs">Sem foto de capa</span>
                    </div>
                  )}
                  {formValues.status !== "published" && (
                    <Badge variant="secondary" className="absolute top-3 left-3 text-[10px] font-bold">
                      Rascunho (Oculto)
                    </Badge>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePreviewImage(idx)}
                        className={`size-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                          activePreviewImage === idx
                            ? "border-primary ring-2 ring-primary/20 scale-105"
                            : "border-border/60 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Informações Comerciais */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {formValues.brand || store?.name || "Loja Parceira"}
                  </span>
                  <h2 className="text-xl font-black text-foreground leading-tight">
                    {formValues.title || "Nome do Produto em Destaque"}
                  </h2>
                  {formValues.short_description && (
                    <p className="text-xs text-muted-foreground">
                      {formValues.short_description}
                    </p>
                  )}
                </div>

                {/* Bloco de Preços */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                  {formValues.compare_at_cents > formValues.price_cents && (
                    <span className="text-xs text-muted-foreground line-through block font-mono">
                      {formatMoney(formValues.compare_at_cents)}
                    </span>
                  )}
                  <div className="text-2xl font-black text-foreground font-mono">
                    {formatMoney(formValues.price_cents || 0)}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      /{formValues.selling_unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Em até 12x de {formatMoney(Math.round((formValues.price_cents || 0) / 12))} sem juros
                  </p>
                </div>

                {/* Selo de Estoque */}
                <div className="flex items-center gap-2 text-xs">
                  {formValues.stock > 0 ? (
                    <>
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-muted-foreground font-medium">
                        Disponível em estoque ({formValues.stock} unidades)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="size-2 rounded-full bg-destructive" />
                      <span className="text-destructive font-medium">Esgotado no momento</span>
                    </>
                  )}
                </div>

                {/* Botões de Ação da Vitrine */}
                <div className="space-y-2 pt-2">
                  <Button className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground gap-2">
                    <ShoppingBag className="size-4" />
                    <span>Adicionar ao Carrinho</span>
                  </Button>
                  <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
                    Comprar Agora
                  </Button>
                </div>

                {/* Benefícios & Frete */}
                <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="size-4 text-primary" />
                    <span>Entrega rápida em Chapecó e região</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Garantia de autenticidade e compra protegida</span>
                  </div>
                </div>

                {/* Bloco de Análise Financeira (Margem / Lucro) */}
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Lucro Bruto Estimado
                    </span>
                    <div className="text-sm font-black font-mono text-emerald-600">
                      {formatMoney(grossProfitCents)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Margem de Contribuição
                    </span>
                    <div className="text-sm font-black font-mono text-foreground">
                      {marginPercent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição na Prévia */}
              {formValues.description && (
                <div className="pt-4 border-t space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Sobre o Produto
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {formValues.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
