/**
 * travel-proposal.functions.ts — BFF para o Studio de Propostas Comerciais & Lâminas de Viagem
 * Tabela canônica: quotes (conditions JSONB como string serializada para metadados turísticos)
 * Padrão BigTech | Zero Mocks | Persistência Real no Supabase
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

// ─── Tipagens Canônicas do Studio de Propostas ─────────────────────────────────

export type ProposalCanvasFormat =
  | "a4-portrait"
  | "a4-landscape"
  | "story-916"
  | "presentation-169"
  | "letter-portrait";

export type ProposalStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export interface FlightSegmentDTO {
  id: string;
  type: "outbound" | "return" | "internal";
  airline_name: string;
  airline_code?: string;
  flight_number?: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  departure_time: string;
  arrival_time: string;
  baggage_included?: string;
  cabin_class?: string;
  stops_count?: number;
}

export interface HotelOptionDTO {
  id: string;
  hotel_name: string;
  stars?: number;
  room_type: string;
  board_basis: "none" | "breakfast" | "half_board" | "full_board" | "all_inclusive";
  checkin_date: string;
  checkout_date: string;
  nights_count: number;
  image_url?: string;
  amenities: string[];
}

export interface ItineraryDayDTO {
  id: string;
  day_number: number;
  title: string;
  description: string;
  included_meals?: string[];
  image_url?: string;
}

export interface TourOptionDTO {
  id: string;
  title: string;
  duration?: string;
  is_included: boolean;
  price_cents?: number;
  description?: string;
}

export interface TransferOptionDTO {
  id: string;
  type: "in" | "out" | "roundtrip" | "internal";
  vehicle_type: string;
  description: string;
}

export interface PricingBreakdownDTO {
  currency: string;
  base_price_cents: number;
  boarding_tax_cents: number;
  other_taxes_cents: number;
  discount_cents: number;
  total_price_cents: number;
  installments_options: Array<{
    installments_count: number;
    installment_value_cents: number;
    method: "credit_card" | "boleto" | "pix" | "financing";
    has_interest: boolean;
  }>;
}

export interface TravelProposalDTO {
  id: string;
  store_id: string | null;
  agency_name: string;
  agency_logo_url?: string | null;
  agency_whatsapp?: string | null;
  quote_id?: string | null;
  public_token: string;
  title: string;
  subtitle?: string | null;
  cover_image_url?: string | null;
  client_name: string;
  client_whatsapp: string;
  client_email?: string | null;
  adults_count: number;
  children_count: number;
  canvas_format: ProposalCanvasFormat;
  template_theme: string;
  destination_city: string;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  flights: FlightSegmentDTO[];
  hotels: HotelOptionDTO[];
  itinerary: ItineraryDayDTO[];
  transfers: TransferOptionDTO[];
  tours: TourOptionDTO[];
  includes: string[];
  excludes: string[];
  pricing: PricingBreakdownDTO;
  special_notes?: string | null;
  status: ProposalStatus;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converte uma linha de quotes (com conditions JSON) para TravelProposalDTO.
 */
