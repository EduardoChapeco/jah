import { createServerFn } from '@tanstack/react-start';
import { getServerIdentity, assertStoreAccess } from '@/lib/identity.server';
import { getServerClient } from '@/lib/supabase.server';
import type { DepartureCardDTO, DepartureStage } from '@/types/travel-departures';

export const listDepartureCards = createServerFn({ method: 'GET' })
  .validator((d: { store_id?: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const storeId = data.store_id || identity.store_id;
    assertStoreAccess(identity, storeId);

    const db = getServerClient();
    const { data: rows, error } = await db
      .from('travel_departures_kanban')
      .select('*')
      .eq('store_id', storeId)
      .order('departure_date', { ascending: true });

    if (error) throw new Error('Erro ao listar kanban de embarques: ' + error.message);
    return (rows || []) as DepartureCardDTO[];
  });

export const createDepartureCard = createServerFn({ method: 'POST' })
  .validator((d: {
    store_id?: string;
    client_name: string;
    client_phone?: string | null;
    destination: string;
    departure_date: string;
    return_date?: string | null;
    passengers_count?: number;
    notes?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const storeId = data.store_id || identity.store_id;
    assertStoreAccess(identity, storeId);

    const db = getServerClient();
    const { data: row, error } = await db
      .from('travel_departures_kanban')
      .insert({
        store_id: storeId,
        client_name: data.client_name,
        client_phone: data.client_phone || null,
        destination: data.destination,
        departure_date: data.departure_date,
        return_date: data.return_date || null,
        stage: 'booked',
        passengers_count: data.passengers_count || 1,
        notes: data.notes || null,
      })
      .select('*')
      .single();

    if (error) throw new Error('Erro ao criar cartão de embarque: ' + error.message);
    return row as DepartureCardDTO;
  });

export const updateDepartureStage = createServerFn({ method: 'POST' })
  .validator((d: { id: string; stage: DepartureStage }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: row, error } = await db
      .from('travel_departures_kanban')
      .update({
        stage: data.stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select('*')
      .single();

    if (error) throw new Error('Erro ao atualizar estágio do embarque: ' + error.message);
    return row as DepartureCardDTO;
  });

export const deleteDepartureCard = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db.from('travel_departures_kanban').delete().eq('id', data.id);
    if (error) throw new Error('Erro ao remover cartão: ' + error.message);
    return { success: true };
  });
