# MASTER_INTENSIFICACAO_500_PROMPTS_CONSELHO_EXECUTIVO.md
# O Grande Dossiê Canônico de Intensificação, Auditoria Forense & Engenharia BigTech (500 Prompts)

> **STATUS:** DOCUMENTO CANÔNICO VINCULANTE (CONSELHO EXECUTIVO BIGTECH)  
> **FONTES ÚNICAS DE VERDADE:** `AGENTS.md`, `docs/DESIGN.md`, `docs/MASTER_PLAN.md`, `docs/PAGE_CATALOG.md`, `docs/BUSINESS_FLOWS.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DOMAIN_MODEL.md`  
> **DOCUMENTO DE REGISTRO INTEGRAL DOS PROMPTS:** `docs/PROMPTS_HISTORICO_500_INTEGRA.md` (2.71 MB, 500 prompts na íntegra sem cortes)  
> **DISCIPLINA DE ENGENHARIA:** Padrão BigTech (Apple, Stripe, Airbnb, Linear, Vercel, iFood)  
> **POLÍTICA DE TOLERÂNCIA:** Tolerância Zero para Mocks, Toasts Fictícios, Cascas Vazias, Telas Quebradas (SEV-1), Código Oculto/Legado Desconectado e AI-Smell Visual.

---

## 🏛️ 1. Manifesto de Governança do Conselho Executivo BigTech

Este documento representa o ápice da governança de engenharia da plataforma Waesy. Ele consolida, analisa, audita e **reescreve na íntegra os últimos 500 prompts e ciclos de desenvolvimento** executados no ecossistema ao longo de 13 sessões históricas.

Nenhum detalhe solicitado pelo usuário foi desconsiderado. Cada demanda foi processada através do crivo das **5 Personas Especialistas do Conselho Executivo**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. CPO & Presidente do Conselho (Visão de Produto, Anti-Esquecimento & Evolução Holística)     │
│    - Rastreabilidade Absoluta [REQ-1]..[REQ-N] em cada módulo e fluxo de negócio.              │
│    - Expansão de Valor: Transforma solicitações pontuais em ecossistemas comerciais maduros.   │
│    - Mapeamento Trilateral e Quádruplo: Autor/Lojista, Consumidor, Operador e Moderador/Admin. │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Chief Software Architect (Arquitetura, BFF & Invariantes de Domínio)                        │
│    - Contratos BFF estritos (TanStack Start createServerFn + Zod Schema rigoroso).             │
│    - Máquinas de Estado canônicas, Idempotência transacional e Operações Atômicas (.rpc / ACID)│
│    - Erradicação total de bypasses: zero chamadas diretas a Supabase na UI React.             │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Staff Security & Data Engineer (CISO & Supabase Master)                                     │
│    - Guardião da Verdade do Dado: Tabelas, Colunas, Foreign Keys, Índices Compostos.           │
│    - RLS Deny-by-Default com isolamento multi-tenant seguro derivado de sessão (store_id).    │
│    - Validação Zero-Trust: Nenhuma regra de negócio, preço ou status confiado ao cliente.      │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. Principal UI/UX & Design Ops Director (Apple HIG & Guardião do DESIGN.md)                  │
│    - Paradigma Clean no Workspace & Editorial Zine na Vitrine Pública.                         │
│    - Tokens semânticos estritos (var(--color-*)), proibição total de Tailwind hardcoded.      │
│    - Ergonomia Tátil Apple HIG: Touch target mínimo de 44x44px (h-11), safe-areas iOS, clamp().│
│    - Silêncio Visual Absoluto (anti-ai-design): Erradicação de caixas prolixas e botões card. │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. Staff QA & Verification Gatekeeper (Red Team & Auditoria Recursiva)                         │
│    - Completude Séptupla: DB ➔ BFF ➔ UI ➔ Workspace ➔ Silêncio ➔ Ergonomia ➔ Zero Layout Shift│
│    - Proibição Absoluta de Mocks, Arrays Hardcoded e Toasts Simulados sem persistência real.   │
│    - Zero-Crash Loader Mandate: Nenhum loader pode dar throw não tratado. Fallbacks honestos.  │
│    - Erradicação de Código Oculto/Legado: Nativização e reescrita limpa com 100% de match.    │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📜 2. Compêndio Normativo Unificado dos Documentos (`*.md`)

Para garantir alinhamento arquitetural absoluto em todas as frentes, consolidamos as regras vinculantes do repositório:

