/**
 * Identity core Commerce
 *
 * Tipos e validações puras de identidade. Este módulo NÃO importa nada de
 * servidor, portanto pode ser importado com segurança de qualquer lugar
 * (inclusive de módulos alcançáveis pelo grafo do cliente).
 */

export interface ServerIdentity {
  /** auth.users.id — null se não autenticado */
  id: string | null;
  /** role do perfil no contexto ativo — 'customer' como fallback */
  role: string;
  /** store_id do contexto ativo (loja sendo acessada) — null se puramente pessoal */
  store_id: string | null;
  /** Lista de lojas/workspaces que o usuário faz parte e seus respectivos papéis */
  memberships: {
    store_id: string;
    role: string;
    name?: string;
    slug?: string;
    logo_url?: string;
  }[];
}

export const STAFF_ROLES = [
  "owner",
  "admin",
  "manager",
  "seller",
  "finance",
  "content",
  "support",
  "stock",
] as const;

/**
 * Asserts que o usuário tem acesso de staff à loja ou é platform_admin global.
 * Lança Error se não autorizado.
 */
export function assertStoreAccess(
  identity: ServerIdentity,
  allowedRoles: readonly string[] | string[] = STAFF_ROLES,
): asserts identity is ServerIdentity & { id: string; store_id: string } {
  if (!identity.id) {
    throw new Error("Não autorizado. Faça login para continuar.");
  }

  if (identity.role === "platform_admin" || identity.role === "master") {
    if (!identity.store_id) {
      (identity as any).store_id = "00000000-0000-0000-0000-000000000001";
    }
    return;
  }

  if (
    !identity.store_id ||
    !(allowedRoles as readonly string[]).includes(identity.role)
  ) {
    throw new Error("Não autorizado. Requer permissão de equipe na loja.");
  }
}
