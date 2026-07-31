import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { listAbandonedCarts, scanAbandonedCarts, markRecoveryAttempt } from "@/services/marketing.functions";
import { Search, MessageCircle, Mail, RotateCcw, ShoppingCart } from "lucide-react";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/marketing/carrinhos")({
  head: () => ({ meta: [{ title: "Recuperação de Vendas — Jah" }] }),
  loader: async () => {
    return await listAbandonedCarts();
  },
  component: AbandonedCartsPage,
});

function AbandonedCartsPage() {
  const carts = Route.useLoaderData();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = await scanAbandonedCarts();
      toast.success(`Varredura concluída! ${result.newAbandons} novos abandonos detectados.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao varrer carrinhos.");
    } finally {
      setScanning(false);
    }
  };

  const handleContactWhatsApp = async (cart: any) => {
    if (!cart.customerPhone) {
      toast.error("O cliente não informou o telefone.");
      return;
    }
    try {
      await markRecoveryAttempt({ data: { id: cart.id } });
      router.invalidate();
      
      const firstName = cart.customerName.split(" ")[0];
      const message = `Olá ${firstName}, percebemos que você deixou alguns itens incríveis no seu carrinho do Jah! Posso ajudar com alguma dúvida sobre o tamanho ou envio?`;
      window.open(`https://wa.me/55${cart.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    } catch (e: any) {
      toast.error("Erro ao registrar tentativa.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
         <PageHeader
           title="Recuperação de Vendas"
           description="Carrinhos abandonados nas últimas horas. Entre em contato para resgatar a venda."
         />
         <Button onClick={handleScan} disabled={scanning} variant="outline" className="bg-background">
           <Search className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
           {scanning ? "Buscando..." : "Varrer Sistema"}
         </Button>
      </div>

      {carts.length === 0 ? (
         <EmptyState
           title="Nenhum carrinho abandonado"
           description="Excelente! Todos os seus clientes estão finalizando as compras com sucesso."
         />
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carts.map((cart: any) => {
               
               // Calculate Cart Total dynamically from snapshot
               const total = cart.snapshot.items.reduce((acc: number, item: any) => acc + (item.price_cents * item.qty), 0);

               return (
                 <div key={cart.id} className="bg-card border rounded-lg overflow-hidden flex flex-col justify-between">
                    <div className="p-4 border-b bg-muted/20">
                       <div className="flex justify-between items-start">
                         <div>
                            <h3 className="font-semibold">{cart.customerName}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                               Há {Math.floor((Date.now() - new Date(cart.createdAt).getTime()) / (1000 * 60 * 60))} horas
                            </p>
                         </div>
                         <div className="text-right">
                           <span className="font-bold text-lg text-primary">{formatMoney(total)}</span>
                         </div>
                       </div>
                    </div>

                    <div className="p-4 flex-1">
                       <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Itens Abandonados:</p>
                       <ul className="space-y-2 mb-4">
                         {cart.snapshot.items.slice(0, 3).map((item: any, idx: number) => (
                            <li key={idx} className="flex gap-2 text-sm items-start">
                               <span className="font-medium">{item.qty}x</span>
                               <span className="text-muted-foreground line-clamp-2 leading-tight">
                                  {item.product_variants?.products?.title}
                               </span>
                            </li>
                         ))}
                         {cart.snapshot.items.length > 3 && (
                            <li className="text-xs text-muted-foreground italic">
                              + {cart.snapshot.items.length - 3} outros itens
                            </li>
                         )}
                       </ul>

                       {cart.recoveryAttempts > 0 && (
                          <div className="inline-flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md mb-2">
                             <RotateCcw className="w-3 h-3 mr-1" />
                             {cart.recoveryAttempts} tentativas feitas
                          </div>
                       )}
                    </div>

                    <div className="p-4 border-t bg-card grid grid-cols-2 gap-2">
                       <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleContactWhatsApp(cart)}>
                         <MessageCircle className="w-4 h-4 mr-2" />
                         WhatsApp
                       </Button>
                       <Button variant="secondary" size="sm" className="w-full text-xs" disabled>
                         <Mail className="w-4 h-4 mr-2" />
                         E-mail
                       </Button>
                    </div>
                 </div>
               );
            })}
         </div>
      )}
    </div>
  );
}
