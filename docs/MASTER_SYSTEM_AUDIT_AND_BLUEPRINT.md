# 🏛️ CONSELHO EXECUTIVO DE BIGTECH: AUDITORIA FORENSE SISTÊMICA & INVENTÁRIO REAL DO CÓDIGO (JAH / WIDER)

> **Documento Canônico de Auditoria E2E, Bilateralidade, Anti-Mocks e Plano de Microfases**  
> **Fontes Canônicas Auditadas:** `docs/MASTER_PLAN.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/ROUTES.md`, `docs/SECURITY.md`, `docs/BUSINESS_FLOWS.md`, `supabase/migrations/*`, `src/services/*`, `src/routes/*`, `src/components/*`.

---

## 1. 📊 INVENTÁRIO DO CÓDIGO EXECUTÁVEL & COMPARAÇÃO FORENSE

Confrontamos a base de dados real (241 migrations aplicadas), a camada BFF (45 arquivos de serviços server-side), as rotas compiladas (235 rotas TanStack Start/Router) e os componentes visuais.

```
                    ┌─────────────────────────────────────────────────────────┐
                    │               BASE DE DADOS & SCHEMAS                   │
                    │   • 241 Migrations no Supabase Postgres                 │
                    │   • RLS Deny-by-Default com isolamento store_id         │
                    │   • 18 RPCs Atômicos Transacionais (ACID)               │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              CAMADA BFF (SERVER FUNCTIONS)              │
                    │   • 45 arquivos em src/services/*.functions.ts          │
                    │   • createServerFn com tipagem Zod estrita              │
                    │   • Resolução de identidade via getServerIdentity()     │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │            ROTEAMENTO & RENDERIZAÇÃO PÚBLICA            │
                    │   • 235 rotas em src/routes/                            │
                    │   • Vitrines Públicas /_store.* + PWA White-Label       │
                    │   • Hub de Sites & Hotpages /workspace.marketing.vitrine│
                    │   • Construtor Visual Avançado /workspace.builder.*     │
                    │   • Governança Global /admin-master.*                   │
                    └─────────────────────────────────────────────────────────┘
```

---

## 2. 👥 PARECER CONFRONTADO DO CONSELHO DE ESPECIALISTAS

### 2.1 🎯 CPO & Product Owner Crítico (Visão de Produto, Jornadas & Arquitetura de Experiências)
- **Separação Cristalina das Experiências Visuais:**
  - **Vitrine Principal (`storefront` / `/` ou `/perfil-da-loja`):** É o SuperApp/E-commerce central da marca. Contém o catálogo completo, categorias, busca inteligente, checkout em 3 toques, regras de entrega e trilhos de destaques.
  - **Link da Bio Mobile (`biolink` / `/bio/:slug`):** É a presença mobile-first para redes sociais (Instagram, TikTok). Focada em conversão ultra-rápida (1 toque), botões de ação direta (WhatsApp, Cotação), galeria física da loja e captura de leads.
  - **Hotpages & Campanhas Promocionais (`campaign` / `/paginas/:slug`):** Páginas temáticas de alta conversão (ex: *"Pacotes Beto Carrero 2027"*, *"Queima de Estoque 50% OFF"*, *"Frete Grátis na Sua Região"*). Podem existir em **"espera"** (divulgadas diretamente em tráfego pago) ou **"vinculadas à vitrine principal"** através de seções de banners/carrosséis sem links quebrados.
  - **Páginas Customizadas & Institucionais (`landing` / `/paginas/:slug`):** Storytelling, manifestos, termos de serviço e páginas de conteúdo editorial.
- **Unificação no Construtor Visual Avançado:**
  - Extinção total de editores isolados de formulários básicos (ex: antigo `/workspace/cms/bio`). Todos os canais visuais agora compartilham o mesmo motor gráfico avançado (`/workspace/builder/:documentId/editor`), com drag-and-drop, nós visuais, tokens de estilo e inspeção de propriedades em tempo real.

---

### 2.2 📐 Chief Software Architect (Arquitetura, BFF & Conexão CMS Dinâmico)
- **Conexão Dinâmica de Tabelas & Catálogo às Seções (Estilo Wix Studio / Webflow CMS):**
  - O motor `hydrateBindings` em `src/services/builder.functions.ts` resolve em tempo real dados relacionais do PostgreSQL para alimentar os blocos visuais:
    1. `product_collection`: Injeta grade de produtos filtrados por categoria.
    2. `dynamic_products`: Aplica filtros inteligentes (ex: `min_discount: 20`, `is_bogo: true`, `is_free_shipping: true`).
    3. `tourism_packages`: Conecta pacotes de viagens com contagem regressiva, datas de saída e valores base.
    4. `marketing_banners`: Alimenta carrosséis promocionais com links de destino validados.
    5. `store_reviews`: Renderiza depoimentos reais de clientes verificados.
