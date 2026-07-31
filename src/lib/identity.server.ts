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
    return { id: null, role: "customer", store_id: null, memberships: [] };
  }

  const serverClient = getServerClient();
  const { data: membershipsData } = await serverClient
    .from("workspace_members")
    .select("store_id, role, stores(name, slug, logo_url)")
    .eq("profile_id", user.id);

  const memberships = (membershipsData ?? []).map((m: any) => ({
    store_id: m.store_id,
    role: m.role,
    name: m.stores?.name,
    slug: m.stores?.slug,
    logo_url: m.stores?.logo_url,
  }));

  // Resolve active tenant/store context
  let activeStoreId: string | null = null;
  try {
    const { resolveTenantStoreId } = await import("@/lib/tenant");
    activeStoreId = (await resolveTenantStoreId()) ?? null;
  } catch {
    /* ignored */
  }

  // Determine role in the active context
  let activeRole = "customer";
  if (activeStoreId) {
    const membership = memberships.find((m) => m.store_id === activeStoreId);
    if (membership) {
      activeRole = membership.role;
    }
  }

  return {
    id: user.id,
    role: activeRole,
    store_id: activeStoreId,
    memberships,
  };
}
