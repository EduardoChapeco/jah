/**
 * tourism.functions.ts — BFF para o Módulo Master de Turismo, Viagens & Lazer (100% Real no Supabase)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export interface TourismItemDTO {
  id: string;
  store_id?: string | null;
  author_profile_id?: string | null;
  title: string;
  subtitle?: string | null;
  description: string;
  category: "passeios" | "hospedagens" | "gastronomia_turistica" | "aventura" | "agencias" | "cultura";
  location: string;
  duration: string;
  price_display: string;
  price_cents?: number | null;
  image_url: string;
  gallery_urls: string[];
  provider_name: string;
  provider_logo_url?: string | null;
  contact_whatsapp: string;
  rating: number;
  included_items: string[];
  what_to_bring: string[];
  is_featured: boolean;
  status: "active" | "inactive" | "draft";
  created_at: string;
}

export const listPublicTourism = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    let query = supabase
      .from("tourism_experiences")
      .select("*")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data?.category && data.category !== "todos") {
      query = query.eq("category", data.category);
    }

    if (data?.search && data.search.trim()) {
      const q = `%${data.search.trim()}%`;
      query = query.or(`title.ilike.${q},subtitle.ilike.${q},location.ilike.${q},provider_name.ilike.${q},description.ilike.${q}`);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Erro ao listar turismo no Supabase:", error);
      return [];
    }

    return (rows || []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      author_profile_id: row.author_profile_id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      category: row.category,
      location: row.location,
      duration: row.duration,
      price_display: row.price_display,
      price_cents: row.price_cents ? Number(row.price_cents) : null,
      image_url: row.image_url,
      gallery_urls: row.gallery_urls || [],
      provider_name: row.provider_name,
      provider_logo_url: row.provider_logo_url,
      contact_whatsapp: row.contact_whatsapp,
      rating: Number(row.rating || 5.0),
      included_items: row.included_items || [],
      what_to_bring: row.what_to_bring || [],
      is_featured: row.is_featured ?? false,
      status: row.status,
      created_at: row.created_at,
    })) as TourismItemDTO[];
  });

export const getPublicTourismById = createServerFn({ method: "GET" })
  .validator(z.object({ experienceId: z.string().uuid() }))
  .handler(async ({ data: { experienceId } }) => {
    const supabase = getServerClient();

    const { data: row, error } = await supabase
      .from("tourism_experiences")
      .select("*")
      .eq("id", experienceId)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    return {
      id: row.id,
      store_id: row.store_id,
      author_profile_id: row.author_profile_id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      category: row.category,
      location: row.location,
      duration: row.duration,
      price_display: row.price_display,
      price_cents: row.price_cents ? Number(row.price_cents) : null,
      image_url: row.image_url,
      gallery_urls: row.gallery_urls || [],
      provider_name: row.provider_name,
      provider_logo_url: row.provider_logo_url,
      contact_whatsapp: row.contact_whatsapp,
      rating: Number(row.rating || 5.0),
      included_items: row.included_items || [],
      what_to_bring: row.what_to_bring || [],
      is_featured: row.is_featured ?? false,
      status: row.status,
      created_at: row.created_at,
    } as TourismItemDTO;
  });

export const inquireTourismExperience = createServerFn({ method: "POST" })
  .validator(
    z.object({
      experienceId: z.string().uuid(),
      customerName: z.string().min(2, "Informe seu nome"),
      customerEmail: z.string().email("E-mail inválido"),
      customerPhone: z.string().min(8, "Telefone inválido"),
      desiredDate: z.string().optional(),
      guestsCount: z.number().int().min(1).default(1),
      message: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    const { data: exp } = await supabase
      .from("tourism_experiences")
      .select("id, status, title")
      .eq("id", data.experienceId)
      .maybeSingle();

    if (!exp || exp.status !== "active") {
      throw new Error("Esta experiência não está disponível para reservas no momento.");
    }

    const { data: created, error } = await supabase
      .from("tourism_inquiries")
      .insert({
        experience_id: data.experienceId,
        profile_id: identity.customer_id || null,
        customer_name: data.customerName.trim(),
        customer_email: data.customerEmail.trim().toLowerCase(),
        customer_phone: data.customerPhone.trim(),
        desired_date: data.desiredDate || null,
        guests_count: data.guestsCount,
        message: data.message?.trim() || null,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Erro ao registrar interesse turístico no Supabase:", error);
      throw new Error("Não foi possível registrar seu interesse. Tente novamente.");
    }

    return {
      success: true,
      inquiryId: created.id,
      message: "Solicitação de reserva registrada com sucesso!",
    };
  });
