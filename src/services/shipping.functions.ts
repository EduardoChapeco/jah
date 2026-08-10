import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

/**
 * Calculates shipping — pure handler for testability.
 */
export async function calculateShippingHandler({
  cartId,
  zipcode,
  weightGrams = 500,
}: {
  cartId?: string;
  zipcode: string;
  weightGrams?: number;
}) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  if (!identity.store_id) throw new Error("Loja não identificada.");

  // Fetch store type to adapt shipping logic
  const { data: storeInfo } = await supabase.from("stores").select("type").eq("id", identity.store_id).single();
  const storeType = storeInfo?.type || "ecommerce";

  const finalQuotes: any[] = [];
  const cleanZipcode = zipcode.replace(/\D/g, "");

  // If digital/event niche, return a fixed free quote and exit early
  if (["event_producer", "creator", "band"].includes(storeType)) {
    return [
      {
        provider: "Digital",
        service_name: "Envio Eletrônico / Ingresso",
        price_cents: 0,
        estimated_days: 0,
      }
    ];
  }

  let totalWeightKg = 0;
  let maxW = 0;
  let maxH = 0;
  let maxL = 0;
  let itemsCount = 0;
  let hasMissingDimensions = false;

  if (cartId) {
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select(
        "quantity, product_id, variant_id, products(weight_kg, width_cm, height_cm, length_cm), product_variants(weight_kg, width_cm, height_cm, length_cm)",
      )
      .eq("cart_id", cartId);

    if (cartItems) {
      type LogisticsRow = {
        weight_kg: number | null;
        width_cm: number | null;
        height_cm: number | null;
        length_cm: number | null;
      } | null;
      for (const item of cartItems) {
        const prod = item.products as unknown as LogisticsRow;
        const vari = item.product_variants as unknown as LogisticsRow;
        const wKg = vari?.weight_kg ?? prod?.weight_kg;
        const width = vari?.width_cm ?? prod?.width_cm;
        const height = vari?.height_cm ?? prod?.height_cm;
        const length = vari?.length_cm ?? prod?.length_cm;

        if (wKg == null || width == null || height == null || length == null) {
          hasMissingDimensions = true;
        } else {
          totalWeightKg += Number(wKg) * item.quantity;
          if (Number(width) > maxW) maxW = Number(width);
          if (Number(height) > maxH) maxH = Number(height);
          if (Number(length) > maxL) maxL = Number(length);
        }
        itemsCount += item.quantity;
      }
    }
  }

  if (itemsCount === 0) {
    hasMissingDimensions = true;
  }

  // 1. Fetch Manual Shipping Rates (Fallback/Local rules from Zones)
  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("*, shipping_rates(*)")
    .eq("store_id", identity.store_id)
    .eq("is_active", true);

  if (zones && zones.length > 0) {
    // Determine which zones apply to the zipcode (by region prefix)
    const applicableZones = zones.filter((z) => {
      if (!z.regions || z.regions.length === 0) return false;
      return z.regions.some((prefix: string) => {
        if (prefix === "*") return true;
        return cleanZipcode.startsWith(prefix);
      });
    });

    applicableZones.forEach((zone) => {
      if (zone.shipping_rates && Array.isArray(zone.shipping_rates)) {
        zone.shipping_rates.forEach((rate: any) => {
          if (rate.is_active === false) return;
          finalQuotes.push({
            provider: zone.name,
            service_name: rate.name,
            price_cents: rate.price_cents,
            estimated_days: rate.estimated_days || 1,
          });
        });
      }
    });
  }

  // 2. Integração: MelhorEnvio
  // Somente executa se o carrinho for válido, as dimensões existirem e houver chave na integração.
  // Ignora se for nicho de Delivery (onde a entrega é puramente motoboy local via zonas manuais)
  if (cartId && !hasMissingDimensions && itemsCount > 0 && storeType !== "delivery") {
    const { data: creds } = await supabase
      .from("integration_credentials")
      .select("token_payload, is_active")
      .eq("store_id", identity.store_id)
      .eq("provider", "melhor_envio")
      .maybeSingle();

    if (creds && creds.is_active && creds.token_payload && creds.token_payload.api_token) {
      try {
        const payload = {
          from: { postal_code: "01000000" }, // Origem padronizada para exemplo ou pegar da loja
          to: { postal_code: cleanZipcode },
          products: [
            {
              id: cartId,
              width: maxW,
              height: maxH,
              length: maxL,
              weight: totalWeightKg,
              insurance_value: 0,
              quantity: 1,
            },
          ],
        };

        const res = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${creds.token_payload.api_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const quotes = await res.json();
          if (Array.isArray(quotes)) {
            for (const q of quotes) {
              if (q.error) continue;
              finalQuotes.push({
                provider: "MelhorEnvio",
                service_name: q.company?.name ? `${q.company.name} - ${q.name}` : q.name,
                price_cents: Math.round(Number(q.price) * 100),
                estimated_days: q.delivery_time || 5,
              });
            }
          }
        } else {
          console.warn("[shipping] MelhorEnvio falhou, ignorando integração.");
        }
      } catch (err) {
        console.error("[shipping] Erro ao chamar MelhorEnvio:", err);
        // Fallback silencioso para frete manual (já populado no array)
      }
    }
  }

  // 4. Save to Database to prevent tampering during checkout
  if (finalQuotes.length > 0) {
    const quotesToInsert = finalQuotes.map((q) => ({
      store_id: identity.store_id,
      cart_id: cartId || null,
      customer_id: identity.id || null,
      zipcode: cleanZipcode,
      provider: q.provider,
      service_name: q.service_name,
      price_cents: q.price_cents,
      estimated_days: q.estimated_days,
      payload_snapshot: { totalWeightKg, maxW, maxH, maxL },
    }));
    await supabase.from("shipping_quotes").insert(quotesToInsert);
  }

  return finalQuotes;
}

