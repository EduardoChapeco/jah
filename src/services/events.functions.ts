import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { eventSchema, ticketLotSchema } from "@/types/community";
import { logAuditAction } from "./audit.functions";

// ---------------------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------------------

async function _listAdminEvents() {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity.store_id) return [];

  // Check if they are at least staff
  assertStoreAccess(identity, ["owner", "admin", "manager", "content", "seller"]);

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return events || [];
}

export const listAdminEvents = createServerFn({ method: "GET" }).handler(_listAdminEvents);

async function _getAdminEventById(eventId: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "content", "seller"]);

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("store_id", identity.store_id)
    .single();

  if (error) throw new Error(error.message);
  return event;
}

export const getAdminEventById = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: eventId }) => _getAdminEventById(eventId));

async function _upsertEvent(data: Partial<z.infer<typeof eventSchema>>) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "content"]);

  // Strip server-generated fields to prevent client overrides
  const { search_vector: _sv, ...safeData } = data as any;

  const payload = {
    ...safeData,
    store_id: identity.store_id, // Force ownership — never trust client-sent store_id
  };

  const { data: event, error } = await supabase.from("events").upsert(payload).select().single();

  if (error) throw new Error(error.message);

  await logAuditAction(identity, data.id ? "UPDATE" : "INSERT", "events", event.id, event);

  return event;
}

export const upsertEvent = createServerFn({ method: "POST" })
  .validator(
    eventSchema
      .omit({ created_at: true, updated_at: true })
      .partial()
      .extend({
        title: z.string().min(1),
        event_date: z.string(),
      }),
  )
  .handler(async ({ data }) => _upsertEvent(data));

// ---------------------------------------------------------------------------
// TICKET LOTS
// ---------------------------------------------------------------------------

async function _listEventLots(eventId: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "content", "seller"]);

  // Double check that event belongs to the store
  const { data: evt } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("store_id", identity.store_id)
    .single();
  if (!evt) throw new Error("Acesso negado");

  const { data: lots, error } = await supabase
    .from("ticket_lots")
    .select("*")
    .eq("event_id", eventId)
    .order("price_cents", { ascending: true });

  if (error) throw new Error(error.message);
  return lots || [];
}

export const listEventLots = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: eventId }) => _listEventLots(eventId));

async function _upsertEventLot(data: Partial<z.infer<typeof ticketLotSchema>>) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  if (!data.event_id) throw new Error("ID do evento obrigatório");

  // Ensure event ownership
  const { data: evt } = await supabase
    .from("events")
    .select("id")
    .eq("id", data.event_id)
    .eq("store_id", identity.store_id)
    .single();
  if (!evt) throw new Error("Acesso negado");

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
  };

  const { data: lot, error } = await supabase.from("ticket_lots").upsert(payload).select().single();

  if (error) throw new Error(error.message);

  await logAuditAction(identity, data.id ? "UPDATE" : "INSERT", "ticket_lots", lot.id, lot);

  return lot;
}

export const upsertEventLot = createServerFn({ method: "POST" })
  .validator(ticketLotSchema.partial().extend({ event_id: z.string().uuid(), name: z.string() }))
  .handler(async ({ data }) => _upsertEventLot(data));

async function _deleteEventLot(lotId: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { data: lot } = await supabase
    .from("ticket_lots")
    .select("id, event_id, sold_count, events!inner(store_id)")
    .eq("id", lotId)
    .single();

  if (!lot || (lot.events as any)?.store_id !== identity.store_id) {
    throw new Error("Acesso negado ou lote inexistente");
  }

  if ((lot.sold_count || 0) > 0) {
    throw new Error("Não é possível excluir um lote que já possui ingressos vendidos. Pause o lote.");
  }

  const { error } = await supabase.from("ticket_lots").delete().eq("id", lotId);
  if (error) throw new Error(error.message);

  await logAuditAction(identity, "DELETE", "ticket_lots", lotId, { event_id: lot.event_id });
  return { success: true };
}

export const deleteEventLot = createServerFn({ method: "POST" })
  .validator(z.object({ lotId: z.string().uuid() }))
  .handler(async ({ data }) => _deleteEventLot(data.lotId));

