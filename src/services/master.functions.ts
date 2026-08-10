import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";
import { z } from "zod";

/**
 * Validates that the current user is a Platform Admin.
 * Master functions bypass RLS by using the service_role client,
 * so this authorization check is paramount.
 */
async function requirePlatformAdmin() {
  const identity = await getServerIdentity();
  if (identity.role !== "platform_admin") {
    throw new Error("Acesso negado. Apenas administradores globais podem realizar esta ação.");
  }
  return identity;
}

export const getPlatformMetrics = createServerFn({ method: "GET" }).handler(async () => {
  await requirePlatformAdmin();
  const db = getServerClient(); // Bypass RLS for cross-tenant metrics

  // Fetch all paid invoices for platform revenue
  const { data: invoices, error: invError } = await db
    .from("platform_invoices")
    .select("amount_cents, status");

  if (invError) throw new Error("Erro ao ler faturas");

  const totalRevenueCents = invoices
    ?.filter((i) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + i.amount_cents, 0) || 0;

  const pendingRevenueCents = invoices
    ?.filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((sum: number, i: any) => sum + i.amount_cents, 0) || 0;

  // Fetch total stores
  const { count: totalStores, error: storeError } = await db
    .from("stores")
    .select("*", { count: "exact", head: true });

  if (storeError) throw new Error("Erro ao ler lojas");

  return {
    totalRevenueCents,
    pendingRevenueCents,
    totalStores: totalStores || 0,
  };
});

export const getPlatformInvoicesList = createServerFn({ method: "GET" }).handler(async () => {
  await requirePlatformAdmin();
  const db = getServerClient();

  const { data, error } = await db
    .from("platform_invoices")
    .select("*, stores(name, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar faturas.");
  return data || [];
});

export const getPlatformStoresList = createServerFn({ method: "GET" }).handler(async () => {
  await requirePlatformAdmin();
  const db = getServerClient();

  const { data, error } = await db
    .from("stores")
    .select("id, name, slug, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar lojas.");
  return data || [];
});

export const toggleStoreStatus = createServerFn({ method: "POST" })
  .validator(z.object({ storeId: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    const { error } = await db
      .from("stores")
      .update({ is_active: data.isActive })
      .eq("id", data.storeId);

    if (error) throw new Error("Erro ao alterar status da loja: " + error.message);
    return { success: true };
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .validator(z.object({ invoiceId: z.string().uuid(), status: z.enum(["pending", "paid", "overdue", "cancelled"]) }))
  .handler(async ({ data }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    const updateData: any = { status: data.status };
    if (data.status === "paid") {
      updateData.paid_at = new Date().toISOString();
    } else {
      updateData.paid_at = null; // reset if moving away from paid
    }

    const { error } = await db
      .from("platform_invoices")
      .update(updateData)
      .eq("id", data.invoiceId);

    if (error) throw new Error("Erro ao atualizar status da fatura: " + error.message);
    return { success: true };
  });

export const createPlatformInvoice = createServerFn({ method: "POST" })
  .validator(z.object({
    storeId: z.string().uuid(),
    description: z.string().min(1, "Descrição obrigatória"),
    amountCents: z.number().positive("Valor deve ser maior que zero"),
    dueDate: z.string() // ISO date string
  }))
  .handler(async ({ data }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    const { error } = await db
      .from("platform_invoices")
      .insert({
        store_id: data.storeId,
        description: data.description,
        amount_cents: data.amountCents,
        due_date: data.dueDate,
        status: "pending"
      });

    if (error) throw new Error("Erro ao emitir fatura: " + error.message);
    return { success: true };
  });
