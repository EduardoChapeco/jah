import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSSRClient, getServerIdentity } from "@/lib/server-access";
import { getServerClient } from "@/lib/supabase";

export const getCustomerCredits = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();

    if (!user) throw new Error("Não autorizado");

    const { resolveTenantStoreId } = await import("@/lib/tenant.server");
    const storeId = await resolveTenantStoreId();

    if (!storeId) {
      return { balance_cents: 0, customer_credit_transactions: [] };
    }

    const { data: credits, error } = await ssrClient
      .from("customer_credits")
      .select(
        `
        balance_cents,
        customer_credit_transactions ( id, amount_cents, reason, created_at )
      `,
      )
      .eq("customer_id", user.id)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) throw error;

    return credits || { balance_cents: 0, customer_credit_transactions: [] };
  } catch (e: unknown) {
    console.error("[credits] getCustomerCredits error:", e);
    throw new Error("Erro ao buscar créditos.");
  }
});
export const requestRedemption = createServerFn({ method: "POST" })
  .validator(
    z.object({
      amount_cents: z.number().int().min(100),
      pix_key: z.string().min(5),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity.id) throw new Error("Não autorizado");

    const { resolveTenantStoreId } = await import("@/lib/tenant.server");
    const storeId = await resolveTenantStoreId();

    if (!storeId) throw new Error("Loja não encontrada");

    const db = getServerClient();

    // 1. Verificar saldo
    const { data: credits } = await db
      .from("customer_credits")
      .select("balance_cents")
      .eq("customer_id", identity.id)
      .eq("store_id", storeId)
      .single();

    if (!credits || credits.balance_cents < data.amount_cents) {
      throw new Error("Saldo insuficiente para resgate.");
    }

    // 2. Deduzir saldo atômicamente via RPC
    const { error: rpcError } = await db.rpc("grant_customer_credit", {
      p_store_id: storeId,
      p_customer_id: identity.id,
      p_amount_cents: -data.amount_cents,
      p_reason: `Solicitação de Resgate via PIX (${data.pix_key})`,
    });

    if (rpcError) throw new Error("Erro ao processar resgate no banco.");

    // 3. Registrar auditoria para o financeiro processar
    await db.from("audit_logs").insert({
      store_id: storeId,
      user_id: identity.id,
      action: "credit_redemption_request",
      entity_type: "customer_credits",
      payload_snapshot: {
        amount_cents: data.amount_cents,
        pix_key: data.pix_key,
        status: "pending",
      },
    });

    return { success: true };
  });
