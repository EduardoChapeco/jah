-- ============================================================================
-- Migration: 20260819120000_storage_and_media_rls_hardening.sql
-- Description: Endurecimento de Storage, Buckets Públicos e Políticas RLS de Mídia/Classificados/Posts
-- ============================================================================

BEGIN;

-- 1. Criação e atualização de todos os Buckets Públicos de Mídia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('post-media', 'post-media', true, 104857600, NULL),
  ('public_media', 'public_media', true, 104857600, NULL),
  ('product-media', 'product-media', true, 104857600, NULL),
  ('cms-media', 'cms-media', true, 104857600, NULL),
  ('classifieds', 'classifieds', true, 104857600, NULL),
  ('avatars', 'avatars', true, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = NULL;

-- 2. Políticas RLS para storage.objects
DROP POLICY IF EXISTS "Public Access for All Media Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Post Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads for Media Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Modify for Media Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Select Policy" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Insert Policy" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Update Policy" ON storage.objects;
DROP POLICY IF EXISTS "Universal Media Delete Policy" ON storage.objects;

-- Leitura Pública irrestrita para buckets de mídia pública
CREATE POLICY "Universal Media Select Policy"
ON storage.objects FOR SELECT
USING (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media', 'classifieds', 'avatars'));

-- Upload permitido para autenticados e anônimos (com validação de bucket público)
CREATE POLICY "Universal Media Insert Policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media', 'classifieds', 'avatars'));

-- Modificação permitida para usuários autenticados
CREATE POLICY "Universal Media Update Policy"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media', 'classifieds', 'avatars'));

-- Exclusão de objetos
CREATE POLICY "Universal Media Delete Policy"
ON storage.objects FOR DELETE
USING (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media', 'classifieds', 'avatars'));

-- 3. RLS de Classificados (Garantir leitura pública de ativos e criação de rascunhos)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classifieds') THEN
    DROP POLICY IF EXISTS "classifieds_public_select" ON public.classifieds;
    DROP POLICY IF EXISTS "classifieds_auth_all" ON public.classifieds;

    CREATE POLICY "classifieds_public_select"
      ON public.classifieds FOR SELECT
      USING (status IN ('active', 'published', 'featured') OR auth.uid() IS NOT NULL);

    CREATE POLICY "classifieds_auth_all"
      ON public.classifieds FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. RLS de Posts e Mídias Sociais (Garantir leitura pública de posts e criação para usuários)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
    DROP POLICY IF EXISTS "posts_auth_all" ON public.posts;

    CREATE POLICY "posts_public_read"
      ON public.posts FOR SELECT
      USING (true);

    CREATE POLICY "posts_auth_all"
      ON public.posts FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

COMMIT;
