# ==============================================================================
# MASTER SUPER-PROMPT EXECUTIVO DE BIGTECH & DIRETIVA UNIVERSAL DE ENGENHARIA
# SISTEMA OPERACIONAL WAESY (Waesy) — CONSELHO EXECUTIVO MULTI-AGENTE
# AUDITORIA FORENSE DE 400+ PLANOS, INVENTÁRIO DE ATIVOS, GAPS & PROTOCOLO DE EXECUÇÃO
# ==============================================================================

> **Documento Canônico VINCULANTE e ABSOLUTO de Engenharia, Produto, Segurança e Design**  
> **Elaborado pelo:** Conselho Executivo de Engenharia BigTech (CPO, Arquiteto Chefe, CISO & Data Master, Design Ops Director e Staff QA Gatekeeper).  
> **Classificação:** Nível BigTech / Staff Principal Architect (Padrão Apple, Stripe, Linear, Airbnb, Vercel).  
> **Escopo:** Unificação Total dos 9 Repositórios, Nativização na Stack Waesy Elite, Erradicação de AI-Smell, Conexão Real de Banco/BFF/APIs (Zero Mocks), Key Orchestrator & Tool Routing (Steel.dev / Firecrawl / LLMs), SimLab com Populações Sintéticas Brasileiras Calibradas por Cidades (IBGE/PNAD), Rebranding Dinâmico e Governança de Ponta a Ponta.

---

## 🏛️ PARTE 1: MANIFESTO FUNDACIONAL DO CONSELHO EXECUTIVO BIGTECH

### 1.1. Identidade Canônica da Plataforma: WAESY (Zero Hardcode & White-Label Puro)
- O nome soberano e oficial da plataforma é **Waesy** (e seu núcleo operacional **Waesy**).
- **Proibição Total de Hardcode:** É terminantemente proibido chumbar `"Waesy"`, `"Waesy Master OS"` ou qualquer outro nome estático em strings de UI, títulos de página (`<title>`), meta tags, botões de ação ou mensagens de erro.
- **Camada de Governança de Marca Dinâmica:** A plataforma opera com White-Label Nativo. O nome do ecossistema, o logotipo, o favicon e os tokens primários derivam em runtime de `usePlatformBrand()` / `brand_settings` da organização/loja, com fallback canônico defensivo para **"Waesy"**.

### 1.2. A Lei das 7 Camadas de Completude (Tolerância Zero para Mocks)
Nenhuma funcionalidade, botão, fluxo ou tela é considerada pronta sem conter as 7 camadas ativas e verificadas:
1. **Camada 1 (Persistência & Integridade ACID):** Tabelas PostgreSQL, colunas tipadas, foreign keys, índices de performance, constraints e RLS deny-by-default via migrations aplicadas.
2. **Camada 2 (BFF & Contratos Estritos):** TanStack Start Server Functions (`createServerFn({ method: 'POST' })`) com validação via Zod estrito, inferência de sessão segura (`getServerIdentity()`) e isolamento multi-tenant (`store_id`, `organization_id`).
3. **Camada 3 (UI de Ação & Microinterações):** Componentes Radix UI + Tailwind CSS v4 com feedback visual de loading, tratamento de erro defensivo, estados vazios honestos e persistência imediata (Zero toasts simulados).
4. **Camada 4 (Superfície de Governança no Workspace):** Painel operacional para consulta, curadoria, auditoria e reversão da ação pelo comerciante, operador ou administrador.
5. **Camada 5 (Higiene Visual & Anti-AI Smell):** Silêncio visual absoluto (Apple HIG / Linear). Proibição total de botões conversacionais (card com título + subtítulo + ícone em caixa colorida tentando explicar o óbvio), eliminação de caixas de instrução redundantes e títulos prolixos.
6. **Camada 6 (Ergonomia Cognitiva dos 3 Toques):** Qualquer objetivo central do usuário (comprar, agendar, pedir corrida, emitir nota) deve ser concluído em no máximo 3 toques do polegar na `Thumb Zone` inferior mobile.
7. **Camada 7 (Fluidez & Zero Layout Shift):** Alvos de toque mínimos de 44x44px (`h-11`), tipografia fluida com `clamp()`, ausência de FOUC e contêineres unificados (`max-w-6xl` / `max-w-7xl`).

