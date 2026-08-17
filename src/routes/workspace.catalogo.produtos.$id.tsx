import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  ImagePlus,
  X,
  Loader2,
  Trash2,
  Eye,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Percent,
  TrendingUp,
  Package,
  CheckCircle2,
  Settings,
  LayoutList,
  Box,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { ProductEditorLayout } from "@/components/admin/product-editor/product-editor-layout";
import { VariantOptionsBuilder } from "@/components/admin/product-editor/variant-options-builder";
import { VariantMatrixGrid, type RawVariant } from "@/components/admin/catalog/variant-matrix-grid";

import { PageHeader } from "@/components/commerce/page-header";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
import { Crop } from "lucide-react";
import { PriceDisplay } from "@/components/commerce/price-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

import {
  getProductById,
  updateProduct,
  upsertProductVariant,
  batchUpsertVariantMatrix,
  deleteProductMedia,
  addProductMediaLink,
  updateProductMediaMetadata,
  reorderProductMedia,
  listCategories,
  createCategory,
  listProductOptionGroups,
  batchSaveOptionGroups,
} from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import { adjustStock } from "@/services/stock.functions";

export const Route = createFileRoute("/workspace/catalogo/produtos/$id")({
  head: () => ({ meta: [{ title: "Editor Avançado de Produto" }] }),
  loader: async ({ params }) => {
    const [product, catsRes, typesRes] = await Promise.all([
      getProductById({ data: { id: params.id } }),
      listCategories(),
      import("@/services/admin-catalog.functions").then((m) => m.listProductTypes()),
    ]);
    if (!product) throw new Error("Produto não encontrado.");
    return {
      product,
      categories: catsRes || [],
      productTypes: typesRes || [],
    };
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { product, categories, productTypes } = Route.useLoaderData();

  // State for live preview updates
  const [liveTitle, setLiveTitle] = useState(product.title);
  const [liveDescription, setLiveDescription] = useState(product.description || "");
  const [liveBrand, setLiveBrand] = useState(product.brand || "");
  const [livePriceCents, setLivePriceCents] = useState(product.price_cents || 0);
  const [liveCompareCents, setLiveCompareCents] = useState(product.compare_at_cents || null);
  const [liveCostCents, setLiveCostCents] = useState(product.cost_cents || null);
  const [liveStatus, setLiveStatus] = useState(product.status || "draft");

  // Collect unique attribute keys from actual variants
  const attributeKeys: string[] = useMemo(() => {
    return Array.from(
      new Set(
        (product.product_variants || []).flatMap((v: any) => Object.keys(v.attributes || {})),
      ),
    );
  }, [product.product_variants]);

  // Main Cover Image for preview
  const coverImage = product.product_media?.[0]?.url;

  // Profit margin calculation
  const profitMarginPercent = useMemo(() => {
    if (!livePriceCents || !liveCostCents || livePriceCents <= 0) return null;
    const profit = livePriceCents - liveCostCents;
    return Math.round((profit / livePriceCents) * 100);
  }, [livePriceCents, liveCostCents]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo / Editor Avançado"
        title={liveTitle || "Editar Produto"}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild size="sm">
              <Link to="/workspace/catalogo/produtos">
                <ArrowLeft className="mr-1.5 size-4" />
                Voltar ao Catálogo
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link to={`/produto/${product.slug}` as never} target="_blank">
                <Eye className="mr-1.5 size-4" />
                Ver na Vitrine
              </Link>
            </Button>
          </div>
        }
      />

      <ProductEditorLayout
        preview={
          <div className="space-y-4">
            {/* The Truthful Preview Phone Mockup */}
            <div className="w-full max-w-[340px] rounded-[2.5rem] border-[4px] border-border bg-background overflow-hidden shadow-xl relative h-[650px] flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-border rounded-b-xl w-32 z-10 mx-auto" />

              <div className="flex-1 overflow-y-auto no-scrollbar pt-8 pb-12 flex flex-col">
                <div className="relative aspect-[4/5] bg-muted/30 overflow-hidden w-full flex items-center justify-center">
                  {coverImage ? (
                    <img src={coverImage} alt={liveTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="size-10 stroke-1" />
                      <span className="text-xs">Sem foto de capa</span>
                    </div>
                  )}
                  {/* Floating Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge
                      variant={liveStatus === "published" ? "default" : "secondary"}
                      className="shadow-sm bg-background text-foreground"
                    >
                      {liveStatus === "published"
                        ? "Publicado"
                        : liveStatus === "archived"
                          ? "Arquivado"
                          : "Rascunho"}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {liveBrand && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {liveBrand}
                    </span>
                  )}
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none mb-3">
                    {liveTitle || "Título do produto..."}
                  </h3>

                  <div className="mb-6">
                    <PriceDisplay
                      amountCents={livePriceCents}
                      compareAtCents={liveCompareCents ?? undefined}
                      size="lg"
                    />
                  </div>

                  {liveDescription && (
                    <div className="text-sm text-muted-foreground line-clamp-3 mb-6 font-mono leading-relaxed">
                      {liveDescription}
                    </div>
                  )}

                  <div className="mt-auto">
                    <Button className="w-full h-12 text-base font-bold rounded-full shadow bg-primary text-primary-foreground">
                      Comprar Agora
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {profitMarginPercent !== null && (
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20 px-3 py-1 text-xs gap-1.5 font-mono"
                >
                  <TrendingUp className="size-3.5" /> Margem Estimada: {profitMarginPercent}%
                </Badge>
              </div>
            )}
          </div>
        }
        sections={[
          { id: "geral", label: "Informações Básicas", icon: <Box /> },
          { id: "midias", label: "Galeria de Fotos", icon: <ImagePlus /> },
          { id: "opcoes", label: "Opções & Adicionais", icon: <Settings /> },
          { id: "variantes", label: "Estoque & Variações", icon: <LayoutList /> },
        ]}
      >
        <div id="geral" className="scroll-mt-32">
          <GeneralForm
            product={product}
            categories={categories}
            productTypes={productTypes}
            onTitleChange={setLiveTitle}
            onDescriptionChange={setLiveDescription}
            onBrandChange={setLiveBrand}
            onPriceChange={setLivePriceCents}
            onCompareChange={setLiveCompareCents}
            onCostChange={setLiveCostCents}
            onStatusChange={setLiveStatus}
          />
        </div>

        <div id="midias" className="scroll-mt-32 pt-12 border-t">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImagePlus className="size-5 text-primary" /> Galeria de Fotos
            </h2>
            <p className="text-sm text-muted-foreground">
              Arraste para reordenar, gerencie fotos e vídeos e defina o focal point.
            </p>
          </div>
          <MediaManager product={product} />
        </div>

        <div id="variantes" className="scroll-mt-32 pt-12 border-t">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LayoutList className="size-5 text-primary" /> Estoque & Variações
            </h2>
            <p className="text-sm text-muted-foreground">
              Gerencie o saldo em estoque, variações de tamanho, cor, SKUs e EANs específicos.
            </p>
          </div>
          <VariantsManager product={product} />
        </div>

        <div id="opcoes" className="scroll-mt-32 pt-12 border-t">
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="size-5 text-primary" /> Opções &amp; Adicionais
            </h2>
            <p className="text-sm text-muted-foreground">
              Grupos de opções que o cliente escolhe ao adicionar ao carrinho (ex: sabor, adicional,
              personalização).
            </p>
          </div>
          <OptionGroupsManager productId={product.id} />
        </div>
      </ProductEditorLayout>
    </div>
  );
}

function GeneralForm({
  product,
  categories,
  productTypes,
  onTitleChange,
  onDescriptionChange,
  onBrandChange,
  onPriceChange,
  onCompareChange,
  onCostChange,
  onStatusChange,
}: {
  product: any;
  categories: any[];
  productTypes: any[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onPriceChange: (v: number) => void;
  onCompareChange: (v: number | null) => void;
  onCostChange: (v: number | null) => void;
  onStatusChange: (v: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialCategoryId = product.product_categories?.[0]?.category_id || "";
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryId);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: product.title,
      description: product.description || "",
      brand: product.brand || "",
      price_cents: product.price_cents || 0,
      compare_at_cents: product.compare_at_cents || undefined,
      cost_cents: product.cost_cents || undefined,
      status: product.status,
      short_description: product.short_description || "",
      manufacturer: product.manufacturer || "",
      ean: product.ean || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      is_physical: product.is_physical !== false,
      weight_kg: product.weight_kg || "",
      width_cm: product.width_cm || "",
      height_cm: product.height_cm || "",
      length_cm: product.length_cm || "",
      preparation_time_days: product.preparation_time_days || 0,
      preparation_time_minutes: (product as any).preparation_time_minutes || "",
      type_id: product.type_id || "none",
      attributes: product.attributes || {},
    },
  });

  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const watchBrand = watch("brand");
  const watchPrice = watch("price_cents");
  const watchCompare = watch("compare_at_cents");
  const watchCost = watch("cost_cents");
  const watchStatus = watch("status");
  const watchTypeId = watch("type_id");
  const selectedProductType = useMemo(() => {
    return productTypes.find((t) => t.id === watchTypeId);
  }, [watchTypeId, productTypes]);

  // Re-emit live updates to preview
  useEffect(() => {
    onTitleChange(watchTitle);
  }, [watchTitle, onTitleChange]);

  useEffect(() => {
    onDescriptionChange(watchDescription);
  }, [watchDescription, onDescriptionChange]);

  useEffect(() => {
    onBrandChange(watchBrand);
  }, [watchBrand, onBrandChange]);

  useEffect(() => {
    const val = typeof watchPrice === "number" ? watchPrice : parseInt(String(watchPrice || "").replace(/\D/g, ""), 10);
    onPriceChange(isNaN(val) ? 0 : val);
  }, [watchPrice, onPriceChange]);

  useEffect(() => {
    if (watchCompare === undefined || watchCompare === null || watchCompare === ("" as any)) {
      return onCompareChange(null);
    }
    const val = typeof watchCompare === "number" ? watchCompare : parseInt(String(watchCompare).replace(/\D/g, ""), 10);
    onCompareChange(isNaN(val) ? null : val);
  }, [watchCompare, onCompareChange]);

  useEffect(() => {
    if (watchCost === undefined || watchCost === null || watchCost === ("" as any)) {
      return onCostChange(null);
    }
    const val = typeof watchCost === "number" ? watchCost : parseInt(String(watchCost).replace(/\D/g, ""), 10);
    onCostChange(isNaN(val) ? null : val);
  }, [watchCost, onCostChange]);

  useEffect(() => {
    onStatusChange(watchStatus);
  }, [watchStatus, onStatusChange]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const price_cents = typeof values.price_cents === "number"
        ? values.price_cents
        : parseInt(String(values.price_cents || "").replace(/\D/g, ""), 10) || 0;
      const compare_at_cents = values.compare_at_cents !== undefined && values.compare_at_cents !== null && values.compare_at_cents !== ""
        ? (typeof values.compare_at_cents === "number"
            ? values.compare_at_cents
            : parseInt(String(values.compare_at_cents).replace(/\D/g, ""), 10) || null)
        : null;
      const cost_cents = values.cost_cents !== undefined && values.cost_cents !== null && values.cost_cents !== ""
        ? (typeof values.cost_cents === "number"
            ? values.cost_cents
            : parseInt(String(values.cost_cents).replace(/\D/g, ""), 10) || null)
        : null;
      const res = await updateProduct({
        data: {
          id: product.id,
          title: values.title,
          description: values.description || null,
          brand: values.brand,
          status: values.status,
          price_cents,
          compare_at_cents,
          cost_cents,
          short_description: values.short_description || null,
          manufacturer: values.manufacturer || null,
          ean: values.ean || null,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          is_physical: values.is_physical,
          weight_kg: values.weight_kg ? parseFloat(values.weight_kg) : null,
          width_cm: values.width_cm ? parseFloat(values.width_cm) : null,
          height_cm: values.height_cm ? parseFloat(values.height_cm) : null,
          length_cm: values.length_cm ? parseFloat(values.length_cm) : null,
          preparation_time_days: values.preparation_time_days
            ? parseInt(values.preparation_time_days, 10)
            : 0,
          preparation_time_minutes: values.preparation_time_minutes
            ? parseInt(values.preparation_time_minutes, 10)
            : null,
          category_ids: selectedCategory ? [selectedCategory] : [],
          type_id: values.type_id !== "none" ? values.type_id : null,
          attributes: values.attributes,
        },
      });

      if (res) {
        toast.success("Produto atualizado com sucesso!");
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch (e) {
      toast.error("Erro inesperado ao salvar alterações");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const slug = newCategoryName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const res = await createCategory({
        data: {
          name: newCategoryName,
          slug,
          status: "active",
        },
      });
      if (res) {
        toast.success("Categoria criada!");
        categories.push(res);
        setSelectedCategory(res.id);
        setIsCategoryModalOpen(false);
        setNewCategoryName("");
      } else {
        toast.error("Erro ao criar categoria");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Informações Comerciais Principais</h3>
          <p className="text-sm text-muted-foreground">
            Defina o título, marca e descrição detalhada do produto.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título do Produto *</Label>
            <Input {...register("title", { required: "Obrigatório" })} />
            {errors.title && <span className="text-xs text-destructive">Título obrigatório</span>}
          </div>
          <div className="space-y-2">
            <Label>Descrição Completa (Rich Text / Texto)</Label>
            <Textarea
              {...register("description")}
              rows={5}
              placeholder="Descreva os materiais, conforto, altura do salto e indicações de uso..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca / Fabricante</Label>
              <Input {...register("brand")} placeholder="Ex: Jah, Vizzano, Beira Rio..." />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Categoria Principal</Label>
                <Sheet open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      + Nova Categoria
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Criar Nova Categoria</SheetTitle>
                      <SheetDescription>
                        Crie uma nova categoria para agrupar produtos na vitrine.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome da Categoria</Label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ex: Lançamentos"
                          autoFocus
                        />
                      </div>
                    </div>
                    <SheetFooter>
                      <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                      >
                        {isCreatingCategory ? "Criando..." : "Criar Categoria"}
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Precificação & Lucratividade</h3>
          <p className="text-sm text-muted-foreground">
            Valores em Reais (R$). Cálculos de margem de lucro acontecem em tempo real.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Preço de Venda (R$) *</Label>
            <Controller
              name="price_cents"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CurrencyField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0,00"
                  className="h-10"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Preço Comparativo De (R$)</Label>
            <Controller
              name="compare_at_cents"
              control={control}
              render={({ field }) => (
                <CurrencyField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0,00"
                  className="h-10"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Custo por Item (R$)</Label>
            <Controller
              name="cost_cents"
              control={control}
              render={({ field }) => (
                <CurrencyField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0,00"
                  className="h-10"
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Publicação & Status</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status de Visibilidade</Label>
            <Select defaultValue={product.status} onValueChange={(val) => setValue("status", val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho (Oculto)</SelectItem>
                <SelectItem value="published">Publicado (Visível na Vitrine)</SelectItem>
                <SelectItem value="archived">Arquivado (Inativo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <LayoutList className="size-5 text-primary" />
            Ficha Técnica Dinâmica (Tipo de Produto)
          </h3>
          <p className="text-sm text-muted-foreground">
            Defina um tipo de produto para renderizar campos específicos (ex: Material, Voltagem,
            Indicação) de acordo com o seu nicho.
          </p>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Tipo de Produto</Label>
            <Select value={watchTypeId} onValueChange={(val) => setValue("type_id", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Produto Genérico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Produto Genérico</SelectItem>
                {productTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProductType &&
            selectedProductType.field_schema &&
            selectedProductType.field_schema.length > 0 && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Campos de {selectedProductType.name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProductType.field_schema.map((field: any, idx: number) => {
                    const fieldKey = `attributes.${field.name}`;
                    return (
                      <div key={idx} className="space-y-2">
                        <Label className="flex items-center gap-1">
                          {field.name}
                          {field.required && <span className="text-destructive">*</span>}
                        </Label>

                        {field.kind === "text" && (
                          <Input
                            {...register(fieldKey as any, { required: field.required })}
                            placeholder="Ex: Algodão"
                          />
                        )}

                        {field.kind === "number" && (
                          <Input
                            type="number"
                            step="any"
                            {...register(fieldKey as any, { required: field.required })}
                            placeholder="0"
                          />
                        )}

                        {field.kind === "boolean" && (
                          <div className="flex items-center h-10 space-x-2">
                            <Checkbox
                              id={fieldKey}
                              checked={watch(fieldKey as any) === true}
                              onCheckedChange={(checked: boolean) =>
                                setValue(fieldKey as any, checked === true)
                              }
                            />
                            <label
                              htmlFor={fieldKey}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Sim, possui {field.name.toLowerCase()}
                            </label>
                          </div>
                        )}

                        {(field.kind === "select_single" || field.kind === "option_group") && (
                          <Select
                            value={watch(fieldKey as any) || ""}
                            onValueChange={(val) => setValue(fieldKey as any, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt: string, i: number) => (
                                <SelectItem key={i} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Logística Avançada & Dimensões</h3>
          <p className="text-sm text-muted-foreground">
            Necessário para cálculo de frete e prazos.
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_physical"
              {...register("is_physical")}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="is_physical" className="text-sm font-semibold">
              Este é um produto físico que requer frete
            </Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                {...register("weight_kg")}
                type="number"
                step="0.001"
                placeholder="Ex: 0.500"
              />
            </div>
            <div className="space-y-2">
              <Label>Largura (cm)</Label>
              <Input {...register("width_cm")} type="number" step="0.01" placeholder="Ex: 20" />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input {...register("height_cm")} type="number" step="0.01" placeholder="Ex: 15" />
            </div>
            <div className="space-y-2">
              <Label>Comprimento (cm)</Label>
              <Input {...register("length_cm")} type="number" step="0.01" placeholder="Ex: 30" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prazo de Preparação (dias)</Label>
              <Input {...register("preparation_time_days")} type="number" placeholder="Ex: 0" />
            </div>
            <div className="space-y-2">
              <Label>Preparo Imediato / Lanches (minutos)</Label>
              <Input {...register("preparation_time_minutes")} type="number" placeholder="Ex: 25" />
            </div>
            <div className="space-y-2">
              <Label>Origem de Envio</Label>
              <Select
                defaultValue={(product.attributes as any)?.origin || "national"}
                onValueChange={async (val) => {
                  const currentAttr = (product.attributes as any) || {};
                  const newAttr = { ...currentAttr, origin: val };
                  await updateProduct({ data: { id: product.id, attributes: newAttr } });
                  toast.success("Origem atualizada com sucesso!");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Nacional (Brasil)</SelectItem>
                  <SelectItem value="international">Internacional (Importação)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Identificadores & SEO</h3>
          <p className="text-sm text-muted-foreground">
            Otimização para busca e conformidade fiscal/EAN.
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fabricante / Marca do Fornecedor</Label>
              <Input {...register("manufacturer")} placeholder="Ex: Nike S.A." />
            </div>
            <div className="space-y-2">
              <Label>Código EAN / GTIN</Label>
              <Input {...register("ean")} placeholder="Ex: 7891234567890" maxLength={14} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Resumo Curto (Short Description)</Label>
            <Textarea
              {...register("short_description")}
              placeholder="Visualização rápida do produto..."
              className="min-h-16"
            />
          </div>
          <div className="space-y-2">
            <Label>Meta Title (SEO)</Label>
            <Input {...register("meta_title")} />
          </div>
          <div className="space-y-2">
            <Label>Meta Description (SEO)</Label>
            <Textarea {...register("meta_description")} className="min-h-16" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg" className="font-bold">
          {isSubmitting ? "Salvando..." : "Salvar Alterações do Produto"}
        </Button>
      </div>
    </form>
  );
}

function VariantsManager({ product }: { product: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<RawVariant[]>(() => {
    return (product.product_variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      ean: v.ean,
      attributes: v.attributes || {},
      stock: v.stock_on_hand ?? v.stock ?? 0,
      price_override_cents: v.price_override_cents,
      cost_cents: v.cost_cents,
      weight_kg: v.weight_kg,
      image_url: v.image_url,
      status: v.status || "active",
      allow_backorder: v.allow_backorder,
      backorder_lead_time_days: v.backorder_lead_time_days,
      requires_payment_for_backorder: v.requires_payment_for_backorder,
    }));
  });

  const handleSaveMatrix = async () => {
    setIsSubmitting(true);
    try {
      await batchUpsertVariantMatrix({
        data: {
          product_id: product.id,
          matrix: variants,
        },
      });
      toast.success("Matriz salva com sucesso!");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao salvar matriz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="builder" className="border border-border bg-card rounded-xl px-4">
          <AccordionTrigger className="hover:no-underline text-base font-semibold">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-warning" />
              Gerador em Lote (Usar apenas para setup inicial)
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="mb-4 p-3 bg-warning/10 text-warning border border-warning/20 rounded-xl text-sm">
              <strong>Atenção:</strong> Usar o gerador recriará a matriz baseada nas opções
              fornecidas. Se você já tem variações com fotos e histórico de vendas, use o botão{" "}
              <strong>"+ Adicionar sub-variação"</strong> diretamente na tabela abaixo para não
              perder dados.
            </div>
            <VariantOptionsBuilder product={product} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-6 border-t">
        <div className="flex flex-row items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <LayoutList className="size-5" />
              Matriz de Variações e Estoque
            </h3>
            <p className="text-sm text-muted-foreground">
              Ajuste atributos, estoque, preços e SKUs diretamente na tabela.
            </p>
          </div>
          <Button onClick={handleSaveMatrix} disabled={isSubmitting} size="sm">
            {isSubmitting ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Settings className="size-4 mr-2" />
            )}
            Salvar Alterações da Matriz
          </Button>
        </div>
        <div>
          <VariantMatrixGrid
            variants={variants}
            onChange={setVariants}
            basePriceCents={product.price_cents || 0}
          />
        </div>
      </div>
    </div>
  );
}

function MediaManager({ product }: { product: any }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingMedia, setEditingMedia] = useState<any | null>(null);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  const handleAddImage = async (url: string) => {
    if (!url) return;
    setIsAdding(true);
    try {
      const res = await addProductMediaLink({ data: { product_id: product.id, url } });
      if (res) {
        toast.success("Imagem vinculada e salva na galeria!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar imagem.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar imagem.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (mediaId: string, mediaUrl: string) => {
    try {
      await deleteProductMedia({ data: { id: mediaId, url: mediaUrl } });
      toast.success("Mídia removida.");
      router.invalidate();
    } catch (e) {
      toast.error("Erro ao deletar mídia");
    }
  };

  const handleMove = async (index: number, direction: "left" | "right") => {
    const list = [...(product.product_media || [])];
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === list.length - 1) return;

    const targetIdx = direction === "left" ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const mediaOrders = list.map((item, idx) => ({
      id: item.id,
      sort_order: idx,
    }));

    try {
      await reorderProductMedia({ data: { mediaOrders } });
      toast.success("Ordenação atualizada!");
      router.invalidate();
    } catch {
      toast.error("Erro ao reordenar mídias.");
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMedia) return;

    setIsSavingMetadata(true);
    const formData = new FormData(e.currentTarget);
    const alt = formData.get("alt") as string;
    const media_type = formData.get("media_type") as "image" | "video";
    const variant_id = (formData.get("variant_id") as string) || null;

    try {
      await updateProductMediaMetadata({
        data: {
          id: editingMedia.id,
          alt: alt || null,
          media_type,
          variant_id: variant_id === "none" ? null : variant_id,
        },
      });

      toast.success("Metadados atualizados com sucesso!");
      setEditingMedia(null);
      router.invalidate();
    } catch {
      toast.error("Erro ao atualizar metadados.");
    } finally {
      setIsSavingMetadata(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground">Galeria de Fotos do Produto</h3>
        <p className="text-sm text-muted-foreground">
          Fotos em alta qualidade aumentam a conversão de vendas. Limite de 5MB por arquivo.
        </p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Fazer Upload de Imagem</Label>
          <div className="max-w-md">
            <ImageUpload onChange={handleAddImage} bucket="product-media" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2 border-t border-dashed">
          {product.product_media
            ?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((m: any, idx: number) => {
              const matchedVariant = product.product_variants?.find(
                (v: any) => v.id === m.variant_id,
              );
              const variantText = matchedVariant ? `Variação: ${matchedVariant.sku}` : "Uso Geral";

              return (
                <div
                  key={m.id || idx}
                  className="relative group border overflow-hidden bg-card  flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
                    {m.media_type === "video" ? (
                      <video
                        src={m.url}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                      />
                    ) : (
                      <img src={m.url} alt={m.alt || ""} className="w-full h-full object-cover" />
                    )}
                    {idx === 0 && (
                      <Badge className="absolute top-2 left-2 text-[10px]" variant="default">
                        Capa
                      </Badge>
                    )}
                    {m.media_type === "video" && (
                      <Badge className="absolute top-2 right-12 text-[10px] bg-destructive hover:bg-destructive text-white border-none">
                        Vídeo
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditingMedia(m)}
                      >
                        <Settings className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDelete(m.id, m.url)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] font-semibold text-primary truncate">{variantText}</p>
                    <p className="text-[10px] text-muted-foreground truncate italic">
                      {m.alt ? `"${m.alt}"` : "Sem legenda"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "left")}
                      >
                        <ArrowLeft className="size-3.5" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Pos: {idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        disabled={idx === (product.product_media?.length || 0) - 1}
                        onClick={() => handleMove(idx, "right")}
                      >
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <Sheet open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        {editingMedia && (
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Editar Detalhes da Mídia</SheetTitle>
              <SheetDescription>
                Adicione legendas de acessibilidade ou vincule esta imagem a uma variante
                específica.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSaveMetadata} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Legenda / Texto Alternativo (Acessibilidade)</Label>
                <Input
                  name="alt"
                  defaultValue={editingMedia.alt || ""}
                  placeholder="Ex: Tênis vermelho de couro sob luz natural"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Mídia</Label>
                <Select name="media_type" defaultValue={editingMedia.media_type || "image"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vincular à Variante</Label>
                <Select name="variant_id" defaultValue={editingMedia.variant_id || "none"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uso Geral (Vitrine Principal)</SelectItem>
                    {product.product_variants?.map((v: any) => {
                      const attrsText = Object.entries(v.attributes || {})
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(", ");
                      return (
                        <SelectItem key={v.id} value={v.id}>
                          {v.sku} {attrsText ? `(${attrsText})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <SheetFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingMedia(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingMetadata}>
                  {isSavingMetadata ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OptionGroupsManager — Microfase F
// Gestor de grupos de opções/adicionais do produto.
// Cada grupo tem um tipo de seleção, regras min/max e uma lista de valores.
// ---------------------------------------------------------------------------

type OptionValue = {
  id?: string;
  label: string;
  price_modifier_cents: number;
  is_default: boolean;
  is_active: boolean;
  max_quantity?: number;
  sku_reference?: string | null;
};

type LocalOptionGroup = {
  id?: string;
  internal_name: string;
  display_name: string;
  selection_type: "single" | "multiple";
  min_selections: number;
  max_selections: number;
  franchise_included?: number;
  is_required: boolean;
  values: OptionValue[];
};

function OptionGroupsManager({ productId }: { productId: string }) {
  const [groups, setGroups] = useState<LocalOptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carrega grupos do servidor
  useEffect(() => {
    listProductOptionGroups({ data: { product_id: productId } })
      .then((data) => {
        if (data && data.length > 0) {
          const mapped: any[] = data.map((g: any) => {
            const og = g.option_groups;
            if (!og) return null;
            return {
              id: og.id,
              internal_name: og.internal_name,
              display_name: og.display_name,
              selection_type: og.selection_type,
              min_selections: og.min_selections,
              max_selections: og.max_selections,
              franchise_included: og.franchise_included ?? 0,
              is_required: og.is_required,
              values: (og.option_values || []).map((v: any) => ({
                id: v.id,
                label: v.label,
                price_modifier_cents: v.price_modifier_cents,
                is_default: v.is_default,
                is_active: v.is_active,
                max_quantity: v.max_quantity ?? 1,
                sku_reference: v.sku_reference || null,
              })),
            };
          });
          setGroups(mapped.filter(Boolean));
        }
      })
      .catch((e) =>
        toast.error("Erro ao carregar opções: " + (e instanceof Error ? e.message : String(e))),
      )
      .finally(() => setIsLoading(false));
  }, [productId]);

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        internal_name: "",
        display_name: "",
        selection_type: "single",
        min_selections: 0,
        max_selections: 1,
        franchise_included: 0,
        is_required: false,
        values: [
          {
            label: "",
            price_modifier_cents: 0,
            is_default: false,
            is_active: true,
            max_quantity: 1,
            sku_reference: null,
          },
        ],
      },
    ]);
  };

  const removeGroup = (idx: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateGroup = (idx: number, field: keyof LocalOptionGroup, value: any) => {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));
  };

  const addValue = (groupIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              values: [
                ...g.values,
                { label: "", price_modifier_cents: 0, is_default: false, is_active: true },
              ],
            }
          : g,
      ),
    );
  };

  const removeValue = (groupIdx: number, valueIdx: number) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx ? { ...g, values: g.values.filter((_, vi) => vi !== valueIdx) } : g,
      ),
    );
  };

  const updateValue = (groupIdx: number, valueIdx: number, field: keyof OptionValue, val: any) => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              values: g.values.map((v, vi) => (vi === valueIdx ? { ...v, [field]: val } : v)),
            }
          : g,
      ),
    );
  };

  const handleSave = async () => {
    // Validação básica
    for (const g of groups) {
      if (!g.display_name.trim()) {
        toast.error("Todos os grupos precisam de um nome de exibição.");
        return;
      }
      for (const v of g.values) {
        if (!v.label.trim()) {
          toast.error(`Grupo "${g.display_name}" tem uma opção sem rótulo.`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await batchSaveOptionGroups({
        data: {
          product_id: productId,
          groups: groups.map((g, i) => ({
            ...g,
            product_id: productId,
            sort_order: i,
          })),
        },
      });
      toast.success("Opções salvas com sucesso!");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao salvar opções.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <div className="border-dashed border border-border rounded-xl">
          <div className="py-10 flex flex-col items-center text-center gap-3">
            <Settings className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-foreground">Nenhum grupo de opções</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione grupos para que o cliente personalize o pedido (ex: ponto da carne,
                adicionais, tamanho de impressão).
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addGroup}>
              <Plus className="size-4 mr-2" />
              Adicionar Grupo
            </Button>
          </div>
        </div>
      ) : (
        <>
          {groups.map((group, gIdx) => (
            <div
              key={gIdx}
              className="border border-border rounded-xl bg-card mb-4 overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Nome de Exibição (cliente vê)
                      </Label>
                      <Input
                        value={group.display_name}
                        onChange={(e) => {
                          updateGroup(gIdx, "display_name", e.target.value);
                          if (!group.internal_name)
                            updateGroup(gIdx, "internal_name", e.target.value);
                        }}
                        placeholder="Ex: Ponto da carne, Adicionais"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo de Seleção</Label>
                      <Select
                        value={group.selection_type}
                        onValueChange={(v) => updateGroup(gIdx, "selection_type", v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Única (radio)</SelectItem>
                          <SelectItem value="multiple">Múltipla (checkbox)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <button
                    onClick={() => removeGroup(gIdx)}
                    className="text-muted-foreground hover:text-destructive transition-colors mt-1 shrink-0"
                    title="Remover grupo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={group.is_required}
                      onCheckedChange={(v) => updateGroup(gIdx, "is_required", !!v)}
                      className="size-3.5"
                    />
                    Obrigatório
                  </label>
                  {group.selection_type === "multiple" && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">Mín:</span>
                        <Input
                          type="number"
                          min={0}
                          value={group.min_selections}
                          onChange={(e) =>
                            updateGroup(gIdx, "min_selections", Number(e.target.value))
                          }
                          className="h-6 w-14 text-xs px-1"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">Máx:</span>
                        <Input
                          type="number"
                          min={1}
                          value={group.max_selections}
                          onChange={(e) =>
                            updateGroup(gIdx, "max_selections", Number(e.target.value))
                          }
                          className="h-6 w-14 text-xs px-1"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground">Franquia (Grátis):</span>
                        <Input
                          type="number"
                          min={0}
                          value={group.franchise_included ?? 0}
                          onChange={(e) =>
                            updateGroup(gIdx, "franchise_included", Number(e.target.value))
                          }
                          className="h-6 w-14 text-xs px-1"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2 mb-3">
                  {group.values.map((val, vIdx) => (
                    <div key={vIdx} className="flex items-center gap-2">
                      <Input
                        value={val.label}
                        onChange={(e) => updateValue(gIdx, vIdx, "label", e.target.value)}
                        placeholder="Rótulo da opção"
                        className="h-8 text-sm flex-1"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={(val.price_modifier_cents / 100).toFixed(2)}
                          onChange={(e) =>
                            updateValue(
                              gIdx,
                              vIdx,
                              "price_modifier_cents",
                              Math.round(Number(e.target.value) * 100),
                            )
                          }
                          className="h-8 w-20 text-sm"
                          placeholder="0,00"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-xs text-muted-foreground"
                          title="Máximo permitido desta opção"
                        >
                          Max:
                        </span>
                        <Input
                          type="number"
                          min={1}
                          value={val.max_quantity ?? 1}
                          onChange={(e) =>
                            updateValue(gIdx, vIdx, "max_quantity", Number(e.target.value))
                          }
                          className="h-8 w-12 text-sm px-1"
                        />
                      </div>
                      <Input
                        value={val.sku_reference || ""}
                        onChange={(e) => updateValue(gIdx, vIdx, "sku_reference", e.target.value)}
                        placeholder="SKU (opcional)"
                        className="h-8 w-24 text-sm shrink-0"
                      />
                      <button
                        onClick={() => removeValue(gIdx, vIdx)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        disabled={group.values.length === 1}
                        title="Remover opção"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addValue(gIdx)}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <Plus className="size-3.5 mr-1" />
                  Adicionar opção
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addGroup} className="w-full border-dashed">
            <Plus className="size-4 mr-2" />
            Adicionar Grupo de Opções
          </Button>
        </>
      )}

      {groups.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Salvar Opções
          </Button>
        </div>
      )}
    </div>
  );
}