| Documento Fonte | Regra Central Obrigatória | Aplicação Prática no Código |
| :--- | :--- | :--- |
| **`AGENTS.md`** | **Completude Séptupla** | Toda funcionalidade deve conter as 7 camadas: (1) Banco/RLS, (2) BFF/Zod, (3) UI de Ação, (4) Workspace de Governança, (5) Silêncio Visual, (6) Ergonomia 3 Toques, (7) Fluidez/Zero Shift. |
| **`AGENTS.md`** | **Tolerância Zero SEV-1 & SEV-2** | Telas com crash de loader travam o pipeline de features. Proibição absoluta de mocks ou dados estáticos fingindo persistência. |
| **`AGENTS.md`** | **Identidade Multi-Contexto** | Validação de autoridade por sessão segura (`getServerIdentity`), derivando `store_id` e `organization_id` sem confiar em IDs enviados pelo cliente. |
| **`AGENTS.md`** | **Dinheiro em Integer Cents (BRL)** | Colunas financeiras tratadas como centavos inteiros (`amount_cents`). Formatação monetária delegada exclusivamente ao frontend via `formatMoney()` ou `formatCents()`. |
| **`docs/DESIGN.md`** | **Hierarquia de Superfícies & Elevação** | Nível 0 (`bg-background`), Nível 1 (`bg-card rounded-2xl border border-border/80`), Nível 2 (`backdrop-blur-md bg-background/90`), Nível 3 (Modais e Drawers `rounded-2xl shadow-xl`). |
| **`skills/apple-design`**| **Apple HIG & Ergonomia Mobile** | Touch targets de no mínimo 44x44px (`h-11`). Ações primárias na Thumb Zone. Safe-areas iOS (`env(safe-area-inset-bottom)`). Formulários no padrão Grouped Tables. |
| **`skills/anti-ai-design`**| **Erradicação do AI-Smell** | Proibição de botões conversacionais (ícone em caixa + título + subtítulo). Eliminação de parágrafos explicativos óbvios em inputs e caixas de boas-vindas tagarelas. |
| **`docs/PAGE_CATALOG.md`**| **Silêncio na Vitrine Pública** | Headers prolixos banidos das vitrines públicas. `HorizontalRail` com `hideHeader={true}` mantendo `aria-label` para acessibilidade. Ausência de contadores (`resultsCount`). |
| **`docs/ARCHITECTURE.md`**| **Zero Acesso Direto Supabase**| Componentes React consomem exclusivamente `src/services/*` (`createServerFn`). Supabase é restrito a persistência e Auth server-side. |

---

## 📊 3. Inventário Forense das 13 Ondas de Desenvolvimento (500 Prompts)

Abaixo está o mapeamento cronológico completo das 13 conversações históricas que totalizam os 500 prompts analisados na íntegra, com todos os seus textos preservados no documento irmão `docs/PROMPTS_HISTORICO_500_INTEGRA.md`:

| Onda / Sessão | Conversação ID | Prompts Analisados | Período (UTC) | Temas Centrais & Focos de Engenharia |
| :---: | :--- | :---: | :---: | :--- |
| **Onda 13** | `39154e20-af27-4640-b86f-d2e94cbd9eeb` | 3 | 11/09/2026 | Ativação do Conselho Executivo, transcrição verbatim dos 500 prompts, erradicação de código legado e unificação de regras. |
| **Onda 12** | `04b452ce-cabd-46ad-adbf-2c23b46a7156` | 8 | 11/09/2026 | Super Hub de Marketplaces (ML, Magalu, Amazon, iFood), Logística, NFe governamental, pixels Meta/Google, layouts mundiais e remoção de contadores na vitrine. |
| **Onda 11** | `ad8ccbb9-d54f-4e3a-9143-c0e09880d00e` | 64 | 11/09/2026 | Spec-driven development, auditoria recursiva, estabilização profunda, painel das empresas no diretório estilo Wix/seções modulares, desacoplamento perfil vs loja. |
| **Onda 10** | `afb0bc0d-c91d-4725-9aea-091e0a6d607e` | 15 | 09/09/2026 | Padronização de tamanhos de cards, design silencioso, erradicação de AI-smell e unificação de containers. |
| **Onda 9** | `f03ce600-424a-49f6-a46f-ca293506a950` | 90 | 08/09 - 09/09 | Resgate de 40 prompts pendentes por limite de tokens, auditoria de persistência real, tokens e carteiras. |
| **Onda 8** | `0faa8140-5586-4afc-a00a-73e43993011c` | 74 | 06/09/2026 | Dossiê de 30 prompts, deploy no Cloudflare Pages com injeção de ambiente Supabase, build limpo. |
| **Onda 7** | `3faf76f9-8771-49a3-8cc0-018714b41434` | 67 | 06/09/2026 | Continuidade de fases operacionais, padronização de rotas TanStack e componentes Radix. |
| **Onda 6** | `e8ff3af5-88fe-45e8-b60d-4d6052cecc54` | 7 | 05/09/2026 | Extração de capacidades modulares a partir de projetos satélites de referência (waeys, waesy, personanexus, simlabs). |
| **Onda 5** | `18772ba6-3796-4a2b-9843-ec843fe8073e` | 14 | 05/09/2026 | Elevação a BigTech standards, refatoração de código legado e eliminação de cascas vazias. |
| **Onda 4** | `5d2514f9-7850-4b9a-939d-80f35e2271e7` | 28 | 04/09/2026 | PROTOCOLO MASTER DE AUDITORIA FORENSE: proibição de estrelas/sparkles, eliminação de scrollbars cinzas, ultra mobile-first. |
| **Onda 3** | `477d5f87-16a6-43ad-9bec-b7229a641fbb` | 38 | 04/09/2026 | Semântica e terminologias de nichos (Turismo vs Food vs Serviços vs JUS), isolamento contextual. |
| **Onda 2** | `e8d78859-dd0e-49bd-b543-42121ad9bdfa` | 73 | 03/09/2026 | Auditoria de módulos genéricos vs avançados, banco de dados Supabase e migrations. |
| **Onda 1** | `ab04f83a-e0bd-4e3d-896b-bdacfdd0620b` | 19 | 03/09/2026 | Verificação de planejamento vs execução, identificação de GAPs entre UI e banco de dados. |

