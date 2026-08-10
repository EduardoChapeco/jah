import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { resolveTenantStoreId } from "@/lib/tenant";
import { getServerIdentity } from "@/lib/server-access";
import { getWorkingIntervalsForDate } from "@/services/store.functions";

// --- SCHEMAS ---

export const bookingServiceSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number(),
  price_cents: z.number(),
  status: z.enum(["active", "archived"]),
});

export const createAppointmentSchema = z.object({
  service_id: z.string().uuid(),
  guest_name: z.string().min(2, "Nome é obrigatório"),
  guest_phone: z.string().min(10, "Telefone é obrigatório"),
  scheduled_at: z.string().datetime(),
  notes: z.string().optional(),
});

// --- FUNCTIONS ---

/**
 * Lista serviços de agendamento disponíveis na loja atual.
 */
export const listBookingServices = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja não encontrada no contexto.");

    const db = getServerClient();
    const { data, error } = await db
      .from("booking_services")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("title");

    if (error) throw error;
    return { status: "success" as const, data };
  } catch (error: any) {
    console.error("[booking.functions] listBookingServices error:", error);
    throw new Error(error.message || "Erro ao listar serviços de agendamento.");
  }
});

/**
 * Busca horários disponíveis para um serviço em uma data específica.
 * Horários baseados nos Working Hours configurados pela loja (sem fallback hardcoded).
 */
export const getAvailableSlots = createServerFn({ method: "GET" })
  .validator(z.object({ service_id: z.string().uuid(), date: z.string() }))
  .handler(async ({ data: { service_id, date } }) => {
    try {
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não encontrada no contexto.");

      const db = getServerClient();

      // 1. Buscar serviço para saber a duração
      const { data: service, error: sErr } = await db
        .from("booking_services")
        .select("duration_minutes")
        .eq("id", service_id)
        .single();

      if (sErr || !service) throw new Error("Serviço não encontrado.");

      // 2. Buscar agendamentos existentes do dia
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      const { data: existing, error: apptErr } = await db
        .from("booking_appointments")
        .select("scheduled_at, booking_services(duration_minutes)")
        .eq("store_id", storeId)
        .neq("status", "cancelled")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (apptErr) throw apptErr;

      // 3. Buscar intervalos de trabalho reais da loja
      const intervals = await getWorkingIntervalsForDate(storeId, date);

      if (intervals.length === 0) {
        // Loja fechada nesse dia
        return { status: "success" as const, data: [] };
      }

      const duration = service.duration_minutes || 60;
      const slots: string[] = [];

      // 4. Para cada intervalo configurado, calcular slots válidos
      for (const interval of intervals) {
        const [fromH, fromM] = interval.from.split(":").map(Number);
        const [toH, toM] = interval.to.split(":").map(Number);
        const intervalEndMinutes = toH * 60 + toM;

        let currentMinutes = fromH * 60 + fromM;

        while (currentMinutes + duration <= intervalEndMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          const slotTime = new Date(
            `${date}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00.000Z`,
          );

          const isOccupied = existing?.some((appt: any) => {
            const apptStart = new Date(appt.scheduled_at);
            const apptDuration = appt.booking_services?.duration_minutes || 60;
            const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);
            const proposedEnd = new Date(slotTime.getTime() + duration * 60000);
            return slotTime < apptEnd && proposedEnd > apptStart;
          });

          if (!isOccupied) {
            slots.push(slotTime.toISOString());
          }

          currentMinutes += duration;
        }
      }

      return { status: "success" as const, data: slots };
    } catch (error: any) {
      console.error("[booking.functions] getAvailableSlots error:", error);
      throw new Error(error.message || "Erro ao buscar horários disponíveis.");
    }
  });

/**
 * Cria um novo agendamento.
 */
