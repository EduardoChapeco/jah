-- ========================================================================================
-- FASE 1: POPULAÇÕES SINTÉTICAS (ENGENHARIA REVERSA AARU AI), SIMLAB V2 E SQUADS DE POSTS
-- ========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Arquétipos Demográficos da População Sintética (Calibrados pelo IBGE e ABEP)
CREATE TABLE IF NOT EXISTS public.synthetic_population_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- Ex: 'BR_F_32_CLASSE_C_MAE', 'BR_M_55_CLASSE_A_DIRETOR'
  display_name TEXT NOT NULL,
  gender TEXT NOT NULL, -- 'feminino', 'masculino', 'nao_binario'
  age INT NOT NULL DEFAULT 35,
  age_range_label TEXT NOT NULL DEFAULT '25-34 anos',
  abep_social_class TEXT NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D_E'
  region TEXT NOT NULL, -- 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'
  location_type TEXT NOT NULL DEFAULT 'metropolitana', -- 'capital_metropole', 'interior_polo', 'rural'
  median_income_brl NUMERIC(10, 2) NOT NULL,
  education_level TEXT NOT NULL,
  cynicism_index NUMERIC(3, 1) NOT NULL DEFAULT 5.0, -- De 0.0 a 10.0 (ceticismo com promessas de anúncios)
  price_sensitivity NUMERIC(3, 1) NOT NULL DEFAULT 5.0, -- De 0.0 a 10.0
  impulsivity_index NUMERIC(3, 1) NOT NULL DEFAULT 5.0, -- De 0.0 a 10.0
  primary_social_networks TEXT[] NOT NULL DEFAULT '{"Instagram", "WhatsApp"}',
  decision_heuristics JSONB NOT NULL DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pop_archetypes_class ON public.synthetic_population_archetypes(abep_social_class, region);

-- 2. Memória Episódica das Personas (Histórico Sintético de Vida e Hábitos de Consumo)
CREATE TABLE IF NOT EXISTS public.synthetic_agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_id UUID NOT NULL REFERENCES public.synthetic_population_archetypes(id) ON DELETE CASCADE,
  memory_category TEXT NOT NULL, -- 'bad_purchase_experience', 'loyalty_trigger', 'financial_trauma'
  narrative TEXT NOT NULL,
  emotional_valence NUMERIC(3, 2) NOT NULL DEFAULT 0.0, -- De -1.0 a +1.0
  impact_on_buying_decision TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_archetype ON public.synthetic_agent_memories(archetype_id);

-- 3. Experimentos de Pesquisa e Simulação (SimLab Runs)
CREATE TABLE IF NOT EXISTS public.simlab_market_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL, -- 'test_price_elasticity', 'validate_ad_copy', 'launch_new_product', 'rebrand_store'
  stimulus_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Imagens, headlines, preço testado, garantia
  target_audience_filters JSONB NOT NULL DEFAULT '{"social_classes": ["B2", "C1", "C2"], "regions": ["Sudeste", "Sul"], "age_min": 25, "age_max": 55}'::jsonb,
  sample_size INT NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'simulating', 'synthesizing', 'completed', 'failed'
  confidence_level NUMERIC(4, 2) NOT NULL DEFAULT 0.95,
  margin_of_error NUMERIC(4, 2) NOT NULL DEFAULT 0.05,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_experiments_store ON public.simlab_market_experiments(store_id, status);

-- 4. Respostas Individuais das Personas Simuladas (Microdados do Experimento)
CREATE TABLE IF NOT EXISTS public.simlab_persona_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.simlab_market_experiments(id) ON DELETE CASCADE,
  archetype_id UUID NOT NULL REFERENCES public.synthetic_population_archetypes(id) ON DELETE CASCADE,
  interest_score INT NOT NULL, -- De 0 a 10
  purchase_intent_percent INT NOT NULL, -- De 0 a 100%
  primary_hook_detected TEXT,
  primary_barrier_objection TEXT NOT NULL,
  verbatim_reaction TEXT NOT NULL, -- A fala exata da persona em primeira pessoa
  system_1_emotion TEXT NOT NULL, -- 'desejo', 'desconfiança', 'tédio', 'entusiasmo', 'insegurança'
  price_perception TEXT NOT NULL, -- 'muito_barato_duvidoso', 'justo', 'caro_mas_vale', 'inacessivel'
  simulated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_experiment ON public.simlab_persona_responses(experiment_id);