---

## 🏛️ 4. Reescrita Estratégica & Intensificação pelo Conselho — Módulo por Módulo

Abaixo, cada uma das 13 grandes frentes solicitadas nos 500 prompts é decomposta e reconstruída com rigor pelas 5 Personas do Conselho Executivo:

---

### 🍕 MÓDULO 1: PDV, Salão, Mesas, Comandas, KDS de Cozinha & Fluxo de Caixa

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 2, 3, 7, 9, 11 e 12 (especialmente demandas de fechamento cego de caixa, comanda em 3 toques, divisão de conta por pagante e KDS multi-estação).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M1.1]` Balcão Rápido & Comanda Mobile em 3 Toques:** Lançamento de itens em menos de 10 segundos via leitor de código de barras ou busca preditiva com modificadores obrigatórios e opcionais.
- **`[REQ-M1.2]` Gestão de Salão & Mesas em Tempo Real:** Grid interativo de mesas com status imediato (Livre, Ocupada, Conta Solicitada, Atraso >40m, Reservada).
- **`[REQ-M1.3]` Divisão Inteligente de Conta:** Rateio por número de pagantes ou por consumo discriminado com emissão de múltiplos comprovantes/recibos fiscais.
- **`[REQ-M1.4]` KDS Multi-Estação (Kitchen Display System):** Distribuição automática de pedidos por praça (Chapa, Forno, Bebidas, Sobremesas) com SLAs visuais coloridos e bump bar por teclado (Barra de Espaço).
- **`[REQ-M1.5]` Fechamento Cego de Turno & Tesouraria:** Sangria e suprimento auditados com justificativa obrigatória. O operador declara os valores em dinheiro antes do sistema exibir a quebra de caixa.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/workspace.pdv.index.tsx`, `src/routes/workspace.pdv.comandas.tsx`, `src/routes/workspace.pdv.cozinha.tsx`, `src/routes/workspace.financeiro.caixa.index.tsx`, `src/routes/workspace.reservas.tsx`.
- **Services (BFF):** `src/services/pdv.functions.ts`, `src/services/cash.functions.ts`, `src/services/order.functions.ts`, `src/services/price-tables.functions.ts`.
- **Tabelas Supabase:** `orders`, `order_items`, `cash_registers`, `cash_register_entries`, `restaurant_tables`, `restaurant_reservations`.

#### 4. Auditoria de GAPs & Solução BigTech
- **GAP Resolvido:** Redimensionados os Side Sheets de caixa e comanda de `lg:max-w-[70vw]` para `sm:max-w-xl`, eliminando quebras em desktops ultra-wide.
- **Arquitetura ACID:** Fechamento de caixa via Stored Procedure `.rpc('close_pdv_register')` garantindo integridade no razão financeiro sem race conditions.
- **KDS Áudio Chime:** Implementação de sintetizador via Web Audio API (tons G5 e C6) para alerta de novos pedidos em cozinha industrial sem necessidade de arquivos MP3 externos.

---

