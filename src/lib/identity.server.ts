/**
 * Identidade canônica do usuário autenticado — Jah Commerce
 *
 * Fonte única de verdade para resolver identity + role + store_id em server functions.
 * Nunca duplicar esta lógica nos arquivos de service.
 *
 * SERVIDOR APENAS. Consumidores devem importar de `@/lib/server-access`,
 * que resolve este módulo de forma preguiçosa e mantém o grafo do cliente limpo.
 */

import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerClient } from "@/lib/supabase";
import type { ServerIdentity } from "@/lib/identity-core";

export type { ServerIdentity };
export { assertStoreAccess, STAFF_ROLES } from "@/lib/identity-core";

/**
 * Resolve a identidade completa do usuário autenticado no contexto do servidor.
 * Seguro para uso em qualquer createServerFn().
 */
export async function getServerIdentity(): Promise<ServerIdentity> {
  const ssrClient = getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  if (!user) {
    return { id: null, role: "customer", store_id: null, organization_id: null };
  }

  const serverClient = getServerClient();
  const { data: profile } = await serverClient
    .from("profiles")
    .select("role, store_id, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  let storeId = profile?.store_id ?? null;
  if (!storeId) {
    try {
      const { resolveTenantStoreId } = await import("@/lib/tenant");
      storeId = (await resolveTenantStoreId()) ?? null;
    } catch {
      /* ignored */
    }
  }

  return {
    id: user.id,
    role: profile?.role ?? "customer",
    store_id: storeId,
    organization_id: profile?.organization_id ?? null,
  };
}
