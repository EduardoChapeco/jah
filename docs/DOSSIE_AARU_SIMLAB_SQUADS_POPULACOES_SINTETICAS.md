# ==============================================================================
# DOSSIÊ DE ENGENHARIA REVERSA DEEP-TECH: AARU AI, SIMULAÇÃO DE POPULAÇÕES SINTÉTICAS,
# SQUADS DE POSTS V4, PROTOCOLO MCP E FRAMEWORKS DEMOGRÁFICOS IBGE / NIELSEN
# PROTOCOLO DE CONSELHO MULTI-AGENTE (STAFF / PRINCIPAL ARCHITECT LEVEL)
# ==============================================================================

**Data de Emissão:** Setembro de 2026  
**Status:** Documento Canônico de Arquitetura de Inteligência Artificial e Pesquisa Preditiva de Mercado  
**Alvos Principais:** 
- Engenharia Reversa da Aaru AI (Plataforma avaliada em US$ 1 Bilhão que redefiniu a pesquisa de mercado corporativa)
- Modelagem Baseada em Agentes (Agent-Based Modeling) com Populações Sintéticas calibradas por microdados do IBGE e Nielsen
- Orquestração de Squads Agênticos de Criação Completa de Conteúdo (Pipeline Aria -> Bruno -> Carla com design HTML5 e exportação visual)
- Integração como Servidor MCP (Model Context Protocol) leve, seguro e desacoplado de infraestrutura
- Focus Group Virtual em Tempo Real (Chat interativo com consumidores sintéticos antes de investir em tráfego ou lançar produtos)
- Conselho Científico de Confrontação Estatística (Revisão econométrica de projeções para eliminar alucinações)

---

## 1. SUMÁRIO EXECUTIVO & ENGENHARIA REVERSA DA AARU AI

A **Aaru AI** emergiu como a startup pioneira em pesquisa sintética em escala global, alcançando uma avaliação de mercado de US$ 1 bilhão após comprovar em projetos com multinacionais (como EY e Accenture) que simulações comportamentais com agentes de IA atingem até **90% de correlação estatística** com pesquisas tradicionais de campo e grupos focais reais, a uma fração do custo e em questão de segundos.

### 1.1. Onde as IAs Convencionais Falham e Onde a Aaru Inovou
* **O Erro Tradicional (Chatbot Genérico):** Perguntar ao ChatGPT ou Claude * O que uma mãe de classe média acha deste produto?* resulta em uma resposta homogeneizada e otimista, afetada por viés de cortesia (*sycophancy*) e sem qualquer ancoragem em renda real, aversão ao risco ou momento de vida.
* **O Paradigma da Aaru (População Sintética Calibrada):** Em vez de consultar um único modelo de linguagem, a Aaru instancia uma **população heterogênea de milhares de agentes autônomos**. Cada agente recebe:
  1. **Microdados Demográficos Oficiais:** Idade, gênero, localidade (capital vs interior), renda domiciliar per capita, escolaridade e composição familiar extraídos de censos nacionais (como o Censo 2022 do IBGE e PNAD Contínua no Brasil).
  2. **Calibração Psicográfica & Heurísticas de Decisão:** Nível de cinismo publicitário, impulsividade, aversão à perda (Kahneman & Tversky), traços de personalidade Big Five (OCEAN) e restrições orçamentárias severas.
  3. **Memória de Categoria & Hábitos Digitais:** Onde a pessoa pesquisa, marcas nas quais já teve experiências traumáticas no passado e meios de pagamento habituais.

O ecossistema **Waesy** incorpora nesta arquitetura a tecnologia proprietária desenvolvida no **SimLab V2** (localizado em simwork e rand-builder-ai), expandindo-a para se tornar uma suíte preditiva superior à própria Aaru, totalmente integrada à operação diária do comércio, da indústria e dos prestadores de serviços brasileiros.

---

## 2. METODOLOGIA E FRAMEWORKS DEMOGRÁFICOS: IBGE, NIELSEN & CRITÉRIO BRASIL

Para garantir validade estatística real e afastar respostas genéricas, o sistema ancora sua amostragem sintética em padrões consolidados de pesquisa sociológica e de mercado:

### 2.1. O Critério Brasil (ABEP) & Estratificação Socioeconômica
O motor distribui as personas com base na estratificação oficial de classes econômicas do Brasil:

