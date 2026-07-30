/**
 * Identity core — Jah Commerce
 *
 * Tipos e validações puras de identidade. Este módulo NÃO importa nada de
 * servidor, portanto pode ser importado com segurança de qualquer lugar
 * (inclusive de módulos alcançáveis pelo grafo do cliente).
 */

export interface ServerIdentity {
  /** auth.users.id — null se não autenticado */
  id: string | null;
  /** role do perfil — 'customer' como fallback */
  role: string;
  /** store_id do perfil — null se não vinculado à loja */
  store_id: string | null;
  /** organization_id — null se não vinculado */
  organization_id: string | null;
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
 * Asserts que o usuário tem acesso de staff à loja.
 * Lança Error se não autorizado.
 */
export function assertStoreAccess(
  identity: ServerIdentity,
  allowedRoles: string[] = [...STAFF_ROLES],
): asserts identity is ServerIdentity & { id: string; store_id: string } {
  if (!identity.id || !identity.store_id || !allowedRoles.includes(identity.role)) {
    throw new Error("Não autorizado");
  }
}
