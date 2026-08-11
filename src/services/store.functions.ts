import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// --- DADOS DA LOJA ---

export async function _getStoreSettings() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select(
      "id, name, slug, type, email, phone, cnpj, address, city, state, zip_code, description, settings",
    )
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar configurações");
  }

  return store;
}

export const getStoreSettings = createServerFn({ method: "GET" }).handler(_getStoreSettings);

export const saveStoreSettingsSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  cnpj: z.string().max(18).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip_code: z.string().max(9).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  hideNameWithLogo: z.boolean().optional(),
});

export async function _saveStoreSettings(data: z.infer<typeof saveStoreSettingsSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const { logoUrl, faviconUrl, hideNameWithLogo, ...columns } = data;
  const db = getServerClient();

  // Get current settings to merge
  const { data: currentStore } = await db
    .from("stores")
    .select("settings")
    .eq("id", identity.store_id)
    .single();
  const settings = { ...(currentStore?.settings || {}), logoUrl, faviconUrl, hideNameWithLogo };

  const updateData: Record<string, any> = { ...columns, settings };
  if (logoUrl !== undefined) {
    updateData.logo_url = logoUrl;
  }

  const { error } = await db.from("stores").update(updateData).eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar dados da loja: " + error.message);
  }

  // Sync logo and favicon to theme_settings automatically so vitrine and admin stay identical
  if (logoUrl !== undefined || faviconUrl !== undefined) {
    try {
      const themeUpdate: Record<string, string> = {};
      if (logoUrl !== undefined) themeUpdate.logo_url = logoUrl;
      if (faviconUrl !== undefined) themeUpdate.favicon_url = faviconUrl;
      await db.from("theme_settings").update(themeUpdate).eq("store_id", identity.store_id);
    } catch {
      // Ignore if theme_settings is missing or table structurally absent
    }
  }

  return { status: "success" };
}

export const saveStoreSettings = createServerFn({ method: "POST" })
  .validator(saveStoreSettingsSchema)
  .handler(async ({ data }) => _saveStoreSettings(data));

// --- POLÍTICAS DA LOJA ---

export async function _getPolicies() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, policies")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar políticas");
  }

  return store;
}

export const getPolicies = createServerFn({ method: "GET" }).handler(_getPolicies);

export const savePoliciesSchema = z.object({
  privacy_policy: z.string(),
  return_policy: z.string(),
  terms: z.string(),
});

export async function _savePolicies(data: z.infer<typeof savePoliciesSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db.from("stores").update({ policies: data }).eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar políticas: " + error.message);
  }

  return { status: "success" };
}

export const savePolicies = createServerFn({ method: "POST" })
  .validator(savePoliciesSchema)
  .handler(async ({ data }) => _savePolicies(data));

// --- SEO DA LOJA ---

export async function _getStoreSeo() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, seo_title, seo_description, seo_keywords")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar SEO");
  }

  return store;
}

export const getStoreSeo = createServerFn({ method: "GET" }).handler(_getStoreSeo);

export const saveStoreSeoSchema = z.object({
  seo_title: z.string().max(60),
  seo_description: z.string().max(160),
  seo_keywords: z.string(),
});

export async function _saveStoreSeo(data: z.infer<typeof saveStoreSeoSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db.from("stores").update(data).eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar SEO: " + error.message);
  }

  return { status: "success" };
}

export const saveStoreSeo = createServerFn({ method: "POST" })
  .validator(saveStoreSeoSchema)
  .handler(async ({ data }) => _saveStoreSeo(data));

// --- PERFIL PÚBLICO DA LOJA ---

export async function _getPublicProfile() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "support", "finance", "seller"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select(
      "id, name, description, logo_url, address, phone, business_hours, social_links, settings",
    )
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada ou erro ao carregar perfil público");
  }

  return store;
}

export const getPublicProfile = createServerFn({ method: "GET" }).handler(_getPublicProfile);

export const savePublicProfileSchema = z.object({
  description: z.string().max(500),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  business_hours: z.string().max(200).optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  settings: z.record(z.any()).optional(),
});

