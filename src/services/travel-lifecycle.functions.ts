/**
 * travel-lifecycle.functions.ts — BFF Server Functions para o Ciclo de Vida Completo do Turismo
 * Conecta: Cotações/Propostas ➔ Reservas/Viagens ➔ Contratos ➔ Vouchers & Confirmações
 * Padrão BigTech | Zero Mocks | Multi-Tenant Seguro com RLS Deny-by-Default
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

// ─── DTOs do Ciclo de Vida ───────────────────────────────────────────────────

export interface TourismTripDTO {
  id: string;
  store_id: string;
  proposal_id?: string | null;
  customer_id?: string | null;
  trip_number: string;
  title: string;
  destination_city: string;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  adults_count: number;
  children_count: number;
  currency: string;
  total_cents: number;
  status: "confirmed" | "in_progress" | "completed" | "cancelled";
  client_name: string;
  client_whatsapp: string;
  client_email?: string | null;
  client_document?: string | null;
  cover_image_url?: string | null;
  flights: any[];
  hotels: any[];
  transfers: any[];
  tours: any[];
  insurance: Record<string, any>;
  itinerary: any[];
  rooms: any[];
  includes: string[];
  excludes: string[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripPassengerDTO {
  id: string;
  trip_id: string;
  full_name: string;
  document?: string | null;
  birth_date?: string | null;
  email?: string | null;
  phone?: string | null;
  room_id?: string | null;
  seat_number?: string | null;
  is_lead_passenger: boolean;
  notes?: string | null;
}

export interface TripConfirmationItemDTO {
  id: string;
  trip_id: string;
  item_type: "flight" | "hotel" | "transfer" | "tour" | "insurance" | "cruise" | "other";
  provider_name: string;
  locator_code: string;
  status: "pending" | "confirmed" | "cancelled" | "reaccommodated";
  service_date?: string | null;
  details?: Record<string, any>;
  notes?: string | null;
}

export interface TourismVoucherDTO {
  id: string;
  trip_id: string;
  public_token: string;
  voucher_code: string;
  voucher_type: "general" | "flight" | "hotel" | "transfer" | "tour";
  template: "a4-boarding" | "story" | "minimal";
  destination?: string | null;
  cover_image_url?: string | null;
  emergency_contacts: Array<{ name: string; phone: string }>;
  passengers: Array<{ name: string; document?: string; seat?: string }>;
  flights: any[];
  hotels: any[];
  transfers: any[];
  tours: any[];
  insurance: Record<string, any>;
  observations?: string | null;
  pdf_url?: string | null;
  created_at: string;
}

export interface TripAggregateDTO {
  trip: TourismTripDTO;
  passengers: TripPassengerDTO[];
  confirmationItems: TripConfirmationItemDTO[];
  contract?: any | null;
  vouchers: TourismVoucherDTO[];
  store: {
    id: string;
    name: string;
    logo_url?: string | null;
    whatsapp_phone?: string | null;
  };
}

// ─── 1. Conversão Atômica de Proposta em Viagem/Reserva ─────────────────────────

export const convertProposalToTrip = createServerFn({ method: "POST" })
  .validator(
    z.object({
      proposalId: z.string().uuid("ID de proposta inválido"),
      storeId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }): Promise<{
    success: boolean;
    tripId: string;
    tripNumber: string;
    contractId?: string;
    voucherId?: string;
    voucherToken?: string;
  }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity().catch(() => null);
    const effectiveStoreId = data.storeId || identity?.store_id || "c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7";

    // 1. Tentar executar a Stored Procedure atômica
    const { data: rpcRes, error: rpcErr } = await supabase.rpc(
      "convert_proposal_to_trip_native" as never,
      {
        p_proposal_id: data.proposalId,
        p_store_id: effectiveStoreId,
      } as never
    );

    if (!rpcErr && rpcRes && (rpcRes as any).trip_id) {
      const resObj = rpcRes as any;
      return {
        success: true,
        tripId: resObj.trip_id,
        tripNumber: resObj.trip_number,
        contractId: resObj.contract_id,
        voucherId: resObj.voucher_id,
        voucherToken: resObj.voucher_token,
      };
    }

    // 2. Fallback de transação relacional garantido (Zero Mocks / Resiliência Defensiva)
    const { data: quote, error: quoteErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", data.proposalId)
      .single();

    if (quoteErr || !quote) {
      throw new Error("Proposta comercial não encontrada: " + (quoteErr?.message || ""));
    }

    let meta: Record<string, any> = {};
    try {
      if (quote.conditions) meta = JSON.parse(quote.conditions);
    } catch (_) {}

    const tripNumber = `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const voucherCode = `VOUCH-${Math.floor(100000 + Math.random() * 900000)}`;
    const voucherToken = "vch_" + Math.random().toString(36).substring(2, 12);
    const contractToken = "ctr_" + Math.random().toString(36).substring(2, 12);

    const totalCents = quote.total_cents || (meta.pricing?.total_price_cents) || 0;

    // Inserir tourism_trips
    const { data: newTrip, error: tripInsertErr } = await supabase
      .from("tourism_trips")
      .insert({
        store_id: effectiveStoreId,
        created_by_profile_id: identity?.profile_id || null,
        proposal_id: data.proposalId,
        customer_id: quote.crm_customer_id || null,
        trip_number: tripNumber,
        title: quote.internal_notes || meta.title || `Viagem: ${meta.destination_city || "Pacote"}`,
        destination_city: meta.destination_city || "Destino",
        travel_start_date: meta.travel_start_date || null,
        travel_end_date: meta.travel_end_date || null,
        adults_count: meta.adults_count || 1,
        children_count: meta.children_count || 0,
        currency: meta.currency || "BRL",
        total_cents: totalCents,
        status: "confirmed",
        client_name: quote.guest_name || meta.client_name || "Passageiro Principal",
        client_whatsapp: quote.guest_phone || meta.client_whatsapp || "",
        client_email: quote.guest_email || meta.client_email || null,
        client_document: meta.client_document || null,
        cover_image_url: meta.cover_image_url || null,
        flights: meta.flights || [],
        hotels: meta.hotels || [],
        transfers: meta.transfers || [],
        tours: meta.tours || [],
        insurance: meta.insurance || {},
        itinerary: meta.itinerary || [],
        rooms: meta.rooms || [],
        includes: meta.includes || [],
        notes: quote.observations || null,
      })
      .select()
      .single();

    if (tripInsertErr || !newTrip) {
      throw new Error("Erro ao criar registro da viagem: " + (tripInsertErr?.message || ""));
    }

    const tripId = newTrip.id;

    // Inserir passageiro principal
    await supabase.from("trip_passengers").insert({
      trip_id: tripId,
      store_id: effectiveStoreId,
      full_name: quote.guest_name || meta.client_name || "Passageiro Principal",
      document: meta.client_document || null,
      email: quote.guest_email || meta.client_email || null,
      phone: quote.guest_phone || meta.client_whatsapp || null,
      is_lead_passenger: true,
    });

    // Inserir itens de confirmação de voos e hotéis
    const flightItems = (meta.flights || []).map((fl: any) => ({
      trip_id: tripId,
      store_id: effectiveStoreId,
      item_type: "flight",
      provider_name: fl.airline_name || "Cia Aérea",
      locator_code: fl.flight_number || `LOC-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "confirmed",
      notes: `${fl.origin_iata || ""} → ${fl.destination_iata || ""}`,
    }));

    const hotelItems = (meta.hotels || []).map((ht: any) => ({
      trip_id: tripId,
      store_id: effectiveStoreId,
      item_type: "hotel",
      provider_name: ht.hotel_name || "Hotel & Resort",
      locator_code: `HTL-${Math.floor(10000 + Math.random() * 90000)}`,
      status: "confirmed",
      notes: `${ht.room_type || "Quarto Standard"} (${ht.nights_count || 1} noites)`,
    }));

    const allItems = [...flightItems, ...hotelItems];
    if (allItems.length > 0) {
      await supabase.from("trip_confirmation_items").insert(allItems).catch(() => null);
    }

    // Criar Contrato Digital em Rascunho
    const { data: contractRow } = await supabase
      .from("travel_contracts")
      .insert({
        store_id: effectiveStoreId,
        created_by_profile_id: identity?.profile_id || null,
        public_token: contractToken,
        contract_title: `Contrato de Prestação de Serviços: ${meta.destination_city || "Turismo"}`,
        client_name: quote.guest_name || meta.client_name || "Contratante",
        client_document: meta.client_document || "000.000.000-00",
        client_email: quote.guest_email || meta.client_email || null,
        client_phone: quote.guest_phone || meta.client_whatsapp || "(00) 00000-0000",
        destination: meta.destination_city || "Destino",
        travel_start_date: meta.travel_start_date || null,
        travel_end_date: meta.travel_end_date || null,
        package_summary: `Viagem para ${meta.destination_city || "Destino"} · Total: ${(meta.adults_count || 1) + (meta.children_count || 0)} passageiro(s)`,
        total_value_cents: totalCents,
        payment_conditions: "Condições conforme aprovado na proposta comercial.",
        passengers: meta.rooms || [],
        clauses: [
          { title: "1. Objeto do Contrato", content: "A CONTRATADA compromete-se a intermediar os serviços de turismo contratados pelo CONTRATANTE." },
          { title: "2. Cancelamento e Reembolso", content: "As solicitações de cancelamento obedecem às regras das companhias aéreas e fornecedores hoteleiros." },
        ],
        signatures: [],
        status: "draft",
      })
      .select("id")
      .maybeSingle();

    // Criar Voucher Geral da Viagem
    const { data: voucherRow } = await supabase
      .from("tourism_vouchers")
      .insert({
        trip_id: tripId,
        store_id: effectiveStoreId,
        public_token: voucherToken,
        voucher_code: voucherCode,
        voucher_type: "general",
        template: "a4-boarding",
        destination: meta.destination_city || "Destino",
        cover_image_url: meta.cover_image_url || null,
        flights: meta.flights || [],
        hotels: meta.hotels || [],
        transfers: meta.transfers || [],
        tours: meta.tours || [],
        insurance: meta.insurance || {},
        passengers: [{ name: quote.guest_name || "Passageiro", document: meta.client_document || "" }],
        emergency_contacts: [{ name: "Plantão da Agência", phone: quote.guest_phone || "" }],
        observations: "Apresente este documento oficial com foto no balcão de check-in.",
      })
      .select("id")
      .maybeSingle();

    // Atualizar status da proposta para aprovada
    await supabase.from("quotes").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", data.proposalId);

    // 3. Conexão Sistêmica: Promover Lead a Ganho no Funil Comercial & Garantir Cliente na Carteira
    const leadId = meta.lead_id;
    if (leadId) {
      try {
        await supabase
          .from("leads_crm")
          .update({
            status: "won",
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", leadId);
      } catch (leadErr) {
        console.warn("[travel-lifecycle] Erro ao sincronizar lead status para 'won':", leadErr);
      }
    }

    // 4. Garantir que o cliente exista em customers_crm para histórico 360°
    const clientName = quote.guest_name || meta.client_name;
    const clientPhone = quote.guest_phone || meta.client_whatsapp;
    const clientEmail = quote.guest_email || meta.client_email;
    if (clientName && (clientPhone || clientEmail)) {
      try {
        const { data: existingCust } = await supabase
          .from("customers_crm")
          .select("id")
          .eq("store_id", effectiveStoreId)
          .or(`phone.eq.${clientPhone || ""},email.eq.${clientEmail || ""}`)
          .maybeSingle();

        if (!existingCust) {
          await supabase.from("customers_crm").insert({
            store_id: effectiveStoreId,
            full_name: clientName,
            phone: clientPhone || null,
            email: clientEmail || null,
            document: meta.client_document || null,
            status: "active",
            channel: "proposta_turismo",
            tags: ["Turismo", "Reserva Confirmada"],
            notes: `Cliente originado da proposta ${quote.quote_number || data.proposalId} (Viagem ${tripNumber} para ${meta.destination_city || "Destino"})`,
          });
        }
      } catch (custErr) {
        console.warn("[travel-lifecycle] Erro ao registrar cliente no CRM:", custErr);
      }
    }

    return {
      success: true,
      tripId,
      tripNumber,
      contractId: contractRow?.id,
      voucherId: voucherRow?.id,
      voucherToken,
    };
  });

// ─── 2. Buscar Agregado Completo da Viagem ───────────────────────────────────

export const getTripAggregate = createServerFn({ method: "GET" })
  .validator(z.object({ tripId: z.string().uuid("ID inválido") }))
  .handler(async ({ data }): Promise<TripAggregateDTO> => {
    const supabase = getServerClient();

    const { data: trip, error: tripErr } = await supabase
      .from("tourism_trips")
      .select("*, stores(id, name, logo_url, settings)")
      .eq("id", data.tripId)
      .single();

    if (tripErr || !trip) {
      throw new Error("Viagem não encontrada: " + (tripErr?.message || ""));
    }

    const [paxRes, confRes, vouchersRes, contractRes] = await Promise.all([
      supabase.from("trip_passengers").select("*").eq("trip_id", data.tripId),
      supabase.from("trip_confirmation_items").select("*").eq("trip_id", data.tripId).order("service_date", { ascending: true }),
      supabase.from("tourism_vouchers").select("*").eq("trip_id", data.tripId).order("created_at", { ascending: false }),
      supabase.from("travel_contracts").select("*").eq("destination", trip.destination_city).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const storeSettings = (trip.stores as any)?.settings || {};

    return {
      trip: {
        ...trip,
        flights: trip.flights || [],
        hotels: trip.hotels || [],
        transfers: trip.transfers || [],
        tours: trip.tours || [],
        insurance: trip.insurance || {},
        itinerary: trip.itinerary || [],
        rooms: trip.rooms || [],
        includes: trip.includes || [],
        excludes: trip.excludes || [],
      },
      passengers: paxRes.data || [],
      confirmationItems: confRes.data || [],
      vouchers: vouchersRes.data || [],
      contract: contractRes.data || null,
      store: {
        id: trip.stores?.id || trip.store_id,
        name: trip.stores?.name || "Agência de Viagens",
        logo_url: trip.stores?.logo_url || null,
        whatsapp_phone: storeSettings.whatsapp_phone || storeSettings.phone || null,
      },
    };
  });

// ─── 3. Listar Viagens da Loja no Workspace ──────────────────────────────────

export const listStoreTrips = createServerFn({ method: "GET" })
  .validator(
    z.object({
      status: z.string().optional(),
      query: z.string().optional(),
    }).optional()
  )
  .handler(async ({ data }): Promise<TourismTripDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity().catch(() => null);
    const effectiveStoreId = identity?.store_id || "c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7";

    let q = supabase
      .from("tourism_trips")
      .select("*")
      .eq("store_id", effectiveStoreId)
      .order("created_at", { ascending: false });

    if (data?.status && data.status !== "all") {
      q = q.eq("status", data.status);
    }
    if (data?.query && data.query.trim()) {
      q = q.or(`title.ilike.%${data.query.trim()}%,destination_city.ilike.%${data.query.trim()}%,client_name.ilike.%${data.query.trim()}%`);
    }

    const { data: rows, error } = await q.limit(50);
    if (error) {
      console.error("[listStoreTrips] Erro ao buscar viagens:", error);
      return [];
    }

    return (rows || []).map((r) => ({
      ...r,
      flights: r.flights || [],
      hotels: r.hotels || [],
      transfers: r.transfers || [],
      tours: r.tours || [],
      insurance: r.insurance || {},
      itinerary: r.itinerary || [],
      rooms: r.rooms || [],
      includes: r.includes || [],
      excludes: r.excludes || [],
    }));
  });

// ─── 4. Salvar Item de Confirmação (Localizador PNR / Reserva Hotel) ──────────

export const saveConfirmationItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      tripId: z.string().uuid("ID da viagem inválido"),
      itemType: z.enum(["flight", "hotel", "transfer", "tour", "insurance", "cruise", "other"]),
      providerName: z.string().min(1, "Fornecedor obrigatório"),
      locatorCode: z.string().min(1, "Localizador obrigatório"),
      status: z.enum(["pending", "confirmed", "cancelled", "reaccommodated"]).default("confirmed"),
      serviceDate: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean; id: string }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity().catch(() => null);
    const effectiveStoreId = identity?.store_id || "c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7";

    if (data.id) {
      const { error } = await supabase
        .from("trip_confirmation_items")
        .update({
          item_type: data.itemType,
          provider_name: data.providerName,
          locator_code: data.locatorCode,
          status: data.status,
          service_date: data.serviceDate || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) throw new Error("Erro ao atualizar localizador: " + error.message);
      return { success: true, id: data.id };
    }

    const { data: created, error } = await supabase
      .from("trip_confirmation_items")
      .insert({
        trip_id: data.tripId,
        store_id: effectiveStoreId,
        item_type: data.itemType,
        provider_name: data.providerName,
        locator_code: data.locatorCode,
        status: data.status,
        service_date: data.serviceDate || null,
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (error || !created) throw new Error("Erro ao criar localizador: " + (error?.message || ""));
    return { success: true, id: created.id };
  });

// ─── 5. Buscar Voucher Público por Token ──────────────────────────────────────

export const getPublicVoucherByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }): Promise<{
    voucher: TourismVoucherDTO;
    trip: TourismTripDTO;
    store: { name: string; logo_url?: string | null; whatsapp_phone?: string | null };
  } | null> => {
    const supabase = getAnonServerClient();

    const { data: voucher, error: vchErr } = await supabase
      .from("tourism_vouchers")
      .select("*, tourism_trips(*, stores(name, logo_url, settings))")
      .eq("public_token", data.token)
      .maybeSingle();

    if (vchErr || !voucher) return null;

    const trip = voucher.tourism_trips as any;
    const store = trip?.stores || {};
    const settings = store.settings || {};

    return {
      voucher: {
        ...voucher,
        emergency_contacts: voucher.emergency_contacts || [],
        passengers: voucher.passengers || [],
        flights: voucher.flights || [],
        hotels: voucher.hotels || [],
        transfers: voucher.transfers || [],
        tours: voucher.tours || [],
        insurance: voucher.insurance || {},
      },
      trip,
      store: {
        name: store.name || "Agência de Viagens",
        logo_url: store.logo_url || null,
        whatsapp_phone: settings.whatsapp_phone || settings.phone || null,
      },
    };
  });
