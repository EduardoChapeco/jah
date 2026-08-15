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
      .select("*")
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

    return (rows || []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      author_profile_id: row.author_profile_id,
      business_name: row.business_name || "Negócio Local",
      category: row.category,
      description: row.description || "",
      specialties: row.specialties || [],
      address: row.address || "Chapecó - SC",
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
      avatar_url: row.avatar_url,
      banner_url: row.banner_url,
      status: row.status,
      created_at: row.created_at,
    })) as DirectoryListingDTO[];
  });

export const getPublicDirectoryById = createServerFn({ method: "GET" })
  .validator(z.object({ listingId: z.string().uuid() }))
  .handler(async ({ data: { listingId } }) => {
    const supabase = getServerClient();

    const { data: row, error } = await supabase
      .from("directory_listings")
      .select("*")
      .eq("id", listingId)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    return {
      id: row.id,
      store_id: row.store_id,
      author_profile_id: row.author_profile_id,
      business_name: row.business_name || "Negócio Local",
      category: row.category,
      description: row.description || "",
      specialties: row.specialties || [],
      address: row.address || "Chapecó - SC",
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
      avatar_url: row.avatar_url,
      banner_url: row.banner_url,
      status: row.status,
      created_at: row.created_at,
    } as DirectoryListingDTO;
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