export const calculateShipping = createServerFn({ method: "POST" })
  .validator(
    z.object({
      cartId: z.string().uuid().optional(),
      zipcode: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => calculateShippingHandler(data));

// ---------------------------------------------------------------------------

export async function listShippingZonesHandler() {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  if (!identity.store_id) return [];
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("*, shipping_rates(*)")
    .eq("store_id", identity.store_id);

  return zones || [];
}

export const listShippingZones = createServerFn({ method: "GET" }).handler(
  listShippingZonesHandler,
);

// ---------------------------------------------------------------------------

export async function upsertShippingZoneHandler(data: {
  id?: string;
  name: string;
  regions: string[];
  is_active: boolean;
}) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const payload = { ...data, store_id: identity.store_id };

  const { data: zone, error } = await supabase
    .from("shipping_zones")
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return zone;
}

export const upsertShippingZone = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string(),
      regions: z.array(z.string()),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => upsertShippingZoneHandler(data));

// ---------------------------------------------------------------------------

export async function deleteShippingZoneHandler(id: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { error } = await supabase
    .from("shipping_zones")
    .delete()
    .eq("id", id)
    .eq("store_id", identity.store_id);

  if (error) throw new Error(error.message);
  return true;
}

export const deleteShippingZone = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => deleteShippingZoneHandler(id));

// ---------------------------------------------------------------------------

export async function upsertShippingRateHandler(data: {
  id?: string;
  zone_id: string;
  name: string;
  price_cents: number;
  min_order_cents?: number | null;
  estimated_days?: number | null;
  is_active?: boolean;
}) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const payload = { ...data, store_id: identity.store_id };

  const { data: rate, error } = await supabase
    .from("shipping_rates")
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rate;
}

export const upsertShippingRate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      zone_id: z.string().uuid(),
      name: z.string(),
      price_cents: z.number().int(),
      min_order_cents: z.number().int().nullish(),
      estimated_days: z.number().int().nullish(),
      is_active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => upsertShippingRateHandler(data));

// ---------------------------------------------------------------------------

export async function deleteShippingRateHandler(id: string) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { error } = await supabase
    .from("shipping_rates")
    .delete()
    .eq("id", id)
    .eq("store_id", identity.store_id);

  if (error) throw new Error(error.message);
  return true;
}

export const deleteShippingRate = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => deleteShippingRateHandler(id));