| Classe Econômica | Renda Média Domiciliar | Comportamento de Consumo Dominante | Sensibilidade a Preço | Adoção de Meios de Pagamento |
| :--- | :--- | :--- | :--- | :--- |
| **Classe A1 / A2** | Acima de R$ 22.000 | Foco absoluto em status, conveniência premium, estética e tempo poupado. Pouco afetado por inflação. | Muito Baixa (1 a 3/10) | Cartão Black/Infinite com pontos, débito automático. |
| **Classe B1 / B2** | R$ 6.000 a R$ 22.000 | Foco em ascensão social, custo-benefício inteligente e marcas de prestígio acessíveis. Exigência por garantias. | Média (5 a 7/10) | Cartão de crédito parcelado sem juros, Pix com desconto. |
| **Classe C1 / C2** | R$ 2.500 a R$ 6.000 | O coração do consumo brasileiro. Decisão baseada no valor da parcela que cabe no bolso mensal. | Alta (8 a 9/10) | Crediário de loja, carnês, Pix parcelado e cartão com limite compartilhado. |
| **Classe D / E** | Até R$ 2.500 | Consumo estritamente de subsistência e necessidades imediatas. Busca pelo menor preço absoluto. | Extrema (10/10) | Dinheiro vivo, Pix instantâneo e auxílios governamentais. |

### 2.2. O Modelo Cognitivo dos Agentes Sintéticos (Sistema 1 vs Sistema 2)
Cada agente no SimLab V2 opera com dois módulos cognitivos baseados na psicologia econômica:
1. **Módulo Intuitivo / Emocional (Sistema 1):**
   - Resposta imediata nos primeiros 3 segundos de contato com a imagem do produto, oferta ou banner.
   - Ativado pelo **Canvas dos 7 Pecados Capitais** (Orgulho, Ganância, Luxúria, Inveja, Gula, Ira, Preguiça).
   - Reações viscerais: desejo instantâneo, desconfiança imediata ou indiferença.
2. **Módulo Reflexivo / Racional (Sistema 2):**
   - Avaliação crítica do orçamento restante no mês (cashflow_constraint).
   - Cálculo do custo de frete e tempo de entrega.
   - Busca por prova social: leitura de depoimentos, selo do Reclame Aqui e avaliações de outros clientes.

---

## 3. ARQUITETURA DE DADOS NO POSTGRESQL (DDL DEEP-TECH COM RLS)

Abaixo está o DDL em PostgreSQL com isolamento multi-tenant por store_id e políticas de segurança RLS:

