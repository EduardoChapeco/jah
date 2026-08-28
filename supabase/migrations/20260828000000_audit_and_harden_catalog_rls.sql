-- ============================================================
-- Migration: Enforce RLS on Token Webhooks & Catalog Hardening
-- FASE 4: Auditoria de Segurança e Isolamento Multi-Tenant
-- ============================================================

-- 1. Habilitar RLS na tabela de Webhooks (Prevenir injeções via Anon Key)
ALTER TABLE public.token_recharge_webhooks_inbox ENABLE ROW LEVEL SECURITY;

-- Deny-by-default: Nenhum cliente pode inserir ou ler webhooks diretamente.
-- Apenas Server Functions operando em service_role podem inserir payloads.
DROP POLICY IF EXISTS "Deny all client operations on webhooks inbox" ON public.token_recharge_webhooks_inbox;
CREATE POLICY "Deny all client operations on webhooks inbox" 
  ON public.token_recharge_webhooks_inbox FOR ALL 
  USING (false);

-- 2. Restrições do Catálogo Público
-- Como o BFF utiliza getAnonServerClient() para leitura de catálogo,
-- e Jah opera um modelo SuperApp B2C, a política 'public_read' (status = 'published')
-- foi validada como intencional no momento. Nenhuma remoção de RLS do catálogo 
-- será feita aqui para não quebrar a performance do BFF, porém a superfície
-- mutável (webhooks) está agora selada contra Zero Trust.
