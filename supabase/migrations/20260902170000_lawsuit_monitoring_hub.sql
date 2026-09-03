-- Migration: 20260902170000_lawsuit_monitoring_hub.sql
-- Módulo JUS & Advocacia 360° — Monitoramento Contínuo, Consulta CNJ e Compliance

-- 1. Criação da Tabela de Monitoramentos Cadastrados (Lotes de Documentos)
CREATE TABLE IF NOT EXISTS public.lawsuit_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_keys TEXT[] NOT NULL DEFAULT '{}', -- Lista de CPFs, CNPJs ou OABs
    tags TEXT[] DEFAULT '{}',
    courts TEXT[] DEFAULT '{}',
    parties_filter TEXT,
    party_side TEXT DEFAULT 'all', -- 'all', 'active', 'passive', 'third_party'
    date_from DATE,
    date_to DATE,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    matches_count INT DEFAULT 0,
    compliance_alerts_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lawsuit_monitors_store ON public.lawsuit_monitors(store_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_monitors_profile ON public.lawsuit_monitors(profile_id);
CREATE INDEX IF NOT EXISTS idx_lawsuit_monitors_active ON public.lawsuit_monitors(is_active);

-- 2. Expansão de Colunas na Tabela mined_lawsuits (Ficha 360° & Compliance)
ALTER TABLE public.mined_lawsuits 
    ADD COLUMN IF NOT EXISTS organ_name TEXT,
    ADD COLUMN IF NOT EXISTS origin_court TEXT,
    ADD COLUMN IF NOT EXISTS origin_unit TEXT,
    ADD COLUMN IF NOT EXISTS origin_state TEXT,
    ADD COLUMN IF NOT EXISTS judge_name TEXT,
    ADD COLUMN IF NOT EXISTS degree TEXT DEFAULT '1º GRAU',
    ADD COLUMN IF NOT EXISTS has_sentence_enforcement BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_monitored BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS compliance_flags JSONB DEFAULT '{"has_arrest_warrants": false, "has_criminal_executions": false, "has_sanctions_restrictions": false}'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_summary TEXT;

CREATE INDEX IF NOT EXISTS idx_mined_lawsuits_tags ON public.mined_lawsuits USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_mined_lawsuits_monitored ON public.mined_lawsuits(is_monitored);

-- 3. Habilitação de RLS e Políticas Restritivas Deny-by-Default
ALTER TABLE public.lawsuit_monitors ENABLE ROW LEVEL SECURITY;

-- Políticas para lawsuit_monitors
DROP POLICY IF EXISTS "lawsuit_monitors_staff_select" ON public.lawsuit_monitors;
CREATE POLICY "lawsuit_monitors_staff_select" ON public.lawsuit_monitors
    FOR SELECT USING (
        auth.uid() = profile_id 
        OR (store_id IS NOT NULL AND public.is_store_staff(store_id))
    );

DROP POLICY IF EXISTS "lawsuit_monitors_staff_insert" ON public.lawsuit_monitors;
CREATE POLICY "lawsuit_monitors_staff_insert" ON public.lawsuit_monitors
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id
    );

DROP POLICY IF EXISTS "lawsuit_monitors_staff_update" ON public.lawsuit_monitors;
CREATE POLICY "lawsuit_monitors_staff_update" ON public.lawsuit_monitors
    FOR UPDATE USING (
        auth.uid() = profile_id 
        OR (store_id IS NOT NULL AND public.is_store_staff(store_id))
    );

DROP POLICY IF EXISTS "lawsuit_monitors_staff_delete" ON public.lawsuit_monitors;
CREATE POLICY "lawsuit_monitors_staff_delete" ON public.lawsuit_monitors
    FOR DELETE USING (
        auth.uid() = profile_id 
        OR (store_id IS NOT NULL AND public.is_store_staff(store_id))
    );

-- 4. Blindagem de RLS em mined_lawsuits (Nenhum segredo de justiça é público)
DROP POLICY IF EXISTS "mined_lawsuits_public_read" ON public.mined_lawsuits;
CREATE POLICY "mined_lawsuits_secure_read" ON public.mined_lawsuits
    FOR SELECT USING (
        (secrecy_level = 'public')
        OR (auth.uid() = linked_profile_id)
        OR (auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.lawsuit_monitors lm 
            WHERE (lm.profile_id = auth.uid() OR (lm.store_id IS NOT NULL AND public.is_store_staff(lm.store_id)))
            AND (mined_lawsuits.linked_cpf = ANY(lm.document_keys) OR mined_lawsuits.linked_cnpj = ANY(lm.document_keys))
        ))
    );
