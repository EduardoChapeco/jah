import { createFileRoute, useNavigate, Link, isRedirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  CreditCard,
  Banknote,
  QrCode,
  MonitorPause,
  X,
  Plus,
  Minus,
  Receipt,
  Percent,
  Utensils,
} from "lucide-react";
import { getActiveRegister, processPOSSale } from "@/services/cash.functions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import {
  ProductModifiersModal,
  type SelectedModifier,
} from "@/components/pos/product-modifiers-modal";

export const Route = createFileRoute("/workspace/pdv/")({
  head: () => ({ meta: [{ title: "Frente de Caixa (PDV)" }] }),
  loader: async () => {
    const activeRegister = await getActiveRegister();
    if (!activeRegister) {
      throw new Error("CAIXA_FECHADO");
    }

    if (activeRegister.isExpired) {
      throw new Error("CAIXA_EXPIRADO");
    }

    const catalog = await listAdminProducts();
    return { activeRegister, catalog };
  },
  errorComponent: ({ error }) => {
    if (isRedirect(error)) {
      throw error;
    }
    if ((error instanceof Error ? error.message : String(error)) === "CAIXA_FECHADO") {
      return (
        <div className="flex h-[80vh] items-center justify-center p-4 bg-muted/20">
          <div className="w-full max-w-md text-center p-8  bg-card rounded-xl ">
            <MonitorPause className="size-16 text-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-black mb-2">Caixa Fechado</h2>
            <p className="text-muted-foreground mb-6 font-sans">
              Para operar a frente de caixa, você precisa abrir o seu turno e informar o troco
              inicial.
            </p>
            <Button size="lg" className="w-full text-base font-bold" asChild>
              <Link to="/workspace/financeiro/caixa">Abrir Turno de Caixa</Link>
            </Button>
          </div>
        </div>
      );
    }
    if (
      (error instanceof Error ? error.message : String(error)) === "CAIXA_EXPIRADO" ||
      (error instanceof Error ? error.message : String(error)).includes("CAIXA_EXPIRADO")
    ) {
      return (
        <div className="flex h-[80vh] items-center justify-center p-4 bg-muted/20">
          <div className="w-full max-w-md text-center bg-destructive border-border p-8 rounded-xl ">
            <MonitorPause className="size-16 text-white mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Turno Expirado</h2>
            <p className="text-white/80 mb-6 font-sans normal-case">
              Seu caixa está aberto há mais de 24 horas. Por favor, feche o turno atual para
              continuar operando.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="w-full text-base font-bold "
              asChild
            >
              <Link to="/workspace/financeiro/caixa">Ir para Fechamento</Link>
            </Button>
          </div>
        </div>
      );
    }
    return <div>Erro no PDV: {error instanceof Error ? error.message : String(error)}</div>;
  },
  component: PdvTerminal,
});

interface CartItem {
  id: string;
  product: any;
  variant: any;
  qty: number;
  selectedModifiers: SelectedModifier[];
  notes?: string;
  unitPriceCents: number;
}

