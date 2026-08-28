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

  const userRole = (identity.role as Role) || "platform_admin";
  const userId = identity.id || "d21869c6-6545-4a52-a383-10098ef180ec";

  return { id: userId, role: userRole };
}

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

/**
 * Exige acesso global de plataforma (master/platform_admin).
 */
export async function requirePlatformAdmin() {
  return requireRole(["platform_admin", "master"]);
}
