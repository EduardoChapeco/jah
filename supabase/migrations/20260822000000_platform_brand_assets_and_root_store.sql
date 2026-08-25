-- ============================================================================
-- Migration: 20260822000000_platform_brand_assets_and_root_store.sql
-- Description: Adiciona coluna is_platform_root na tabela stores, cria os buckets
--              brand-assets, banners e legal-documents no Supabase Storage e
--              atualiza as políticas RLS para upload e leitura universal.
-- ============================================================================

BEGIN;

-- 1. Coluna is_platform_root e is_active na tabela stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_platform_root BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_stores_is_platform_root ON public.stores(is_platform_root);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);

-- 2. Garantir que a Loja Raiz da Plataforma (Jah Matriz) existe e está marcada como platform_root
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Obtém ou cria a organização raiz
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'jah-org' OR id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
  
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (id, name, slug)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Jah Organization', 'jah-org')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_org_id;
  END IF;

  -- Marca loja existente com slug 'jah' ou 'jah-matriz' como platform_root
  IF EXISTS (SELECT 1 FROM public.stores WHERE slug IN ('jah-matriz', 'jah') OR id = '00000000-0000-0000-0000-000000000002') THEN
    UPDATE public.stores 
    SET is_platform_root = true, is_active = true 
    WHERE slug IN ('jah-matriz', 'jah') OR id = '00000000-0000-0000-0000-000000000002';
  ELSE
    INSERT INTO public.stores (id, organization_id, name, slug, is_platform_root, is_active, settings)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      v_org_id,
      'Jah Platform',
      'jah-matriz',
      true,
      true,
      '{"show_name": true, "show_logo": true, "description": "Hub Global Jah Community"}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      is_platform_root = true,
      name = COALESCE(public.stores.name, 'Jah Platform'),
      slug = COALESCE(public.stores.slug, 'jah-matriz');
  END IF;
END $$;

-- 3. Criação e Atualização de Todos os Buckets de Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('brand-assets', 'brand-assets', true, 20971520, NULL),
  ('banners', 'banners', true, 104857600, NULL),
  ('legal-documents', 'legal-documents', true, 20971520, NULL),
  ('post-media', 'post-media', true, 104857600, NULL),
  ('public_media', 'public_media', true, 104857600, NULL),
  ('product-media', 'product-media', true, 104857600, NULL),
  ('cms-media', 'cms-media', true, 104857600, NULL),
  ('classifieds', 'classifieds', true, 104857600, NULL),
  ('avatars', 'avatars', true, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = NULL;

-- 4. Atualização das Políticas RLS de storage.objects
DROP POLICY IF EXISTS "Universal Media Select Policy" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Insert Policy" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Update Policy" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Delete Policy" ON storage.objects;

-- Leitura pública para todos os buckets de mídia e identidade visual
CREATE POLICY "Universal Media Select Policy"
ON storage.objects FOR SELECT
USING (bucket_id IN (
  'brand-assets',
  'banners',
  'legal-documents',
  'post-media',
  'public_media',
  'product-media',
  'cms-media',
  'classifieds',
  'avatars'
));

-- Upload permitido para buckets públicos
CREATE POLICY "Universal Media Insert Policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN (
  'brand-assets',
  'banners',
  'legal-documents',
  'post-media',
  'public_media',
  'product-media',
  'cms-media',
  'classifieds',
  'avatars'
));

-- Atualização de objetos
CREATE POLICY "Universal Media Update Policy"
ON storage.objects FOR UPDATE
USING (bucket_id IN (
  'brand-assets',
  'banners',
  'legal-documents',
  'post-media',
  'public_media',
  'product-media',
  'cms-media',
  'classifieds',
  'avatars'
));

-- Exclusão de objetos
CREATE POLICY "Universal Media Delete Policy"
ON storage.objects FOR DELETE
USING (bucket_id IN (
  'brand-assets',
  'banners',
  'legal-documents',
  'post-media',
  'public_media',
  'product-media',
  'cms-media',
  'classifieds',
  'avatars'
));

COMMIT;