`sql
-- ============================================================================
-- DDL DEEP-TECH: POPULAÇÕES SINTÉTICAS, SIMLAB PREDITIVO E SQUADS DE CONTEÚDO
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS  uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Arquétipos Demográficos da População Sintética (Calibrados pelo IBGE)
CREATE TABLE IF NOT EXISTS public.synthetic_population_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- Ex: 'BR_F_32_CLASSE_C_MAE', 'BR_M_55_CLASSE_A_DIRETOR'
  display_name TEXT NOT NULL,
  gender TEXT NOT NULL, -- 'feminino', 'masculino', 'nao_binario'
  age_range INT4RANGE NOT NULL, -- Ex: '[25, 35)'
  abep_social_class TEXT NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D_E'
  region TEXT NOT NULL, -- 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'
  location_type TEXT NOT NULL DEFAULT 'metropolitana', -- 'capital_metropole', 'interior_polo', 'rural'
  median_income_brl NUMERIC(10, 2) NOT NULL,
  education_level TEXT NOT NULL,
  cynicism_index NUMERIC(3, 1) NOT NULL DEFAULT 5.0, -- De 0.0 a 10.0 (ceticismo com promessas de anúncios)
  price_sensitivity NUMERIC(3, 1) NOT NULL DEFAULT 5.0, -- De 0.0 a 10.0
  impulsivity_index NUMERIC(3, 1) NOT NULL DEFAULT 5.0, -- De 0.0 a 10.0
  primary_social_networks TEXT[] NOT NULL DEFAULT '{\Instagram\, \WhatsApp\}',
  decision_heuristics JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pop_archetypes_class ON public.synthetic_population_archetypes(abep_social_class, region);

-- 2. Memória Episódica das Personas (Histórico Sintético de Vida)
CREATE TABLE IF NOT EXISTS public.synthetic_agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_id UUID NOT NULL REFERENCES public.synthetic_population_archetypes(id) ON DELETE CASCADE,
  memory_category TEXT NOT NULL, -- 'bad_purchase_experience', 'loyalty_trigger', 'financial_trauma'
  narrative TEXT NOT NULL,
  emotional_valence NUMERIC(3, 2) NOT NULL DEFAULT 0.0, -- De -1.0 a +1.0
  impact_on_buying_decision TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Experimentos de Pesquisa e Simulação (SimLab Runs)
CREATE TABLE IF NOT EXISTS public.simlab_market_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective TEXT NOT NULL, -- 'test_price_elasticity', 'validate_ad_copy', 'launch_new_product', 'rebrand_store'
  stimulus_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Imagens, headlines, preço testado, garantia
  target_audience_filters JSONB NOT NULL DEFAULT '{
    \social_classes\: [\B2\, \C1\, \C2\],
    \regions\: [\Sudeste\, \Sul\],
    \age_min\: 25,
    \age_max\: 55
  }'::jsonb,
  sample_size INT NOT NULL DEFAULT 50, -- Quantidade de agentes simulados (amostra estatística)
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'simulating', 'synthesizing', 'completed', 'failed'
  confidence_level NUMERIC(4, 2) NOT NULL DEFAULT 0.95, -- 95% de intervalo de confiança
  margin_of_error NUMERIC(4, 2) NOT NULL DEFAULT 0.05,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
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
  simulated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_responses_experiment ON public.simlab_persona_responses(experiment_id);

-- 5. Síntese Estatística e Parecer Científico de Confrontação
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
  synthesized_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Focus Group Virtual em Tempo Real (Salas de Chat Interativo)
CREATE TABLE IF NOT EXISTS public.simlab_focus_group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_title TEXT NOT NULL,
  selected_persona_ids UUID[] NOT NULL DEFAULT '{}', -- As 3 a 5 personas presentes na sala
  moderator_goal TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_focus_messages_session ON public.simlab_focus_group_messages(session_id, created_at);

-- 7. Pipeline Multi-Agente de Conteúdo (Aria -> Bruno -> Carla)
CREATE TABLE IF NOT EXISTS public.squad_generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
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
  target_sin_trigger TEXT, -- Pecado capital calibrado
  simlab_validation_score INT, -- Nota validada no SimLab
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_posts_store ON public.squad_generated_posts(store_id, status);

-- Habilitação de RLS
ALTER TABLE public.synthetic_population_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthetic_agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_market_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_persona_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_statistical_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_focus_group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simlab_focus_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_generated_posts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY Leitura de arquétipos demográficos do sistema
  ON public.synthetic_population_archetypes FOR SELECT USING (true);

CREATE POLICY Leitura de memórias episódicas do sistema
  ON public.synthetic_agent_memories FOR SELECT USING (true);

CREATE POLICY Lojista gerencia seus experimentos no SimLab
  ON public.simlab_market_experiments FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista acessa respostas dos seus experimentos
  ON public.simlab_persona_responses FOR SELECT
  USING (experiment_id IN (SELECT id FROM public.simlab_market_experiments WHERE store_id = (auth.jwt() ->> 'store_id')::uuid));

CREATE POLICY Lojista acessa sintese dos seus experimentos
  ON public.simlab_statistical_synthesis FOR SELECT
  USING (experiment_id IN (SELECT id FROM public.simlab_market_experiments WHERE store_id = (auth.jwt() ->> 'store_id')::uuid));

CREATE POLICY Lojista gerencia sessoes de focus group
  ON public.simlab_focus_group_sessions FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista gerencia mensagens do focus group
  ON public.simlab_focus_group_messages FOR ALL
  USING (session_id IN (SELECT id FROM public.simlab_focus_group_sessions WHERE store_id = (auth.jwt() ->> 'store_id')::uuid));

CREATE POLICY Lojista gerencia posts gerados por seus squads
  ON public.squad_generated_posts FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);
`
---

## 4. O PIPELINE MULTI-AGENTE DE CRIAÇÃO COMPLETA DE POSTS & CAMPANHAS

O sistema incorpora o pipeline de ponta a ponta identificado em simwork/supabase/functions/orchestrate-post e o eleva a padrão de agência internacional:

