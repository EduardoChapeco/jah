-- ==============================================================================
-- 20260825220000_multi_price_tables_b2b_erp.sql
-- Múltiplas Tabelas de Preço (B2B, Atacado, Varejo, Vendedores, PDV)
-- Padrão BigTech & ERP (Bling / Olist / Tiny) com RLS Deny-by-Default
-- ==============================================================================

-- 1. TABELA PRINCIPAL DE TABELAS DE PREÇO
CREATE TABLE IF NOT EXISTS public.price_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    adjustment_type TEXT NOT NULL DEFAULT 'none' CHECK (
        adjustment_type IN (
            'none',
            'percentage_discount',
            'percentage_markup',
            'fixed_discount',
            'fixed_markup',
            'custom_prices'
        )
    ),
    adjustment_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    min_order_value_cents BIGINT DEFAULT NULL,
    valid_from TIMESTAMPTZ DEFAULT NULL,
    valid_until TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_store_price_table_code UNIQUE (store_id, code)
);

-- 2. ITENS COM PREÇOS CUSTOMIZADOS POR PRODUTO NA TABELA
CREATE TABLE IF NOT EXISTS public.price_table_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_table_id UUID NOT NULL REFERENCES public.price_tables(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    custom_price_cents BIGINT NOT NULL,
    min_quantity INT NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_price_table_product UNIQUE (price_table_id, product_id)
);

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_price_tables_store ON public.price_tables(store_id);
CREATE INDEX IF NOT EXISTS idx_price_tables_code ON public.price_tables(store_id, code);
CREATE INDEX IF NOT EXISTS idx_price_table_items_table ON public.price_table_items(price_table_id);
CREATE INDEX IF NOT EXISTS idx_price_table_items_product ON public.price_table_items(product_id);

-- 4. ATIVAÇÃO DE RLS
ALTER TABLE public.price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_table_items ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURANÇA (RLS DENY-BY-DEFAULT)
CREATE POLICY "price_tables_public_read" ON public.price_tables
    FOR SELECT
    USING (active = true OR public.is_store_staff(store_id));

CREATE POLICY "price_tables_staff_all" ON public.price_tables
    FOR ALL
    USING (public.is_store_staff(store_id));

CREATE POLICY "price_table_items_public_read" ON public.price_table_items
    FOR SELECT
    USING (active = true);

CREATE POLICY "price_table_items_staff_all" ON public.price_table_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.price_tables pt
            WHERE pt.id = price_table_items.price_table_id
            AND public.is_store_staff(pt.store_id)
        )
    );