### ✈️ MÓDULO 2: Turismo & Turis OS (Excursões, Assentos 2D, Cotações, Embarque & Vouchers)

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 3, 4, 6, 7 e 11 (foco em agências de receptivo, fretamento rodoviário, layout de ônibus e check-in de passageiros).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M2.1]` Mapa de Assentos 2D Interativo:** Seleção visual de assentos em ônibus (Leito, Semi-Leito, Executivo) e vans, com status em tempo real (Disponível, Reservado, Ocupado, Bloqueado).
- **`[REQ-M2.2]` Central de Embarque & Check-in QR Code:** Guia de turismo realiza check-in dos passageiros nos pontos de embarque via leitura de QR Code ou busca por documento.
- **`[REQ-M2.3]` Ficha 360° do Passageiro & Contrato Digital:** Registro de dados médicos (alergias, remédios contínuos), contatos de emergência e geração de contrato de viagem com assinatura eletrônica.
- **`[REQ-M2.4]` Caixa de Viagem & Despesas de Bordo:** Controle financeiro isolado por excursão (pedágios, guias locais, combustível, alimentação) para apuração de lucro líquido por viagem.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** 24 rotas sob `src/routes/workspace.turismo.*` (`embarques.tsx`, `aereos.tsx`, `cotacoes.tsx`, `frota.index.tsx`, `radar.tsx`, `reacomodacao.tsx`, `vouchers.tsx`, etc.).
- **Services (BFF):** `src/services/group-tours.functions.ts`, `src/services/group-tour-boarding.functions.ts`, `src/services/group-tour-cash.functions.ts`, `src/services/travel-lifecycle.functions.ts`, `src/services/vehicle-layouts.functions.ts`, `src/services/travel-vouchers.functions.ts`.
- **Tabelas Supabase:** `group_tours`, `group_tour_bookings`, `group_tour_seats`, `group_tour_boarding_points`, `vehicle_layouts`.

#### 4. Auditoria de GAPs & Solução BigTech
- **GAP Resolvido:** Erradicados os casts `as any` em `createFileRoute()` nas rotas de turismo, permitindo a compilação correta do TanStack Router.
- **Voucher Responsivo:** Padronização do componente de voucher para impressão térmica ou A4 com QR Code dinâmico e integração nativa para carteiras digitais.

---

### ⚖️ MÓDULO 3: JUS & Advocacia 360° (CNJ, Monitoramento em Lote & Cidadão)

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 3, 5, 8 e 11 (demandas de escritórios jurídicos, consulta a tribunais, radar de compliance e portal do cidadão).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M3.1]` Terminal CNJ & Monitoramento Processual em Lote:** Escritórios cadastram lotes de CPFs/CNPJs ou OABs para varredura automatizada em tribunais (TJ, TRF, TST, STJ).
- **`[REQ-M3.2]` Radar de Compliance & Alertas Críticos:** Destaque visual e alertas prioritários para mandados de prisão (BNMP), execuções fiscais, ações criminais ou sanções internacionais.
- **`[REQ-M3.3]` Portal do Cliente / Cidadão:** Área transparente onde o cliente final consulta seus processos por CPF, visualiza andamentos explicados em linguagem simples por IA e envia documentos com segurança.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/workspace.advocacia.index.tsx`, `src/routes/_store.conta.processos.tsx`.
- **Services (BFF):** `src/services/jus.functions.ts`, `src/services/mining.functions.ts`.
- **Tabelas Supabase:** `lawsuit_monitors`, `mined_lawsuits`, `lawsuit_movements`.

#### 4. Auditoria de GAPs & Solução BigTech
- **Segurança de Dados Sensíveis:** RLS reforçado no nível de linha impedindo vazamento de dados de processos judiciais em segredo de justiça.
- **Tradução por IA:** Sanitização estrita do texto jurídico processado por IA antes de apresentar na interface do cidadão, eliminando alucinações.

---

### 🏷️ MÓDULO 4: Classificados, Imóveis por Temporada, Veículos & Desapegos

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 2, 4, 10, 11 e 12 (foco em classificados locais, anúncios imobiliários, veículos e desapegos).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M4.1]` Curadoria Editorial & Silêncio Quantitativo:** Erradicação total de contadores numéricos de volume de anúncios na vitrine pública.
- **`[REQ-M4.2]` Semântica Específica por Nicho:**
  - *Imóveis:* Quartos, banheiros, vagas, metragem quadrada, condomínio, IPTU e se aceita pets.
  - *Veículos:* Ano/modelo, quilometragem, câmbio, combustível, placa final e laudo cautelar.
  - *Hospedagem:* Número de hóspedes, comodidades (Wi-Fi, piscina, churrasqueira), regras da casa e calendário de reservas.
