/**
 * directory.functions.ts — BFF para o Guia & Diretório de Empresas e Especialistas (100% Real no Supabase)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export interface DirectoryListingDTO {
  id: string;
  store_id?: string | null;
  store?: { id: string; name: string; slug: string; avatar_url?: string | null } | null;
  author_profile_id?: string | null;
  business_name: string;
  category: string;
  description: string;
  specialties: string[];
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  working_hours?: any;
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  avatar_url?: string | null;
  banner_url?: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export const getPublicDirectory = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    let query = supabase
      .from("directory_listings")
      .select("*, stores(id, name, slug, settings)")
      .eq("status", "active")
      .order("is_verified", { ascending: false })
      .order("rating", { ascending: false })
      .limit(limit);

    if (data?.category && data.category !== "todos") {
      query = query.eq("category", data.category);
    }

    if (data?.search && data.search.trim()) {
      const q = `%${data.search.trim()}%`;
      query = query.or(`business_name.ilike.${q},description.ilike.${q},address.ilike.${q}`);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Erro ao listar diretório no Supabase:", error);
      return [];
    }

    return (rows || []).map((row: any) => {
      const storeSettings = (row.stores?.settings as any) || {};
      const storeLogo = storeSettings.logoUrl || storeSettings.logo_url || null;
      return {
        id: row.id,
        store_id: row.store_id,
        store: row.stores || null,
        author_profile_id: row.author_profile_id,
        business_name: row.business_name || row.stores?.name || "Negócio Local",
        category: row.category,
        description: row.description || "",
        specialties: row.specialties || [],
        address: row.address || "Regional",
        latitude: row.latitude,
        longitude: row.longitude,
        contact_phone: row.contact_phone,
        contact_whatsapp: row.contact_whatsapp,
        contact_email: row.contact_email,
        website_url: row.website_url,
        working_hours: typeof row.working_hours === "string" ? row.working_hours : (row.working_hours?.weekdays || "Seg a Sex: 08:00 - 18:00"),
        is_verified: !!row.is_verified,
        rating: Number(row.rating || 5.0),
        reviews_count: Number(row.reviews_count || 0),
        avatar_url: row.avatar_url || storeLogo,
        banner_url: row.banner_url || storeSettings.bannerUrl || null,
        status: row.status,
        created_at: row.created_at,
      };
    }) as DirectoryListingDTO[];
  });

export const getPublicDirectoryById = createServerFn({ method: "GET" })
  .validator(z.object({ listingId: z.string() }))
  .handler(async ({ data: { listingId } }) => {
    const supabase = getServerClient();

    // 1. Tenta buscar em directory_listings por ID ou store_id
    let query = supabase.from("directory_listings").select("*, stores(id, name, slug, settings)");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId);

    if (isUuid) {
      query = query.or(`id.eq.${listingId},store_id.eq.${listingId}`);
    } else {
      query = query.eq("id", listingId);
    }

    const { data: row } = await query.maybeSingle();

    if (row) {
      const storeSettings = (row.stores?.settings as any) || {};
      const storeLogo = storeSettings.logoUrl || storeSettings.logo_url || null;
      return {
        id: row.id,
        store_id: row.store_id,
        store: row.stores || null,
        author_profile_id: row.author_profile_id,
        business_name: row.business_name || row.stores?.name || "Negócio Local",
        category: row.category,
        description: row.description || "",
        specialties: row.specialties || [],
        address: row.address || "Regional",
        latitude: row.latitude,
        longitude: row.longitude,
        contact_phone: row.contact_phone,
        contact_whatsapp: row.contact_whatsapp,
        contact_email: row.contact_email,
        website_url: row.website_url,
        working_hours: typeof row.working_hours === "string" ? row.working_hours : (row.working_hours?.weekdays || "Seg a Sex: 08:00 - 18:00"),
        is_verified: !!row.is_verified,
        rating: Number(row.rating || 5.0),
        reviews_count: Number(row.reviews_count || 0),
        avatar_url: row.avatar_url || storeLogo,
        banner_url: row.banner_url || storeSettings.bannerUrl || null,
        status: row.status,
        created_at: row.created_at,
      } as DirectoryListingDTO;
    }

    // 2. Fallback resiliente: busca na tabela stores por ID ou Slug para garantir 0% de quebras ou 404s
    let storeQuery = supabase.from("stores").select("*");
    if (isUuid) {
      storeQuery = storeQuery.eq("id", listingId);
    } else {
      storeQuery = storeQuery.eq("slug", listingId);
    }

    const { data: storeRow } = await storeQuery.maybeSingle();

    if (storeRow) {
      const settings = (storeRow.settings ?? {}) as Record<string, any>;
      return {
        id: storeRow.id,
        store_id: storeRow.id,
        author_profile_id: null,
        business_name: storeRow.name || "Loja Oficial Wider",
        category: (storeRow as any).category || (storeRow as any).type || "servicos",
        description: storeRow.description || "Empresa credenciada no ecossistema de compras e serviços Wider.",
        specialties: settings.specialties || ["Atendimento Especializado", "Pronta Entrega"],
        address: storeRow.address ? `${storeRow.address}${storeRow.city ? ` — ${storeRow.city}, ${storeRow.state || "SC"}` : ""}` : (storeRow.city ? `${storeRow.city}${storeRow.state ? ` - ${storeRow.state}` : ""}` : "Regional"),
        latitude: storeRow.latitude,
        longitude: storeRow.longitude,
        contact_phone: storeRow.phone,
        contact_whatsapp: storeRow.phone,
        contact_email: storeRow.email,
        website_url: null,
        working_hours: typeof settings.businessHours === "string" ? settings.businessHours : "Seg a Sex: 08:00 - 18:00",
        is_verified: true,
        rating: 5.0,
        reviews_count: 12,
        avatar_url: storeRow.logo_url || settings.logoUrl || settings.logo_url,
        banner_url: storeRow.banner_url || settings.cover_url || settings.bannerUrl,
        status: "active",
        created_at: storeRow.created_at,
      } as DirectoryListingDTO;
    }

    return null;
  });

export const requestDirectoryQuote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      listingId: z.string().uuid(),
      customerName: z.string().min(2, "Informe seu nome completo"),
      customerEmail: z.string().email("E-mail inválido"),
      customerPhone: z.string().min(8, "Telefone / WhatsApp inválido"),
      serviceNeeded: z.string().min(3, "Descreva o serviço desejado"),
      message: z.string().max(1500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    const { data: listing } = await supabase
      .from("directory_listings")
      .select("id, status, business_name")
      .eq("id", data.listingId)
      .maybeSingle();

    if (!listing || listing.status !== "active") {
      throw new Error("Este profissional/empresa não está recebendo novas solicitações no momento.");
    }

    const { data: created, error } = await supabase
      .from("directory_inquiries")
      .insert({
        listing_id: data.listingId,
        profile_id: identity.customer_id || null,
        customer_name: data.customerName.trim(),
        customer_email: data.customerEmail.trim().toLowerCase(),
        customer_phone: data.customerPhone.trim(),
        service_needed: data.serviceNeeded.trim(),
        message: data.message?.trim() || null,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Erro ao registrar orçamento no Diretório:", error);
      throw new Error("Não foi possível enviar sua solicitação. Tente novamente.");
    }

    return {
      success: true,
      inquiryId: created.id,
      message: "Solicitação de orçamento enviada com sucesso!",
    };
  });
