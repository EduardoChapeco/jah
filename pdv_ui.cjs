const fs = require('fs');

const pdvCode = `import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ShoppingCart, Search, CreditCard, Banknote, QrCode, MonitorPause, X, Plus, Minus, Receipt, AlertCircle } from "lucide-react";
import { getActiveRegister } from "@/services/cash.functions";
import { processPdvSale } from "@/services/pdv.functions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";

export const Route = createFileRoute("/workspace/pdv/")({
  head: () => ({ meta: [{ title: "Frente de Caixa (PDV)" }] }),
  loader: async () => {
    const activeRegister = await getActiveRegister();
    if (!activeRegister) {
      throw new Error("CAIXA_FECHADO");
    }
    
    // The backend now natively returns isExpired, but we can also double check or rely on it
    if (activeRegister.isExpired) {
      throw new Error("CAIXA_EXPIRADO");
    }

    const catalog = await listAdminProducts();
    return { activeRegister, catalog };
  },
  errorComponent: ({ error }) => {
    if (error.message === "CAIXA_FECHADO") {
      return (
        <div className="flex h-[80vh] items-center justify-center p-4 bg-muted/20">
          <Surface variant="zine" elevation="hard" className="w-full max-w-md text-center">
            <MonitorPause className="mx-auto size-16 text-ink mb-4 opacity-50" />
            <h2 className="text-2xl font-black font-display mb-2">Caixa Fechado</h2>
            <p className="text-muted-foreground mb-6 font-sans">
              Para operar a frente de caixa, você precisa abrir o seu turno e informar o troco inicial.
            </p>
            <Button size="lg" className="w-full text-base font-bold" asChild>
              <Link to="/workspace/financeiro/caixa">Abrir Turno de Caixa</Link>
            </Button>
          </Surface>
        </div>
      );
    }
    if (error.message === "CAIXA_EXPIRADO" || error.message.includes("CAIXA_EXPIRADO")) {
      return (
        <div className="flex h-[80vh] items-center justify-center p-4 bg-muted/20">
          <Surface variant="flyer" elevation="hard" className="w-full max-w-md text-center bg-destructive border-ink">
            <MonitorPause className="mx-auto size-16 text-white mb-4" />
            <h2 className="text-2xl font-black font-display text-white mb-2">Turno Expirado</h2>
            <p className="text-white/80 mb-6 font-sans normal-case">
              Seu caixa está aberto há mais de 24 horas. Por favor, feche o turno atual para continuar operando.
            </p>
            <Button size="lg" variant="secondary" className="w-full text-base font-bold border-2 border-ink" asChild>
              <Link to="/workspace/financeiro/caixa">Ir para Fechamento</Link>
            </Button>
          </Surface>
        </div>
      );
    }
    return <div>Erro no PDV: {error.message}</div>;
  },
  component: PdvTerminal,
});

function PdvTerminal() {
  const { activeRegister, catalog } = Route.useLoaderData();
  const [cart, setCart] = useState<Array<{ id: string, product: any, variant: any, qty: number }>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash"|"pix"|"card"|"open_tab">("cash");
  const [tableIdentifier, setTableIdentifier] = useState("");

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
      p => p.product.title.toLowerCase().includes(q) || p.variant.sku.toLowerCase().includes(q)
    );
  }, [flatProducts, searchQuery]);

  const addToCart = (product: any, variant: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.variant.sku === variant.sku);
      if (existing) {
        return prev.map(item => item.variant.sku === variant.sku ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: crypto.randomUUID(), product, variant, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + ((item.variant.price_override_cents ?? item.product.price_cents) * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "open_tab" && !tableIdentifier.trim()) {
      toast.error("Informe o número da mesa ou nome do cliente para a comanda.");
      return;
    }

    setIsProcessing(true);
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        variantSku: item.variant.sku,
        qty: item.qty,
        unitPriceCents: item.variant.price_override_cents ?? item.product.price_cents,
        title: item.product.title + (item.variant.sku !== 'DEFAULT' ? \` (\${item.variant.sku})\` : '')
      }));

      const result = await processPdvSale({
        data: {
          items: itemsPayload as any,
          paymentMethod,
          tableIdentifier: paymentMethod === "open_tab" ? tableIdentifier : undefined,
        }
      });

      // Show specific toast if negative stock happened
      if (result && (result as any).hasNegativeStock) {
         toast.success(
           <div className="flex flex-col gap-1">
             <span className="font-bold text-base">Venda Concluída!</span>
             <span className="text-sm opacity-90">⚠️ Atenção: Itens com estoque negativo precisam de reposição ("Em Aberto").</span>
           </div>,
           { duration: 6000 }
         );
      } else {
         toast.success(paymentMethod === "open_tab" ? "Comanda aberta!" : "Venda concluída com sucesso!");
      }

      setCart([]);
      setTableIdentifier("");
      setCheckoutModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar venda.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-muted/20">
      
      {/* Left: Product Grid & Search */}
      <div className="flex-1 flex flex-col h-full border-r-4 border-ink">
        <div className="p-4 bg-paper border-b-4 border-ink flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              autoFocus
              className="pl-10 h-12 text-lg shadow-hard bg-background border-2 border-ink"
              placeholder="Buscar por produto ou código de barras (SKU)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="default" className="h-12 border-2 border-ink shadow-hard" asChild>
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
                <Surface 
                  key={\`\${item.product.id}-\${item.variant.sku}-\${idx}\`}
                  variant="default"
                  elevation="hard"
                  padding="none"
                  className={\`cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 \${isOutOfStock ? 'opacity-80' : ''}\`}
                  onClick={() => addToCart(item.product, item.variant)}
                >
                  <div className="aspect-square bg-muted/50 w-full relative overflow-hidden border-b-2 border-ink">
                    {item.product.product_media?.[0]?.url ? (
                      <img src={item.product.product_media[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <ShoppingCart className="h-10 w-10" />
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
                        <Badge variant="destructive" className="shadow-hard border-2 border-ink rotate-[-5deg] text-xs py-1 px-2 uppercase tracking-widest font-black">
                          Em Falta
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-paper flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm leading-tight line-clamp-2 text-ink">{item.product.title}</h3>
                      {item.variant.sku !== 'DEFAULT' && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate font-mono">{item.variant.sku}</p>
                      )}
                    </div>
                    <div className="font-black font-display text-primary mt-2 text-lg">
                      {formatMoney(item.variant.price_override_cents ?? item.product.price_cents)}
                    </div>
                  </div>
                </Surface>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p className="font-medium text-lg">Nenhum produto encontrado.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart (Ticket) */}
      <div className="w-full md:w-[400px] flex flex-col h-full bg-paper z-10 relative">
        <div className="p-4 border-b-4 border-ink flex items-center justify-between bg-primary text-primary-foreground">
          <h2 className="font-display font-black text-xl flex items-center gap-2 uppercase tracking-widest">
            Ticket
          </h2>
          <Badge variant="outline" className="bg-background/20 text-white border-white/30 text-xs">
            Turno #{activeRegister.id.slice(0, 6)}
          </Badge>
        </div>

        <ScrollArea className="flex-1 p-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center mt-20 opacity-40">
              <Receipt className="h-20 w-20 text-ink mb-4" />
              <p className="text-ink font-bold uppercase tracking-wider font-display">Sem Lançamentos</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3">
              {cart.map((item) => (
                <Surface key={item.id} variant="ticket" padding="sm" elevation="none" className="bg-background/50">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="font-bold text-sm leading-tight flex-1">
                      {item.product.title}
                      {item.variant.sku !== 'DEFAULT' && <span className="block text-[10px] font-mono mt-0.5 opacity-70">{item.variant.sku}</span>}
                    </span>
                    <span className="font-black text-sm">{formatMoney((item.variant.price_override_cents ?? item.product.price_cents) * item.qty)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border-2 border-ink rounded-none bg-background overflow-hidden">
                      <button className="px-2 py-1 hover:bg-muted active:bg-muted/80 transition-colors" onClick={() => updateQty(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold font-mono w-8 text-center border-x-2 border-ink py-1 bg-muted/20">{item.qty}</span>
                      <button className="px-2 py-1 hover:bg-muted active:bg-muted/80 transition-colors" onClick={() => updateQty(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button className="p-1.5 text-destructive hover:bg-destructive/10 border-2 border-transparent hover:border-destructive/30 rounded-full transition-all" onClick={() => removeItem(item.id)}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals & Checkout Button */}
        <div className="p-6 border-t-4 border-ink bg-paper pb-safe">
          <div className="flex justify-between items-end mb-6">
            <span className="text-ink font-bold uppercase tracking-widest text-sm">Total</span>
            <span className="text-4xl font-black font-display text-primary leading-none tracking-tight">
              {formatMoney(cartTotal)}
            </span>
          </div>
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-black uppercase tracking-widest border-4 border-ink shadow-hard hover:translate-y-0.5 hover:shadow-sm transition-all" 
            disabled={cart.length === 0}
            onClick={() => setCheckoutModalOpen(true)}
          >
            Cobrar
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-4 border-ink shadow-hard rounded-none">
          <div className="p-6 bg-paper border-b-4 border-ink text-center">
            <h2 className="font-display font-black text-2xl uppercase tracking-widest">Finalizar Ticket</h2>
            <div className="text-5xl font-black text-primary mt-4 tracking-tighter">{formatMoney(cartTotal)}</div>
          </div>
          
          <div className="p-6 flex flex-col gap-6 bg-background">
            <div className="space-y-4">
              <Label className="text-xs uppercase tracking-widest font-black text-ink">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button"
                  variant={paymentMethod === 'cash' ? "default" : "outline"}
                  className={\`h-16 flex flex-col gap-1 border-2 border-ink rounded-none \${paymentMethod === 'cash' ? 'shadow-hard -translate-y-1' : ''}\`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-5 w-5" />
                  Dinheiro
                </Button>
                <Button 
                  type="button"
                  variant={paymentMethod === 'pix' ? "default" : "outline"}
                  className={\`h-16 flex flex-col gap-1 border-2 border-ink rounded-none \${paymentMethod === 'pix' ? 'shadow-hard -translate-y-1' : ''}\`}
                  onClick={() => setPaymentMethod('pix')}
                >
                  <QrCode className="h-5 w-5" />
                  PIX
                </Button>
                <Button 
                  type="button"
                  variant={paymentMethod === 'card' ? "default" : "outline"}
                  className={\`h-16 flex flex-col gap-1 border-2 border-ink rounded-none \${paymentMethod === 'card' ? 'shadow-hard -translate-y-1' : ''}\`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-5 w-5" />
                  Cartão
                </Button>
                <Button 
                  type="button"
                  variant={paymentMethod === 'open_tab' ? "default" : "outline"}
                  className={\`h-16 flex flex-col gap-1 border-2 border-ink rounded-none \${paymentMethod === 'open_tab' ? 'bg-amber-400 text-ink shadow-hard -translate-y-1 hover:bg-amber-500' : 'hover:bg-amber-400/10'}\`}
                  onClick={() => setPaymentMethod('open_tab')}
                >
                  <Receipt className="h-5 w-5" />
                  Comanda
                </Button>
              </div>
            </div>

            {paymentMethod === 'open_tab' && (
              <Surface variant="yellow-pages" padding="sm" className="space-y-2 mt-2">
                <Label htmlFor="table-id" className="font-bold uppercase tracking-wider text-xs">Identificação (Mesa/Nome)</Label>
                <Input 
                  id="table-id" 
                  autoFocus
                  placeholder="Ex: Mesa 04, Cliente João" 
                  value={tableIdentifier}
                  onChange={e => setTableIdentifier(e.target.value)}
                  className="bg-white border-2 border-ink font-sans shadow-none rounded-none"
                />
              </Surface>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-2 border-ink rounded-none" onClick={() => setCheckoutModalOpen(false)}>Cancelar</Button>
              <Button size="lg" className="flex-1 border-2 border-ink shadow-hard rounded-none font-bold uppercase tracking-wider" onClick={handleCheckout} disabled={isProcessing}>
                {isProcessing ? "Processando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;

fs.writeFileSync('src/routes/workspace.pdv.index.tsx', pdvCode);
console.log('PDV UI Refactored!');
