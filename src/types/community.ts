import { z } from "zod"

// ==========================================
// EVENTS & TICKETS
// ==========================================

export const eventSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().nullable().optional(),
  event_date: z.string().datetime(),
  location: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "cancelled"]),
  cover_image: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Event = z.infer<typeof eventSchema>

export const ticketLotSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  name: z.string().min(1, "O nome do lote é obrigatório"),
  price_cents: z.number().int().min(0),
  capacity: z.number().int().min(0),
  reserved_count: z.number().int().min(0),
  sold_count: z.number().int().min(0),
  start_time: z.string().datetime().nullable().optional(),
  end_time: z.string().datetime().nullable().optional(),
  status: z.enum(["active", "inactive", "sold_out"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type TicketLot = z.infer<typeof ticketLotSchema>

export const ticketSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  lot_id: z.string().uuid(),
  owner_profile_id: z.string().uuid(),
  order_id: z.string().uuid().nullable().optional(),
  status: z.enum(["valid", "used", "revoked"]),
  qr_hash: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Ticket = z.infer<typeof ticketSchema>

// ==========================================
// CLASSIFIEDS
// ==========================================

export const classifiedSchema = z.object({
  id: z.string().uuid(),
  author_profile_id: z.string().uuid(),
  category: z.enum(["job", "sale", "trade", "service"]),
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  price_cents: z.number().int().min(0).nullable().optional(),
  status: z.enum(["active", "resolved", "expired", "banned"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Classified = z.infer<typeof classifiedSchema>

// ==========================================
// DIRECTORY (Yellow Pages)
// ==========================================

export const directoryListingSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  category: z.string().min(1),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  working_hours: z.any().nullable().optional(), // using any for JSONB flexibility for now
  is_verified: z.boolean(),
  status: z.enum(["active", "inactive"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DirectoryListing = z.infer<typeof directoryListingSchema>
