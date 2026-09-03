import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";
import { z } from "zod";

export interface StoreTableReservation {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: "pending" | "confirmed" | "seated" | "cancelled" | "no_show";
  special_requests?: string;
  assigned_table?: string;
  created_at: string;
  updated_at: string;
}

// 1. Listar Reservas da Loja
export const listStoreReservations = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        filter: z.enum(["upcoming", "past", "today", "all"]).default("upcoming"),
      })
      .optional(),
  )
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity();
    if (!identity.store_id) {
      throw new Error("Nenhuma loja ativa selecionada.");
    }

    const filter = input?.filter || "upcoming";
    const todayStr = new Date().toISOString().split("T")[0];
    const db = getServerClient();

    let query = db
      .from("store_table_reservations")
      .select("*")
      .eq("store_id", identity.store_id);

    if (filter === "upcoming") {
      query = query
        .gte("reservation_date", todayStr)
        .in("status", ["pending", "confirmed"])
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });
    } else if (filter === "past") {
      query = query
        .or(`reservation_date.lt.${todayStr},status.in.(seated,cancelled,no_show)`)
        .order("reservation_date", { ascending: false })
        .order("reservation_time", { ascending: false });
    } else if (filter === "today") {
      query = query
        .eq("reservation_date", todayStr)
        .order("reservation_time", { ascending: true });
    } else {
      query = query
        .order("reservation_date", { ascending: false })
        .order("reservation_time", { ascending: false });
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error("[listStoreReservations] Erro:", error);
      throw new Error("Falha ao carregar reservas.");
    }

    return (data || []) as StoreTableReservation[];
  });

// 2. Criar Nova Reserva (Pelo Balcão ou Público)
export const createStoreReservation = createServerFn({ method: "POST" })
  .validator(
    z.object({
      store_id: z.string().uuid().optional(),
      customer_name: z.string().min(2, "Nome do cliente é obrigatório"),
      customer_phone: z.string().min(8, "Telefone é obrigatório"),
      party_size: z.number().int().min(1).max(50).default(2),
      reservation_date: z.string().min(10, "Data da reserva é obrigatória (YYYY-MM-DD)"),
      reservation_time: z.string().min(4, "Horário é obrigatório (HH:MM)"),
      special_requests: z.string().optional(),
      assigned_table: z.string().optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    let targetStoreId = input.store_id;

    if (!targetStoreId) {
      const identity = await getServerIdentity();
      if (!identity.store_id) {
        throw new Error("Loja de destino não informada.");
      }
      targetStoreId = identity.store_id;
    }

    const cleanPhone = input.customer_phone.replace(/\D/g, "");
    const db = getServerClient();

    const { data, error } = await db
      .from("store_table_reservations")
      .insert({
        store_id: targetStoreId,
        customer_name: input.customer_name,
        customer_phone: cleanPhone,
        party_size: input.party_size,
        reservation_date: input.reservation_date,
        reservation_time: input.reservation_time,
        special_requests: input.special_requests || null,
        assigned_table: input.assigned_table || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[createStoreReservation] Erro:", error);
      throw new Error("Falha ao criar reserva.");
    }

    return data as StoreTableReservation;
  });

// 3. Atualizar Status da Reserva (Confirmar, Acomodar, Cancelar, No-Show)
export const updateReservationStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      reservation_id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "seated", "cancelled", "no_show"]),
      assigned_table: z.string().optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity();
    if (!identity.store_id) {
      throw new Error("Nenhuma loja ativa selecionada.");
    }

    const db = getServerClient();

    const updatePayload: any = {
      status: input.status,
      updated_at: new Date().toISOString(),
    };

    if (input.assigned_table !== undefined) {
      updatePayload.assigned_table = input.assigned_table || null;
    }

    const { data, error } = await db
      .from("store_table_reservations")
      .update(updatePayload)
      .eq("id", input.reservation_id)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) {
      console.error("[updateReservationStatus] Erro:", error);
      throw new Error("Falha ao atualizar status da reserva.");
    }

    return data as StoreTableReservation;
  });

// 4. Excluir Reserva
export const deleteStoreReservation = createServerFn({ method: "POST" })
  .validator(
    z.object({
      reservation_id: z.string().uuid(),
    }),
  )
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity();
    if (!identity.store_id) {
      throw new Error("Nenhuma loja ativa selecionada.");
    }

    const db = getServerClient();

    const { error } = await db
      .from("store_table_reservations")
      .delete()
      .eq("id", input.reservation_id)
      .eq("store_id", identity.store_id);

    if (error) {
      console.error("[deleteStoreReservation] Erro:", error);
      throw new Error("Falha ao remover reserva.");
    }

    return { success: true };
  });

