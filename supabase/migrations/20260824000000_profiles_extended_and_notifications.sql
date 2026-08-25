-- 20260824000000_profiles_extended_and_notifications.sql
-- Adiciona colunas faltantes em profiles e cria tabela de notificacoes

-- 1. Colunas de perfil estendido
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS biolinks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resume_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS featured_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_banner_link TEXT,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS profile_mode TEXT DEFAULT 'social';

-- 2. Indice unico de username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles(username)
  WHERE username IS NOT NULL;

-- 3. Tabela de notificacoes
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  avatar_url TEXT,
  author_name TEXT,
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_self_read" ON public.notifications;
CREATE POLICY "notifications_self_read"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_service_insert" ON public.notifications;
CREATE POLICY "notifications_service_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