export const createAppointment = createServerFn({ method: "POST" })
  .validator(createAppointmentSchema)
  .handler(async ({ data: input }) => {
    try {
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não encontrada no contexto.");

      // Try to get logged in user (optional)
      let customer_id = null;
      try {
        const identity = await getServerIdentity();
        customer_id = identity?.id || null;
      } catch (e) {
        // Guest user
      }

      const db = getServerClient();

      const { data, error } = await db
        .from("booking_appointments")
        .insert({
          store_id: storeId,
          service_id: input.service_id,
          customer_id,
          guest_name: input.guest_name,
          guest_phone: input.guest_phone,
          scheduled_at: input.scheduled_at,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return { status: "success" as const, data };
    } catch (error: any) {
      console.error("[booking.functions] createAppointment error:", error);
      throw new Error(error.message || "Erro ao criar agendamento.");
    }
  });

// --- ADMIN FUNCTIONS ---

import { requireAdmin } from "./auth.functions";

export const listResources = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireAdmin();
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja não encontrada no contexto.");

    const db = getServerClient();
    const { data, error } = await db
      .from("booking_resources")
      .select(`
        id, name, resource_type, capacity, status,
        booking_resource_availabilities (
          id, day_of_week, start_time, end_time
        )
      `)
      .eq("store_id", storeId)
      .order("name", { ascending: true });

    if (error) throw error;
    return { status: "success" as const, data: data || [] };
  } catch (error: any) {
    console.error("[booking.functions] listResources error:", error);
    throw new Error(error.message || "Erro ao listar recursos.");
  }
});

export const saveResource = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      resource_type: z.enum(["person", "room", "equipment"]),
      capacity: z.number().int().min(1).default(1),
      status: z.enum(["active", "inactive"]).default("active"),
      availabilities: z.array(
        z.object({
          day_of_week: z.number().int().min(0).max(6),
          start_time: z.string(),
          end_time: z.string(),
        })
      ),
    })
  )
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin();
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não encontrada no contexto.");

      const db = getServerClient();
      let resourceId = input.id;

      if (!resourceId) {
        const { data, error } = await db
          .from("booking_resources")
          .insert({
            store_id: storeId,
            name: input.name,
            resource_type: input.resource_type,
            capacity: input.capacity,
            status: input.status,
          })
          .select("id")
          .single();

        if (error || !data) throw error || new Error("Falha ao criar recurso");
        resourceId = data.id;
      } else {
        const { error } = await db
          .from("booking_resources")
          .update({
            name: input.name,
            resource_type: input.resource_type,
            capacity: input.capacity,
            status: input.status,
          })
          .eq("id", resourceId)
          .eq("store_id", storeId);
        
        if (error) throw error;
      }

      await db.from("booking_resource_availabilities").delete().eq("resource_id", resourceId);

      if (input.availabilities.length > 0) {
        const { error: vErr } = await db.from("booking_resource_availabilities").insert(
          input.availabilities.map((a: any) => ({
            resource_id: resourceId,
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time
          }))
        );
        if (vErr) throw vErr;
      }

      return { status: "success" as const, data: { id: resourceId } };
    } catch (e: any) {
      console.error("[booking] saveResource error:", e);
      throw new Error("Erro ao salvar recurso.");
    }
  });

export const listAppointments = createServerFn({ method: "GET" })
  .validator(z.object({ date_from: z.string().optional(), date_to: z.string().optional() }).optional())
  .handler(async ({ data: input }) => {
    try {
      await requireAdmin();
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não encontrada no contexto.");

      const db = getServerClient();

      let query = db
        .from("booking_appointments")
        .select(`
          id, scheduled_at, duration_minutes, status, guest_name, guest_phone,
          booking_services(title),
          booking_resources(name)
        `)
        .eq("store_id", storeId)
        .order("scheduled_at", { ascending: true });
        
      if (input?.date_from) {
        query = query.gte("scheduled_at", input.date_from);
      }
      if (input?.date_to) {
        query = query.lte("scheduled_at", input.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { status: "success" as const, data: data || [] };
    } catch (e: any) {
      console.error("[booking] listAppointments error:", e);
      throw new Error("Erro ao listar agendamentos.");
    }
  });
