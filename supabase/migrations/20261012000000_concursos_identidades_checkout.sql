-- ============================================================================
-- Migration: 20261012000000_concursos_identidades_checkout.sql
-- Objetivo: Suporte a Concursos de Sorte Multilojas (anti-vício com aceite de termos),
--           Membro Fundador perpétuo vs Embaixador dinâmico mensal e
--           RLS granular para lojistas criarem concursos da sua própria loja.
-- ============================================================================

-- 1. Expansão de Concursos de Sorte em `raffles`
ALTER TABLE public.raffles
  ADD COLUMN IF NOT EXISTS terms_text text,
  ADD COLUMN IF NOT EXISTS is_official_platform boolean DEFAULT false;

-- Garantir índice por loja para consultas ultra rápidas
CREATE INDEX IF NOT EXISTS idx_raffles_store_id ON public.raffles (store_id);
CREATE INDEX IF NOT EXISTS idx_raffles_status ON public.raffles (status);

-- 2. Expansão de `raffle_tickets` com aceite de regulamento
ALTER TABLE public.raffle_tickets
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_raffle_tickets_raffle_user ON public.raffle_tickets (raffle_id, user_id);

-- 3. Expansão de `invite_scores` para Membro Fundador vs Embaixador Dinâmico Mensal
ALTER TABLE public.invite_scores
  ADD COLUMN IF NOT EXISTS is_founder_member boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS monthly_referrals_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_conversions_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_ambassador_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_referral_at timestamptz;

-- 4. RLS para Concursos de Sorte (`raffles`)
-- Qualquer usuário pode ler concursos ativos ou concluídos
DROP POLICY IF EXISTS "Public can view active or completed raffles" ON public.raffles;
DROP POLICY IF EXISTS "raffles_public_read" ON public.raffles;

CREATE POLICY "raffles_public_read" ON public.raffles
  FOR SELECT
  USING (status IN ('active', 'drawing', 'completed'));

-- Lojistas podem criar e gerenciar concursos da sua própria loja
DROP POLICY IF EXISTS "Store staff can manage store raffles" ON public.raffles;
DROP POLICY IF EXISTS "raffles_store_staff_manage" ON public.raffles;

CREATE POLICY "raffles_store_staff_manage" ON public.raffles
  FOR ALL
  TO authenticated
  USING (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = raffles.store_id
        AND wm.profile_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    store_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.store_id = raffles.store_id
        AND wm.profile_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    )
  );

-- Admins da plataforma podem gerenciar qualquer concurso
DROP POLICY IF EXISTS "Platform admin can manage all raffles" ON public.raffles;
DROP POLICY IF EXISTS "raffles_admin_all" ON public.raffles;

CREATE POLICY "raffles_admin_all" ON public.raffles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'master')
    )
  );

-- 5. RLS para `raffle_tickets`
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.raffle_tickets;
DROP POLICY IF EXISTS "raffle_tickets_user_read" ON public.raffle_tickets;

CREATE POLICY "raffle_tickets_user_read" ON public.raffle_tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.raffles r
      JOIN public.workspace_members wm ON wm.store_id = r.store_id
      WHERE r.id = raffle_tickets.raffle_id
        AND wm.profile_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'manager')
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'master')
    )
  );