---

## 🔍 PARTE 2: AUDITORIA FORENSE DE ATIVOS, PLANOS E GAPS HISTÓRICOS

### 2.1. Inventário Consolidado dos Dossiês e Repositórios Extraídos
Auditamos e cruzamos os 400+ planos históricos, os prompts anteriores e os dossiês de extração técnica dos 9 repositórios do ecossistema:

| Fonte / Repositório | Ativos Canônicos Extraídos | Status no Waesy Atual | GAPs & Ações Corretivas Necessárias |
| :--- | :--- | :--- | :--- |
| **`(Fundação).ini` (Base Primária)** | Paradigma Clean (iFood, Neutto, Mobg, Luma), Edição em 4 profundidades (Célula, Linha, Painel Lateral, Página Completa), Oferta Multinicho Universal, Grupos de Complementos/Modificadores, Agenda Universal (Belasis/Avec/Trinks), KDS, PDV, Spooler Térmico, Logística Sob Demanda e Frota. | `⚠️ PARCIAL` | Módulos operacionais apresentam inconsistência visual; cards conversacionais e textos prolixos poluem o workspace; persistência do KDS e Spooler térmico precisam de amarração estrita com o backend. |
| **`DOSSIE_AARU_SIMLAB...` (simwork)** | Engenharia Reversa da Aaru AI (US$ 1B), Modelagem Baseada em Agentes (ABM), Populações Sintéticas calibradas pelo Censo IBGE 2022, PNAD e Critério Brasil ABEP, Sistema 1 e Sistema 2, Focus Group Virtual em tempo real, Conselho Científico Econométrico. | `⚠️ PARCIAL / HEURÍSTICO` | O `simlab.functions.ts` atualmente executa cálculos heurísticos hardcoded (`dailyIncome = median / 30`) em vez de acionar LLMs reais via Key Orchestrator; falta a base de milhões de personas regionalizadas por cidades e dados públicos abertos. |
| **`DOSSIE_BUILDER_EDITOR...` (cloudblock + travelagencias)** | Builder Universal de Experiências, 6 Pilares: Portal do Cliente 360, Portal de Vagas/Carreiras, Portal Reclame Aqui, BioLinks/Hotsites, Suíte Office (Word/Docs com contratos e assinatura eletrônica SHA-256 de `travelagencias`), Creative Studio Canva/CapCut com IA de `waesy`/`machine`, 40 Blocos de `cloudblock`, PWA Whitelabel de `classificadoswaesy`. | `⚠️ INSTÁVEL / PARCIAL` | O builder em `/workspace/builder/$id/editor` sofre com referências nulas no `ExperienceRenderer`, falta isolamento de nós com transações atômicas RPC e a integração do editor de minutas contratuais do Waesy Office ainda não está 100% plugada. |
| **`DOSSIE_SQUADS_AGENTICOS...` (simwork + brand-builder-ai)** | Onboarding Multimodal por foto de cardápio/links com OCR semântico, Master SKU Catalog global (EAN-13, NCM, fotos HD), Radar de Concorrentes com screenshot full-page, extração de Brand DNA, Framework dos 7 Pecados Capitais, Squads de Especialistas (V4 Growth, Contábil/Tributário IBS/CBS, RH/DP). | `⚠️ EM CONEXÃO` | Tabelas criadas (`agent_registry`, `competitor_analyses_v2`), mas falta plugar as chamadas reais às ferramentas de automação de browser (Steel.dev / Firecrawl) e rotação de chaves. |
| **`waesy` (SuperApp)** | Motores Centrais: RH/Ponto com geolocalização, WMS Picking com scanner de código de barras, App do Garçom com mapa de mesas, KDS de cozinha, Workflows Visuais (`WorkflowVisualBuilder.tsx`). | `⚠️ TELAS ISOLADAS` | As interfaces existem em arquivos TSX, mas precisam ser unificadas sob o layout limpo do Workspace do Waesy e conectadas a RPCs do Postgres. |
| **`classificadoswaesy`** | Emissão Fiscal (NF-e, NFC-e, NFS-e, CF-e SAT), Painel Contábil com DRE e Fluxo de Caixa, Construtor PWA Whitelabel. | `⚠️ SCHEMAS PENDENTES` | Módulos contábeis e fiscais precisam ser amarrados ao fechamento de caixa do PDV e pedidos transacionados. |