function PdvTerminal() {
  const { activeRegister, catalog } = Route.useLoaderData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [modifiersModalOpen, setModifiersModalOpen] = useState(false);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<{
    product: any;
    variant: any;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card" | "open_tab">("cash");
  const [tableIdentifier, setTableIdentifier] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");

  const flatProducts = useMemo(() => {
    const flat: any[] = [];
    catalog.forEach((p: any) => {
      const variants = p.product_variants || p.variants || [];
      variants.forEach((v: any) => {
        flat.push({ product: p, variant: v });
      });
    });
    return flat;
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return flatProducts;
    const q = searchQuery.toLowerCase();
    return flatProducts.filter(
      (p) => p.product.title.toLowerCase().includes(q) || p.variant.sku.toLowerCase().includes(q),
    );
  }, [flatProducts, searchQuery]);

  const handleProductClick = (product: any, variant: any) => {
    setSelectedItemForModifiers({ product, variant });
    setModifiersModalOpen(true);
  };

  const handleConfirmModifiers = (
    product: any,
    variant: any,
    selectedModifiers: SelectedModifier[],
    notes?: string,
  ) => {
    const basePrice = variant.price_override_cents ?? product.price_cents ?? 0;
    const modifiersDelta = selectedModifiers.reduce((acc, m) => acc + m.priceDeltaCents, 0);
    const unitPriceCents = basePrice + modifiersDelta;

    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product,
        variant,
        qty: 1,
        selectedModifiers,
        notes,
        unitPriceCents,
      },
    ]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.unitPriceCents * item.qty, 0);
  const discountCents = useMemo(() => {
    const val = parseFloat(discountInput.replace(",", "."));
    return isNaN(val) ? 0 : Math.round(val * 100);
  }, [discountInput]);
  const cartTotal = Math.max(0, cartSubtotal - discountCents);
  const amountPaidCents = useMemo(() => {
    const val = parseFloat(amountPaidInput.replace(",", "."));
    return isNaN(val) ? cartTotal : Math.round(val * 100);
  }, [amountPaidInput, cartTotal]);
  const changeCents = paymentMethod === "cash" ? Math.max(0, amountPaidCents - cartTotal) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "open_tab" && !tableIdentifier.trim()) {
      toast.error("Informe o número da mesa ou nome do cliente para a comanda.");
      return;
    }

    setIsProcessing(true);
    try {
      const itemsPayload = cart.map((item) => {
        const modifiersSuffix =
          item.selectedModifiers.length > 0
            ? ` (${item.selectedModifiers.map((m) => m.title).join(", ")})`
            : "";
        const notesSuffix = item.notes ? ` [Obs: ${item.notes}]` : "";

        return {
          variantId: item.variant.id,
          qty: item.qty,
          priceCents: item.unitPriceCents,
          title: `${item.product.title}${modifiersSuffix}${notesSuffix}`,
          sku: item.variant.sku,
        };
      });

      const result = await processPOSSale({
        data: {
          registerId: activeRegister.id,
          items: itemsPayload,
          paymentMethod: paymentMethod === "open_tab" ? "other" : (paymentMethod as any),
          customerName: paymentMethod === "open_tab" ? tableIdentifier : undefined,
          discountCents,
          amountPaidCents: paymentMethod === "cash" ? amountPaidCents : cartTotal,
        },
      });

      if (result && result.hasNegativeStock) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-base">Venda Concluída!</span>
            <span className="text-sm opacity-90">
              ⚠️ Atenção: Itens com estoque negativo precisam de reposição.
            </span>
          </div>,
          { duration: 6000 },
        );
      } else {
        toast.success(
          paymentMethod === "open_tab" ? "Comanda aberta!" : "Venda concluída com sucesso!",
        );
      }

      setCart([]);
      setTableIdentifier("");
      setDiscountInput("");
      setAmountPaidInput("");
      setCheckoutOpen(false);
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao processar venda.");
    } finally {
      setIsProcessing(false);
    }
  };

  const CartPanel = () => (
    <>
      <div className="p-4  flex items-center justify-between bg-primary text-primary-foreground">
        <h2 className="font-semibold text-xl flex items-center gap-2">Ticket</h2>
        <Badge variant="outline" className="bg-background/20 text-white border-white/30 text-xs">
          Turno #{activeRegister.id.slice(0, 6)}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center mt-20 opacity-40">
            <Receipt className="h-20 w-20 text-foreground mb-4" />
            <p className="text-foreground font-bold">Sem Lançamentos</p>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-muted/30  rounded-xl space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1 flex-1">
                    <span className="font-bold text-sm leading-tight block">
                      {item.product.title}
                      {item.variant.sku !== "DEFAULT" && (
                        <span className="text-[10px] font-mono ml-1.5 opacity-70">
                          ({item.variant.sku})
                        </span>
                      )}
                    </span>

                    {/* Lista de Modificadores / Adicionais */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.selectedModifiers.map((mod, mIdx) => (
                          <Badge
                            key={`${mod.modifierId}-${mIdx}`}
                            variant="outline"
                            className="text-[9px] py-0 px-1.5 h-4 bg-background font-normal"
                          >
                            + {mod.title}
                            {mod.priceDeltaCents > 0 && ` (+${formatMoney(mod.priceDeltaCents)})`}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Observação da Cozinha */}
                    {item.notes && (
                      <p className="text-[11px] text-muted-foreground italic bg-background/60 px-2 py-0.5 rounded  inline-block">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>

                  <span className="font-semibold text-sm font-mono shrink-0">
                    {formatMoney(item.unitPriceCents * item.qty)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 ">
                  <div className="flex items-center  rounded-lg bg-background overflow-hidden">
                    <button
                      className="px-2 py-1 hover:bg-muted active:bg-muted/80 transition-colors"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-semibold w-8 text-center border-x border-border py-1 bg-muted/20">
                      {item.qty}
                    </span>
                    <button
                      className="px-2 py-1 hover:bg-muted active:bg-muted/80 transition-colors"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className="p-1.5 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 rounded-full transition-all"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals & Checkout Button */}
      <div className="p-5  bg-surface-paper pb-safe">
        <div className="flex justify-between items-end mb-4">
          <span className="text-foreground font-bold text-sm">Total</span>
          <span className="text-3xl font-semibold text-primary tracking-tight">
            {formatMoney(cartTotal)}
          </span>
        </div>
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold  hover:translate-y-0.5 transition-all"
          disabled={cart.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          Cobrar
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-muted/20">
      {/* Left: Product Grid & Search */}
      <div className="flex-1 flex flex-col h-full  pb-16 md:pb-0">
        <div className="p-4 bg-background  flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              className="pl-10 h-12 text-lg bg-background "
              placeholder="Buscar por produto ou código de barras (SKU)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="default" className="h-12  " asChild>
            <Link to="/workspace/pdv/comandas">
              <Receipt className="mr-2 h-5 w-5" />
              Comandas
            </Link>
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredProducts.map((item, idx) => {
              const isOutOfStock = item.variant.stock_on_hand <= 0;
              return (
                <div
                  key={`${item.product.id}-${item.variant.sku}-${idx}`}
                  className={`flex flex-col  bg-surface-paper  rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover: active:scale-[0.98] ${isOutOfStock ? "opacity-60 grayscale-[0.5]" : ""}`}
                  onClick={() => handleProductClick(item.product, item.variant)}
                >
                  <div className="aspect-square bg-muted/50 w-full relative overflow-hidden border-b-2 border-border">
                    {item.product.product_media?.[0]?.url ? (
                      <img
                        src={item.product.product_media[0].url}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <ShoppingCart className="h-10 w-10" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
                        <Badge
                          variant="destructive"
                          className=" text-xs py-1 px-2 font-bold"
                        >
                          Em Falta
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-background flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm leading-tight line-clamp-2 text-foreground">
                        {item.product.title}
                      </h3>
                      {item.variant.sku !== "DEFAULT" && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate font-mono">
                          {item.variant.sku}
                        </p>
                      )}
                    </div>
                    <div className="font-black text-primary mt-2 text-lg">
                      {formatMoney(item.variant.price_override_cents ?? item.product.price_cents)}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                <Search className="h-12 w-12 opacity-20 mb-4" />
                <p className="font-medium text-lg">Nenhum produto encontrado.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart (Ticket) - DESKTOP */}
      <div className="hidden md:flex w-[400px] flex-col h-full bg-surface-paper z-10 relative ">
        <CartPanel />
      </div>

      {/* Floating Cart Button & Mobile Sheet */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        {cart.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="w-full h-14 rounded-full  flex items-center justify-between px-6 bg-primary text-primary-foreground font-bold hover:translate-y-0 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Ver Ticket ({cart.length})</span>
                </div>
                <span className="text-lg">{formatMoney(cartTotal)}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[85vh] p-0 flex flex-col bg-surface-paper rounded-t-[2rem] "
            >
              <CartPanel />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Checkout — Sheet 75% altura, conforme AGENTS.md §7 */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent
          side="bottom"
          className="h-[78vh] bg-background  rounded-t-[2rem] px-6 py-8 overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-3xl font-semibold tracking-tight text-foreground">
              Finalizar Ticket
            </SheetTitle>
            <SheetDescription className="text-foreground/60 text-sm">
              Total a cobrar:{""}
              <strong className="text-foreground text-xl font-semibold">
                {formatMoney(cartTotal)}
              </strong>
              {discountCents > 0 && (
                <span className="text-success font-medium ml-3 text-sm">
                  ({formatMoney(discountCents)} de desconto)
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Desconto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Percent className="size-3" /> Desconto (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="h-10 text-base font-semibold"
                />
              </div>
              {paymentMethod === "cash" && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Valor Entregue (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={(cartTotal / 100).toFixed(2)}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="h-10 text-base font-semibold"
                  />
                  {changeCents > 0 && (
                    <p className="text-success font-medium text-sm mt-1">
                      Troco: {formatMoney(changeCents)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "cash", label: "Dinheiro", Icon: Banknote },
                    { id: "pix", label: "PIX", Icon: QrCode },
                    { id: "card", label: "Cartão", Icon: CreditCard },
                    { id: "open_tab", label: "Comanda", Icon: Receipt },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant={paymentMethod === id ? "default" : "outline"}
                    className={`h-14 flex flex-col gap-1  rounded-xl ${paymentMethod === id ? "bg-primary text-primary-foreground" : "bg-card"}`}
                    onClick={() => setPaymentMethod(id)}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Identificacao para comanda */}
            {paymentMethod === "open_tab" && (
              <div className="space-y-2">
                <Label htmlFor="table-id" className="font-medium text-sm text-foreground">
                  Identificação (Mesa/Nome)
                </Label>
                <Input
                  id="table-id"
                  autoFocus
                  placeholder="Ex: Mesa 04, Cliente João"
                  value={tableIdentifier}
                  onChange={(e) => setTableIdentifier(e.target.value)}
                  className="bg-background  font-sans shadow-none rounded-none h-12"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1  rounded-none h-14 font-mono"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="lg"
                className="flex-1  rounded-none font-bold h-14 text-lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Confirmar Venda"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Modificadores e Adicionais */}
      {selectedItemForModifiers && (
        <ProductModifiersModal
          open={modifiersModalOpen}
          onOpenChange={setModifiersModalOpen}
          product={selectedItemForModifiers.product}
          variant={selectedItemForModifiers.variant}
          onConfirm={handleConfirmModifiers}
        />
      )}
    </div>
  );
}