### 4.1. Os 4 Estágios do Pipeline de Conteúdo
`	ext
[Briefing do Lojista ou Oferta do Cardápio]
       │
       ▼
[Agente Aria - Estrategista] ──► Define Formato (Carrossel/Single), Slides (3 a 7), Template e Arco Narrativo
       │
       ▼
[Agente Bruno - Copywriter PhD] ──► Redige Headlines de Impacto, Textos dos Slides, CTA, Legenda e Hashtags
       │
       ▼
[Agente Carla - Designer HTML5] ──► Compila Slides em HTML5 1080x1080 Autocontido com CSS e Google Fonts
       │
       ▼
[Agente Diego - Auditor & Fact-Checker] ──► Audita Contraste WCAG, Legibilidade, Prova Social e Ortografia
       │
       ▼
[Renderizador Headless WebP] ──► Gera Imagens Reais no Supabase Storage e Agenda no Calendário da Loja
`

### 4.2. Especificação do Agente Carla (Engenharia de Slides em HTML5)
Cada slide é renderizado como um documento HTML5 visualmente rico sem necessidade de Canva externo:
* **Dimensões Padronizadas:** 1080px × 1080px (Feed Quadrado 1:1) ou 1080px × 1920px (Stories/Reels 9:16).
* **Tipografia Curada:** Importação dinâmica de fontes modernas (DM Sans, Space Grotesk, Playfair Display, Inter).
* **Composição com CSS Moderno:** Suporte a glassmorphism (ackdrop-filter), gradientes lineares e radiais, bordas arredondadas e sombras em camadas.
* **Zero Placeholders:** Toda imagem inserida no slide provém do banco de fotos reais da loja (store-assets) ou do catálogo mestre de produtos.

---

## 5. ARQUITETURA LEVE, MCP (MODEL CONTEXT PROTOCOL) & EFICIÊNCIA DE INFRAESTRUTURA

Para rodar simulações com até 100 agentes sintéticos simultâneos sem sobrecarregar a CPU dos servidores do Waesy ou estourar a cota de APIs:

### 5.1. O Waesy como Servidor MCP (Model Context Protocol)
O ecossistema implementa o padrão aberto **MCP da Anthropic**, permitindo que qualquer cliente de IA (Claude Desktop, IDEs, agentes externos) ou o próprio frontend consuma os dados do Waesy de forma padronizada através de ferramentas seguras:
* 	ools/simlab_run_survey: Executa um teste de aceitação de oferta contra uma amostra sintética estratificada;
* 	ools/generate_marketing_post: Dispara o pipeline Aria -> Bruno -> Carla para produzir um carrossel pronto;
* 	ools/analyze_competitor_dna: Executa a varredura e extração do raio-X de um concorrente;
* 	ools/query_master_catalog: Consulta o catálogo global de produtos por código de barras ou categoria.

### 5.2. Otimização de Custo e Performance (Batching & Cache Semântico)
1. **Avaliação em Lotes (Batch Evaluation):** Em vez de fazer 100 chamadas individuais para a API de LLM, o backend agrupa as personas em lotes de 10 por requisição (atch_size = 10) utilizando saída estruturada em JSON (Structured Outputs). Isso reduz a latência em 80% e economiza até 75% dos tokens de cabeçalho.
2. **Cache Semântico com pgvector:** Respostas a estímulos idênticos ou muito similares de uma mesma persona são cacheadas em banco de dados vetorial, evitando reprocessamentos desnecessários para variações mínimas de texto.
3. **Desacoplamento Assíncrono:** As simulações rodam em segundo plano via Edge Functions e filas assíncronas (pg_cron / webhooks). O frontend do lojista recebe atualizações em tempo real via Supabase Realtime sem bloquear a navegação.
---

## 6. O CONSELHO CIENTÍFICO DE CONFRONTAÇÃO ESTATÍSTICA (ANTI-HALLUCINATION PROTOCOL)

Para assegurar que o sistema não produza conclusões ingênuas ou superficiais, toda simulação passa obrigatoriamente por um comitê interno de revisão científica antes de ser entregue ao lojista:

### 6.1. O Conselho Científico de 3 Personas de Alta Senioridade
1. **Prof. Dr. Arnaldo (Econometrista Chefe & Modelador Estatístico):**
   - *Missão:* Auditar se a amostra possui representatividade demográfica adequada, calcular intervalos de confiança de 95%, verificar desvios-padrão e detectar outliers que possam distorcer a média.
2. **Profa. Dra. Beatriz (Psicóloga Social & Especialista em Comportamento do Consumidor):**
   - *Missão:* Detectar viés de cortesia da IA e verificar se as reações dos agentes refletem a realidade sociológica brasileira. Se uma persona de baixa renda demonstrar entusiasmo por um produto de luxo sem questionar o preço, a resposta é rejeitada e re-calibrada.
