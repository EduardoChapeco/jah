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

  const finalQuotes: any[] = [];
  const cleanZipcode = zipcode.replace(/\D/g, "");

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

  // 2. Fetch Integrations
  const { data: creds } = await supabase
    .from("integration_credentials")
    .select("token_payload, is_active")
    .eq("store_id", identity.store_id)
    .eq("provider", "melhorenvio")
    .eq("is_active", true)
    .maybeSingle();

  // 3. Real External API Call if configured
  if (creds && creds.token_payload?.api_token) {
    try {
      const apiToken = creds.token_payload.api_token;
      const response = await fetch(
        "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            from: { postal_code: "01001000" },
            to: { postal_code: cleanZipcode },
            products: [
              {
                id: cartId || "cart",
                width: 15,
                height: 10,
                length: 20,
                weight: weightGrams / 1000,
                insurance_value: 0,
                quantity: 1,
              },
            ],
          }),
        },
      );

      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results)) {
          results.forEach((svc: any) => {
            if (!svc.error && svc.price) {
              finalQuotes.push({
                provider: svc.company?.name || "Transportadora",
                service_name: svc.name,
                price_cents: Math.round(parseFloat(svc.price) * 100),
                estimated_days: svc.delivery_time || 5,
              });
            }
          });
        }
      }
    } catch (e) {
      console.error("MelhorEnvio Integration Error:", e);
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
      payload_snapshot: { weightGrams },
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
      weightGrams: z.number().default(500),
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
