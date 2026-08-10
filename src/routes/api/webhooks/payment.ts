import { createAPIFileRoute } from "@tanstack/start/api";
import { getServerClient } from "@/lib/supabase";

/**
 * Webhook Receptor for Payment Gateways (Mercado Pago / Stripe).
 * This endpoint must be public and will validate signatures.
 */
export const Route = createAPIFileRoute("/api/webhooks/payment")({
  POST: async ({ request }: { request: Request }) => {
    try {
      // 1. Read Payload
      const body = await request.json();
      const signature = request.headers.get("x-signature") || "";

      // TODO: Validate HMAC signature with Mercado Pago or Stripe Secret
      // In production, we'd abort here if signature fails.
      if (!signature && process.env.NODE_ENV === "production") {
        return new Response("Unauthorized", { status: 401 });
      }

      const db = getServerClient(); // Webhooks bypass RLS

      // 2. Identify Event Type
      if (body.type === "payment.updated" && body.data?.id) {
        const paymentId = body.data.id;
        const status = body.data.status; // e.g. "approved", "rejected"

        // 3. Find if this payment belongs to a Platform Invoice (Ads / Mensalidade)
        const { data: invoice } = await db
          .from("platform_invoices")
          .select("id")
          .eq("gateway_payment_id", paymentId)
          .single();

        if (invoice && status === "approved") {
          // Mark invoice as paid
          await db
            .from("platform_invoices")
            .update({ status: "paid" })
            .eq("id", invoice.id);
            
          // If invoice is linked to an Ad Campaign, activate it
          await db
            .from("ad_campaigns")
            .update({ status: "active" })
            .eq("invoice_id", invoice.id);
            
          return new Response("Invoice Updated", { status: 200 });
        }

        // 4. Find if this payment belongs to a Store Order (Checkout)
        const { data: order } = await db
          .from("orders")
          .select("id, status")
          .eq("gateway_payment_id", paymentId)
          .single();

        if (order && status === "approved") {
          // This requires a postgres RPC to do atomic operations
          // UPDATE orders SET status = 'processing' WHERE id = order.id
          // And decrement stock (SELECT FOR UPDATE)
          const { error } = await db.rpc("confirm_order_and_deduct_stock", {
            p_order_id: order.id,
          });
          
          if (error) {
            console.error("Race condition or stock error on webhook:", error.message);
            return new Response("Stock Error", { status: 409 });
          }
          return new Response("Order Updated", { status: 200 });
        }
      }

      return new Response("Event Ignored", { status: 200 });
    } catch (e: any) {
      console.error("[Webhook Error]:", e.message);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});
