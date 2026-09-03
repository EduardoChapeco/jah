/**
 * travel-catalog.functions.ts — BFF para Gestão Centralizada de Destinos e Banco de Hotéis
 * Padrão BigTech | Zero Mocks | Multi-tenant por store_id
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

// ─── DTOs Canônicos ─────────────────────────────────────────────────────────

export interface DestinationDTO {
  id: string;
  store_id: string | null;
  name: string;
  slug?: string | null;
  country: string;
  region?: string | null;
  description?: string | null;
  best_season?: string | null;
  iata_gateway?: string | null;
  weather_summary?: string | null;
  cover_image_url?: string | null;
  gallery_urls?: string[];
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hotels_count?: number;
}

export interface HotelBankDTO {
  id: string;
  store_id: string | null;
  destination_id?: string | null;
  destination_name?: string | null;
  name: string;
  city: string;
  state?: string | null;
  country: string;
  stars: number;
  regime_options: string[];
  description?: string | null;
  bio_bullets?: string[];
  highlights?: Array<{ label: string; imageUrl?: string }>;
  badges?: string[];
  photos?: string[];
  cover_photo_url?: string | null;
  website?: string | null;
  phone?: string | null;
  internal_rating: number;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── 1. SERVIÇOS DE DESTINOS TURÍSTICOS ──────────────────────────────────────

export const listDestinations = createServerFn({ method: "GET" }).handler(async () => {
  const db = getServerClient();
  const identity = await getServerIdentity().catch(() => null);
  const effectiveStoreId = identity?.store_id;

  let query = db
    .from("destinations")
    .select("*, hotels_bank(count)")
    .order("name", { ascending: true });

  if (effectiveStoreId) {
    query = query.or(`store_id.eq.${effectiveStoreId},store_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`[travel-catalog:listDestinations] Falha ao consultar destinations: ${error.message} (code: ${error.code})`);
  }

  return (data || []).map((row: any) => ({
    ...row,
    gallery_urls: row.gallery_urls || [],
    hotels_count: row.hotels_bank?.[0]?.count || 0,
  })) as DestinationDTO[];
});

export const getDestinationById = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data: { id } }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("destinations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Destino não encontrado.");
    return { ...data, gallery_urls: data.gallery_urls || [] } as DestinationDTO;
  });

export const createDestination = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2, "Nome do destino deve ter pelo menos 2 caracteres."),
      country: z.string().default("Brasil"),
      region: z.string().optional(),
      description: z.string().optional(),
      best_season: z.string().optional(),
      iata_gateway: z.string().optional(),
      weather_summary: z.string().optional(),
      cover_image_url: z.string().optional(),
      gallery_urls: z.array(z.string()).optional(),
    })
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const { store_id, profile_id } = await getServerIdentity();
    if (!store_id) throw new Error("Nenhuma loja ativa selecionada.");

    const slug = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const { data: inserted, error } = await db
      .from("destinations")
      .insert({
        store_id,
        created_by_profile_id: profile_id,
        name: data.name.trim(),
        slug,
        country: data.country.trim(),
        region: data.region?.trim() || null,
        description: data.description?.trim() || null,
        best_season: data.best_season?.trim() || null,
        iata_gateway: data.iata_gateway?.trim() || null,
        weather_summary: data.weather_summary?.trim() || null,
        cover_image_url: data.cover_image_url || null,
        gallery_urls: data.gallery_urls || [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return inserted as DestinationDTO;
  });

export const updateDestination = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(2).optional(),
      country: z.string().optional(),
      region: z.string().optional(),
      description: z.string().optional(),
      best_season: z.string().optional(),
      iata_gateway: z.string().optional(),
      weather_summary: z.string().optional(),
      cover_image_url: z.string().optional(),
      gallery_urls: z.array(z.string()).optional(),
      is_active: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const { store_id } = await getServerIdentity();
    const { id, ...updates } = data;

    const { data: updated, error } = await db
      .from("destinations")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("store_id", store_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as DestinationDTO;
  });

export const deleteDestination = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const db = getServerClient();
    const { store_id } = await getServerIdentity();

    const { error } = await db
      .from("destinations")
      .delete()
      .eq("id", id)
      .eq("store_id", store_id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── 2. SERVIÇOS DO BANCO DE HOTÉIS & RESORTS ───────────────────────────────

export const listHotelsBank = createServerFn({ method: "GET" })
  .validator((input?: { search?: string; destination_id?: string }) => input || {})
  .handler(async ({ data }) => {
    const db = getServerClient();
    const identity = await getServerIdentity().catch(() => null);
    const effectiveStoreId = identity?.store_id;

    let query = db
      .from("hotels_bank")
      .select("*, destinations(name)")
      .order("name", { ascending: true });

    if (effectiveStoreId) {
      query = query.or(`store_id.eq.${effectiveStoreId},store_id.is.null`);
    }

    if (data?.destination_id) {
      query = query.eq("destination_id", data.destination_id);
    }

    if (data?.search?.trim()) {
      const s = `%${data.search.trim()}%`;
      query = query.or(`name.ilike.${s},city.ilike.${s},state.ilike.${s}`);
    }

    const { data: rows, error } = await query;
    if (error) {
      throw new Error(`[travel-catalog:listHotels] Falha ao consultar hotels_bank: ${error.message} (code: ${error.code})`);
    }

    return (rows || []).map((row: any) => ({
      ...row,
      destination_name: row.destinations?.name || null,
      regime_options: row.regime_options || ["All Inclusive"],
      bio_bullets: row.bio_bullets || [],
      highlights: Array.isArray(row.highlights) ? row.highlights : [],
      badges: row.badges || [],
      photos: row.photos || [],
      tags: row.tags || [],
    })) as HotelBankDTO[];
  });

export const getHotelById = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data: { id } }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("hotels_bank")
      .select("*, destinations(name)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Hotel não encontrado.");

    return {
      ...data,
      destination_name: data.destinations?.name || null,
      regime_options: data.regime_options || ["All Inclusive"],
      bio_bullets: data.bio_bullets || [],
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      badges: data.badges || [],
      photos: data.photos || [],
    } as HotelBankDTO;
  });

export const createHotel = createServerFn({ method: "POST" })
  .validator(
    z.object({
      destination_id: z.string().uuid().optional().nullable(),
      name: z.string().min(2, "Nome do hotel é obrigatório."),
      city: z.string().min(2, "Cidade é obrigatória."),
      state: z.string().optional().nullable(),
      country: z.string().default("Brasil"),
      stars: z.number().int().min(1).max(5).default(4),
      regime_options: z.array(z.string()).default(["All Inclusive"]),
      description: z.string().optional().nullable(),
      bio_bullets: z.array(z.string()).optional(),
      highlights: z.array(z.any()).optional(),
      badges: z.array(z.string()).optional(),
      photos: z.array(z.string()).optional(),
      cover_photo_url: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      internal_rating: z.number().default(4.8),
    })
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const { store_id, profile_id } = await getServerIdentity();
    if (!store_id) throw new Error("Nenhuma loja ativa selecionada.");

    const { data: inserted, error } = await db
      .from("hotels_bank")
      .insert({
        store_id,
        created_by_profile_id: profile_id,
        destination_id: data.destination_id || null,
        name: data.name.trim(),
        city: data.city.trim(),
        state: data.state?.trim() || null,
        country: data.country.trim(),
        stars: data.stars,
        regime_options: data.regime_options,
        description: data.description?.trim() || null,
        bio_bullets: data.bio_bullets || [],
        highlights: data.highlights || [],
        badges: data.badges || ["Eco-friendly", "Pé na Areia"],
        photos: data.photos || [],
        cover_photo_url: data.cover_photo_url || (data.photos && data.photos[0]) || null,
        website: data.website?.trim() || null,
        phone: data.phone?.trim() || null,
        internal_rating: data.internal_rating,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return inserted as HotelBankDTO;
  });

export const updateHotel = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      destination_id: z.string().uuid().optional().nullable(),
      name: z.string().min(2).optional(),
      city: z.string().optional(),
      state: z.string().optional().nullable(),
      stars: z.number().int().min(1).max(5).optional(),
      regime_options: z.array(z.string()).optional(),
      description: z.string().optional().nullable(),
      bio_bullets: z.array(z.string()).optional(),
      badges: z.array(z.string()).optional(),
      photos: z.array(z.string()).optional(),
      cover_photo_url: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      internal_rating: z.number().optional(),
      is_active: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const { store_id } = await getServerIdentity();
    const { id, ...updates } = data;

    const { data: updated, error } = await db
      .from("hotels_bank")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("store_id", store_id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as HotelBankDTO;
  });

export const deleteHotel = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const db = getServerClient();
    const { store_id } = await getServerIdentity();

    const { error } = await db
      .from("hotels_bank")
      .delete()
      .eq("id", id)
      .eq("store_id", store_id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
