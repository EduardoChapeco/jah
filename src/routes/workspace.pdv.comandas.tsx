import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Receipt, Check, CreditCard, Banknote, QrCode } from "lucide-react";
import { listOrders, updateOrderStatus } from "@/services/order.functions";

import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/workspace/pdv/comandas")({
  head: () => ({ meta: [{ title: "Gestão de Comandas" }] }),
  loader: async () => {
    const orders = await listOrders().catch(() => []);
    // Filter active comandas
    return orders.filter(
      (o: any) =>
        o.origin_type === "pdv" && o.table_identifier && o.status === "payment_processing",
    );
  },
  component: PdvComandasPage,
});

function PdvComandasPage() {
  const initialComandas = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pix" | "card">("cash");

  const { data: comandas } = useQuery({
    queryKey: ["pdv-comandas"],
    queryFn: async () => {
      const orders = await listOrders();
      return orders.filter(
        (o: any) =>
          o.origin_type === "pdv" && o.table_identifier && o.status === "payment_processing",
      );
    },
    initialData: initialComandas,
  });

  // Idealmente teriamos uma mutation especifica 'closeComanda' no backend
  // para lidar com a injeção no caixa caso seja 'cash'.
  // Por simplicidade, vamos usar updateOrderStatus para marcar como paid.
  // Em produção, isso deve chamar uma service function que faça ambas as coisas atomicamente.
  const payMutation = useMutation({
    mutationFn: async ({ orderId, method }: { orderId: string; method: string }) => {
      // In a real scenario, call a closeComanda({ orderId, method }) here to ensure cash register gets updated.
      return await updateOrderStatus({ data: { orderId, status: "paid" } });
    },
    onSuccess: () => {
      toast.success("Comanda fechada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["pdv-comandas"] });
      setCheckoutModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao fechar comanda.");
    },
  });

  const handleOpenCheckout = (comanda: any) => {
    setSelectedComanda(comanda);
    setCheckoutModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedComanda) return;
    payMutation.mutate({ orderId: selectedComanda.id, method: paymentMethod });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/20 p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link to="/workspace/pdv">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Comandas em Aberto</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie o fluxo de mesas e contas do salão.
          </p>
        </div>
      </div>

      {comandas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
          <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold">Nenhuma comanda aberta</h2>
          <p className="text-muted-foreground">Todas as contas do salão estão fechadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {comandas.map((comanda: any) => (
            <div
              key={comanda.id}
              className="overflow-hidden bg-surface-paper rounded-xl border-t-4 border-t-amber-500 border-x border-b border-border shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/10">
                <span className="font-black text-foreground text-lg uppercase tracking-wide">
                  {comanda.table_identifier}
                </span>
                <Badge variant="outline" className="bg-background">
                  {formatDateTime(comanda.created_at)}
                </Badge>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <div className="space-y-1.5">
                  {comanda.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.qty}x {item.product_title}
                      </span>
                      <span className="font-medium whitespace-nowrap">
                        {formatMoney(item.total_cents)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-dashed border-border flex items-end justify-between">
                  <span className="text-muted-foreground font-medium text-sm">Total</span>
                  <span className="text-xl font-black text-foreground">
                    {formatMoney(comanda.total_cents)}
                  </span>
                </div>
                <Button
                  className="w-full font-bold mt-2"
                  onClick={() => handleOpenCheckout(comanda)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Fechar Conta
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl text-center">Fechar Comanda</DialogTitle>
          </DialogHeader>

          <div className="py-6 flex flex-col gap-6">
            <div className="text-center">
              <p className="text-foreground/60 font-bold mb-1 uppercase tracking-wide">
                {selectedComanda?.table_identifier}
              </p>
              <p className="text-muted-foreground text-sm">Total a pagar</p>
              <div className="text-4xl font-black text-primary">
                {formatMoney(selectedComanda?.total_cents || 0)}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground">Forma de Pagamento</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="h-16 flex flex-col gap-1 border"
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="h-5 w-5" />
                  Dinheiro
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "pix" ? "default" : "outline"}
                  className="h-16 flex flex-col gap-1 border"
                  onClick={() => setPaymentMethod("pix")}
                >
                  <QrCode className="h-5 w-5" />
                  PIX
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className="h-16 flex flex-col gap-1 border"
                  onClick={() => setPaymentMethod("card")}
                >
                  <CreditCard className="h-5 w-5" />
                  Cartão
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCheckoutModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="lg" onClick={handleConfirmPayment} disabled={payMutation.isPending}>
              {payMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
