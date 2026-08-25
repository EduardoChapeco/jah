import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  X,
  Upload,
  Sparkles,
  SlidersHorizontal,
  Eye,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Star,
  ImagePlus,
  Layers,
  Tag,
  DollarSign,
  Package,
  Boxes,
  Globe,
  HelpCircle,
  Clock,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/ui/media-uploader";
import { createProduct } from "@/services/admin-catalog.functions";
import { VariantMatrixGrid, type RawVariant } from "@/components/admin/catalog/variant-matrix-grid";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/catalogo/produtos/novo")({
  head: () => ({ meta: [{ title: "Criar Novo Produto | Workspace Wider" }] }),
  loader: async () => {
    try {
      const { getStoreSettings } = await import("@/services/store.functions");
      const { listProductTypes, listCategories, listOptionGroups } = await import(
        "@/services/admin-catalog.functions"
      );
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

  // Modo: "inpage" (Rápido com Mockup) ou "advanced" (HR Shoes Pro)
  const [editorMode, setEditorMode] = useState<"inpage" | "advanced">("inpage");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mídias
  const [images, setImages] = useState<string[]>([]);
  const [activePreviewImage, setActivePreviewImage] = useState(0);

  // Grupos de Opções / Adicionais selecionados
  const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<string[]>([]);

  // Variações e Matriz Cartesiana
  const [optionGroups, setOptionGroups] = useState<
    Array<{ id: string; name: string; values: string[] }>
  >([]);
  const [variantsMatrix, setVariantsMatrix] = useState<RawVariant[]>([]);

  // Aba móvel no modo inpage (editor ou preview)
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

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
      is_physical: true,
      weight_kg: 0.5,
      width_cm: 15,
      height_cm: 10,
      length_cm: 20,
      preparation_time_days: 1,
      meta_title: "",
      meta_description: "",
      status: "published" as "published" | "draft",
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
    if (!formValues.meta_title) {
      setValue("meta_title", val);
    }
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

      const variantsPayload =
        variantsMatrix.length > 0
          ? variantsMatrix.map((v, idx) => ({
              sku: String(v.sku || `${generatedSlug}-var-${idx + 1}`),
              attributes: (v.attributes || {}) as Record<string, unknown>,
              stock: Number(v.stock ?? 10),
              price_override_cents:
                v.price_override_cents != null && Number(v.price_override_cents) > 0
                  ? Number(v.price_override_cents)
                  : null,
              image_url: v.image_url || null,
            }))
          : [
              {
                sku: String(data.sku || `${generatedSlug}-default`),
                attributes: {},
                stock: Number(data.stock || 10),
                price_override_cents: null,
                image_url: images[0] || null,
              },
            ];

      await createProduct({
        data: {
          title: data.title,
          slug: generatedSlug,
          description: data.description || null,
          short_description: data.short_description || null,
          status: data.status || "published",
          brand: data.brand || null,
          price_cents: data.price_cents,
          compare_at_cents: data.compare_at_cents > 0 ? data.compare_at_cents : null,
          cost_cents: data.cost_cents > 0 ? data.cost_cents : null,
          type_id: data.type_id || null,
          attributes: {},
          is_physical: data.is_physical,
          weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
          width_cm: data.width_cm ? Number(data.width_cm) : null,
          height_cm: data.height_cm ? Number(data.height_cm) : null,
          length_cm: data.length_cm ? Number(data.length_cm) : null,
          preparation_time_days: data.preparation_time_days
            ? Number(data.preparation_time_days)
            : null,
          meta_title: data.meta_title || null,
          meta_description: data.meta_description || null,
          media_urls: images,
          category_ids: categoryIds,
          option_group_ids: selectedOptionGroupIds.length > 0 ? selectedOptionGroupIds : undefined,
          variants: variantsPayload,
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

  const onFormError = (formErrors: any) => {
    console.warn("[UnifiedNewProductPage] Form validation errors:", formErrors);
    const firstError = Object.values(formErrors)[0] as any;
    if (firstError?.message) {
      toast.error(String(firstError.message));
    } else {
      toast.error("Preencha o nome e o preço de venda para publicar o produto.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      {/* ── 1. Top Header com Alternância de Modo ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 ">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Link to="/workspace/catalogo/produtos">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Novo Produto</h1>
            <p className="text-xs text-muted-foreground">
              {store?.name || "Catálogo Oficial"} • Modo de Criação Rápida
            </p>
          </div>
        </div>

        {/* Botões de Ação de Topo */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditorMode(editorMode === "inpage" ? "advanced" : "inpage")}
            className="rounded-xl text-xs font-semibold gap-1.5 h-9"
          >
            {editorMode === "inpage" ? (
              <>
                <SlidersHorizontal className="size-3.5" />
                <span>Modo Avançado (Matriz Completa)</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Modo In-Page (Mockup Fiel)</span>
              </>
            )}
          </Button>

          <Button
            onClick={handleSubmit(onSubmit, onFormError)}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary text-primary-foreground  cursor-pointer"
          >
            {isSubmitting ? (
              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            <span>Publicar Produto</span>
          </Button>
        </div>
      </div>

      {/* Tabs Mobile para alternar entre formulário e prévia no modo inpage */}
      {editorMode === "inpage" && (
        <div className="flex md:hidden bg-muted/50 p-1 rounded-xl ">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileTab === "edit" ? "bg-card text-foreground " : "text-muted-foreground"
            }`}
          >
            Formulário
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileTab === "preview"
                ? "bg-card text-foreground "
                : "text-muted-foreground"
            }`}
          >
            Prévia Pública
          </button>
        </div>
      )}

      {/* ── 2. Renderização Condicional por Modo ──────────────────────────── */}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODO A: IN-PAGE VISUAL COM TRUTHFUL MOCKUP PÚBLICO (ESTILO MOBG)  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {editorMode === "inpage" ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* LADO ESQUERDO: FORMULÁRIO ERGONÔMICO (COLUNA 5/12) */}
          <div
            className={`md:col-span-5 space-y-5 ${
              mobileTab === "edit" ? "block" : "hidden md:block"
            }`}
          >
            {/* 1. Informações Básicas */}
            <div className=" bg-card rounded-2xl p-5 space-y-4 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Tag className="size-4 text-primary" />
                <span>1. Identificação do Produto</span>
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
                    placeholder="Ex: Nike, Autoral"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
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
            </div>

            {/* 2. Preço & Estoque */}
            <div className=" bg-card rounded-2xl p-5 space-y-4 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <DollarSign className="size-4 text-primary" />
                <span>2. Preço e Estoque</span>
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
                  <Label className="text-xs font-medium text-muted-foreground">Preço De / Risco</Label>
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
                    placeholder="Ex: TEN-001"
                    className="h-10 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Galeria de Fotos */}
            <div className=" bg-card rounded-2xl p-5 space-y-3 ">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <ImagePlus className="size-4 text-primary" />
                  <span>3. Fotos do Produto</span>
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
                maxFiles={6}
              />
            </div>

            {/* 4. Descrição Completa */}
            <div className=" bg-card rounded-2xl p-5 space-y-3 ">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Layers className="size-4 text-primary" />
                <span>4. Detalhes & Descrição</span>
              </div>
              <Textarea
                {...register("description")}
                rows={4}
                placeholder="Descreva as características, materiais, tamanhos e diferenciais do produto..."
                className="rounded-xl text-xs bg-background"
              />
            </div>

            {/* 5. Grupos de Adicionais & Modificadores */}
            {optionGroupsList && optionGroupsList.length > 0 && (
              <div className=" bg-card rounded-2xl p-5 space-y-3 ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <SlidersHorizontal className="size-4 text-primary" />
                    <span>5. Adicionais & Modificadores</span>
                  </div>
                  <Link
                    to="/workspace/catalogo/atributos"
                    className="text-[11px] text-primary hover:underline font-medium"
                    target="_blank"
                  >
                    Gerenciar opções
                  </Link>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selecione quais grupos de complementos (ex: ponto da carne, molhos, bordas) estarão disponíveis neste produto:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
              </div>
            )}
          </div>

          {/* LADO DIREITO: TRUTHFUL MOCKUP PÚBLICO (COLUNA 7/12 STICKY) */}
          <div
            className={`md:col-span-7 ${
              mobileTab === "preview" ? "block" : "hidden md:block"
            } md:sticky md:top-24`}
          >
            <div className=" bg-card rounded-3xl overflow-hidden ">
              {/* Header do Mockup */}
              <div className="bg-muted/40 px-5 py-3  flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Visualização Pública Fiel (Loja & Vitrine)
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Live Preview
                </Badge>
              </div>

              {/* Corpo do Mockup (Fiel à _store.produto.$slug.tsx) */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  {/* Galeria de Fotos no Mockup */}
                  <div className="space-y-3">
                    <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-muted  flex items-center justify-center">
                      {images.length > 0 ? (
                        <img
                          src={images[activePreviewImage] || images[0]}
                          alt={formValues.title || "Produto"}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground p-6 text-center">
                          <ImagePlus className="size-10 stroke-[1.5]" />
                          <p className="text-xs">Faça upload de fotos para visualizar a capa</p>
                        </div>
                      )}

                      {/* Badge de Desconto Dinâmico se houver Compare At */}
                      {formValues.compare_at_cents > formValues.price_cents && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-black/80 text-white border border-white/20">
                            {Math.round(
                              ((formValues.compare_at_cents - formValues.price_cents) /
                                formValues.compare_at_cents) *
                                100,
                            )}
                            % OFF
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePreviewImage(idx)}
                            className={`size-14 rounded-xl overflow-hidden border shrink-0 transition-all ${
                              activePreviewImage === idx
                                ? "border-primary ring-2 ring-primary/20 scale-105"
                                : "border-border opacity-70"
                            }`}
                          >
                            <img src={img} alt="Thumb" className="size-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informações Comerciais no Mockup */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        {formValues.brand || store?.name || "Loja Parceira"}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-foreground leading-tight">
                        {formValues.title || "Nome do Produto em Destaque"}
                      </h2>
                      {formValues.short_description && (
                        <p className="text-xs text-muted-foreground">
                          {formValues.short_description}
                        </p>
                      )}
                    </div>

                    {/* Bloco de Preços Fiel */}
                    <div className="p-3.5 rounded-2xl bg-muted/30  space-y-1">
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
                        Em até 12x de {formatMoney(Math.round((formValues.price_cents || 0) / 12))}{" "}
                        sem juros
                      </p>
                    </div>

                    {/* Selo de Estoque */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-muted-foreground">
                        Disponível em estoque ({formValues.stock || 1} unidades)
                      </span>
                    </div>

                    {/* Botões de Ação da Vitrine */}
                    <div className="space-y-2 pt-2">
                      <Button className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground  gap-2">
                        <ShoppingBag className="size-4" />
                        <span>Adicionar ao Carrinho</span>
                      </Button>
                      <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
                        Comprar Agora
                      </Button>
                    </div>

                    {/* Benefícios & Frete */}
                    <div className="pt-3  space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-primary" />
                        <span>Entrega rápida em Chapecó e região</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-primary" />
                        <span>Garantia de autenticidade e compra protegida</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descrição do Produto na Prévia */}
                {formValues.description && (
                  <div className="pt-4  space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Descrição do Produto
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
      ) : (
        /* ─────────────────────────────────────────────────────────────────── */
        /* MODO B: EDITOR AVANÇADO COMPLETO (HERANÇA HR SHOES PRO)             */
        /* ─────────────────────────────────────────────────────────────────── */
        <div className="space-y-8">
          {/* Seção 1: Identificação & Schema Dinâmico */}
          <Card className="rounded-3xl border-border/80  overflow-hidden">
            <CardHeader className="bg-muted/20  pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <span>1. Informações Básicas & Tipo de Produto</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Defina os metadados principais e a tipologia técnica do item
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome Comercial *</Label>
                  <Input
                    value={formValues.title}
                    onChange={handleTitleChange}
                    placeholder="Ex: Tênis Esportivo Air Runner"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Slug URL</Label>
                  <Input
                    {...register("slug")}
                    placeholder="tenis-esportivo-air-runner"
                    className="h-10 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Categoria</Label>
                  <Select
                    value={formValues.category_id}
                    onValueChange={(val) => setValue("category_id", val)}
                  >
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="Selecione categoria" />
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
                  <Label className="text-xs font-medium">Tipo de Produto (Schema)</Label>
                  <Select
                    value={formValues.type_id}
                    onValueChange={(val) => setValue("type_id", val)}
                  >
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="Padrão / Geral" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Marca</Label>
                  <Input
                    {...register("brand")}
                    placeholder="Ex: Autoral"
                    className="h-10 rounded-xl text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição Completa</Label>
                <Textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Texto rico com especificações..."
                  className="rounded-xl text-xs bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Engenharia de Preços & Margem de Lucro */}
          <Card className="rounded-3xl border-border/80  overflow-hidden">
            <CardHeader className="bg-muted/20  pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                <span>2. Precificação & Lucratividade</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Controle o preço de venda, custo e visualize a margem bruta ao vivo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Preço de Venda (R$) *</Label>
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
                  <Label className="text-xs font-medium text-muted-foreground">
                    Preço Comparativo (De/Por)
                  </Label>
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Preço de Custo (R$)
                  </Label>
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
              </div>

              {/* Bloco de Análise Financeira */}
              <div className="p-4 rounded-2xl bg-muted/30  flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Lucro Bruto Estimado
                  </span>
                  <div className="text-base font-black font-mono text-emerald-600">
                    {formatMoney(grossProfitCents)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Margem de Contribuição
                  </span>
                  <div className="text-base font-black font-mono text-foreground">
                    {marginPercent}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Galeria de Fotos */}
          <Card className="rounded-3xl border-border/80  overflow-hidden">
            <CardHeader className="bg-muted/20  pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImagePlus className="size-4 text-primary" />
                <span>3. Galeria de Mídias</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <MediaUploader
                value={images}
                onChange={setImages}
                bucket="cms-media"
                folder="products"
                maxFiles={10}
              />
            </CardContent>
          </Card>

          {/* Seção 4: Matriz Cartesiana de Variações */}
          <Card className="rounded-3xl border-border/80  overflow-hidden">
            <CardHeader className="bg-muted/20  pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="size-4 text-primary" />
                <span>4. Variações & Matriz Cartesiana (Tamanho x Cor)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Crie opções e gere automaticamente SKUs e estoques para cada combinação
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Adicione dimensões de atributos (Ex: Tamanho, Cor) com seus valores separados por vírgula.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOptionGroups((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), name: "", values: [] },
                      ]);
                    }}
                    className="h-8 text-xs font-semibold rounded-lg gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Adicionar Opção
                  </Button>
                </div>

                {optionGroups.length === 0 ? (
                  <div className="p-6 border-0/80 rounded-2xl text-center">
                    <Boxes className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Nenhuma opção customizada cadastrada. O produto será cadastrado como item único.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {optionGroups.map((grp, idx) => (
                      <div
                        key={grp.id}
                        className="p-4 rounded-2xl  bg-muted/10 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1/3">
                            <Label className="text-[11px] text-muted-foreground">Nome da Opção</Label>
                            <Input
                              placeholder="Ex: Tamanho, Cor"
                              value={grp.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOptionGroups((prev) => {
                                  const updated = [...prev];
                                  updated[idx].name = val;
                                  return updated;
                                });
                              }}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-[11px] text-muted-foreground">
                              Valores (separe por vírgula ou Enter)
                            </Label>
                            <Input
                              placeholder="Ex: P, M, G, GG"
                              value={grp.values.join(", ")}
                              onChange={(e) => {
                                const vals = e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                setOptionGroups((prev) => {
                                  const updated = [...prev];
                                  updated[idx].values = vals;
                                  return updated;
                                });
                              }}
                              className="h-8 text-xs mt-1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setOptionGroups((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="size-8 mt-5 text-destructive hover:bg-destructive/10"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const activeGroups = optionGroups.filter(
                          (g) => g.name.trim() && g.values.length > 0,
                        );
                        if (activeGroups.length === 0) {
                          setVariantsMatrix([]);
                          return;
                        }
                        const optionArrays = activeGroups.map((g) =>
                          g.values.map((v) => ({ name: g.name, value: v })),
                        );
                        const cartesian = optionArrays.reduce(
                          (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
                          [[]] as { name: string; value: string }[][],
                        );
                        const baseSku = formValues.sku || slugify(formValues.title) || "PROD";
                        const matrix: RawVariant[] = cartesian.map((combo, i) => {
                          const attrsObj: Record<string, string> = {};
                          const skuParts: string[] = [baseSku];
                          for (const item of combo) {
                            attrsObj[item.name] = item.value;
                            skuParts.push(slugify(item.value).slice(0, 4));
                          }
                          return {
                            id: crypto.randomUUID(),
                            sku: skuParts.join("-") || `${baseSku}-var-${i + 1}`,
                            attributes: attrsObj,
                            stock: formValues.stock || 10,
                            price_override_cents: null,
                            image_url: null,
                          };
                        });
                        setVariantsMatrix(matrix);
                        toast.success(`${matrix.length} variações geradas na matriz!`);
                      }}
                      className="w-full h-8 text-xs font-semibold rounded-xl"
                    >
                      <Sparkles className="size-3.5 mr-1.5" />
                      Gerar Matriz Cartesiana de Variações
                    </Button>
                  </div>
                )}
              </div>

              {variantsMatrix.length > 0 && (
                <div className="pt-4 ">
                  <VariantMatrixGrid
                    variants={variantsMatrix}
                    onChange={setVariantsMatrix}
                    basePriceCents={formValues.price_cents || 0}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção 5: Logística & Frete */}
          <Card className="rounded-3xl border-border/80  overflow-hidden">
            <CardHeader className="bg-muted/20  pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="size-4 text-primary" />
                <span>5. Dimensões & Frete</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("weight_kg")}
                    className="h-10 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Largura (cm)</Label>
                  <Input
                    type="number"
                    {...register("width_cm")}
                    className="h-10 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Altura (cm)</Label>
                  <Input
                    type="number"
                    {...register("height_cm")}
                    className="h-10 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Comprimento (cm)</Label>
                  <Input
                    type="number"
                    {...register("length_cm")}
                    className="h-10 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 6: SEO & Metadados */}
          <Card className="rounded-3xl border-border/80  overflow-hidden">
            <CardHeader className="bg-muted/20  pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <span>6. Otimização para Motores de Busca (SEO)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Meta Title</Label>
                <Input
                  {...register("meta_title")}
                  placeholder="Título para o Google..."
                  className="h-10 rounded-xl text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Meta Description</Label>
                <Textarea
                  {...register("meta_description")}
                  rows={3}
                  placeholder="Resumo que aparecerá nos resultados de busca..."
                  className="rounded-xl text-xs bg-background"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
