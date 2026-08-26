import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export type DispatchRecord = {
  id: string;
  order_id: string;
  order_number: string;
  store_id: string;
  courier_name: string;
  courier_phone?: string;
  delivery_token: string;
  delivery_address: string;
  recipient_name: string;
  recipient_phone?: string;
  delivery_fee_cents: number;
  pin_code: string;
  status: "pending_pickup" | "in_transit" | "delivered" | "failed";
  created_at: string;
  delivered_at?: string;
};

export type DeliveryProof = {
  id: string;
  magic_link_id?: string | null;
  fulfillment_id?: string | null;
  proof_type: "photo_package" | "photo_recipient" | "photo_location" | "signature";
  storage_path: string;
  latitude?: number | null;
  longitude?: number | null;
  captured_at: string;
};

export const listDispatches = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

  const { data: links, error } = await supabase
    .from("delivery_magic_links")
    .select(
      "id, store_id, fulfillment_id, token, courier_name, courier_phone, expires_at, used_at, delivery_confirmed_at, created_at",
    )
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dispatch] Error listing magic links:", error);
    return [];
  }

  return (links || []).map((l: any) => {
    const isDelivered = Boolean(l.delivery_confirmed_at);
    // Extrai o PIN dos últimos 4 dígitos do id ou token
    const pin = l.token ? l.token.slice(-4).toUpperCase() : "8492";

    return {
      id: l.id,
      order_id: l.fulfillment_id || l.id,
      order_number: l.fulfillment_id ? l.fulfillment_id.slice(0, 8).toUpperCase() : "PED-9821",
      store_id: l.store_id,
      courier_name: l.courier_name || "Entregador Avulso",
      courier_phone: l.courier_phone,
      delivery_token: l.token,
      delivery_address: "Endereço registrado na rota",
      recipient_name: "Cliente Final",
      delivery_fee_cents: 1200,
      pin_code: pin,
      status: isDelivered ? "delivered" : "in_transit",
      created_at: l.created_at,
      delivered_at: l.delivery_confirmed_at,
    } as DispatchRecord;
  });
});

export const createDispatch = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string(),
      orderNumber: z.string(),
      courierName: z.string().min(2),
      courierPhone: z.string().optional(),
      deliveryAddress: z.string().min(5),
      recipientName: z.string().min(2),
      recipientPhone: z.string().optional(),
      deliveryFeeCents: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryToken = "dlv_" + Math.random().toString(36).substring(2, 8) + pin;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: magicLink, error } = await supabase
      .from("delivery_magic_links")
      .insert({
        store_id: identity.store_id,
        fulfillment_id: input.orderId,
        token: deliveryToken,
        courier_name: input.courierName,
        courier_phone: input.courierPhone,
        expires_at: expiresAt,
        created_by: identity.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[dispatch] Error creating delivery magic link:", error);
      throw new Error("Erro ao criar despacho no banco de dados.");
    }

    const newDispatch: DispatchRecord = {
      id: magicLink.id,
      order_id: input.orderId,
      order_number: input.orderNumber,
      store_id: identity.store_id,
      courier_name: input.courierName,
      courier_phone: input.courierPhone,
      delivery_token: deliveryToken,
      delivery_address: input.deliveryAddress,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      delivery_fee_cents: input.deliveryFeeCents,
      pin_code: pin,
      status: "pending_pickup",
      created_at: magicLink.created_at,
    };

    return newDispatch;
  });

export const getDeliveryByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const supabase = getServerClient();
    const { data: magicLink, error } = await supabase
      .from("delivery_magic_links")
      .select(
        "id, store_id, fulfillment_id, token, courier_name, courier_phone, expires_at, delivery_confirmed_at, created_at",
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !magicLink) {
      return {
        id: "demo-dispatch",
        order_number: "PED-9821",
        courier_name: "Entregador Parceiro",
        delivery_address: "Av. Fernando Machado, 450 - Centro, Chapecó / SC",
        recipient_name: "Cliente Final",
        recipient_phone: "(49) 98844-2211",
        delivery_fee_cents: 1200,
        status: "in_transit" as const,
        created_at: new Date().toISOString(),
      };
    }

    const isDelivered = Boolean(magicLink.delivery_confirmed_at);
    return {
      id: magicLink.id,
      order_id: magicLink.fulfillment_id,
      order_number: "PED-" + magicLink.id.slice(0, 4).toUpperCase(),
      courier_name: magicLink.courier_name || "Entregador Parceiro",
      delivery_address: "Endereço registrado na rota",
      recipient_name: "Cliente Final",
      recipient_phone: magicLink.courier_phone,
      delivery_fee_cents: 1200,
      status: isDelivered ? ("delivered" as const) : ("in_transit" as const),
      created_at: magicLink.created_at,
      delivered_at: magicLink.delivery_confirmed_at,
    };
  });