function rowToProposalDTO(row: any, storeRow?: any): TravelProposalDTO {
  let meta: Record<string, any> = {};
  try {
    if (row.conditions) meta = JSON.parse(row.conditions);
  } catch (_) { /* conditions pode ser texto livre sem JSON */ }

  const storeSettings = storeRow?.settings || row.stores?.settings || {};

  const defaultPricing: PricingBreakdownDTO = {
    currency: "BRL",
    base_price_cents: 0,
    boarding_tax_cents: 0,
    other_taxes_cents: 0,
    discount_cents: 0,
    total_price_cents: row.total_cents || 0,
    installments_options: [],
  };

  return {
    id: row.id,
    store_id: row.store_id || null,
    agency_name: storeRow?.name || row.stores?.name || "Agência de Viagens",
    agency_logo_url: storeRow?.logo_url || row.stores?.logo_url || null,
    agency_whatsapp: storeSettings.whatsapp_phone || storeSettings.phone || null,
    quote_id: row.id, // self-referencing as the quote IS the proposal
    public_token: meta.public_token || row.id,
    title: row.internal_notes || meta.title || "Proposta de Viagem",
    subtitle: meta.subtitle || null,
    cover_image_url: meta.cover_image_url || null,
    client_name: row.guest_name || meta.client_name || "",
    client_whatsapp: row.guest_phone || meta.client_whatsapp || "",
    client_email: row.guest_email || meta.client_email || null,
    adults_count: meta.adults_count ?? 2,
    children_count: meta.children_count ?? 0,
    canvas_format: meta.canvas_format || "a4-portrait",
    template_theme: meta.template_theme || "editorial-flat",
    destination_city: meta.destination_city || "",
    travel_start_date: meta.travel_start_date || null,
    travel_end_date: meta.travel_end_date || null,
    flights: meta.flights || [],
    hotels: meta.hotels || [],
    itinerary: meta.itinerary || [],
    transfers: meta.transfers || [],
    tours: meta.tours || [],
    includes: meta.includes || [],
    excludes: meta.excludes || [],
    pricing: meta.pricing || defaultPricing,
    special_notes: meta.special_notes || null,
    status: (row.status === "approved" ? "approved"
      : row.status === "rejected" ? "rejected"
      : row.status === "expired" ? "expired"
      : row.status === "sent" ? "sent"
      : "draft") as ProposalStatus,
    valid_until: row.valid_until || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ─── 1. Criação de Proposta (Workspace) ───────────────────────────────────────

export const createTravelProposal = createServerFn({ method: "POST" })
  .validator(
    z.object({
      quoteId: z.string().optional(),
      title: z.string().min(3, "Título obrigatório"),
      clientName: z.string().min(2, "Nome do cliente obrigatório"),
      clientWhatsapp: z.string().min(8, "WhatsApp obrigatório"),
      destinationCity: z.string().min(2, "Destino obrigatório"),
      travelStartDate: z.string().optional(),
      travelEndDate: z.string().optional(),
      adultsCount: z.number().int().min(1).default(2),
      childrenCount: z.number().int().min(0).default(0),
      canvasFormat: z.enum(["a4-portrait", "a4-landscape", "story-916", "presentation-169", "letter-portrait"]).default("a4-portrait"),
      templateTheme: z.string().default("editorial-flat"),
    })
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; id: string; publicToken: string }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado — faça login no painel da agência.");
    }

    const publicToken = "prop_" + Math.random().toString(36).substring(2, 10);

    const initialPricing: PricingBreakdownDTO = {
      currency: "BRL",
      base_price_cents: 0,
      boarding_tax_cents: 0,
      other_taxes_cents: 0,
      discount_cents: 0,
      total_price_cents: 0,
      installments_options: [
        { installments_count: 1, installment_value_cents: 0, method: "pix", has_interest: false },
        { installments_count: 10, installment_value_cents: 0, method: "credit_card", has_interest: false },
      ],
    };

    // Metadados turísticos armazenados em conditions (text → JSON serializado)
    const conditionsMeta = JSON.stringify({
      public_token: publicToken,
      title: input.title.trim(),
      client_name: input.clientName.trim(),
      client_whatsapp: input.clientWhatsapp.trim(),
      destination_city: input.destinationCity.trim(),
      travel_start_date: input.travelStartDate || null,
      travel_end_date: input.travelEndDate || null,
      adults_count: input.adultsCount,
      children_count: input.childrenCount,
      canvas_format: input.canvasFormat,
      template_theme: input.templateTheme,
      flights: [],
      hotels: [],
      itinerary: [],
      transfers: [],
      tours: [],
      includes: ["Passagens aéreas ida e volta", "Hospedagem com café da manhã", "Seguro viagem internacional"],
      excludes: ["Despesas de caráter pessoal", "Taxas turísticas locais de preservação ambiental"],
      pricing: initialPricing,
    });

    const { data: inserted, error } = await supabase
      .from("quotes")
      .insert({
        store_id: identity.store_id || null,
        customer_id: identity.id,
        guest_name: input.clientName.trim(),
        guest_phone: input.clientWhatsapp.trim(),
        internal_notes: input.title.trim(),
        conditions: conditionsMeta,
        subtotal_cents: 0,
        total_cents: 0,
        discount_cents: 0,
        status: "draft",
        created_by: identity.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[travel-proposal.functions] Erro ao criar proposta no banco:", error);
      throw new Error("Falha ao salvar proposta: " + error.message);
    }

    return { success: true, id: inserted.id, publicToken };
  });

// ─── 2. Buscar Proposta por ID (Painel / Workspace) ───────────────────────────

export const getTravelProposalById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<TravelProposalDTO | null> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado.");
    }

    const { data: row, error } = await supabase
      .from("quotes")
      .select(`*, stores(name, logo_url, settings)`)
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    return rowToProposalDTO(row);
  });

// ─── 3. Atualizar Proposta (Workspace Auto-Save) ───────────────────────────────

