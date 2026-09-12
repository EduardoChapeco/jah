-- Migration rápida: campos essenciais para eventos externos
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_external_ticket boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_ticket_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_phone text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS age_rating text DEFAULT 'livre';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS featured_until timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date timestamptz;

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_event_date_status ON public.events(event_date, status);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_state ON public.events(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_category_date ON public.events(category, event_date, status);

-- Posts: campos de SEO, agendamento e vinculação geográfica
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS publish_as_handle text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS paid_partner_handle text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS paid_partner_label text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS collaborators jsonb DEFAULT '[]';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_scheduled boolean NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
