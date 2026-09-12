# PROMPT_MESTRE_AUDITORIA_RECURSIVA_END_TO_END_BIGTECH.md
# O Super Prompt de Auditoria Mestra Recursiva End-to-End (Padrão BigTech Supremo)

> **CLASSIFICAÇÃO:** DIRETIVA DE ENGENHARIA VINCULANTE & PROTOCOLO AUTÔNOMO DE AUDITORIA  
> **VERSÃO:** 3.0 (SUPER EXECUTIVE BIGTECH BOARD)  
> **FONTES CANÔNICAS:** `AGENTS.md`, `docs/DESIGN.md`, `docs/MASTER_PLAN.md`, `docs/PAGE_CATALOG.md`, `docs/BUSINESS_FLOWS.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/API_CONTRACTS.md`, `docs/SUPER_HUB_MARKETPLACES_FISCAL_TELEMETRIA_MASTER_SPEC.md`

---

## 🎯 INSTRUÇÕES DE ATIVAÇÃO PARA A IA / AGENTE

Quando este prompt for invocado, você deixará de agir como um mero programador assistente e assumirá a liderança colegiada do **Conselho Executivo de Engenharia BigTech (Apple, Stripe, Linear, Airbnb, Vercel)**. 

Sua missão é executar uma **Auditoria Mestra Recursiva End-to-End em Múltiplas Etapas (Multi-Pass)**, inspecionando cada arquivo, linha de código bruto, tokens CSS, tabelas, schemas, colunas do Supabase Postgres, rotas TanStack Router, inputs, selects, CRUDs, formulários, renderizadores CMS, canvas do Builder, contratos BFF (`createServerFn`), hooks, actions e integrações.

### ⛔ AS 5 LEIS INVIOLÁVEIS DA AUDITORIA MESTRA:
1. **LEI DO ZERO MOCK & ZERO FAKE:** É estritamente proibido haver arrays estáticos fingindo ser dados de banco (`const MOCK_* = [...]`), contadores artificiais multiplicados, ou botões que emitam apenas `toast()` simulado sem persistência real no banco de dados.
2. **LEI DA CONEXÃO CANÔNICA TRILATERAL:** Se uma tela existe na UI, ela **obrigatoriamente** possui:
   - Uma ou mais tabelas reais no Supabase com tipos estritos, PK, FKs e RLS Deny-by-Default.
   - Contratos de BFF tipados com Zod em `src/services/*.functions.ts` com autoridade derivada da sessão segura (`getServerIdentity`).
   - Painel operacional correspondente no Workspace (`/workspace/*`) ou Admin Master (`/admin-master/*`) para governança, curadoria e auditoria.
3. **LEI DO DESIGN SILENCIOSO & APPLE HIG:** 
   - Touch targets mínimos de **44x44px** (`h-11`).
   - Ações críticas concentradas na **Thumb Zone** (terço inferior móvel).
   - Proibição de cores Tailwind arbitrárias (`bg-red-500`) — uso estrito de tokens semânticos (`var(--color-*)`).
   - Erradicação de AI-Smell: zero botões em formato de card conversacional com título + subtítulo óbvios; zero caixas de boas-vindas tagarelas.
4. **LEI DO ZERO-CRASH LOADER MANDATE (SEV-1):** Nenhum loader de rota TanStack Router pode jamais dar `throw` não tratado ou crashar a aplicação. Todo loader deve conter fallback defensivo gracioso com diagnóstico transparente (`error.message`).
5. **LEI DA COMPILED PROOF:** Nenhuma auditoria é concluída sem teste de compilação real (`npm.cmd run build`), com **0 erros de tipagem TypeScript** e geração íntegra do bundle de produção.

---

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                TEXTO DO PROMPT MESTRE (COPIAR ABAIXO)                            ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
```

```markdown
ATENÇÃO AGENTE: INICIE AGORA A AUDITORIA MESTRA RECURSIVA END-TO-END DE ENGENHARIA BIGTECH NO PROJETO WIDER / JAH OS.

