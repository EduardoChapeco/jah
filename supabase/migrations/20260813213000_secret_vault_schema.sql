-- Migration 0089: Secret Vault & AI Capability Bindings
-- Protocolo V3 - Integrações BYOK Criptografadas & Roteador de IA

CREATE TABLE IF NOT EXISTS public.secret_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'organization' CHECK (scope IN ('global', 'organization', 'personal')),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter', 'openai', 'anthropic', 'firecrawl', 'steel', 'resend', 'google_maps')),
  label TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  masked_suffix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_budget_cents BIGINT DEFAULT 0,
  monthly_budget_cents BIGINT DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_capability_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_key TEXT NOT NULL CHECK (capability_key IN ('contract_assistant', 'product_copywriter', 'vision_ocr', 'web_scraping', 'geocoding')),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 1,
  secret_id UUID REFERENCES public.secret_vault(id) ON DELETE SET NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.secret_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_capability_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_owner_all" ON public.secret_vault
  FOR ALL USING (
    owner_id = auth.uid()
  );

CREATE POLICY "bindings_select_all" ON public.ai_capability_bindings
  FOR SELECT USING (true);

