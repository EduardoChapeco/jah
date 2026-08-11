import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCart,
  removeFromCart,
  updateCartItemQty,
  applyCouponToCart,
  updateCartShipping,
} from "@/services/cart.functions";
import { calculateShipping } from "@/services/shipping.functions";
import { Trash2, Plus, Minus, ArrowRight, Ticket, Truck, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/state/states";
import { PageSkeleton } from "@/components/state/loading";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";

export const Route = createFileRoute("/_store/carrinho")({
  head: () => ({ meta: [{ title: "Meu Carrinho" }] }),
  loader: async () => {
    const cart = await getCart();
    return cart ? [cart] : [];
  },
  pendingComponent: PageSkeleton,
  component: StoreCartPage,
});

function StoreCartPage() {
  const carts = Route.useLoaderData();
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    (carts && carts.length > 0 && carts[0] && carts[0].storeId) ? carts[0].storeId : null
  );

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromCart({ data: { itemId } });
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover do carrinho.");
    }
  };

  const handleUpdateQty = async (variantId: string, delta: number) => {
    try {
      await updateCartItemQty({ data: { variantId, delta } });
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Estoque insuficiente ou erro de validação.");
    }
  };

  const selectedCart = carts?.find((c: any) => c.storeId === selectedStoreId);

  return (
    <div className="container max-w-6xl py-12 mx-auto px-4">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">Meu Carrinho</h1>

      {!carts || carts.length === 0 ? (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Explore nossa coleção e encontre o seu próximo par de calçados favorito."
          action={
            <Button onClick={() => router.navigate({ to: "/mercado" })}>
              Continuar Comprando
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Coluna Esquerda: Listagem de Lojas e Itens */}
          <div className="lg:col-span-2 space-y-12">
            {carts.map((cart: any) => (
              <div key={cart.id} className="border-b pb-12 last:border-0">
                <div 
                  className="flex items-center justify-between cursor-pointer group mb-6"
                  onClick={() => setSelectedStoreId(cart.storeId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-6 items-center justify-center rounded-full border shadow-sm transition-colors",
                      selectedStoreId === cart.storeId 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground/30 text-transparent group-hover:border-primary/50"
                    )}>
                      <CheckCircle2 className="size-4" />
                    </div>
                    <h2 className="text-xl font-bold">Loja {cart.storeId?.split('-')[0]}</h2>
                  </div>
                </div>

                <div className={cn("space-y-6", selectedStoreId !== cart.storeId && "opacity-60")}>
                  {cart.items.map((item: any) => (
                    <div key={item.id} className="flex gap-6 py-6 border-b last:border-0">
                      <div className="h-32 w-24 flex-shrink-0 overflow-hidden rounded-md border border-muted bg-muted">
                        {item.coverUrl ? (
                          <img
                            src={item.coverUrl}
                            alt={item.productTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-secondary" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between">
                          <div>
                            <h3
                              className={cn(
                                "font-semibold text-base",
                                item.isOutOfStock && "text-destructive line-through",
                              )}
                            >
                              {item.productTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {Object.entries(item.variantAttributes || {}).length > 0
                                ? Object.entries(item.variantAttributes || {})
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" | ")
                                : "Padrão"}
                            </p>
                            {item.isOutOfStock && (
                              <p className="text-xs font-bold text-destructive mt-1 bg-destructive/10 inline-block px-2 py-0.5 rounded-full">
                                Sem estoque disponível
                              </p>
                            )}
                          </div>
                          <p
                            className={cn(
                              "font-medium text-base",
                              item.isOutOfStock && "opacity-50 line-through",
                            )}
                          >
                            {formatMoney(item.priceCents)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => handleUpdateQty(item.variantId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.qty}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => handleUpdateQty(item.variantId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Coluna Direita: Resumo Fixo (Apenas da loja selecionada) */}
          <div className="lg:col-span-1">
            <Surface variant="zine" elevation="sm" className="bg-muted/50 p-6 h-fit sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Resumo da Compra</h2>

              {!selectedCart ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Selecione uma loja para ver o resumo.
                </div>
              ) : (
                <>
                  <div className="space-y-4 text-sm mb-6 border-b pb-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({selectedCart.itemCount} itens)</span>
                      <span className="font-medium">{formatMoney(selectedCart.subtotalCents)}</span>
                    </div>

                    {selectedCart.couponCode && (
                      <div className="flex justify-between text-success">
                        <span className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" /> Cupom ({selectedCart.couponCode})
                        </span>
                        <span className="font-medium">-{formatMoney(selectedCart.discountCents)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end mb-8">
                    <span className="font-semibold text-lg">Total estimado</span>
                    <span className="font-bold text-2xl tracking-tight">
                      {formatMoney(selectedCart.totalCents - selectedCart.shippingCents)}
                    </span>
                  </div>

                  {selectedCart.items.some((i: any) => i.isOutOfStock) ? (
                    <Button size="lg" className="w-full font-semibold rounded-full" disabled>
                      Remova itens sem estoque
                    </Button>
                  ) : (
                    <Link to="/checkout" search={{ store: selectedCart.storeId }} className="w-full block">
                      <Button size="lg" className="w-full font-semibold rounded-full shadow-md">
                        Pagar Loja {selectedCart.storeId?.split('-')[0]}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </Surface>
          </div>
        </div>
      )}
    </div>
  );
}
