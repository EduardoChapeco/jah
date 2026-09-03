-- Migration: 20260902290000_product_waitlist_and_demand_capture.sql
-- Captura de Intenção Comercial: Lista de Espera (Waitlist) para Produtos Esgotados

CREATE TABLE IF NOT EXISTS public.product_waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_contact TEXT NOT NULL, -- WhatsApp, Celular ou E-mail
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'cancelled')),
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de performance para busca rápida por produto e loja
CREATE INDEX IF NOT EXISTS idx_product_waitlist_store ON public.product_waitlist_entries(store_id, status);
CREATE INDEX IF NOT EXISTS idx_product_waitlist_product ON public.product_waitlist_entries(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_product_waitlist_created ON public.product_waitlist_entries(created_at DESC);

-- RLS Deny-by-Default
ALTER TABLE public.product_waitlist_entries ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer visitante (mesmo não logado) pode entrar na lista de espera de um produto
DROP POLICY IF EXISTS "product_waitlist_public_insert" ON public.product_waitlist_entries;
CREATE POLICY "product_waitlist_public_insert" ON public.product_waitlist_entries
    FOR INSERT WITH CHECK (true);

-- 2. Clientes logados podem ver suas próprias entradas
DROP POLICY IF EXISTS "product_waitlist_customer_select" ON public.product_waitlist_entries;
CREATE POLICY "product_waitlist_customer_select" ON public.product_waitlist_entries
    FOR SELECT USING (
        auth.uid() = customer_id OR
        public.is_store_staff(store_id)
    );

-- 3. Staff da loja tem permissão total (gerenciar, marcar como notificado)
DROP POLICY IF EXISTS "product_waitlist_staff_all" ON public.product_waitlist_entries;
CREATE POLICY "product_waitlist_staff_all" ON public.product_waitlist_entries
    FOR ALL USING (public.is_store_staff(store_id));
