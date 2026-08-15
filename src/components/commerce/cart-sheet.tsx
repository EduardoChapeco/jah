import { Link, useRouter } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartContext } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./price-display";
import { Surface } from "@/components/ui/surface";

export function CartSheet() {
  const { globalCarts, isCartOpen, setIsCartOpen, updateQty, removeItem, isCartUpdating } =
    useCartContext();
  const router = useRouter();

  const handleNavigateToCheckoutHub = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    router.navigate({ to: "/checkout" });
  };

  const handleNavigateToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    router.navigate({ to: "/mercado" });
  };

  const totalItemCount = globalCarts.reduce((acc, c) => acc + c.itemCount, 0);
  const globalTotalCents = globalCarts.reduce(
    (acc, c) => acc + (c.totalCents - c.shippingCents),
    0,
  );

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border "
      >
        <SheetHeader className="px-6 py-4 border-b border-border bg-secondary">
          <SheetTitle className="flex items-center gap-2 font-semibold text-foreground text-2xl">
            <ShoppingBag className="size-6 text-foreground" strokeWidth={3} />
            Meu Carrinho
            {totalItemCount > 0 && (
              <span className="ml-2 rounded-xl border border-border bg-primary text-primary-foreground px-2 py-0.5 text-badge">
                {totalItemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-background">
          {globalCarts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="size-24 rounded-full border border-border bg-muted/30 flex items-center justify-center text-foreground mb-4">
                <ShoppingBag className="size-10" strokeWidth={2.5} />
              </div>
              <h3 className="font-semibold text-2xl text-foreground">Sua sacola está vazia</h3>
              <p className="font-sans text-muted-foreground text-foreground/80 mb-4">
                Que tal explorar as lojas da comunidade?
              </p>
              <Button
                onClick={handleNavigateToCatalog}
                className="bg-primary text-primary-foreground border border-border rounded-xl font-semibold px-8"
              >
                Ver Lojas
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {globalCarts.map((storeCart, idx) => (
                <Surface
                  key={storeCart.id}
                  variant="default"
                  className="overflow-hidden border border-border "
                >
                  <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center gap-3">
                    {storeCart.storeLogoUrl ? (
                      <img
                        src={storeCart.storeLogoUrl}
                        alt={storeCart.storeName}
                        className="size-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="size-8 rounded-full border border-border bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground">
                        {storeCart.storeName?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="eyebrow text-foreground leading-none">Pacote {idx + 1}</h4>
                      <p className="text-meta text-foreground/80 mt-0.5">{storeCart.storeName}</p>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-4 bg-background">
                    {storeCart.items.map((item: any) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex gap-3",
                          isCartUpdating && "opacity-60 pointer-events-none",
                        )}
                      >
                        <div className="size-20 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
                          {item.coverUrl ? (
                            <img
                              src={item.coverUrl}
                              alt={item.productTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between items-start">
                            <div className="pr-2">
                              <h4 className="text-nav text-foreground line-clamp-2 leading-tight">
                                {item.productTitle}
                              </h4>
                              <p className="text-meta text-foreground/60 mt-1">
                                {Object.entries(item.variantAttributes || {}).length > 0
                                  ? Object.entries(item.variantAttributes || {})
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(" | ")
                                  : "Padrão"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-foreground/60 hover:text-primary transition-colors"
                              aria-label="Remover item"
                            >
                              <X className="size-5" strokeWidth={2.5} />
                            </button>
                          </div>

                          <div className="mt-auto flex items-end justify-between pt-2">
                            <div className="flex items-center border border-border bg-muted/30">
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => updateQty(item.variantId, -1)}
                                disabled={item.qty <= 1}
                              >
                                <Minus className="size-3" strokeWidth={3} />
                              </button>
                              <span className="w-8 text-center text-sm font-bold font-mono text-foreground bg-background py-0.5 border-x border-border">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => updateQty(item.variantId, 1)}
                                disabled={item.isOutOfStock}
                              >
                                <Plus className="size-3" strokeWidth={3} />
                              </button>
                            </div>
                            <div className="text-right">
                              <PriceDisplay
                                amountCents={item.priceCents}
                                size="sm"
                                className="text-foreground font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </div>

        {globalCarts.length > 0 && (
          <div className="border-t border-border bg-secondary p-6 z-10 relative">
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-foreground text-xl">
                  <span>Total Geral</span>
                  <span className="text-primary text-2xl font-black">
                    {formatMoney(globalTotalCents)}
                  </span>
                </div>
                <p className="text-meta text-foreground/70">
                  * O frete será calculado separadamente no caixa.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 bg-primary text-primary-foreground border border-border font-semibold text-xl rounded-xl"
                onClick={handleNavigateToCheckoutHub}
                disabled={isCartUpdating}
              >
                Ir para o Caixa
                <ArrowRight className="ml-2 size-6" strokeWidth={3} />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
