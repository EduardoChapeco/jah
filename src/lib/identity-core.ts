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
    throw new Error("Unauthorized: User not authenticated.");
  }

  if (!identity.store_id) {
    if (identity.memberships?.[0]?.store_id) {
      (identity as any).store_id = identity.memberships[0].store_id;
    } else {
      throw new Error("Unauthorized: No active store context found.");
    }
  }

  if (identity.role === "platform_admin" || identity.role === "master") {
    return; // Global admins have access
  }

  if (!(allowedRoles as readonly string[]).includes(identity.role)) {
    throw new Error(`Unauthorized: Insufficient role (${identity.role}). Required one of: ${allowedRoles.join(", ")}`);
  }
}

