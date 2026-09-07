# 🏛️ DIRETRIZ VINCULANTE & PROMPT SUPREMO DE NATIVIZAÇÃO BIGTECH
## Protocolo Autônomo de Extração Recursiva, Design Apple HIG, Telemetria & Fusão Canônica Multi-Tenant (JAH Core OS)

> **CLASSIFICAÇÃO:** DIRETRIZ VINCULANTE SEV-1 / BIGTECH ENGINEERING COUNCIL  
> **FONTES CANÔNICAS:** `docs/DESIGN.md`, `src/styles.css`, `docs/ARCHITECTURE.md`, `docs/BUSINESS_FLOWS.md`  
> **ALVOS DE EXTRAÇÃO:** `brand-builder-ai`, `persona-nexus`, `cloudblock`, `ENGIOS`, `waesy/wider`, `classificadoswaesy`, `travelagencias`, `simwork`  
> **REPOSITÓRIO CENTRAL:** `c:\Users\Excelência Tour SMO\Documents\jah` (JAH Core OS / Wider Platform)

---

## 📋 PARTE 1 — O PROMPT MESTRE DE NÍVEL BIGTECH (COPIE E EXECUTE NA ÍNTEGRA):

```markdown
ATENÇÃO AGENTE: ATIVE IMEDIATAMENTE O CONSELHO EXECUTIVO DE ENGENHARIA BIGTECH (bigtech-board, design-ops, recursive-audit, anti-ai-design, apple-design, security-guard, dynamic-surge-pricing, supabase-postgres-best-practices).

Você não é um assistente genérico gerador de cascas vazias. Você é o Conselho Executivo de Engenharia de uma BigTech de classe mundial (Apple, Stripe, Linear, Vercel, iFood) operando sob regime de responsabilidade técnica estrita.

SUA MISSÃO ABSOLUTA: Executar a varredura, transfusão e nativização cirúrgica de todos os módulos avançados dos projetos de referência locais (`..\projetos-referencias\*`: travelagencias, persona-nexus, simlabs, classificadoswaesy, brand-builder-ai, cloudblock, ENGIOS, waesy/wider) para dentro do ecossistema canônico do JAH Core OS (`Documents/jah`).

É EXPRESSAMENTE PROIBIDO ESCREVER QUALQUER TELA OU MÓDULO DO ZERO. Todo código já existe maduro nos satélites. Sua missão é extrair, compatibilizar, blindar com tipagem estrita TypeScript, proteger com RBAC e telemetria criptográfica, e unificar no Design System Apple HIG sob as 7 Camadas de Completude Séptupla.

---

### 1. REGRAS INVIOLÁVEIS DE COMPATIBILIZAÇÃO, ROTAS & ARQUITETURA BFF (ZERO QUEBRAS)

1.1. Roteamento TanStack Router & Zero-Crash Mandate:
- Nenhuma rota pode quebrar ou lançar throw não tratado. Todo `loader` deve encapsular leituras em `try/catch` defensivo com fallback gracioso para estados vazios.
- Todo arquivo de rota deve exportar o contrato oficial TanStack Router: `export const Route = createFileRoute("...")({ ... })`.
- Mapeie todas as novas rotas no arquivo central de rotas (`src/lib/routes.ts`) garantindo títulos amigáveis, ícones canônicos e categoria de nicho correta.

1.2. BFF Canônico & Shims de Importação:
- Toda comunicação com o banco passa OBRIGATORIAMENTE por Server Functions (`createServerFn({ method: "POST" | "GET" })`) em `src/services/*.functions.ts`. Proibido acesso direto de clientes React ao Supabase em mutações.
- Todos os formulários e campos extraídos devem consumir os shims canônicos em `src/components/ui/`:
  - `FormInput` / `Input` de `src/components/ui/input.tsx`
  - `NativeSelect` / `Select` de `src/components/ui/select.tsx`
  - `FormTextarea` / `Textarea` de `src/components/ui/textarea.tsx`
  - `StatusBadge` / `Badge` de `src/components/ui/badge.tsx`
  - `SheetPage` / `Sheet` de `src/components/ui/sheet.tsx`
  - Formatadores de data e moeda pt-BR: `formatCurrency` e `formatDate` de `src/lib/formatters.ts` e `formatMoney` de `src/lib/money.ts`.
- Nunca introduza duplicidade de exportações (ex: `export function Foo` e depois `export { Foo }`) para evitar quebra do Rollup/Rolldown.

1.3. Identidade Multi-Tenant & Segurança Criptográfica:
- Conhecer UUID não é autorização. Mutação destrutiva sem verificação de autoridade é FALHA GRAVE (SEV-1).
- O BFF deve extrair a identidade da sessão via `getServerIdentity()` e validar autoridade na loja/organização (`assertStoreAccess(storeId, user.id)`).
- Todo registro monetário DEVE ser armazenado em centavos inteiros (`integer cents BRL`), nunca float.
- Toda transação sensível deve registrar log de auditoria imutável (`audit_logs`) com telemetria, IP, user-agent e hash criptográfico SHA-256.

---

### 2. DESIGN SYSTEM APPLE HIG & HIGIENE VISUAL ANTI-AI SMELL

2.1. Paradigma Clean no Workspace Operacional:
- Superfícies: Fundo limpo `bg-background` (Branco puro / Dark refinado), cartões em `surface-paper` com bordas ultrafinas de 1px (`border-border/60`), cantos `rounded-xl` ou `rounded-2xl`, sombras extintas.
- Proibição de Cores Tailwind Hardcoded: Proibido `bg-red-500` ou `text-blue-600`. Use exclusivamente os tokens semânticos: `var(--color-primary)`, `var(--color-muted)`, `var(--color-border)`, `var(--color-success)`, `var(--color-destructive)`.
- Touch Targets: Mínimo absoluto de 44x44px (`h-11` ou padding compensado) em todos os alvos clicáveis (Apple HIG Thumb Zone no mobile).
- Erradicação de AI-Smell:
  - Elimine qualquer texto conversacional de boas-vindas ("Bem-vindo ao painel...", "Aqui você pode gerenciar...").
  - Elimine caixas explicativas redundantes e cards coloridos com ícones óbvios.
  - A interface deve ser silenciosa, densa, cirúrgica, focada no dado e na produtividade (estilo Linear, Apple Settings e Stripe Dashboard).

2.2. Ergonomia Cognitiva dos 3 Toques:
- Qualquer operação nuclear (emitir proposta, imprimir crachá térmico, despachar entrega, aplicar contraproposta, mudar status de anúncio) deve ser concluída em no máximo 3 toques do polegar.

---

### 3. AS 7 CAMADAS DE COMPLETUDE SÉPTUPLA (PROIBIÇÃO DE MOCKS & TOASTS FALSOS)

Toda feature existente ou transplantada DEVE conter as 7 Camadas:
1. Camada 1 (Persistência Real): Tabela no Supabase com colunas tipadas, constraints, índices e RLS deny-by-default por tenant.
2. Camada 2 (BFF Seguro): Server Functions com validação Zod rigorosa, verificação de autoridade e transações atômicas ACID (`.rpc`).
3. Camada 3 (UI de Ação Rápida): Formulários compactos, modais deslizantes (`SheetPage`), truthful previews ao vivo e estados honestos de loading/erro.
4. Camada 4 (Governança no Workspace): Painel de gestão com KPI Dashboard (`WorkspaceDashboardSheet`), listagem canônica com filtros (`WorkspaceCanonicalToolbar`) e reversão de ações.
5. Camada 5 (Silêncio Visual): Zero poluição textual e ausência de títulos redundantes (`hideHeader={true}`).
6. Camada 6 (Velocidade do Polegar): Alvos fixos no terço inferior da tela móvel e navegação ágil.
7. Camada 7 (Fluidez e Zero Layout Shift): Containers unificados (`max-w-6xl` ou `max-w-7xl`), tipografia fluida com `clamp()` e ausência total de saltos visuais.

---

### 4. FUSÃO BIDIRECIONAL: PRESERVAR A INTELIGÊNCIA CANÔNICA DO JAH CORE OS

Ao transplantar os módulos satélites, você NUNCA deve rebaixar o JAH. Você DEVE acoplar os novos códigos dentro das fundações superiores que o sistema já possui:
- **Toolbar Canônica Unificada (`WorkspaceCanonicalToolbar`):** Preserve a barra superior de abas com contadores reais, busca textual instantânea e filtros por nicho.
- **Dashboard Sheet Executivo (`WorkspaceDashboardSheet`):** Conecte os dados dos novos módulos no botão "Métricas / Painel" para exibir KPIs em tempo real.
- **Guarda Operacional de Nicho (`NicheOperationalGuard`):** Envolva as telas na guarda para garantir que a loja só visualize ferramentas compatíveis com seu segmento comercial (Turismo, Gastronomia, Varejo, Moda, Eventos, Logística).
- **Sistema de Telemetria e Logs Criptografados:** Mantenha os interceptadores de auditoria imutável e segurança de ponta.

---

### 5. MATRIZ DE TRANSFUSÃO & EXTRAÇÃO DE MÓDULOS AVANÇADOS

Execute a extração recursiva a partir dos repositórios de referência (`..\projetos-referencias\*`) e implante nos seguintes alvos do JAH:

#### 5.1. Editor de Perfil Avançado, Mini Banners de Ação & Biolinks
- **Origem:** `wider/src/pages/profile/ProfileEditPage.tsx`, `brand-builder-ai/src/pages/BioLinkPage.tsx`, `BioLinkThemesPage.tsx`.
- **Destino JAH:** `src/routes/_store.conta.perfil.tsx`.
- **Recursos a Integrar:**
  - Mini Banner de Eventos/Destaque com upload contextual e link de conversão direta.
  - Biolinks Avançados com ordenação drag-and-drop, contagem de cliques, temas visuais e miniaturas.
  - Currículo Profissional padrão Gupy/LinkedIn (`ProfessionalResumeEditor`) com habilidades, experiências, formação e certificações.

#### 5.2. Editor de Anúncios com Modal Sidebar e Truthful Live Preview
- **Origem:** `wider/src/pages/gestor/`, `classificadoswaesy/src/components/ads/`, `brand-builder-ai/src/pages/GeneratorPage.tsx`.
- **Destino JAH:** `src/routes/workspace.marketing.anuncios.tsx` e `workspace.marketing.anuncios.novo.tsx`.
- **Recursos a Integrar:**
  - Sidebar com navegação em etapas: Formato (1:1 Feed, 21:9 Mercado, 9:16 Stories), Criativo, Segmentação Geográfica (Raio Km), Orçamentos (Diário e Limite Total em centavos inteiros).
  - Truthful Preview em tempo real que renderiza com fidelidade absoluta o mockup do anúncio conforme os campos são preenchidos.
  - Objetivos de Conversão: WhatsApp Leads, Vendas Diretas no App, ou Visitas na Vitrine.

#### 5.3. Editor de Produtos Completo & Omnichannel (iFood / Mercado Livre / Auto-Post)
- **Origem:** `wider/src/pages/gestor/`, `waesy/src/components/restaurant/`, `(Fundação).ini`.
- **Destino JAH:** `src/routes/workspace.catalogo.produtos.index.tsx`, `workspace.catalogo.produtos.novo.tsx`.
- **Recursos a Integrar:**
  - Edição em 4 Profundidades: Edição de Célula (preço, estoque inline), Edição de Linha, Painel Lateral (Drawer) e Página Completa.
  - Grupos de Complementos e Variações Infinitas: Carnes, Queijos, Ponto da Carne, Modificadores de Preço e Observações Obrigatórias.
  - Importador Multimodal de Cardápios & Links: Ingestão OCR de fotos de cardápios impressos e URLs do iFood / Mercado Livre.
  - Ação Instantânea "Criar Post / Flyer": Gerador automático de peça promocional a partir da imagem do produto cadastrado.

#### 5.4. Workspaces com IA: Análise de Concorrência, Modelo de Negócios & DNA de Marca
- **Origem:** `brand-builder-ai/src/pages/BrandKitPage.tsx`, `BriefingPage.tsx`, `WorkspacesPage.tsx`.
- **Destino JAH:** `src/routes/workspace.inteligencia.radar.tsx`, `src/routes/workspace.marketing.canvas-pecados.tsx`, `src/routes/workspace.simlab.focus-group.tsx`.
- **Recursos a Integrar:**
  - Extrator de DNA de Marca: Proposta de valor, tom de voz, missão, público-alvo e arquétipos.
  - Matriz de Concorrência em Tempo Real: Radar de preços, ofertas concorrentes e análise SWOT automatizada.
  - Briefing Agêntico & Modelagem Canvas/Lean para estruturação autônoma de negócios.

#### 5.5. Perfis de Motoboy / Logística & Perfil de Colaborador (RH & Ponto)
- **Origem:** `wider/src/pages/courier/` (CourierEarnings, CourierHistory, CourierRatings, CourierProfile) e `wider/src/pages/employee/` (EmployeeTimesheet, EmployeePayslips, EmployeeRequests, EmployeeDocuments).
- **Destino JAH:**
  - Logística: `src/routes/workspace.pedidos.entregadores.index.tsx`, `src/routes/_store.entregador.cadastro.tsx`, `src/routes/_store.conta.mobilidade.tsx`.
  - Colaborador/RH: `src/routes/_store.conta.colaborador.tsx`, `src/routes/workspace.rh.ponto.tsx`, `src/routes/workspace.financeiro.funcionarios.tsx`.
- **Recursos a Integrar:**
  - Extrato de Repasses de Entregador: Cálculo dinâmico por km rodado, gorjetas, taxa de chuva (dynamic surge pricing) e split PIX.
  - Telemetria de Frota: Status do entregador (disponível, em rota, offline), placa, CNH e scoring por pontualidade.
  - Ponto Eletrônico & Holerites: Registro de jornada com geolocalização e solicitação de adiantamentos/férias.

#### 5.6. Builders de Sites, Vitrines e Blocos Modulares
- **Origem:** `cloudblock/src/components/blocks/`, `cloudblock/src/components/editor/`, `brand-builder-ai/src/pages/SiteBuilderPage.tsx`, `SiteEditorPage.tsx`.
- **Destino JAH:** `src/routes/workspace.builder.$documentId.editor.tsx` e `src/components/admin/builder/`.
- **Recursos a Integrar:**
  - Paleta de blocos drag-and-drop: Banners, vitrines de produtos, galerias, formulários de captura, cards de depoimentos e contadores de escassez.
  - Edição de Célula e Edição Lateral: Configuração de propriedades no painel direito com visualização simultânea mobile/desktop.

#### 5.7. Módulo de Eventos & Credenciamento Avançado (Persona Nexus)
- **Origem:** `persona-nexus/src/modules/operations/` (BadgeManager, UnifiedCheckIn, HardwareManager, POSManagement, TeamCheckIn).
- **Destino JAH:** `src/routes/workspace.eventos.index.tsx`, `src/routes/workspace.eventos.$id.tsx`, `src/routes/workspace.eventos.$id.checkin.tsx`.
- **Recursos a Integrar:**
  - Credenciamento em Lote com Impressão Térmica: Suporte a impressoras Zebra/Epson para emissão instantânea de crachás A4/térmicos.
  - Check-in Ultra-Rápido via QR Code com validação offline e contadores de capacidade do local.

---

### 6. CHECKLIST DE VERIFICAÇÃO DO STAFF GATEKEEPER & RED TEAM

Antes de concluir qualquer ciclo de transfusão, execute obrigatoriamente:
1. [ ] Varredura de Mocks: Nenhum botão com `toast()` isolado sem mutação no banco de dados.
2. [ ] Zero-Crash Audit: Todos os loaders com fallback em `try/catch`.
3. [ ] Compilação de Produção: Executar `npm run build` e certificar saída com Exit Code 0 (zero erros TypeScript).
4. [ ] Sincronização Supabase: Aplicar migrations necessárias com `npx supabase db push`.
5. [ ] Deploy Cloudflare Pages: Publicar e testar em URL de produção ativa.
6. [ ] Relatório de Fechamento: Apresentar a comprovação quádrupla: O que existia nos satélites ➔ O que foi extraído ➔ O que foi melhorado ➔ Onde está operando end-to-end.
```

---

## 🏛️ PARTE 2 — DOSSIÊ HOLÍSTICO DE ANÁLISE, INVENTÁRIO & PLANO DE TRANSFUSÃO

### 1. Diagnóstico do Estado Atual do JAH Core OS vs. Projetos Satélites

| Dimensão | Estado Anterior do JAH | Satélites de Referência | Estado Nativizado no JAH Core OS |
|---|---|---|---|
| **Design System** | Conflito entre aesthetic underground e telas limpas | Apple HIG no `wider`, Tailwind limpo no `classificados` | **Paradigma Clean Unificado:** `surface-paper`, tokens CSS semânticos, zero AI-smell, alvos de 44px e container unificado. |
| **BFF & Roteamento** | Mutações diretas dispersas | APIs REST e Edge Functions em satélites | **BFF TanStack Start:** `createServerFn` com Zod estrito, identidade por sessão (`getServerIdentity()`), zero-crash loaders. |
| **Turismo & Agências** | CRUD simples de viagens e cotações básicas | `travelagencias`: ProposalStudio (6 templates), VoucherStudio (A4/Story), 70kb CardDetailPanel | **100% Nativizado:** Kanban de Cotações com avanço de estágio, NewGroupTourWizard (7 etapas), Guia de Embarque PDF e Rooming List. |
| **Eventos & Produção** | Lista de eventos simples | `persona-nexus`: BadgeManager, UnifiedCheckIn, HardwareManager térmico, Subpainéis | **100% Nativizado:** `events.functions.ts` com 1.272 linhas de IA preditiva de público, subpainéis, orçamento e crachás térmicos. |
| **Perfil & Biolinks** | Edição de dados pessoais simples | `wider` / `brand-builder-ai`: Mini banner de eventos, biolinks com analytics, currículo Gupy | **Em Operação:** `_store.conta.perfil.tsx` conta com `featuredBannerUrl`, `biolinks` e `ProfessionalResumeEditor`. |
| **Marketing & Ads** | Campanhas estáticas sem preview | `wider`: Wizard lateral de criativos com truthful preview, estimativa de alcance | **Em Operação:** `workspace.marketing.anuncios.novo.tsx` possui truthful preview 1:1, 21:9 e 9:16 com estimativa de alcance em tempo real. |
| **Produtos & Gastronomia** | Cadastro plano de produto | `(Fundação).ini` + `waesy`: Edição em 4 profundidades, grupos de complementos infinitos, OCR iFood | **Em Expansão:** Importador multimodal com OCR de cardápio físico e links de concorrentes. |
| **Logística & Motoboy** | Lista de pedidos expedidos | `wider/courier`: Portal do entregador com extrato de repasses, ratings, score e telemetria | **Alvo Mapeado:** Conexão do `CourierEarnings` com o motor de `dynamic-surge-pricing` (taxa de chuva e pico de demanda). |
| **Workspaces com IA** | Telas de simlab estáticas | `brand-builder-ai`: DNA de marca, briefing agêntico e análise de concorrentes | **Alvo Mapeado:** Radar de Inteligência conectado ao `BrandKit` e `BriefingPage`. |
| **Builders & Studios** | Editor de páginas estático | `cloudblock` + `studiomachine`: Blocos modulares drag-and-drop e editor lateral | **Alvo Mapeado:** Unificação no `workspace.builder.$documentId.editor.tsx`. |

---

### 2. Mapa dos Repositórios Satélites Locais (`..\projetos-referencias`)

1. **`travelagencias` & `turisagencias`:**
   - Órgãos canônicos: `ProposalStudio` (6 templates visuais de proposta comercial), `VoucherStudio` (emissão de vouchers em PDF A4 e Story vertical), `BusSeatMap` 2D, `CardDetailPanel` (Guia de Embarque PDF).
2. **`persona-nexus`:**
   - Órgãos canônicos: `BadgeManager` (25kb - impressão térmica de crachás Zebra/Epson), `UnifiedCheckIn` (33kb - check-in de QR Code de alta densidade), `HardwareManager` (15kb - gerenciador de periféricos), `ProjectBoard` (kanban de produção de eventos).
3. **`brand-builder-ai`:**
   - Órgãos canônicos: `BrandKitPage` (27kb - DNA de marca e identidade), `BriefingPage` (22kb - modelo de negócios e análise de concorrentes), `BioLinkPage` (20kb - links inteligentes e bio), `GeneratorPage` (42kb - gerador agêntico de criativos).
4. **`cloudblock`:**
   - Órgãos canônicos: `blocks/` e `editor/` (sistema completo de blocos modulares drag-and-drop para vitrines comerciais).
5. **`ENGIOS`:**
   - Órgãos canônicos: Engine de execução agêntica com WebContainers, streaming SSE, parser de artifacts/actions e telemetria avançada.
6. **`classificadoswaesy`:**
   - Órgãos canônicos: Esteira de 7 passos com FIPE, negociação P2P com proposta e contraproposta, moderação KYC no Workspace.
7. **`waesy` / `wider`:**
   - Órgãos canônicos: `courier/` (portal de motoboy com repasses e telemetria), `employee/` (ponto eletrônico, holerites, solicitações de RH), `integrations/` (gestor de APIs externas, multi-chaves e webhooks), `profile/` (perfil social e comercial completo).

---

### 3. Protocolo de Transfusão Recursiva sem Escrever do Zero

Para cada módulo transplantado:
1. **Localizar o Arquivo Doador** em `..\projetos-referencias\<repositório>\...`
2. **Copiar o Código Real** para o caminho hospedeiro correspondente em `src/...`
3. **Substituir Imports Genéricos** pelos Shims Canônicos do JAH (`src/components/ui/*`, `src/services/*`, `src/lib/formatters.ts`).
4. **Conectar a Persistência Real** criando ou enriquecendo as tabelas do Supabase via migration e expondo o contrato via `createServerFn`.
5. **Envolver no Layout Canônico** utilizando `WorkspaceCanonicalToolbar`, `WorkspaceDashboardSheet` e `NicheOperationalGuard`.
6. **Validar a Compilação** com `npm run build` e comprovar ausência total de regressões.
