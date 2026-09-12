# ==============================================================================
# DOSSIÊ ARQUITETURAL FORENSE: BUILDER & EDITOR UNIVERSAL DE EXPERIÊNCIAS Waesy
# PROTOCOLO DE CONSELHO MULTI-AGENTE (STAFF / PRINCIPAL ARCHITECT LEVEL)
# ESTABILIZAÇÃO DE PRODUÇÃO, MULTI-PORTAL 360, OFFICE SUITE E CREATIVE STUDIO
# ==============================================================================

**Data de Emissão:** Setembro de 2026  
**Status:** Documento Mestre de Engenharia, Auditoria Forense e Especificação Técnica  
**Alvos Principais:** 
- Estabilização Imediata do Construtor de Vitrines em Produção (/workspace/builder//editor)
- Expansão para Multi-Portal Engine (Portal do Cliente 360, Portal de Carreiras/Empregos, Portal de Reputação estilo Reclame Aqui, BioLinks e Hotsites)
- Incorporação da Suíte Waesy Office (Word/Google Docs para Contratos e Documentos com conversor PDF/Doc)
- Incorporação do Waesy Creative Studio (Gerador de Flyers/Banners estilo Canva e Editor de Vídeo com IA)
- Motor de Animações de Scroll (Wix Studio Standard), CMS Dinâmico Real-Time e Deploy 1-Click (GitHub, Vercel, Cloudflare)

---

## 1. SUMÁRIO EXECUTIVO & VISÃO DO SISTEMA UNIVERSAL

O ecossistema **Waesy** possui uma infraestrutura base de construtor visual em src/components/admin/builder conectada a um motor de renderização dinâmico em src/components/commerce/experience-renderer.tsx. No entanto, o sistema em produção opera de forma instável e limitada por três razões fundamentais:
1. **Instabilidade e Quebras de Execução:** Bloqueios prematuros de permissão em chamadas de servidor (equireAdmin()), quebras por nós com estruturas undefined e ausência de tratamento defensivo no carregador do TanStack Router.
2. **Escopo Restrito:** O editor atual trata apenas o caso genérico de storefront de e-commerce e biolink simples, falhando em fornecer a experiência que os lojistas e empresas necessitam: portais completos com a sua própria identidade visual onde os seus clientes interagem com a vida contratual e financeira do negócio.
3. **Desconexão com Motores Proprietários Prontos:** O ecossistema possui ferramentas completas já desenvolvidas em repositórios irmãos (	ravelagencias, waesy, machine, cloudblock, classificadoswaesy, simwork) que contêm editores de contratos jurídicos com assinatura eletrônica, timeline de edição de vídeo, wizards de design gráfico estilo Canva e geradores de PWA whitelabel.

Este Dossiê estabelece a arquitetura definitiva para estabilizar a base existente e transformá-la no **Builder Universal de Experiências da Waesy**, operando como uma plataforma de nível Big Tech capaz de orquestrar seis grandes pilares em uma interface fluida, ultra-rápida, aderente ao Apple Human Interface Guidelines (HIG) e alimentada por IA.

---

## 2. ROOT CAUSE ANALYSIS (RCA) - POR QUE O BUILDER ATUAL QUEBRA EM PRODUÇÃO?

A auditoria forense no código-fonte de waesy/src/services/builder.functions.ts e waesy/src/routes/workspace.builder..editor.tsx identificou os 5 vetores exatos de falha que causam o comportamento errático e quebras em produção:

### 2.1. Bloqueio RLS e Validação de Papel Rígida Demais (equireAdmin)
* **Localização:** src/services/builder.functions.ts (linhas 482, 904, 2395, 2484, 2556) e src/lib/auth-guards.server.ts.
* **Causa Raiz:** A função equireAdmin() exige estritamente que identity.store_id esteja preenchido e que o usuário possua papel de loja ou seja platform_admin. Quando um administrador acessa a plataforma sem um store_id ativo fixado na sessão, ou quando um lojista com papel restrito tenta visualizar rascunhos, a função dispara 	hrow new Error( No store found) ou Forbidden: Insufficient privileges.
* **Impacto:** O loader da rota TanStack Router colapsa completamente antes de renderizar qualquer elemento visual, exibindo uma tela de erro em branco ou redirecionamento inesperado.
* **Solução:** Implementar esolveStoreContext(identity, input.store_id) com bypass transparente para platform_admin e validação granular por tenant via RLS.

### 2.2. Colapso por Referência Nula no ExperienceRenderer
* **Localização:** src/components/commerce/experience-renderer.tsx e blocos dinâmicos em src/components/commerce/dynamic-sections/*.
* **Causa Raiz:** Múltiplos blocos assumem que propriedades como 
ode.content.items, 
ode.content.buttons, 
ode.design_tokens.padding_y ou 	ransientData.products sempre existem como arrays populados. Quando um bloco é adicionado pelo usuário no canvas antes de ser configurado, ou quando a loja não possui produtos cadastrados, o acesso direto (ex: content.slides.map(...)) gera TypeError: Cannot read properties of undefined (reading 'map').
* **Impacto:** O React colapsa todo o canvas de edição, quebrando a sessão do usuário.
* **Solução:** Implementar uma camada de normalização defensiva (sanitizeNodeProps) e fallbacks obrigatórios com validação via Zod em cada bloco antes da renderização.

### 2.3. Gap Funcional no BuilderInspector (Controles Genéricos e Upload Falho)
* **Localização:** src/components/admin/builder/builder-inspector.tsx e MediaUploader.tsx.
* **Causa Raiz:** Para blocos sem manifestos estritos definidos em uilderRegistry, o inspetor recorre a um renderizador de propriedades genérico que apenas infere campos básicos (input de texto e switch booleano). Não há seletor de paleta de cores harmoniosa, controle de tipografia avançada, espaçamento dimensional (padding/margin visual com box-model), nem gatilhos para animações de scroll. Além disso, o upload de mídia muitas vezes falha ao persistir a URL pública gerada no Supabase Storage no payload de 
ode.content.
* **Impacto:** O lojista não consegue customizar a experiência visual e as imagens selecionadas desaparecem ao recarregar a página.
* **Solução:** Unificar o sistema de upload com a API do Supabase Storage (store-assets), gravando metadados reais, e adotar o modelo de inspetor em 3 abas (Conteúdo, Estilo & Design Tokens, Animação & Interação).

### 2.4. Ausência de Persistência Transacional para Nós e Páginas Secundárias
* **Localização:** src/services/builder.functions.ts (saveBuilderNodes, publishBuilderVersion).
* **Causa Raiz:** A mutação de salvamento apaga os nós existentes e reinsere o novo array em operações separadas sem uma transação atômica no banco de dados. Se a conexão falhar no meio do processo, o documento de versão fica órfão e com zero nós. Além disso, o schema atual atrela os nós a um único document_id, inviabilizando a navegação e edição de múltiplas páginas de um mesmo portal (ex: /carreiras, /vaga/:id, /minha-conta/contratos).
* **Impacto:** Corrupção de dados ao salvar em conexões instáveis e incapacidade de criar portais multi-páginas.
* **Solução:** Criação da tabela experience_pages e execução atômica de salvamento via RPC PostgreSQL com transação BEGIN...COMMIT.

### 2.5. Renderização Não Virtualizada e Degradação de Desempenho
* **Localização:** src/components/admin/builder/builder-canvas.tsx.
* **Causa Raiz:** O canvas renderiza todos os nós da árvore sequencialmente em um único frame React. Quando uma página ultrapassa 15 blocos com carrosséis e galerias de alta resolução, o tempo de reconciliação do DOM ultrapassa 120ms por keystroke no inspetor.
* **Impacto:** Sensação de interface pesada, travamento ao digitar textos ou deslizar sliders no inspetor.
* **Solução:** Isolar o estado do inspetor com useDeferredValue e renderizar cada bloco em contêineres memoizados (React.memo) com atualização pontual via Zustand ou dispatch seletivo.

---

## 3. INVENTÁRIO FORENSE DE ATIVOS NOS PROJETOS IRMÃOS (TRANSFERÊNCIA E COMPATIBILIZAÇÃO)

Identificamos e auditamos minuciosamente 14 repositórios locais em C:\Users\Excelência Tour SMO\Documents\projetos-referencias. Abaixo estão os ativos prontos que serão transplantados e nativizados dentro do Waesy:

### 3.1. Suíte de Contratos e Documentos (travelagencias / turisagencias)
* **Arquivos-Fonte:**
  - src/components/contracts/ContractClauseLibrary.tsx: Biblioteca completa de cláusulas contratuais catalogadas por categoria, com suporte a variáveis dinâmicas.
  - src/components/trips/contract/ContractEditorModal.tsx: Editor de minutas contratuais com visualização em tempo real de página A4 timbrada.
  - src/components/trips/contract/ContractSignModal.tsx: Modal de assinatura eletrônica com captura de assinatura manuscrita via canvas, hash SHA-256 e validação jurídica.
  - src/routes/m.contract..tsx: Rota pública responsiva mobile-first para o cliente final ler e assinar o contrato pelo smartphone com registro de IP, data/hora e geolocalização.
  - supabase/migrations/20260613030000_contract_tables.sql: Tabelas contracts, contract_clauses, contract_signatures, contract_audit_logs.
* **Destino no Waesy:** Módulo **Waesy Office** integrado ao Builder Universal, permitindo criar modelos de contratos, orçamentos, termos de adesão e recibos com conversão de/para PDF e Word.

### 3.2. Creative Studio & Video Editor com IA (waesy)
* **Arquivos-Fonte:**
  - src/components/studio/canvas/StudioCanvas.tsx: Canvas vetorial com manipulação de objetos gráficos, guias magnéticas e snap-to-grid.
  - src/components/studio/video/VideoStudioTimeline.tsx: Timeline de vídeo multi-track (vídeo, áudio, legendas, overlays) com agulha de reprodução e trim de clipes.
  - src/components/studio/video/VideoStudioEditor.tsx: Orquestrador de edição de vídeo com preview em tempo real e atalhos de teclado.
  - src/components/studio/panels/Mockup3DPanel.tsx: Gerador de mockups 3D de dispositivos (iPhone, MacBook, Embalagens) para exibição de produtos.
  - src/components/studio/panels/BrandKitPanel.tsx: Gerenciador de paleta de cores corporativa, tipografia e logotipos da empresa.
* **Destino no Waesy:** Módulo **Waesy Creative Studio (Canva & CapCut)**, permitindo que as empresas gerem peças publicitárias, posts para redes sociais, cartazes de ofertas e vídeos curtos diretamente no painel.

### 3.3. Gerador de Carrosséis e Peças Visuais (machine / studiomachine)
* **Arquivos-Fonte:**
  - components/CarouselWizard.tsx: Assistente passo a passo para criação de carrosséis temáticos para Instagram e banners de e-commerce.
  - components/SlideRenderer.tsx: Renderizador visual de slides com hierarquia tipográfica automática e balanceamento de contraste.
  - components/BrandEditor.tsx: Editor de identidade visual e regras de design system aplicadas a peças publicitárias.
  - services/geminiService.ts: Integração com IA para geração de títulos persuasivos, slogans e roteiros de carrossel.
* **Destino no Waesy:** Templates automáticos de peças promocionais conectados ao banco de produtos e vitrine da loja.

### 3.4. Biblioteca de 40 Blocos Modulares (cloudblock)
* **Arquivos-Fonte:**
  - BentoGridBlock.tsx, ItineraryBlock.tsx, AttractionCardBlock.tsx, CountdownBlock.tsx, ReviewStreamBlock.tsx, InteractivePricingBlock.tsx, InteractiveMapBlock.tsx.
* **Destino no Waesy:** Inclusão no uilderRegistry do Waesy, elevando o catálogo de seções visuais de 40 para mais de 80 componentes de altíssimo nível estético.

### 3.5. Configurador Visual de PWA Whitelabel (classificadoswaesy)
* **Arquivos-Fonte:**
  - src/pages/PWAEditorPage.tsx: Editor visual de PWA que gera dinamicamente o manifest.json, ícones em múltiplos formatos (maskable 192x192, 512x512), cores de splash screen e atalhos de aplicativo por empresa.
* **Destino no Waesy:** Configuração de PWA nativo para cada Portal do Cliente ou Loja criado através do builder.

---

## 4. BENCHMARKING GLOBAL DE BUILDERS OPEN-SOURCE & PADRÕES DE MERCADO

Para garantir que a engenharia do Waesy Builder opere no mesmo patamar dos maiores construtores do mundo (Wix Studio, Framer, Webflow e Shopify Online Store 2.0), adotamos os seguintes padrões arquiteturais consolidados da indústria:

| Sistema de Referência | Princípio Arquitetural Adotado no Waesy | Benefício Direto |
| :--- | :--- | :--- |
| **Puck (Measured)** | Árvore de nós puramente serializável em JSON (ExperienceNode) com contratos de componentes desacoplados de renderização. | Separação estrita entre o estado do editor e o runtime de produção pública. Zero vazamento de código de admin para o visitante. |
| **Craft.js** | Hooks atômicos de manipulação de canvas (useNode, useEditor) e sistema de conectores DOM para Drag & Drop sem poluição de nós extras. | Fluidez de 60fps no arrastar e soltar de seções e redimensionamento visual de colunas. |
| **GrapesJS** | Isolamento de CSS com escopo por bloco e motor de regras responsivas baseadas em breakpoints padronizados (Desktop, Tablet, Mobile). | Layouts verdadeiramente responsivos sem quebras de layout ou conflitos de especificidade CSS. |
| **Novel / Tiptap** | Editor de texto rico baseado em blocos ProseMirror com menus flutuantes, autocompletar de IA e suporte a slash commands (/h1, /clausula, /tabela). | Experiência de escrita de documentos e contratos idêntica ao Notion e Google Docs. |
| **Polotno / Fabric.js** | Modelo de manipulação gráfica vetorial com suporte a camadas (layers), z-index, alinhamento magnético e exportação para WebGL/PNG. | Base técnica para o gerador de cartazes e flyers estilo Canva. |
| **Wix Studio Standard** | Sistema de animações orientadas a scroll (Scroll-Driven Animations): Fade Up, Parallax, Reveal, Sticky pinning de seções e rotação suave. | Apelo visual imersivo e sensação de produto de ponta sem necessidade de escrever CSS ou JavaScript. |

---

## 5. OS 6 PILARES FUNCIONAIS: CASOS DE USO & STORYBOARDS DETALHADOS

Abaixo estão detalhados os fluxos de ponta a ponta para cada um dos portais e ferramentas que o Builder Universal orquestra:

### 5.1. Pilar 1: Portal do Cliente 360 (Whitelabel da Empresa)
* **Objetivo:** Toda empresa cadastrada no Waesy pode publicar o seu próprio Portal do Cliente (cliente.minhaempresa.com.br ou /c/:slug), onde o cliente final gerencia toda a sua relação com o negócio.
* **Estrutura de Seções do Builder para este Portal:**
  1. portal_hero_header: Logo da empresa, saudação personalizada com foto do cliente, dados cadastrais e botão de sair.
  2. portal_contracts_widget: Lista de contratos vigentes, baixados em PDF ou com alerta  Assinatura Pendente que abre o canvas de assinatura digital.
  3. portal_carnes_bills_widget: Exibição de carnês de pagamento, parcelas em aberto, vencimento, valor com juros/multa automático e botão **Pagar com PIX** (gera QR Code Copia e Cola instantâneo com baixa automática via webhook).
  4. portal_appointments_services_widget: Linha do tempo de agendamentos (consultas, revisões, viagens, serviços) com status (Confirmado, Em Andamento, Concluído) e botão para remarcação.
  5. portal_orders_rentals_widget: Histórico de pedidos de compra, locações de produtos/equipamentos (com data limite de devolução e checklist de entrega) e solicitações de troca.
* **Storyboard de Uso do Consumidor:**
  - **Passo 1:** O cliente recebe um link via WhatsApp da loja para consultar seu carnê de compras.
  - **Passo 2:** O cliente acessa o portal e digita seu CPF ou recebe um Magic Link de 6 dígitos no WhatsApp/SMS.
  - **Passo 3:** O portal carrega com a marca e cores oficiais da loja. O cliente visualiza a aba Carnês, vê a parcela vencendo amanhã, clica em Copiar Código PIX, efetua o pagamento no seu banco e em 3 segundos a tela exibe o comprovante verde de quitação.
  - **Passo 4:** Ele navega para a aba Contratos, abre o contrato de prestação de serviços, assina com o dedo na tela do celular e recebe a via assinada no seu e-mail.

### 5.2. Pilar 2: Portal de Carreiras / Empregos com Marca Própria
* **Objetivo:** Permitir que empresas criem portais de recrutamento e seleção elegantes (agas.minhaempresa.com.br) para atrair talentos sem depender de plataformas terceirizadas caras.
* **Estrutura de Seções do Builder para este Portal:**
  1. careers_hero_banner: Apresentação da cultura da empresa, fotos do time, depoimentos em vídeo e proposta de valor do colaborador (EVP).
  2. careers_job_filters: Filtros rápidos por departamento (Vendas, Engenharia, Suporte, Logística), modalidade (Presencial, Híbrido, Remoto) e tipo de contrato (CLT, PJ, Estágio).
  3. careers_job_grid: Cards de vagas abertas com badges de status, localidade, faixa salarial (opcional) e data limite.
  4. careers_application_form: Modal ou página dedicada da vaga com descrição das responsabilidades, requisitos e formulário de inscrição (Upload de CV em PDF, LinkedIn, Pretensão Salarial e questionário comportamental com até 5 perguntas personalizadas pela empresa).
* **Storyboard de Gestão da Empresa:**
  - Quando um candidato submete o formulário, os dados são inseridos diretamente na tabela hr_candidates e o recrutador da empresa recebe notificação no painel de RH com o currículo pronto para visualização e movimentação no pipeline Kanban de contratação.

### 5.3. Pilar 3: Portal de Reputação & SAC Auditado (Estilo Reclame Aqui)
* **Objetivo:** Fornecer um canal público e transparente de resolução de conflitos, avaliações auditadas e reputação corporativa, com páginas públicas por empresa e possibilidade de reivindicação de perfil.
* **Estrutura de Seções do Builder para este Portal:**
  1. eputation_score_header: Perfil verificado da empresa, nota geral (0 a 10), tempo médio de resposta, taxa de resolução de problemas e percentual de clientes que Voltariam a Fazer Negócio.
  2. eputation_badges_strip: Selos auditados conquistados pela empresa (Selo Waesy Confiança Ouro, Empresa Verificada 100%, Atendimento Humanizado).
  3. eputation_complaint_action: Botão chamativo Reclamar Desta Empresa que guia o consumidor através de uma abertura de chamado segura.
  4. eputation_timeline_feed: Feed público das últimas reclamações com filtro por status (Não respondida, Em réplica, Resolvida, Avaliada). Cada thread exibe a manifestação do consumidor, a resposta oficial da empresa e a avaliação final com estrelas.
  5. eputation_claim_banner: Para empresas ainda não cadastradas oficialmente, banner Você representa esta empresa? Reivindique este perfil gratuitamente e responda seus clientes.
* **Storyboard de Resolução:**
  - O consumidor registra a reclamação com validação de CPF (evitando bots e difamação anônima). A empresa é notificada instantaneamente via webhook/e-mail, acessa o painel do Waesy, envia a resposta com anexo e propõe um acordo. O cliente avalia a solução e a nota da empresa é recalculada em tempo real pela fórmula matemática de reputação.

### 5.4. Pilar 4: BioLinks, Landing Pages & Hotsites de Alta Conversão
* **Objetivo:** Construção de páginas ultra-leves para links de bio de redes sociais (Instagram, TikTok) e páginas de lançamento de produtos ou campanhas sazonais.
* **Estrutura de Seções do Builder:**
  1. iolink_profile_header: Avatar da marca com borda animada, selo de verificado, biografia dinâmica e contadores de seguidores/clientes.
  2. iolink_action_buttons: Botões com ícones vetoriais personalizáveis (WhatsApp direto com mensagem pré-formatada, Catálogo, Localização no Google Maps, Agendamento).
  3. iolink_pix_card: Card interativo para doações, pagamentos rápidos ou caixinha com chave PIX e valor predefinido.
  4. iolink_featured_product: Card de produto em destaque com slider de fotos e botão de checkout direto em 1 clique.
  5. hotsite_countdown_hero: Cronômetro regressivo com ofertas relâmpago, selos de garantia e botão de compra rápida.

### 5.5. Pilar 5: Suíte Waesy Office (Word / Google Docs para Contratos e Documentos)
* **Objetivo:** Substituir ferramentas externas de edição de documentos por um editor embutido na plataforma onde as empresas redigem, personalizam, assinam e gerenciam contratos, orçamentos, termos e notificações.
* **Recursos do Editor:**
  - **Visualização em Folha A4:** Margens normatizadas, numeração de páginas, cabeçalho e rodapé timbrado com a logo da empresa.
  - **Biblioteca de Cláusulas Parametrizadas:** Painel lateral onde o usuário arrasta cláusulas jurídicas pré-aprovadas (cláusula de cancelamento, forma de pagamento, foro de eleição, responsabilidades).
  - **Tags Dinâmicas (Merge Fields):** Inserção de tags como {{cliente.nome}}, {{cliente.cpf}}, {{valor.extenso}}, {{data.vencimento}} que se preenchem automaticamente a partir dos dados do cliente selecionado.
  - **Conversão e Importação de Arquivos:** Importação de arquivos DOCX ou PDF com extração de texto para edição imediata no navegador.
  - **Exportação e Assinatura Eletrônica:** Geração de PDF pronto para impressão ou envio direto para assinatura digital via WhatsApp com token criptográfico e conformidade com a MP 2.200-2/2001.

### 5.6. Pilar 6: Waesy Creative Studio (Canva & CapCut com IA)
* **Objetivo:** Permitir que pequenas e médias empresas produzam materiais visuais profissionais sem precisar contratar agências ou assinar múltiplos softwares.
* **Recursos do Studio:**
  - **Gerador de Flyers e Banners:** Canvas vetorial com dezenas de templates divididos por nicho (Restaurante: Prato do Dia; Turismo: Pacote de Férias; Varejo: Queima de Estoque; Serviços: Cartão de Visita Digital).
  - **Paleta Inteligente da Marca:** Aplicação automática das cores e tipografia da empresa em qualquer template com 1 clique.
  - **Editor de Vídeo com IA:** Timeline multi-track que permite juntar vídeos curtos gravados no celular, aplicar transições suaves, legendas geradas automaticamente por reconhecimento de voz e trilhas sonoras livres de royalties.
  - **Integração com o Builder:** O banner ou flyer criado no Creative Studio pode ser enviado diretamente como imagem de destaque (hero_carousel) para o site ou portal com um único clique.

---

## 6. ARQUITETURA DE DADOS COMPLETA: SCHEMAS DDL, TABELAS E INTEGRAÇÃO

Abaixo está o DDL completo em PostgreSQL que estabelece a fundação de dados para todos os portais e ferramentas do Builder Universal, com isolamento multi-tenant por store_id e políticas de segurança RLS (Row Level Security):

`sql
-- ============================================================================
-- SCHEMA UNIFICADO: BUILDER & EDITOR UNIVERSAL DE EXPERIÊNCIAS Waesy
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS  uuid-ossp;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Enumeração dos Tipos de Portais e Experiências
DO  BEGIN
  CREATE TYPE experience_portal_type AS ENUM (
    'storefront',          -- Vitrine Comercial de E-commerce / Catálogo
    'customer_portal',     -- Portal do Cliente 360 (Contratos, Carnês, Agendamentos)
    'job_board',           -- Portal de Carreiras e Vagas de Emprego
    'reputation_portal',   -- Portal de Reputação e SAC Auditado (Reclame Aqui)
    'biolink',             -- BioLink Mobile-First para Redes Sociais
    'landing_page',        -- Landing Page / Hotsite de Lançamento
    'office_doc',          -- Minuta de Contrato / Proposta / Documento Timbrado
    'creative_graphic'     -- Flyer / Banner / Post para Redes Sociais
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END ;

-- 2. Atualização / Expansão da Tabela de Documentos de Experiência
CREATE TABLE IF NOT EXISTS public.experience_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  portal_type experience_portal_type NOT NULL DEFAULT 'storefront',
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  custom_domain VARCHAR(255),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Configurações de SEO, Favicon, Scripts, PWA
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_store_portal_slug UNIQUE (store_id, portal_type, slug)
);

CREATE INDEX IF NOT EXISTS idx_exp_docs_store_portal ON public.experience_documents(store_id, portal_type);
CREATE INDEX IF NOT EXISTS idx_exp_docs_custom_domain ON public.experience_documents(custom_domain);

-- 3. Páginas Pertencentes a Cada Documento (Multi-page Support)
CREATE TABLE IF NOT EXISTS public.experience_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.experience_documents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL, -- Ex: '/', '/contratos', '/carnes', '/vagas/:id'
  is_home BOOLEAN NOT NULL DEFAULT false,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_doc_page_path UNIQUE (document_id, path)
);

CREATE INDEX IF NOT EXISTS idx_exp_pages_doc ON public.experience_pages(document_id);

-- 4. Versões de Publicação do Documento
CREATE TABLE IF NOT EXISTS public.experience_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.experience_documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
  changelog TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_doc_version UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_exp_versions_doc_status ON public.experience_versions(document_id, status);

-- 5. Árvore de Nós (Componentes Visuais e Seções)
CREATE TABLE IF NOT EXISTS public.experience_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.experience_versions(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.experience_pages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.experience_nodes(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  responsive_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_bindings JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_bindings JSONB NOT NULL DEFAULT '{}'::jsonb,
  animation_rules JSONB NOT NULL DEFAULT '{}'::jsonb, -- Scroll, Hover, Trigger animations
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_exp_nodes_version_page ON public.experience_nodes(version_id, page_id);
CREATE INDEX IF NOT EXISTS idx_exp_nodes_parent ON public.experience_nodes(parent_id);

-- 6. Configuração e Acesso do Portal do Cliente 360
CREATE TABLE IF NOT EXISTS public.customer_portal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  document_id UUID REFERENCES public.experience_documents(id) ON DELETE SET NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_magic_link_auth BOOLEAN NOT NULL DEFAULT true,
  allow_cpf_auth BOOLEAN NOT NULL DEFAULT true,
  enabled_modules JSONB NOT NULL DEFAULT '{
    contracts: true,
    carnes_bills: true,
    appointments: true,
    orders_rentals: true,
    support_chat: true
  }'::jsonb,
  custom_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Portal de Carreiras / Empregos: Tabela de Vagas
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  department VARCHAR(128) NOT NULL,
  work_model VARCHAR(32) NOT NULL DEFAULT 'on_site', -- 'on_site', 'remote', 'hybrid'
  employment_type VARCHAR(32) NOT NULL DEFAULT 'clt', -- 'clt', 'pj', 'internship', 'temporary'
  location VARCHAR(255),
  salary_range VARCHAR(128),
  show_salary BOOLEAN NOT NULL DEFAULT false,
  description_markdown TEXT NOT NULL,
  requirements TEXT[],
  benefits TEXT[],
  custom_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'published', -- 'draft', 'published', 'paused', 'closed'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_job_store_slug UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_jobs_store_status ON public.job_postings(store_id, status);

-- 8. Candidaturas às Vagas de Emprego
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  candidate_name VARCHAR(255) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  candidate_phone VARCHAR(64) NOT NULL,
  resume_url TEXT NOT NULL,
  linkedin_url TEXT,
  salary_expectation NUMERIC(12, 2),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  pipeline_stage VARCHAR(64) NOT NULL DEFAULT 'applied', -- 'applied', 'screened', 'interview', 'offer', 'rejected'
  recruiter_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_job_apps_job_stage ON public.job_applications(job_id, pipeline_stage);

-- 9. Portal de Reputação Estilo Reclame Aqui: Perfil da Empresa
CREATE TABLE IF NOT EXISTS public.company_reputation_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID REFERENCES auth.users(id),
  total_complaints INT NOT NULL DEFAULT 0,
  answered_complaints INT NOT NULL DEFAULT 0,
  resolved_complaints INT NOT NULL DEFAULT 0,
  average_response_hours NUMERIC(6, 1) NOT NULL DEFAULT 0,
  reputation_score NUMERIC(3, 1) NOT NULL DEFAULT 0.0, -- De 0.0 a 10.0
  reputation_badge VARCHAR(32) NOT NULL DEFAULT 'unrated', -- 'bad', 'regular', 'good', 'great', 'ra1000'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Reclamações Públicas e Protocolos Auditados
CREATE TABLE IF NOT EXISTS public.reputation_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  protocol_number VARCHAR(32) NOT NULL UNIQUE,
  consumer_name VARCHAR(255) NOT NULL,
  consumer_email VARCHAR(255) NOT NULL,
  consumer_cpf_masked VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  status VARCHAR(32) NOT NULL DEFAULT 'open', -- 'open', 'replied', 'in_triplicate', 'resolved', 'unresolved'
  consumer_score INT, -- De 1 a 10 atribuído pelo cliente no encerramento
  would_buy_again BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_complaints_store_status ON public.reputation_complaints(store_id, status);

-- 11. Interações da Reclamação (Histórico de Respostas / Réplicas / Tréplicas)
CREATE TABLE IF NOT EXISTS public.reputation_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.reputation_complaints(id) ON DELETE CASCADE,
  author_type VARCHAR(32) NOT NULL, -- 'company', 'consumer', 'system'
  author_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachment_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rep_interactions_complaint ON public.reputation_interactions(complaint_id);

-- 12. Suíte Waesy Office: Documentos, Minutas e Modelos Contratuais
CREATE TABLE IF NOT EXISTS public.office_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'contract', -- 'contract', 'proposal', 'invoice', 'receipt', 'notice'
  content_html TEXT NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Árvore do editor ProseMirror / Tiptap
  header_template TEXT,
  footer_template TEXT,
  variable_schema JSONB NOT NULL DEFAULT '[]'::jsonb, -- Lista de tags dinâmicas suportadas
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Waesy Creative Studio: Banners, Flyers e Criativos Visuais
CREATE TABLE IF NOT EXISTS public.marketing_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  canvas_format VARCHAR(32) NOT NULL DEFAULT 'instagram_square', -- 'instagram_square', 'story_reels', 'landscape_banner'
  width INT NOT NULL DEFAULT 1080,
  height INT NOT NULL DEFAULT 1080,
  layers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Camadas gráficas (texto, formas, imagens)
  thumbnail_url TEXT,
  exported_asset_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitação de RLS em todas as tabelas
ALTER TABLE public.experience_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_reputation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS Básicas (Lojista acessa seus dados; Público lê publicados)
CREATE POLICY Lojistas gerenciam seus documentos de experiência
  ON public.experience_documents FOR ALL
  USING (store_id = (auth.jwt() ->> 'store_id')::uuid);

CREATE POLICY Público visualiza documentos publicados
  ON public.experience_documents FOR SELECT
  USING (true);
`

---

## 7. MOTOR DE ANIMAÇÕES DE SCROLL, CONTROLES DE UI E CMS REAL-TIME

Para elevar a estética visual ao padrão de excelência internacional (Wix Studio / Framer), o Builder incorpora um motor dedicado de microinterações e transições reativas:

### 7.1. Sistema de Animações de Scroll (Wix Studio Standard)
Cada nó possui no seu manifesto o campo nimation_rules. O inspetor disponibiliza os seguintes gatilhos configuráveis sem código:
* **Gatilhos de Entrada no Viewport:**
  - ade-up: Opacidade de 0 a 1 com elevação no eixo Y (24px) e curvas de easing físicas (cubic-bezier(0.16, 1, 0.3, 1)).
  - zoom-in: Escala suave de 0.95 para 1.0 com fade suave.
  - stagger-children: Animação em cascata com atraso programado de 60ms entre cada card ou item de lista.
* **Scroll-Linked Animations (Parallax & Pinned):**
  - parallax-background: Movimento diferencial da imagem de fundo a uma velocidade relativa de 0.2x em relação ao scroll.
  - sticky-section-reveal: A seção fixa temporariamente na tela enquanto o conteúdo interno desliza sobre ela em camadas de profundidade.

### 7.2. Controles de Configuração e Edição de Seção (O Novo BuilderInspector)
O novo inspetor de propriedades é estruturado em três abas contextuais:
1. **Aba Conteúdo:**
   - Edição de títulos, legendas e textos com suporte a RichText embutido.
   - Gerenciador de listas de itens (slides, cards, avaliações, botões) com reordenação por drag-and-drop.
   - **Upload Real de Imagens:** Componente MediaUploader conectado à API de upload do Supabase Storage. O arquivo é enviado imediatamente para o bucket store-assets, com compressão WebP em tempo real no cliente e gravação da URL pública permanente no estado do nó.
2. **Aba Estilo & Design Tokens:**
   - Paleta de Cores com suporte a gradientes harmoniosos e contraste auditado por WCAG AA.
   - Espaçamento Visual (Box Model Padding & Margin com sliders responsivos para Desktop/Tablet/Mobile).
   - Tipografia: Seleção de famílias tipográficas modernas (Inter, Outfit, Plus Jakarta Sans) e ajuste fino de peso, kerning e line-height.
   - Bordas, Cantos Arredondados (ounded-2xl, ounded-full) e Sombras em Camadas (Layered Elevation).
3. **Aba Interação & Dados (Live CMS Binding):**
   - Vínculo direto de nós com entidades do banco (Produtos, Categorias, Vagas, Avaliações, Contratos).
   - Configuração de ações de clique (Abrir WhatsApp, Redirecionar para Checkout, Abrir Modal de Contrato, Copiar PIX).

---

## 8. ORQUESTRADOR DE IA GENERATIVA DE SITES & TEMPLATES NICHADOS

O Builder Universal conta com um módulo de orquestração de IA que cria páginas completas em segundos com base em uma única descrição em linguagem natural.

### 8.1. Arquitetura do Orquestrador de IA
1. **Entrada do Usuário:** O lojista informa o nicho do negócio, público-alvo, paleta de cores preferida e objetivo principal (ex:  Clínica Odontológica especializada em implantes e estética tom elegante em azul marinho e branco objetivo é agendamento de consultas via WhatsApp).
2. **Processamento Cognitivo:** O orquestrador injeta o prompt especializado do nicho e gera uma árvore estrita de nós (ExperienceNode[]) compatível com o schema do Waesy.
3. **Hidratação e Renderização:** O canvas recebe os nós gerados e imediatamente renderiza a vitrine funcional com textos persuasivos, imagens sugeridas de alta qualidade e botões já pré-configurados.

### 8.2. Templates Nativos Pré-Configurados por Nicho
* **Nicho 1: Varejo & Moda Conceito (	emplate_retail_concept):** Hero banner com carrossel dinâmico, vitrine em formato Bento Grid, rail de produtos mais vendidos com tag de parcelamento sem juros, guia de tamanhos e depoimentos em carrossel.
* **Nicho 2: Turismo & Agências de Viagem (	emplate_tourism_agency):** Busca de pacotes com data e destino, cards de passeios com itinerário dia a dia, widget de cotação expressa, galeria de fotos e seletor de contratos online.
* **Nicho 3: Gastronomia & Restaurantes (	emplate_food_menu):** Cardápio interativo categorizado por abas (Entradas, Principais, Bebidas, Sobremesas), banner de entrega rápida, widget de reserva de mesas e status de funcionamento aberto/fechado em tempo real.
* **Nicho 4: Serviços Profissionais & Saúde (	emplate_professional_services):** Tabela de serviços com preços e duração, perfil do corpo clínico/especialistas, avaliações auditadas e formulário integrado de agendamento.
* **Nicho 5: Imobiliário & Locações (	emplate_real_estate):** Grade de imóveis com filtros por quartos/vagas/bairro, tour virtual em vídeo e agendamento de visita presencial.

---

## 9. PIPELINE DE EXPORTAÇÃO 1-CLICK (GITHUB / VERCEL / CLOUDFLARE PAGES)

Além de rodar no domínio próprio fornecido pelo Waesy, o lojista avançado ou agência parceira pode exportar todo o código da página para os provedores líderes de nuvem:

1. **Compilador Estático Interno (exportExperienceAsCode):**
   - Transforma a árvore JSON de nós em um projeto React / Next.js / Vite limpo e autocontido com Tailwind CSS.
   - Gera o arquivo package.json, componentes estáticos e rotas otimizadas para SSR ou SSG.
2. **Conexão com GitHub:**
   - Criação ou atualização automática de um repositório no GitHub da empresa via GitHub REST API com autenticação OAuth / Personal Access Token.
3. **Deploy Automatizado na Vercel e Cloudflare Pages:**
   - Gatilho automático via Webhook ou Vercel Deploy Hook para build imediato na CDN global com certificado SSL automático e TTFB inferior a 50ms em todo o mundo.

---

## 10. PLANO DE ESTABILIZAÇÃO & TRANSFORMAÇÃO EM MICROFASES RECURSIVAS

A execução do Conselho de Engenharia será realizada em 8 Grandes Fases, desdobradas em microfases atômicas de precisão cirúrgica:

### FASE 1: Estabilização Imediata e Correção de Falhas Críticas de Produção
* **Microfase 1.1:** Refatoração de src/services/builder.functions.ts para garantir resolução multi-tenant tolerante em equireAdmin e tratamento de exceções amigável sem quebra de loader.
* **Microfase 1.2:** Sanitização de propriedades no src/components/commerce/experience-renderer.tsx com valores padrão defensivos para prevenir TypeError: undefined.
* **Microfase 1.3:** Correção do MediaUploader.tsx com upload real ao bucket store-assets do Supabase e persistência imediata no nó.

### FASE 2: Expansão do Schema e Criação das Migrações de Dados
* **Microfase 2.1:** Execução da migration unificada contendo experience_portal_type, experience_pages, customer_portal_configs, job_postings, company_reputation_profiles, office_documents e marketing_creatives.
* **Microfase 2.2:** Configuração das políticas de segurança RLS e índices de busca.

### FASE 3: Implementação do Portal do Cliente 360
* **Microfase 3.1:** Construção dos blocos visuais de contratos, carnês com PIX instantâneo, ordens de serviço e histórico de compras.
* **Microfase 3.2:** Criação da rota pública do portal do cliente com autenticação segura sem senha (Magic Link / CPF).

### FASE 4: Implementação do Portal de Carreiras / Empregos
* **Microfase 4.1:** Criação dos blocos de exibição de vagas, filtros dinâmicos e formulário de inscrição com upload de currículo.
* **Microfase 4.2:** Integração do funil de candidaturas com o módulo de RH existente no workspace.

### FASE 5: Implementação do Portal de Reputação Estilo Reclame Aqui
* **Microfase 5.1:** Criação dos blocos de métricas de atendimento, selos de auditoria e timeline pública de reclamações.
* **Microfase 5.2:** Criação do formulário de abertura de reclamação com validação de CPF e fluxo de réplica/tréplica.

### FASE 6: Transplante e Nativização do Waesy Office & Creative Studio
* **Microfase 6.1:** Nativização da biblioteca de cláusulas e editor de contratos de 	ravelagencias para o Waesy Office.
* **Microfase 6.2:** Nativização do canvas de flyers e wizard de carrosséis de machine e waesy para o Waesy Creative Studio.
* **Microfase 6.3:** Nativização da timeline de edição de vídeo de waesy para o Waesy Video Studio.

### FASE 7: Motor de Animações de Scroll e Novo BuilderInspector
* **Microfase 7.1:** Implementação das 3 abas no BuilderInspector (Conteúdo, Estilo, Interação/Scroll).
* **Microfase 7.2:** Aplicação das classes de animação de scroll no ExperienceRenderer.

### FASE 8: Orquestrador de IA, Templates Nichados e Deploy 1-Click
* **Microfase 8.1:** Inclusão dos 5 templates nativos por nicho no seletor de layouts do builder.
* **Microfase 8.2:** Implementação do gerador de páginas por IA a partir de prompt em linguagem natural.
* **Microfase 8.3:** Implementação do exportador de código estático e conector de deploy na Vercel e Cloudflare Pages.

---
**Fim do Dossiê Mestre de Engenharia do Builder Universal Waesy.**
