/**
 * group-tours.functions.ts — BFF para Gestão de Grupos Terrestres, Mapa de Ônibus & Rooming List
 * Padrão BigTech | Zero Mocks | Persistência Real no Supabase
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

// ─── Tipagens Canônicas de Grupos Terrestres ──────────────────────────────────

export interface BusSeatDTO {
  seat_number: number;
  row: number;
  column: "A" | "B" | "C" | "D"; // A/B lado esquerdo, C/D lado direito
  floor: 1 | 2; // Para double-decker
  status: "free" | "reserved" | "blocked";
  passenger_name?: string | null;
  passenger_document?: string | null;
  passenger_phone?: string | null;
  boarding_point?: string | null;
}

export interface HotelRoomAllocationDTO {
  room_id: string;
  room_number?: string | null;
  room_type: "single" | "double_couple" | "double_twin" | "triple" | "quadruple";
  hotel_name: string;
  capacity: number;
  passengers: Array<{
    name: string;
    document?: string;
    phone?: string;
    notes?: string;
  }>;
}

export type GroupTourStatus = "open" | "confirmed" | "closed" | "completed" | "cancelled";

export interface GroupTourDTO {
  id: string;
  store_id: string | null;
  title: string;
  destination: string;
  departure_city: string;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  bus_company_name?: string | null;
  bus_plate?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  total_seats: number;
  seats: BusSeatDTO[];
  rooms: HotelRoomAllocationDTO[];
  price_cents: number;
  included_items: string[];
  status: GroupTourStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Gerador de Layout Padrão de Ônibus 46 Lugares ────────────────────────────

export function generateDefaultBusSeats(totalSeats: number = 46): BusSeatDTO[] {
  const seats: BusSeatDTO[] = [];
  const rows = Math.ceil(totalSeats / 4);

  let currentSeat = 1;
  for (let r = 1; r <= rows; r++) {
    const cols: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];
    for (const col of cols) {
      if (currentSeat <= totalSeats) {
        seats.push({
          seat_number: currentSeat,
          row: r,
          column: col,
          floor: 1,
          status: "free",
        });
        currentSeat++;
      }
    }
  }
  return seats;
}

// ─── 1. Criação de Viagem em Grupo / Excursão ─────────────────────────────────

export const createGroupTour = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(3, "Título obrigatório"),
      destination: z.string().min(2, "Destino obrigatório"),
      departureCity: z.string().min(2, "Cidade de saída obrigatória"),
      departureDate: z.string().min(1, "Data de saída obrigatória"),
      departureTime: z.string().default("06:00"),
      returnDate: z.string().min(1, "Data de retorno obrigatória"),
      returnTime: z.string().default("20:00"),
      totalSeats: z.number().int().min(10).max(60).default(46),
      priceCents: z.number().int().min(0).default(0),
      includedItems: z.array(z.string()).default([]),
      notes: z.string().optional(),
    })
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; id: string }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado.");
    }

    const defaultSeats = generateDefaultBusSeats(input.totalSeats);

    const { data: inserted, error } = await supabase
      .from("travel_group_tours")
      .insert({
        store_id: identity.store_id || null,
        created_by_profile_id: identity.id,
        title: input.title.trim(),
        destination: input.destination.trim(),
        departure_city: input.departureCity.trim(),
        departure_date: input.departureDate,
        departure_time: input.departureTime,
        return_date: input.returnDate,
        return_time: input.returnTime,
        total_seats: input.totalSeats,
        seats: defaultSeats,
        rooms: [],
        price_cents: input.priceCents,
        included_items: input.includedItems,
        notes: input.notes?.trim() || null,
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[group-tours.functions] Erro ao criar grupo terrestre:", error);
      throw new Error("Falha ao salvar grupo terrestre: " + error.message);
    }

    return { success: true, id: inserted.id };
  });

// ─── 2. Buscar Grupo Terrestre por ID (Workspace) ─────────────────────────────

export const getGroupTourById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<GroupTourDTO | null> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado.");
    }

    const { data: row, error } = await supabase
      .from("travel_group_tours")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    return {
      id: row.id,
      store_id: row.store_id,
      title: row.title,
      destination: row.destination,
      departure_city: row.departure_city,
      departure_date: row.departure_date,
      departure_time: row.departure_time,
      return_date: row.return_date,
      return_time: row.return_time,
      bus_company_name: row.bus_company_name,
      bus_plate: row.bus_plate,
      driver_name: row.driver_name,
      driver_phone: row.driver_phone,
      total_seats: row.total_seats || 46,
      seats: row.seats || generateDefaultBusSeats(row.total_seats || 46),
      rooms: row.rooms || [],
      price_cents: row.price_cents || 0,
      included_items: row.included_items || [],
      status: row.status || "open",
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

// ─── 3. Atualizar Alocação de Poltronas e Quartos ─────────────────────────────

export const updateGroupTourAllocations = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      seats: z.array(z.any()).optional(),
      rooms: z.array(z.any()).optional(),
      busCompanyName: z.string().optional().nullable(),
      busPlate: z.string().optional().nullable(),
      driverName: z.string().optional().nullable(),
      driverPhone: z.string().optional().nullable(),
      status: z.enum(["open", "confirmed", "closed", "completed", "cancelled"]).optional(),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado.");
    }

    const patch: any = { updated_at: new Date().toISOString() };
    if (data.seats) patch.seats = data.seats;
    if (data.rooms) patch.rooms = data.rooms;
    if (data.busCompanyName !== undefined) patch.bus_company_name = data.busCompanyName;
    if (data.busPlate !== undefined) patch.bus_plate = data.busPlate;
    if (data.driverName !== undefined) patch.driver_name = data.driverName;
    if (data.driverPhone !== undefined) patch.driver_phone = data.driverPhone;
    if (data.status) patch.status = data.status;

    const { error } = await supabase
      .from("travel_group_tours")
      .update(patch)
      .eq("id", data.id);

    if (error) {
      console.error("[group-tours.functions] Erro ao atualizar alocações:", error);
      throw new Error("Falha ao salvar alocações: " + error.message);
    }

    return { success: true };
  });

// ─── 4. Listagem de Grupos Terrestres da Agência (Workspace) ──────────────────

export const listAgencyGroupTours = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.string().optional(),
        search: z.string().optional(),
      })
      .optional()
  )
  .handler(async ({ data }): Promise<GroupTourDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      return [];
    }

    let query = supabase
      .from("travel_group_tours")
      .select("*")
      .order("departure_date", { ascending: true });

    if (identity.store_id) {
      query = query.eq("store_id", identity.store_id);
    } else {
      query = query.eq("created_by_profile_id", identity.id);
    }

    if (data?.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }

    if (data?.search) {
      query = query.or(`title.ilike.%${data.search}%,destination.ilike.%${data.search}%,departure_city.ilike.%${data.search}%`);
    }

    const { data: rows, error } = await query;

    if (error || !rows) {
      return [];
    }

    return rows.map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      title: row.title,
      destination: row.destination,
      departure_city: row.departure_city,
      departure_date: row.departure_date,
      departure_time: row.departure_time,
      return_date: row.return_date,
      return_time: row.return_time,
      bus_company_name: row.bus_company_name,
      bus_plate: row.bus_plate,
      driver_name: row.driver_name,
      driver_phone: row.driver_phone,
      total_seats: row.total_seats || 46,
      seats: row.seats || generateDefaultBusSeats(row.total_seats || 46),
      rooms: row.rooms || [],
      price_cents: row.price_cents || 0,
      included_items: row.included_items || [],
      status: row.status || "open",
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  });