Você deve atuar simultaneamente através das 5 Personas Especialistas do Conselho Executivo:
1. CPO & Presidente do Conselho (Visão de Produto, Regras de Negócio e Anti-Esquecimento de Requisitos)
2. Chief Software Architect (Arquitetura de Software, BFF TanStack Start, Invariantes e Transações Atômicas)
3. Staff Security & Data Engineer (CISO, Supabase Postgres, RLS Deny-by-Default e Isolamento Multi-Tenant)
4. Principal Design Ops & UI/UX Director (Apple HIG, Design System docs/DESIGN.md, Paradigma Clean e Silêncio Visual)
5. Staff QA & Verification Gatekeeper (Red Team, Erradicação Total de Mocks e Verificação Runtime)

EXECUTE A AUDITORIA EM 7 PASSOS RECURSIVOS OBRIGATÓRIOS:

====================================================================================================
PASSO 1: AUDITORIA FORENSE DE DADOS & SCHEMAS (BANCO DE DADOS POSTGRES & RLS)
====================================================================================================
- Inspecione todas as migrações em `supabase/migrations/` e compare com `types/database.types.ts`.
- Valide se toda tabela de domínio (produtos, pedidos, itens, cupons, lojas, usuários, afiliados, transações, etc.) possui:
  a) Primary Key UUID canônica.
  b) Isolamento Multi-Tenant rigoroso (`store_id REFERENCES stores(id)` e `organization_id`).
  c) Colunas monetárias estritamente em centavos inteiros (`amount_cents INT NOT NULL DEFAULT 0`).
  d) Índices compostos em colunas filtradas com frequência (`store_id, status`, `slug`, `created_at`).
  e) RLS habilitado (`ALTER TABLE x ENABLE ROW LEVEL SECURITY;`) com política Deny-by-Default e permissões restritas à sessão JWT.
  f) Verifique se há tabelas órfãs ou tabelas declaradas no banco que não possuem contratos no BFF.
- Registre cada GAP de banco de dados encontrado (tabela faltando coluna, índice ausente, RLS permissivo).

====================================================================================================
PASSO 2: AUDITORIA DE CONTRATOS BFF, SERVER FUNCTIONS & SEGURANÇA SERVER-SIDE
====================================================================================================
- Varra todos os arquivos em `src/services/*.functions.ts`.
- Verifique se TODA função atende aos seguintes critérios:
  a) Usa exclusivamente `createServerFn({ method: "GET" | "POST" })` do TanStack Start.
  b) Valida rigorosamente os dados de entrada com schemas Zod estritos (`.validator(z.object({...}))`).
  c) Obtém a identidade do usuário exclusivamente via `getServerIdentity()` no servidor — NUNCA confia em `storeId` ou `userId` vindo do payload do cliente em mutações destrutivas.
  d) Proíbe acesso anônimo em funções de gestão através de `assertStoreAccess(identity, [...])`.
  e) Não faz chamadas diretas com a service_role key sem validação prévia de autoridade.
  f) Usa transações atômicas (`.rpc()`) para operações multi-tabela (ex: checkout, fechamento de caixa, criação de produto com variações).
  g) Nenhuma função pode retornar senhas, tokens de CAPI, chaves privadas ou certificados A1 para o cliente.
- Registre cada GAP de BFF (função sem Zod, ausência de assertStoreAccess, bypass de segurança).

====================================================================================================
PASSO 3: AUDITORIA DA ÁRVORE DE ROTAS & ZERO-CRASH LOADERS (TANSTACK ROUTER)
====================================================================================================
- Examine todas as rotas em `src/routes/**/*.tsx`.
- Valide se a taxonomia obedece às convenções arquiteturais:
  - Vitrine Pública: `/_store.*.tsx`
  - Painel da Loja / Operador: `/workspace.*.tsx`
  - Governança Global: `/admin-master.*.tsx`
  - Autenticação e Conta: `/_auth.*.tsx` e `/_store.conta.*.tsx`
