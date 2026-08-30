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

  // ── Passo 2: Verificar role do perfil (fonte segura — banco, não JWT metadata)
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
  }

  const isPlatformAdmin =
    userProfileRole === "platform_admin" ||
    userProfileRole === "master" ||
    userProfileRole === "superadmin" ||
    user?.email?.toLowerCase() === "meuwider@gmail.com" ||
    user?.email?.toLowerCase() === "master@wider.com.br";

  // ── Passo 3: Auto-Heal — Se memberships ainda está vazio, busca lojas associadas ao usuário
  if (memberships.length === 0) {
    try {
      let query = serverClient
        .from("stores")
        .select("id, name, slug, logo_url, segment, type, category, settings, email, created_by");

      let ownedStores: any[] = [];
      if (isPlatformAdmin) {
        // Platform admin vê todas as lojas
        const { data } = await query.order("created_at", { ascending: false }).limit(50);
        ownedStores = data || [];
      } else {
        // Usuário comum: busca por created_by ou email cadastrado na loja
        const userEmail = user?.email?.toLowerCase() || "";
        const { data: byCreated } = await query.eq("created_by", user.id);
        const { data: byEmail } = userEmail
          ? await serverClient.from("stores").select("id, name, slug, logo_url, segment, type, category, settings").ilike("email", userEmail)
          : { data: [] };

        const merged = [...(byCreated || []), ...(byEmail || [])];
        const seenIds = new Set<string>();
        ownedStores = merged.filter((s) => {
          if (seenIds.has(s.id)) return false;
          seenIds.add(s.id);
          return true;
        });
      }

      if (ownedStores && ownedStores.length > 0) {
        memberships = ownedStores.map((s: any) => ({
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

        // Auto-reconciliar: inserir as memberships faltantes para acelerar acessos futuros
        const rows = memberships.map((m) => ({
          profile_id: user.id,
          store_id: m.store_id,
          role: "owner",
        }));
        const { error: upsertErr } = await serverClient
          .from("workspace_members")
          .upsert(rows, { onConflict: "profile_id,store_id", ignoreDuplicates: true });
        if (upsertErr) {
          console.warn("[identity.server] Auto-reconciliar memberships falhou:", upsertErr.message);
        }
      }
    } catch (e) {
      console.warn("[identity.server] Erro no fallback de lojas por created_by/email:", e);
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
