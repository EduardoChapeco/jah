/**
 * Identidade canônica do usuário autenticado Commerce
 *
 * Fonte única de verdade para resolver identity + role + store_id em server functions.
 * Nunca duplicar esta lógica nos arquivos de service.
 *
 * SERVIDOR APENAS.
 */

import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerClient } from "@/lib/supabase";
import { type ServerIdentity, STAFF_ROLES } from "@/lib/identity-core";

export type { ServerIdentity };
export { assertStoreAccess, STAFF_ROLES } from "@/lib/identity-core";

/**
 * Resolve a identidade completa do usuário autenticado no contexto do servidor.
 * Retorna id: null se não autenticado. NUNCA simula usuário mock em produção.
 */
export async function getServerIdentity(): Promise<ServerIdentity> {
  let user: any = null;
  try {
    const ssrClient = getSSRClient();
    const authRes = await ssrClient.auth.getUser();
    user = authRes?.data?.user || null;
  } catch {
    user = null;
  }

  const serverClient = getServerClient();
  let memberships: any[] = [];

  if (!user) {
    let activeStoreId: string | null = null;
    try {
      const { resolveTenantStoreId } = await import("@/lib/tenant.server");
      activeStoreId = (await resolveTenantStoreId()) ?? null;
    } catch {
      activeStoreId = null;
    }

    return {
      id: null,
      role: "customer",
      store_id: activeStoreId || "fc28a389-8bed-4d2d-a3ee-169bb5779293",
      memberships: [],
    };
  }

  try {
    const { data: membershipsData } = await serverClient
      .from("workspace_members")
      .select("store_id, role, stores(id, name, slug, logo_url, segment, type, category, settings)")
      .eq("profile_id", user.id);

    if (membershipsData && membershipsData.length > 0) {
      memberships = membershipsData
        .filter((m: any) => m.stores)
        .map((m: any) => ({
          store_id: m.store_id,
          role: m.role || "owner",
          name: m.stores?.name || "Loja",
          slug: m.stores?.slug || "loja",
          logo_url: m.stores?.logo_url || null,
          segment: m.stores?.segment || m.stores?.settings?.segment || null,
          type: m.stores?.type || m.stores?.settings?.type || null,
          category: m.stores?.category || m.stores?.settings?.category || null,
          settings: m.stores?.settings || {},
        }));
    }
  } catch (e) {
    console.warn("[identity.server] Erro ao buscar workspace_members:", e);
  }

  // 1. Busca perfil do usuário EXCLUSIVAMENTE no banco de dados
  // NUNCA confiar em user.user_metadata.role (pode ser injetado via client-side updateUser)
  let userProfileRole = "customer";
  try {
    const { data: p } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    userProfileRole = p?.role || "customer";
  } catch (err) {
    console.error("[identity.server] Falha ao verificar role no banco:", err);
    userProfileRole = "customer";
  }

  const isPlatformAdmin =
    userProfileRole === "platform_admin" ||
    userProfileRole === "master" ||
    userProfileRole === "superadmin";

  // 2. Resolve active tenant/store context a partir do cookie ou request
  let activeStoreId: string | null = null;
  try {
    const { resolveTenantStoreId } = await import("@/lib/tenant.server");
    activeStoreId = (await resolveTenantStoreId()) ?? null;
  } catch {
    activeStoreId = null;
  }

  // Verifica se o activeStoreId solicitado existe na lista de lojas do usuário
  const matchedMembership = activeStoreId
    ? memberships.find((m) => m.store_id === activeStoreId)
    : null;

  if (matchedMembership) {
    activeStoreId = matchedMembership.store_id;
  } else if (isPlatformAdmin && activeStoreId) {
    // Se for platform_admin, respeita o store_id do cookie ativamente
  } else {
    activeStoreId = memberships[0]?.store_id || null;
  }

  const currentMembership = memberships.find((m) => m.store_id === activeStoreId);
  const storeRole = (currentMembership?.role as any) || "customer";
  const finalRole = isPlatformAdmin ? "platform_admin" : storeRole;

  return {
    id: user.id,
    role: finalRole,
    store_id: activeStoreId,
    memberships,
  };
}
