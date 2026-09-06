import { createServerFn } from '@tanstack/react-start';
import { getServerIdentity, assertStoreAccess } from '@/lib/identity.server';
import { getServerClient } from '@/lib/supabase';
import type { TravelVoucherDTO, VoucherType } from '@/types/travel-vouchers';

export const listTravelVouchers = createServerFn({ method: 'GET' })
 .validator((d: { store_id?: string; type?: string }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 const storeId = data.store_id || identity.store_id;
 assertStoreAccess(identity);

 const db = getServerClient();
 let q = db
 .from('travel_vouchers')
 .select('*')
 .eq('store_id', storeId)
 .order('created_at', { ascending: false });

 if (data.type && data.type !== 'all') {
 q = q.eq('voucher_type', data.type);
 }

 const { data: rows, error } = await q;
 if (error) throw new Error('Erro ao listar vouchers: ' + error.message);
 return (rows || []) as TravelVoucherDTO[];
 });

export const createTravelVoucher = createServerFn({ method: 'POST' })
 .validator((d: {
 store_id?: string;
 trip_id?: string | null;
 voucher_type: VoucherType;
 title: string;
 passenger_name: string;
 passenger_document?: string | null;
 flight_data?: any;
 hotel_data?: any;
 transfer_data?: any;
 }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 const storeId = data.store_id || identity.store_id;
 assertStoreAccess(identity);

 const voucherNumber = 'VCH-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Date.now().toString().slice(-4);
 const qrHash = 'WIDER_VOUCHER_' + voucherNumber + '_' + Date.now();

 const db = getServerClient();
 const { data: row, error } = await db
 .from('travel_vouchers')
 .insert({
 store_id: storeId,
 trip_id: data.trip_id || null,
 voucher_number: voucherNumber,
 voucher_type: data.voucher_type || 'flight',
 title: data.title,
 passenger_name: data.passenger_name,
 passenger_document: data.passenger_document || null,
 qr_code_hash: qrHash,
 flight_data: data.flight_data || {},
 hotel_data: data.hotel_data || {},
 transfer_data: data.transfer_data || {},
 status: 'issued',
 })
 .select('*')
 .single();

 if (error) throw new Error('Erro ao emitir voucher: ' + error.message);
 return row as TravelVoucherDTO;
 });

export const deleteTravelVoucher = createServerFn({ method: 'POST' })
 .validator((d: { id: string }) => d)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();
 const { error } = await db.from('travel_vouchers').delete().eq('id', data.id);
 if (error) throw new Error('Erro ao remover voucher: ' + error.message);
 return { success: true };
 });