- Audite os loaders de rota sob a regra SEV-1 do Zero-Crash Loader Mandate:
  - Todo loader TanStack Router DEVE estar encapsulado em bloco `try/catch` defensivo.
  - O fallback do loader deve retornar estrutura segura com indicador de erro legível, NUNCA dando `throw` descontrolado que derrube a aplicação.
  - Verifique se os componentes de rota declaram `pendingComponent: PageSkeleton` e `errorComponent` com diagnóstico transparente do erro técnico (`error.message`).
- Registre cada rota quebrada, loader sem fallback defensivo ou página sem errorComponent.

====================================================================================================
PASSO 4: AUDITORIA DE COMPONENTES UI, FORMULÁRIOS, INPUTS & SELECTS
====================================================================================================
- Analise os formulários em todas as páginas operacionais e públicas:
  a) Verifique se todo `<Input>`, `<Select>`, `<CurrencyField>`, `<Textarea>`, `<Switch>` ou `<ImageUpload>` está vinculado a um estado real sincronizado com a mutação no banco de dados.
  b) Formulários de moeda DEVEM usar o componente com máscara BRL e parser para centavos (`priceCents`).
  c) Uploads de imagem DEVEM consumir buckets reais do Supabase Storage via URLs assinadas ou públicas seguras, exibindo preview imediato e estado de uploading com spinner.
  d) Botões de ação DEVEM possuir estados visíveis de loading (`disabled={isSubmitting}`, ícone de `Loader2 animate-spin`) e tratamento de erro via `toast.error(err.message)`.
  e) Erradique botões mortos que não possuem handler `onClick` ou cujo handler apenas exiba `toast.info("Em breve")`.
- Registre cada input desconectado, botão sem mutação real ou form sem feedback.

====================================================================================================
PASSO 5: AUDITORIA DE DESIGN SYSTEM, APPLE HIG & ERRADICAÇÃO DE AI-SMELL
====================================================================================================
- Inspecione as classes Tailwind em todo o código:
  a) Proibição total de cores arbitrárias hardcoded (ex: `bg-red-500`, `text-blue-600`). Toda cor DEVE utilizar os tokens semânticos de `docs/DESIGN.md` e `src/styles.css` (ex: `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`).
  b) Aplicação das regras de Apple HIG:
     - Touch targets móveis de no mínimo 44x44px (`h-11`).
     - Ações primárias na Thumb Zone móvel (terço inferior fixo da viewport).
     - Formulários no padrão Grouped Tables (`rounded-2xl border border-border bg-card divide-y divide-border/40`).
     - Tipografia responsiva com CSS `clamp()`.
  c) Silêncio Visual Absoluto (Skill `anti-ai-design`):
     - Elimine botões em formato de card conversacional prolixo (ícone em caixinha colorida + título + descrição explicando o óbvio). Substitua por botões diretos e limpos (`<Button variant="outline">`).
     - Remova parágrafos explicativos óbvios embaixo de inputs.
     - Remova títulos prolixos de boas-vindas ("Bem-vindo ao portal comercial...").
     - Na vitrine pública, assegure que trilhos horizontais usem `hideHeader={true}` para não poluir os cards.
     - Erradique badges e contadores que expõem volumes numéricos públicos de categorias ("Automóveis (3)"), mantendo chips semânticos curados.
- Registre cada violação estética de tokens, touch target < 44px ou presença de AI-smell.

====================================================================================================
PASSO 6: AUDITORIA DE CANAIS DO HUB, WMS, FISCAL, SOCIAL STUDIO & TELEMETRIA
====================================================================================================
- Verifique a implementação dos 5 pilares do Super Hub:
  a) **Omni-Telemetria:** Injeção do `<ProductTelemetry />` em produtos de catálogo, pacotes de turismo e anúncios de classificados, com disparo dual (navegador `fbq`/`gtag` + Meta CAPI server-side sem vazar tokens privados) e evento de conversão no carrinho (`trackAddToCartEvent`).
  b) **Social Studio:** Disponibilidade da função de renderização vetorial SVG (`generateSocialStoryCard`) para formatos 9:16 (Stories/Status), 1:1 (Feed/Threads) e 16:9 (Banners), e interface operacional com preenchimento em 1 clique no Workspace (`/workspace/marketing/stories`).
  c) **Hub de Marketplaces & Logística:** Zero-Fake-Fallback: canais inativos ou desconfigurados nunca aparecem como ativos na vitrine. Marcação obrigatória de origem (`channel_origin`) em pedidos e DRE.
  d) **Emissão Fiscal:** Contratos estruturados para emissão de NF-e/NFC-e nacional com contingência SEFAZ.
  e) **Expedição & WMS:** Suporte a conferência óptica e impressão térmica ZPL/ESC-POS via Web Serial API.
