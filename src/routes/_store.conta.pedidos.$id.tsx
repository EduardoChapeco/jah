import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  Copy,
  Upload,
  Info,
  AlertTriangle,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/commerce/page-header";
import { ReviewModal } from "@/components/commerce/review-modal";
import { RmaWizard } from "@/components/commerce/rma-wizard";
import { ErrorState, EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";
import { getCustomerOrder, getOrderPaymentInstructions } from "@/services/order.functions";
import { uploadPaymentReceipt } from "@/services/payment.functions";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/pedidos/$id")({
  head: () => ({ meta: [{ title: "Detalhes do Pedido" }] }),
  loader: async ({ params }) => {
    const [orderRes, instrRes] = await Promise.all([
      getCustomerOrder({ data: { orderId: params.id } }),
      getOrderPaymentInstructions({ data: { orderId: params.id } }).catch(() => ({
        status: "error" as const,
        data: null,
      })),
    ]);

    return {
      order: orderRes,
      paymentInstructions: instrRes || { pix_key: null, payment_instructions: null },
    };
  },
  component: CustomerOrderDetailPage,
});

function translateStatus(status: string) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    awaiting_payment: "Aguardando Pagamento",
    payment_processing: "Comprovante em Análise",
    paid: "Pago",
    processing: "Em Separação",
    ready_for_pickup: "Pronto para Retirada",
    shipped: "Enviado",
    delivered: "Entregue",
    completed: "Concluído",
    cancelled: "Cancelado",
    payment_failed: "Pagamento Rejeitado",
  };
  return map[status] || status;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["paid", "completed", "delivered"].includes(status)) return "default";
  if (["awaiting_payment", "payment_processing", "processing", "shipped"].includes(status))
    return "secondary";
  if (["cancelled", "payment_failed"].includes(status)) return "destructive";
  return "outline";
}

