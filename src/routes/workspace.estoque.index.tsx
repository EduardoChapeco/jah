import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Boxes,
  PackageCheck,
  Clock,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  History,
  ArrowRightLeft,
  Truck,
  ShieldAlert,
  SlidersHorizontal,
  Box,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/state/states";
import { getStockLevels, adjustStock } from "@/services/stock.functions";
import { StockAuditDialog } from "@/components/admin/stock-audit-dialog";

export const Route = createFileRoute("/workspace/estoque/")({
  head: () => ({ meta: [{ title: "Estoque Operacional" }] }),
  loader: async () => {
    const res = await getStockLevels({ data: {} }).catch(() => []);
    return res || [];
  },
  component: AdminStockPage,
});

function AdminStockPage() {
  const initialStock = Route.useLoaderData();
  const router = useRouter();
  const [stock, setStock] = useState<any[]>(initialStock);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal Movement State
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [movementType, setMovementType] = useState<
    "purchase" | "adjustment" | "damage" | "transfer" | "return"
  >("purchase");
  const [qtyInput, setQtyInput] = useState<string>("1");
  const [noteInput, setNoteInput] = useState<string>("");

  // Metrics summary
  const metrics = useMemo(() => {
    const totalSKUs = stock.length;
    let totalOnHand = 0;
    let criticalCount = 0;
    let negativeCount = 0;

    for (const v of stock) {
      const onHand = v.stock_on_hand ?? 0;
      totalOnHand += onHand;
      if (onHand <= 5) criticalCount++;
      if (onHand < 0) negativeCount++;
    }

    return {
      totalSKUs,
      totalOnHand,
      totalAvailable: Math.max(0, totalOnHand),
      criticalCount,
      negativeCount,
    };
  }, [stock]);

  // Filter stock rows by search & tab
  const filteredStock = useMemo(() => {
    return stock.filter((v) => {
      const available = v.stock_on_hand ?? 0;
      const matchesSearch =
        v.sku.toLowerCase().includes(search.toLowerCase()) ||
        (v.products?.title || "").toLowerCase().includes(search.toLowerCase());

      let matchesTab = true;
      if (statusTab === "available") matchesTab = available > 5;
      else if (statusTab === "critical") matchesTab = available > 0 && available <= 5;
      else if (statusTab === "out_of_stock") matchesTab = available <= 0;

      return matchesSearch && matchesTab;
    });
  }, [stock, search, statusTab]);

  // Open Dialog for line operation
  const handleOpenMovementModal = (variant: any, defaultType: any = "purchase") => {
    setSelectedVariant(variant);
    setMovementType(defaultType);
    setQtyInput("1");
    setNoteInput("");
  };

  // Submit Movement to server RPC adjust_stock
  const handleExecuteMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || isUpdating) return;

    const parsedQty = parseInt(qtyInput, 10);
    if (isNaN(parsedQty) || parsedQty === 0) {
      toast.error("Informe uma quantidade válida diferente de zero.");
      return;
    }

    if ((movementType === "damage" || movementType === "transfer") && !noteInput.trim()) {
      toast.error("Justificativa é obrigatória para perdas/avarias e transferências.");
      return;
    }

    // Determine final signed qty for RPC (negative for damage/output)
    const finalQty = movementType === "damage" ? -Math.abs(parsedQty) : parsedQty;

    setIsUpdating(true);
    try {
      const res = await adjustStock({
        data: {
          variantId: selectedVariant.id,
          qty: finalQty,
          movementType,
          note: noteInput || `Movimentação ${movementType}`,
        },
      });

      if (res) {
        toast.success("Movimentação registrada com sucesso no banco de dados.");
        setSelectedVariant(null);

        // Optimistic update
        setStock((prev) =>
          prev.map((v) => {
            if (v.id === selectedVariant.id) {
              return {
                ...v,
                stock_on_hand: Math.max(0, (v.stock_on_hand ?? 0) + finalQty),
              };
            }
            return v;
          }),
        );
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao atualizar estoque.");
      }
    } catch (e: unknown) {
      toast.error("Erro inesperado ao registrar estoque.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operação Comercial"
        title="Estoque Operacional"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/workspace/estoque/alertas">
                <AlertTriangle className="mr-1.5 size-4 text-warning" />
                Alertas ({metrics.criticalCount})
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/workspace/estoque/movimentos">
                <History className="mr-1.5 size-4" />
                Histórico de Movimentos
              </Link>
            </Button>
          </div>
        }
      />

      {/* Grid de KPIs de Estoque */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden  bg-surface-paper  rounded-xl p-0">
          <div className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
            <h4 className="text-xs font-semibold text-muted-foreground">Total de SKUs</h4>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Boxes className="size-4" aria-hidden />
            </div>
          </div>
          <div className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{metrics.totalSKUs}</div>
            <p className="text-xs text-muted-foreground mt-1">Variações cadastradas</p>
          </div>
        </div>

        <div className="relative overflow-hidden  bg-surface-paper  rounded-xl p-0">
          <div className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
            <h4 className="text-xs font-semibold text-muted-foreground">Estoque em Mãos</h4>
            <div className="flex size-8 items-center justify-center rounded-full bg-success/15 text-success">
              <PackageCheck className="size-4" aria-hidden />
            </div>
          </div>
          <div className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{metrics.totalOnHand} un.</div>
            <p className="text-xs text-muted-foreground mt-1">Físico em depósito</p>
          </div>
        </div>

        <div className="relative overflow-hidden  bg-surface-paper  rounded-xl p-0">
          <div className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
            <h4 className="text-xs font-semibold text-muted-foreground">Estoque Crítico</h4>
            <div className="flex size-8 items-center justify-center rounded-full bg-warning/15 text-warning-foreground">
              <ShieldAlert className="size-4" aria-hidden />
            </div>
          </div>
          <div className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{metrics.criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">SKUs com 5 un. ou menos</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filtros por Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3  bg-card rounded-2xl px-4 py-3 ">
        <Tabs
          defaultValue="all"
          value={statusTab}
          onValueChange={setStatusTab}
        >
          <TabsList className="grid grid-cols-4 w-[360px] h-8">
            <TabsTrigger value="all" className="text-xs">
              Todos ({stock.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="text-xs">
              Regular ({stock.filter((v) => (v.stock_on_hand ?? 0) > 5).length})
            </TabsTrigger>
            <TabsTrigger value="critical" className="text-xs">
              Crítico ({metrics.criticalCount})
            </TabsTrigger>
            <TabsTrigger value="out_of_stock" className="text-xs">
              Esgotado ({stock.filter((v) => (v.stock_on_hand ?? 0) <= 0).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar por SKU ou Nome do Produto..."
            className="pl-8 text-xs w-full rounded-xl h-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Estoque */}
      {stock.length === 0 ? (
        <EmptyState title="Sem variações cadastradas" />
      ) : (
        <div className=" bg-surface-paper  rounded-xl overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Em Mãos (Disponível)</TableHead>
                <TableHead className="text-center">Nível</TableHead>
                <TableHead className="text-center">Operar Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((variant) => {
                const onHand = variant.stock_on_hand ?? 0;
                const available = Math.max(0, onHand);

                return (
                  <TableRow key={variant.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold">{variant.sku}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {variant.products?.title || "Produto sem título"}
                        </span>
                        {variant.products?.status !== "published" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-bold text-sm">{available}</TableCell>

                    <TableCell className="text-center">
                      {available <= 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Esgotado
                        </Badge>
                      ) : available <= 5 ? (
                        <Badge variant="warning" className="text-[10px]">
                          Crítico
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px]">
                          Regular
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleOpenMovementModal(variant, "purchase")}
                        >
                          <Plus className="size-3.5 mr-1" /> Entrada
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenMovementModal(variant, "damage")}
                        >
                          <Minus className="size-3.5 mr-1" /> Avaria
                        </Button>
                        <StockAuditDialog variant={variant} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                    Nenhum SKU encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet / Dialog de Movimentação por Linha */}
      <Sheet
        open={Boolean(selectedVariant)}
        onOpenChange={(open) => !open && setSelectedVariant(null)}
      >
        <SheetContent className="max-w-md">
          <SheetHeader>
            <SheetTitle>Movimentação de Estoque</SheetTitle>
            <SheetDescription>
              SKU: <strong className="font-mono text-foreground">{selectedVariant?.sku}</strong> (
              {selectedVariant?.products?.title})
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleExecuteMovement} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select value={movementType} onValueChange={(val: any) => setMovementType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Entrada por Compra (Fornecedor)</SelectItem>
                  <SelectItem value="adjustment">Ajuste Manual de Inventário</SelectItem>
                  <SelectItem value="damage">Perda / Avaria (Saída Físico)</SelectItem>
                  <SelectItem value="transfer">Transferência entre Filiais</SelectItem>
                  <SelectItem value="return">Devolução de Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {movementType === "damage"
                  ? "A quantidade será deduzida automaticamente do saldo em mãos."
                  : "A quantidade será adicionada ao saldo em mãos."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Justificativa / Observação{""}
                {(movementType === "damage" || movementType === "transfer") && "*"}
              </Label>
              <Input
                placeholder="Ex: Nota fiscal 4092, caixa avariada no frete..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                required={movementType === "damage" || movementType === "transfer"}
              />
            </div>

            <SheetFooter className="pt-4 mt-8">
              <Button type="button" variant="outline" onClick={() => setSelectedVariant(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Gravando..." : "Confirmar Movimentação"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
