-- ==============================================================================
-- MIGRATION: 20260925000000_personal_finance_system.sql
-- Módulo de Gestão Financeira Pessoal (Wider Community Platform)
-- Tabelas: personal_financial_categories, personal_financial_entries
-- Isolamento RLS rigoroso (auth.uid() = profile_id), índices e seed inicial
-- ==============================================================================

-- 1. Categorias de Finanças Pessoais
CREATE TABLE IF NOT EXISTS public.personal_financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Receipt',
    color TEXT NOT NULL DEFAULT '#6366f1',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Lançamentos Financeiros Pessoais
CREATE TABLE IF NOT EXISTS public.personal_financial_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.personal_financial_categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    description TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    payment_method TEXT DEFAULT 'pix' CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'transfer', 'boleto', 'other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_pfe_profile_date ON public.personal_financial_entries(profile_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_pfe_profile_type ON public.personal_financial_entries(profile_id, type);
CREATE INDEX IF NOT EXISTS idx_pfe_category ON public.personal_financial_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_pfc_profile ON public.personal_financial_categories(profile_id);

-- 4. Habilitação de RLS Deny-by-Default
ALTER TABLE public.personal_financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_financial_entries ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança RLS para Categorias
-- Usuários podem ler categorias do sistema (profile_id IS NULL) e suas próprias categorias
DROP POLICY IF EXISTS "pfc_select_policy" ON public.personal_financial_categories;
CREATE POLICY "pfc_select_policy" ON public.personal_financial_categories
    FOR SELECT USING (profile_id IS NULL OR profile_id = auth.uid());

DROP POLICY IF EXISTS "pfc_insert_policy" ON public.personal_financial_categories;
CREATE POLICY "pfc_insert_policy" ON public.personal_financial_categories
    FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "pfc_update_policy" ON public.personal_financial_categories;
CREATE POLICY "pfc_update_policy" ON public.personal_financial_categories
    FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "pfc_delete_policy" ON public.personal_financial_categories;
CREATE POLICY "pfc_delete_policy" ON public.personal_financial_categories
    FOR DELETE USING (profile_id = auth.uid());

-- 6. Políticas de Segurança RLS para Lançamentos (Privacidade Total do Usuário)
DROP POLICY IF EXISTS "pfe_select_policy" ON public.personal_financial_entries;
CREATE POLICY "pfe_select_policy" ON public.personal_financial_entries
    FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "pfe_insert_policy" ON public.personal_financial_entries;
CREATE POLICY "pfe_insert_policy" ON public.personal_financial_entries
    FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "pfe_update_policy" ON public.personal_financial_entries;
CREATE POLICY "pfe_update_policy" ON public.personal_financial_entries
    FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "pfe_delete_policy" ON public.personal_financial_entries;
CREATE POLICY "pfe_delete_policy" ON public.personal_financial_entries
    FOR DELETE USING (profile_id = auth.uid());

-- 7. Seed de Categorias Globais Padrão (profile_id IS NULL)
INSERT INTO public.personal_financial_categories (name, icon, color, type, profile_id)
VALUES
    ('Alimentação & Mercado', 'Utensils', '#f97316', 'expense', NULL),
    ('Transporte & Mobilidade', 'Car', '#3b82f6', 'expense', NULL),
    ('Moradia & Contas', 'Home', '#8b5cf6', 'expense', NULL),
    ('Saúde & Farmácia', 'HeartPulse', '#ef4444', 'expense', NULL),
    ('Educação & Desenvolvimento', 'GraduationCap', '#06b6d4', 'expense', NULL),
    ('Lazer & Viagens', 'Palmtree', '#ec4899', 'expense', NULL),
    ('Compras & Varejo', 'ShoppingBag', '#10b981', 'expense', NULL),
    ('Salário & Remuneração', 'Briefcase', '#22c55e', 'income', NULL),
    ('Vendas & Serviços', 'TrendingUp', '#14b8a6', 'income', NULL),
    ('Investimentos & Dividendos', 'Landmark', '#eab308', 'income', NULL),
    ('Outras Receitas', 'ArrowDownLeft', '#84cc16', 'income', NULL),
    ('Outras Despesas', 'Receipt', '#64748b', 'expense', NULL)
ON CONFLICT DO NOTHING;
