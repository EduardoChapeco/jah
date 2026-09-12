# ==============================================================================
# DOSSIÊ ARQUITETURAL FORENSE: SQUADS AGÊNTICOS MULTINACIONAIS, ONBOARDING MULTIMODAL,
# INTELIGÊNCIA COMPETITIVA, FRAMEWORK DOS 7 PECADOS & BANCO GLOBAL DE PRODUTOS
# PROTOCOLO DE CONSELHO MULTI-AGENTE (STAFF / PRINCIPAL ARCHITECT LEVEL)
# ==============================================================================

**Data de Emissão:** Setembro de 2026  
**Status:** Documento Canônico de Engenharia, Auditoria Forense e Especificação Técnica de Plataforma  
**Alvos Principais:** 
- Onboarding Multimodal de Zero Fricção (Ingestão de fotos de cardápios, catálogos físicos, links do iFood/Mercado Livre e geração automática de produtos reais)
- Banco Centralizado Global de Produtos (Master SKU Catalog com fotos oficiais, EAN-13, NCM e tributação)
- Motor de Inteligência de Mercado & Radar de Concorrentes (Scraping, Screenshots full-page, extração de Brand DNA e análise competitiva)
- Frameworks Estratégicos Psicológicos (O Canvas dos 7 Pecados Capitais, Matriz SWOT e SimLab V2 de Personas Sintéticas)
- Orquestração de Squads Agênticos Especializados com Currículos de PhD (Growth Marketing V4, Contabilidade & Reforma Tributária, RH & DP, Estratégia de Negócios)
- Arquitetura de Chaves Multi-Provedores e Integração 100% Opcional no Ecossistema Waesy

---

## 1. SUMÁRIO EXECUTIVO & VISÃO DA PLATAFORMA AUTÔNOMA

O maior gargalo de adoção de sistemas de gestão, e-commerce e vitrines para pequenas, médias e grandes empresas é o **atrito de configuração inicial (onboarding)**. O lojista é tipicamente forçado a preencher centenas de campos manuais, cadastrar produtos um a um, recortar fotos, escrever descrições e configurar tabelas de tributos, o que resulta em altas taxas de abandono e cadastros incompletos.

Paralelamente, as empresas operam sem inteligência estratégica de mercado: desconhecem a fundo a comunicação de seus concorrentes, não possuem times capacitados de marketing de alta performance (padrão V4 Company), sofrem com as complexidades da Reforma Tributária brasileira e enfrentam burocracias pesadas na gestão de pessoas e departamento pessoal.

O ecossistema **Waesy** incorpora nesta especificação a **Engenharia Agêntica Autônoma**, unificando tecnologias proprietárias desenvolvidas nos projetos simwork, rand-builder-ai, classificadoswaesy, persona-nexus e waesy:

1. **Onboarding Multimodal em 1 Clique:** O empresário simplesmente envia fotos do seu cardápio impresso, fotos da fachada/loja ou links do iFood/Mercado Livre. Agentes de visão computacional multimodal realizam OCR semântico, deduzem categorias, porções, variações e preços, cadastrando produtos reais e editáveis no banco de dados.
2. **Master Catalog Global de Produtos:** Uma base centralizada de produtos de alta demanda (bebidas, snacks, mercearia, cosméticos) com fotos em alta definição em WebP, descrição persuasiva, código de barras EAN-13 e tributação pronta para vincular à loja em 1 clique.
3. **Radar de Concorrentes & Brand DNA:** Agentes autônomos acessam as redes sociais e sites da empresa e de seus principais concorrentes, capturam prints de tela inteira, extraem o arquétipo de marca, paleta de cores, tipografia, principais promessas e fraquezas.
4. **O Canvas dos 7 Pecados Capitais & SWOT:** Metodologia de engenharia psicológica aplicada à geração de campanhas, explorando as 7 alavancas subconscientes humanas (Orgulho, Ganância, Luxúria, Inveja, Gula, Ira, Preguiça) para desenhar propostas de valor magnéticas e ofertas irrecusáveis.
5. **Squads Agênticos Especializados com Nível de Consultoria Internacional:** Times autônomos de agentes com currículos de especialistas seniores e PhDs divididos em quatro departamentos: Marketing & Growth (V4 Standard), Contabilidade & Reforma Tributária (IBS/CBS), RH & Departamento Pessoal e Inteligência Competitiva.
6. **Autonomia com Liberdade de Escolha (IA 100% Opcional):** Nenhum usuário é obrigado a utilizar inteligência artificial. O sistema preserva formulários clássicos e importações manuais por planilha para lojistas tradicionais.

---

## 2. INVENTÁRIO FORENSE DE ATIVOS NOS PROJETOS IRMÃOS

Durante a auditoria forense nos repositórios em Documents/projetos-referencias, localizamos as implementações completas que formam a espinha dorsal desta arquitetura:

