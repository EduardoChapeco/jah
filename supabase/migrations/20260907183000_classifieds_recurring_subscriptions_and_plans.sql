-- ==============================================================================
-- MIGRATION: 20260907183000_classifieds_recurring_subscriptions_and_plans.sql
-- Description:
--   1. Expands classifieds with recurring pricing models, billing cycles, setup fees and subcategories.
--   2. Creates classified_subscriptions table for managing subscriptions, recurring billing and rents.
--   3. Strict multi-tenant RLS deny-by-default and indexes.
-- ==============================================================================

-- 1. CLASSIFIEDS EXPANSION
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'one_time', -- 'one_time' | 'recurring'
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly', -- 'monthly' | 'quarterly' | 'semiannual' | 'yearly'
  ADD COLUMN IF NOT EXISTS setup_fee_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recurring_features text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sub_category text;

CREATE INDEX IF NOT EXISTS idx_classifieds_pricing_model ON public.classifieds (pricing_model) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_classifieds_sub_category ON public.classifieds (sub_category) WHERE status = 'active';

-- 2. CLASSIFIED SUBSCRIPTIONS & RENTS (Cobranças Recorrentes, Assinaturas e Aluguéis)
CREATE TABLE IF NOT EXISTS public.classified_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id uuid NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  subscriber_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'past_due' | 'paused' | 'canceled'
  billing_cycle text NOT NULL DEFAULT 'monthly', -- 'monthly' | 'quarterly' | 'semiannual' | 'yearly'
  price_cents integer NOT NULL,
  setup_fee_paid_cents integer DEFAULT 0,
  next_billing_date date NOT NULL DEFAULT (CURRENT_DATE + interval '1 month'),
  last_payment_date timestamptz DEFAULT now(),
  subscriber_notes text,
  payment_method text DEFAULT 'pix', -- 'pix' | 'credit_card' | 'bank_transfer' | 'cash'
  pix_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classified_subscriptions_seller ON public.classified_subscriptions (seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_classified_subscriptions_subscriber ON public.classified_subscriptions (subscriber_profile_id);
CREATE INDEX IF NOT EXISTS idx_classified_subscriptions_classified ON public.classified_subscriptions (classified_id);
CREATE INDEX IF NOT EXISTS idx_classified_subscriptions_status ON public.classified_subscriptions (status);

-- 3. RLS SECURITY POLICIES (DENY-BY-DEFAULT)
ALTER TABLE public.classified_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscribers can view their own subscriptions" ON public.classified_subscriptions;
CREATE POLICY "Subscribers can view their own subscriptions"
  ON public.classified_subscriptions FOR SELECT
  TO authenticated
  USING (subscriber_profile_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can view and manage their incoming subscriptions" ON public.classified_subscriptions;
CREATE POLICY "Sellers can view and manage their incoming subscriptions"
  ON public.classified_subscriptions FOR ALL
  TO authenticated
  USING (seller_profile_id = auth.uid());

DROP POLICY IF EXISTS "Subscribers can create subscription requests" ON public.classified_subscriptions;
CREATE POLICY "Subscribers can create subscription requests"
  ON public.classified_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (subscriber_profile_id = auth.uid());

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_classified_subscriptions_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_classified_subscriptions_modtime ON public.classified_subscriptions;
CREATE TRIGGER trigger_classified_subscriptions_modtime
  BEFORE UPDATE ON public.classified_subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE update_classified_subscriptions_modtime();
