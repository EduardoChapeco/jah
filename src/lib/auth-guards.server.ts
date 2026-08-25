/**
 * Guardas de autorização — SERVIDOR APENAS.
 *
 * Consumidores devem importar de `@/lib/server-access`, que resolve este
 * módulo de forma preguiçosa e mantém o grafo do cliente limpo.
 */

import type { Role } from "@/types/domain";

/**
 * Ensures the caller is authenticated and has one of the allowed roles.
 * Supports multi-store memberships automatically.
 */
export async function requireRole(allowedRoles: Role[]): Promise<{ id: string; role: Role }> {
  const { getServerIdentity } = await import("./identity.server");
  const identity = await getServerIdentity();

  if (!identity.id) {
    throw new Error("Não autorizado. Sessão expirada ou ausente.");
  }

  let userRole = identity.role as Role;

  // Se o activeRole não está na lista mas o usuário possui membership com role permitida, eleva o contexto
  if (!allowedRoles.includes(userRole) && identity.memberships && identity.memberships.length > 0) {
    const matchingMembership = identity.memberships.find((m) =>
      allowedRoles.includes(m.role as Role),
    );
    if (matchingMembership) {
      userRole = matchingMembership.role as Role;
    }
  }

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Acesso negado. Requer um dos seguintes perfis: ${allowedRoles.join(", ")}`);
  }

  return { id: identity.id, role: userRole };
}

/**
 * Exige acesso operacional/administrativo ao workspace da loja.
 */
export async function requireAdmin() {
  return requireRole([
    "owner",
    "admin",
    "manager",
    "finance",
    "seller",
    "content",
    "support",
    "stock",
    "platform_admin",
    "master",
  ]);
}
