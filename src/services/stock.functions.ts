import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";

import { getServerIdentity, requireAdmin } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Handlers (decoupled for unit testing)
// ---------------------------------------------------------------------------

export async function getStockLevelsHandler(params: { search?: string }, store_id: string) {
  const db = getServerClient();

  let query = db
    .from("product_variants")
    .select(
      `
      id, sku, stock_on_hand,
      products!inner ( id, title, status, store_id )
    `,
    )
    .eq("products.store_id", store_id)
    .order("sku");

  if (params.search) {
    query = query.ilike("sku", `%${params.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export const getStockLevels = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        search: z.string().optional(),
      })
      .default({}),
  )
  .handler(async ({ data: params }) => {
    try {
      await requireAdmin();
      const identity = await getServerIdentity();
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      const data = await getStockLevelsHandler(params, identity.store_id);
      return data;
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[stock.functions] getStockLevels:", e.message);
      throw new Error("Erro ao buscar estoque.");
    }
  });

// ---------------------------------------------------------------------------

export async function adjustStockHandler(params: {
  variantId: string;
  qty: number;
  movementType: "purchase" | "adjustment" | "damage" | "transfer" | "return";
  note?: string;
}, store_id: string) {
  const db = getServerClient();

  // Verify ownership
  const { data: variant, error: vError } = await db
    .from("product_variants")
    .select("id, products!inner(store_id)")
    .eq("id", params.variantId)
    .eq("products.store_id", store_id)
    .single();

  if (vError || !variant) throw new Error("Variante não encontrada ou acesso negado");

  const { error } = await db.rpc("adjust_stock", {
    p_variant_id: params.variantId,
    p_qty: params.qty,
    p_movement_type: params.movementType,
    p_note: params.note || null,
  });

  if (error) throw error;
  return { status: "ok" as const, message: "Estoque ajustado com sucesso." };
}

export const adjustStock = createServerFn({ method: "POST" })
  .validator(
    z.object({
      variantId: z.string().uuid(),
      qty: z.number().int(),
      movementType: z.enum(["purchase", "adjustment", "damage", "transfer", "return"]),
      note: z.string().optional(),
    }),
  )
  .handler(async ({ data: params }) => {
    try {
      await requireAdmin();
      const identity = await getServerIdentity();
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      return await adjustStockHandler(params, identity.store_id);
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[stock.functions] adjustStock:", e.message);
      throw new Error(e.message || "Erro ao ajustar estoque.");
    }
  });

// ---------------------------------------------------------------------------

export async function getStockMovementsHandler(limit: number, store_id: string) {
  const db = getServerClient();

  const { data, error } = await db
    .from("stock_movements")
    .select(
      `
      id,
      movement_type,
      qty,
      reference_type,
      note,
      created_at,
      actor_id,
      variant:product_variants!inner(
        sku,
        product:products!inner(title, store_id)
      )
    `,
    )
    .eq("variant.product.store_id", store_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export const getStockMovements = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().default(50),
      })
      .default({}),
  )
  .handler(async ({ data: { limit } }) => {
    try {
      await requireAdmin();
      const identity = await getServerIdentity();
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      const data = await getStockMovementsHandler(limit, identity.store_id);
      return data;
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[stock.functions] getStockMovements:", e.message);
      throw new Error("Erro ao buscar ledger de estoque.");
    }
  });

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const performStockAudit = createServerFn({ method: "POST" })
  .validator(
    z.object({
      variantId: z.string().uuid(),
      countedQty: z.number().int().min(0),
      reason: z.enum(["recount", "loss", "damage", "return_defect"]),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: { variantId, countedQty, reason, notes } }) => {
    try {
      await requireAdmin();
      const identity = await getServerIdentity();
      if (!identity.store_id) throw new Error("Contexto de loja inválido");

      const db = getServerClient();

      // Verify ownership
      const { data: variant, error: vError } = await db
        .from("product_variants")
        .select("id, products!inner(store_id)")
        .eq("id", variantId)
        .eq("products.store_id", identity.store_id)
        .single();

      if (vError || !variant) throw new Error("Acesso negado");

      const { data, error } = await db.rpc("perform_stock_audit", {
        p_variant_id: variantId,
        p_counted_qty: countedQty,
        p_reason: reason,
        p_notes: notes || null,
      });

      if (error) throw error;
      return data;
    } catch (e: any) {
      console.error("[stock.functions] performStockAudit:", e.message);
      throw new Error(e.message || "Erro ao realizar auditoria.");
    }
  });
