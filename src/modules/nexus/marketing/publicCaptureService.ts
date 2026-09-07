import { supabase } from "@/integrations/supabase/client";

const FINGERPRINT_STORAGE_KEY = "public_capture_fingerprint";

export function getOrCreateFingerprint() {
  const existing = window.localStorage.getItem(FINGERPRINT_STORAGE_KEY);
  if (existing) return existing;

  const fingerprint = [navigator.userAgent, navigator.language, screen.width, screen.height, crypto.randomUUID()].join("|");
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