-- 5. Síntese Estatística e Parecer Científico de Confrontação (Anti-Hallucination)
CREATE TABLE IF NOT EXISTS public.simlab_statistical_synthesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.simlab_market_experiments(id) ON DELETE CASCADE UNIQUE,
  synthetic_nps INT NOT NULL, -- Net Promoter Score sintético (-100 a +100)
  overall_approval_rate NUMERIC(5, 2) NOT NULL, -- Ex: 74.50%
  estimated_conversion_range NUMERIC[] NOT NULL DEFAULT '{2.1, 4.8}', -- Min e Max esperado
  price_elasticity_score NUMERIC(4, 2), -- Coeficiente de sensibilidade
  top_3_buying_triggers TEXT[] NOT NULL DEFAULT '{}',
  top_3_friction_barriers TEXT[] NOT NULL DEFAULT '{}',
  scientific_verdict TEXT NOT NULL, -- Parecer do comitê acadêmico
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  synthesized_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Focus Group Virtual em Tempo Real (Salas de Chat Interativo)
CREATE TABLE IF NOT EXISTS public.simlab_focus_group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  session_title TEXT NOT NULL,
  selected_persona_ids UUID[] NOT NULL DEFAULT '{}', -- Personas na sala
  moderator_goal TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.simlab_focus_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.simlab_focus_group_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'moderator_user', 'synthetic_persona', 'squad_scientist'
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar_url TEXT,
  content TEXT NOT NULL,
  sentiment_score NUMERIC(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_messages_session ON public.simlab_focus_group_messages(session_id, created_at);

-- 7. Pipeline Multi-Agente de Conteúdo (Aria -> Bruno -> Carla -> Diego)
CREATE TABLE IF NOT EXISTS public.squad_generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'carousel', -- 'single', 'carousel', 'story_reels'
  slides_count INT NOT NULL DEFAULT 5,
  strategy_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Gerado por Aria
  copy_data JSONB NOT NULL DEFAULT '{}'::jsonb,     -- Gerado por Bruno
  rendered_slides_html TEXT[] NOT NULL DEFAULT '{}', -- Gerado por Carla (HTML5 1080x1080)
  exported_image_urls TEXT[] NOT NULL DEFAULT '{}', -- Imagens PNG/WebP finais no Storage
  caption TEXT NOT NULL,
  hashtags TEXT NOT NULL,
  target_sin_trigger TEXT, -- Pecado capital calibrado (Ganância, Orgulho, Gula...)
  simlab_validation_score INT, -- Nota validada no SimLab
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_store ON public.squad_generated_posts(store_id, status);

-- HABILITAR ROW LEVEL SECURITY EM TODAS AS TABELAS
ALTER TABLE public.synthetic_population_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_market_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_persona_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_statistical_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_focus_group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_focus_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_generated_posts ENABLE ROW LEVEL SECURITY;

-- POLICIES MULTI-TENANT E DE LEITURA
DROP POLICY IF EXISTS "public_read_synthetic_archetypes" ON public.synthetic_population_archetypes;
CREATE POLICY "public_read_synthetic_archetypes" ON public.synthetic_population_archetypes FOR ALL USING (true);

DROP POLICY IF EXISTS "public_read_synthetic_memories" ON public.synthetic_agent_memories;
CREATE POLICY "public_read_synthetic_memories" ON public.synthetic_agent_memories FOR ALL USING (true);

DROP POLICY IF EXISTS "store_access_simlab_experiments" ON public.simlab_market_experiments;
CREATE POLICY "store_access_simlab_experiments" ON public.simlab_market_experiments FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "store_access_simlab_responses" ON public.simlab_persona_responses;
CREATE POLICY "store_access_simlab_responses" ON public.simlab_persona_responses FOR ALL USING (true);

DROP POLICY IF EXISTS "store_access_simlab_synthesis" ON public.simlab_statistical_synthesis;
CREATE POLICY "store_access_simlab_synthesis" ON public.simlab_statistical_synthesis FOR ALL USING (true);

DROP POLICY IF EXISTS "store_access_focus_sessions" ON public.simlab_focus_group_sessions;
CREATE POLICY "store_access_focus_sessions" ON public.simlab_focus_group_sessions FOR ALL USING (store_id IS NOT NULL);

DROP POLICY IF EXISTS "store_access_focus_messages" ON public.simlab_focus_group_messages;
CREATE POLICY "store_access_focus_messages" ON public.simlab_focus_group_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "store_access_squad_posts" ON public.squad_generated_posts;
CREATE POLICY "store_access_squad_posts" ON public.squad_generated_posts FOR ALL USING (store_id IS NOT NULL);
