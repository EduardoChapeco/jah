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

  // ── Passo 1: Buscar memberships via workspace_members (consulta direta e resiliente)
  try {
    const { data: memberRows, error: memErr } = await serverClient
      .from("workspace_members")
      .select("store_id, role")
      .eq("profile_id", user.id);

    if (memErr) {
      console.warn("[identity.server] Aviso na busca de workspace_members:", memErr.message);
    }

    if (memberRows && memberRows.length > 0) {
      const storeIds = Array.from(new Set(memberRows.map((m: any) => m.store_id).filter(Boolean)));
      if (storeIds.length > 0) {
        const { data: storesList } = await serverClient
          .from("stores")
          .select("id, name, slug, logo_url, segment, type, category, settings")
          .in("id", storeIds);

        const storeMap = new Map((storesList || []).map((s: any) => [s.id, s]));
        memberships = memberRows
          .filter((m: any) => storeMap.has(m.store_id))
          .map((m: any) => {
            const s = storeMap.get(m.store_id)!;
            return {
              store_id: s.id,
              role: m.role || "owner",
              name: s.name || "Loja",
              slug: s.slug || "loja",
              logo_url: s.logo_url || s.settings?.logoUrl || s.settings?.logo_url || null,
              segment: s.segment || s.settings?.segment || null,
              type: s.type || s.settings?.type || null,
              category: s.category || s.settings?.category || null,
              settings: s.settings || {},
            };
          });
      }
    }
  } catch (e) {
    console.warn("[identity.server] Erro ao buscar workspace_members:", e);
  }

  // ── Passo 2: Verificar role do perfil e store_id associada
  let userProfileRole = "customer";
  let profileStoreId: string | null = null;
  try {
    const { data: p } = await serverClient
      .from("profiles")
      .select("role, store_id")
      .eq("id", user.id)
      .maybeSingle();
    userProfileRole = p?.role || "customer";
    profileStoreId = p?.store_id || null;
  } catch (err) {
    console.error("[identity.server] Falha ao verificar role no banco:", err);
  }

  const isPlatformAdmin =
    userProfileRole === "platform_admin" ||
    userProfileRole === "master" ||
    userProfileRole === "superadmin" ||
    userProfileRole === "admin" ||
    user?.email?.toLowerCase() === "meuwider@gmail.com" ||
    user?.email?.toLowerCase() === "master@wider.com.br";

  // Se o profile tem store_id vinculado e ainda não está em memberships, adiciona
  if (profileStoreId && !memberships.some((m) => m.store_id === profileStoreId)) {
    try {
      const { data: st } = await serverClient
        .from("stores")
        .select("id, name, slug, logo_url, segment, type, category, settings")
        .eq("id", profileStoreId)
        .maybeSingle();
      if (st) {
        memberships.unshift({
          store_id: st.id,
          role: userProfileRole === "customer" ? "owner" : userProfileRole,
          name: st.name || "Minha Loja",
          slug: st.slug || "loja",
          logo_url: st.logo_url || st.settings?.logoUrl || st.settings?.logo_url || null,
          segment: st.segment || st.settings?.segment || null,
          type: st.type || st.settings?.type || null,
          category: st.category || st.settings?.category || null,
          settings: st.settings || {},
        });
      }
    } catch {
      // Silencioso
    }
  }

  // ── Passo 3: Auto-Heal — Se memberships está vazio ou é platform admin, busca lojas adicionais
  if (memberships.length === 0 || isPlatformAdmin) {
    try {
      let ownedStores: any[] = [];
      if (isPlatformAdmin) {
        // Platform admin tem acesso a todas as lojas do ecossistema
        const { data: allStores } = await serverClient
          .from("stores")
          .select("id, name, slug, logo_url, segment, type, category, settings")
          .order("created_at", { ascending: false })
          .limit(30);
        ownedStores = allStores || [];
      } else {
        // Usuário comum: busca por email cadastrado na loja ou owner_id
        const userEmail = user?.email?.toLowerCase() || "";
        const { data: byEmail } = userEmail
          ? await serverClient
              .from("stores")
              .select("id, name, slug, logo_url, segment, type, category, settings")
              .ilike("email", userEmail)
          : { data: [] };

        ownedStores = byEmail || [];
      }

      if (ownedStores && ownedStores.length > 0) {
        const existingIds = new Set(memberships.map((m) => m.store_id));
        const additional = ownedStores
          .filter((s: any) => !existingIds.has(s.id))
          .map((s: any) => ({
            store_id: s.id,
            role: "owner",
            name: s.name || "Minha Loja",
            slug: s.slug || "loja",
            logo_url: s.logo_url || s.settings?.logoUrl || s.settings?.logo_url || null,
            segment: s.segment || s.settings?.segment || null,
            type: s.type || s.settings?.type || null,
            category: s.category || s.settings?.category || null,
            settings: s.settings || {},
          }));

        memberships = [...memberships, ...additional];
      }
    } catch (e) {
      console.warn("[identity.server] Erro no fallback de lojas:", e);
    }
  }

  // ── Passo 4: Resolver loja ativa pelo cookie de tenant
  let activeStoreId: string | null = null;
  try {
    const { resolveTenantStoreId } = await import("@/lib/tenant.server");
    activeStoreId = (await resolveTenantStoreId()) ?? null;
  } catch {
    activeStoreId = null;
  }

  // Valida se o activeStoreId do cookie pertence aos memberships do usuário
  const matchedMembership = activeStoreId
    ? memberships.find((m) => m.store_id === activeStoreId)
    : null;

  if (matchedMembership) {
    // Cookie aponta para loja válida do usuário — manter
    activeStoreId = matchedMembership.store_id;
  } else if (isPlatformAdmin && activeStoreId) {
    // Platform admin pode operar qualquer loja via cookie — manter
  } else {
    // Fallback: primeira loja da lista de memberships
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
