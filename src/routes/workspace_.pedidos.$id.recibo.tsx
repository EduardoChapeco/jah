import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";
import { getOrderForReceipt } from "@/services/order.functions";

export const Route = createFileRoute("/workspace_/pedidos/$id/recibo")({
  head: () => ({ meta: [{ title: "Recibo" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    return await getOrderForReceipt({ data: { id: params.id } });
  },
  component: ReceiptPrintPage,
});

function ReceiptPrintPage() {
  const order = Route.useLoaderData();

  useEffect(() => {
    // Automatically trigger print dialog after 500ms to allow rendering
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const date = formatDateTime(order.created_at);
  const customer = order.customer_snapshot as any;

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-2xl mx-auto font-sans">
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <h1 className="text-3xl font-bold">WIDER</h1>
        <p className="text-sm text-muted-foreground mt-1">DOCUMENTO AUXILIAR DE VENDA - PEDIDO</p>
        <p className="text-sm font-medium mt-2">NÃO É DOCUMENTO FISCAL</p>
      </div>

      <div className="flex justify-between items-start mb-8 text-sm">
        <div>
          <p>
            <strong>Pedido:</strong> #{order.public_token}
          </p>
          <p>
            <strong>Data:</strong> {date}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
        </div>
        <div className="text-right">
          <p>
            <strong>Cliente:</strong> {customer?.name || "Consumidor Final"}
          </p>
          <p>{customer?.document || ""}</p>
          <p>
            <strong>Entrega:</strong>
            {""}
            {order.shipping_method === "pickup" ? "Retirada na Loja" : "Envio"}
          </p>
        </div>
      </div>

      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-2 font-bold">Qtd</th>
            <th className="text-left py-2 font-bold">Descrição</th>
            <th className="text-right py-2 font-bold">V. Unit</th>
            <th className="text-right py-2 font-bold">V. Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map((item: any) => (
            <tr key={item.id} className="">
              <td className="py-2">{item.qty}x</td>
              <td className="py-2">
                <div>{item.product_title}</div>
                <div className="text-xs text-muted-foreground">SKU: {item.variant_sku}</div>
              </td>
              <td className="text-right py-2">{formatMoney(item.unit_price_cents)}</td>
              <td className="text-right py-2">
                {formatMoney(item.total_cents ?? (item.unit_price_cents || 0) * (item.qty || 1))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatMoney(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete:</span>
            <span>{formatMoney(order.shipping_cents)}</span>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-success">
              <span>Desconto:</span>
              <span>-{formatMoney(order.discount_cents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-black pt-2">
            <span>TOTAL:</span>
            <span>{formatMoney(order.total_cents)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground mt-12 pt-4 border-t border-dashed border-border">
        <p>Agradecemos a preferência!</p>
        <p>Desenvolvido para Wider Commerce</p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
 @media print {
 body {
 background-color: white !important;
 margin: 0;
 padding: 0;
 }
 @page { margin: 0.5cm; }
 }
 `,
        }}
      />
    </div>
  );
}
