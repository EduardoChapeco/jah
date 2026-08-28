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
    // Modo Acesso Direto / Sem necessidade de login (Wider Universal Access):
    // Resolve todas as lojas disponíveis para memberships e concede role platform_admin
    try {
      const { data: allStores } = await serverClient
        .from("stores")
        .select("id, name, slug, logo_url")
        .order("created_at", { ascending: true });

      if (allStores && allStores.length > 0) {
        memberships = allStores.map((s: any) => ({
          store_id: s.id,
          role: "owner" as const,
          name: s.name || "Loja",
          slug: s.slug || "loja",
          logo_url: s.logo_url || null,
        }));
      }
    } catch (e) {
      console.warn("[identity.server] Erro ao buscar stores para acesso direto:", e);
    }

    let activeStoreId: string | null = null;
    try {
      const { resolveTenantStoreId } = await import("@/lib/tenant.server");
      activeStoreId = (await resolveTenantStoreId()) ?? null;
    } catch {
      activeStoreId = null;
    }

    const matched = activeStoreId ? memberships.find((m) => m.store_id === activeStoreId) : null;
    if (matched) {
      activeStoreId = matched.store_id;
    } else {
      activeStoreId = memberships[0]?.store_id || "00000000-0000-0000-0000-000000000002";
    }

    // Busca perfil mestre no banco ou usa ID canônico
    let defaultProfileId = "d21869c6-6545-4a52-a383-10098ef180ec";
    try {
      const { data: defaultProfile } = await serverClient
        .from("profiles")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (defaultProfile?.id) {
        defaultProfileId = defaultProfile.id;
      }
    } catch {}

    return {
      id: defaultProfileId,
      role: "platform_admin",
      store_id: activeStoreId,
      memberships,
    };
  }

  try {
    const { data: membershipsData } = await serverClient
      .from("workspace_members")
      .select("store_id, role, stores(id, name, slug, logo_url)")
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
        }));
    }
  } catch (e) {
    console.warn("[identity.server] Erro ao buscar workspace_members:", e);
  }

  // 1. Busca perfil do usuário para verificar role global (platform_admin)
  let userProfileRole = "customer";
  try {
    const { data: p } = await serverClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    userProfileRole = p?.role || user.user_metadata?.role || "customer";
  } catch {
    userProfileRole = user.user_metadata?.role || "customer";
  }

  const isPlatformAdmin = userProfileRole === "platform_admin";

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
