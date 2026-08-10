import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export const requestOrderReturn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      items: z.array(
        z.object({
          order_item_id: z.string().uuid(),
          qty: z.number().int().positive(),
          reason: z.string().min(1),
        }),
      ),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: { orderId, items, notes } }) => {
    try {
      const identity = await getServerIdentity();
      // Only staff can do this on behalf of customer in this admin route.
      await assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance"]);

      const db = getServerClient();
      const { data: order } = await db
        .from("orders")
        .select("customer_id")
        .eq("id", orderId)
        .single();

      if (!order) throw new Error("Pedido não encontrado");

      const { data, error } = await db.rpc("request_order_return", {
        p_store_id: identity.store_id,
        p_customer_id: order.customer_id,
        p_order_id: orderId,
        p_items: items,
        p_notes: notes || "Solicitado via painel admin",
      });

      if (error) throw error;
      return { rmaId: data };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[RMA] requestOrderReturn:", e.message);
      throw new Error(e.message || "Erro ao solicitar devolução.");
    }
  });

export const requestCustomerRma = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      items: z.array(
        z.object({
          order_item_id: z.string().uuid(),
          qty: z.number().int().positive(),
          reason: z.string().min(1),
        }),
      ),
      type: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: { orderId, items, type, notes } }) => {
    try {
      const identity = await getServerIdentity();

      const db = getServerClient();

      // Verify the order belongs to the customer
      const { data: order } = await db
        .from("orders")
        .select("customer_id, store_id")
        .eq("id", orderId)
        .eq("customer_id", identity.id)
        .single();

      if (!order) throw new Error("Pedido não encontrado ou não pertence a você.");

      const { data, error } = await db.rpc("request_order_return", {
        p_store_id: order.store_id,
        p_customer_id: identity.id,
        p_order_id: orderId,
        p_items: items,
        p_notes: notes || `Solicitado via portal B2C (${type || "dev"})`,
      });

      if (error) throw error;
      return { rmaId: data };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[RMA] requestCustomerRma:", e.message);
      throw new Error(e.message || "Erro ao solicitar devolução.");
    }
  });

export const inspectRmaItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      rmaItemId: z.string().uuid(),
      qty: z.number().int().positive(),
      condition: z.enum(["perfect", "damaged", "wrong_item"]),
      destination: z.enum(["restock", "discard", "return_to_supplier", "quarantine"]),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, ["owner", "admin", "manager", "logistics", "stock"]);

      const db = getServerClient();
      const { error } = await db.rpc("inspect_rma_item", {
        p_rma_item_id: data.rmaItemId,
        p_inspector_id: identity.id,
        p_qty: data.qty,
        p_condition: data.condition,
        p_destination: data.destination,
        p_notes: data.notes || null,
      });

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[RMA] inspectRmaItem:", e.message);
      throw new Error(e.message || "Erro ao registrar inspeção do item.");
    }
  });

// Advanced Refactoring of admin.pedidos.trocas.tsx
export const listAdminRmas = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getServerIdentity();
    await assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "finance"]);

    const db = getServerClient();
    const { data, error } = await db
      .from("rma_requests")
      .select(
        `
          id,
          order_id,
          status,
          type,
          created_at,
          orders:order_id ( public_token ),
          profiles:customer_id ( full_name )
        `,
      )
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((rma: any) => ({
      id: rma.id,
      orderToken: rma.orders?.public_token || "N/A",
      customerName: rma.profiles?.full_name || "Cliente Excluído",
      type: rma.type,
      status: rma.status,
      requestedAt: rma.created_at,
    }));
  } catch (e: any) {
    if (e instanceof SupabaseUnconfiguredError) return [];
    console.error("[RMA] listAdminRmas:", e.message);
    return [];
  }
});

export const updateRmaStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      rmaId: z.string().uuid(),
      status: z.enum(["authorized", "received", "resolved", "rejected", "cancelled"]),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, ["owner", "admin", "manager", "finance", "logistics"]);

      const db = getServerClient();
      const { error } = await db
        .from("rma_requests")
        .update({ status: data.status, updated_at: new Date().toISOString() })
        .eq("id", data.rmaId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[RMA] updateRmaStatus:", e.message);
      throw new Error(e.message || "Erro ao atualizar status do RMA.");
    }
  });

export const resolveRmaWithCredit = createServerFn({ method: "POST" })
  .validator(
    z.object({
      rmaId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const identity = await getServerIdentity();
      await assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

      const db = getServerClient();

      // Update RMA to resolved
      const { error: rmaError } = await db
        .from("rma_requests")
        .update({ status: "resolved", updated_at: new Date().toISOString() })
        .eq("id", data.rmaId)
        .eq("store_id", identity.store_id);

      if (rmaError) throw rmaError;

      // Granting credit logic would be here via an RPC `grant_customer_credit`
      // For now we just return success as the refund engine is another domain
      return { success: true, creditAmount: 0 };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[RMA] resolveRmaWithCredit:", e.message);
      throw new Error(e.message || "Erro ao resolver RMA com crédito.");
    }
  });
