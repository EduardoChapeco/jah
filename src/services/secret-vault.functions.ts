import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";

export const saveSecretKey = createServerFn({ method: "POST" })
  .validator(
    z.object({
      scope: z.enum(["global", "organization", "personal"]).default("personal"),
      provider: z.enum([
        "gemini",
        "openrouter",
        "openai",
        "anthropic",
        "firecrawl",
        "steel",
        "resend",
        "google_maps",
      ]),
      label: z.string().min(2),
      secretKey: z.string().min(6),
      dailyBudgetCents: z.number().int().min(0).optional().default(0),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();
    if (!identity?.id) throw new Error("Não autenticado");

    // Mask the secret for safe client display (e.g. sk-...ab12)
    const rawKey = input.secretKey.trim();
    const masked =
      rawKey.length > 8 ? `${rawKey.slice(0, 3)}...${rawKey.slice(-4)}` : `***${rawKey.slice(-2)}`;

    // Simple base64 encode for vault storage simulation (in production with KMS)
    const encrypted = Buffer.from(rawKey).toString("base64");

    const { data: entry, error } = await supabase
      .from("secret_vault")
      .insert({
        scope: input.scope,
        owner_id: identity.id,
        provider: input.provider,
        label: input.label,
        encrypted_secret: encrypted,
        masked_suffix: masked,
        is_active: true,
        daily_budget_cents: input.dailyBudgetCents,
        last_verified_at: new Date().toISOString(),
      })
      .select(
        "id, scope, provider, label, masked_suffix, is_active, daily_budget_cents, created_at",
      )
      .single();

    if (error) {
      console.error("[secret-vault] Error saving key:", error);
      throw new Error("Erro ao salvar credencial no cofre seguro.");
    }

    return entry;
  });

export const listConfiguredSecrets = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity();
  if (!identity?.id) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("secret_vault")
    .select(
      "id, scope, provider, label, masked_suffix, is_active, daily_budget_cents, last_verified_at, created_at",
    )
    .eq("owner_id", identity.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[secret-vault] listConfiguredSecrets error:", error);
    throw new Error("Erro ao listar credenciais.");
  }

  return data || [];
});

export const getAICapabilityBindings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from("ai_capability_bindings")
    .select("*")
    .order("priority", { ascending: true });

  if (error) {
    console.error("[secret-vault] getAICapabilityBindings error:", error);
    throw new Error("Erro ao buscar mapeamento de IA.");
  }

  return data || [];
});
