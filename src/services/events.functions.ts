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

  // Find the ticket by ID (uuid) or by QR Hash
  let query = supabase
    .from("tickets")
    .select("id, status, profiles!inner(full_name), ticket_lots!inner(name)")
    .eq("event_id", eventId);

  // Basic validation if it's a UUID
  const isUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      ticketCode,
    );
  if (isUuid) {
    query = query.eq("id", ticketCode);
  } else {
    // Or it might be the qr_hash
    query = query.eq("qr_hash", ticketCode);
  }

  const { data: ticket, error } = await query.maybeSingle();

  if (error || !ticket) {
    throw new Error("Ingresso não encontrado para este evento.");
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
  const { resolveTenantStoreId } = await import("@/lib/tenant.server");
  const storeId = await resolveTenantStoreId();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("store_id", storeId)
    .eq("status", "published")
    .single();

  if (eventError || !event) throw new Error("Evento não encontrado");

  const { data: lots, error: lotsError } = await supabase
    .from("ticket_lots")
    .select("*")
    .eq("event_id", eventId)
    .order("start_time", { ascending: true });

  if (lotsError) throw new Error(lotsError.message);

  return { event, lots: lots || [] };
}

export const getEventWithLots = createServerFn({ method: "GET" })
  .validator(z.object({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => _getEventWithLots(data.eventId));

// ---------------------------------------------------------------------------
// PUBLIC EVENTS LISTING (no auth required)
// ---------------------------------------------------------------------------

const SEED_EVENTS = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    store_id: null,
    title: "Festival de Jazz & Vinho Colonial na Praça",
    description: "Uma noite inesquecível de música instrumental ao vivo, vinhos locais e gastronomia artesanal ao ar livre.",
    event_date: "2026-08-22T19:00:00.000Z",
    location: "Praça Coronel Bertaso — Centro",
    cover_image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
    category: "shows",
    ticket_price: "Gratuito",
    status: "published",
    created_at: new Date().toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    store_id: null,
    title: "Circuito Gastronômico & Feira de Food Trucks",
    description: "Mais de 20 expositores de hambúrgueres artesanais, cervejarias regionais, churrasco e sobremesas.",
    event_date: "2026-08-29T11:00:00.000Z",
    location: "Parque Tancredo Neves (Efapi)",
    cover_image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    category: "gastronomico",
    ticket_price: "Entrada Franca",
    status: "published",
    created_at: new Date().toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    store_id: null,
    title: "Feira de Produtores Orgânicos & Artesanato Local",
    description: "Hortaliças frescas sem agrotóxicos colhidas no mesmo dia, queijos coloniais, pães caseiros e arte regional.",
    event_date: "2026-09-05T08:00:00.000Z",
    location: "Ecoparque — Av. Getúlio Vargas",
    cover_image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80",
    category: "feiras",
    ticket_price: "Livre",
    status: "published",
    created_at: new Date().toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    store_id: null,
    title: "Workshop: Fotografia Móvel & Branding para Negócios",
    description: "Aprenda a fotografar seus produtos e criar conteúdos de alto engajamento usando apenas o smartphone.",
    event_date: "2026-09-12T14:00:00.000Z",
    location: "Hub de Inovação Pollen",
    cover_image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    category: "workshops",
    ticket_price: "R$ 45,00",
    status: "published",
    created_at: new Date().toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000005",
    store_id: null,
    title: "Noite Autoral: Festival de Bandas Independentes",
    description: "Apresentações ao vivo das principais bandas de rock autoral, MPB e pop da região oeste catarinense.",
    event_date: "2026-09-19T20:30:00.000Z",
    location: "Teatro Municipal de Chapecó",
    cover_image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    category: "shows",
    ticket_price: "R$ 20,00",
    status: "published",
    created_at: new Date().toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000006",
    store_id: null,
    title: "Mega Bazar Beneficente & Encontro Pet",
    description: "Adoção responsável de cães e gatos, vacinação gratuita, sorteios e arrecadação de ração.",
    event_date: "2026-09-26T09:00:00.000Z",
    location: "Parque das Palmeiras",
    cover_image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    category: "feiras",
    ticket_price: "Solidário (1kg de ração)",
    status: "published",
    created_at: new Date().toISOString(),
  },
];

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

    if (!error && events && events.length > 0) {
      return events;
    }
  } catch (err) {
    console.warn("[events] Fallback para eventos seed:", err);
  }

  // Fallback para eventos curados
  if (opts.category && opts.category !== "todos") {
    return SEED_EVENTS.filter((e) => e.category === opts.category);
  }

  return SEED_EVENTS.slice(0, limit);
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
