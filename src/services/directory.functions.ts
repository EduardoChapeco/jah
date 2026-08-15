import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { z } from "zod";

export const getPublicDirectory = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        category: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    let query = supabase
      .from("directory_listings")
      .select(
        `
        id, category, address, latitude, longitude, contact_phone, working_hours, is_verified, status, created_at,
        stores ( name, type )
      `,
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data?.category) {
      query = query.eq("category", data.category);
    }

    const { data: listings } = await query;

    if (listings && listings.length > 0) {
      return listings;
    }

    // Se a tabela directory_listings estiver sem registros específicos, busca diretamente as lojas ativas
    const { data: storesData } = await supabase
      .from("stores")
      .select("id, name, slug, avatar_url, banner_url, niche, is_verified, active, created_at")
      .eq("active", true)
      .limit(limit);

    if (storesData && storesData.length > 0) {
      return storesData.map((s: any) => ({
        id: s.id,
        category: s.niche || "Comércio Local",
        address: "Chapecó - SC",
        latitude: null,
        longitude: null,
        contact_phone: null,
        working_hours: null,
        is_verified: !!s.is_verified,
        status: "active",
        created_at: s.created_at,
        stores: {
          name: s.name,
          type: s.niche || "ecommerce",
        },
      }));
    }

    return [];
  });
