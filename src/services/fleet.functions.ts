/**
 * fleet.functions.ts — BFF para o módulo de Gestão de Frota e Entregadores
 *
 * Suporta:
 * - Entregadores fixos (cadastro na plataforma)
 * - Entregadores avulsos (link mágico temporário)
 * - Fechamento financeiro / Faturas
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ============================================================
// Schemas
// ============================================================

export const courierStatusEnum = z.enum(["available", "on_route", "offline", "suspended"]);
export const vehicleTypeEnum = z.enum(["motorcycle", "bicycle", "car", "van", "on_foot", "other"]);

export const courierInputSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  vehicle_type: vehicleTypeEnum,
  vehicle_plate: z.string().optional(),
  default_fee_cents: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export const generateMagicLinkSchema = z.object({
  fulfillment_id: z.string().uuid(),
  expires_hours: z.number().int().min(1).max(168).default(48), // max 1 semana
});

export interface CourierSummaryDTO {
  id: string;
  name: string;
  phone: string | null;
  vehicle_type: string;
  vehicle_plate: string | null;
  status: string;
  default_fee_cents: number;
  created_at: string;
}

// ============================================================
// Server Functions
// ============================================================

/**
 * Lista entregadores cadastrados.
 */
export const listCouriers = createServerFn({ method: "GET" })
  .validator(
    z.object({
      status: courierStatusEnum.optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

    const db = getServerClient();
    let query = db
      .from("couriers")
      .select("*")
      .eq("store_id", identity.store_id)
      .order("name", { ascending: true });

    if (data.status) query = query.eq("status", data.status);
    if (data.search) {
      query = query.or(
        `name.ilike.%${data.search}%,cpf.ilike.%${data.search}%,phone.ilike.%${data.search}%`,
      );
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Erro ao listar entregadores: ${error.message}`);

    return rows as CourierSummaryDTO[];
  });

/**
 * Cria um entregador fixo.
 */
export const createCourier = createServerFn({ method: "POST" })
  .validator(courierInputSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const db = getServerClient();
    const { data: courier, error } = await db
      .from("couriers")
      .insert({
        store_id: identity.store_id,
        name: data.name,
        phone: data.phone ?? null,
        cpf: data.cpf ?? null,
        vehicle_type: data.vehicle_type,
        vehicle_plate: data.vehicle_plate ?? null,
        default_fee_cents: data.default_fee_cents,
        notes: data.notes ?? null,
        status: "available",
      })
      .select("id")
      .single();

    if (error) throw new Error(`Erro ao criar entregador: ${error.message}`);
    return { courier_id: courier.id };
  });

/**
 * Atualiza um entregador fixo.
 */
export const updateCourier = createServerFn({ method: "POST" })
  .validator(
    z.object({
      courier_id: z.string().uuid(),
      data: courierInputSchema.partial().extend({ status: courierStatusEnum.optional() }),
    }),
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const db = getServerClient();
    const { error } = await db
      .from("couriers")
      .update(data.data)
      .eq("id", data.courier_id)
      .eq("store_id", identity.store_id);

    if (error) throw new Error(`Erro ao atualizar entregador: ${error.message}`);
    return { ok: true };
  });

/**
 * Gera um link mágico para entregador avulso realizar uma entrega específica.
 */
export const generateMagicLink = createServerFn({ method: "POST" })
  .validator(generateMagicLinkSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

    const db = getServerClient();
    const { data: token, error } = await db.rpc("generate_delivery_magic_link", {
      p_store_id: identity.store_id,
      p_fulfillment_id: data.fulfillment_id,
      p_expires_hours: data.expires_hours,
    });

    if (error) throw new Error(`Erro ao gerar link mágico: ${error.message}`);

    // Constrói URL pública (ex: /entregas/tk123456)
    // O domínio atual será resolvido no client
    return { token: token as string, path: `/entregas/${token}` };
  });
