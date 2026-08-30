import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Eye,
  Edit3,
  Archive,
  CheckCircle2,
  FileText,
  Trash2,
  Download,
  Package,
  Filter,
  Layers,
  Palette,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Surface } from "@/components/ui/surface";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/state/states";
import {
  listAdminProducts,
  duplicateProduct,
  toggleProductStatus,
  bulkUpdateProductStatus,
  updateProduct,
} from "@/services/admin-catalog.functions";
import { getStoreSettings } from "@/services/store.functions";
import { getNicheSemantics } from "@/lib/niche-semantics";
import { getNicheCatalogContext } from "@/lib/catalog-niche-context";
import { formatMoney } from "@/lib/money";
import type { AdminProductRow } from "@/types/catalog";

export const Route = createFileRoute("/workspace/catalogo/produtos/")({
  head: () => ({ meta: [{ title: "Catálogo & Itens | Workspace Wider" }] }),
  loader: async () => {
    const [products, store] = await Promise.all([
      listAdminProducts().catch(() => []),
      getStoreSettings().catch(() => null),
    ]);
    return {
      products: products || [],
      store: store || null,
    };
  },
  component: AdminProductsPage,
});

function EditablePriceCell({
  productId,
  initialCents,
  onSave,
}: {
  productId: string;
  initialCents: number;
  onSave: (val: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [centsVal, setCentsVal] = useState<number | undefined>(initialCents);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    const finalCents = centsVal ?? initialCents;
    if (finalCents >= 0) {
      const ok = await onSave(finalCents);
      if (ok) {
        setEditing(false);
      } else {
        setCentsVal(initialCents);
      }
    } else {
      setCentsVal(initialCents);
    }
    setIsSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-28">
        <CurrencyField
          compact
          autoFocus
          value={centsVal}
          onChange={(c) => setCentsVal(c)}
          onEnter={save}
          onBlur={save}
          disabled={isSaving}
          className="h-7 text-xs font-mono font-bold"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        setCentsVal(initialCents);
        setEditing(true);
      }}
      className="font-bold text-sm text-foreground cursor-text hover:bg-muted/50 p-1 rounded -ml-1 transition-colors border border-transparent hover:border-border"
      title="Clique para editar com máscara"
    >
      {formatMoney(initialCents)}
    </div>
  );
}

function EditableStockCell({
  productId,
  initialStock,
  onSave,
}: {
  productId: string;
  initialStock: number;
  onSave: (val: number) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(initialStock ?? 0));
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    const qty = parseInt(val, 10);
    if (!isNaN(qty) && qty >= 0) {
      const ok = await onSave(qty);
      if (ok) {
        setEditing(false);
      } else {
        setVal(String(initialStock ?? 0));
      }
    } else {
      setVal(String(initialStock ?? 0));
    }
    setIsSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-20">
        <Input
          type="number"
          min={0}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setVal(String(initialStock ?? 0));
              setEditing(false);
            }
          }}
          onBlur={save}
          disabled={isSaving}
          className="h-7 text-xs font-mono font-bold"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="font-mono text-xs cursor-text hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-border inline-flex items-center gap-1"
      title="Clique para editar estoque"
    >
      <span className={initialStock > 0 ? "text-foreground font-semibold" : "text-destructive font-bold"}>
        {initialStock ?? 0} un
      </span>
    </div>
  );
}

