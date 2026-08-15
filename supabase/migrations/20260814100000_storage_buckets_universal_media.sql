-- Storage Buckets Universal Media & Video Support
-- Ensures all public buckets allow unrestricted image and video formats up to 100MB

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('post-media', 'post-media', true, 104857600, NULL),
  ('public_media', 'public_media', true, 104857600, NULL),
  ('product-media', 'product-media', true, 104857600, NULL),
  ('cms-media', 'cms-media', true, 104857600, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = NULL;

-- Ensure Public Read Access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for Post Media'
  ) THEN
    CREATE POLICY "Public Access for Post Media"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media'));
  END IF;
END $$;

-- Ensure Authenticated Upload Access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Uploads for Media Buckets'
  ) THEN
    CREATE POLICY "Authenticated Uploads for Media Buckets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media'));
  END IF;
END $$;

-- Ensure Authenticated Delete/Update Access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Modify for Media Buckets'
  ) THEN
    CREATE POLICY "Authenticated Modify for Media Buckets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id IN ('post-media', 'public_media', 'product-media', 'cms-media'));
  END IF;
END $$;