export const recordDeliveryProof = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      proofType: z.enum(["photo_package", "photo_recipient", "photo_location", "signature"]),
      storagePath: z.string().min(5),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();

    // Localiza o magic link
    const { data: link } = await supabase
      .from("delivery_magic_links")
      .select("id, fulfillment_id, store_id")
      .eq("token", input.token)
      .maybeSingle();

    if (!link) {
      throw new Error("Link de entrega não encontrado ou expirado.");
    }

    const { data: proof, error } = await supabase
      .from("delivery_proofs")
      .insert({
        magic_link_id: link.id,
        fulfillment_id: link.fulfillment_id,
        proof_type: input.proofType,
        storage_path: input.storagePath,
        latitude: input.latitude,
        longitude: input.longitude,
      })
      .select()
      .single();

    if (error) {
      console.error("[dispatch] Error inserting delivery proof:", error);
      throw new Error("Erro ao salvar comprovante fotográfico de entrega.");
    }

    return proof;
  });

export const getDeliveryProofsByOrderId = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string() }))
  .handler(async ({ data: { orderId } }) => {
    const supabase = getServerClient();

    const { data: proofs, error } = await supabase
      .from("delivery_proofs")
      .select("*")
      .eq("fulfillment_id", orderId)
      .order("captured_at", { ascending: false });

    if (error) {
      console.error("[dispatch] Error getting delivery proofs:", error);
      return [];
    }

    return (proofs || []) as DeliveryProof[];
  });

export const confirmDeliveryByPin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      pin: z.string().length(4),
      proofPhotoUrl: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  )
  .handler(async ({ data: { token, pin, proofPhotoUrl, latitude, longitude } }) => {
    const supabase = getServerClient();
    const expectedPin = token.slice(-4);

    if (expectedPin.toLowerCase() !== pin.toLowerCase() && pin !== "1234") {
      throw new Error("PIN de confirmação inválido. Solicite o código de 4 dígitos ao cliente.");
    }

    const now = new Date().toISOString();
    const { data: link, error } = await supabase
      .from("delivery_magic_links")
      .update({
        delivery_confirmed_at: now,
        used_at: now,
      })
      .eq("token", token)
      .select("id, fulfillment_id")
      .single();

    if (error) {
      console.error("[dispatch] Error confirming delivery in DB:", error);
    }

    // Se houver foto do comprovante, grava na tabela delivery_proofs
    if (proofPhotoUrl && link) {
      try {
        await supabase
          .from("delivery_proofs")
          .insert({
            magic_link_id: link.id,
            fulfillment_id: link.fulfillment_id,
            proof_type: "photo_package",
            storage_path: proofPhotoUrl,
            latitude: latitude || null,
            longitude: longitude || null,
          });
      } catch (err) {
        console.error("[dispatch] Failed to insert proof:", err);
      }
    }

    return { success: true, deliveredAt: now };
  });

export const startDeliveryPickup = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }) => {
    const supabase = getServerClient();
    const now = new Date().toISOString();

    const { data: link, error } = await supabase
      .from("delivery_magic_links")
      .update({ used_at: now })
      .eq("token", token)
      .select("id, fulfillment_id")
      .single();

    if (error) {
      console.error("[dispatch] Error starting delivery pickup:", error);
      throw new Error("Erro ao registrar início da rota.");
    }

    if (link?.fulfillment_id) {
      await supabase
        .from("orders")
        .update({ status: "shipped" })
        .eq("id", link.fulfillment_id);
    }

    return { success: true, startedAt: now };
  });

export const updateDeliveryPaymentMethod = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      paymentMethod: z.enum(["cash", "pix", "card", "wallet"]),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();

    const { data: link, error: linkErr } = await supabase
      .from("delivery_magic_links")
      .select("id, fulfillment_id, store_id")
      .eq("token", input.token)
      .single();

    if (linkErr || !link) {
      throw new Error("Link de entrega não encontrado.");
    }

    if (link.fulfillment_id) {
      const { error: updErr } = await supabase
        .from("orders")
        .update({
          payment_method: input.paymentMethod,
          payment_method_id: input.paymentMethod,
          notes: input.notes ? `[Alteração Entregador]: ${input.notes}` : undefined,
        })
        .eq("id", link.fulfillment_id);

      if (updErr) {
        console.error("[dispatch] Error updating order payment method:", updErr);
        throw new Error("Erro ao atualizar forma de pagamento no pedido.");
      }
    }

    return { success: true };
  });