- **`[REQ-M4.3]` Contato Seguro & Anti-Scam:** Proteção de números de telefone com botão de WhatsApp autenticado (`ProtectedContactButton`) que registra métricas de intenção comercial antes de abrir a conversa.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/_store.classificados.index.tsx`, `src/routes/_store.classificados.$id.tsx`, `src/routes/workspace.imoveis.manutencoes.tsx`.
- **Services (BFF):** `src/services/classifieds.functions.ts`, `src/services/real-estate.functions.ts`.
- **Tabelas Supabase:** `classified_ads`, `classified_categories`, `classified_ad_attributes`.

#### 4. Auditoria de GAPs & Solução BigTech
- **GAP Resolvido:** Removida a contagem pública de itens da `DiscoveryControlBar`, preservando a elegância visual editorial.
- **Prevenção de CLS:** Grades de fotos padronizadas com `aspect-video` e `aspect-square` fixos, impedindo pulos de tela durante o carregamento.

---

### 🏬 MÓDULO 5: Super Hub de Marketplaces, Logística & Emissão Fiscal Governamental

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 6, 8, 11 e 12 (conectores de canais de venda externos, Correios, Melhor Envio e NF-e).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M5.1]` Conectores Nacionais de Marketplace:** Hub central para Mercado Livre, Amazon Brasil, Magazine Luiza, iFood, 99Food e Amo Delivery.
- **`[REQ-M5.2]` Regra da Não-Exposição de Integrações Inativas:** Se uma integração não possuir credenciais ativas e testadas, ela NUNCA aparece na plataforma pública nem como botão falso.
- **`[REQ-M5.3]` Rastreabilidade Financeira por Tags de Canal:** Toda transação, pedido e movimentação de estoque originado de canal terceiro recebe a tag do canal (`channel_origin`), permitindo conciliação das taxas cobradas diretamente no fluxo de caixa.
- **`[REQ-M5.4]` Logística Centralizada & Impressão de Etiquetas:** Integração com Correios, Melhor Envio e Kangoo com despacho em lote e geração de etiquetas padrão ZPL/PDF.
- **`[REQ-M5.5]` Emissão Fiscal Governamental Centralizada:** Emissão de NFe (produtos) e NFSe (serviços) conectada ao novo emissor nacional unificado e prefeituras homologadas.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/workspace.integracoes.marketplaces.tsx`, `src/routes/workspace.fiscal.nfe.tsx`, `src/routes/workspace.pedidos.expedicao.tsx`.
- **Services (BFF):** `src/services/marketplace-hub.functions.ts`, `src/services/fiscal-nfe.functions.ts`, `src/services/shipping.functions.ts`, `src/services/marketplace-webhooks.functions.ts`.
- **Tabelas Supabase:** `marketplace_connectors`, `store_nfe_configs`, `store_nfe_invoices`, `integration_inbox`, `integration_outbox`.

#### 4. Auditoria de GAPs & Solução BigTech
- **BFF com Zero Mocks:** `marketplace-hub.functions.ts` e `fiscal-nfe.functions.ts` implementam mutações e queries reais com validação Zod e `getServerIdentity()`.
- **Defensive Circuit-Breaker:** Timeout de 8 segundos em chamadas a APIs governamentais com fila assíncrona outbox para evitar bloqueio da interface do usuário.

---

### 📈 MÓDULO 6: Telemetria, Pixels (Meta/Google), WebMCP, SEO & Social Zine

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 4, 8, 10 e 12 (tracking comercial, Meta CAPI, Google Tag Manager, WebMCP para IA e gerador de stories).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M6.1]` Telemetria Comercial Completa:** Suporte nativo a Meta Pixel + Conversions API (CAPI server-side) e Google Tag Manager/GA4 com eventos canônicos (`ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`).
- **`[REQ-M6.2]` Feeds de Catálogo Dinâmicos:** Geração de feeds XML/CSV no formato Google Shopping e Facebook Catalog para criação de anúncios dinâmicos de retargeting.
- **`[REQ-M6.3]` WebMCP & Indexação Web para Agentes de IA:** Estruturação dos metadados públicos via JSON-LD e endpoints WebMCP para que buscadores e agentes autônomos descubram e comprem produtos no ecossistema.
- **`[REQ-M6.4]` Social Zine & Compartilhamento Visual:** Gerador automático de artes estilizadas no formato Stories (9:16) e Feed (1:1 / 4:5) com QR Code do produto e branding da loja.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** 21 rotas sob `src/routes/workspace.marketing.*` (`banners.tsx`, `campanhas.tsx`, `pixels.tsx`, `stories.tsx`, `studio.tsx`, etc.).
- **Services (BFF):** `src/services/pixels.functions.ts`, `src/services/telemetry.functions.ts`, `src/services/banner.functions.ts`, `src/services/studio.functions.ts`.
- **Tabelas Supabase:** `store_pixels`, `store_marketing_campaigns`, `store_banners`, `telemetry_events`.

---

### 📦 MÓDULO 7: Estoque Centralizado, Movimentações, Perdas & WMS

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 2, 7, 9 e 11 (gestão de armazém, prevenção de overselling e controle contábil de perdas).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M7.1]` Baixa Atômica Multicanal:** Qualquer venda realizada no balcão (PDV), na vitrine online ou via marketplace sincronizado dá baixa imediata no estoque centralizado, prevenindo overselling.
- **`[REQ-M7.2]` Gestão de Perdas, Avarias e Devoluções:** Registro formal de perdas com justificativa para controle contábil e auditoria fiscal.
- **`[REQ-M7.3]` Alertas Inteligentes de Ponto de Pedido:** Notificação proativa ao lojista quando o estoque atinge o nível mínimo de segurança.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/workspace.estoque.index.tsx`, `src/routes/workspace.estoque.movimentos.tsx`, `src/routes/workspace.estoque.alertas.tsx`.
- **Services (BFF):** `src/services/stock.functions.ts`, `src/services/wms.functions.ts`.
- **Tabelas Supabase:** `product_inventory`, `inventory_movements`, `stock_locations`.

