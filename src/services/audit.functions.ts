import { getServerClient } from "@/lib/supabase";
import type { ServerIdentity } from "@/lib/identity-core";
import { createServerFn } from "@tanstack/react-start";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { z } from "zod";

/**
 * Logs an immutable audit action into the `audit_logs` table.
 * Used for financial, HR, and RMA operations.
 */
export async function logAuditAction(
  identity: ServerIdentity,
  action: string,
  entityType: string,
  entityId: string | null = null,
  payloadSnapshot: any = {}
) {
  if (!identity.store_id || !identity.id) return;

  const supabase = getServerClient();
  
  await supabase.from("audit_logs").insert({
    store_id: identity.store_id,
    user_id: identity.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload_snapshot: payloadSnapshot,
  });
}

/**
 * Gets audit logs for admins
 */
export const getAuditLog = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*, profiles!audit_logs_user_id_fkey(full_name)")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !logs) return [];

    return logs;
  });
