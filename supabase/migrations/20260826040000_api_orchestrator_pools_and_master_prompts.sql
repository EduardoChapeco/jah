-- ============================================================
-- Migration: API Key Pools, Master Prompts & AI Usage Governance
-- Suporte a pools de chaves múltiplas, rotação com failover,
-- governança de Prompts Master e limites anti-abuso.
-- ============================================================

-- 1. Tabela de Pools de Chaves de APIs
CREATE TABLE IF NOT EXISTS public.api_key_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'firecrawl', 'steel', 'gemini', 'groq', 'openai', 'google_maps', 'resend', 'asaas'
  label TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  masked_key TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  daily_request_count INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance para busca rápida da próxima chave ativa da pool
CREATE INDEX IF NOT EXISTS idx_api_key_pools_provider_active 
  ON public.api_key_pools(provider, is_active, priority ASC);

-- 2. Tabela de Prompts Master da Plataforma
CREATE TABLE IF NOT EXISTS public.ai_master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  system_instruction TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  target_provider TEXT NOT NULL DEFAULT 'gemini', -- 'gemini', 'groq', 'openai'
  target_model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.2,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Limites e Governança de Uso de IA por Usuário/Loja
CREATE TABLE IF NOT EXISTS public.user_ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  feature TEXT NOT NULL DEFAULT 'product_importer', -- 'product_importer', 'copywriter', 'seo'
  daily_requests_used INT NOT NULL DEFAULT 0,
  daily_requests_limit INT NOT NULL DEFAULT 30, -- cota padrão de 30 importações/dia
  last_request_at TIMESTAMPTZ,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_ai_usage_profile_feature UNIQUE (profile_id, feature)
);

-- 4. Seed de Prompts Master Canônicos
INSERT INTO public.ai_master_prompts (
  slug,
  title,
  description,
  system_instruction,
  prompt_template,
  target_provider,
  target_model,
  temperature,
  is_default
) VALUES 
(
  'product_importer_default',
  'Importador de Produtos & Cardápios (Padrão)',
  'Extrai e refina dados brutos de páginas de produtos para o formato estruturado do catálogo Wider com alto padrão de copywriting.',
  'Você é um assistente sênior de catálogo e e-commerce de alto padrão. Sua missão é extrair dados brutos de páginas web e formatá-los de forma impecável, profissional e atraente. Ignore códigos de tracking, avisos de cookies ou scripts. Retorne estritamente um JSON válido seguindo a estrutura solicitada, sem textos adicionais.',
  'Analise o conteúdo bruto da página abaixo e extraia as informações do produto:\n\nURL: {{url}}\nTom de Escrita Solicitado: {{tone}}\nConteúdo Bruto:\n{{raw_content}}\n\nRetorne o JSON com:\n{\n  "title": "Título refinado do produto",\n  "subtitle": "Subtítulo de apoio ou slogan curto",\n  "description": "Descrição detalhada, persuasiva e formatada com quebras de linha",\n  "price_cents": 0,\n  "compare_at_cents": 0,\n  "brand": "Marca ou fabricante",\n  "category_suggestion": "Categoria sugerida",\n  "images": ["url1", "url2"],\n  "attributes": {"material": "...", "peso": "..."},\n  "variants": [{"name": "Padrão", "price_cents": 0, "sku": ""}]\n}',
  'gemini',
  'gemini-1.5-flash',
  0.2,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- 5. RLS Deny-by-Default com Acesso Estrito
ALTER TABLE public.api_key_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- Políticas de api_key_pools: Acesso EXCLUSIVO para platform_admin
CREATE POLICY "Platform admins can manage api key pools"
  ON public.api_key_pools FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master')
    )
  );

-- Políticas de ai_master_prompts: Leitura pública para autenticados, Gestão para platform_admin
CREATE POLICY "Authenticated users can read master prompts"
  ON public.ai_master_prompts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage master prompts"
  ON public.ai_master_prompts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('platform_admin', 'master')
    )
  );

-- Políticas de user_ai_usage_limits: Usuário pode ler seus limites, Backend e Admin podem atualizar
CREATE POLICY "Users can read their own ai limits"
  ON public.user_ai_usage_limits FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
