import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabase';
import { getServerIdentity, assertStoreAccess } from '@/lib/server-access';
import type {
  TravelFlightChangeCase,
  ChangeReason,
  AnacRightsSummary,
} from '@/types/travel-reaccommodation';

export function calculateAnacRights(reason: ChangeReason, delayHours: number = 0): AnacRightsSummary {
  const isDelayOrCancelled = reason === 'flight_cancelled' || reason === 'delay_over_4h' || delayHours >= 4;
  return {
    material_assistance: {
      communication: delayHours >= 1 || isDelayOrCancelled,
      food_voucher: delayHours >= 2 || isDelayOrCancelled,
      lodging_and_transfer: delayHours >= 4 || isDelayOrCancelled,
    },
    reaccommodation_options: {
      airline_own_flights: true,
      competitor_flights: isDelayOrCancelled || reason === 'overbooking',
      full_refund_eligible: isDelayOrCancelled || reason === 'schedule_change',
    },
  };
}

export const listFlightChangeCases = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      tripId: z.string().uuid().optional(),
    }).optional()
  )
  .handler(async ({ data }): Promise<TravelFlightChangeCase[]> => {
    const identity = await getServerIdentity();
    const effectiveStoreId = data?.storeId || identity.store_id;
    if (!effectiveStoreId) {
      throw new Error("Identificador da loja não fornecido.");
    }

    const db = getServerClient();
    let query = db
      .from('travel_flight_change_cases')
      .select(`
        *,
        alternatives:travel_flight_alternatives(*)
      `)
      .eq('store_id', effectiveStoreId)
      .order('created_at', { ascending: false });

    if (data?.tripId) {
      query = query.eq('trip_id', data.tripId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Erro ao carregar casos de reacomodação: ${error.message}`);
    return (rows as any[]) || [];
  });

export const createFlightChangeCase = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      store_id: z.string().uuid().optional(),
      trip_id: z.string().uuid().optional().nullable(),
      original_itinerary_id: z.string().uuid().optional().nullable(),
      change_reason: z.enum([
        'schedule_change',
        'flight_cancelled',
        'delay_over_4h',
        'connection_lost',
        'overbooking',
      ]),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
      passenger_notes: z.string().optional().nullable(),
      internal_notes: z.string().optional().nullable(),
      delay_hours: z.number().default(0),
    })
  )
  .handler(async ({ data }): Promise<TravelFlightChangeCase> => {
    const identity = await getServerIdentity();
    const effectiveStoreId = data.store_id || identity.store_id;
    if (!effectiveStoreId) {
      throw new Error("Identificador da loja não fornecido.");
    }
    assertStoreAccess(identity, ['owner', 'admin', 'manager', 'seller']);

    const db = getServerClient();
    const rights = calculateAnacRights(data.change_reason as ChangeReason, data.delay_hours);

    const { data: row, error } = await db
      .from('travel_flight_change_cases')
      .insert({
        store_id: effectiveStoreId,
        trip_id: data.trip_id,
        original_itinerary_id: data.original_itinerary_id,
        change_reason: data.change_reason,
        priority: data.priority,
        workflow_status: 'pending_analysis',
        passenger_notes: data.passenger_notes,
        internal_notes: data.internal_notes,
        anac_rights_summary: rights as any,
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao abrir caso de reacomodação: ${error.message}`);
    return row as any;
  });

export const updateChangeCaseWorkflow = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      workflow_status: z.enum([
        'pending_analysis',
        'alternatives_sent',
        'client_accepted',
        'client_rejected',
        'rebooking_confirmed',
        'refund_requested',
        'closed',
      ]),
      internal_notes: z.string().optional().nullable(),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ['owner', 'admin', 'manager', 'seller']);

    const db = getServerClient();

    // Valida se o caso pertence à loja gerenciada
    const { data: flightCase, error: fetchErr } = await db
      .from('travel_flight_change_cases')
      .select('id, store_id')
      .eq('id', data.id)
      .single();

    if (fetchErr || !flightCase) {
      throw new Error("Caso de reacomodação não encontrado.");
    }

    if (flightCase.store_id !== identity.store_id && !identity.is_super_admin) {
      throw new Error("Acesso não autorizado para esta loja.");
    }

    const { error } = await db
      .from('travel_flight_change_cases')
      .update({
        workflow_status: data.workflow_status,
        internal_notes: data.internal_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (error) throw new Error(`Erro ao atualizar caso: ${error.message}`);
    return { success: true };
  });
