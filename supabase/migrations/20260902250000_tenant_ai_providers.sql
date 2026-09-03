-- ==============================================================================
-- MIGRAÇÃO: PROVEDORES DE INTELIGÊNCIA ARTIFICIAL & GESTÃO DE CHAVES POR NEGÓCIO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'gemini', 'deepseek', 'groq', 'custom')),
    model_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    monthly_token_limit INTEGER,
    last_tested_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'untested' CHECK (status IN ('untested', 'active', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_tenant_ai_provider UNIQUE (store_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_tenant_ai_providers_store ON public.tenant_ai_providers(store_id);

-- RLS
ALTER TABLE public.tenant_ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage tenant AI providers"
    ON public.tenant_ai_providers
    FOR ALL
    TO authenticated
    USING (
        store_id IN (
            SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin')
        )
    );
