import { supabase } from "@/integrations/supabase/client";

const FINGERPRINT_STORAGE_KEY = "public_capture_fingerprint";

export function getOrCreateFingerprint() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return "server-env-fingerprint";
  }
  const existing = window.localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (existing) return existing;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const lang = typeof navigator !== "undefined" ? navigator.language : "pt-BR";
  const sw = typeof screen !== "undefined" ? screen.width : 1920;
  const sh = typeof screen !== "undefined" ? screen.height : 1080;
  const rand = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

  const fingerprint = [ua, lang, sw, sh, rand].join("|");
  window.localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
  return fingerprint;
}

export async function submitPublicCapture(params: {
  slug: string;
  payload: Record<string, unknown>;
  campaignId?: string | null;
}) {
  const { data, error } = await (supabase as any).rpc("submit_public_lead_capture", {
    p_form_slug: params.slug,
    p_payload: params.payload,
    p_campaign_id: params.campaignId ?? null,
    p_fingerprint: getOrCreateFingerprint(),
  });

  if (error) throw error;
  return data;
}
