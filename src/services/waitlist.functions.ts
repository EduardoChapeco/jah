/**
 * waitlist.functions.ts — Captura de Intenção Comercial (Lista de Espera)
 * Permite que clientes deixem contato para produtos esgotados e o lojista meça a demanda represada.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

export const joinWaitlistSchema = z.object({
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
  customerName: z.string().min(2, "Informe seu nome completo"),
  customerContact: z.string().min(8, "Informe um WhatsApp ou telefone válido"),
  notes: z.string().max(300).optional(),
});

export const updateWaitlistStatusSchema = z.object({
  entryId: z.string().uuid(),
  status: z.enum(["waiting", "notified", "converted", "cancelled"]),
});

/**
 * 1. Cliente entra na lista de espera de um produto/variante esgotado
 */
export const joinProductWaitlist = createServerFn({ method: "POST" })
  .validator(joinWaitlistSchema)
  .handler(async ({ data: input }) => {
    const db = getServerClient();
    const identity = await getServerIdentity().catch(() => null);

    const payload = {
      store_id: input.storeId,
      product_id: input.productId,
      variant_id: input.variantId || null,
      customer_id: identity?.id || null,
      customer_name: input.customerName.trim(),
      customer_contact: input.customerContact.trim(),
      notes: input.notes || null,
      status: "waiting",
    };

    const { data, error } = await db
      .from("product_waitlist_entries")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[joinProductWaitlist] Erro ao cadastrar na lista de espera:", error);
      throw new Error("Não foi possível salvar na lista de espera. Tente novamente.");
    }

    return {
      success: true,
      message: "Você entrou na lista de espera! Avisaremos assim que o estoque for reposto.",
      entry: data,
    };
  });

/**
 * 2. Lojista lista clientes na lista de espera da loja
 */
export const listStoreProductWaitlist = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        storeId: z.string().uuid().optional(),
        productId: z.string().uuid().optional(),
        variantId: z.string().uuid().optional(),
        status: z.enum(["waiting", "notified", "converted", "all"]).default("waiting"),
      })
      .optional()
  )
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity();
    const targetStoreId = input?.storeId || identity.store_id;

    if (!targetStoreId) {
      throw new Error("Nenhuma loja ativa selecionada.");
    }

    const db = getServerClient();
    let query = db
      .from("product_waitlist_entries")
      .select(`
        id,
        store_id,
        product_id,
        variant_id,
        customer_name,
        customer_contact,
        notes,
        status,
        notified_at,
        created_at,
        products:product_id (title, slug, cover_image_url),
        product_variants:variant_id (sku, attributes)
      `)
      .eq("store_id", targetStoreId)
      .order("created_at", { ascending: false });

    if (input?.status && input.status !== "all") {
      query = query.eq("status", input.status);
    }
    if (input?.productId) {
      query = query.eq("product_id", input.productId);
    }
    if (input?.variantId) {
      query = query.eq("variant_id", input.variantId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error("[listStoreProductWaitlist] Erro:", error);
      throw new Error("Falha ao listar fila de espera.");
    }

    return data || [];
  });

/**
 * 3. Mapa de Contagem de Demanda por Variante (Para Alertas de Estoque)
 */
export const getWaitlistDemandCounts = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        storeId: z.string().uuid().optional(),
      })
      .optional()
  )
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity().catch(() => null);
    const targetStoreId = input?.storeId || identity?.store_id;

    if (!targetStoreId) {
      return {};
    }

    const db = getServerClient();
    const { data, error } = await db
      .from("product_waitlist_entries")
      .select("variant_id, product_id")
      .eq("store_id", targetStoreId)
      .eq("status", "waiting");

    if (error || !data) {
      return {};
    }

    // Agrupa contagem por variantId e productId
    const counts: Record<string, number> = {};
    for (const item of data) {
      if (item.variant_id) {
        counts[item.variant_id] = (counts[item.variant_id] || 0) + 1;
      }
      if (item.product_id) {
        counts[item.product_id] = (counts[item.product_id] || 0) + 1;
      }
    }

    return counts;
  });

/**
 * 4. Atualizar status de uma entrada na lista de espera
 */
export const updateWaitlistEntryStatus = createServerFn({ method: "POST" })
  .validator(updateWaitlistStatusSchema)
  .handler(async ({ data: input }) => {
    const identity = await getServerIdentity();
    if (!identity.store_id) {
      throw new Error("Nenhuma loja ativa selecionada.");
    }

    const db = getServerClient();
    const updatePayload: Record<string, any> = {
      status: input.status,
      updated_at: new Date().toISOString(),
    };

    if (input.status === "notified") {
      updatePayload.notified_at = new Date().toISOString();
    }

    const { data, error } = await db
      .from("product_waitlist_entries")
      .update(updatePayload)
      .eq("id", input.entryId)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) {
      console.error("[updateWaitlistEntryStatus] Erro:", error);
      throw new Error("Falha ao atualizar status do cliente na lista de espera.");
    }

    return data;
  });