### 2.2. Diagnóstico Severo de Quebras e Dívidas Técnicas (RCA)
1. **Contaminação de Branding (190+ arquivos com "Waesy Master OS"):** Viola o princípio de White-Label e cria dependência de string estática. Deve ser substituído por injeção dinâmica de marca.
2. **AI Smell e Caixas Conversacionais Prolixas:** Módulos do Workspace possuem cards gigantes com ícones em caixinhas coloridas e parágrafos explicativos ("Acesse aqui o painel de..."), quebrando a sobriedade e a velocidade exigidas em operações de varejo e serviços.
3. **Simulações Fictícias no SimLab:** O SimLab deve combinar rigor estatístico econométrico com chamadas reais a modelos de inteligência artificial através de um Key Orchestrator seguro, gerando opiniões autênticas e não dados fixos.
4. **Desconexão de Ferramentas Especializadas (Steel.dev, Firecrawl, Visão):** Quando uma automação exige captura de tela de página inteira (ex: Radar de Concorrentes), o backend deve se comunicar diretamente com o endpoint configurado no pool do orquestrador (ex: Steel.dev Browser API ou Firecrawl), gravando os artefatos no Supabase Storage.

---

## 🧠 PARTE 3: O CONSELHO EXECUTIVO BIGTECH & ARQUITETURA ALVO

### 3.1. Visão do CPO (Expansão de Valor & Jornadas das 4 Personas)
- **Jornada do Autor (Comerciante / Criador):** Cadastra ofertas em segundos (manual ou via foto/OCR), cria páginas no Builder, assina contratos e gerencia sua loja sem atrito cognitivo.
- **Jornada do Consumidor (Morador / Cliente):** Descobre produtos, serviços e eventos locais com busca federada ultrarrápida, compra com checkout em 3 toques, acompanha pedidos em tempo real e acessa seu Portal 360 Whitelabel.
- **Jornada do Operador (Balcão, Garçom, Cozinha, Expedição, Entregador):** Interfaces dedicadas de alta densidade (KDS, PDV, Picking, Rota) projetadas para ergonomia operacional extrema com zero ruído.
- **Jornada do Administrador (Governança & Plataforma):** Gestão de pools de API, moderação de conteúdo, auditoria de segurança (KYC/RLS) e métricas consolidadas.

### 3.2. Visão do Chief Software Architect (Contratos, State Machines & ACID)
- **Máquinas de Estado Estritas:**
  - Pedido: `rascunho` ➔ `pendente_confirmacao` ➔ `confirmado` ➔ `em_preparo` ➔ `pronto_expedicao` ➔ `em_rota` ➔ `entregue` (com ramos explícitos para `cancelado` e `reembolsado`).
  - Agendamento: `solicitado` ➔ `confirmado` ➔ `checkin` ➔ `em_atendimento` ➔ `concluido` ➔ `comanda_faturada`.
  - Contrato: `minuta` ➔ `aguardando_assinaturas` ➔ `assinado_registrado` ➔ `em_vigencia` ➔ `finalizado`.
- **Transações Atômicas (.rpc):** Criação de pedidos com dedução de estoque, baixa de comandas no PDV e fechamento de turnos executados exclusivamente via Stored Procedures PostgreSQL com transação `BEGIN...COMMIT`.