### 2.1. O Cérebro Agêntico e Orquestrador de Contexto (simwork e rand-builder-ai)
* **Edge Functions em simwork/supabase/functions/:**
  - gent-scraper/index.ts: Robô de captura automatizada integrado à API Firecrawl que realiza scraping headless e gera screenshots em resolução de página inteira (screenshot@fullPage), persistindo as imagens no Supabase Storage (postgen//scraped-dna/).
  - gent-vision-analyzer/index.ts: Agente * The Visionary* (Diretor de Arte Sênior & Psicanalista de Cores) que analisa imagens de concorrentes ou da própria marca via modelos multimodais de visão, extraindo paleta de cores exata em HEX, raios de borda, sombras, escala tipográfica e gerando réplicas de templates em HTML/CSS com variáveis.
  - extract-brand-identity/index.ts: Agente *The Identity Engineer* (Especialista em Arquétipos Junguianos e Head of Branding) que processa dados de redes sociais e briefing, deduzindo arquétipos (O Herói, O Mago, O Rebelde), pilares de conteúdo e manuais de tom de voz.
  - _shared/key-orchestrator.ts: Motor de rotação e gerenciamento seguro de chaves de API com criptografia em repouso via pgcrypto, suportando 15 provedores (OpenRouter, OpenAI, Anthropic, Gemini, Groq, Firecrawl, ElevenLabs, Runway, Luma, Replicate, Stability, etc.).
  - squad-catalog/index.ts: API de despacho e orquestração de squads de agentes com contratos estritos de entrada e saída.
  - cerebro-context/index.ts: Gerador de contexto dinâmico injetando as diretrizes da marca (ccp_context) em todos os outputs gerados.

* **Schemas de Banco de Dados (simwork/supabase/migrations/):**
  - 20260402183000_squad_catalog_platform.sql: Tabelas gent_registry (com colunas seniority, career_summary, curriculum, deliverables, source_refs), squad_templates, squad_template_agents e workspace_squads.
  - 20260403000000_ccp_protocol_foundation.sql: Tabela ccp_prompt_templates para versionamento de prompts em XML estruturado com slots dinâmicos e schemas de validação.
  - 20260330000000_postgen_multi_tenant.sql: Tabela competitor_analyses_v2 contendo url, 
ame, dna_text, screenshot_url e aw_markdown.

### 2.2. Módulos Fiscais, Contábeis e Recursos Humanos (classificadoswaesy)
* **Interfaces Prontas em classificadoswaesy/src/pages/:**
  - FiscalPage.tsx: Módulo de emissão e controle fiscal para NF-e, NFS-e, NFC-e, CT-e e CF-e SAT, com suporte a regimes tributários (Simples Nacional, Lucro Presumido, Lucro Real, MEI), cálculo de tributos, cartas de correção e cancelamento.
  - AccountingPage.tsx: Painel financeiro e contábil com abas de DRE (Demonstração do Resultado do Exercício), Fluxo de Caixa Projetado, Contas a Pagar/Receber, Caixa Físico, Títulos de Cobrança e Auditoria.
  - HRModulePage.tsx: Sistema completo de Recursos Humanos com abas de Organograma empresarial, Mural de Vagas, Gestão de Candidatos (Kanban), Banco de Talentos, Onboarding de Funcionários, Ponto Eletrônico, Folha de Pagamento e Documentos Admissais.

### 2.3. Simulador de Personas Sintéticas (simwork e simwork-d360004a)
* **Motor SimLab V2 (simlab.ts, simlab-engine, simlab-personas):**
  - Gerador de personas sintéticas baseadas em dados demográficos, dores reais e hábitos de consumo, permitindo simular reações do público-alvo antes de lançar anúncios ou ofertas no mercado.

---

## 3. ARQUITETURA DE DADOS COMPLETA NO Waesy (DDL POSTGRESQL + RLS)

Abaixo está o DDL unificado em PostgreSQL que integra nativamente o motor de squads, a inteligência de mercado, o onboarding multimodal e o catálogo global dentro da arquitetura multi-tenant do Waesy, vinculado à tabela stores:

`sql
-- ============================================================================
-- DDL DEFINITIVO: SQUADS AGÊNTICOS, INTELIGÊNCIA DE MERCADO E MASTER CATALOG
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS  uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Catálogo Canônico de Agentes Individuais
CREATE TABLE IF NOT EXISTS public.agent_registry (
  id TEXT PRIMARY KEY, -- Ex: 'agent.v4_copywriter', 'agent.tax_consultant'
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'marketing', 'finance_tax', 'hr_people', 'strategy'
  ui_group TEXT NOT NULL DEFAULT 'general',
  seniority TEXT NOT NULL DEFAULT 'Senior / PhD', -- 'Specialist', 'Lead', 'Senior / PhD', 'Director'
  career_summary TEXT NOT NULL,
  curriculum JSONB NOT NULL DEFAULT '{
    academic_background: [],
    certifications: [],
    years_experience: 10,
    specialties: []
  }'::jsonb,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_mode TEXT NOT NULL DEFAULT 'llm', -- 'llm', 'vision', 'scraper', 'deterministic'
  default_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  token_budget INT NOT NULL DEFAULT 4000,
  system_prompt_template TEXT NOT NULL,
  input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Templates de Squads Estruturados (Times de Especialistas)
CREATE TABLE IF NOT EXISTS public.squad_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- 'squad-v4-growth-marketing', 'squad-tax-accounting', 'squad-hr-people'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL, -- 'marketing', 'accounting', 'human_resources', 'executive_strategy'
  runtime_status TEXT NOT NULL DEFAULT 'ready',
  onboarding_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon_name TEXT NOT NULL DEFAULT 'Users',
  badge_label TEXT NOT NULL DEFAULT 'Enterprise Grade',
  is_system BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Membros do Squad e Ordem de Execução (Task Graph)
CREATE TABLE IF NOT EXISTS public.squad_template_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_template_id UUID NOT NULL REFERENCES public.squad_templates(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agent_registry(id) ON DELETE RESTRICT,
  task_order INT NOT NULL DEFAULT 0,
  role_label TEXT NOT NULL, -- Ex: 'Head de Estratégia', 'Copywriter Sênior', 'Auditor Fiscal'
  depends_on_agent_id TEXT REFERENCES public.agent_registry(id) ON DELETE SET NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  input_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_squad_agent_order UNIQUE (squad_template_id, task_order),
  CONSTRAINT uq_squad_agent_pair UNIQUE (squad_template_id, agent_id)
);

-- 4. Instâncias de Squads Ativos por Loja / Empresa (Multi-Tenant)
CREATE TABLE IF NOT EXISTS public.store_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  squad_template_id UUID NOT NULL REFERENCES public.squad_templates(id) ON DELETE RESTRICT,
  custom_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'configuring'
  operational_goal TEXT,
  cadence TEXT NOT NULL DEFAULT 'on_demand', -- 'on_demand', 'daily', 'weekly', 'event_driven'
  approval_mode TEXT NOT NULL DEFAULT 'human_in_the_loop', -- 'auto', 'human_in_the_loop'
  onboarding_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  runtime_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_store_squad_slug UNIQUE (store_id, squad_template_id)
);

CREATE INDEX IF NOT EXISTS idx_store_squads_store ON public.store_squads(store_id);

-- 5. Execuções do Squad e Registro de Artefatos
CREATE TABLE IF NOT EXISTS public.store_squad_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_squad_id UUID NOT NULL REFERENCES public.store_squads(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  trigger_source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduler', 'webhook', 'onboarding'
  status TEXT NOT NULL DEFAULT 'running', -- 'queued', 'running', 'completed', 'failed', 'needs_approval'
  current_agent_id TEXT REFERENCES public.agent_registry(id),
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_artifacts JSONB NOT NULL DEFAULT '{}'::jsonb, -- Relatórios, peças, copys, análises
  error_log TEXT,
  total_tokens_consumed INT NOT NULL DEFAULT 0,
  cost_estimate_cents INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_squad_runs_store ON public.store_squad_runs(store_id, status);

-- 6. Perfil de DNA de Marca e Framework dos 7 Pecados Capitais
CREATE TABLE IF NOT EXISTS public.brand_dna_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  archetype TEXT NOT NULL DEFAULT 'O Herói', -- 'O Inocente', 'O Sábio', 'O Explorador', 'O Rebelde', 'O Mago', 'O Herói', etc.
  archetype_justification TEXT,
  tone_of_voice TEXT NOT NULL DEFAULT 'Profissional e acolhedor',
  tone_rules TEXT[] NOT NULL DEFAULT '{}',
  content_pillars TEXT[] NOT NULL DEFAULT '{}',
  forbidden_words TEXT[] NOT NULL DEFAULT '{}',
  color_palette JSONB NOT NULL DEFAULT '{
    primary: #0F172A,
    secondary: #3B82F6,
    accent: #F59E0B,
    background: #FFFFFF,
    text: #0F172A
  }'::jsonb,
  seven_sins_triggers JSONB NOT NULL DEFAULT '{
    pride_vanity: Destacar exclusividade status social e pertencer a um grupo de elite.,
    greed: Enfatizar economia real ROI comprovado e ganho patrimonial.,
    lust: Estimular o apelo estético impecável desejo imediato e acabamento premium.,
    envy: Demonstrar por que os clientes estarão à frente de quem não possui a solução.,
    gluttony: Oferecer pacotes fartos suporte ilimitado e riqueza de benefícios.,
    wrath: Canalizar a indignação com serviços ruins do mercado tradicional.,
    sloth: Proporcionar conveniência absoluta zero burocracia e solução sem esforço.
  }'::jsonb,
  swot_analysis JSONB NOT NULL DEFAULT '{
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Radar de Concorrentes & Inteligência de Mercado
CREATE TABLE IF NOT EXISTS public.market_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  instagram_handle TEXT,
  facebook_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_store_competitor_name UNIQUE (store_id, name)
);

CREATE INDEX IF NOT EXISTS idx_competitors_store ON public.market_competitors(store_id);

-- 8. Snapshots e Capturas dos Concorrentes (Screenshots & Análises)
CREATE TABLE IF NOT EXISTS public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.market_competitors(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  snapshot_type TEXT NOT NULL DEFAULT 'website', -- 'website', 'instagram_feed', 'promotional_post'
  screenshot_url TEXT NOT NULL, -- URL no Supabase Storage
  extracted_dna JSONB NOT NULL DEFAULT '{}'::jsonb, -- Cores, tipografia, propostas de valor
  marketing_hooks TEXT[],
  pricing_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  analyzed_by_agent_id TEXT REFERENCES public.agent_registry(id),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_comp_snapshots_competitor ON public.competitor_snapshots(competitor_id);

-- 9. Banco Centralizado Global de Produtos (Master Catalog)
CREATE TABLE IF NOT EXISTS public.global_master_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode_ean TEXT UNIQUE, -- Código de barras EAN-13 / GTIN
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Bebidas', 'Snacks', 'Chocolates', 'Mercearia', 'Higiene', 'Conveniência'
  subcategory TEXT,
  description TEXT,
  suggested_price_cents INT,
  ncm_code TEXT, -- Nomenclatura Comum do Mercosul (essencial para emissão fiscal)
  cest_code TEXT, -- Código Especificador da Substituição Tributária
  tax_tribute_group TEXT DEFAULT 'tributado_integralmente',
  unit_of_measure TEXT NOT NULL DEFAULT 'UN', -- 'UN', 'KG', 'LT', 'CX'
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  nutrition_facts JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_master_catalog_barcode ON public.global_master_catalog(barcode_ean);
CREATE INDEX IF NOT EXISTS idx_master_catalog_search ON public.global_master_catalog USING gin(to_tsvector('portuguese', name || ' ' || brand_name || ' ' || category));

-- 10. Sessão de Onboarding Multimodal de Fricção Zero
CREATE TABLE IF NOT EXISTS public.multimodal_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'uploaded', -- 'uploaded', 'processing_vision', 'extracted', 'approved', 'applied'
  input_sources JSONB NOT NULL DEFAULT '{
    image_urls: [],
    external_links: []
  }'::jsonb, -- Fotos de cardápio, links iFood, Mercado Livre
  extracted_business_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  extracted_products JSONB NOT NULL DEFAULT '[]'::jsonb, -- Lista estruturada pronta para inserção em products
  extracted_categories TEXT[] DEFAULT '{}',
  applied_products_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_store ON public.multimodal_onboarding_sessions(store_id);

-- RLS Hardening
ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_template_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_squad_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_dna_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_master_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimodal_onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS:
-- 1. Catálogos canônicos são legíveis por todos os autenticados
CREATE POLICY Leitura pública autenticada de templates de agentes
  ON public.agent_registry FOR SELECT USING (true);

CREATE POLICY Leitura pública autenticada de templates de squads
  ON public.squad_templates FOR SELECT USING (true);

CREATE POLICY Leitura pública autenticada de agentes do squad
  ON public.squad_template_agents FOR SELECT USING (true);

CREATE POLICY Leitura pública autenticada do catálogo mestre de produtos
  ON public.global_master_catalog FOR SELECT USING (true);

-- 2. Lojistas acessam exclusivamente dados da sua própria loja (store_id)
CREATE POLICY Lojista gerencia seus squads ativos
  ON public.store_squads FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista gerencia execuções dos squads
  ON public.store_squad_runs FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista gerencia seu Brand DNA
  ON public.brand_dna_profiles FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista gerencia concorrentes cadastrados
  ON public.market_competitors FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista gerencia snapshots de concorrentes
  ON public.competitor_snapshots FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Lojista gerencia sessões de onboarding multimodal
  ON public.multimodal_onboarding_sessions FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);
`

---

## 4. ONBOARDING MULTIMODAL DE ZERO FRICÇÃO & BANCO GLOBAL DE PRODUTOS

### 4.1. Pipeline de Ingestão Visual (Fotos de Cardápios & Catálogos Físicos)
O processo elimina o atrito manual através do pipeline de visão multimodal integrado:
1. **Captura:** O empresário fotografa páginas do seu cardápio físico, panfleto promocional, cardápio de delivery ou tabela de preços de serviços diretamente pelo smartphone.
2. **Compressão & Upload:** A imagem é enviada para o bucket onboarding-inputs no Supabase Storage.
3. **Extração Multimodal (Agente The Visual Parser):**
   - O agente analisa a imagem utilizando modelos multimodais de alta resolução (Gemini 2.5 Flash / Pro).
   - Realiza OCR contextualizado que não apenas extrai texto, mas compreende a **hierarquia gastronômica ou comercial**:
     * Identifica títulos de seções (ex: Entradas, Pratos Principais, Sobremesas, Bebidas);
     * Separa nome do prato, descrição dos ingredientes e acompanhamentos;
     * Identifica múltiplos tamanhos/preços (ex: Pequeno R$ 25,00 | Grande R$ 42,00);
     * Dedução de tags automáticas (ex: Vegetariano, Sem Glúten, Serve 2 pessoas).
4. **Tela de Revisão Humana em 1 Clique (Human-in-the-Loop):**
   - O lojista vê uma tabela visual lado a lado com a foto original e os produtos extraídos organizados.
   - Pode ajustar qualquer valor ou clicar em **Aprovar e Publicar Todos**.
   - O sistema insere todos os registros na tabela oficial products do Waesy, gerando categorias e variantes instantaneamente.

### 4.2. Ingestão por Links Externos (iFood, Mercado Livre, E-commerce Existente)
Se o lojista já possui operação em outros canais:
- Ele cola a URL da sua loja no iFood ou Mercado Livre.
- O robô de scraping headless extrai o catálogo público, incluindo títulos, descrições, opções de personalização e fotos em alta resolução.
- As imagens são baixadas e re-hospedadas de forma segura no bucket store-assets da loja, tornando-o independente de plataformas terceiras.

### 4.3. Banco Centralizado Global de Produtos (Master Catalog)
Para supermercados, empórios, conveniências, farmácias e mercearias, o Waesy disponibiliza o **Master Catalog Central**:
* **Acervo Inicial de 5.000+ SKUs Populares:**
  - Refrigerantes, cervejas, energéticos, sucos e águas;
  - Chocolates, biscoitos, salgadinhos e guloseimas;
  - Laticínios, frios, pães e mercearia básica;
  - Itens de higiene pessoal e limpeza doméstica.
* **Dados Completos e Padronizados por Item:**
  - Código de Barras EAN-13 oficial verificado;
  - Foto profissional do produto recortada em fundo transparente (WebP ultra-leve);
  - Classificação fiscal brasileira: Código NCM e CEST para geração automática de notas fiscais;
  - Tabela nutricional e peso líquido.
* **Operação de Adição Rápida:** O lojista bipa o produto com o leitor de código de barras ou digita Coca-Cola 2L. O sistema localiza o registro no Master Catalog e adiciona à loja em 1 clique, restando ao lojista apenas definir o seu preço de venda e estoque.

### 4.4. Adoção Híbrida: Inteligência Artificial 100% Opcional
Para garantir inclusão total:
* A plataforma oferece um switch claro no início do cadastro:
  - **Modo Autônomo com IA:** Envie uma foto ou link e deixe os agentes montarem tudo para você.
  - **Modo Tradicional:** Quero preencher formulários passo a passo manualmente ou importar uma planilha Excel em formato XLSX ou CSV.
* Nenhum empresário é forçado a interagir com IA caso prefira a rotina manual tradicional.

---

## 5. MOTOR DE INTELIGÊNCIA COMPETITIVA, RADAR DE CONCORRENTES & BRAND DNA

### 5.1. O Robô de Varredura e Screenshots (Firecrawl + Puppeteer)
O sistema monitora ativamente o ecossistema competitivo de cada loja:
1. O usuário informa os links de até 5 concorrentes diretos (site institucional, e-commerce, perfil no Instagram ou página do Facebook).
2. O agente agent-scraper realiza um disparo automatizado via API do Firecrawl ou Chromium headless.
3. Captura prints de alta fidelidade em tamanho de página inteira (screenshot@fullPage) de:
   - A página inicial (Hero Banner, propostas de valor, layout geral);
   - A vitrine de produtos e política de frete/parcelamento;
   - Os últimos posts e destaques de redes sociais.
4. Os screenshots são armazenados no Supabase Storage e associados à tabela competitor_snapshots.

### 5.2. Extração Forense de Brand DNA do Concorrente e da Própria Marca
O agente multimodal The Visionary e o estrategista The Identity Engineer realizam o raio-X da comunicação:
* **Paleta de Cores & Vibe:** Identifica as cores dominantes, tom psicológico (luxo, popular, urgente, acolhedor) e nível de acabamento gráfico.
* **Ganchos Promocionais & Ofertas:** Extrai as principais chamadas para ação (ex: Frete Grátis acima de R$ 199, Garantia Vitalícia, Parcelamento em 10x sem juros).
* **Pontos Fracos e Oportunidades:** Detecta se o concorrente não tem atendimento rápido por WhatsApp, se a comunicação é fria, se o cardápio é confuso ou se o site é lento.
* **Matriz Comparativa de Competitividade:** Gera um relatório visual para o lojista exibindo:
  - Onde sua empresa ganha (diferenciais competitivos únicos);
  - Onde o concorrente está na frente;
  - Recomendações imediatas de contra-ataque comercial.
---

## 6. O FRAMEWORK ESTRATÉGICO DO CANVAS DOS 7 PECADOS CAPITAIS, SWOT & SIMLAB V2

### 6.1. A Engenharia Psicológica das 7 Alavancas Subconscientes
Metodologia desenvolvida no marketing de alta conversão brasileiro (popularizada por grandes estrategistas de posicionamento) que parte da premissa de que **toda decisão de compra humana é motivada por uma ou mais forças viscerais subconscientes**.

O Waesy estrutura o **Canvas dos 7 Pecados** como um framework nativo de inteligência:

| Pecado Capital | Motivação Subconsciente | Alavanca de Posicionamento & Copywriting | Caso de Uso Prático na Loja Waesy |
| :--- | :--- | :--- | :--- |
| **Orgulho / Vaidade** | Busca por status, superioridade social, autoridade e validação de pares. | 'Para quem não aceita o comum', selos VIP, edições limitadas e produtos de assinatura exclusiva. | O cliente exibe o produto da loja como símbolo de conquista e refinamento pessoal. |
| **Ganância** | Desejo de enriquecimento, economia financeira agressiva e maximização de ROI. | 'Pague 1 e Leve 2', 'Economia de R$ 1.400 no ano', 'Retorno financeiro acelerado em 30 dias'. | Vitrines de atacarejo, planos anuais com desconto massivo e combos econômicos. |
| **Luxúria** | Prazer sensorial, atração visual, magnetismo estético e elegância tátil. | Imagens de dar água na boca, design editorial sofisticado e embalagens impecáveis. | Restaurantes com fotos macro de pratos e lojas de moda com lookbook refinado. |
| **Inveja** | Medo de ficar para trás (FOMO) e desejo do padrão de vida ou sucesso alcançado por terceiros. | 'O segredo que seus concorrentes não querem que você descubra', 'O produto mais desejado do bairro'. | Depoimentos sociais com antes e depois e contadores de itens vendidos. |
| **Gula** | Busca por fartura, excesso positivo, porções generosas e bônus acumulados. | 'Combo Gigante Família', 'Suporte Ilimitado', 'Compre o curso e ganhe 12 bônus adicionais'. | Pizzarias com borda vulcânica recheada e ofertas de franquias com kit completo. |
| **Ira** | Indignação com o atendimento ruim de concorrentes tradicionais, revolta contra burocracias. | 'Cansado de ser mal atendido pelas operadoras?', 'Chega de pagar taxas abusivas escondidas'. | Serviços de portabilidade, planos transparentes e suporte humanizado em 30 segundos. |
| **Preguiça** | Busca pela menor energia gasta: conveniência extrema, automação total e zero atrito. | 'Nós fazemos tudo por você', 'Entrega em 20 minutos na sua porta', 'Configuração em 1 clique'. | Checkout em 1 clique, assinaturas com renovação automática e onboarding multimodal. |

### 6.2. Orquestração da Matriz SWOT com SimLab V2
1. O agente *The Market Strategist* combina os dados dos concorrentes, o Brand DNA e o Canvas dos 7 Pecados para gerar a **Matriz SWOT Dinâmica**:
   - **Forças (Strengths):** O que a empresa faz melhor que qualquer rival mapeado;
   - **Fraquezas (Weaknesses):** Onde a comunicação ou catálogo ainda é inferior;
   - **Oportunidades (Opportunities):** Demandas do público não atendidas na região geográfica;
   - **Ameaças (Threats):** Ações agressivas de preços ou novas entradas no mercado local.
2. **Simulação Pré-Lançamento com SimLab V2:**
   - Antes de colocar um anúncio ou campanha no ar, o sistema dispara a oferta contra **10 Personas Sintéticas** criadas pelo motor SimLab V2 (ex: 'Dona Maria, 52 anos, conservadora, foca em preço'; 'Lucas, 24 anos, entusiasta tech, foca em velocidade').
   - As personas respondem com notas de atratividade, objeções reais de compra e probabilidade de conversão.
   - O squad ajusta o texto do anúncio e a vitrine **antes** de gastar qualquer centavo em tráfego pago.
---

## 7. OS 4 SQUADS AGÊNTICOS ESPECIALIZADOS (CURRÍCULOS, SENIORIDADE & ENTREGAS)

Cada squad atua como um departamento executivo autônomo dentro da empresa, operando com personas formalmente registradas na tabela gent_registry:

### 7.1. Squad 1: Marketing & Growth V4 Company Standard
* **Objetivo:** Planejar, criar, executar e otimizar campanhas completas de vendas com o mesmo rigor de uma das maiores assessorias de marketing do país (V4 Company).
* **Membros do Squad:**
  1. **Head de Growth (Lead Strategist):**
     - *Currículo:* 15 anos de experiência em tração de negócios B2C e B2B, ex-diretor de growth em unicórnios.
     - *Entregas:* Plano mestre de aquisição de clientes, definição de canais prioritários, metas de CAC (Custo de Aquisição de Clientes) e LTV (Lifetime Value).
  2. **Copywriter Sênior (Direct Response & Psicanálise de Consumo):**
     - *Currículo:* PhD em Comunicação Persuasiva, especialista em gatilhos mentais do Canvas dos 7 Pecados, fórmulas AIDA, PAS e Storytelling de impacto.
     - *Entregas:* Textos para anúncios no Meta/Google, copys de landing pages, roteiros para vídeos curtos (Reels/TikTok) e sequências automáticas de WhatsApp.
  3. **Diretor de Arte & Designer Gráfico (Creative Studio Integration):**
     - *Currículo:* Diretor de arte premiado, especialista em tipografia, hierarquia visual e composição no Waesy Creative Studio.
     - *Entregas:* Peças gráficas prontas para publicação, carrosséis educativos, banners de vitrine e capas promocionais.
  4. **Gestor de Tráfego Pago & Media Buyer:**
     - *Currículo:* Certificado Google Ads Master e Meta Certified Media Buying Professional, com mais de R$ 50M gerenciados em mídia de performance.
     - *Entregas:* Estrutura de campanhas, segmentação de públicos Lookalike, estratégia de lances e otimização contínua de ROAS.
  5. **Engenheiro de Dados & Web Analytics:**
     - *Currículo:* Especialista em atribuição multitouch, Google Analytics 4, Pixel do Meta e relatórios executivos de conversão.
     - *Entregas:* Dashboards consolidados de vendas, funil de conversão da vitrine e cálculo de ROI em tempo real.

### 7.2. Squad 2: Contabilidade, Tributação & Reforma Tributária (IBS / CBS)
* **Objetivo:** Proteger a empresa contra autuações fiscais, otimizar custos tributários através de elisão fiscal legal e preparar o negócio para a transição da Reforma Tributária brasileira.
* **Membros do Squad:**
  1. **Contador Consultor Sênior (CRC Master):**
     - *Currículo:* Mais de 20 anos em auditoria contábil, compliance fiscal e consolidação de balanços para pequenas e médias empresas.
     - *Entregas:* Fechamento mensal, emissão de DRE analítica, conciliação bancária e diagnósticos de saúde financeira.
  2. **Especialista em Reforma Tributária (IBS / CBS / Imposto Seletivo):**
     - *Currículo:* Mestre em Direito Tributário pela USP, parecerista das novas regras da EC 132/2023.
     - *Entregas:* Projeção de impacto do IVA Dual (IBS estadual/municipal e CBS federal) no preço final dos produtos, análise de créditos tributários na cadeia de compras e plano de transição gradual.
  3. **Planejador Fiscal & Elisão Legal:**
     - *Currículo:* Especialista em regimes Simples Nacional, Lucro Presumido e Lucro Real, com foco em redução legítima da carga tributária.
     - *Entregas:* Estudo comparativo de enquadramento anual, segregação de receitas com substituição tributária (evitando pagar PIS/COFINS e ICMS em duplicidade) e aproveitamento de benefícios fiscais regionais.
  4. **Auditor de Fluxo de Caixa & Gestão de Títulos:**
     - *Currículo:* Analista financeiro corporativo com foco em gestão de capital de giro e inadimplência.
     - *Entregas:* Régua de cobrança automatizada por WhatsApp/E-mail com PIX, projeção de caixa para 90 dias e alertas de contas a vencer.

### 7.3. Squad 3: Recursos Humanos, Gente & Departamento Pessoal
* **Objetivo:** Atrair os melhores talentos, automatizar a burocracia admissional e trabalhista (CLT e PJ) e garantir um ambiente produtivo e engajado.
* **Membros do Squad:**
  1. **Headhunter & Recrutador Sênior (Talent Acquisition):**
     - *Currículo:* Especialista em recrutamento por competências, mapeamento de mercado e avaliação comportamental (DISC).
     - *Entregas:* Descrição magnética de vagas no Portal de Carreiras, triagem automática de currículos com ranking de afinidade e roteiros de entrevista personalizados.
  2. **Analista de Departamento Pessoal & Compliance Trabalhista (eSocial):**
     - *Currículo:* Especialista em legislação CLT, convenções coletivas de trabalho, ponto eletrônico e obrigações do eSocial.
     - *Entregas:* Checklist admissional digital com upload de documentos, espelho de ponto validado, cálculo prévio de horas extras, férias e rescisões.
  3. **Facilitador de Clima, Cultura & Treinamentos:**
     - *Currículo:* Psicólogo organizacional focado em retenção de talentos (Employee Retention) e liderança humanizada.
     - *Entregas:* Pesquisas automatizadas de clima (eNPS), trilhas de onboarding para novos colaboradores e planos de desenvolvimento individual (PDI).

### 7.4. Squad 4: Estratégia Empresarial & Inteligência Competitiva
* **Objetivo:** Atuar como conselheiro executivo do lojista, identificando novas linhas de receita, corrigindo margens de lucro e antecipando movimentos de mercado.
* **Membros do Squad:**
  1. **Consultor de Estratégia Corporativa (Ex-McKinsey/Bain Style):**
     - *Currículo:* MBA em Gestão Estratégica, especialista em modelos de negócios escaláveis e precificação dinâmica.
     - *Entregas:* Relatórios trimestrais de posicionamento, análise de portfólio de produtos (Matriz BCG) e definição de OKRs (Objectives and Key Results).
  2. **Auditor de Precificação & Margem de Contribuição:**
     - *Currículo:* Especialista em engenharia de preços (Markup x Margem) e ponto de equilíbrio (Break-even).
     - *Entregas:* Cálculo do markup ideal considerando custos fixos, comissões de cartão e impostos, com alertas de produtos que dão prejuízo invisível.
---

## 8. PLANO DE EXECUÇÃO EM MICROFASES RECURSIVAS DE ENGENHARIA

A transfusão e nativização completa desta suíte tecnológica no ecossistema Waesy será realizada em 6 Grandes Fases estruturadas em microfases atômicas de precisão:

### FASE 1: Fundação de Dados, Migração Unificada & Catálogo de Agentes
* **Microfase 1.1:** Execução da migration DDL contendo gent_registry, squad_templates, squad_template_agents, store_squads, store_squad_runs, rand_dna_profiles, market_competitors, competitor_snapshots, global_master_catalog e multimodal_onboarding_sessions.
* **Microfase 1.2:** Seed dos 15 Agentes Especializados com seus respectivos currículos de PhD, perfis de carreira, senioridade, token budgets e schemas estritos de entrada e saída.
* **Microfase 1.3:** Seed dos 4 Squad Templates estruturados com dependências e ordem de execução de tarefas (Task Graph).

### FASE 2: Motor de Onboarding Multimodal & Master Catalog Global
* **Microfase 2.1:** Implementação do serviço de backend TanStack Start multimodal-onboarding.functions.ts para receber imagens de cardápios/catálogos e links do iFood/Mercado Livre.
* **Microfase 2.2:** Integração do agente *The Visual Parser* via Gemini Multimodal Vision para extração hierárquica de seções, pratos, descrições, preços e alérgenos.
* **Microfase 2.3:** Criação da tabela de revisão visual lado a lado no frontend com botão de aprovação em lote para inserção na tabela products.
* **Microfase 2.4:** Povoamento do global_master_catalog com os primeiros 500 produtos populares verificados com fotos oficiais WebP, EAN-13 e tributação NCM/CEST.

### FASE 3: Motor de Varredura de Concorrentes & Extração de Brand DNA
* **Microfase 3.1:** Implementação da rota de scraping de concorrentes conectada ao Firecrawl e Puppeteer com gravação de prints full-page no bucket store-assets.
* **Microfase 3.2:** Integração dos agentes *The Visionary* e *The Identity Engineer* para análise visual e textual, deduzindo paleta de cores HEX, tipografia e arquétipo de marca.
* **Microfase 3.3:** Criação do relatório comparativo de concorrência com diferenciais da loja versus concorrentes.

### FASE 4: O Canvas dos 7 Pecados Capitais, SWOT & SimLab V2
* **Microfase 4.1:** Implementação da interface visual do Canvas dos 7 Pecados no painel de Marketing do lojista, permitindo customizar os ganchos da marca para cada um dos 7 pecados.
* **Microfase 4.2:** Motor de geração de campanhas automáticas cruzando o produto em destaque com a alavanca psicológica selecionada (ex: 'Campanha de Orgulho/Status' ou 'Campanha de Ganância/Economia').
* **Microfase 4.3:** Conexão com o motor SimLab V2 para testes de aceitação sintética com 10 personas antes de veicular anúncios.

### FASE 5: Interface de Gestão de Squads no Workspace Waesy
* **Microfase 5.1:** Criação da página /workspace/squads no Waesy exibindo os 4 squads como escritórios virtuais independentes (Marketing, Fiscal/Contábil, RH/DP e Estratégia).
* **Microfase 5.2:** Criação da gaveta de detalhes do agente (Drawer / Sheet) exibindo o currículo completo, formação acadêmica, senioridade e histórico de tarefas entregues.
* **Microfase 5.3:** Implementação do modo de execução 'Human-in-the-Loop', onde o empresário revisa e aprova cada peça ou documento antes de sua aplicação definitiva.

### FASE 6: Integração Total com o Construtor Visual (Universal Builder)
* **Microfase 6.1:** Conectar o resultado do Onboarding Multimodal diretamente ao Universal Builder para gerar automaticamente a primeira vitrine da loja com as cores e fotos reais da marca.
* **Microfase 6.2:** Habilitar os squads para criar e atualizar seções dinâmicas no site (ex: Squad de Marketing cria um novo banner de oferta e o publica no hero do site em 1 clique).

---
**Fim do Dossiê Canônico: Squads Agênticos, Onboarding Multimodal e Inteligência de Mercado Waesy.**
