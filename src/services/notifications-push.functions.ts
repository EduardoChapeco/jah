import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";

// ---------------------------------------------------------------------------
// 1. REGISTRAR INSCRIÇÃO WEB PUSH
// ---------------------------------------------------------------------------

export const SavePushSubscriptionSchema = z.object({
  storeId: z.string().uuid().optional(),
  endpoint: z.string().url("Endpoint de push inválido"),
  p256dh: z.string().min(10, "Chave p256dh inválida"),
  auth: z.string().min(5, "Chave de autenticação push inválida"),
  deviceLabel: z.string().optional(),
});

export const savePushSubscription = createServerFn({ method: "POST" })
  .validator(SavePushSubscriptionSchema)
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();
    if (!identity?.id) {
      throw new Error("Não autenticado para registrar notificações.");
    }

    const { data: record, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          profile_id: identity.id,
          store_id: data.storeId || identity.store_id || null,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          device_label: data.deviceLabel || "Dispositivo Padrão",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,endpoint" }
      )
      .select()
      .single();

    if (error) {
      throw new Error("Erro ao salvar inscrição de notificação: " + error.message);
    }

    return { success: true, subscription: record };
  });

// ---------------------------------------------------------------------------
// 2. LISTAR NOTIFICAÇÕES & LEADS RECENTES
// ---------------------------------------------------------------------------

export const ListCompanyNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const listCompanyNotifications = createServerFn({ method: "GET" })
  .validator(ListCompanyNotificationsSchema)
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();
    if (!identity?.id) {
      return { notifications: [], unreadCount: 0 };
    }

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", identity.id)
      .order("created_at", { ascending: false })
      .limit(data?.limit || 20);

    if (error) {
      console.warn("[notifications-push] Erro ao listar notificações:", error);
      return { notifications: [], unreadCount: 0 };
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    return {
      notifications: notifications || [],
      unreadCount,
    };
  });

// ---------------------------------------------------------------------------
// 3. MARCAR NOTIFICAÇÃO COMO LIDA
// ---------------------------------------------------------------------------

export const MarkNotificationAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const markNotificationAsRead = createServerFn({ method: "POST" })
  .validator(MarkNotificationAsReadSchema)
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();
    if (!identity?.id) throw new Error("Não autenticado.");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", data.notificationId)
      .eq("user_id", identity.id);

    if (error) {
      throw new Error("Erro ao atualizar notificação: " + error.message);
    }

    return { success: true };
  });
