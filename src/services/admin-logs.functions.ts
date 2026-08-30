import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { requirePlatformAdmin } from "@/lib/server-access";

export const getSystemLogs = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePlatformAdmin();
    const db = getServerClient();
    const { data, error } = await db
      .from("system_error_logs")
      .select(`
        id, route, error_message, stack_trace, severity, payload, created_at,
        user_id,
        profiles!system_error_logs_user_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }
);
