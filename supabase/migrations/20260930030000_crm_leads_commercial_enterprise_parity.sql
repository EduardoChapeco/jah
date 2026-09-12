-- ============================================================================
-- Jah / Wider — Migration 20260930030000: CRM Leads Commercial Enterprise Parity
-- ============================================================================
-- Alinha public.leads_crm com 100% da inteligência e campos de travelagencias:
-- 1. Campos ricos de passageiros/família (pax_list) e saúde/acessibilidade (pcd, TEA, mobilidade)
-- 2. Termo e aceite LGPD autônomo e rastreado
-- 3. Token Mágico para preenchimento autônomo pelo cliente via WhatsApp (/m/lead/:id)
-- 4. Tabela de Reuniões e Compromissos com link de Google Agenda (lead_meetings)
-- 5. Tabela de Histórico e Atividades (lead_activities)
-- 6. RPC pública segura para preenchimento de acompanhantes via magic link
-- ============================================================================

-- 1. Enriquecimento da tabela de leads_crm
ALTER TABLE public.leads_crm
  ADD COLUMN IF NOT EXISTS pax_list          JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pcd               BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reduced_mobility  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS autism            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS health_notes      TEXT,
  ADD COLUMN IF NOT EXISTS lgpd_accepted     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS staleness_status  TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS magic_token       UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS budget_cents      BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id         UUID,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT;

-- Índice para busca rápida por magic_token
CREATE INDEX IF NOT EXISTS idx_leads_crm_magic_token
  ON public.leads_crm(magic_token);

-- 2. Tabela de Reuniões e Compromissos do Lead (Google Calendar Sync)
CREATE TABLE IF NOT EXISTS public.lead_meetings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES public.leads_crm(id) ON DELETE CASCADE,
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  meeting_type     TEXT NOT NULL DEFAULT 'call', -- 'call', 'video', 'in_person'
  invite_sent      BOOLEAN NOT NULL DEFAULT false,
  google_event_id  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_meetings_staff_all" ON public.lead_meetings;
CREATE POLICY "lead_meetings_staff_all"
  ON public.lead_meetings FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'support')
    )
  );

-- 3. Tabela de Histórico e Atividades do Lead (Timeline)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES public.leads_crm(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type        TEXT NOT NULL, -- 'note', 'call', 'email', 'status_change', 'proposal_sent', 'meeting', 'magic_link', 'converted'
  content     TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_activities_staff_all" ON public.lead_activities;
CREATE POLICY "lead_activities_staff_all"
  ON public.lead_activities FOR ALL
  USING (
    store_id IN (
      SELECT store_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'seller', 'support')
    )
  );

-- 4. RPC Pública Segura para carregar o Lead no Magic Link (/m/lead/:id)
CREATE OR REPLACE FUNCTION public.get_public_lead_by_token(_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead RECORD;
  _store RECORD;
BEGIN
  SELECT * INTO _lead
  FROM public.leads_crm
  WHERE magic_token = _token OR id = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT name, logo_url INTO _store
  FROM public.stores
  WHERE id = _lead.store_id;

  RETURN jsonb_build_object(
    'id', _lead.id,
    'full_name', _lead.full_name,
    'destination', _lead.destination,
    'email', _lead.email,
    'phone', _lead.phone,
    'travel_start', _lead.travel_start,
    'travel_end', _lead.travel_end,
    'pax_count', _lead.pax_count,
    'pax_adults', _lead.pax_adults,
    'pax_children', _lead.pax_children,
    'pax_infants', _lead.pax_infants,
    'pax_list', _lead.pax_list,
    'interest_type', _lead.interest_type,
    'interest_period', _lead.interest_period,
    'notes', _lead.notes,
    'lgpd_accepted', _lead.lgpd_accepted,
    'lgpd_accepted_at', _lead.lgpd_accepted_at,
    'pcd', _lead.pcd,
    'reduced_mobility', _lead.reduced_mobility,
    'autism', _lead.autism,
    'health_notes', _lead.health_notes,
    'store_name', COALESCE(_store.name, 'Agência de Viagens'),
    'store_logo', _store.logo_url
  );
END;
$$;

-- 5. RPC Pública Segura para salvar os dados autônomos enviados pelo cliente
CREATE OR REPLACE FUNCTION public.submit_public_lead_passengers(
  _token UUID,
  _pax_list JSONB,
  _lgpd_accepted BOOLEAN,
  _health_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lead_id UUID;
  _store_id UUID;
  _lead_name TEXT;
BEGIN
  SELECT id, store_id, full_name INTO _lead_id, _store_id, _lead_name
  FROM public.leads_crm
  WHERE magic_token = _token OR id = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Link de formulário inválido ou expirado.';
  END IF;

  UPDATE public.leads_crm
  SET
    pax_list = COALESCE(_pax_list, pax_list),
    lgpd_accepted = _lgpd_accepted,
    lgpd_accepted_at = CASE WHEN _lgpd_accepted THEN now() ELSE lgpd_accepted_at END,
    health_notes = COALESCE(_health_notes, health_notes),
    updated_at = now(),
    last_contacted_at = now()
  WHERE id = _lead_id;

  -- Registra na timeline do lead
  INSERT INTO public.lead_activities (
    lead_id,
    store_id,
    type,
    content,
    metadata
  ) VALUES (
    _lead_id,
    _store_id,
    'magic_link',
    'Cliente preencheu formulário de acompanhantes e aceitou termos LGPD via Magic Link autônomo.',
    jsonb_build_object(
      'pax_count', jsonb_array_length(COALESCE(_pax_list, '[]'::jsonb)),
      'lgpd_accepted', _lgpd_accepted,
      'submitted_at', now()
    )
  );

  RETURN jsonb_build_object('success', true, 'lead_id', _lead_id);
END;
$$;

-- 6. Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
