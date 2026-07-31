import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { getServerClient } from "@/lib/supabase"
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access"
import { eventSchema, ticketLotSchema } from "@/types/community"
import { logAuditAction } from "./audit.functions"

// ---------------------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------------------

export async function listAdminEventsHandler() {
  const supabase = getServerClient()
  const identity = await getServerIdentity()
  
  if (!identity.store_id) return []

  // Check if they are at least staff
  assertStoreAccess(identity, ["owner", "admin", "manager", "content", "seller"])

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return events || []
}

export const listAdminEvents = createServerFn({ method: "GET" }).handler(listAdminEventsHandler)

export async function getAdminEventByIdHandler(eventId: string) {
  const supabase = getServerClient()
  const identity = await getServerIdentity()
  assertStoreAccess(identity, ["owner", "admin", "manager", "content", "seller"])

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("store_id", identity.store_id)
    .single()

  if (error) throw new Error(error.message)
  return event
}

export const getAdminEventById = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: eventId }) => getAdminEventByIdHandler(eventId))

export async function upsertEventHandler(data: Partial<z.infer<typeof eventSchema>>) {
  const supabase = getServerClient()
  const identity = await getServerIdentity()
  assertStoreAccess(identity, ["owner", "admin", "manager", "content"])

  const payload = {
    ...data,
    store_id: identity.store_id, // Force ownership
  }

  const { data: event, error } = await supabase
    .from("events")
    .upsert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logAuditAction(
    identity,
    data.id ? "UPDATE" : "INSERT",
    "events",
    event.id,
    event
  );

  return event
}

export const upsertEvent = createServerFn({ method: "POST" })
  .validator(eventSchema.partial().extend({ title: z.string(), event_date: z.string() }))
  .handler(async ({ data }) => upsertEventHandler(data))

// ---------------------------------------------------------------------------
// TICKET LOTS
// ---------------------------------------------------------------------------

export async function listEventLotsHandler(eventId: string) {
  const supabase = getServerClient()
  const identity = await getServerIdentity()
  assertStoreAccess(identity, ["owner", "admin", "manager", "content", "seller"])

  // Double check that event belongs to the store
  const { data: evt } = await supabase.from("events").select("id").eq("id", eventId).eq("store_id", identity.store_id).single()
  if (!evt) throw new Error("Acesso negado")

  const { data: lots, error } = await supabase
    .from("ticket_lots")
    .select("*")
    .eq("event_id", eventId)
    .order("price_cents", { ascending: true })

  if (error) throw new Error(error.message)
  return lots || []
}

export const listEventLots = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: eventId }) => listEventLotsHandler(eventId))

export async function upsertEventLotHandler(data: Partial<z.infer<typeof ticketLotSchema>>) {
  const supabase = getServerClient()
  const identity = await getServerIdentity()
  assertStoreAccess(identity, ["owner", "admin", "manager"])

  if (!data.event_id) throw new Error("ID do evento obrigatório")

  // Ensure event ownership
  const { data: evt } = await supabase.from("events").select("id").eq("id", data.event_id).eq("store_id", identity.store_id).single()
  if (!evt) throw new Error("Acesso negado")

  // We DO NOT let frontend send `sold_count` or `reserved_count` during updates. 
  // We only allow setting capacity.
  const payload = {
    id: data.id,
    event_id: data.event_id,
    name: data.name,
    price_cents: data.price_cents,
    capacity: data.capacity,
    start_time: data.start_time,
    end_time: data.end_time,
    status: data.status,
  }

  const { data: lot, error } = await supabase
    .from("ticket_lots")
    .upsert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logAuditAction(
    identity,
    data.id ? "UPDATE" : "INSERT",
    "ticket_lots",
    lot.id,
    lot
  );

  return lot
}

export const upsertEventLot = createServerFn({ method: "POST" })
  .validator(ticketLotSchema.partial().extend({ event_id: z.string().uuid(), name: z.string() }))
  .handler(async ({ data }) => upsertEventLotHandler(data))
