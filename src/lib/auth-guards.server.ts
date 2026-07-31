/**
 * Guardas de autorização — SERVIDOR APENAS.
 *
 * Consumidores devem importar de `@/lib/server-access`, que resolve este
 * módulo de forma preguiçosa e mantém o grafo do cliente limpo.
 */

import { getSSRClient } from "./supabase-ssr.server";
import type { Role } from "@/types/domain";

/**
 * Ensures the caller is authenticated and has one of the allowed roles.
 * Throws an Error if unauthorized, which TanStack Start translates to a failure.
 */
export async function requireRole(allowedRoles: Role[]): Promise<{ id: string; role: Role }> {
  const { getServerIdentity } = await import("./identity.server");
  const identity = await getServerIdentity();

  if (!identity.id) {
    throw new Error("Não autorizado. Sessão expirada ou ausente.");
  }

  const userRole = identity.role as Role;

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Acesso negado. Requer um dos seguintes perfis: ${allowedRoles.join(", ")}`);
  }

  return { id: identity.id, role: userRole };
}

/**
 * Convenience function to strictly require administrative/managerial access.
 */
export async function requireAdmin() {
  return requireRole(["owner", "admin", "manager", "finance"]);
}
