import { z } from "zod";

// ==========================================
// EVENTS & TICKETS
// ==========================================

export const eventSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().nullable().optional(),
  event_date: z.string().datetime(),
  end_date: z.string().datetime().nullable().optional(),
  timezone: z.string().default("America/Sao_Paulo"),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  is_free: z.boolean().default(false),
  capacity: z.number().int().min(0).nullable().optional(),
  min_age: z.number().int().min(0).nullable().optional(),
  organizer_name: z.string().nullable().optional(),
  online_link: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  attributes: z.record(z.any()).default({}),
  status: z.enum(["draft", "published", "cancelled"]),
  cover_image: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Event = z.infer<typeof eventSchema>;

// Schema para criação/edição (sem campos gerados pelo DB)
export const upsertEventSchema = eventSchema
  .omit({ id: true, store_id: true, created_at: true, updated_at: true })
  .partial()
  .extend({
    id: z.string().uuid().optional(),
    title: z.string().min(1, "O título é obrigatório"),
    event_date: z.string().datetime({ message: "Data do evento é obrigatória" }),
    status: z.enum(["draft", "published", "cancelled"]).default("draft"),
  });

export type UpsertEventInput = z.infer<typeof upsertEventSchema>;

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
});

export type TicketLot = z.infer<typeof ticketLotSchema>;

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
});

export type Ticket = z.infer<typeof ticketSchema>;

// ==========================================
// CLASSIFIEDS
// ==========================================

export const classifiedCategorySchema = z.enum([
  "job",
  "job_offer",
  "sale",
  "trade",
  "service",
  "real_estate",
  "vehicle",
  "event",
  "donation",
]);

export type ClassifiedCategory = z.infer<typeof classifiedCategorySchema>;

export const classifiedConditionSchema = z.enum(["new", "used", "refurbished"]).nullable();

/** Mapa de labels de categoria para exibição */
export const CLASSIFIED_CATEGORY_LABELS: Record<ClassifiedCategory, string> = {
  job: "Vaga",
  job_offer: "Oferta de Trabalho",
  sale: "À Venda",
  trade: "Troca/Permuta",
  service: "Serviço",
  real_estate: "Imóvel",
  vehicle: "Veículo",
  event: "Evento",
  donation: "Doação",
};

export const classifiedSchema = z.object({
  id: z.string().uuid(),
  author_profile_id: z.string().uuid(),
  category: classifiedCategorySchema,
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  price_cents: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string().url()).default([]),
  contact_whatsapp: z.string().nullable().optional(),
  location_text: z.string().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  condition: classifiedConditionSchema.optional(),
  negotiable: z.boolean().default(true),
  attributes: z.record(z.any()).default({}),
  status: z.enum(["active", "resolved", "expired", "banned"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Classified = z.infer<typeof classifiedSchema>;

// Schema para criação/edição
export const upsertClassifiedSchema = classifiedSchema
  .omit({ id: true, author_profile_id: true, created_at: true, updated_at: true })
  .partial()
  .extend({
    id: z.string().uuid().optional(),
    category: classifiedCategorySchema,
    title: z.string().min(1, "Título é obrigatório"),
    content: z.string().min(1, "Conteúdo é obrigatório"),
    status: z.enum(["active", "resolved", "expired", "banned"]).default("active"),
  });

export type UpsertClassifiedInput = z.infer<typeof upsertClassifiedSchema>;

/**
 * Blueprints de atributos dinâmicos por categoria.
 * Define quais campos extras o formulário deve solicitar
 * além dos campos canônicos do classified.
 */
export const CLASSIFIED_ATTRIBUTE_BLUEPRINTS: Record<
  ClassifiedCategory,
  Array<{ key: string; label: string; type: "text" | "number" | "select" | "boolean"; options?: string[] }>
> = {
  job: [
    { key: "company", label: "Empresa", type: "text" },
    { key: "work_model", label: "Modelo", type: "select", options: ["Presencial", "Remoto", "Híbrido"] },
    { key: "salary_range", label: "Faixa Salarial", type: "text" },
  ],
  job_offer: [
    { key: "company", label: "Empresa Ofertante", type: "text" },
    { key: "work_model", label: "Modelo", type: "select", options: ["Presencial", "Remoto", "Híbrido"] },
    { key: "deadline", label: "Prazo para Candidatura", type: "text" },
  ],
  sale: [
    { key: "brand", label: "Marca", type: "text" },
    { key: "model", label: "Modelo", type: "text" },
  ],
  trade: [
    { key: "interested_in", label: "Aceito em Troca", type: "text" },
  ],
  service: [
    { key: "specialty", label: "Especialidade", type: "text" },
    { key: "availability", label: "Disponibilidade", type: "text" },
  ],
  real_estate: [
    { key: "property_type", label: "Tipo", type: "select", options: ["Apartamento", "Casa", "Comercial", "Terreno", "Sítio"] },
    { key: "bedrooms", label: "Quartos", type: "number" },
    { key: "area_m2", label: "Área (m²)", type: "number" },
    { key: "is_furnished", label: "Mobiliado", type: "boolean" },
  ],
  vehicle: [
    { key: "brand", label: "Marca", type: "text" },
    { key: "model", label: "Modelo", type: "text" },
    { key: "year", label: "Ano", type: "number" },
    { key: "mileage_km", label: "Quilometragem", type: "number" },
  ],
  event: [
    { key: "event_date", label: "Data do Evento", type: "text" },
    { key: "venue", label: "Local", type: "text" },
  ],
  donation: [
    { key: "pickup_location", label: "Local de Retirada", type: "text" },
  ],
};

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
  working_hours: z.any().nullable().optional(), // JSONB — canonizado por WorkingHours type em store types
  is_verified: z.boolean(),
  status: z.enum(["active", "inactive"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type DirectoryListing = z.infer<typeof directoryListingSchema>;