export async function _savePublicProfile(data: z.infer<typeof savePublicProfileSchema>) {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin"]);

  const db = getServerClient();
  const { error } = await db.from("stores").update(data).eq("id", identity.store_id);

  if (error) {
    throw new Error("Erro ao salvar perfil público: " + error.message);
  }

  return { status: "success" };
}

export const savePublicProfile = createServerFn({ method: "POST" })
  .validator(savePublicProfileSchema)
  .handler(async ({ data }) => _savePublicProfile(data));

// --- CONFIGURAÇÕES DE PAGAMENTO ---

export async function _getPaymentSettings() {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "finance"]);

  const db = getServerClient();
  const { data: store, error } = await db
    .from("stores")
    .select("id, pix_key, payment_instructions, settings")
    .eq("id", identity.store_id)
    .single();

  if (error || !store) {
    throw new Error("Loja não encontrada");
  }

  const settingsObj = (store.settings || {}) as Record<string, any>;
  const paySettings = settingsObj.payment_settings || {};

  return {
    status: "ok" as const,
    data: {
      pix_key: store.pix_key,
      payment_instructions: store.payment_instructions,
      pix_discount_percentage: Number(paySettings.pix_discount_percentage ?? 0),
      max_installments: Number(paySettings.max_installments ?? 12),
      interest_free_installments: Number(paySettings.interest_free_installments ?? 3),
      installment_interest_rate: Number(paySettings.installment_interest_rate ?? 2.99),
    },
  };
}

export const getPaymentSettings = createServerFn({ method: "GET" }).handler(
  _getPaymentSettings as any
);

export const savePaymentSettingsSchema = z.object({
  pix_key: z.string().max(255).optional().or(z.literal("")),
  payment_instructions: z.string().max(1000).optional().or(z.literal("")),
  pix_discount_percentage: z.number().min(0).max(100).optional().default(0),
  max_installments: z.number().int().min(1).max(12).optional().default(12),
  interest_free_installments: z.number().int().min(1).max(12).optional().default(3),
  installment_interest_rate: z.number().min(0).max(100).optional().default(2.99),
});

export const savePaymentSettings = createServerFn({ method: "POST" })
  .validator(savePaymentSettingsSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    const db = getServerClient();

    // Fetch existing settings
    const { data: store } = await db
      .from("stores")
      .select("settings")
      .eq("id", identity.store_id)
      .single();

    const currentSettings = (store?.settings || {}) as Record<string, any>;
    const { pix_key, payment_instructions, ...extra } = data;

    const updatedSettings = {
      ...currentSettings,
      payment_settings: {
        ...(currentSettings.payment_settings || {}),
        ...extra,
      },
    };

    const { error } = await db
      .from("stores")
      .update({
        pix_key,
        payment_instructions,
        settings: updatedSettings,
      })
      .eq("id", identity.store_id);

    if (error) throw new Error("Erro ao salvar configurações de pagamento: " + error.message);

    return { status: "success" as const };
  });

/**
 * Public-facing: Returns PIX key and payment instructions for a specific order.
 * Uses service role so it's safe to call from customer-facing server functions.
 * The order's store_id is used to look up the store, ensuring tenant isolation.
 */
export async function getStorePaymentInfoByOrderId(orderId: string) {
  const db = getServerClient();

  // Get the store_id from the order (service role bypasses RLS safely)
  const { data: order } = await db.from("orders").select("store_id").eq("id", orderId).single();

  if (!order?.store_id) return null;

  const { data: store } = await db
    .from("stores")
    .select("pix_key, payment_instructions")
    .eq("id", order.store_id)
    .single();

  return store || null;
}

export const executeHardRefresh = createServerFn({ method: "POST" })
  .validator(z.object({ confirmText: z.string() }))
  .handler(async ({ data: { confirmText } }) => {
    const db = getServerClient();
    const { data, error } = await db.rpc("execute_hard_refresh", { p_confirm_text: confirmText });
    if (error) {
      console.error("[HardRefreshError]", error);
      throw new Error(error.message);
    }
    return data;
  });

