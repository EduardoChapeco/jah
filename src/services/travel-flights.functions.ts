import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabase';
import { getServerIdentity, assertStoreAccess } from '@/lib/server-access';
import type { TravelFlightItinerary } from '@/types/travel-flights';

export const listFlightItineraries = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      tripId: z.string().uuid().optional(),
    }).optional()
  )
  .handler(async ({ data }): Promise<TravelFlightItinerary[]> => {
    const identity = await getServerIdentity();
    const effectiveStoreId = data?.storeId || identity.store_id;
    if (!effectiveStoreId) {
      throw new Error("Identificador da loja não fornecido.");
    }

    const db = getServerClient();
    let query = db
      .from('travel_flight_itineraries')
      .select(`
        *,
        segments:travel_flight_segments(*)
      `)
      .eq('store_id', effectiveStoreId)
      .order('version', { ascending: false });

    if (data?.tripId) {
      query = query.eq('trip_id', data.tripId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Erro ao carregar itinerários de voo: ${error.message}`);
    return (rows as any[]) || [];
  });

export const createFlightItinerary = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      store_id: z.string().uuid().optional(),
      trip_id: z.string().uuid().optional().nullable(),
      title: z.string().min(2),
      itinerary_type: z.enum(['original', 'operator_suggestion', 'customer_selected', 'confirmed']),
      status: z.enum(['draft', 'active', 'archived']).default('draft'),
      notes: z.string().optional().nullable(),
      segments: z.array(
        z.object({
          airline_code: z.string().min(2),
          airline_name: z.string().optional().nullable(),
          flight_number: z.string().min(1),
          origin_iata: z.string().length(3),
          origin_city: z.string().optional().nullable(),
          destination_iata: z.string().length(3),
          destination_city: z.string().optional().nullable(),
          departure_at: z.string(),
          arrival_at: z.string(),
          cabin: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
          baggage: z.string().default('1x 23kg'),
          record_locator: z.string().optional().nullable(),
          ticket_number: z.string().optional().nullable(),
          airport_terminal: z.string().optional().nullable(),
        })
      ),
    })
  )
  .handler(async ({ data }): Promise<TravelFlightItinerary> => {
    const identity = await getServerIdentity();
    const effectiveStoreId = data.store_id || identity.store_id;
    if (!effectiveStoreId) {
      throw new Error("Identificador da loja não fornecido.");
    }
    assertStoreAccess(identity, ['owner', 'admin', 'manager', 'seller']);

    const db = getServerClient();
    // Buscar maior versão
    const { data: existing } = await db
      .from('travel_flight_itineraries')
      .select('version')
      .eq('store_id', effectiveStoreId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? (existing[0].version || 0) + 1 : 1;

    const { data: newItinerary, error: itError } = await db
      .from('travel_flight_itineraries')
      .insert({
        store_id: effectiveStoreId,
        trip_id: data.trip_id,
        title: data.title,
        version: nextVersion,
        itinerary_type: data.itinerary_type,
        status: data.status,
        notes: data.notes,
      })
      .select()
      .single();

    if (itError) throw new Error(`Erro ao criar itinerário: ${itError.message}`);

    if (data.segments && data.segments.length > 0) {
      const segmentsToInsert = data.segments.map((seg, idx) => ({
        store_id: effectiveStoreId,
        itinerary_id: newItinerary.id,
        segment_order: idx + 1,
        airline_code: seg.airline_code.toUpperCase(),
        airline_name: seg.airline_name,
        flight_number: seg.flight_number.toUpperCase(),
        origin_iata: seg.origin_iata.toUpperCase(),
        origin_city: seg.origin_city,
        destination_iata: seg.destination_iata.toUpperCase(),
        destination_city: seg.destination_city,
        departure_at: seg.departure_at,
        arrival_at: seg.arrival_at,
        cabin: seg.cabin,
        baggage: seg.baggage,
        record_locator: seg.record_locator?.toUpperCase(),
        ticket_number: seg.ticket_number?.trim(),
        airport_terminal: seg.airport_terminal,
      }));

      const { error: segError } = await db.from('travel_flight_segments').insert(segmentsToInsert);
      if (segError) {
        await db.from('travel_flight_itineraries').delete().eq('id', newItinerary.id);
        throw new Error(`Erro ao cadastrar trechos de voo: ${segError.message}`);
      }
    }

    const { data: full, error: fetchErr } = await db
      .from('travel_flight_itineraries')
      .select(`
        *,
        segments:travel_flight_segments(*)
      `)
      .eq('id', newItinerary.id)
      .single();

    if (fetchErr) throw fetchErr;
    return full as any;
  });

export const deleteFlightItinerary = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ['owner', 'admin', 'manager', 'seller']);

    const db = getServerClient();

    // Valida se o itinerário pertence à loja do usuário autenticado
    const { data: itinerary, error: fetchErr } = await db
      .from('travel_flight_itineraries')
      .select('id, store_id')
      .eq('id', data.id)
      .single();

    if (fetchErr || !itinerary) {
      throw new Error("Itinerário não encontrado.");
    }

    if (itinerary.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
      throw new Error("Acesso não autorizado para esta loja.");
    }

    const { error } = await db
      .from('travel_flight_itineraries')
      .delete()
      .eq('id', data.id);

    if (error) throw new Error(`Erro ao excluir itinerário: ${error.message}`);
    return { success: true };
  });
