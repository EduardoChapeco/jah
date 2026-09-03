import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Types & Schemas
// ---------------------------------------------------------------------------

export interface TourBoardingPoint {
  id: string;
  tour_id: string;
  store_id: string;
  point_name: string;
  scheduled_time: string;
  address?: string | null;
  sort_order: number;
  created_at: string;
}

export interface PassengerCheckinItem {
  id: string;
  tour_id: string;
  seat_number: number;
  passenger_name: string;
  checked_in_at: string;
  boarding_point_id?: string | null;
  status: "checked_in" | "no_show" | "cancelled";
  notes?: string | null;
}

export const CreateBoardingPointSchema = z.object({
  store_id: z.string().uuid(),
  tour_id: z.string().uuid(),
  point_name: z.string().min(2, "Nome do ponto de embarque é obrigatório"),
  scheduled_time: z.string().min(4, "Horário de saída obrigatório"),
  address: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const ToggleCheckinSchema = z.object({
  store_id: z.string().uuid(),
  tour_id: z.string().uuid(),
  seat_number: z.number().int(),
  passenger_name: z.string().min(1),
  status: z.enum(["checked_in", "no_show", "cancelled"]),
  boarding_point_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listTourBoardingPoints = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid(), tour_id: z.string().uuid() }))
  .handler(async ({ data }): Promise<TourBoardingPoint[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: points, error } = await db
      .from("group_tour_boardings")
      .select("*")
      .eq("tour_id", data.tour_id)
      .eq("store_id", data.store_id)
      .order("sort_order", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) throw error;
    return points || [];
  });

export const createTourBoardingPoint = createServerFn({ method: "POST" })
  .validator((d: unknown) => CreateBoardingPointSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: created, error } = await db
      .from("group_tour_boardings")
      .insert({
        store_id: data.store_id,
        tour_id: data.tour_id,
        point_name: data.point_name.trim(),
        scheduled_time: data.scheduled_time,
        address: data.address?.trim() || null,
        sort_order: data.sort_order,
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  });

export const deleteTourBoardingPoint = createServerFn({ method: "POST" })
  .validator(z.object({ store_id: z.string().uuid(), point_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db
      .from("group_tour_boardings")
      .delete()
      .eq("id", data.point_id)
      .eq("store_id", data.store_id);

    if (error) throw error;
    return { success: true };
  });

export const listPassengerCheckins = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid(), tour_id: z.string().uuid() }))
  .handler(async ({ data }): Promise<PassengerCheckinItem[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: logs, error } = await db
      .from("passenger_checkin_logs")
      .select("*")
      .eq("tour_id", data.tour_id);

    if (error) throw error;
    return logs || [];
  });

export const togglePassengerCheckin = createServerFn({ method: "POST" })
  .validator((d: unknown) => ToggleCheckinSchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();

    // Checar se já existe log para esta poltrona
    const { data: existing } = await db
      .from("passenger_checkin_logs")
      .select("id, status")
      .eq("tour_id", data.tour_id)
      .eq("seat_number", data.seat_number)
      .maybeSingle();

    if (existing) {
      if (existing.status === data.status) {
        // Se já estava no status, remover check-in (desfazer)
        await db
          .from("passenger_checkin_logs")
          .delete()
          .eq("id", existing.id);
        return { action: "cleared", id: existing.id };
      } else {
        // Atualizar status
        const { data: updated, error } = await db
          .from("passenger_checkin_logs")
          .update({
            status: data.status,
            checked_in_at: new Date().toISOString(),
            checked_in_by_profile_id: identity.id,
            notes: data.notes || null,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return { action: "updated", item: updated };
      }
    } else {
      // Inserir novo check-in
      const { data: created, error } = await db
        .from("passenger_checkin_logs")
        .insert({
          tour_id: data.tour_id,
          seat_number: data.seat_number,
          passenger_name: data.passenger_name.trim(),
          checked_in_by_profile_id: identity.id,
          boarding_point_id: data.boarding_point_id || null,
          status: data.status,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { action: "created", item: created };
    }
  });

export const getTourBoardingOverview = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid(), tour_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();

    // 1. Carregar Pontos de Embarque
    const { data: points } = await db
      .from("group_tour_boardings")
      .select("*")
      .eq("tour_id", data.tour_id)
      .eq("store_id", data.store_id)
      .order("sort_order", { ascending: true });

    // 2. Carregar Logs de Check-in
    const { data: checkinLogs } = await db
      .from("passenger_checkin_logs")
      .select("*")
      .eq("tour_id", data.tour_id);

    // 3. Carregar Lista de Passageiros da Excursão
    const { data: tourRow } = await db
      .from("tourism_experiences")
      .select("id, title, location, description")
      .eq("id", data.tour_id)
      .single();

    let seats: any[] = [];
    if (tourRow?.description) {
      try {
        const meta = JSON.parse(tourRow.description);
        seats = Array.isArray(meta.seats) ? meta.seats : [];
      } catch {
        seats = [];
      }
    }

    const reservedSeats = seats.filter((s: any) => s.status === "reserved");
    const checkinMap = new Map(
      (checkinLogs || []).map((l: any) => [l.seat_number, l.status])
    );

    const totalReserved = reservedSeats.length;
    const checkedInCount = (checkinLogs || []).filter((l: any) => l.status === "checked_in").length;
    const noShowCount = (checkinLogs || []).filter((l: any) => l.status === "no_show").length;
    const pendingCount = Math.max(0, totalReserved - checkedInCount - noShowCount);

    return {
      points: points || [],
      checkinLogs: checkinLogs || [],
      reservedSeats,
      totalReserved,
      checkedInCount,
      noShowCount,
      pendingCount,
    };
  });
