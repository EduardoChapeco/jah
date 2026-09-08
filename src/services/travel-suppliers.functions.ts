import { createServerFn } from '@tanstack/react-start';
import { getServerIdentity, assertStoreAccess } from '@/lib/identity.server';
import { getServerClient } from '@/lib/supabase';
import type { TravelSupplierDTO, SupplierKind } from '@/types/travel-suppliers';

export const listTravelSuppliers = createServerFn({ method: 'GET' })
 .validator((d: { store_id?: string; kind?: string }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 const storeId = data.store_id || identity.store_id;
 assertStoreAccess(identity);

 const db = getServerClient();
 let q = db
 .from('travel_suppliers')
 .select('*')
 .eq('store_id', storeId)
 .order('name', { ascending: true });

 if (data.kind && data.kind !== 'all') {
 q = q.eq('kind', data.kind);
 }

 const { data: rows, error } = await q;
 if (error) throw new Error('Erro ao listar fornecedores: ' + error.message);
 return (rows || []) as TravelSupplierDTO[];
 });

export const createTravelSupplier = createServerFn({ method: 'POST' })
 .validator((d: {
 store_id?: string;
 name: string;
 legal_name?: string | null;
 kind: SupplierKind;
 document?: string | null;
 commission_rate?: number;
 notes?: string | null;
 email?: string | null;
 phone?: string | null;
 city?: string | null;
 state?: string | null;
 country?: string;
 }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 const storeId = data.store_id || identity.store_id;
 assertStoreAccess(identity);

 const db = getServerClient();
 const { data: row, error } = await db
 .from('travel_suppliers')
 .insert({
 store_id: storeId,
 name: data.name,
 legal_name: data.legal_name || null,
 kind: data.kind || 'operator',
 document: data.document || null,
 commission_rate: data.commission_rate || 0,
 notes: data.notes || null,
 email: data.email || null,
 phone: data.phone || null,
 city: data.city || null,
 state: data.state || null,
 country: data.country || 'Brasil',
 })
 .select('*')
 .single();

 if (error) throw new Error('Erro ao cadastrar fornecedor: ' + error.message);
 return row as TravelSupplierDTO;
 });

export const updateTravelSupplier = createServerFn({ method: 'POST' })
 .validator((d: { id: string; patch: Partial<TravelSupplierDTO> }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();
 const { data: row, error } = await db
 .from('travel_suppliers')
 .update({
 ...data.patch,
 updated_at: new Date().toISOString(),
 })
 .eq('id', data.id)
 .select('*')
 .single();

 if (error) throw new Error('Erro ao atualizar fornecedor: ' + error.message);
 return row as TravelSupplierDTO;
 });

export const deleteTravelSupplier = createServerFn({ method: 'POST' })
 .validator((d: { id: string }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();
 const { error } = await db.from('travel_suppliers').delete().eq('id', data.id);
 if (error) throw new Error('Erro ao remover fornecedor: ' + error.message);
 return { success: true };
 });

export const searchTravelSuppliers = createServerFn({ method: 'GET' })
  .validator((d: { search: string; kind?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const identity = await getServerIdentity();
      const storeId = identity.store_id;
      const db = getServerClient();

      let q = db
        .from('travel_suppliers')
        .select('id, name, kind, city, country, rating, phone, email, commission_rate')
        .eq('store_id', storeId)
        .ilike('name', `%${data.search}%`)
        .order('name')
        .limit(10);

      if (data.kind && data.kind !== 'all') {
        q = q.eq('kind', data.kind);
      }

      const { data: rows, error } = await q;
      if (error) return [];
      return rows || [];
    } catch {
      return [];
    }
  });