3. **Dr. Cláudio (Auditor de Viabilidade de Mercado & Estrategista de Risco):**
   - *Missão:* Confrontar os resultados da simulação com dados históricos de mercado e emitir o **Veredito Científico**: se a campanha deve ser 'Aprovada para Veiculação', 'Revisada com Ajustes' ou 'Bloqueada por Alto Risco de Prejuízo'.

---

## 7. FOCUS GROUP VIRTUAL EM TEMPO REAL (CHAT INTERATIVO)

O sistema implementa a funcionalidade inovadora de **Focus Group Virtual** (/workspace/simlab/focus-group):
* **Composição da Sala:** O lojista seleciona de 3 a 5 personas da biblioteca (ex: 'Carla - Mãe de Classe Média', 'Gabriel - Jovem Empreendedor', 'Marcos - Consumidor de Alto Padrão').
* **Dinâmica de Conversa:** O empresário atua como moderador e envia mensagens no chat:
  - *Exemplo de Pergunta:* 'Pessoal, se eu lançar um hambúrguer artesanal com queijo brie e geleia de pimenta por R$ 48,00 com entrega grátis em até 30 minutos, o que vocês acham?'
  - *Resposta da Carla:* 'R$ 48 num hambúrguer só pra mim fica puxado. Para o fim de semana com meu marido daria quase R$ 100 só de lanche. Se tiver um combo família com batata e refrigerante por R$ 85, eu compro com certeza.'
  - *Resposta do Marcos:* 'O preço está adequado se a carne for angus e a entrega realmente cumprir os 30 minutos. Se a embalagem for térmica e não amolecer o pão, peço toda semana no escritório.'
* **Extração Automática de Insights:** A cada rodada de conversa, o comitê científico sintetiza os pontos de concordância, as principais objeções e a faixa de preço ideal aceita pelo grupo.

---

## 8. PLANO DE EXECUÇÃO EM MICROFASES RECURSIVAS DE ENGENHARIA

A transfusão e implementação no Waesy será executada em 6 Fases Estruturadas:

### FASE 1: DDL das Populações Sintéticas e Biblioteca de Personas
* **Microfase 1.1:** Criação das tabelas synthetic_population_archetypes, synthetic_agent_memories, simlab_market_experiments, simlab_persona_responses, simlab_statistical_synthesis e squad_generated_posts.
* **Microfase 1.2:** Carga inicial dos 12 arquétipos demográficos brasileiros consolidados (calibrados por dados reais do IBGE e ABEP).

### FASE 2: Motor de Simulação em Lotes (Batch Engine) e Síntese Estatística
* **Microfase 2.1:** Criação da server function TanStack Start simlab.functions.ts para disparar simulações assíncronas com agrupamento em lotes de 10 personas por chamada.
* **Microfase 2.2:** Implementação do motor de cálculo econométrico (NPS sintético, taxa de aprovação, taxa de rejeição e intervalo de confiança).

### FASE 3: Conselho Científico e Anti-Hallucination Protocol
* **Microfase 3.1:** Implementação dos prompts dos 3 revisores acadêmicos (Arnaldo, Beatriz e Cláudio) para validação cruzada obrigatória de cada simulação.
* **Microfase 3.2:** Geração do parecer científico com recomendações práticas e alertas de risco financeiro.

### FASE 4: Focus Group Virtual em Tempo Real
* **Microfase 4.1:** Criação da interface /workspace/simlab/focus-group com seletor de bancada de personas e chat dinâmico.
* **Microfase 4.2:** Conexão com Supabase Realtime para streaming de respostas das personas com digitação humanizada e sentiment score.

### FASE 5: Pipeline Multi-Agente de Conteúdo (Aria -> Bruno -> Carla -> Diego)
* **Microfase 5.1:** Implementação da esteira de geração de posts completos em squad-marketing.functions.ts.
* **Microfase 5.2:** Renderização de slides em HTML5 1080x1080 com suporte ao Google Fonts e exportação para WebP no bucket store-assets.
* **Microfase 5.3:** Conexão do post gerado com o SimLab para validação prévia de atratividade antes do agendamento.

### FASE 6: Servidor MCP (Model Context Protocol) e Governança
* **Microfase 6.1:** Implementação dos endpoints do protocolo MCP expondo simlab_run_survey e generate_marketing_post.
* **Microfase 6.2:** Proteção de chaves com rotação via key-orchestrator.ts e auditoria de consumo de tokens por loja.

---
**Fim do Dossiê Canônico: Aaru AI, Simulações Sintéticas e Squads de Criação Waesy.**
