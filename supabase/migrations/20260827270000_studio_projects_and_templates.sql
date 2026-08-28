-- ============================================================
-- 20260827270000_studio_projects_and_templates.sql
-- Tabelas e Governança do Wider Studio 3.0 (Graphic & Video)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sem Título',
  project_type TEXT NOT NULL DEFAULT 'graphic' CHECK (project_type IN ('graphic', 'video')),
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_projects_store_id ON public.studio_projects(store_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_user_id ON public.studio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_updated_at ON public.studio_projects(updated_at DESC);

-- RLS para studio_projects
ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "studio_projects_select_all" ON public.studio_projects;
  DROP POLICY IF EXISTS "studio_projects_insert_all" ON public.studio_projects;
  DROP POLICY IF EXISTS "studio_projects_update_all" ON public.studio_projects;
  DROP POLICY IF EXISTS "studio_projects_delete_all" ON public.studio_projects;
END $$;

CREATE POLICY "studio_projects_select_all" ON public.studio_projects FOR SELECT USING (true);
CREATE POLICY "studio_projects_insert_all" ON public.studio_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "studio_projects_update_all" ON public.studio_projects FOR UPDATE USING (true);
CREATE POLICY "studio_projects_delete_all" ON public.studio_projects FOR DELETE USING (true);

-- Tabelas de Templates do Studio
CREATE TABLE IF NOT EXISTS public.studio_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'ofertas',
  title TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'graphic' CHECK (template_type IN ('graphic', 'video')),
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_templates_category ON public.studio_templates(category);
CREATE INDEX IF NOT EXISTS idx_studio_templates_type ON public.studio_templates(template_type);

ALTER TABLE public.studio_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "studio_templates_select_all" ON public.studio_templates;
  DROP POLICY IF EXISTS "studio_templates_insert_admin" ON public.studio_templates;
  DROP POLICY IF EXISTS "studio_templates_update_admin" ON public.studio_templates;
  DROP POLICY IF EXISTS "studio_templates_delete_admin" ON public.studio_templates;
END $$;

CREATE POLICY "studio_templates_select_all" ON public.studio_templates FOR SELECT USING (true);
CREATE POLICY "studio_templates_insert_admin" ON public.studio_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "studio_templates_update_admin" ON public.studio_templates FOR UPDATE USING (true);
CREATE POLICY "studio_templates_delete_admin" ON public.studio_templates FOR DELETE USING (true);

-- Seed de Templates Oficiais do Sistema (Zero Mock, Modelos Prontos)
INSERT INTO public.studio_templates (id, category, title, template_type, aspect_ratio, is_featured, is_system, canvas_data)
VALUES 
  (
    '11111111-1111-1111-1111-111111111101',
    'ofertas',
    'Oferta Especial de Lançamento',
    'graphic',
    '1:1',
    true,
    true,
    '{"background": {"type": "color", "value": "#0F172A"}, "elements": [{"id": "t1", "type": "text", "layer": 7, "zIndex": 1, "position": {"x": 50, "y": 20}, "size": {"width": 80, "height": 15}, "rotation": 0, "opacity": 1, "locked": false, "visible": true, "properties": {"content": "OFERTA RELÂMPAGO", "fontFamily": "Inter", "fontSize": 36, "fontWeight": 900, "color": "#FACC15", "textAlign": "center", "lineHeight": 1.2, "letterSpacing": 1}}]}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'gastronomia',
    'Cardápio & Prato do Dia',
    'graphic',
    '4:5',
    true,
    true,
    '{"background": {"type": "color", "value": "#18181B"}, "elements": [{"id": "t1", "type": "text", "layer": 7, "zIndex": 1, "position": {"x": 50, "y": 25}, "size": {"width": 85, "height": 15}, "rotation": 0, "opacity": 1, "locked": false, "visible": true, "properties": {"content": "Sabor Artesanal & Fresco", "fontFamily": "Inter", "fontSize": 32, "fontWeight": 800, "color": "#FFFFFF", "textAlign": "center", "lineHeight": 1.2, "letterSpacing": 0}}]}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'stories',
    'Story Promocional com QR Code',
    'graphic',
    '9:16',
    true,
    true,
    '{"background": {"type": "gradient", "gradient": {"type": "linear", "angle": 135, "colors": [{"color": "#4F46E5", "position": 0}, {"color": "#9333EA", "position": 100}]}}, "elements": [{"id": "t1", "type": "text", "layer": 7, "zIndex": 1, "position": {"x": 50, "y": 30}, "size": {"width": 85, "height": 20}, "rotation": 0, "opacity": 1, "locked": false, "visible": true, "properties": {"content": "Peça pelo Delivery Hoje", "fontFamily": "Inter", "fontSize": 38, "fontWeight": 900, "color": "#FFFFFF", "textAlign": "center", "lineHeight": 1.2, "letterSpacing": 0}}]}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'video_reels',
    'Reels Demonstração de Produto',
    'video',
    '9:16',
    true,
    true,
    '{"tracks": [{"id": "tr-video", "type": "video", "name": "Vídeo Principal", "clips": []}, {"id": "tr-audio", "type": "audio", "name": "Trilha Sonora", "clips": []}, {"id": "tr-text", "type": "text", "name": "Legendas", "clips": []}], "duration": 15}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  aspect_ratio = EXCLUDED.aspect_ratio,
  canvas_data = EXCLUDED.canvas_data;