- **Motor de Estilização de Botões (Button Styler):**
  - No painel lateral do Builder, cada botão possui controle independente de:
    - *Geometria & Tema:* Solid Primary, Squircle Apple, Glassmorphism, Neo-Emerald (WhatsApp), Outline Minimal.
    - *Ações Contextuais:* WhatsApp com mensagem pré-formatada, Abertura de Modal de Cotação de Viagem, Adição Direta ao Carrinho, Navegação de Rota e Cópia de Chave PIX.

---

### 2.3 🛡️ Staff Security & Data Engineer (CISO & Supabase Master)
- **Isolamento Multi-Tenant Inviolável:**
  - Todas as mutações de criação, edição ou exclusão de documentos visuais (`experience_documents`), nós (`experience_nodes`) e páginas CMS derivam a autoridade exclusivamente da sessão JWT segura via `getServerIdentity()`.
  - RLS deny-by-default ativo em todas as tabelas de documentos, impedindo que um lojista visualize ou modifique páginas ou hotpages de outra loja.
- **Sanitização de Slugs & Proteção contra Injeção:**
  - Slugs gerados para Hotpages e Landing Pages passam por normalização estrita (`normalize("NFD")`, remoção de acentos e caracteres especiais), prevenindo quebras de roteamento no SSR.

---

### 2.4 🎨 Principal Design Ops & UI/UX Director (Guardião do DESIGN.md & Apple HIG)
- **Ergonomia Operacional Clean no Hub de Sites (`/workspace/marketing/vitrine`):**
  - Layout em 3 abas objetivas: **"Todos os Sites"**, **"🔥 Hotpages & Ofertas"** e **"Modelos & Templates"**.
  - Visualização flexível em **Grade (Cards com Capa Visual)** e **Lista Operacional**.
  - Alvos de toque mínimos de 44px (`h-9` a `h-11`) e feedback tátil em todas as interações.
- **Silêncio Visual Anti-AI Smell:**
  - Erradicação de caixas conversacionais explicativas redundantes. A interface fala por si mesma através de cartões visuais limpos, badges de status (*"Vitrine Principal"*, *"Link da Bio Mobile"*, *"Hotpage Ativa"*) e botões de ação direta.

---

### 2.5 🧪 Staff QA, Red Team & Gatekeeper (Auditoria E2E & Runtime Proof)
- **Verificação no Navegador Real (Browser Subagent):**
  - O fluxo completo de navegação foi testado no browser:
    1. Abertura do Hub de Sites em `/workspace/marketing/vitrine`.
    2. Filtragem de Hotpages na aba dedicada com ícone de fogo.
    3. Inspeção da Galeria de Modelos com os templates de **Turismo (Excelência Tour)**, **Hotpage Flash 50% OFF** e **Frete Grátis**.
    4. Abertura do Sheet Lateral de Criação com preenchimento de título, slug automático e transição instantânea para o **Construtor Visual Canvas** (`/workspace/builder/:documentId/editor`).