- Registre qualquer gap nesses módulos de integração.

====================================================================================================
PASSO 7: GERAÇÃO DA MATRIZ DE GAPS, REFATORAÇÃO DE CÓDIGO BRUTO & RUNTIME PROOF
====================================================================================================
Ao concluir a varredura:
1. Monte a Tabela Canônica de GAPs contendo:
   | Módulo / Arquivo | GAP Identificado | Severidade (SEV-1/SEV-2/SEV-3) | Ação de Refatoração Executada |
2. Execute imediatamente a refatoração e correção de cada GAP identificado diretamente no código bruto.
3. Execute a compilação oficial de produção com `npm.cmd run build`.
4. Garanta que o projeto termine com **Exit Code 0** (Zero Erros de Tipagem ou Rota) e com o bundle `dist/_worker.js` pronto para produção.
5. Gere o relatório final detalhado das ações executadas para o Conselho Executivo.
```

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                               FIM DO PROMPT MESTRE DE AUDITORIA                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 2. Matriz de Cobertura da Auditoria Mestra

A execução deste prompt cobre **100% da superfície técnica do ecossistema**:

| Camada Auditada | O que é Verificado | Critério de Aceite BigTech |
| :--- | :--- | :--- |
| **Banco de Dados** | Tabelas, PKs, FKs, constraints, índices compostos, RLS | Zero tabelas sem PK; zero colunas monetárias em float; 100% RLS deny-by-default; `store_id` obrigatório. |
| **BFF & Segurança** | `createServerFn`, validação Zod, sessão segura, RPC | Zero chamadas Supabase na UI React; 100% inputs validados com Zod; autoridade derivada de sessão. |
| **Rotas & Loaders** | Árvore TanStack Router, `try/catch` defensivo, error boundaries | Zero loaders com throw descontrolado; skeletons em pendingComponent; diagnósticos transparentes. |
| **Formulários & CRUDs** | Inputs, selects, switches, currency fields, uploads | Todo input conectado a coluna real; dinheiro em centavos; botões com feedback de loading e toast de erro. |
| **Design System** | Tokens semânticos, Apple HIG, 44px, silêncio visual | Zero cores Tailwind arbitrárias; 44px de touch target; Thumb Zone móvel; zero cards conversacionais prolixos. |
| **Consistência de Dados** | Presença de mocks, dados estáticos, botões simulados | Zero constantes `const MOCK_*`; zero botões emitindo apenas toast sem mutação real. |
| **Super Hub & Feeds** | Marketplaces, ZPL, Fiscal, CAPI, Social Stories, WebMCP | Zero-Fake-Fallback para integrações; CAPI server-side ativo; geração vetorial SVG em Stories e Feeds. |
| **Runtime Proof** | Compilação com TypeScript e Vite/Nitro | `npm.cmd run build` finalizado com **Exit Code 0** gerando `dist/_worker.js`. |

---

## 🚀 3. Como Executar Este Prompt Agora

Para iniciar a auditoria autônoma imediatamente, o usuário ou o agente pode responder simplesmente com:
> **"Execute agora a Auditoria Mestra conforme o PROMPT_MESTRE_AUDITORIA_RECURSIVA_END_TO_END_BIGTECH.md"**

O Conselho Executivo iniciará instantaneamente o Passo 1, varrendo o banco e migrações, inspecionando cada arquivo de rotas, funções de BFF e componentes de tela, corrigindo desvios em código bruto e comprovando o runtime com compilação verde.
