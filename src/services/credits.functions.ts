import { createServerFn } from "@tanstack/react-start";
import { getSSRClient } from "@/lib/server-access";

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
