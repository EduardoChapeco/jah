import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Types & Schemas
// ---------------------------------------------------------------------------

export interface TourCashEntryItem {
  id: string;
  tour_id: string;
  store_id: string;
  entry_type: "inflow" | "outflow";
  category: string;
  description: string;
  amount_cents: number;
  payment_method: "cash" | "pix" | "corporate_card" | "other";
  receipt_url?: string | null;
  occurred_at: string;
  created_at: string;
}

export const CreateCashEntrySchema = z.object({
  store_id: z.string().uuid(),
  tour_id: z.string().uuid(),
  entry_type: z.enum(["inflow", "outflow"]),
  category: z.string().min(2),
  description: z.string().min(2, "Descrição obrigatória"),
  amount_cents: z.number().int().positive("Valor deve ser maior que zero"),
  payment_method: z.enum(["cash", "pix", "corporate_card", "other"]).default("cash"),
  receipt_url: z.string().optional().nullable(),
  occurred_at: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listTourCashEntries = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid(), tour_id: z.string().uuid() }))
  .handler(async ({ data }): Promise<TourCashEntryItem[]> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: entries, error } = await db
      .from("group_tour_cash_ledger")
      .select("*")
      .eq("tour_id", data.tour_id)
      .eq("store_id", data.store_id)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return entries || [];
  });

export const createTourCashEntry = createServerFn({ method: "POST" })
  .validator((d: unknown) => CreateCashEntrySchema.parse(d))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: created, error } = await db
      .from("group_tour_cash_ledger")
      .insert({
        store_id: data.store_id,
        tour_id: data.tour_id,
        entry_type: data.entry_type,
        category: data.category,
        description: data.description.trim(),
        amount_cents: data.amount_cents,
        payment_method: data.payment_method,
        receipt_url: data.receipt_url || null,
        registered_by_profile_id: identity.id,
        occurred_at: data.occurred_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  });

export const deleteTourCashEntry = createServerFn({ method: "POST" })
  .validator(z.object({ store_id: z.string().uuid(), entry_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { error } = await db
      .from("group_tour_cash_ledger")
      .delete()
      .eq("id", data.entry_id)
      .eq("store_id", data.store_id);

    if (error) throw error;
    return { success: true };
  });

export const getTourCashSummary = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid(), tour_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const { data: entries, error } = await db
      .from("group_tour_cash_ledger")
      .select("entry_type, category, amount_cents")
      .eq("tour_id", data.tour_id)
      .eq("store_id", data.store_id);

    if (error) throw error;

    let totalInflowsCents = 0;
    let totalOutflowsCents = 0;
    const categoryTotals: Record<string, number> = {};

    (entries || []).forEach((e) => {
      if (e.entry_type === "inflow") {
        totalInflowsCents += e.amount_cents;
      } else {
        totalOutflowsCents += e.amount_cents;
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount_cents;
      }
    });

    const currentBalanceCents = totalInflowsCents - totalOutflowsCents;

    return {
      totalInflowsCents,
      totalOutflowsCents,
      currentBalanceCents,
      categoryTotals,
    };
  });
