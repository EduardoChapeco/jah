-- Supabase Migration: Billing Engine & Ads Engine

-- 1. Platform Invoices (Faturamento da Plataforma para a Loja)
CREATE TABLE IF NOT EXISTS platform_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  amount_cents integer NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Platform Subscriptions (Assinaturas SaaS)
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  price_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Ad Campaigns (Motor de Impulsionamento)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL, -- Optional, if boosting a specific product
  type text NOT NULL CHECK (type IN ('fixed_banner', 'dynamic_boost')),
  budget_cents integer NOT NULL, -- Total budget or cost
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Ad Events (Métricas de Impulsionamento)
CREATE TABLE IF NOT EXISTS ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'click')),
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE platform_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- Stores can read their own data
CREATE POLICY "Stores can view their invoices" ON platform_invoices FOR SELECT USING (store_id IN (SELECT store_id FROM store_members WHERE profile_id = auth.uid()));
CREATE POLICY "Stores can view their subscriptions" ON platform_subscriptions FOR SELECT USING (store_id IN (SELECT store_id FROM store_members WHERE profile_id = auth.uid()));
CREATE POLICY "Stores can manage their campaigns" ON ad_campaigns FOR ALL USING (store_id IN (SELECT store_id FROM store_members WHERE profile_id = auth.uid()));
CREATE POLICY "Stores can view their ad events" ON ad_events FOR SELECT USING (campaign_id IN (SELECT id FROM ad_campaigns WHERE store_id IN (SELECT store_id FROM store_members WHERE profile_id = auth.uid())));

-- Platform Admins (service_role) bypass RLS automatically.

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_platform_invoices
BEFORE UPDATE ON platform_invoices
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_platform_subscriptions
BEFORE UPDATE ON platform_subscriptions
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_ad_campaigns
BEFORE UPDATE ON ad_campaigns
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