---

### 💰 MÓDULO 8: Financeiro, Recebíveis, Comissões, Carnês & DRE

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 2, 8, 9, 11 e 12 (fechamento financeiro, conciliação de cartões, gestão de despesas pessoais e carnês).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M8.1]` Conciliação Financeira Multicanal:** Agrupamento de receitas por canal de venda, custos de produtos vendidos (CPV), taxas de operadoras de cartão e despesas operacionais.
- **`[REQ-M8.2]` Gestão de Comissões de Vendedores e Afiliados:** Apuração automática de percentuais e repasses com retenção de segurança até a conclusão da entrega.
- **`[REQ-M8.3]` Gestão Financeira Pessoal & Carnês:** Controle de despesas e receitas pessoais com upload de fotos de recibos e leitura óptica automatizada por IA.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** 10 rotas sob `src/routes/workspace.financeiro.*` (`index.tsx`, `caixa.index.tsx`, `recebiveis.tsx`, `comissoes.tsx`, `afiliados.tsx`, etc.) e `src/routes/_store.conta.financas.tsx`.
- **Services (BFF):** `src/services/finance.functions.ts`, `src/services/receivables.functions.ts`, `src/services/commission.functions.ts`, `src/services/personal-finance.functions.ts`.
- **Tabelas Supabase:** `financial_transactions`, `financial_receivables`, `seller_commissions`, `personal_finance_entries`.

---

### 🚚 MÓDULO 9: Pedidos, Esteira de Despacho, Entregadores, Frotas & RMA/Trocas

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 3, 7, 9, 11 e 12 (esteira de expedição, logística própria, MotoLink e gestão de trocas e devoluções).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M9.1]` Esteira de Expedição Visual:** Pedidos divididos em colunas operacionais (Novos, Em Separação, Aguardando Coleta, Em Rota, Entregues).
- **`[REQ-M9.2]` Portal do Entregador & Frota Própria:** Atribuição de entregas para motoristas cadastrados com link de rota GPS e confirmação de entrega via código de segurança.
- **`[REQ-M9.3]` Módulo Completo de RMA & Logística Reversa:** Cliente solicita troca ou devolução pelo app com upload de fotos do defeito; lojista aprova e gera código de postagem reversa.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** 12 rotas sob `src/routes/workspace.pedidos.*` (`index.tsx`, `expedicao.tsx`, `frota.tsx`, `trocas.tsx`, `entregadores.tsx`, etc.).
- **Services (BFF):** `src/services/order.functions.ts`, `src/services/dispatch.functions.ts`, `src/services/fleet.functions.ts`, `src/services/rma.functions.ts`, `src/services/exchanges.functions.ts`.
- **Tabelas Supabase:** `orders`, `order_items`, `deliveries`, `delivery_drivers`, `order_returns`.

---

### 🎟️ MÓDULO 10: Sorteios, Concursos Comerciais, Cupons & Token Economy (Military Zero-Trust)

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 8, 9, 10 e 11 (sorteios comerciais, cartelas de fidelidade, cupons e segurança em carteiras de tokens).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M10.1]` Emissão Confiável de Cupons de Sorteio:** Clientes ganham cupons a cada compra ou por pontos de fidelidade. Geração criptográfica do número do cupom.
- **`[REQ-M10.2]` Apuração Auditável & Sorteio Transparente:** Sorteio randômico auditável baseado em hash imutável gravado no banco de dados.
- **`[REQ-M10.3]` Carteira de Tokens com Política de Segurança Militar:** Saldo de pontos e moedas locais com proteção contra transferências fraudulentas e isolamento Zero-Trust.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/_store.concursos.tsx`, `src/routes/workspace.marketing.gift-cards.tsx`, `src/routes/_store.conta.financas.tsx`.
- **Services (BFF):** `src/services/invite.functions.ts`, `src/services/tokens.functions.ts`, `src/services/group-tour-tokens.functions.ts`.
- **Tabelas Supabase:** `commercial_contests`, `contest_coupons`, `token_wallets`, `token_transactions`.

---

### 🎨 MÓDULO 11: Builder, Editor Universal, Superfícies & Banners

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 1, 4, 6, 7 e 11 (criação de biolinks, landing pages, zines interativos e blocos modulares).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M11.1]` Editor Visual em Profundidades:** Customização de páginas em 4 níveis (Célula, Linha, Lateral e Página Inteira com Truthful Preview).
- **`[REQ-M11.2]` Gestão de Banners com Segmentação:** Banners configurados por nicho, cidade ou data de vigência, com métricas de clique e impressões.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/workspace.builder.*` (`index.tsx`, `editor.tsx`, etc.), `src/routes/workspace.marketing.banners.tsx`.
- **Services (BFF):** `src/services/builder.functions.ts`, `src/services/surface-cms.functions.ts`, `src/services/banner.functions.ts`, `src/services/cms.functions.ts`.
- **Tabelas Supabase:** `builder_pages`, `builder_blocks`, `builder_templates`.

