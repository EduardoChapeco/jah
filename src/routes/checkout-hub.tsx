import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getGlobalCarts } from "@/services/cart.functions";
import { getIdentityHandler } from "@/services/identity.functions";
import { PublicHeader } from "@/components/commerce/public-header";
import { PublicFooter } from "@/components/commerce/public-footer";
import { ArrowRight, ShoppingBag, ShieldCheck, Package } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { CartProvider } from "@/lib/cart-context";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";

export const Route = createFileRoute("/checkout-hub")({
  loader: async () => {
    const identity = await getIdentityHandler();
    if (!identity.customer_id && !identity.session_token) {
      throw new Error("Não autenticado");
    }

    const [globalCarts, menus, storeRes] = await Promise.all([
      getGlobalCarts().catch(() => []),
      getNavigationMenus().catch(() => []),
      getPublicStoreSettings().catch(() => null),
    ]);

    return { globalCarts, menus, store: storeRes };
  },
  component: CheckoutHubWrapper,
});

function CheckoutHubWrapper() {
  return (
    <CartProvider>
      <CheckoutHub />
    </CartProvider>
  );
}

function CheckoutHub() {
  const { globalCarts, menus, store } = Route.useLoaderData();

  const headerMenu = menus.find((m: any) => m.handle === "header")?.items || [];
  const footerMenu = menus.find((m: any) => m.handle === "footer")?.items || [];
  const storeData = store?.data || store;

  // Find the first active package to process
  const activeCartIndex = globalCarts.findIndex((c: any) => c.itemCount > 0);
  const totalGeral = globalCarts.reduce((acc: number, c: any) => acc + (c.totalCents - c.shippingCents), 0);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PublicHeader
        menu={headerMenu}
        storeName={storeData?.name || "Jah"}
        logoUrl={storeData?.logoUrl || storeData?.settings?.logoUrl}
      />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        <header className="flex flex-col items-center text-center mt-4">
          <h1 className="text-3xl font-display font-black text-ink">Caixa Principal</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Você selecionou itens de diferentes lojistas. O pagamento e o envio de cada pacote 
            serão processados separadamente.
          </p>
        </header>

        {globalCarts.length === 0 ? (
          <div className="bg-card rounded-lg border p-12 flex flex-col items-center text-center shadow-sm">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <ShoppingBag className="size-10" />
            </div>
            <h2 className="text-xl font-bold text-ink">Sua sacola está vazia</h2>
            <p className="text-muted-foreground mt-2 mb-6">
              Volte para o mercado e adicione produtos para continuar.
            </p>
            <Button asChild>
              <Link to="/mercado">Explorar Lojas</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 flex flex-col gap-6">
              {globalCarts.map((storeCart: any, idx: number) => {
                const isActive = idx === activeCartIndex;

                return (
                  <div 
                    key={storeCart.id} 
                    className={`bg-card rounded-xl border overflow-hidden transition-all ${
                      isActive ? "ring-2 ring-primary shadow-md" : "opacity-80"
                    }`}
                  >
                    <div className={`px-5 py-3 border-b flex items-center justify-between ${isActive ? 'bg-primary/5' : 'bg-muted'}`}>
                      <div className="flex items-center gap-3">
                        {storeCart.storeLogoUrl ? (
                          <img src={storeCart.storeLogoUrl} alt={storeCart.storeName} className="size-8 rounded-full object-cover" />
                        ) : (
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {storeCart.storeName?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-ink leading-tight flex items-center gap-2">
                            Pacote {idx + 1}
                            {isActive && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">Aguardando Pagamento</span>}
                          </h3>
                          <p className="text-xs text-muted-foreground">{storeCart.storeName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{formatMoney(storeCart.totalCents - storeCart.shippingCents)}</span>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col gap-4">
                      {storeCart.items.map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="size-12 rounded bg-secondary overflow-hidden shrink-0 border">
                            {item.coverUrl && <img src={item.coverUrl} alt={item.productTitle} className="size-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.productTitle}</p>
                            <p className="text-xs text-muted-foreground">{item.qty}x {formatMoney(item.priceCents)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isActive && (
                      <div className="p-5 pt-0 mt-2">
                        <Button 
                          className="w-full text-base font-bold shadow-md hover-lift"
                          size="lg"
                          asChild
                        >
                          <Link to="/$slug/checkout" params={{ slug: "loja-" + storeCart.storeId }} search={{ cartId: storeCart.id }}>
                            Pagar Pacote {idx + 1}
                            <ArrowRight className="ml-2 size-5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Summary */}
            <div className="bg-card rounded-xl border p-6 sticky top-24 shadow-sm">
              <h3 className="font-bold text-lg border-b pb-4 mb-4">Resumo Global</h3>
              <div className="flex flex-col gap-3 text-sm mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Pacotes Restantes</span>
                  <span className="font-medium text-ink">{globalCarts.length}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>Total Geral</span>
                  <span className="text-primary">{formatMoney(totalGeral)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground text-center mt-2 leading-relaxed">
                  O valor do frete e os prazos serão calculados individualmente no fechamento de cada pacote.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-xs text-muted-foreground bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  <p>Cada lojista recebe diretamente na sua própria conta Mercado Pago.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="size-4 shrink-0 text-primary" />
                  <p>O frete é cotado com a transportadora específica da loja.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <PublicFooter
        menu={footerMenu}
        storeName={storeData?.name || "Jah"}
        logoUrl={storeData?.logoUrl || storeData?.settings?.logoUrl}
      />
    </div>
  );
}
