import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export const startPickingSession = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(async ({ data: { orderId } }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, [
        "owner",
        "admin",
        "manager",
        "logistics",
        "operator",
        "stock",
      ]);

      const db = getServerClient();

      const { data, error } = await db.rpc("start_wms_picking", {
        p_order_id: orderId,
        p_operator_id: identity.id,
        p_store_id: identity.store_id,
      });

      if (error) throw error;

      return { sessionId: data };
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[WMS] startPickingSession:", e instanceof Error ? e.message : String(e));
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao iniciar sessão de separação.",
      );
    }
  });

export const getPickingSessionItems = createServerFn({ method: "GET" })
  .validator(z.object({ sessionId: z.string().uuid() }))
  .handler(async ({ data: { sessionId } }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, [
        "owner",
        "admin",
        "manager",
        "logistics",
        "operator",
        "stock",
      ]);

      const db = getServerClient();
      const { data, error } = await db
        .from("wms_picking_items")
        .select("id, order_item_id, qty_expected, qty_picked")
        .eq("session_id", sessionId);

      if (error) throw error;
      return data;
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[WMS] getPickingSessionItems:", e instanceof Error ? e.message : String(e));
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao buscar itens da sessão.",
      );
    }
  });

export const pickWmsItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      sessionId: z.string().uuid(),
      orderItemId: z.string().uuid(),
      qty: z.number().int().positive(),
    }),
  )
  .handler(async ({ data: { sessionId, orderItemId, qty } }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, [
        "owner",
        "admin",
        "manager",
        "logistics",
        "operator",
        "stock",
      ]);

      const db = getServerClient();
      const { error } = await db.rpc("pick_wms_item", {
        p_session_id: sessionId,
        p_order_item_id: orderItemId,
        p_qty: qty,
      });

      if (error) throw error;
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[WMS] pickWmsItem:", e instanceof Error ? e.message : String(e));
      throw new Error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao registrar conferência do item.",
      );
    }
  });

export const completePickingSession = createServerFn({ method: "POST" })
  .validator(z.object({ sessionId: z.string().uuid() }))
  .handler(async ({ data: { sessionId } }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, [
        "owner",
        "admin",
        "manager",
        "logistics",
        "operator",
        "stock",
      ]);

      const db = getServerClient();
      const { error } = await db.rpc("complete_wms_picking", {
        p_session_id: sessionId,
        p_operator_id: identity.id,
      });

      if (error) throw error;
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[WMS] completePickingSession:", e instanceof Error ? e.message : String(e));
      throw new Error(
        (e instanceof Error ? e.message : String(e)) ||
          "Erro ao finalizar separação. Verifique se todos os itens foram conferidos.",
      );
    }
  });