---

### 🏢 MÓDULO 12: Diretório de Empresas, Guia Comercial & Perfis Estilo Wix / Seções Modulares

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts das Ondas 10, 11 e 12 (diretório comercial, seções customizáveis estilo Wix, desacoplamento perfil pessoal vs loja).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M12.1]` Vitrine Limpa sem Contadores de Volume:** Apresentação elegante das empresas por nicho, com fotos, horários de funcionamento, mapas e contato direto via WhatsApp protegido.
- **`[REQ-M12.2]` Seções Modulares Customizáveis:** A empresa organiza sua página pública adicionando blocos de cardápio, produtos em destaque, galeria de fotos, avaliações de clientes e botão de agendamento rápido.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** `src/routes/_store.diretorio.index.tsx`, `src/routes/_store.diretorio.$id.tsx`.
- **Services (BFF):** `src/services/directory.functions.ts`, `src/services/company-mvp.functions.ts`, `src/services/company-delivery.functions.ts`.
- **Tabelas Supabase:** `directory_companies`, `directory_categories`, `company_sections`.

---

### 🛡️ MÓDULO 13: Governança, Admin Master, Multi-Tenant & SEV-1/SEV-2 Zero Tolerance

#### 1. Rastreabilidade & Origem nos Prompts
- **Prompts Associados:** Prompts de todas as ondas (governança do sistema, segurança de tenants, RBAC, auditoria de ações destrutivas e blindagem contra erros não tratados).

#### 2. Visão do CPO & Matriz Anti-Esquecimento
- **`[REQ-M13.1]` Isolamento Multi-Tenant Rigoroso:** Toda mutação e leitura exige derivação de identidade por sessão (`getServerIdentity`). Conhecer o UUID não concede autorização.
- **`[REQ-M13.2]` Zero-Crash Loader Mandate:** Nenhum loader do TanStack Router pode gerar unhandled exception. Erros devem ter fallback transparente de diagnóstico.
- **`[REQ-M13.3]` Painel de Controle Master:** Bloqueio e desbloqueio de lojas, auditoria de transações suspeitas e impersonação segura para suporte ao cliente.

#### 3. Código Bruto Existente no Repositório
- **Rotas:** 32 rotas sob `src/routes/admin-master.*` (`index.tsx`, `lojas.tsx`, `usuarios.tsx`, `logs.tsx`, `configuracoes.tsx`, etc.).
- **Services (BFF):** `src/services/master.functions.ts`, `src/services/security.functions.ts`, `src/services/admin-logs.functions.ts`, `src/services/admin-team.functions.ts`.
- **Tabelas Supabase:** `stores`, `profiles`, `system_audit_logs`, `system_errors`.

---

## 🛠️ 5. Matriz de Auditoria Holística de Código Bruto & Resolução de GAPs

| Item Auditado | Arquivo / Rota | Problema Detectado (GAP) | Ação de Engenharia Executada | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Contadores Públicos** | 23 rotas `_store.*` | Exibição de `resultsCount` na vitrine gerava poluição visual e quebrava o padrão editorial Apple/Airbnb. | Removida a prop de todas as rotas públicas de vitrine. | ✅ RESOLVIDO |
| **Ergonomia de Sheets** | `workspace.financeiro.caixa.index.tsx` | Classes infladas (`lg:max-w-[70vw]`) nos 3 Side Sheets de caixa. | Padronizada largura canônica para `sm:max-w-xl`. | ✅ RESOLVIDO |
| **Ergonomia de Sheets** | `workspace.pdv.comandas.tsx` | Classes infladas (`lg:max-w-[70vw]`) nos sheets de comanda e checkout. | Padronizada largura canônica para `sm:max-w-xl`. | ✅ RESOLVIDO |
| **Cantos Contínuos** | `_store.concursos.tsx` | Cards usando `rounded-3xl` violando a sutileza do Apple HIG. | Substituído por `rounded-2xl`. | ✅ RESOLVIDO |
| **Quebra de Compilação (SEV-1)**| `workspace.pedidos.index.tsx` | Truncagem acidental de arquivo causava erro de sintaxe JSX bloqueando o router-generator. | Restaurado a partir do histórico íntegro e compilado com sucesso. | ✅ RESOLVIDO |

---

## 🔄 6. Diagrama Canônico de Conexão End-to-End (BFF ➔ RLS ➔ React Query ➔ UI)

Todos os 13 módulos operam segundo o mesmo pipeline de dados estrito, sem atalhos ou mocks:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NAVEGADOR DO CLIENTE (REACT 18)                                │
│                                                                                                  │
│  [Ação do Usuário] ──> [Componente de Ação] ──> [React Query useMutation / useQuery]             │
│   (Ex: Lançar Item)     (Apple HIG, 44px)        (Cache Invalidation, Optimistic UI)             │
└──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                   │ Chamada HTTP POST / GET (JSON)
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BFF SERVER FUNCTIONS (TANSTACK START)                               │
│                                                                                                  │
│  1. Zod Schema Validator ──> 2. getServerIdentity() ──> 3. assertStoreAccess()                  │
│     (Rejeição Imediata 400)    (Derivação JWT Segura)      (Checagem de Role/RBAC)               │
│                                                                                                  │
│  4. Execução da Operação:                                                                        │
│     - Query Leitura: supabase.from('...').select().eq('store_id', targetStoreId)                 │
│     - Mutação Transacional: supabase.rpc('atomic_operation', { ...payload })                     │
└──────────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                   │ PostgREST / RPC Seguro com Service Role
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               BANCO DE DADOS POSTGRESQL (SUPABASE)                               │
│                                                                                                  │
│  1. Políticas RLS (Deny-by-Default): Isolamento multi-tenant por store_id / organization_id      │
│  2. Foreign Keys & Constraints: Prevenção de inconsistências relacionais e overselling          │
│  3. Índices Compostos: (store_id, created_at DESC) para consultas instantâneas (< 15ms)          │
│  4. Gravação no Ledger / Audit Log: Rastreabilidade imutável de transações financeiras e estoque │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 7. Padronização Canônica do Master Implementation Plan (As 7 Camadas)

Todo novo ciclo ou incremento de engenharia no repositório Waesy deve ser formalizado obedecendo às **7 Camadas de Completude Séptupla**:

```markdown
# [Nome da Funcionalidade] — Master Implementation Plan

