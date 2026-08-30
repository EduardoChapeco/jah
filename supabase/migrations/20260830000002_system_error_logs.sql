-- ============================================================================
-- JAH -- Migration: System Error Logs
-- ============================================================================
-- Registra falhas silenciosas detectadas pelo server-fn-wrapper.ts
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route          TEXT NOT NULL,
  error_message  TEXT NOT NULL,
  stack_trace    TEXT,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload        JSONB,
  severity       TEXT DEFAULT 'error',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

-- Apenas o Platform Admin (owner do org mestre) pode ler
CREATE POLICY "system_error_logs_admin_read"
  ON public.system_error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

-- O servidor insere sem RLS via service_role. Opcionalmente, libera insert publico se quiser logar coisas não autenticadas
CREATE POLICY "system_error_logs_insert"
  ON public.system_error_logs FOR INSERT
  WITH CHECK (true);

COMMIT;