// ---------------------------------------------------------------------------
// Horários de Funcionamento — Microfase G
// Persistido em stores.settings.working_hours como JSONB.
// Schema canônico: { [day]: { open: boolean, intervals: [{from, to}] } }
// ---------------------------------------------------------------------------

/** Dias da semana canônicos */
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};

export type TimeInterval = {
  from: string; // "09:00"
  to: string; // "18:00"
};

export type DaySchedule = {
  open: boolean;
  intervals: TimeInterval[];
};

export type WorkingHours = Record<Weekday, DaySchedule>;

/** Horário padrão caso não exista configuração */
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: { open: true, intervals: [{ from: "09:00", to: "18:00" }] },
  tue: { open: true, intervals: [{ from: "09:00", to: "18:00" }] },
  wed: { open: true, intervals: [{ from: "09:00", to: "18:00" }] },
  thu: { open: true, intervals: [{ from: "09:00", to: "18:00" }] },
  fri: { open: true, intervals: [{ from: "09:00", to: "18:00" }] },
  sat: { open: false, intervals: [] },
  sun: { open: false, intervals: [] },
};

const timeIntervalSchema = z.object({
  from: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  to: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

const dayScheduleSchema = z.object({
  open: z.boolean(),
  intervals: z.array(timeIntervalSchema),
});

export const workingHoursSchema = z.object({
  mon: dayScheduleSchema,
  tue: dayScheduleSchema,
  wed: dayScheduleSchema,
  thu: dayScheduleSchema,
  fri: dayScheduleSchema,
  sat: dayScheduleSchema,
  sun: dayScheduleSchema,
});

/** Retorna os horários de funcionamento da loja */
export const getWorkingHours = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const db = getServerClient();
  const { data: store } = await db
    .from("stores")
    .select("settings")
    .eq("id", identity.store_id)
    .single();

  const raw = (store?.settings as any)?.working_hours;
  if (!raw) return DEFAULT_WORKING_HOURS;

  // Valida e normaliza o schema — coluna legada pode ter formato diferente
  const parsed = workingHoursSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_WORKING_HOURS;
});

/** Salva os horários de funcionamento */
export const saveWorkingHours = createServerFn({ method: "POST" })
  .validator(workingHoursSchema)
  .handler(async ({ data: workingHours }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    const db = getServerClient();

    // Lê settings atuais para fazer merge (não sobrescrever outros campos)
    const { data: store } = await db
      .from("stores")
      .select("settings")
      .eq("id", identity.store_id)
      .single();

    const currentSettings = (store?.settings as Record<string, any>) || {};

    const { error } = await db
      .from("stores")
      .update({
        settings: {
          ...currentSettings,
          working_hours: workingHours,
        },
      })
      .eq("id", identity.store_id);

    if (error) throw new Error("Erro ao salvar horários: " + error.message);
    return { success: true };
  });

/**
 * Retorna os intervalos disponíveis de uma data para o booking engine.
 * Usado por getAvailableSlots para substituir o hardcode 09:00-18:00.
 */
export async function getWorkingIntervalsForDate(
  storeId: string,
  date: string, // "YYYY-MM-DD"
): Promise<TimeInterval[]> {
  const db = getServerClient();
  const { data: store } = await db
    .from("stores")
    .select("settings")
    .eq("id", storeId)
    .single();

  const raw = (store?.settings as any)?.working_hours as WorkingHours | undefined;
  if (!raw) return [{ from: "09:00", to: "18:00" }]; // fallback seguro

  // Mapear dia da semana
  const dayIndex = new Date(date + "T12:00:00Z").getUTCDay(); // 0=Sun, 1=Mon...
  const dayMap: Record<number, Weekday> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };
  const dayKey = dayMap[dayIndex];
  const schedule = raw[dayKey];

  if (!schedule?.open || !schedule.intervals?.length) return [];
  return schedule.intervals;
}

