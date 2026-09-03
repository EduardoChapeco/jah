import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Types & Schemas
// ---------------------------------------------------------------------------

export type SeatElementType =
  | "seat"
  | "aisle"
  | "wc"
  | "door"
  | "driver"
  | "stairs"
  | "empty"
  | "kitchen"
  | "guide";

export type SeatCategory =
  | "convencional"
  | "executivo"
  | "semi_leito"
  | "leito"
  | "leito_cama";

export interface SeatCell {
  r: number;
  c: number;
  type: SeatElementType;
  label: string;
  deck: number;
  category?: SeatCategory;
  status?: "available" | "blocked" | "accessible";
}

export const SeatCellSchema = z.object({
  r: z.number().int().min(0),
  c: z.number().int().min(0),
  type: z.enum(["seat", "aisle", "wc", "door", "driver", "stairs", "empty", "kitchen", "guide"]),
  label: z.string(),
  deck: z.number().int().min(1).default(1),
  category: z.enum(["convencional", "executivo", "semi_leito", "leito", "leito_cama"]).optional(),
  status: z.enum(["available", "blocked", "accessible"]).optional(),
});

export const CreateVehicleLayoutSchema = z.object({
  store_id: z.string().uuid(),
  name: z.string().min(1, "Nome do layout é obrigatório").max(120),
  vehicle_type: z.enum(["bus", "van", "plane", "microbus"]).default("bus"),
  total_capacity: z.number().int().min(1).default(46),
  rows: z.number().int().min(1).max(30).default(12),
  cols: z.number().int().min(2).max(10).default(5),
  is_double_decker: z.boolean().default(false),
  seat_map: z.array(SeatCellSchema).optional(),
});

export const UpdateVehicleLayoutSchema = z.object({
  store_id: z.string().uuid(),
  layout_id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  vehicle_type: z.enum(["bus", "van", "plane", "microbus"]).optional(),
  total_capacity: z.number().int().min(1).optional(),
  rows: z.number().int().min(1).max(30).optional(),
  cols: z.number().int().min(2).max(10).optional(),
  is_double_decker: z.boolean().optional(),
  deck1_label: z.string().optional(),
  deck2_label: z.string().optional().nullable(),
  seat_map: z.array(SeatCellSchema).optional(),
});

