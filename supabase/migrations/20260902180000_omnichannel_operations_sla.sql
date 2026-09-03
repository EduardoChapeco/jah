-- Migration: 20260902180000_omnichannel_operations_sla.sql
-- Omnichannel Food Service, SLAs Operacionais em Tempo Real e Gestão Centralizada de Complementos

-- 1. Expansão na Tabela orders (Canal de Origem, SLAs e Timestamps de Preparo)
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS channel_origin TEXT DEFAULT 'web', -- 'web', 'pos', 'table', 'ifood', 'whatsapp'
    ADD COLUMN IF NOT EXISTS prep_time_sla_minutes INT DEFAULT 20,
    ADD COLUMN IF NOT EXISTS delivery_time_sla_minutes INT DEFAULT 45,
    ADD COLUMN IF NOT EXISTS prep_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sla_alert_triggered BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_channel ON public.orders(channel_origin);
CREATE INDEX IF NOT EXISTS idx_orders_sla ON public.orders(status, prep_started_at);

-- 2. Tabela de Grupos de Complementos & Adicionais Reutilizáveis
CREATE TABLE IF NOT EXISTS public.store_complement_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    min_selection INT DEFAULT 0,
    max_selection INT DEFAULT 1,
    is_required BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb, -- [{ id, name, price_cents, is_active }]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_complement_groups_store ON public.store_complement_groups(store_id);
CREATE INDEX IF NOT EXISTS idx_store_complement_groups_active ON public.store_complement_groups(is_active);

-- 3. Habilitação de RLS e Políticas Restritivas
ALTER TABLE public.store_complement_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_complement_groups_staff" ON public.store_complement_groups;
CREATE POLICY "store_complement_groups_staff" ON public.store_complement_groups
    FOR ALL USING (
        public.is_store_staff(store_id)
    );

DROP POLICY IF EXISTS "store_complement_groups_public_read" ON public.store_complement_groups;
CREATE POLICY "store_complement_groups_public_read" ON public.store_complement_groups
    FOR SELECT USING (
        is_active = true
    );
