-- Migration: Growth Integrations & Billing

-- 1. Dynamic Commission Rules
CREATE TABLE IF NOT EXISTS public.dynamic_commission_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- If null, applies to all sellers for this product/category
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID, -- Assuming we might link to a category later, just a placeholder type
    rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Campaign Metrics (Tracking Ads performance)
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    spend_cents INTEGER NOT NULL DEFAULT 0, -- Amount deducted from wallet for these clicks/impressions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, date)
);

-- 3. Enable RLS
ALTER TABLE public.dynamic_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- dynamic_commission_rules
CREATE POLICY "Store staff can manage dynamic commission rules"
  ON public.dynamic_commission_rules FOR ALL TO authenticated
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "Sellers can view their own commission rules"
  ON public.dynamic_commission_rules FOR SELECT TO authenticated
  USING (
    seller_id = auth.uid() OR seller_id IS NULL
  );

-- campaign_metrics
CREATE POLICY "Store staff can manage campaign metrics"
  ON public.campaign_metrics FOR ALL TO authenticated
  USING (
    public.has_workspace_role(store_id, ARRAY['owner', 'admin', 'manager'])
  );
