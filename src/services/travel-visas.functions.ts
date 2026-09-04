import { createServerFn } from '@tanstack/react-start';
import { getServerIdentity, assertStoreAccess } from '@/lib/identity.server';
import { getServerClient } from '@/lib/supabase.server';
import type { TravelVisaDTO, VisaStatus } from '@/types/travel-visas';

export const listTravelVisas = createServerFn({ method: 'GET' })
  .validator((d: { store_id?: string; status?: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const storeId = data.store_id || identity.store_id;
    assertStoreAccess(identity, storeId);

    const db = getServerClient();
    let q = db
      .from('travel_visas')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (data.status && data.status !== 'all') {
      q = q.eq('status', data.status);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error('Erro ao listar processos de visto: ' + error.message);
    return (rows || []) as TravelVisaDTO[];
  });

export const createTravelVisa = createServerFn({ method: 'POST' })
  .validator((d: {
    store_id?: string;
    client_name: string;
    client_passport?: string | null;
    country: string;
    visa_category?: string;
    interview_date?: string | null;
    expected_date?: string | null;
    notes?: string | null;
  }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    const storeId = data.store_id || identity.store_id;
    assertStoreAccess(identity, storeId);

    const defaultDocs = [
      { id: 'd-1', title: 'Passaporte Original (Validade mínima 6 meses)', status: 'pendente' },
      { id: 'd-2', title: 'Foto 5x5 ou 5x7 padrão consular com fundo branco', status: 'pendente' },
      { id: 'd-3', title: 'Comprovante de Vínculo e Renda (IR / Extratos)', status: 'pendente' },
      { id: 'd-4', title: 'Comprovante de Reserva / Carta Convite', status: 'pendente' },
    ];

    const db = getServerClient();
    const { data: row, error } = await db
      .from('travel_visas')
      .insert({
        store_id: storeId,
        client_name: data.client_name,
        client_passport: data.client_passport || null,
        country: data.country,
        visa_category: data.visa_category || 'Turismo / Negócios',
        status: 'coleta_documentos',
        interview_date: data.interview_date || null,
        expected_date: data.expected_date || null,
        documents: defaultDocs,
        notes: data.notes || null,
      })
      .select('*')
      .single();

    if (error) throw new Error('Erro ao criar processo de visto: ' + error.message);
    return row as TravelVisaDTO;
  });

export const updateTravelVisaStatus = createServerFn({ method: 'POST' })
  .validator((d: { id: string; status: VisaStatus; notes?: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const patch: any = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    if (data.notes !== undefined) patch.notes = data.notes;

    const { data: row, error } = await db
      .from('travel_visas')
      .update(patch)
      .eq('id', data.id)
      .select('*')
      .single();

    if (error) throw new Error('Erro ao atualizar status: ' + error.message);
    return row as TravelVisaDTO;
  });

export const deleteTravelVisa = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db.from('travel_visas').delete().eq('id', data.id);
    if (error) throw new Error('Erro ao remover processo: ' + error.message);
    return { success: true };
  });
