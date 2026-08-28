import { createFileRoute, useNavigate, Link, isRedirect } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
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
  Printer,
  Barcode,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { getActiveRegister, processPOSSale } from "@/services/cash.functions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import {
  ProductModifiersModal,
  type SelectedModifier,
} from "@/components/pos/product-modifiers-modal";
import { listPriceTables, type PriceTableDTO } from "@/services/price-tables.functions";

export const Route = createFileRoute("/workspace/pdv/")({
  head: () => ({ meta: [{ title: "Frente de Caixa (PDV) Pro | Wider" }] }),
  loader: async () => {
    const activeRegister = await getActiveRegister();
    if (!activeRegister) {
      throw new Error("CAIXA_FECHADO");
    }

    if (activeRegister.isExpired) {
      throw new Error("CAIXA_EXPIRADO");
    }

    const [catalog, priceTables] = await Promise.all([
      listAdminProducts().catch(() => []),
      listPriceTables().catch(() => []),
    ]);

    return { activeRegister, catalog: catalog || [], priceTables: priceTables || [] };
  },
  errorComponent: ({ error }) => {
    if (isRedirect(error)) {
      throw error;
    }
    if ((error instanceof Error ? error.message : String(error)) === "CAIXA_FECHADO") {
      return (
        <div className="flex h-[80vh] items-center justify-center p-4 bg-muted/20">
          <div className="w-full max-w-md text-center p-8 bg-card rounded-2xl border border-border">
            <MonitorPause className="size-16 text-foreground mb-4 opacity-50 mx-auto" />
            <h2 className="text-2xl font-black mb-2">Caixa Fechado</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Para operar a frente de caixa, você precisa abrir o seu turno e informar o troco inicial.
            </p>
            <Button size="lg" className="w-full text-sm font-bold rounded-xl" asChild>
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
          <div className="w-full max-w-md text-center bg-card border border-destructive p-8 rounded-2xl">
            <MonitorPause className="size-16 text-destructive mb-4 mx-auto" />
            <h2 className="text-2xl font-black text-foreground mb-2">Turno Expirado</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Seu caixa está aberto há mais de 24 horas. Por favor, feche o turno atual para continuar operando.
            </p>
            <Button
              size="lg"
              className="w-full text-sm font-bold rounded-xl"
              asChild
            >
              <Link to="/workspace/financeiro/caixa">Ir para Fechamento</Link>
            </Button>
          </div>
        </div>
      );
    }
    return <div className="p-6 text-sm text-destructive">Erro no PDV: {error instanceof Error ? error.message : String(error)}</div>;
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
  const { activeRegister, catalog, priceTables } = Route.useLoaderData() as any;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [modifiersModalOpen, setModifiersModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<any | null>(null);

  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<{
    product: any;
    variant: any;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tabelas de Preço & Cliente
  const defaultTable = (priceTables || []).find((t: any) => t.is_default) || (priceTables || [])[0];
  const [selectedTableId, setSelectedTableId] = useState<string>(defaultTable?.id || "default");
  const [customerDoc, setCustomerDoc] = useState("");

  const activeTable = useMemo(() => {
    return (priceTables || []).find((t: any) => t.id === selectedTableId) || defaultTable;
  }, [priceTables, selectedTableId, defaultTable]);

  // Função para calcular o preço ajustado de acordo com a tabela
  const calculateTablePrice = (baseCents: number) => {
    if (!activeTable) return baseCents;
    if (activeTable.adjustment_type === "percentage_discount") {
      const discount = (baseCents * Number(activeTable.adjustment_value || 0)) / 100;
      return Math.max(0, Math.round(baseCents - discount));
    }
    if (activeTable.adjustment_type === "percentage_markup") {
      const markup = (baseCents * Number(activeTable.adjustment_value || 0)) / 100;
      return Math.round(baseCents + markup);
    }
    return baseCents;
  };

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card" | "open_tab">("cash");
  const [tableIdentifier, setTableIdentifier] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");

  const flatProducts = useMemo(() => {
    const flat: any[] = [];
    catalog.forEach((p: any) => {
      const variants = p.product_variants || p.variants || [];
      if (variants.length > 0) {
        variants.forEach((v: any) => {
          flat.push({ product: p, variant: v });
        });
      } else {
        flat.push({
          product: p,
          variant: { id: p.id, sku: p.sku || p.slug, price_override_cents: p.price_cents },
        });
      }
    });
    return flat;
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return flatProducts;
    const q = searchQuery.toLowerCase();
    return flatProducts.filter(
      (p) =>
        p.product.title.toLowerCase().includes(q) ||
        (p.variant.sku && p.variant.sku.toLowerCase().includes(q)),
    );
  }, [flatProducts, searchQuery]);

  const handleProductClick = (product: any, variant: any) => {
    const hasModifiers =
      Array.isArray(product.option_groups) && product.option_groups.length > 0;
    if (hasModifiers) {
      setSelectedItemForModifiers({ product, variant });
      setModifiersModalOpen(true);
    } else {
      handleConfirmModifiers(product, variant, []);
    }
  };

  const handleConfirmModifiers = (
    product: any,
    variant: any,
    selectedModifiers: SelectedModifier[],
    notes?: string,
  ) => {
    const rawPrice = variant.price_override_cents ?? product.price_cents ?? 0;
    const basePrice = calculateTablePrice(rawPrice);
    const modifiersDelta = selectedModifiers.reduce((acc, m) => acc + m.priceDeltaCents, 0);
    const unitPriceCents = basePrice + modifiersDelta;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.variant.id === variant.id && !notes && selectedModifiers.length === 0,
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].qty += 1;
        return updated;
      }
      return [
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
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
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

  // ── Atalhos Globais de Teclado ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Foca na busca de produtos
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F4: Abre o checkout / cobrança
      if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          setCheckoutOpen((prev) => !prev);
        } else {
          toast.error("Adicione produtos ao ticket antes de cobrar.");
        }
        return;
      }

      // ESC: Fecha modais abertos
      if (e.key === "Escape") {
        if (checkoutOpen) {
          setCheckoutOpen(false);
          e.preventDefault();
        }
        if (modifiersModalOpen) {
          setModifiersModalOpen(false);
          e.preventDefault();
        }
        return;
      }

      // Enter no checkout aberto: Processa a venda
      if (e.key === "Enter" && checkoutOpen && !isProcessing) {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checkoutOpen, cart, isProcessing, modifiersModalOpen]);

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
        return {
          variantId: item.product.id,
          title: `${item.product.title}${modifiersSuffix}`,
          sku: item.variant?.sku || item.product.slug || "DEFAULT",
          qty: item.qty,
          priceCents: item.unitPriceCents,
        };
      });

      const res = await processPOSSale({
        data: {
          registerId: activeRegister?.id || "00000000-0000-0000-0000-000000000001",
          items: itemsPayload,
          paymentMethod: paymentMethod as any,
          discountCents: discountCents,
          amountPaidCents: paymentMethod === "cash" ? amountPaidCents : cartTotal,
          customerName: customerDoc.trim() || undefined,
        },
      });

      toast.success("Venda finalizada com sucesso!");

      // Salva dados para emissão do cupom
      setLastSaleReceipt({
        saleId: res?.receiptId || res?.orderId || Math.random().toString(36).slice(2, 8).toUpperCase(),
        items: cart,
        subtotal: cartSubtotal,
        discount: discountCents,
        total: cartTotal,
        paymentMethod,
        amountPaid: amountPaidCents,
        change: changeCents,
        date: new Date().toISOString(),
      });

      // Limpa estados do PDV
      setCart([]);
      setDiscountInput("");
      setAmountPaidInput("");
      setTableIdentifier("");
      setCustomerDoc("");
      setCheckoutOpen(false);
      setReceiptModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar venda no PDV");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Componente de Ticket / Carrinho Lateral
  const CartPanel = () => (
    <div className="flex flex-col h-full bg-card border-l border-border/70">
      <div className="p-4 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Ticket Atual</h2>
        </div>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCart([])}
            className="h-7 text-xs text-destructive hover:bg-destructive/10"
          >
            Limpar
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {cart.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground space-y-2">
            <ShoppingCart className="size-10 opacity-30 mx-auto" />
            <p className="text-xs font-medium">Nenhum item adicionado</p>
            <p className="text-[11px] opacity-70">Pressione [F2] para buscar produtos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 truncate">
                    <span className="font-bold text-foreground">{item.product.title}</span>
                    {item.variant.sku && item.variant.sku !== "DEFAULT" && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {item.variant.sku}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-foreground">
                    {formatMoney(item.unitPriceCents * item.qty)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-lg"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-7 text-center font-bold font-mono">{item.qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-lg"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border/70 space-y-3 bg-muted/20">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">{formatMoney(cartSubtotal)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Desconto</span>
              <span className="font-mono">-{formatMoney(discountCents)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-black text-foreground pt-1 border-t border-border/40">
            <span>Total</span>
            <span className="font-mono">{formatMoney(cartTotal)}</span>
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => setCheckoutOpen(true)}
          disabled={cart.length === 0}
          className="w-full h-12 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-2 cursor-pointer"
        >
          <CreditCard className="size-4" />
          <span>Cobrar [F4]</span>
          <span className="font-mono ml-auto">{formatMoney(cartTotal)}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Coluna Esquerda: Catálogo & Busca */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior do PDV */}
        <div className="p-4 border-b border-border/70 flex items-center justify-between gap-4 bg-card">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou código de barras... [F2]"
                className="pl-9 h-10 text-xs rounded-xl bg-background"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono gap-1 px-3 py-1">
              <span>Turno:</span>
              <strong className="text-emerald-500 font-bold">Aberto</strong>
            </Badge>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold h-9"
            >
              <Link to="/workspace/financeiro/caixa">Gerenciar Turno</Link>
            </Button>
          </div>
        </div>

        {/* Grade de Produtos */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(({ product, variant }) => {
              const rawPrice = variant.price_override_cents ?? product.price_cents ?? 0;
              const displayPrice = calculateTablePrice(rawPrice);

              return (
                <div
                  key={`${product.id}-${variant.id || "def"}`}
                  onClick={() => handleProductClick(product, variant)}
                  className="p-3 rounded-2xl bg-card border border-border/70 hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs text-foreground line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                    {variant.sku && variant.sku !== "DEFAULT" && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {variant.sku}
                      </p>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-3">
                    <span className="font-black text-sm text-foreground">
                      {formatMoney(displayPrice)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 rounded-lg opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground space-y-2">
                <Search className="size-10 opacity-20 mx-auto" />
                <p className="text-sm font-medium">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Coluna Direita: Ticket (Desktop) */}
      <div className="hidden md:flex w-80 lg:w-96 flex-col h-full shrink-0">
        <CartPanel />
      </div>

      {/* Drawer Móvel de Ticket */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        {cart.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="w-full h-14 rounded-2xl flex items-center justify-between px-6 bg-primary text-primary-foreground font-bold active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  <span>Ticket ({cart.length})</span>
                </div>
                <span className="text-base font-mono">{formatMoney(cartTotal)}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-3xl">
              <CartPanel />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* ── Modal de Cobrança / Finalização ── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="h-[80vh] sm:max-w-xl mx-auto rounded-t-3xl p-6 overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-xl font-black text-foreground">
              Finalizar Venda
            </SheetTitle>
            <SheetDescription className="text-xs">
              Selecione o método de pagamento e confirme para registrar no caixa.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-4">
            {/* Resumo Financeiro */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Total a Cobrar</span>
                <div className="text-2xl font-black text-foreground font-mono">
                  {formatMoney(cartTotal)}
                </div>
              </div>
              {discountCents > 0 && (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {formatMoney(discountCents)} OFF
                </Badge>
              )}
            </div>

            {/* Formas de Pagamento */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "cash", label: "Dinheiro", Icon: Banknote },
                  { id: "pix", label: "PIX", Icon: QrCode },
                  { id: "card", label: "Cartão", Icon: CreditCard },
                  { id: "open_tab", label: "Comanda", Icon: Receipt },
                ].map(({ id, label, Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant={paymentMethod === id ? "default" : "outline"}
                    onClick={() => setPaymentMethod(id as any)}
                    className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-bold"
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Dinheiro: Troco */}
            {paymentMethod === "cash" && (
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/30 border border-border/40">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Valor Recebido (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder={(cartTotal / 100).toFixed(2)}
                    className="h-10 text-xs font-mono rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Troco Calculado</Label>
                  <div className="h-10 px-3 rounded-xl bg-background border border-border flex items-center font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {formatMoney(changeCents)}
                  </div>
                </div>
              </div>
            )}

            {/* Comanda */}
            {paymentMethod === "open_tab" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Identificação da Comanda (Mesa ou Cliente)</Label>
                <Input
                  value={tableIdentifier}
                  onChange={(e) => setTableIdentifier(e.target.value)}
                  placeholder="Ex: Mesa 05 ou João Silva"
                  className="h-10 text-xs rounded-xl"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              className="rounded-xl flex-1 text-xs font-bold h-12"
            >
              Cancelar [ESC]
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="rounded-xl flex-2 font-bold text-xs h-12 gap-2"
            >
              {isProcessing ? "Registrando Venda..." : "Confirmar Venda [Enter]"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Modal de Impressão de Cupom Térmico (58mm / 80mm) ── */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-md sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span>Venda Registrada com Sucesso!</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja imprimir o cupom térmico não fiscal para o cliente?
            </DialogDescription>
          </DialogHeader>

          {lastSaleReceipt && (
            <div className="p-4 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-[11px] space-y-2 border border-zinc-800">
              <div className="text-center pb-2 border-b border-zinc-800 space-y-0.5">
                <p className="font-bold text-xs uppercase">CUPOM NÃO FISCAL</p>
                <p className="opacity-70 text-[10px]">{formatDateTime(lastSaleReceipt.date)}</p>
                <p className="opacity-70 text-[10px]">Venda #{lastSaleReceipt.saleId}</p>
              </div>

              <div className="space-y-1 py-1">
                {lastSaleReceipt.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-2">
                      {item.qty}x {item.product.title}
                    </span>
                    <span>{formatMoney(item.unitPriceCents * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-1">
                <div className="flex justify-between opacity-80">
                  <span>Subtotal:</span>
                  <span>{formatMoney(lastSaleReceipt.subtotal)}</span>
                </div>
                {lastSaleReceipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto:</span>
                    <span>-{formatMoney(lastSaleReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-zinc-800">
                  <span>TOTAL:</span>
                  <span>{formatMoney(lastSaleReceipt.total)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReceiptModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Fechar
            </Button>
            <Button
              onClick={handlePrintReceipt}
              className="rounded-xl font-bold text-xs gap-1.5"
            >
              <Printer className="size-3.5" />
              <span>Imprimir Cupom (58/80mm)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Modificadores */}
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
