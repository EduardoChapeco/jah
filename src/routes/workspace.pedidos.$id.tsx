import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Printer,
  Banknote,
  Landmark,
  AlertTriangle,
  Truck,
  ExternalLink,
  Package,
} from "lucide-react";
import {
  getOrderById,
  updateOrderStatus,
  updateOrderShipment,
  updateOrderShippingQuote,
} from "@/services/order.functions";
import { approvePayment, rejectPayment } from "@/services/payment.functions";
import { PickingWizard } from "@/components/admin/orders/picking-wizard";
import { RmaRequestWizard } from "@/components/admin/orders/rma-request-wizard";
import { OrderEditWizard } from "@/components/admin/orders/order-edit-wizard";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/workspace/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    try {
      const order = await getOrderById({ data: { orderId: params.id } });
      return order;
    } catch {
      return null;
    }
  },
  component: AdminOrderDetailPage,
});

function getStatusLabel(status: string) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning";
    }
  > = {
    draft: { label: "Rascunho", variant: "secondary" },
    awaiting_payment: { label: "Aguardando Pagamento", variant: "warning" },
    payment_processing: { label: "Pagamento em Processamento", variant: "info" },
    paid: { label: "Pago", variant: "success" },
    processing: { label: "Em Separação", variant: "secondary" },
    ready_for_pickup: { label: "Pronto para Retirada", variant: "success" },
    shipped: { label: "Enviado", variant: "info" },
    delivered: { label: "Entregue", variant: "success" },
    completed: { label: "Concluído", variant: "success" },
    cancelled: { label: "Cancelado", variant: "destructive" },
    payment_failed: { label: "Falha no Pagamento", variant: "destructive" },
    return_requested: { label: "Troca Solicitada", variant: "warning" },
    returned: { label: "Devolvido", variant: "secondary" },
    refunded: { label: "Estornado", variant: "secondary" },
  };
  return map[status] ?? { label: status, variant: "outline" };
}

function AdminOrderDetailPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [shippingQuoteCents, setShippingQuoteCents] = useState<string>("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  const [pickingModalOpen, setPickingModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    trackingCode: "",
    carrierName: "Transportadora",
    trackingUrl: "",
  });
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  if (!order) {
    return (
      <div className="py-16 text-center text-muted-foreground space-y-3">
        <p className="font-bold text-base text-foreground">Pedido não encontrado ou sem permissão de acesso.</p>
        <Link to="/workspace/pedidos" className="text-primary text-xs font-bold underline inline-block">
          ← Voltar para lista de pedidos
        </Link>
      </div>
    );
  }

  const date = formatDate(order.created_at);

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTracking(true);
    try {
      await updateOrderShipment({
        data: {
          orderId: order.id,
          trackingCode: trackingForm.trackingCode,
          carrierName: trackingForm.carrierName,
          trackingUrl: trackingForm.trackingUrl || undefined,
          newStatus: order.status === "processing" ? "shipped" : undefined,
        },
      });
      toast.success("Rastreamento do pedido atualizado!");
      setTrackingModalOpen(false);
      router.invalidate();
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) || "Erro ao salvar rastreamento",
      );
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingQuoteCents) return;
    setIsSavingQuote(true);
    try {
      const cents = Math.round(parseFloat(shippingQuoteCents.replace(",", ".")) * 100);
      await updateOrderShippingQuote({
        data: { orderId: order.id, shippingCents: cents },
      });
      toast.success("Cotação enviada! Pedido atualizado para Aguardando Pagamento.");
      setShippingQuoteCents("");
      router.invalidate();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao salvar cotação");
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus({
        data: { orderId: order.id, status: newStatus as any },
      });
      if (res.status !== "ok") throw new Error((res as any).message);
      toast.success("Status atualizado!");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao atualizar");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (method: "cash" | "bank_transfer") => {
    setIsConfirming(true);
    try {
      const res = await approvePayment({ data: { orderId: order.id, receivedMethod: method } });
      if (res.status !== "success") throw new Error((res as any).message);
      toast.success("Pagamento confirmado. O pedido está agora em separação!");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao aprovar");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    setShowCancelConfirm(false);
    setIsRejecting(true);
    try {
      const res = await rejectPayment({
        data: { orderId: order.id, reason: "Cancelado manualmente pela vendedora" },
      });
      if (res.status !== "success") throw new Error((res as any).message);
      toast.success("Pedido cancelado e pagamento rejeitado.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao cancelar");
    } finally {
      setIsRejecting(false);
    }
  };

  // handleAtomicReturn was removed in favor of granular RmaRequestWizard

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader eyebrow="Vendas" title={`Pedido #${order.public_token}`} />
        <div className="flex items-center gap-2">
          {["draft", "awaiting_payment", "paid"].includes(order.status) && (
            <Button variant="outline" onClick={() => setEditModalOpen(true)}>
              Editar Pedido
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.open(`/workspace/pedidos/${order.id}/recibo`, "_blank")}
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-6">
          <div className=" p-6 bg-card text-card-foreground ">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Itens do Pedido</h3>
            <div className="space-y-4">
              {(order.order_items ?? []).map((item: any) => {
                const options = item.selected_options ? Object.values(item.selected_options) : [];
                const isBackorderItem = item.metadata?.is_backorder === true;
                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-start  pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                        <span className="text-primary font-bold mr-1">{item.qty}x</span>
                        {item.product_title}
                        {isBackorderItem && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-warning/15 text-warning border border-warning/30 rounded-md">
                            ⏱ Encomenda
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        SKU: {item.variant_sku}
                      </p>
                      {options.length > 0 && (
                        <div className="mt-2 ml-2 pl-2  space-y-0.5">
                          {options.map((opt: any, idx: number) => (
                            <div key={idx} className="text-xs text-muted-foreground flex gap-2">
                              <span>+ {opt.label}</span>
                              {opt.price_modifier_cents > 0 && (
                                <span>({formatMoney(opt.price_modifier_cents)})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatMoney(item.total_cents)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatMoney(item.unit_price_cents)} / un
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className=" p-6 bg-card text-card-foreground ">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatMoney(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-foreground">{formatMoney(order.shipping_cents)}</span>
              </div>
              <div className="flex justify-between font-bold text-base  pt-3 mt-1 text-foreground">
                <span>Total</span>
                <span>{formatMoney(order.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className=" p-6 bg-card text-card-foreground ">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Status</h3>
            <Badge
              variant={getStatusLabel(order.status).variant}
              className="text-[11px] py-1 mb-4 flex justify-center"
            >
              {getStatusLabel(order.status).label}
            </Badge>

            {order.status === "awaiting_shipping_quote" && (
              <div className="space-y-4 mb-4 p-4 border border-warning/50 bg-warning/10 rounded-xl">
                <h4 className="font-semibold text-warning-foreground text-sm flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  Cotação de Frete Pendente
                </h4>
                <p className="text-xs text-muted-foreground">
                  O cliente solicitou uma cotação de frete personalizada. Informe o valor do frete
                  para liberar o pagamento.
                </p>
                <form onSubmit={handleSaveQuote} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0,00"
                      value={shippingQuoteCents}
                      onChange={(e) => setShippingQuoteCents(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 pl-8 text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={isSavingQuote}>
                    {isSavingQuote ? "Enviando..." : "Enviar Cotação"}
                  </Button>
                </form>
              </div>
            )}

            {order.status === "awaiting_payment" && (
              <div className="space-y-3">
                {/* Approve payment — choose method */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="w-full font-bold" disabled={isConfirming || isRejecting}>
                      {isConfirming ? "Confirmando..." : "Marcar como Pago"}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Como o pagamento foi recebido?</SheetTitle>
                      <SheetDescription>
                        Selecione a forma real que o dinheiro entrou. Se foi em dinheiro físico, o
                        valor será somado ao Frente de Caixa atual.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={() => handleApprove("cash")}
                      >
                        <Banknote className="h-8 w-8 text-primary" />
                        <span>Dinheiro (Frente de Caixa)</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={() => handleApprove("bank_transfer")}
                      >
                        <Landmark className="h-8 w-8 text-primary" />
                        <span>Pix / Transferência / Cartão</span>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Cancel — confirmation dialog (replaces window.confirm) */}
                <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive"
                      disabled={isConfirming || isRejecting}
                    >
                      {isRejecting ? "Cancelando..." : "Cancelar Venda"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Cancelar esta venda?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        O pedido será marcado como cancelado. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                        Voltar
                      </Button>
                      <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                        Confirmar Cancelamento
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  Você enviou o link ou chave PIX para o cliente? Assim que ele pagar, clique em
                  Marcar como Pago para liberar a separação.
                </p>
              </div>
            )}

            {order.status === "processing" && (
              <div className="space-y-3 mt-4">
                <Button
                  className="w-full font-bold"
                  onClick={() => setPickingModalOpen(true)}
                  disabled={isUpdating}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Iniciar Separação (Picking)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Faça a conferência física dos itens antes de faturar o pedido.
                </p>
              </div>
            )}

            {(order.status === "shipped" || order.status === "ready_for_pickup") && (
              <div className="space-y-3 mt-4">
                <Button
                  className="w-full font-bold"
                  onClick={() => handleStatusChange("delivered")}
                  disabled={isUpdating}
                >
                  {order.status === "shipped" ? "Confirmar Entrega" : "Entregar ao Cliente"}
                </Button>
              </div>
            )}

            {(order.status === "delivered" || order.status === "completed") && (
              <div className="space-y-3 mt-4">
                <RmaRequestWizard
                  order={order}
                  isOpen={returnModalOpen}
                  onOpenChange={setReturnModalOpen}
                  onComplete={async () => {
                    await router.invalidate();
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full text-destructive mt-2"
                  onClick={() => setReturnModalOpen(true)}
                >
                  Solicitar Devolução Parcial (RMA)
                </Button>
              </div>
            )}

            {/* Rastreamento & Logística */}
            <div className="border-t pt-4 mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" /> Logística e Rastreio
                </span>
                <Sheet open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTrackingForm({
                          trackingCode: "",
                          carrierName: "Transportadora",
                          trackingUrl: "",
                        })
                      }
                    >
                      Novo Envio (Pacote)
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Informar Código de Rastreio</SheetTitle>
                      <SheetDescription>
                        Insira os dados da transportadora para enviar ao cliente.
                      </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSaveTracking} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Transportadora</label>
                        <input
                          type="text"
                          required
                          value={trackingForm.carrierName}
                          onChange={(e) =>
                            setTrackingForm((p) => ({ ...p, carrierName: e.target.value }))
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Código de Rastreio</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: BR123456789BR"
                          value={trackingForm.trackingCode}
                          onChange={(e) =>
                            setTrackingForm((p) => ({ ...p, trackingCode: e.target.value }))
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Link de Rastreio (Opcional)</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={trackingForm.trackingUrl}
                          onChange={(e) =>
                            setTrackingForm((p) => ({ ...p, trackingUrl: e.target.value }))
                          }
                          className="w-full rounded-xl border px-3 py-2 text-sm"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSavingTracking}>
                        {isSavingTracking ? "Salvando..." : "Confirmar Envio"}
                      </Button>
                    </form>
                  </SheetContent>
                </Sheet>
              </div>

              {order.shipments && order.shipments.length > 0 ? (
                <div className="space-y-2">
                  {order.shipments.map((shipment: any) => (
                    <div key={shipment.id} className="text-sm p-3 border rounded bg-muted/20">
                      <p className="font-semibold">{shipment.carrier_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-muted-foreground">
                          {shipment.tracking_code}
                        </span>
                        {shipment.tracking_url && (
                          <a
                            href={shipment.tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> Acompanhar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum pacote enviado ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {editModalOpen && (
        <OrderEditWizard
          order={order}
          isOpen={editModalOpen}
          onOpenChange={setEditModalOpen}
          onComplete={async () => {
            await router.invalidate();
          }}
        />
      )}

      <PickingWizard
        order={order}
        isOpen={pickingModalOpen}
        onOpenChange={setPickingModalOpen}
        onComplete={async () => {
          await handleStatusChange(
            order.shipping_method === "pickup" ? "ready_for_pickup" : "shipped",
          );
        }}
      />
    </div>
  );
}