function CustomerOrderDetailPage() {
  const { order, paymentInstructions } = Route.useLoaderData() as {
    order: any;
    paymentInstructions: { pix_key: string | null; payment_instructions: string | null };
  };
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [rmaWizardOpen, setRmaWizardOpen] = useState(false);

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          to="/conta/pedidos"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar para pedidos
        </Link>
        <EmptyState title="Pedido não encontrado" />
      </div>
    );
  }

  const payment = order.payments?.[0];
  // Use canonical field names from order_items: qty and total_cents
  const items = order.order_items || [];
  const address = order.shipping_address || {};

  const handleCopyPix = () => {
    if (!paymentInstructions.pix_key) return;
    navigator.clipboard.writeText(paymentInstructions.pix_key);
    toast.success("Chave PIX copiada com sucesso!");
  };

  const handleUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O comprovante deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await uploadPaymentReceipt({
          data: {
            orderId: order.id,
            fileName: file.name,
            fileBase64: base64,
          },
        });
        if (res.status === "error") throw new Error(res.message);
        toast.success("Comprovante enviado! Aguardando confirmação da loja.");
        router.invalidate();
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao enviar comprovante.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 font-sans text-foreground">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Link
          to="/conta/pedidos"
          className="flex items-center gap-1 text-sm font-bold text-foreground hover:underline decoration-2"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar para pedidos
        </Link>
        <span className="px-3 py-1 font-mono text-xs font-black uppercase border border-border bg-secondary shadow-sm">
          {translateStatus(order.status)}
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-semibold font-bold flex items-center gap-3">
          <Package className="size-8 text-primary" strokeWidth={3} />
          Pedido #{order.public_token}
        </h1>
        <p className="text-sm font-mono mt-2 bg-primary text-primary-foreground inline-block px-2 py-1 shadow-sm">
          Realizado em {formatDate(order.created_at)}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: items + shipping */}
        <div className="md:col-span-2 space-y-6">
          {/* Order items */}
          <div className="border border-border bg-background shadow-sm p-5 space-y-4 mb-6">
            <h3 className="font-semibold text-xl font-bold flex items-center gap-2 border-b border-border pb-3">
              <Package className="h-6 w-6 text-primary" strokeWidth={2.5} />
              Itens do Pedido
            </h3>
            <div className="divide-y">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between py-4 first:pt-0 last:pb-0 text-sm"
                >
                  <div>
                    <p className="font-bold text-lg">{item.product_title}</p>
                    <p className="text-xs text-foreground/70 font-mono mt-0.5">
                      SKU: {item.variant_sku}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Canonical DB field: total_cents (not total_price_cents) */}
                    <p className="font-black font-semibold text-lg">
                      {formatMoney(item.total_cents)}
                    </p>
                    {/* Canonical DB field: qty (not quantity) */}
                    <p className="text-xs text-foreground/70">
                      {item.qty}x {formatMoney(item.unit_price_cents)}
                    </p>
                    {order.status === "delivered" && (
                      <ReviewModal productId={item.product_id} productName={item.product_title} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Shipping Address */}
          <div className="border border-border bg-background shadow-sm p-5 space-y-3 mb-6">
            <h3 className="font-semibold text-xl font-bold flex items-center gap-2 border-b border-border pb-3">
              <MapPin className="h-6 w-6 text-primary" strokeWidth={2.5} />
              Entrega / Retirada
            </h3>
            {order.shipping_method === "pickup" ? (
              <p className="text-sm text-foreground/80">
                Modalidade: <strong className="text-foreground">Retirada na Loja</strong>
              </p>
            ) : (
              <div className="text-sm text-foreground/80 space-y-1">
                <p>
                  <strong className="text-foreground">Modalidade:</strong> Entrega domiciliar
                </p>
                {address.street && (
                  <p>
                    {address.street}, {address.number}
                    {address.complement && ` — ${address.complement}`}
                  </p>
                )}
                {address.neighborhood && (
                  <p>
                    {address.neighborhood} — {address.city}/{address.state}
                  </p>
                )}
                {address.zipcode && (
                  <p className="font-mono text-xs mt-1 font-bold text-foreground">
                    CEP: {address.zipcode}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: totals + payment */}
        <div className="space-y-6">
          {/* Summary totals */}
          <div className="border border-border bg-secondary shadow-sm p-6 space-y-4 mb-6 text-foreground">
            <h3 className="font-semibold text-2xl font-bold border-b border-border pb-3 flex items-center gap-2">
              <CreditCard className="size-6 text-primary" strokeWidth={2.5} />
              Resumo Financeiro
            </h3>
            <div className="space-y-2 text-sm font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-bold">{formatMoney(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span className="font-mono font-bold">
                  {order.shipping_cents === 0 ? "Grátis" : formatMoney(order.shipping_cents)}
                </span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-success font-black border border-success bg-white px-2 py-1 shadow-sm mt-1">
                  <span>Desconto</span>
                  <span>-{formatMoney(order.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between items-end border-t border-border pt-4 mt-4">
                <span className="font-bold text-xl font-semibold">Total</span>
                <span className="font-black text-4xl text-primary font-semibold tracking-tight drop-shadow-sm">
                  {formatMoney(order.total_cents)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment instructions & Upload */}
          {order.status === "awaiting_payment" && (
            <div className="border border-border bg-background shadow-sm p-5 space-y-5 text-foreground">
              <h3 className="font-semibold text-xl font-bold flex items-center gap-2 border-b border-border pb-3">
                <CreditCard className="h-6 w-6 text-primary" strokeWidth={2.5} />
                Como Pagar
              </h3>

              {paymentInstructions.pix_key ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-foreground shrink-0" />
                    <p className="text-xs font-bold text-foreground">
                      Copie a chave abaixo e cole no app do seu banco:
                    </p>
                  </div>
                  <div className="bg-muted/30 border border-border p-3 text-xs font-mono break-all select-all font-bold">
                    {paymentInstructions.pix_key}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border border-border font-bold rounded-md bg-white text-foreground"
                    onClick={handleCopyPix}
                  >
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Chave PIX
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-foreground/80 font-medium">
                  Entre em contato com a loja para obter as instruções de pagamento.
                </p>
              )}

              {paymentInstructions.payment_instructions && (
                <div className="bg-secondary/30 p-3 text-xs text-foreground border border-border font-medium">
                  <p className="font-bold text-foreground mb-1">Instruções adicionais:</p>
                  <p className="whitespace-pre-wrap">{paymentInstructions.payment_instructions}</p>
                </div>
              )}

              {/* Upload section */}
              <div className="border border-dashed border-border bg-muted/30 p-5 text-center space-y-3">
                <Upload className="h-6 w-6 mx-auto text-foreground" />
                <p className="text-xs font-bold text-foreground">
                  Envie o comprovante de pagamento para agilizar a confirmação.
                </p>
                <input
                  type="file"
                  id="receipt-file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleUploadReceipt}
                  disabled={uploading}
                />
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-primary text-primary-foreground border border-border rounded-md font-bold cursor-pointer"
                  disabled={uploading}
                >
                  <label htmlFor="receipt-file">
                    {uploading ? "Enviando..." : "Anexar Comprovante"}
                  </label>
                </Button>
              </div>
            </div>
          )}

          {/* Payment status messages */}
          {order.status === "payment_processing" && (
            <div className="flex items-start gap-3 bg-secondary text-foreground text-sm p-4 border border-border shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-foreground" strokeWidth={2.5} />
              <div>
                <p className="font-black font-semibold uppercase">Comprovante em análise</p>
                <p className="mt-1 text-foreground/80 font-medium">
                  A equipe está confirmando seu pagamento. Você será notificado em breve.
                </p>
              </div>
            </div>
          )}

          {payment?.receipt_status === "rejected" && (
            <div className="flex items-start gap-3 bg-primary text-primary-foreground text-sm p-4 border border-border shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <AlertTriangle
                className="h-5 w-5 shrink-0 mt-0.5 text-primary-foreground"
                strokeWidth={2.5}
              />
              <div>
                <p className="font-black font-semibold uppercase">Comprovante Recusado</p>
                <p className="mt-1 text-primary-foreground/90 font-medium">
                  O comprovante não pôde ser validado. Por favor, envie novamente ou contate a loja.
                </p>
              </div>
            </div>
          )}

          {["paid", "processing", "completed"].includes(order.status) && (
            <div className="flex items-start gap-3 bg-success text-white text-sm p-4 border border-border shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-white" strokeWidth={2.5} />
              <div>
                <p className="font-black font-semibold uppercase">Pagamento Confirmado</p>
                <p className="mt-1 text-white/90 font-medium">
                  Seu pagamento foi confirmado! O pedido está sendo preparado.
                </p>
              </div>
            </div>
          )}

          {["delivered", "completed", "shipped"].includes(order.status) && (
            <>
              <Button
                variant="outline"
                className="w-full mt-6 bg-background text-primary border border-border rounded-md font-black uppercase tracking-wider"
                onClick={() => setRmaWizardOpen(true)}
              >
                Solicitar Devolução / Troca
              </Button>
              <RmaWizard
                orderId={order.id}
                items={items}
                isOpen={rmaWizardOpen}
                onClose={() => setRmaWizardOpen(false)}
                onSuccess={() => router.invalidate()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
