-- ============================================================================
-- Migration: Classifieds Niches Expansion, Store Binding & Company MVP
-- Timestamp: 20260909150000
-- Standards: BigTech Executive Board, Apple HIG, Zero-Trust RLS
-- ============================================================================

BEGIN;

-- 1. Vincular classifieds a lojas (store_id) para viabilizar o catálogo da empresa
ALTER TABLE public.classifieds
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classifieds_store_id ON public.classifieds (store_id);

-- 2. Expandir enum/check constraint de categoria para acomodar 'travel' e 'equipment'
ALTER TABLE public.classifieds
  DROP CONSTRAINT IF EXISTS classifieds_category_check;

ALTER TABLE public.classifieds
  ADD CONSTRAINT classifieds_category_check
    CHECK (category IN (
      'job',
      'job_offer',
      'sale',
      'trade',
      'service',
      'real_estate',
      'vehicle',
      'event',
      'donation',
      'travel',        -- Pacotes turísticos, roteiros, resorts (Modo Instagram)
      'equipment'      -- Aluguel de equipamentos (eventos, som, luz, maquinário)
    ));

-- 3. Tabela de Lista de Espera do Portal Completo / Workspace Pro
CREATE TABLE IF NOT EXISTS public.workspace_pro_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  whatsapp TEXT,
  modules_of_interest TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'migrated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_waitlist_store ON public.workspace_pro_waitlist (store_id);
CREATE INDEX IF NOT EXISTS idx_workspace_waitlist_status ON public.workspace_pro_waitlist (status);

-- 4. Tabela de Configurações da Landing Page Portal Completo
CREATE TABLE IF NOT EXISTS public.portal_completo_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hero_title TEXT NOT NULL DEFAULT 'Evolua sua Gestão com o Wider OS Pro',
  hero_subtitle TEXT NOT NULL DEFAULT 'Módulos avançados de PDV, Estoque, Logística, Turismo e Relatórios desenhados para o seu crescimento.',
  video_url TEXT,
  feature_modules JSONB NOT NULL DEFAULT '[
    {"id": "pdv", "title": "PDV & Comandas Ágeis", "desc": "Operação de balcão, mesas, pedidos rápidos e integração fiscal.", "icon": "Receipt"},
    {"id": "estoque", "title": "Controle de Estoque & Grade", "desc": "Gestão de variações, estoque mínimo, alertas automáticos e insumos.", "icon": "Package"},
    {"id": "logistica", "title": "Logística & Frota MotoLink", "desc": "Roteirização inteligente, despacho em tempo real e tracking de entregadores.", "icon": "Truck"},
    {"id": "turismo", "title": "Operação Turística Completa", "desc": "Kanban de embarque, gestão de passageiros, quartos e emissão de vouchers.", "icon": "Plane"},
    {"id": "financeiro", "title": "Gestão Financeira & Split", "desc": "Contas a pagar/receber, conciliação Pix e split de pagamentos automático.", "icon": "Wallet"},
    {"id": "equipe", "title": "Gestão de Equipe & Permissões", "desc": "RBAC granular por colaborador, pontos de atendimento e auditoria de ações.", "icon": "Users"}
  ]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir registro padrão caso não exista
INSERT INTO public.portal_completo_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 5. Configurar RLS
ALTER TABLE public.workspace_pro_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_completo_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública para Configurações do Portal
DROP POLICY IF EXISTS "portal_settings_public_read" ON public.portal_completo_settings;
CREATE POLICY "portal_settings_public_read" ON public.portal_completo_settings
  FOR SELECT USING (true);

-- Políticas de Atualização para Admins no Portal Settings
DROP POLICY IF EXISTS "portal_settings_admin_write" ON public.portal_completo_settings;
CREATE POLICY "portal_settings_admin_write" ON public.portal_completo_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master', 'system_admin')
    )
  );

-- Políticas para Waitlist: Usuário autenticado pode inserir seu interesse
DROP POLICY IF EXISTS "waitlist_insert_authenticated" ON public.workspace_pro_waitlist;
CREATE POLICY "waitlist_insert_authenticated" ON public.workspace_pro_waitlist
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Visualização de Waitlist: Proprietário da loja ou Administrador Master
DROP POLICY IF EXISTS "waitlist_select_owner_or_admin" ON public.workspace_pro_waitlist;
CREATE POLICY "waitlist_select_owner_or_admin" ON public.workspace_pro_waitlist
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'master', 'system_admin')
    )
  );

COMMIT;
