import { createFileRoute } from "@tanstack/react-router";
import { handleInboundWebhook, type InboundWebhookPayload } from "@/services/marketplace-webhooks.functions";

export const Route = createFileRoute("/api/webhooks/marketplaces")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const platformParam = url.searchParams.get("platform") || "mercadolivre";
          const storeIdParam = url.searchParams.get("store_id") || undefined;

          const rawBody = await request.json().catch(() => ({}));

          // Normaliza metadados por provedor
          let eventId: string | undefined = undefined;
          let topic: string | undefined = undefined;
          let resourceId: string | undefined = undefined;

          if (platformParam === "mercadolivre") {
            // Mercado Livre envia: { _id, topic: 'orders_v2', resource: '/orders/12345', user_id, application_id }
            eventId = rawBody._id || rawBody.id || request.headers.get("x-event-id") || undefined;
            topic = rawBody.topic || undefined;
            resourceId = rawBody.resource || undefined;
          } else if (platformParam === "ifood") {
            // iFood OpenDelivery envia: { id: "evt_123", code: "PLACED", orderId: "ord_456" }
            eventId = rawBody.id || request.headers.get("x-ifood-event-id") || undefined;
            topic = rawBody.code || undefined;
            resourceId = rawBody.orderId || undefined;
          } else if (platformParam === "focus_nfe" || platformParam === "nuvem_fiscal") {
            // Focus NFe envia: { ref: "123", status: "autorizado", chave_nfe: "3526..." }
            eventId = rawBody.ref || rawBody.id || rawBody.chave_nfe || undefined;
            topic = rawBody.status || rawBody.situacao || undefined;
            resourceId = rawBody.ref || rawBody.chave_nfe || undefined;
          } else {
            eventId = rawBody.id || rawBody.eventId || undefined;
            topic = rawBody.topic || rawBody.event_type || undefined;
            resourceId = rawBody.resourceId || rawBody.orderId || undefined;
          }

          const webhookData: InboundWebhookPayload = {
            platform: platformParam as any,
            eventId,
            topic,
            resourceId,
            storeId: storeIdParam,
            payload: rawBody,
          };

          const result = await handleInboundWebhook(webhookData);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("[marketplaces-webhook] Erro no processamento:", e);
          // Retorna 200 com status failed para evitar que o marketplace retente agressivamente em erro de payload
          return new Response(
            JSON.stringify({ status: "failed", error: e?.message || "Internal Server Error" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      GET: async () => {
        return new Response(
          JSON.stringify({
            service: "Waesy Marketplace Webhook Receiver",
            status: "active",
            supportedPlatforms: ["mercadolivre", "ifood", "focus_nfe", "nuvem_fiscal", "shopee", "melhorenvio", "correios"],
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});
