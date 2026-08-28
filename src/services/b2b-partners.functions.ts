/**
 * b2b-partners.functions.ts — BFF Server Functions para Painéis B2B Recursivos
 * Gestão de Acesso do Contador Convidado (DRE, XMLs, Faturamento) e Agências de RH Delegadas.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ============================================================
// Schemas
// ============================================================

export const inviteAccountantSchema = z.object({
  store_id: z.string().uuid(),
  accountant_email: z.string().email("E-mail inválido"),
  accountant_crc: z.string().optional(),
  permissions: z
    .object({
      view_dre: z.boolean().default(true),
      view_invoices: z.boolean().default(true),
      view_settlement: z.boolean().default(true),
      download_xml: z.boolean().default(true),
    })
    .default({
      view_dre: true,
      view_invoices: true,
      view_settlement: true,
      download_xml: true,
    }),
});

// ============================================================
// Server Functions
// ============================================================

/**
 * 1. Lista acessos de contadores vinculados à loja
 */
export const listStoreAccountants = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const supabase = getServerClient();
    const { data: accountants, error } = await supabase
      .from("store_accountant_access")
      .select("*, accountant_profile:profiles(full_name, email, phone)")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Falha ao listar contadores: ${error.message}`);
    return accountants || [];
  });

/**
 * 2. Loja convida escritório de contabilidade
 */
export const inviteAccountantToStore = createServerFn({ method: "POST" })
  .validator(inviteAccountantSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const supabase = getServerClient();

    // Checa se o contador já tem perfil na plataforma pelo e-mail
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.accountant_email.toLowerCase().trim())
      .maybeSingle();

    const { data: access, error } = await supabase
      .from("store_accountant_access")
      .insert({
        store_id: identity.store_id,
        accountant_profile_id: profile?.id || null,
        accountant_email: data.accountant_email.toLowerCase().trim(),
        accountant_crc: data.accountant_crc || null,
        permissions: data.permissions,
        status: "active",
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao convidar contador: ${error.message}`);
    return access;
  });

/**
 * 3. Contador obtém dados contábeis consolidados (DRE, Vendas por Meio de Pagamento)
 */
export const getAccountantFinancialSummary = createServerFn({ method: "GET" })
  .validator(z.object({ store_id: z.string().uuid().optional(), month_year: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity?.id) throw new Error("Não autenticado");

    const targetStoreId = data?.store_id || identity.store_id;
    if (!targetStoreId) {
      return {
        store_id: "",
        total_orders_count: 0,
        gross_revenue_cents: 0,
        by_payment_method: { pix: 0, credit_card: 0, debit_card: 0, cash: 0, other: 0 },
        estimated_taxes_cents: 0,
      };
    }

    const supabase = getServerClient();

    // Valida se o usuário tem acesso como contador ou lojista
    const { data: access } = await supabase
      .from("store_accountant_access")
      .select("id, permissions")
      .eq("store_id", targetStoreId)
      .eq("accountant_profile_id", identity.id)
      .eq("status", "active")
      .maybeSingle();

    const isStoreMember = identity.store_id === targetStoreId;
    if (!access && !isStoreMember && identity.role !== "admin" && identity.role !== "master") {
      throw new Error("Sem permissão contábil para esta loja");
    }

    // Busca pedidos concluídos
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_cents, payment_method, created_at, status")
      .eq("store_id", targetStoreId)
      .in("status", ["completed", "delivered", "paid"]);

    const ordersList = orders || [];
    let grossTotalCents = 0;
    const byMethod: Record<string, number> = {
      pix: 0,
      credit_card: 0,
      debit_card: 0,
      cash: 0,
      other: 0,
    };

    ordersList.forEach((o) => {
      const amount = Number(o.total_cents) || 0;
      grossTotalCents += amount;
      const method = o.payment_method || "other";
      byMethod[method] = (byMethod[method] || 0) + amount;
    });

    return {
      store_id: targetStoreId,
      total_orders_count: ordersList.length,
      gross_revenue_cents: grossTotalCents,
      by_payment_method: byMethod,
      estimated_taxes_cents: Math.round(grossTotalCents * 0.06), // Simulação Simples Nacional 6%
    };
  });