async function _listEventTickets(eventId: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

  const { data: evt } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("store_id", identity.store_id)
    .single();
  if (!evt) throw new Error("Acesso negado");

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(`
      id,
      status,
      qr_hash,
      created_at,
      ticket_lots(id, name, price_cents),
      profiles(id, full_name, tax_id, phone, email)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return tickets || [];
}

export const listEventTickets = createServerFn({ method: "GET" })
  .validator(z.string().uuid())
  .handler(async ({ data: eventId }) => _listEventTickets(eventId));

async function _issueComplimentaryTicket(params: {
  eventId: string;
  lotId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientTaxId?: string;
}) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  // Ensure event ownership
  const { data: evt } = await supabase
    .from("events")
    .select("id")
    .eq("id", params.eventId)
    .eq("store_id", identity.store_id)
    .single();
  if (!evt) throw new Error("Acesso negado");

  const qrHash = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      event_id: params.eventId,
      lot_id: params.lotId,
      user_id: identity.userId, // issuer or holder profile
      qr_hash: qrHash,
      status: "valid",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Increment sold_count in the lot
  await supabase.rpc("increment_lot_sold_count", { p_lot_id: params.lotId }).catch(() => {});

  await logAuditAction(identity, "INSERT", "tickets", ticket.id, {
    type: "complimentary",
    recipient: params.recipientName,
  });

  return ticket;
}

export const issueComplimentaryTicket = createServerFn({ method: "POST" })
  .validator(
    z.object({
      eventId: z.string().uuid(),
      lotId: z.string().uuid(),
      recipientName: z.string().min(2),
      recipientEmail: z.string().email().optional(),
      recipientTaxId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => _issueComplimentaryTicket(data));

// ---------------------------------------------------------------------------
// TICKETS / CHECK-IN
// ---------------------------------------------------------------------------

async function _validateTicketCheckin(eventId: string, ticketCode: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]); // sellers can check-in

  // Ensure event ownership
  const { data: evt } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("store_id", identity.store_id)
    .single();
  if (!evt) throw new Error("Acesso negado ao evento");

  // Find the ticket by ID (uuid), QR Hash, or participant name/document
  let query = supabase
    .from("tickets")
    .select("id, status, qr_hash, profiles!inner(full_name, tax_id, phone), ticket_lots!inner(name)")
    .eq("event_id", eventId);

  const cleanInput = ticketCode.trim();
  const isUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      cleanInput,
    );

  if (isUuid) {
    query = query.eq("id", cleanInput);
  } else if (cleanInput.startsWith("TKT-") || cleanInput.length >= 8) {
    query = query.or(`qr_hash.eq.${cleanInput},id.ilike.%${cleanInput}%`);
  } else {
    // Busca por CPF ou nome do titular
    query = query.or(`qr_hash.eq.${cleanInput},profiles.tax_id.eq.${cleanInput},profiles.full_name.ilike.%${cleanInput}%`);
  }

  const { data: ticket, error } = await query.maybeSingle();

  if (error || !ticket) {
    throw new Error("Ingresso não localizado para este evento. Verifique o código, QR ou CPF.");
  }

  if (ticket.status === "used") {
    throw new Error("Ingresso já utilizado.");
  }

  if (ticket.status === "revoked") {
    throw new Error("Ingresso cancelado ou revogado.");
  }

  // Atomically update the status to 'used'
  const { error: updateErr } = await supabase
    .from("tickets")
    .update({ status: "used" })
    .eq("id", ticket.id)
    .eq("status", "valid"); // extra concurrency safety

  if (updateErr) {
    throw new Error("Falha ao registrar check-in.");
  }

  await logAuditAction(identity, "UPDATE", "tickets", ticket.id, { action: "checkin" });

  return {
    status: "success" as const,
    message: "Ingresso Validado!",
    name: (ticket.profiles as any)?.full_name || "Participante",
    lotName: (ticket.ticket_lots as any)?.name || "Lote Padrão",
  };
}

export const validateTicketCheckin = createServerFn({ method: "POST" })
  .validator(z.object({ eventId: z.string().uuid(), ticketCode: z.string() }))
  .handler(async ({ data }) => _validateTicketCheckin(data.eventId, data.ticketCode));

// ---------------------------------------------------------------------------
// PUBLIC EVENTS API
// ---------------------------------------------------------------------------

async function _getEventWithLots(eventId: string) {
  const supabase = getServerClient();

  try {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("status", "published")
      .single();

    if (!eventError && event) {
      const { data: lots } = await supabase
        .from("ticket_lots")
        .select("*")
        .eq("event_id", eventId)
        .order("price_cents", { ascending: true });

      return { event, lots: lots || [] };
    }
  } catch (err) {
    console.warn("[events] Erro ao buscar evento no banco:", err);
  }

  throw new Error("Evento não encontrado");
}

export const getEventWithLots = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => _getEventWithLots(data.eventId));

// ---------------------------------------------------------------------------
// PUBLIC EVENTS LISTING (no auth required) — 100% Real no Supabase
// ---------------------------------------------------------------------------

async function _getPublicEvents(opts: { limit?: number; category?: string } = {}) {
  const supabase = getServerClient();
  const limit = opts.limit ?? 50;

  try {
    let query = supabase
      .from("events")
      .select(
        "id, store_id, title, description, event_date, location, cover_image, status, created_at",
      )
      .eq("status", "published")
      .order("event_date", { ascending: true })
      .limit(limit);

    if (opts.category && opts.category !== "todos") {
      query = query.eq("category", opts.category);
    }

    const { data: events, error } = await query;

    if (!error && events) {
      return events;
    }
  } catch (err) {
    console.warn("[events] Erro ao listar eventos:", err);
  }

  return [];
}

export const getPublicEvents = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        category: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => _getPublicEvents(data || {}));
