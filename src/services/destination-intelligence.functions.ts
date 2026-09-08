import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabase';
import type { DestinationIntelligence, TravelAlert, DestinationReview } from '@/types/destination-intelligence';

// ─── 1. Listar destinos com inteligência ───
export const listDestinationIntelligence = createServerFn({ method: 'POST' })
 .validator(z.object({
 store_id: z.string().uuid(),
 featured_only: z.boolean().optional(),
 limit: z.number().int().min(1).max(100).optional(),
 }))
 .handler(async ({ data }) => {
 const supabase = getServerClient();
 let q = supabase
 .from('destination_intelligence')
 .select('*')
 .eq('store_id', data.store_id)
 .order('demand_score', { ascending: false });

 if (data.featured_only) q = q.eq('is_featured', true);
 if (data.limit) q = q.limit(data.limit);

 const { data: rows, error } = await q;
 if (error) throw new Error(error.message);
 return (rows ?? []) as DestinationIntelligence[];
 });

// ─── 2. Upsert destino ───
export const upsertDestinationIntelligence = createServerFn({ method: 'POST' })
 .validator(z.object({
 destination: z.object({
 id: z.string().uuid().optional(),
 store_id: z.string().uuid(),
 destination: z.string().min(2).max(200),
 country_code: z.string().length(2).default('BR'),
 continent: z.string().default('America'),
 demand_score: z.number().int().min(0).max(100).default(50),
 trend: z.enum(['rising', 'stable', 'falling']).default('stable'),
 best_months: z.array(z.string()).optional(),
 peak_season: z.string().nullable().optional(),
 avg_temp_celsius: z.number().nullable().optional(),
 avg_package_brl: z.number().nullable().optional(),
 avg_daily_rate_brl: z.number().nullable().optional(),
 min_budget_brl: z.number().nullable().optional(),
 is_featured: z.boolean().default(false),
 is_visa_required: z.boolean().default(false),
 safety_level: z.enum(['safe','moderate','caution','warning']).default('safe'),
 currency_code: z.string().length(3).nullable().optional(),
 exchange_rate_brl: z.number().nullable().optional(),
 image_url: z.string().url().nullable().optional(),
 tags: z.array(z.string()).default([]),
 highlights: z.array(z.string()).default([]),
 }),
 }))
 .handler(async ({ data }) => {
 const supabase = getServerClient();
 const { data: row, error } = await supabase
 .from('destination_intelligence')
 .upsert(data.destination, { onConflict: 'id' })
 .select()
 .single();
 if (error) throw new Error(error.message);
 return row as DestinationIntelligence;
 });

// ─── 3. Listar alertas de viagem ativos ───
export const listTravelAlerts = createServerFn({ method: 'POST' })
 .validator(z.object({
 store_id: z.string().uuid(),
 destination: z.string().optional(),
 severity: z.enum(['info','warning','critical']).optional(),
 }))
 .handler(async ({ data }) => {
 const supabase = getServerClient();
 let q = supabase
 .from('travel_alerts')
 .select('*')
 .eq('store_id', data.store_id)
 .eq('is_active', true)
 .order('created_at', { ascending: false });

 if (data.destination) q = q.eq('destination', data.destination);
 if (data.severity) q = q.eq('severity', data.severity);

 const { data: rows, error } = await q;
 if (error) throw new Error(error.message);
 return (rows ?? []) as TravelAlert[];
 });

// ─── 4. Criar alerta de viagem ───
export const createTravelAlert = createServerFn({ method: 'POST' })
 .validator(z.object({
 alert: z.object({
 store_id: z.string().uuid(),
 destination: z.string().min(2),
 severity: z.enum(['info','warning','critical']),
 category: z.enum(['health','security','weather','operational','visa','currency']),
 title: z.string().min(3).max(200),
 description: z.string().min(10),
 source_url: z.string().url().nullable().optional(),
 expires_at: z.string().datetime().nullable().optional(),
 }),
 }))
 .handler(async ({ data }) => {
 const supabase = getServerClient();
 const { data: row, error } = await supabase
 .from('travel_alerts')
 .insert(data.alert)
 .select()
 .single();
 if (error) throw new Error(error.message);
 return row as TravelAlert;
 });

// ─── 5. Listar avaliações de destino ───
export const listDestinationReviews = createServerFn({ method: 'POST' })
 .validator(z.object({
 store_id: z.string().uuid(),
 destination: z.string(),
 featured_only: z.boolean().optional(),
 }))
 .handler(async ({ data }) => {
 const supabase = getServerClient();
 let q = supabase
 .from('destination_reviews')
 .select('*')
 .eq('store_id', data.store_id)
 .eq('destination', data.destination)
 .order('created_at', { ascending: false });

 if (data.featured_only) q = q.eq('is_featured', true);

 const { data: rows, error } = await q;
 if (error) throw new Error(error.message);
 return (rows ?? []) as DestinationReview[];
 });

export const getDestinationByName = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    try {
      const supabase = getServerClient();
      const { data: row } = await supabase
        .from('destination_intelligence')
        .select('*')
        .ilike('destination', `%${data.name}%`)
        .limit(1)
        .maybeSingle();
      return row || null;
    } catch {
      return null;
    }
  });
