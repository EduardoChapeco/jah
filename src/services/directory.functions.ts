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

    const { data: listings, error } = await query;

    if (error) {
      console.error("[directory] getPublicDirectory error:", error);
      return []; // Retorna array vazio em vez de throw Error para evitar quebra 500 no SSR
    }

    return listings || [];
  });
