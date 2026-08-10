import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";

export const getStoreInvoices = createServerFn({ method: "GET" })
  .validator((d: { storeId: string }) => d)
  .handler(async ({ data }) => {
    const supabase = await getServerClient();
    const { data: invoices, error } = await supabase
      .from("platform_invoices")
      .select("*")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return invoices;
  });

export const createInvoice = createServerFn({ method: "POST" })
  .validator((d: { storeId: string; periodStart: string; periodEnd: string; platformFeeCents: number }) => d)
  .handler(async ({ data }) => {
    const supabase = await getServerClient();
    
    // Calcula o vencimento (10 dias após o fim do período)
    const dueDate = new Date(data.periodEnd);
    dueDate.setDate(dueDate.getDate() + 10);
    
    const { data: invoice, error } = await supabase
      .from("platform_invoices")
      .insert({
        store_id: data.storeId,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        status: "pending",
        platform_fee_cents: data.platformFeeCents,
        due_date: dueDate.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return invoice;
  });
