-- ============================================================================
-- Jah Platform — Migration: Web Push Subscriptions & Instant Lead Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_push_subscription_endpoint UNIQUE (profile_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_sub_profile_id ON public.push_subscriptions (profile_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_store_id ON public.push_subscriptions (store_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_self_all"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = profile_id);

CREATE POLICY "push_subscriptions_service_all"
  ON public.push_subscriptions FOR ALL
  USING (true);
