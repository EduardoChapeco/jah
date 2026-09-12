import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { requirePlatformAdmin } from "@/lib/server-access";

export const getSystemLogs = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePlatformAdmin();
    const db = getServerClient();
    const { data, error } = await db
      .from("system_error_logs")
      .select("id, route, error_message, stack_trace, severity, payload, created_at, user_id, contract_name, page_url")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[getSystemLogs] Error fetching logs:", error);
      return [];
    }

    const logs = data || [];
    const userIds = [...new Set(logs.map((l: any) => l.user_id).filter(Boolean))];
    let profileMap = new Map<string, any>();
    if (userIds.length > 0) {
      try {
        const { data: profs } = await db
          .from("profiles")
          .select("id, full_name, username")
          .in("id", userIds);
        (profs || []).forEach((p: any) => profileMap.set(p.id, p));
      } catch (e) {
        console.warn("[getSystemLogs] Could not fetch profiles for logs:", e);
      }
    }

    return logs.map((log: any) => {
      const prof = profileMap.get(log.user_id);
      return {
        ...log,
        profiles: prof ? { full_name: prof.full_name || prof.username || "Usuário", email: "" } : null,
      };
    });
  }
);
