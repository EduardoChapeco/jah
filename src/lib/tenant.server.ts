import { getRequestHeader, getCookie } from "@tanstack/react-start/server";
import { getAnonServerClient } from "@/lib/supabase";

/**
 * Resolve o store_id do contexto ativo a partir do cookie de sessão ou subdomínio.
 *
 * SEGURANÇA: Esta função NÃO faz fallback para a primeira store disponível.
 * Se nenhum contexto puder ser determinado com certeza, retorna null.
 * Contexto organizacional é adquirido SOMENTE mediante ação explícita do usuário.
 */
export async function resolveTenantStoreId(): Promise<string | null> {
  // 1. Cookie de sessão de tenant (definido por setTenantContext ou após createBusinessProfile)
  const activeTenantCookie = getCookie("wider_active_tenant");
  if (activeTenantCookie) {
    return activeTenantCookie;
  }

  // 2. Subdomínio (ex: "minha-loja.wider.com.br" → slug = "minha-loja")
  const host = getRequestHeader("host");
  if (host) {
    const parts = host.split(".");
    if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "wider") {
      const slugToMatch = parts[0];
      const db = getAnonServerClient();
      const { data: matchedStore } = await db
        .from("stores")
        .select("id")
        .eq("slug", slugToMatch)
        .limit(1)
        .maybeSingle();

      if (matchedStore) {
        return matchedStore.id as string;
      }
    }
  }

  // 3. Sem cookie e sem subdomínio reconhecido → sem contexto organizacional.
  // O usuário está operando no escopo pessoal.
  // NÃO fazer fallback para a primeira store — isso criaria contexto silencioso.
  return null;
}
