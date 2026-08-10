import { Link, useRouter } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartContext } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./price-display";

export function SlideOutCart() {
  const { globalCarts, isCartOpen, setIsCartOpen, updateQty, removeItem, isCartUpdating } =
    useCartContext();
  const router = useRouter();

  const handleNavigateToCheckoutHub = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    router.navigate({ to: "/checkout-hub" });
  };

  const handleNavigateToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    router.navigate({ to: "/mercado" });
  };

  const totalItemCount = globalCarts.reduce((acc, c) => acc + c.itemCount, 0);
  const globalTotalCents = globalCarts.reduce((acc, c) => acc + (c.totalCents - c.shippingCents), 0);

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Meu Carrinho
            {totalItemCount > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                {totalItemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {globalCarts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="size-8" />
              </div>
              <h3 className="text-lg font-medium">Sua sacola está vazia</h3>
              <p className="text-sm text-muted-foreground">
                Que tal explorar as lojas da comunidade?
              </p>
              <Button onClick={handleNavigateToCatalog} className="mt-4">
                Ver Lojas
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {globalCarts.map((storeCart, idx) => (
                <div key={storeCart.id} className="bg-card border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-muted px-4 py-2 border-b flex items-center gap-3">
                    {storeCart.storeLogoUrl ? (
                      <img src={storeCart.storeLogoUrl} alt={storeCart.storeName} className="size-6 rounded-full object-cover" />
                    ) : (
                      <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {storeCart.storeName?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-none">Pacote {idx + 1}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{storeCart.storeName}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4">
                    {storeCart.items.map((item: any) => (
                      <div
                        key={item.id}
                        className={cn("flex gap-3", isCartUpdating && "opacity-60 pointer-events-none")}
                      >
                        <div className="size-16 flex-shrink-0 overflow-hidden rounded-md bg-secondary border">
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
                              <h4 className="text-sm font-medium line-clamp-2 leading-tight">{item.productTitle}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
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
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Remover item"
                            >
                              <X className="size-4" />
                            </button>
                          </div>

                          <div className="mt-auto flex items-end justify-between pt-2">
                            <div className="flex items-center rounded-md border shadow-sm">
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted"
                                onClick={() => updateQty(item.variantId, -1)}
                                disabled={item.qty <= 1}
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-medium">{item.qty}</span>
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:bg-muted"
                                onClick={() => updateQty(item.variantId, 1)}
                                disabled={item.isOutOfStock}
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>
                            <div className="text-right">
                              <PriceDisplay amountCents={item.priceCents} size="sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {globalCarts.length > 0 && (
          <div className="border-t bg-background p-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10 relative">
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Total Geral</span>
                  <span className="text-primary text-xl">
                    {formatMoney(globalTotalCents)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">* O frete será calculado separadamente no caixa para cada pacote.</p>
              </div>
              
              <Button 
                size="lg" 
                className="w-full h-12 text-base font-bold shadow-md"
                onClick={handleNavigateToCheckoutHub}
                disabled={isCartUpdating}
              >
                Ir para o Caixa
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