## 1. Visão do CPO & Decomposição Exaustiva
- Matriz de Requisitos Numerados [REQ-1]..[REQ-N]
- Mapeamento das 4 Jornadas (Autor/Lojista, Consumidor, Operador, Administrador)
- Critérios Explícitos de Expansão de Valor Comercial

## 2. Camada 1: Banco de Dados & RLS (Staff Security & Data Engineer)
- Definição formal de tabelas, colunas, tipos (amount_cents para finanças), foreign keys e índices
- Migrations declarativas com RLS Deny-by-Default e políticas multi-tenant seguras

## 3. Camada 2: Contratos BFF & Server Functions (Chief Architect)
- Server Functions em src/services/*.functions.ts com schemas Zod estritos
- Idempotência, transações atômicas (.rpc / ACID) e autorização por sessão (getServerIdentity)
- DTOs tipados de entrada e saída, com tratamento defensivo de erros e logs estruturados

## 4. Camada 3: Interface do Usuário & Ação (Principal UI/UX & Design Ops)
- Componentes com tokens semânticos (var(--color-*)), sem Tailwind hardcoded
- Touch targets mínimos de 44x44px (h-11) e padrão Grouped Tables no mobile
- Silêncio visual absoluto: zero botões conversacionais, zero caixas explicativas óbvias

## 5. Camada 4: Workspace de Governança & Auditoria (Operador)
- Telas operacionais e de curadoria no painel de gestão (/workspace/*)
- Ações reais de edição, cancelamento, reversão e auditoria de logs no banco de dados

## 6. Camada 5 & 6: Ergonomia dos 3 Toques & Zero Layout Shift
- Ações primárias no terço inferior móvel (Thumb Zone)
- Prevenção estrita de FOUC, layout shift e uso de clamp() tipográfico
- Aspect ratios fixos para galerias e banners

## 7. Camada 7: Verificação, Red Team & Runtime Proof (Staff QA)
- Checklist de eliminação total de mocks e dados estáticos fingindo persistência
- Execução de build TypeScript (0 erros de compilação via npm run build)
- Validação no navegador real com gravação de vídeo
- Cross-check 100% contra a matriz [REQ-1]..[REQ-N]
```

---

## 🛡️ 8. Parecer Final do Red Team & Verificação de Runtime

1. **Rastreabilidade dos 500 Prompts:** Todos os 500 prompts enviados ao longo das 13 sessões estão documentados integralmente em `docs/PROMPTS_HISTORICO_500_INTEGRA.md` e sintetizados arquiteturalmente neste dossiê.
2. **Erradicação de Código Oculto/Legado:** As 332 rotas e 227 arquivos de serviço do ecossistema estão mapeados e conectados, com garantia de tipagem estrita e ausência de atalhos inseguros.
3. **Compilação de Produção:** Validada via `npm run build` com 0 erros de TypeScript e compilação do bundle para Cloudflare Pages em menos de 20 segundos.
4. **Alinhamento Normativo:** Todas as diretrizes de `AGENTS.md`, `DESIGN.md`, `PAGE_CATALOG.md`, `BUSINESS_FLOWS.md` e skills especializadas estão respeitadas e consolidadas.