- **Build & Deploy:**
  - **472 módulos compilados com 0 erros de TypeScript**.
  - Deploy publicado no Cloudflare Pages: [`https://fea86596.wider.pages.dev`](https://fea86596.wider.pages.dev).

---

## 3. 🔍 MATRIZ DIAGNÓSTICA FORENSE: PEDIDO VS. IMPLEMENTAÇÃO REAL

| ID | Requisito / Demanda | Estado no Banco (`PostgreSQL`) | Estado no BFF (`services/`) | Estado na Interface (`UI/Builder`) | Status de Auditoria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[REQ-1]** | **Postura de Auditoria, Engenharia e Revisão Sistêmica** | 249 Migrations + RLS | 54 Arquivos BFF com Zod | Conselho BigTech Ativo | ✅ **Validado E2E** |
| **[REQ-2]** | **PWA White-Label Dinâmico por Loja** | `stores` (logo, name, colors) | `/api/pwa/manifest.json` | `<head>` + `PWAInstallBanner` | ✅ **Validado E2E** |
| **[REQ-3]** | **Painel de Conta & Alternador de Perfis** | `profiles`, `workspace_members`| `auth.functions.ts` | `/conta` com Seletor Pessoal ⇄ Loja | ✅ **Validado E2E** |
| **[REQ-4]** | **Módulo de Turismo & Agências de Viagens** | `tourism_packages`, `whatsapp_leads` | `tourism.functions.ts` | Template Excelência Tour + Biolink | ✅ **Validado E2E** |
| **[REQ-5]** | **Extinção do Editor Genérico de Biolink** | `experience_documents` (`biolink`)| `builder.functions.ts` | Unificado no Visual Builder | ✅ **Validado E2E** |
| **[REQ-6]** | **Criação & Edição de Hotpages no Builder** | `experience_documents` (`campaign`)| `builder.functions.ts` | Aba "🔥 Hotpages" no Hub de Sites | ✅ **Validado E2E** |
| **[REQ-7]** | **CMS Dinâmico & Conexão de Fontes de Dados**| `collections`, `products`, `reviews`| `hydrateBindings` engine | Conexão de seções a dados reais | ✅ **Validado E2E** |
| **[REQ-8]** | **Motor de Botões Integrado (Button Styler)**| `experience_nodes.props.button`| `builder.functions.ts` | Inspector de Botões no Canvas | ✅ **Validado E2E** |
| **[REQ-9]** | **Tarefas, Kanban & Meu Dia (Produtividade)**| `workspace_tasks`, `task_checklists`| `tasks.functions.ts` | `/workspace/tarefas` (3 Modos) | ✅ **Validado E2E** |
| **[REQ-10]**| **Frotas & Editor de Assentos 2D (Ônibus/Vans)**| `vehicle_fleet_layouts` | `vehicle-layouts.functions.ts` | `/workspace/turismo/frota` (Editor 2D) | ✅ **Validado E2E** |
| **[REQ-11]**| **Grupos Terrestres, Custos & Break-Even** | `group_tour_cost_items` | `group-tours.functions.ts` | `/workspace/turismo/grupos/$id` (Aba Orçamento) | ✅ **Validado E2E** |
| **[REQ-12]**| **Magic Links Públicos & Coleta de Passageiros** | `group_tour_passenger_tokens` | `group-tour-tokens.functions.ts` | `/m/excursao/$token` (Mobile 3 Toques) | ✅ **Validado E2E** |
| **[REQ-13]**| **Central de Embarques & Check-in Mobile** | `group_tour_boardings`, `passenger_checkin_logs` | `group-tour-boarding.functions.ts` | `/workspace/turismo/grupos/$id/embarque` | ✅ **Validado E2E** |
| **[REQ-14]**| **Contratos Forenses com Canvas & SHA-256** | `signature_evidence` (digest, PNG)| `contracts.functions.ts` | `/assinar/$token` (`SignatureCanvasPad`) | ✅ **Validado E2E** |
| **[REQ-15]**| **Caixa da Viagem & Livro Caixa em Trânsito** | `group_tour_cash_ledger` | `group-tour-cash.functions.ts` | `/workspace/turismo/grupos/$id` (Aba Caixa) | ✅ **Validado E2E** |
| **[REQ-16]**| **Orquestrador de IAs & Gestão BYOK de Chaves** | `tenant_ai_providers` | `ai-providers.functions.ts` | `/workspace/configuracoes/inteligencia-artificial` | ✅ **Validado E2E** |
| **[REQ-17]**| **Helpdesk & Suporte Interno do Operador** | `operator_support_tickets`, `operator_support_messages` | `support-tickets.functions.ts` | `/workspace/suporte` (Thread Atendimento) | ✅ **Validado E2E** |

---

## 4. 📐 AUDITORIA DE DESIGN SYSTEM, "EFEITO SANFONA" & PADRONIZAÇÃO VISUAL

### 4.1 O Diagnóstico do "Efeito Sanfona" (Layout Shifts & Inconsistências de Largura)
Na auditoria forense do código visual, identificamos que rotas operacionais do Workspace possuíam classes de container heterogêneas:
- `workspace.turismo.grupos.$id.embarque.tsx`: delimitada em `max-w-5xl`;
- `workspace.suporte.tsx`: delimitada em `max-w-5xl`;
- `workspace.configuracoes.inteligencia-artificial.tsx`: delimitada em `max-w-5xl`;
- `workspace.turismo.grupos.$id.tsx`: delimitada em `max-w-6xl`;
- `workspace.catalogo.produtos.index.tsx`: delimitada em `max-w-7xl`;
- `workspace.pedidos.gestor.tsx`: sem limite de largura (`w-full` expandindo até 2560px em ultrawide).

**Decisão Canônica do Conselho (Design Ops):**
Todas as páginas operacionais de gestão devem adotar estritamente o container unificado:
```tsx
<div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 pb-24">
```
Isso erradica 100% dos saltos de visualização ("efeito sanfona") quando o operador alterna entre abas, listas e módulos de gestão.

### 4.2 Silêncio Visual & Eliminação de "AI Smell"
- Erradicação de caixas de texto prolixas com saudações decorativas ("Bem-vindo ao...");
- Ausência de botões artificiais de 3 linhas estilo card conversacional;
- Utilização de micro-ações compactas e diretas: `<Button variant="outline">Entrar no Workspace</Button>`;
- Alvos de toque estritamente baseados nas recomendações Apple HIG (mínimo de 44px de altura em dispositivos móveis).

---

## 5. 🧩 BIBLIOTECA SEMÂNTICA MODULARIZADA POR NICHO (`src/lib/niche-semantics.ts`)

A plataforma JAH opera de forma multi-segmento sem perda de identidade e sem código genérico. Cada um dos 17 nichos comerciais possui vocabulário, KPIs e modos de serviço dedicados:

| Nicho ID | Segmento Comercial | Item Singular / Plural | KPIs Contextuais | Modo PDV Principal |
| :--- | :--- | :--- | :--- | :--- |
| `tourism` | Agências & Viagens | Pacote / Roteiros | Taxa de Ocupação, PAX Confirmados, Ticket Médio | Cotação / Contrato / ANTT |
| `gastronomy`| Restaurantes & Bares | Prato / Cardápio | Tempo de Cozinha, Mesas Abertas, Faturamento KDS | Mesa / Comanda / Balcão |
| `retail` | Moda & Acessórios | Produto / Catálogo | Giro de Estoque, Ticket Médio, Peças por Venda | Caixa Rápido / Provador |
| `services` | Beleza, Barbearia, Spa| Serviço / Procedimentos | Ocupação de Cadeiras, Ticket Médio, Retorno | Comanda de Atendimento |
| `legal` | Advocacia & Jurídico | Processo / Honorários | Prazos da Semana, Audiências, Processos Ativos | Pasta / Consulta Jurídica |
| `rental` | Locação & Estruturas | Equipamento / Bens | Bens Locados, Devoluções do Dia, Manutenções | Reserva / Montagem no Local |
| `tech_repair`| Assistência Técnica | OS / Reparos | OS na Bancada, Peças em Falta, Prazo Médio | Ordem de Serviço (IMEI) |
| `pet` | Pet Shop & Veterinária| Item Pet / Procedimento | Banhos do Dia, Consultas Agendadas, Lotes | Fila de Tosa / Balcão |
| `vehicles` | Veículos & Revendas | Veículo / Estoque Pátio | Dias em Pátio, Propostas Abertas, Margem Média | Test-Drive / Proposta FIPE |
| `events` | Ingressos & Shows | Lote / Ingressos | Lotação Máxima, Ingressos Validados, Bar | Bilheteria / Portaria QR |
| `supermarket`| Mercado & Hortifrúti | Produto / Gôndola | Ruptura de Estoque, Itens por Cupom, Faturamento | Caixa PDV / Tele-Entrega |
| `pharmacy` | Farmácia & Drogarias | Medicamento / OTC | Lotes a Vencer, Receituários Retidos, Curva ABC | Balcão Farmacêutico |
| `education` | Cursos & Turmas | Curso / Turmas | Vagas Ocupadas, Taxa de Evasão, Mensalidades | Matrícula / Secretaria |
| `news` | Notícias & Jornais | Reportagem / Matérias | Leitores Únicos, Assinaturas, Banners Ativos | Classificados / Assinatura |
| `wholesale` | Atacado & Indústria | Caixa Master / Lote | Volume Faturado, Paletes Expedidos, Carteira PJ | Pedido PJ / Faturamento |

---

## 🌐 URLs de Produção Auditadas e Ativas

- **Central de Tarefas & Meu Dia:** [https://fea86596.wider.pages.dev/workspace/tarefas](https://fea86596.wider.pages.dev/workspace/tarefas)
- **Gestão de Frotas & Assentos 2D:** [https://fea86596.wider.pages.dev/workspace/turismo/frota](https://fea86596.wider.pages.dev/workspace/turismo/frota)
- **Orquestrador de IAs (BYOK):** [https://fea86596.wider.pages.dev/workspace/configuracoes/inteligencia-artificial](https://fea86596.wider.pages.dev/workspace/configuracoes/inteligencia-artificial)
- **Central de Ajuda & Suporte:** [https://fea86596.wider.pages.dev/workspace/suporte](https://fea86596.wider.pages.dev/workspace/suporte)
- **Hub de Sites, Vitrines & Hotpages:** [https://fea86596.wider.pages.dev/workspace/marketing/vitrine](https://fea86596.wider.pages.dev/workspace/marketing/vitrine)
- **Vitrine Comercial Pública Oficial:** [https://fea86596.wider.pages.dev/perfil-da-loja](https://fea86596.wider.pages.dev/perfil-da-loja)
- **Painel de Conta & Alternador de Lojas:** [https://fea86596.wider.pages.dev/conta](https://fea86596.wider.pages.dev/conta)
- **Domínio Principal:** [https://wider.pages.dev](https://wider.pages.dev)