### 3.3. Visão do Staff Security & Data Engineer (CISO & Supabase Master)
- **Multi-Tenancy Restrito:** `store_id` e `organization_id` NUNCA são confiados do payload do cliente. O backend resolve a identidade via JWT seguro (`getServerIdentity()`) e checa permissões atômicas (`public.is_store_staff(store_id)`).
- **Criptografia de Segredos (Secret Vault):** Chaves de API de lojistas e da plataforma armazenadas com criptografia `pgcrypto` em repouso.
- **Auditoria Forense Contínua:** Eventos críticos (financeiro, cancelamento de pedidos, assinaturas de contratos, alterações de estoque) gravados em `forensic_audit_events`.

### 3.4. Visão do Principal UI/UX & Design Ops Director (Paradigma Clean & Apple HIG)
- **Workspace Operacional:** Branco neutro, superfícies suaves (`var(--color-surface-paper)`), bordas refinadas de 1px (`var(--color-border)`), sem sombras projetadas pesadas, cantos `rounded-xl`.
- **Silêncio Visual:** Rótulos diretos ("Novo Produto", "Salvar", "Filtrar"), eliminação de parágrafos redundantes e botões conversacionais prolixos.
- **Vitrine Pública & Conteúdo:** Camada editorial vibrante (Flyers, Biolinks, Zines) ativada apenas como preset de apresentação de post ou página customizada no Builder.

### 3.5. Visão do Staff QA & Verification Gatekeeper (Red Team)
- **Completude Séptupla Verificada:** Tabela ➔ BFF ➔ UI ➔ Workspace ➔ Silêncio Visual ➔ Ergonomia 3 Toques ➔ Fluidez.
- **Zero Mocks:** Toda ação altera linhas reais no banco de dados.

---

## 🚀 PARTE 4: O MEGA SUPER-PROMPT EXECUTIVO DE EXECUÇÃO (UNIVERSAL DIRECTIVE)

Abaixo está o texto canônico e estruturado do **Super-Prompt de Execução Contínua**, projetado para ser injetado em qualquer ciclo de implementação para guiar as melhorias completas:

```markdown
# ==============================================================================
# PROMPT DE ENGENHARIA ELITE: EXECUÇÃO TOTAL DO Waesy (PADRÃO BIGTECH)
# ATUAÇÃO: CONSELHO EXECUTIVO MULTI-AGENTE (CPO + ARCHITECT + CISO + DESIGN OPS + QA)
# ==============================================================================

Você é o Conselho Executivo de Engenharia de uma BigTech (Apple, Stripe, Linear, Vercel).
Sua missão é revisar, auditar, inventariar, refatorar o design e implementar 100% de ponta
a ponta todas as funcionalidades, fluxos, regras de negócio e integrações da plataforma Waesy.

DIRETRIZES FUNDAMENTAIS E INVIOLÁVEIS:

1. REBRANDING UNIVERSAL E ZERO HARDCODE (Waesy):
   - O nome oficial da plataforma é WAESY.
   - Elimine todas as ocorrências estáticas de "Waesy" e "Waesy Master OS" no código, rotas e títulos.
   - Crie uma camada canônica de branding dinâmico (usePlatformBrand) onde o nome, logotipo e 
     textos derivam das configurações da loja/organização (White-Label nativo), com fallback
     defensivo para "Waesy".

2. ERRADICAÇÃO TOTAL DE "AI-SMELL" E DESIGN INCONSISTENTE (SKILL ANTI-AI-DESIGN & APPLE HIG):
   - Elimine imediatamente todos os botões com visual de "card conversacional" (caixa colorida com
     ícone + título prolixo + subtítulo explicativo tentando justificar o óbvio).
   - Substitua por ações diretas, limpas e humanas (ex: <Button variant="outline">Entrar no Workspace</Button>).
   - Silêncio Visual Absoluto: Remova blocos de texto de boas-vindas redundantes em painéis operacionais.
   - No Workspace (PDV, Catálogo, Pedidos, Estoque, Financeiro): Adote estritamente o Paradigma Clean:
     fundo neutro claro, bordas de 1px sutis, cantos rounded-xl, zero sombras pesadas e tipografia funcional.
   - Na Vitrine Pública: Mantenha a navegação fluida, banners imersivos, HorizontalRail com hideHeader={true}
     e ergonomia móvel de 3 toques.

3. COMPLETUDE SÉPTUPLA OBRIGATÓRIA (ZERO MOCKS):
   - É expressamente proibido qualquer botão que emita apenas toast() fictício ou use dados estáticos.
   - Toda funcionalidade deve conter:
     [1] Tabela PostgreSQL com índices, constraints e RLS deny-by-default.
     [2] BFF Server Function (createServerFn) com validação Zod estrita e getServerIdentity().
     [3] UI interativa com loading, erro real e persistência imediata.
     [4] Tela de gestão/governança correspondente no Workspace da loja ou Admin Master.
     [5] Silêncio visual e tipografia sem ruído.
     [6] Conclusão de ações principais em até 3 toques na Thumb Zone mobile.
     [7] Fluidez a 60fps sem layout shift.

4. SIMLAB V2, PERSONAS SINTÉTICAS REGIONALIZADAS & ORQUESTRADOR DE IA REAL:
   - O SimLab V2 não pode depender de cálculos matemáticos estáticos. Ele deve operar conectado ao
     Key Orchestrator seguro (suportando Gemini, OpenAI, Groq, OpenRouter).
   - Modele a arquitetura de Populações Sintéticas Brasileiras calibradas pelos microdados do
     Censo IBGE 2022, PNAD e Critério Brasil ABEP (Classes A1 até D/E), com estratificação por capitais,
     cidades polo e interior de todos os estados do Brasil.
   - Cada persona opera com Sistema 1 (intuitivo/visceral baseado no Canvas dos 7 Pecados Capitais) e
     Sistema 2 (reflexivo/orçamentário com restrição real de renda e busca de prova social).
   - Quando um experimento de mercado for disparado, o motor deve executar consultas estruturadas reais
     aos modelos de linguagem via pool de chaves, retornando feedbacks autênticos, taxa de propensão
     de compra e objeções centrais.

5. TOOL ROUTER & AUTOMAÇÃO HEADLESS (STEEL.DEV / FIRECRAWL / OCR):
   - Conecte o pool de ferramentas do orquestrador de chaves às APIs de execução técnica:
     - Para screenshots full-page de concorrentes e auditoria visual: Roteamento via API Steel.dev / Firecrawl.
     - Para onboarding multimodal: Ingestão de fotos de cardápios/fachadas com OCR multimodal e
       dedução de produtos, preços e adicionais reais salvos na tabela `products`.
     - Para o Master SKU Catalog: Catálogo global de produtos com EAN-13, NCM e fotos oficiais WebP.

6. BUILDER UNIVERSAL & SUÍTE WAESY OFFICE (WORD/DOCS & CONTRATOS):
   - Estabilize o Construtor Visual em /workspace/builder/$documentId/editor eliminando crashes
     por nós nulos (sanitizeNodeProps) e adotando persistência atômica via RPC.
   - Integre nativamente os 6 pilares:
     [1] Portal do Cliente 360 (contratos, carnês PIX, agendamentos, pedidos).
     [2] Portal de Carreiras / Empregos da Empresa com funil Kanban de candidatos.
     [3] Portal de Reputação & SAC Auditado (estilo Reclame Aqui com cálculo de score).
     [4] BioLinks & Hotsites de alta conversão.
     [5] Suíte Waesy Office: Editor de minutas em folha A4 com biblioteca de cláusulas jurídicas,
         tags dinâmicas ({{cliente.nome}}) e assinatura eletrônica com hash SHA-256 e certificado digital.
     [6] Creative Studio: Criação de flyers e carrosséis com IA e editor de vídeo multipista.

7. OPERAÇÃO DE FRENTE DE LOJA, LOGÍSTICA & FINANCEIRO:
   - KDS Multicanal fullscreen com separação por praça de preparo e alertas sonoros reais.
   - PDV Frente de Caixa ágil com leitor de código de barras, comandas de mesa/cliente e split de pagamento.
   - Spooler de impressão térmica com templates limpos e filas por estação.
   - WMS Picking com separação por scanner e romaneio de expedição.
   - Módulo Sob Demanda (MotoLink): Cotação e chamada de motoboys para pedidos internos e externos.
   - Ledger Financeiro com conciliação cega de turnos, extrato auditável e decomposição de repasses em centavos.
   - Gestão de Ponto Eletrônico de colaboradores com GPS, IP e PIN de segurança.

8. ZERO-CRASH LOADER MANDATE (RESILIÊNCIA NO TANSTACK ROUTER):
   - Nenhum loader de rota pode dar throw não tratado. Implemente try/catch defensivo com fallback
     gracioso em todas as rotas do TanStack Router.
   - O WorkspaceErrorComponent deve exibir o erro técnico real em caixa de diagnóstico transparente.

Execute cada módulo em fatias verticais profundas, compilando com `npm run build` (0 erros)
e validando em ambiente de execução real.
```