// Helper para gerar mapa padrão de ônibus (Single Deck ou Double Decker DD 1800)
export function generateDefaultBusSeatMap(rows = 12, cols = 5, isDoubleDecker = false): SeatCell[] {
  const map: SeatCell[] = [];
  let seatNumber = 1;

  if (isDoubleDecker) {
    // ─── PISO 1 (INFERIOR - LEITO CAMA VIP) ───
    const deck1Rows = 4;
    for (let r = 0; r < deck1Rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          if (c === 0) map.push({ r, c, type: "driver", label: "Motorista", deck: 1 });
          else if (c === 1) map.push({ r, c, type: "guide", label: "Guia", deck: 1 });
          else if (c === 2) map.push({ r, c, type: "aisle", label: "", deck: 1 });
          else if (c === cols - 1) map.push({ r, c, type: "door", label: "Porta", deck: 1 });
          else map.push({ r, c, type: "empty", label: "", deck: 1 });
        } else if (r === deck1Rows - 1 && c === cols - 1) {
          map.push({ r, c, type: "wc", label: "WC", deck: 1 });
        } else if (r === deck1Rows - 1 && c === 0) {
          map.push({ r, c, type: "stairs", label: "Escada", deck: 1 });
        } else if (c === 2) {
          map.push({ r, c, type: "aisle", label: "", deck: 1 });
        } else {
          const label = String(seatNumber).padStart(2, "0");
          map.push({
            r,
            c,
            type: "seat",
            label,
            deck: 1,
            category: "leito_cama",
            status: "available",
          });
          seatNumber++;
        }
      }
    }

    // ─── PISO 2 (SUPERIOR - PANORÂMICO SEMI-LEITO) ───
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === rows - 1 && c === 0) {
          map.push({ r, c, type: "stairs", label: "Escada", deck: 2 });
        } else if (c === 2) {
          map.push({ r, c, type: "aisle", label: "", deck: 2 });
        } else {
          const label = String(seatNumber).padStart(2, "0");
          map.push({
            r,
            c,
            type: "seat",
            label,
            deck: 2,
            category: "semi_leito",
            status: "available",
          });
          seatNumber++;
        }
      }
    }

    return map;
  }

  // ─── PISO ÚNICO (CONVENCIONAL / EXECUTIVO) ───
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0) {
        if (c === 0) {
          map.push({ r, c, type: "driver", label: "Motorista", deck: 1 });
        } else if (c === 1) {
          map.push({ r, c, type: "guide", label: "Guia", deck: 1 });
        } else if (c === 2) {
          map.push({ r, c, type: "aisle", label: "", deck: 1 });
        } else if (c === cols - 1) {
          map.push({ r, c, type: "door", label: "Porta", deck: 1 });
        } else {
          map.push({ r, c, type: "empty", label: "", deck: 1 });
        }
      } else if (r === rows - 1 && c === cols - 1) {
        map.push({ r, c, type: "wc", label: "WC", deck: 1 });
      } else if (c === 2) {
        map.push({ r, c, type: "aisle", label: "", deck: 1 });
      } else {
        const label = String(seatNumber).padStart(2, "0");
        map.push({
          r,
          c,
          type: "seat",
          label,
          deck: 1,
          category: "executivo",
          status: "available",
        });
        seatNumber++;
      }
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listVehicleLayouts = createServerFn({ method: "GET" })
  .validator((d: { store_id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: layouts, error } = await db
      .from("vehicle_layouts")
      .select("id, store_id, name, vehicle_type, total_capacity, rows, cols, is_double_decker, created_at, updated_at")
      .eq("store_id", data.store_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return layouts || [];
  });

export const getVehicleLayout = createServerFn({ method: "GET" })
  .validator((d: { store_id: string; layout_id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: layout, error } = await db
      .from("vehicle_layouts")
      .select("*")
      .eq("id", data.layout_id)
      .eq("store_id", data.store_id)
      .single();

    if (error) throw error;
    return layout;
  });

export const createVehicleLayout = createServerFn({ method: "POST" })
  .validator((d: unknown) => CreateVehicleLayoutSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const targetStoreId = data.store_id || identity.store_id;
    const seatMap =
      data.seat_map && data.seat_map.length > 0
        ? data.seat_map
        : generateDefaultBusSeatMap(data.rows, data.cols, data.is_double_decker);

    // Contar total de poltronas reais no mapa
    const capacity = seatMap.filter((cell) => cell.type === "seat").length || data.total_capacity;

    const { data: created, error } = await db
      .from("vehicle_layouts")
      .insert({
        store_id: targetStoreId,
        created_by_profile_id: identity.id,
        name: data.name.trim(),
        vehicle_type: data.vehicle_type,
        total_capacity: capacity,
        rows: data.rows,
        cols: data.cols,
        is_double_decker: data.is_double_decker,
        seat_map: seatMap,
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  });

export const updateVehicleLayout = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpdateVehicleLayoutSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.vehicle_type !== undefined) updatePayload.vehicle_type = data.vehicle_type;
    if (data.rows !== undefined) updatePayload.rows = data.rows;
    if (data.cols !== undefined) updatePayload.cols = data.cols;
    if (data.is_double_decker !== undefined) updatePayload.is_double_decker = data.is_double_decker;
    if (data.deck1_label !== undefined) updatePayload.deck1_label = data.deck1_label;
    if (data.deck2_label !== undefined) updatePayload.deck2_label = data.deck2_label;

    if (data.seat_map !== undefined) {
      updatePayload.seat_map = data.seat_map;
      // Atualizar total_capacity conforme número de poltronas
      updatePayload.total_capacity = data.seat_map.filter((c) => c.type === "seat").length;
    }

    const { data: updated, error } = await db
      .from("vehicle_layouts")
      .update(updatePayload)
      .eq("id", data.layout_id)
      .eq("store_id", data.store_id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  });

export const duplicateVehicleLayout = createServerFn({ method: "POST" })
  .validator((d: { store_id: string; layout_id: string; new_name: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: original, error: fetchErr } = await db
      .from("vehicle_layouts")
      .select("*")
      .eq("id", data.layout_id)
      .eq("store_id", data.store_id)
      .single();

    if (fetchErr) throw fetchErr;

    const { data: cloned, error: insertErr } = await db
      .from("vehicle_layouts")
      .insert({
        store_id: data.store_id,
        created_by_profile_id: identity.id,
        name: data.new_name.trim(),
        vehicle_type: original.vehicle_type,
        total_capacity: original.total_capacity,
        rows: original.rows,
        cols: original.cols,
        is_double_decker: original.is_double_decker,
        deck1_label: original.deck1_label,
        deck2_label: original.deck2_label,
        seat_map: original.seat_map,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return cloned;
  });

export const deleteVehicleLayout = createServerFn({ method: "POST" })
  .validator((d: { store_id: string; layout_id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db
      .from("vehicle_layouts")
      .delete()
      .eq("id", data.layout_id)
      .eq("store_id", data.store_id);

    if (error) throw error;
    return { success: true };
  });
