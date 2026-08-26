/**
 * notifications.functions.ts — BFF Server Functions para o Sistema Central de Notificações
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export type NotificationType = "interaction" | "promotion" | "opportunity" | "order" | "system";

export interface NotificationItemDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  avatarUrl?: string | null;
  authorName?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const listUserNotifications = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        type: z.enum(["all", "interaction", "promotion", "opportunity", "order", "system"]).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();
    const userId = identity.customer_id;
    const limit = data?.limit ?? 30;

    if (!userId) {
      return [];
    }

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (data?.type && data.type !== "all") {
        query = query.eq("type", data.type);
      }

      const { data: rows, error } = await query;

      if (error) {
        console.error("[notifications.functions] Erro ao buscar notificações:", error);
        return [];
      }

      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        type: (r.type as NotificationType) || "system",
        title: r.title,
        message: r.message,
        avatarUrl: r.avatar_url || null,
        authorName: r.author_name || null,
        linkUrl: r.link_url || null,
        isRead: !!r.is_read,
        createdAt: r.created_at,
      })) as NotificationItemDTO[];
    } catch (e) {
      console.warn("[notifications.functions] Erro ao listar notificações:", e);
      return [];
    }
  });

export const markNotificationAsRead = createServerFn({ method: "POST" })
  .validator(z.object({ notificationId: z.string() }))
  .handler(async ({ data: { notificationId } }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();
    if (!identity.customer_id) return { success: false };

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", identity.customer_id);

      return { success: true };
    } catch (e) {
      return { success: true };
    }
  });

export const markAllNotificationsAsRead = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();
  if (!identity.customer_id) return { success: false };

  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", identity.customer_id)
      .eq("is_read", false);

    return { success: true };
  } catch (e) {
    return { success: true };
  }
});
