-- ==============================================================================
-- MIGRATION: 20261017000000_inbound_webhooks_affiliate_payouts_and_comments.sql
-- Descrição: Tabelas para Transactional Inbox de Webhooks Multicanal e Gestão de Saques de Afiliados
-- ==============================================================================

-- 1. Tabela de Transactional Inbox de Webhooks (Marketplaces, Logística e Fiscal)
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL, -- 'mercadolivre' | 'ifood' | 'focus_nfe' | 'nuvem_fiscal' | 'shopee' | 'correios' | 'melhorenvio'
  event_id text, -- ID do evento remoto fornecido pela plataforma para garantia de idempotência
  topic text, -- ex: 'orders', 'items', 'nfe_autorizada', 'dispatch'
  resource_id text, -- ID do recurso externo (ex: ID do pedido no Mercado Livre, ID do pedido no iFood)
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de alta performance e idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_webhooks_idempotency 
ON public.marketplace_webhook_events(platform, event_id) 
WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_platform_status 
ON public.marketplace_webhook_events(platform, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_webhooks_store_id 
ON public.marketplace_webhook_events(store_id);

-- RLS deny-by-default para webhook events (acesso restrito aos serviços de backend e administradores)
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_webhooks_service_role_all" ON public.marketplace_webhook_events;
CREATE POLICY "marketplace_webhooks_service_role_all" 
ON public.marketplace_webhook_events 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "marketplace_webhooks_store_admin_read" ON public.marketplace_webhook_events;
CREATE POLICY "marketplace_webhooks_store_admin_read" 
ON public.marketplace_webhook_events 
FOR SELECT 
TO authenticated 
USING (
  store_id IN (
    SELECT sm.store_id FROM public.store_memberships sm 
    WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
  )
);

-- 2. Tabela de Solicitações de Saque de Comissões de Afiliados (Affiliate Payout Requests)
CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 5000), -- Mínimo R$ 50,00
  pix_key_type text NOT NULL DEFAULT 'cpf' CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_key text NOT NULL,
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at timestamptz,
  receipt_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_user 
ON public.affiliate_payout_requests(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate 
ON public.affiliate_payout_requests(affiliate_id, status);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_store 
ON public.affiliate_payout_requests(store_id, status);

ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode visualizar seus próprios saques
DROP POLICY IF EXISTS "affiliate_payouts_owner_read" ON public.affiliate_payout_requests;
CREATE POLICY "affiliate_payouts_owner_read" 
ON public.affiliate_payout_requests 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Usuário autenticado pode criar sua solicitação de saque
DROP POLICY IF EXISTS "affiliate_payouts_owner_insert" ON public.affiliate_payout_requests;
CREATE POLICY "affiliate_payouts_owner_insert" 
ON public.affiliate_payout_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Administradores da loja ou plataforma podem visualizar e atualizar saques
DROP POLICY IF EXISTS "affiliate_payouts_admin_all" ON public.affiliate_payout_requests;
CREATE POLICY "affiliate_payouts_admin_all" 
ON public.affiliate_payout_requests 
FOR ALL 
TO authenticated 
USING (
  store_id IN (
    SELECT sm.store_id FROM public.store_memberships sm 
    WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('platform_admin', 'master', 'admin')
  )
)
WITH CHECK (
  store_id IN (
    SELECT sm.store_id FROM public.store_memberships sm 
    WHERE sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('platform_admin', 'master', 'admin')
  )
);