export const updateTravelProposal = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      patch: z.object({
        title: z.string().optional(),
        subtitle: z.string().optional().nullable(),
        cover_image_url: z.string().optional().nullable(),
        client_name: z.string().optional(),
        client_whatsapp: z.string().optional(),
        client_email: z.string().optional().nullable(),
        destination_city: z.string().optional(),
        travel_start_date: z.string().optional().nullable(),
        travel_end_date: z.string().optional().nullable(),
        adults_count: z.number().optional(),
        children_count: z.number().optional(),
        canvas_format: z.enum(["a4-portrait", "a4-landscape", "story-916", "presentation-169", "letter-portrait"]).optional(),
        template_theme: z.string().optional(),
        flights: z.array(z.any()).optional(),
        hotels: z.array(z.any()).optional(),
        itinerary: z.array(z.any()).optional(),
        transfers: z.array(z.any()).optional(),
        tours: z.array(z.any()).optional(),
        includes: z.array(z.string()).optional(),
        excludes: z.array(z.string()).optional(),
        pricing: z.any().optional(),
        special_notes: z.string().optional().nullable(),
        status: z.enum(["draft", "sent", "approved", "rejected", "expired"]).optional(),
        valid_until: z.string().optional().nullable(),
      }),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado.");
    }

    // Primeiro, busca o registro atual para merge do conditions JSON
    const { data: current, error: fetchErr } = await supabase
      .from("quotes")
      .select("conditions, guest_name, guest_phone, total_cents")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchErr || !current) {
      throw new Error("Proposta não encontrada.");
    }

    let existingMeta: Record<string, any> = {};
    try {
      if (current.conditions) existingMeta = JSON.parse(current.conditions);
    } catch (_) {}

    const mergedMeta = { ...existingMeta, ...data.patch };
    const totalCents = data.patch.pricing?.total_price_cents ?? current.total_cents ?? 0;

    const quotePatch: Record<string, any> = {
      conditions: JSON.stringify(mergedMeta),
      updated_at: new Date().toISOString(),
      total_cents: totalCents,
    };

    if (data.patch.client_name) quotePatch.guest_name = data.patch.client_name;
    if (data.patch.client_whatsapp) quotePatch.guest_phone = data.patch.client_whatsapp;
    if (data.patch.client_email !== undefined) quotePatch.guest_email = data.patch.client_email;
    if (data.patch.title) quotePatch.internal_notes = data.patch.title;
    if (data.patch.status) {
      // Map ProposalStatus to quote_status enum
      const statusMap: Record<string, string> = {
        draft: "draft",
        sent: "sent",
        approved: "approved",
        rejected: "rejected",
        expired: "expired",
      };
      quotePatch.status = statusMap[data.patch.status] || "draft";
    }
    if (data.patch.valid_until !== undefined) quotePatch.valid_until = data.patch.valid_until;

    const { error } = await supabase
      .from("quotes")
      .update(quotePatch)
      .eq("id", data.id);

    if (error) {
      console.error("[travel-proposal.functions] Erro ao atualizar proposta:", error);
      throw new Error("Falha ao salvar alterações da proposta: " + error.message);
    }

    return { success: true };
  });

// ─── 4. Buscar Proposta Pública por Token (Link do Cliente) ───────────────────

export const getPublicTravelProposalByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }): Promise<TravelProposalDTO | null> => {
    const supabase = getAnonServerClient();

    // O public_token está serializado dentro do campo conditions
    const { data: rows, error } = await supabase
      .from("quotes")
      .select(`*, stores(name, logo_url, settings)`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !rows) return null;

    // Busca por token dentro do JSON serializado em conditions
    const row = rows.find((r: any) => {
      try {
        const meta = JSON.parse(r.conditions || "{}");
        return meta.public_token === data.token;
      } catch (_) { return false; }
    });

    if (!row) return null;
    return rowToProposalDTO(row);
  });

// ─── 5. Aprovação da Proposta pelo Cliente ────────────────────────────────────

export const approveTravelProposal = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(1),
      notes: z.string().optional(),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const supabase = getAnonServerClient();

    // Busca o id da quote pelo public_token embarcado em conditions
    const { data: rows } = await supabase
      .from("quotes")
      .select("id, conditions")
      .order("created_at", { ascending: false })
      .limit(200);

    const row = (rows || []).find((r: any) => {
      try {
        return JSON.parse(r.conditions || "{}").public_token === data.token;
      } catch (_) { return false; }
    });

    if (!row) {
      throw new Error("Proposta não encontrada.");
    }

    const { error } = await supabase
      .from("quotes")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) {
      throw new Error("Erro ao aprovar proposta: " + error.message);
    }

    return { success: true, message: "Proposta aprovada com sucesso! A agência entrará em contato para emissão dos vouchers." };
  });

// ─── 6. Listagem de Propostas da Agência (Workspace) ──────────────────────────

export const listAgencyTravelProposals = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.string().optional(),
        search: z.string().optional(),
      })
      .optional()
  )
  .handler(async ({ data }): Promise<TravelProposalDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      return [];
    }

    let query = supabase
      .from("quotes")
      .select(`*, stores(name, logo_url, settings)`)
      .order("created_at", { ascending: false });

    if (identity.store_id) {
      query = query.eq("store_id", identity.store_id);
    } else {
      query = query.eq("created_by", identity.id);
    }

    if (data?.status && data.status !== "todos") {
      const statusMap: Record<string, string> = {
        draft: "draft", sent: "sent", approved: "approved",
        rejected: "rejected", expired: "expired",
      };
      const mapped = statusMap[data.status];
      if (mapped) query = query.eq("status", mapped);
    }

    if (data?.search) {
      query = query.or(`guest_name.ilike.%${data.search}%,internal_notes.ilike.%${data.search}%`);
    }

    const { data: rows, error } = await query;

    if (error || !rows) {
      console.error("[travel-proposal.functions] Erro ao listar propostas:", error);
      return [];
    }

    // Filtra apenas as quotes que são propostas turísticas (têm public_token "prop_..." em conditions)
    return rows
      .filter((r: any) => {
        try {
          const meta = JSON.parse(r.conditions || "{}");
          return meta.public_token?.startsWith("prop_") || meta.destination_city;
        } catch (_) { return false; }
      })
      .map((row: any) => rowToProposalDTO(row));
  });
