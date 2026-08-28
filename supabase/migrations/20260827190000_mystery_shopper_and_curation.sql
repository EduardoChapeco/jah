-- ============================================================================
-- WIDER PLATFORM: PROGRAMA DE CURADORIA ATIVA & CLIENTE OCULTO (MYSTERY SHOPPER)
-- Schema com RLS, mascaramento de auditor, contestação solidária e boost algorítmico
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mystery_shopper_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  auditor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  masked_auditor_code TEXT NOT NULL DEFAULT ('AUD-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
  product_name TEXT NOT NULL,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_dispatch' CHECK (status IN ('pending_dispatch', 'in_transit', 'delivered', 'reviewed', 'disputed', 'resolved')),
  notification_sent_to_store BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  
  -- Métricas de Avaliação do Cliente Oculto
  rating_overall INTEGER CHECK (rating_overall BETWEEN 1 AND 5),
  rating_packaging INTEGER CHECK (rating_packaging BETWEEN 1 AND 5),
  rating_temperature INTEGER CHECK (rating_temperature BETWEEN 1 AND 5),
  rating_punctuality INTEGER CHECK (rating_punctuality BETWEEN 1 AND 5),
  review_text TEXT,
  photos TEXT[] DEFAULT '{}'::TEXT[],
  social_share_url TEXT,
  reviewed_at TIMESTAMPTZ,
  
  -- Contestação Solidária / Relato de Dificuldade Financeira pelo Lojista
  dispute_reason TEXT,
  hardship_level TEXT DEFAULT 'none' CHECK (hardship_level IN ('none', 'low', 'medium', 'severe', 'critical')),
  dispute_status TEXT NOT NULL DEFAULT 'none' CHECK (dispute_status IN ('none', 'pending_review', 'hardship_accepted', 'boost_granted', 'fee_discount_granted', 'rejected')),
  admin_notes TEXT,
  
  -- Impulsionamento Algorítmico Solidário de Visibilidade no Backend
  visibility_boost_multiplier NUMERIC(3, 1) DEFAULT 1.0,
  visibility_boost_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Performance e Consulta
CREATE INDEX IF NOT EXISTS idx_mystery_audits_store ON public.mystery_shopper_audits(store_id);
CREATE INDEX IF NOT EXISTS idx_mystery_audits_auditor ON public.mystery_shopper_audits(auditor_user_id);
CREATE INDEX IF NOT EXISTS idx_mystery_audits_status ON public.mystery_shopper_audits(status);
CREATE INDEX IF NOT EXISTS idx_mystery_audits_dispute ON public.mystery_shopper_audits(dispute_status);
CREATE INDEX IF NOT EXISTS idx_mystery_audits_boost ON public.mystery_shopper_audits(visibility_boost_expires_at);

-- Habilitar RLS
ALTER TABLE public.mystery_shopper_audits ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Admins can do everything on mystery audits" ON public.mystery_shopper_audits;
CREATE POLICY "Admins can do everything on mystery audits" ON public.mystery_shopper_audits
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
    OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "Store owners can read their store audits" ON public.mystery_shopper_audits;
CREATE POLICY "Store owners can read their store audits" ON public.mystery_shopper_audits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspace_members wm ON wm.store_id = s.id
      WHERE s.id = mystery_shopper_audits.store_id
      AND wm.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners can dispute audits" ON public.mystery_shopper_audits;
CREATE POLICY "Store owners can dispute audits" ON public.mystery_shopper_audits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspace_members wm ON wm.store_id = s.id
      WHERE s.id = mystery_shopper_audits.store_id
      AND wm.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspace_members wm ON wm.store_id = s.id
      WHERE s.id = mystery_shopper_audits.store_id
      AND wm.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Auditors can view and review their assigned audits" ON public.mystery_shopper_audits;
CREATE POLICY "Auditors can view and review their assigned audits" ON public.mystery_shopper_audits
  FOR ALL USING (
    auth.uid() = auditor_user_id
  );
