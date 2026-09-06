-- ==============================================================================
-- MIGRATION: 20260924000000_classifieds_digital_affiliates_and_modules.sql
-- Description:
--   1. Expands classifieds with digital product assets & metadata.
--   2. Creates the complete Affiliate & Influencer Engine (partners, commissions, clicks, telemetry).
--   3. Creates the Platform Dynamic Module Governance (platform_modules_config) for Admin Master.
--   4. RLS Deny-by-Default and audit security.
-- ==============================================================================

-- 1. CLASSIFIEDS EXPANSION (Digital Products & Amenities)
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS is_digital boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_file_name text,
  ADD COLUMN IF NOT EXISTS digital_file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS digital_preview_url text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_classifieds_is_digital ON public.classifieds (is_digital) WHERE status = 'active';

-- 2. AFFILIATE & INFLUENCER ENGINE

-- 2.1 affiliate_partners: influenciadores e parceiros de afiliação
CREATE TABLE IF NOT EXISTS public.affiliate_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  handle text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  social_channel text NOT NULL DEFAULT 'instagram', -- 'instagram' | 'tiktok' | 'youtube' | 'whatsapp' | 'other'
  social_handle text,
  commission_rate_percent numeric(5,2) NOT NULL DEFAULT 10.00,
  pix_key text,
  pix_key_type text DEFAULT 'cpf', -- 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
  status text NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'suspended'
  total_clicks integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  total_gmv_cents bigint NOT NULL DEFAULT 0,
  total_commission_cents bigint NOT NULL DEFAULT 0,
  paid_commission_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partners_handle ON public.affiliate_partners (handle);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_user ON public.affiliate_partners (user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_status ON public.affiliate_partners (status);

-- 2.2 affiliate_clicks: rastreamento de cliques com proteção anti-fraude
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  user_agent text,
  referrer text,
  target_path text DEFAULT '/',
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON public.affiliate_clicks (affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_ip ON public.affiliate_clicks (ip_hash);

-- 2.3 affiliate_commissions: histórico auditado de comissões geradas
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_amount_cents integer NOT NULL,
  commission_rate_percent numeric(5,2) NOT NULL,
  commission_amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'paid' | 'cancelled'
  paid_at timestamptz,
  payout_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON public.affiliate_commissions (affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions (status);

-- 3. PLATFORM MODULES CONFIG (Dynamic Governance in Admin Master)
CREATE TABLE IF NOT EXISTS public.platform_modules_config (
  module_key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  badge text,
  order_index integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed módulos canônicos caso a tabela esteja vazia
INSERT INTO public.platform_modules_config (module_key, name, description, enabled, is_public, badge, order_index)
VALUES
  ('classificados', 'Classificados & Imóveis', 'Venda, aluguel, veículos e produtos digitais da comunidade', true, true, 'Ativo', 10),
  ('noticias', 'Notícias & Editorial', 'Portal de notícias e acontecimentos locais', true, true, 'Ativo', 20),
  ('ofertas', 'Ofertas & Descontos', 'Promoções e ofertas relâmpago de lojas locais', true, true, 'Ativo', 30),
  ('mercado', 'Mercado Central', 'Catálogo integrado de supermercados e hortifrúti', true, true, 'Ativo', 40),
  ('diretorio', 'Guia da Cidade & Lojas', 'Diretório completo de comércios e prestadores', true, true, 'Ativo', 50),
  ('convite', 'Programa de Embaixadores & Convites', 'Sistema de indicação viral, pontos e sorteios', true, true, 'Novo', 60),
  ('afiliados', 'Programa de Influenciadores & Afiliados', 'Comissões para criadores de conteúdo e promotores', true, true, 'Exclusivo', 70),
  ('turismo', 'Turismo & Passeios', 'Hotéis, roteiros, passagens e turismo regional', true, true, 'Ativo', 80)
ON CONFLICT (module_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge;

-- 4. RLS POLICIES

-- Enable RLS
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_modules_config ENABLE ROW LEVEL SECURITY;

-- 4.1 platform_modules_config: Leitura pública, mutação exclusiva para Admin Master
DROP POLICY IF EXISTS "Public can view active platform modules" ON public.platform_modules_config;
CREATE POLICY "Public can view active platform modules" ON public.platform_modules_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin master can update platform modules" ON public.platform_modules_config;
CREATE POLICY "Admin master can update platform modules" ON public.platform_modules_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'master', 'platform_admin')
    )
  );

-- 4.2 affiliate_partners: O dono pode ver e editar seu registro; Admin pode tudo; Leitura pública por handle
DROP POLICY IF EXISTS "Public can view active affiliate profiles" ON public.affiliate_partners;
CREATE POLICY "Public can view active affiliate profiles" ON public.affiliate_partners
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can manage their own affiliate record" ON public.affiliate_partners;
CREATE POLICY "Users can manage their own affiliate record" ON public.affiliate_partners
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all affiliate partners" ON public.affiliate_partners;
CREATE POLICY "Admins can manage all affiliate partners" ON public.affiliate_partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'master', 'platform_admin')
    )
  );

-- 4.3 affiliate_commissions: O afiliado pode visualizar suas comissões
DROP POLICY IF EXISTS "Affiliates can view their commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view their commissions" ON public.affiliate_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_partners
      WHERE affiliate_partners.id = affiliate_commissions.affiliate_id
      AND affiliate_partners.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all affiliate commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can manage all affiliate commissions" ON public.affiliate_commissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'master', 'platform_admin')
    )
  );

-- 4.4 affiliate_clicks: Gravação de cliques segura e consulta pelo próprio afiliado
DROP POLICY IF EXISTS "Anyone can record affiliate click" ON public.affiliate_clicks;
CREATE POLICY "Anyone can record affiliate click" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Affiliates can view their click stats" ON public.affiliate_clicks;
CREATE POLICY "Affiliates can view their click stats" ON public.affiliate_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_partners
      WHERE affiliate_partners.id = affiliate_clicks.affiliate_id
      AND affiliate_partners.user_id = auth.uid()
    )
  );