// ============================================================
// Planta do Salão 2D & Gestão de Mesas Personalizadas
// ============================================================

export const DEFAULT_CANONICAL_TABLES = [
  { id: "t01", label: "Mesa 01", seats: 4, col: 1, row: 1, shape: "square" },
  { id: "t02", label: "Mesa 02", seats: 4, col: 2, row: 1, shape: "square" },
  { id: "t03", label: "Mesa 03", seats: 4, col: 3, row: 1, shape: "square" },
  { id: "t04", label: "Mesa 04", seats: 4, col: 4, row: 1, shape: "square" },
  { id: "t05", label: "Mesa 05", seats: 4, col: 1, row: 2, shape: "square" },
  { id: "t06", label: "Mesa 06", seats: 4, col: 2, row: 2, shape: "square" },
  { id: "t07", label: "Mesa 07", seats: 4, col: 3, row: 2, shape: "square" },
  { id: "t08", label: "Mesa 08", seats: 4, col: 4, row: 2, shape: "square" },
  { id: "t09", label: "Mesa 09", seats: 2, col: 1, row: 3, shape: "round" },
  { id: "t10", label: "Mesa 10", seats: 2, col: 2, row: 3, shape: "round" },
  { id: "t11", label: "Mesa 11", seats: 2, col: 3, row: 3, shape: "round" },
  { id: "t12", label: "Varanda", seats: 10, col: 4, row: 3, shape: "wide" },
];

export const salonTableSchema = z.object({
  id: z.string(),
  label: z.string(),
  seats: z.number().int().positive(),
  col: z.number().int().positive(),
  row: z.number().int().positive(),
  shape: z.enum(["square", "round", "wide"]).default("square"),
});

export const saveStoreFloorPlanSchema = z.object({
  store_id: z.string().uuid().optional(),
  name: z.string().default("Salão Principal"),
  grid_cols: z.number().int().min(2).max(12).default(4),
  grid_rows: z.number().int().min(2).max(12).default(3),
  tables: z.array(salonTableSchema),
});

/**
 * 5. Obter Planta do Salão da Loja (Persistida no Banco)
 */
export const getStoreFloorPlan = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        store_id: z.string().uuid().optional(),
        name: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity().catch(() => null);
    const targetStoreId = input?.store_id || identity?.store_id;

    if (!targetStoreId) {
      return {
        name: "Salão Principal",
        grid_cols: 4,
        grid_rows: 3,
        tables: DEFAULT_CANONICAL_TABLES,
        is_customized: false,
      };
    }

    const db = getServerClient();
    const planName = input?.name || "Salão Principal";

    const { data: plan, error } = await db
      .from("store_floor_plans")
      .select("*")
      .eq("store_id", targetStoreId)
      .eq("name", planName)
      .maybeSingle();

    if (error || !plan) {
      return {
        name: planName,
        grid_cols: 4,
        grid_rows: 3,
        tables: DEFAULT_CANONICAL_TABLES,
        is_customized: false,
      };
    }

    return {
      id: plan.id,
      store_id: plan.store_id,
      name: plan.name,
      grid_cols: plan.grid_cols,
      grid_rows: plan.grid_rows,
      tables: (plan.tables as any) || DEFAULT_CANONICAL_TABLES,
      is_customized: true,
      updated_at: plan.updated_at,
    };
  });

/**
 * 6. Salvar ou Atualizar Planta do Salão da Loja
 */
export const saveStoreFloorPlan = createServerFn({ method: "POST" })
  .validator(saveStoreFloorPlanSchema)
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity();
    const targetStoreId = input.store_id || identity.store_id;

    if (!targetStoreId) {
      throw new Error("Nenhuma loja ativa selecionada.");
    }

    const db = getServerClient();
    const planName = input.name || "Salão Principal";

    const payload = {
      store_id: targetStoreId,
      name: planName,
      grid_cols: input.grid_cols,
      grid_rows: input.grid_rows,
      tables: input.tables,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error } = await db
      .from("store_floor_plans")
      .upsert(payload, { onConflict: "store_id, name" })
      .select()
      .single();

    if (error) {
      console.error("[saveStoreFloorPlan] Erro ao persistir planta:", error);
      throw new Error(`Falha ao salvar planta do salão: ${error.message}`);
    }

    return saved;
  });