function AdminProductsPage() {
  const { products: initialProducts, store } = Route.useLoaderData();
  const semantics = getNicheSemantics(store);
  const nicheCtx = getNicheCatalogContext(
    (store as any)?.segment || (store as any)?.type || store?.settings?.segment
  );

  const [products, setProducts] = useState<AdminProductRow[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Filter products by search & status tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "active" ? p.status !== "archived" : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Handle Select All
  const isAllSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Action: Duplicate Single
  const handleDuplicate = async (productId: string) => {
    setIsProcessing(true);
    const res = await duplicateProduct({ data: { productId } });
    setIsProcessing(false);

    if (res.status === "success" && res.data) {
      toast.success(`${nicheCtx.entityName} duplicado com sucesso em modo Rascunho!`);
      const reloaded = await listAdminProducts();
      if (reloaded) setProducts(reloaded);
    } else {
      toast.error((res as any).message || `Erro ao duplicar ${nicheCtx.entityName.toLowerCase()}.`);
    }
  };

  // Action: Edit Price Inline
  const handleUpdatePrice = async (productId: string, price_cents: number) => {
    const res = await updateProduct({ data: { id: productId, price_cents } });
    if (res?.id) {
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, price_cents } : p)));
      toast.success("Preço atualizado!");
      return true;
    }
    toast.error("Erro ao atualizar preço.");
    return false;
  };

  // Action: Edit Stock Inline
  const handleUpdateStock = async (productId: string, stock: number) => {
    try {
      const res = await updateProduct({
        data: {
          id: productId,
          variants: [
            {
              stock: stock,
            },
          ],
        },
      });
      if (res?.id) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock } : p)));
        toast.success("Estoque atualizado!");
        return true;
      }
      toast.error("Erro ao atualizar estoque.");
      return false;
    } catch {
      toast.error("Erro ao atualizar estoque.");
      return false;
    }
  };

  // Action: Toggle Status
  const handleToggleStatus = async (productId: string, newStatus: string) => {
    const res = await toggleProductStatus({ data: { productId, status: newStatus as "published" | "draft" | "archived" } });
    if (res?.id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus as any } : p)),
      );
      toast.success("Status atualizado!");
    } else {
      toast.error("Erro ao alterar status.");
    }
  };

  // Action: Bulk Status Update
  const handleBulkAction = async (newStatus: "published" | "draft" | "archived" | "delete") => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    const res = await bulkUpdateProductStatus({ data: { productIds: selectedIds, action: newStatus } });
    setIsProcessing(false);

    if (res && res.count >= 0) {
      toast.success(`Ação concluída em ${selectedIds.length} item(ns).`);
      if (newStatus === "delete") {
        setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      } else {
        setProducts((prev) =>
          prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: newStatus } : p)),
        );
      }
      setSelectedIds([]);
    } else {
      toast.error("Erro ao executar ação em lote.");
    }
  };

  // Action: Export JSON
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredProducts, null, 2),
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `catalogo_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Catálogo exportado em arquivo JSON.");
  };

  const ProductActionsMenu = ({ product }: { product: AdminProductRow }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ações do item">
          <MoreVertical className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Ações Comerciais</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to={`/workspace/catalogo/produtos/${product.id}` as never}>
            <Edit3 className="size-3.5 mr-2" />
            Editar {nicheCtx.entityName}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/produto/${product.slug}` as never} target="_blank">
            <Eye className="size-3.5 mr-2" />
            Ver na Loja
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate(product.id)}>
          <Copy className="size-3.5 mr-2" />
          Duplicar {nicheCtx.entityName}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/workspace/estudio` as never} search={{ productId: product.id } as never}>
            <Palette className="size-3.5 mr-2 text-info" />
            Criar Post (Estúdio)
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {product.status !== "published" && (
          <DropdownMenuItem onClick={() => handleToggleStatus(product.id, "published")}>
            <CheckCircle2 className="size-3.5 mr-2 text-success" />
            Publicar na Vitrine
          </DropdownMenuItem>
        )}
        {product.status !== "draft" && (
          <DropdownMenuItem onClick={() => handleToggleStatus(product.id, "draft")}>
            <FileText className="size-3.5 mr-2 text-warning" />
            Mover para Rascunho
          </DropdownMenuItem>
        )}
        {product.status !== "archived" && (
          <DropdownMenuItem onClick={() => handleToggleStatus(product.id, "archived")}>
            <Archive className="size-3.5 mr-2" />
            Arquivar {nicheCtx.entityName}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title={semantics.catalogTitle}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON} className="rounded-xl font-bold text-xs gap-1.5 ">
              <Download className="size-3.5" aria-hidden />
              Exportar
            </Button>
            <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground ">
              <Link to="/workspace/catalogo/produtos/novo">
                <Plus className="size-3.5" aria-hidden />
                {semantics.newItemAction}
              </Link>
            </Button>
          </div>
        }
      />

      {/* Toolbar & Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl px-4 py-3">
        <Tabs
          defaultValue="active"
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <TabsList className="flex overflow-x-auto no-scrollbar h-8">
            <TabsTrigger value="active" className="text-xs shrink-0">
              Ativos ({products.filter((p) => p.status !== "archived").length})
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs shrink-0">
              Publicados ({products.filter((p) => p.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs shrink-0">
              Rascunhos ({products.filter((p) => p.status === "draft").length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs shrink-0">
              Arquivo Morto ({products.filter((p) => p.status === "archived").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder={semantics.searchItemPlaceholder}
            className="pl-8 text-xs w-full rounded-xl h-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Barra Flutuante de Ações em Lote */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-primary/30 bg-primary/10 dark:bg-primary/20 rounded-xl animate-in fade-in-50 gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Badge variant="default" className="font-bold">
              {selectedIds.length}
            </Badge>
            <span>{semantics.itemSingular.toLowerCase()}(s) selecionado(s)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("published")}
            >
              <CheckCircle2 className="size-3.5 mr-1 text-success shrink-0" />
              Publicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("draft")}
            >
              <FileText className="size-3.5 mr-1 text-warning shrink-0" />
              Rascunho
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("archived")}
            >
              <Archive className="size-3.5 mr-1 text-muted-foreground shrink-0" />
              Arquivar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs flex-1 sm:flex-none justify-center"
              disabled={isProcessing}
              onClick={() => handleBulkAction("delete")}
            >
              <Trash2 className="size-3.5 mr-1 shrink-0" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Tabela de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border-0 bg-card/60 space-y-4">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              {statusFilter === "active"
                ? semantics.emptyCatalogText
                : `Nenhum ${semantics.itemSingular.toLowerCase()} com este filtro`}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Cadastre seus itens para exibi-los automaticamente nos canais de venda e vitrines.
            </p>
          </div>
          {statusFilter === "active" && (
            <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground ">
              <Link to="/workspace/catalogo/produtos/novo">
                <Plus className="size-4" />
                <span>{semantics.newItemAction}</span>
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <Surface
          variant="default"
          padding="none"
          className="flex flex-col  overflow-hidden"
        >
          {/* VISÃO MOBILE: Cartões (Cards) */}
          <div className="md:hidden flex flex-col divide-y divide-border bg-surface-paper">
            {filteredProducts.map((product) => {
              const cover = product.product_media?.[0]?.url;
              const isSelected = selectedIds.includes(product.id);
              const typeName = product.product_types?.name || "Padrão";

              return (
                <div
                  key={product.id}
                  className={`flex flex-col p-4 ${isSelected ? "bg-primary/5" : "bg-transparent"} transition-colors relative`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectRow(product.id)}
                        aria-label={`Selecionar ${product.title}`}
                      />
                    </div>
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="size-16 object-cover  rounded-md shrink-0"
                      />
                    ) : (
                      <div className="size-16 bg-muted  rounded-md flex items-center justify-center shrink-0">
                        <Package className="size-6 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 flex flex-col">
                      <Link
                        to={`/workspace/catalogo/produtos/${product.id}` as never}
                        className="font-semibold text-[15px] text-foreground leading-snug line-clamp-2 mb-1"
                      >
                        {product.title}
                      </Link>
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <Badge
                          variant={
                            product.status === "published"
                              ? "default"
                              : product.status === "archived"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-[10px] px-1.5 py-0 rounded-sm"
                        >
                          {product.status === "published"
                            ? "Publicado"
                            : product.status === "archived"
                              ? "Arquivado"
                              : "Rascunho"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {typeName}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center flex-wrap gap-2 pt-1">
                        <EditablePriceCell
                          productId={product.id}
                          initialCents={product.price_cents}
                          onSave={(cents) => handleUpdatePrice(product.id, cents)}
                        />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground border-l border-border/50 pl-2">
                          <span>Estoque:</span>
                          <EditableStockCell
                            productId={product.id}
                            initialStock={(product as any).stock ?? 0}
                            onSave={(stock) => handleUpdateStock(product.id, stock)}
                          />
                        </div>
                        {product.compare_at_cents ? (
                          <span className="text-[11px] text-muted-foreground line-through">
                            {formatMoney(product.compare_at_cents)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 -mt-1 -mr-1">
                      <ProductActionsMenu product={product} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISÃO DESKTOP: DataGrid / Tabela */}
          <div className="hidden md:block overflow-x-auto bg-surface-paper">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos os produtos"
                    />
                  </TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo / Marca</TableHead>
                  <TableHead>Preço de Venda</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const cover = product.product_media?.[0]?.url;
                  const isSelected = selectedIds.includes(product.id);
                  const typeName = product.product_types?.name || "Padrão";

                  return (
                    <TableRow
                      key={product.id}
                      className={`transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(product.id)}
                          aria-label={`Selecionar ${product.title}`}
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="size-11 object-cover  rounded shrink-0"
                            />
                          ) : (
                            <div className="size-11 bg-muted  rounded flex items-center justify-center shrink-0">
                              <Package className="size-5 text-muted-foreground" aria-hidden />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/workspace/catalogo/produtos/${product.id}` as never}
                              className="font-semibold text-sm text-foreground hover:underline truncate block"
                            >
                              {product.title}
                            </Link>
                            <span className="text-xs text-muted-foreground font-mono">
                              /{product.slug}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            product.status === "published"
                              ? "default"
                              : product.status === "archived"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {product.status === "published"
                            ? "Publicado"
                            : product.status === "archived"
                              ? "Arquivado"
                              : "Rascunho"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{typeName}</span>
                          {product.brand && <span className="text-[11px]">{product.brand}</span>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <EditablePriceCell
                            productId={product.id}
                            initialCents={product.price_cents}
                            onSave={(cents) => handleUpdatePrice(product.id, cents)}
                          />
                          {product.compare_at_cents ? (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatMoney(product.compare_at_cents)}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <EditableStockCell
                          productId={product.id}
                          initialStock={(product as any).stock ?? 0}
                          onSave={(stock) => handleUpdateStock(product.id, stock)}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <ProductActionsMenu product={product} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Surface>
      )}
    </div>
  );
}
