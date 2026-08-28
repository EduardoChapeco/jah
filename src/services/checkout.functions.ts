/**
 * Checkout server functions Commerce
 *
 * processCheckout usa o RPC atômico `process_checkout_atomic` (migration 0025).
 * - Idempotência garantida pelo idempotency_key.
 * - Transação atômica no banco: cria pedido, itens, movimenta estoque, registra pagamento, fecha carrinho.
 * - Cálculos de desconto e frete são revalidados no servidor.
 * - Nunca confia em valores do cliente para preços ou totais.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import { getServerClient } from "@/lib/supabase";
import { getSSRClient } from "@/lib/server-access";
import { getCurrentIdentity } from "./cart-helpers";
import { getRequest } from "@tanstack/react-start/server";
import { readCookieFromRequest } from "@/lib/http-cookies";

const CheckoutSchema = z
  .object({
    cartId: z.string().uuid(),
    customerName: z.string().min(3),
    customerEmail: z.string().email(),
    customerDocument: z.string().optional(),
    customerPhone: z.string().optional(),
    shippingMethod: z.enum(["manual_table", "provider", "pickup", "manual_quote"]),
    shippingAddress: z
      .object({
        zipcode: z.string().min(8),
        street: z.string().min(2),
        number: z.string().min(1),
        complement: z.string().optional(),
        neighborhood: z.string().min(2),
        city: z.string().min(2),
        state: z.string().length(2),
      })
      .optional(),
    paymentMethod: z.enum(["pix", "manual", "credit_card", "receipt"]),
    paymentMethodId: z.string().uuid().optional(),
    giftCardCode: z.string().optional(),
    notes: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.shippingMethod === "manual_table" || val.shippingMethod === "provider") {
      if (!val.shippingAddress || !val.shippingAddress.zipcode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Endereço de entrega completo é obrigatório para esta modalidade de frete.",
          path: ["shippingAddress"],
        });
      }
    }
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const db = await getServerClient();
    const { data } = await db
      .from("orders")
      .select(
        "id, public_token, status, total_cents, subtotal_cents, shipping_cents, discount_cents, customer_snapshot, shipping_method, shipping_address, notes, custom_fields, created_at, stores(id, name, settings), payments(method, status, provider_name), order_items(id, product_title, variant_sku, qty, unit_price_cents, total_cents, item_type, item_id, selected_options)",
      )
      .eq("public_token", token)
      .single();
    return data;
  });

import { checkRateLimit, formatRetryAfter } from "@/lib/rate-limiter";

export const processCheckout = createServerFn({ method: "POST" })
  .validator(CheckoutSchema)
  .handler(async ({ data: params }) => {
    try {
      const req = getRequest();
      const clientIp = req
        ? (req.headers.get("cf-connecting-ip") ??
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown")
        : "unknown";

      const rateCheck = checkRateLimit(`checkout-${clientIp}`);
      if (!rateCheck.allowed) {
        const timeStr = formatRetryAfter(rateCheck.retryAfterSec || 60);
        throw new Error(
          `Muitas tentativas de checkout. Por favor, aguarde ${timeStr} antes de tentar novamente.`,
        );
      }

      const db = await getServerClient();

      // Idempotency key prevents double-processing
      const idempotencyKey = `checkout-${params.cartId}-${params.paymentMethod}-${params.paymentMethodId || ""}-${params.giftCardCode || ""}`;

      // Ensure anti-hijacking by extracting the actual current identity
      const identity = await getCurrentIdentity();
      const affiliateId = req ? readCookieFromRequest(req, "wider_affiliate_id") : null;

      // Call the atomic RPC v2 — all logic (coupon, stock, order creation, gift cards, surcharges) happens inside a single PostgreSQL transaction
      // Validação de integridade de frete: revalida apenas quando é transportadora automatizada externa com CEP
      const isLocalOrManualShipping =
        params.shippingMethod === "pickup" ||
        params.shippingMethod === "manual_quote" ||
        params.shippingMethod === "manual_table";

      if (!isLocalOrManualShipping) {
        const { data: cartValidation } = await db
          .from("carts")
          .select("shipping_zipcode, shipping_method, shipping_cents")
          .eq("id", params.cartId)
          .single();

        if (
          cartValidation &&
          cartValidation.shipping_method &&
          cartValidation.shipping_zipcode &&
          cartValidation.shipping_cents &&
          cartValidation.shipping_cents > 0
        ) {
          try {
            const { calculateShipping } = await import("@/services/shipping.functions");
            const currentRates = await calculateShipping({
              data: {
                zipcode: cartValidation.shipping_zipcode,
                cartId: params.cartId,
              },
            } as any);

            if (Array.isArray(currentRates) && currentRates.length > 0) {
              const matchedRate = currentRates.find(
                (r) =>
                  r.service_name === cartValidation.shipping_method ||
                  r.provider === cartValidation.shipping_method,
              );

              if (matchedRate && Math.abs(matchedRate.price_cents - cartValidation.shipping_cents) > 500) {
                // Pequena tolerância para oscilações mínimas de centavos, alerta apenas se diferença > R$ 5,00
                throw new Error(
                  "O valor do frete mudou desde a cotação inicial. Por favor, revise o frete no carrinho.",
                );
              }
            }
          } catch (shipErr: unknown) {
            // Log amigável sem interromper caso seja indisponibilidade transitória da API dos Correios
            console.warn(
              "[checkout.functions] Aviso na checagem de frete:",
              shipErr instanceof Error ? shipErr.message : String(shipErr),
            );
          }
        }
      }

      const { data, error } = await db.rpc("process_checkout_transaction_v2", {
        p_cart_id: params.cartId,
        p_idempotency_key: idempotencyKey,
        p_customer_name: params.customerName,
        p_customer_email: params.customerEmail,
        p_customer_document: params.customerDocument || null,
        p_customer_phone: params.customerPhone || null,
        p_shipping_method: params.shippingMethod,
        p_shipping_address: params.shippingAddress || {},
        p_payment_method: params.paymentMethod,
        p_gift_card_code: params.giftCardCode || null,
        p_manual_payment_method_id: params.paymentMethodId || null,
        p_affiliate_id: affiliateId || null,
      });

      if (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        
        // Translating PostgreSQL constraint errors into user-friendly messages
        if (errMsg.includes("stock_on_hand") || errMsg.includes("stock_reserved") || errMsg.includes("estoque insuficiente")) {
          throw new Error("Desculpe, um ou mais itens do seu carrinho esgotaram. Por favor, revise as quantidades.");
        }
        
        if (errMsg.includes("Carrinho no encontrado")) {
          throw new Error("Carrinho expirado ou jǭ processado. Inicie um novo checkout.");
        }

        throw new Error("Erro ao processar pedido: " + errMsg);
      }

      const result = data as {
        status: string;
        orderId?: string;
        orderToken: string;
        is_idempotent_replay: boolean;
      };

      if (result.status !== "success") {
        throw new Error("Checkout falhou.");
      }

      // Persist custom checkout fields and notes if provided
      if (result.orderId && (params.customFields || params.notes)) {
        await db
          .from("orders")
          .update({
            notes: params.notes || null,
            custom_fields: params.customFields || {},
          })
          .eq("id", result.orderId);
      }

      return {
        status: "success" as const,
        orderId: result.orderId,
        orderToken: result.orderToken,
      };
    } catch (e: unknown) {
      console.error(
        "[checkout.functions] processCheckout:",
        e instanceof Error ? e.message : String(e),
      );
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro no checkout");
    }
  });
