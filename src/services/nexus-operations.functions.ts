import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

// ─────────────────────────────────────────────────────────────────────────────
// BADGE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

export const createBadgeTemplate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      variant: z.enum(["standard", "vip", "staff", "press"]),
      primary_color: z.string().default("#000000"),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.empresa_id) throw new Error("Empresa nao identificada");

    const { error } = await supabase.from("badge_templates").insert({
      empresa_id: identity.empresa_id,
      name: data.name,
      variant: data.variant,
      primary_color: data.primary_color,
      html_structure: "",
      fields: { version: "2.0", type: "canvas" },
    });

    if (error) throw error;
    return { ok: true };
  });

export const deleteBadgeTemplate = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.empresa_id) throw new Error("Empresa nao identificada");

    const { error } = await supabase
      .from("badge_templates")
      .delete()
      .eq("id", data.id)
      .eq("empresa_id", identity.empresa_id);

    if (error) throw error;
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// TEAM CHECK-IN / PONTO
// ─────────────────────────────────────────────────────────────────────────────

export const getMyActiveShift = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Nao autenticado");

    const { data: person } = await supabase
      .from("pessoas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!person) return null;

    const { data: shift } = await supabase
      .from("eventos_equipe")
      .select("*, evento:eventos(titulo, local_evento)")
      .eq("colaborador_id", person.id)
      .eq("confirmado", true)
      .order("data_inicio", { ascending: false })
      .limit(1)
      .maybeSingle();

    return shift ?? null;
  }
);

export const registerPunchClock = createServerFn({ method: "POST" })
  .validator(
    z.object({
      evento_equipe_id: z.string().uuid(),
      tipo: z.enum(["entrada", "saida", "pausa", "retorno"]),
      localizacao: z.object({ lat: z.number(), lng: z.number(), accuracy: z.number() }).nullable(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Nao autenticado");

    const { error } = await supabase.from("equipe_ponto_logs").insert({
      evento_equipe_id: data.evento_equipe_id,
      tipo: data.tipo,
      localizacao: data.localizacao,
    });

    if (error) throw error;
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// GIFT CARDS
// ─────────────────────────────────────────────────────────────────────────────

export const createGiftCard = createServerFn({ method: "POST" })
  .validator(z.object({
    value_cents: z.number().int().positive(),
    code: z.string().min(8),
    expires_at: z.string().nullable().optional(),
    recipient_name: z.string().optional(),
    recipient_email: z.string().email().optional(),
    message: z.string().optional(),
    status: z.string().default("active"),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.store_id) throw new Error("Loja nao identificada");

    const { error } = await supabase.from("gift_cards").insert({ ...data, store_id: identity.store_id });
    if (error) throw error;
    return { ok: true };
  });

export const deleteGiftCard = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.store_id) throw new Error("Loja nao identificada");

    const { error } = await supabase.from("gift_cards").delete().eq("id", data.id).eq("store_id", identity.store_id);
    if (error) throw error;
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// COUPONS
// ─────────────────────────────────────────────────────────────────────────────

export const deleteCoupon = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.store_id) throw new Error("Loja nao identificada");

    const { error } = await supabase.from("coupons").delete().eq("id", data.id).eq("store_id", identity.store_id);
    if (error) throw error;
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// LEAD CAPTURE FORMS
// ─────────────────────────────────────────────────────────────────────────────

export const deleteLeadCaptureForm = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.empresa_id) throw new Error("Empresa nao identificada");

    const { error } = await supabase.from("lead_capture_forms").delete().eq("id", data.id).eq("empresa_id", identity.empresa_id);
    if (error) throw error;
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────────────────────
// EVENT ACTIVATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const createEventActivation = createServerFn({ method: "POST" })
  .validator(z.object({
    event_id: z.string().uuid(),
    title: z.string().min(1),
    type: z.string(),
    config: z.record(z.any()).optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.empresa_id) throw new Error("Empresa nao identificada");

    const { error } = await supabase.from("event_activations").insert({ empresa_id: identity.empresa_id, ...data });
    if (error) throw error;
    return { ok: true };
  });

export const deleteEventActivation = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    if (!identity?.empresa_id) throw new Error("Empresa nao identificada");

    const { error } = await supabase.from("event_activations").delete().eq("id", data.id).eq("empresa_id", identity.empresa_id);
    if (error) throw error;
    return { ok: true };
  });

export const logActivationInteraction = createServerFn({ method: "POST" })
  .validator(z.object({
    activation_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    interaction_data: z.record(z.any()).optional(),
  }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();

    const { error } = await supabase.from("activation_logs").insert({
      activation_id: data.activation_id,
      user_id: data.user_id ?? null,
      interaction_data: data.interaction_data ?? {},
    });

    if (error) throw error;
    return { ok: true };
  });