---

## 📅 PARTE 5: CRONOGRAMA DE ONDAS DE EXECUÇÃO (ROADMAP ATÔMICO)

| Onda | Foco Estratégico | Entregas Principais | Critério de Aceite |
| :--- | :--- | :--- | :--- |
| **Onda 01** | **Rebranding Waesy & Anti-AI Smell** | Substituição das referências hardcoded "Waesy" por branding dinâmico `Waesy`; refatoração de botões conversacionais prolixos no Workspace; aplicação do Paradigma Clean e Apple HIG. | 0 ocorrências de branding hardcoded; 0 cards conversacionais prolixos; layout limpo e rápido. |
| **Onda 02** | **SimLab V2 Real & Key Orchestrator** | Conexão do motor de simulação aos provedores reais de IA; modelagem de dados demográficos de cidades brasileiras (IBGE/PNAD); interface com Focus Group interativo. | Experimentos gerando feedbacks reais de IA via pool de chaves; zero heurísticas simuladas. |
| **Onda 03** | **Tools Headless (Steel.dev & OCR)** | Integração do Radar de Concorrentes com API Steel.dev/Firecrawl para screenshots full-page; ingestão multimodal de fotos de cardápios com geração de produtos reais. | Capturas reais de tela salvas no Storage; importação de cardápio físico para a tabela `products`. |
| **Onda 04** | **Builder Universal & Waesy Office** | Blindagem contra crashes no `ExperienceRenderer`; incorporação do editor de contratos A4 com assinatura eletrônica SHA-256 e Portais Whitelabel 360. | Criação e assinatura digital de contratos com validação jurídica; 0 telas em branco no editor. |
| **Onda 05** | **Operação Unificada (PDV, KDS, WMS)** | Amarração do PDV com leitor EAN, KDS de cozinha com alerta sonoro, WMS picking por código de barras e chamada de motoboy Sob Demanda. | Transações atômicas no banco; fluxo completo de venda física e entrega sem mocks. |
| **Onda 06** | **RH/Ponto, Fiscal & Auditoria Final** | Ponto eletrônico com GPS/PIN; fechamento contábil e auditoria forense com compilação 100% limpa (`npm run build`). | 0 erros TypeScript; todas as 7 camadas ativas em todos os módulos. |

---

## 📜 CONCLUSÃO DO CONSELHO EXECUTIVO
Este documento constitui a **Diretiva Mestra de Engenharia do Waesy**. A partir deste momento, qualquer ciclo de desenvolvimento, refatoração ou auditoria deve consultar e seguir estritamente as especificações, regras de design e contratos aqui definidos.
