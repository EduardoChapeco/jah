# Roadmap — Wider Community Platform

Este roadmap detalha as fases de construção da Wider Community Platform (Plataforma Comunitária). Consulte `MASTER_PLAN.md` para a visão geral e `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, `SECURITY.md` para os detalhes técnicos.

## Regra de ouro

**Nenhuma fase avança para a seguinte sem, simultaneamente:**

1. Critérios de aceite (aceite) cumpridos e verificados;
2. Migrações de banco de dados aplicadas e revisadas;
3. Testes automatizados escritos e passando;
4. Revisão de segurança concluída.

---

## Fase 0 & 1 — Fundação e Primitivas da Rua (Concluída/Atual)

### Escopo

- Documentação canônica atualizada (Transição Jah -> Jah).
- Design system aplicado: tokens de cor, tipografia da rua (Inter, Space Grotesk, Oswald, JetBrains Mono) e primitivas genéricas `<Surface>` (zine, flyer, yellow-pages, ticket, polaroid).
- Layout e navegação: shell público, shell de cliente, shell de admin.
- Registro de rotas tipado, com metadados de fase, permissão e status ("disponível" / "em breve").
- Páginas públicas estruturais: home com seções reais conectáveis, páginas institucionais mínimas.
- Shell de admin mobile-first: sidebar responsiva (desktop) e bottom-nav (mobile).
- Biblioteca de componentes reutilizáveis com estados completos (carregando, vazio, erro, sem permissão, desabilitado, não configurado).
- Estados vazios verdadeiramente honestos: nenhuma simulação de dado real.

### Aceite

- Todos os 12 critérios listados em `MASTER_PLAN.md`, seção 8, verificados.
- Nenhuma rota do registro aponta para página inexistente; nenhuma duplicidade de caminho.
- Nenhum componente crítico sem cobertura dos estados obrigatórios.

### Migrações

- Nenhuma migração de domínio de negócio nesta fase (não há tabelas de catálogo/pedido/cliente ainda). Caso haja tabelas mínimas de infraestrutura (ex.: configuração de organização/loja), devem ser documentadas em `DOMAIN_MODEL.md` como fundação, não como funcionalidade.

### Testes

- Testes de integridade do registro de rotas (toda rota resolve, sem duplicatas, metadados válidos).
- Testes de renderização de estados dos componentes críticos do catálogo.
- Ver `TEST_STRATEGY.md` para detalhes.

### Revisão de segurança

- Confirmar ausência de chamadas diretas ao Supabase em componentes.
- Confirmar ausência de chaves secretas no bundle do cliente.
- Confirmar que nenhuma tela pública exibe dado fictício de negócio.

---

## Fase 1 — Dados, identidade e catálogo

### Escopo

- Modelagem de banco de dados: organizações, lojas, usuários, papéis (RBAC).
- Autenticação real (Supabase Auth) para admin e, se aplicável, clientes.
- Políticas de RLS para todas as tabelas novas, cobrindo isolamento por `organization_id`/`store_id`.
- Catálogo: produtos, tipos de produto, variantes (tamanho/cor), mídia de produto, categorias, controle de estoque (sempre calculado/validado no servidor).
- CRUD administrativo de catálogo no admin, consumindo apenas a camada de serviços/BFF.

### Aceite

- Uma lojista consegue criar, editar e desativar produtos, variantes, categorias e mídia pelo admin.
- Estoque exibido em qualquer tela reflete exatamente o valor validado no servidor no momento da consulta.
- Nenhuma política de RLS permite acesso cruzado entre organizações/lojas diferentes.
- Usuários sem papel/permissão adequada recebem estado "sem permissão", nunca dado vazado.

### Migrações

- Criação de tabelas: `organizations`, `stores`, `users`/perfis, `roles`/`permissions`, `products`, `product_types`, `product_variants`, `product_media`, `categories`, `stock_movements` (ou equivalente), todas com `organization_id`/`store_id` e políticas de RLS associadas.

### Testes

- Testes de RLS positivos (acesso permitido dentro do próprio tenant) e negativos (acesso negado entre tenants e para papéis sem permissão).
- Testes de contrato das funções de servidor de catálogo.
- Testes de integração de CRUD de catálogo no admin.

### Revisão de segurança

- Auditoria completa de políticas de RLS de todas as tabelas novas.
- Revisão de exposição de campos sensíveis nas respostas das funções de servidor.

---

## Fase 2 — Compra: carrinho, checkout e pagamento

### Escopo

- Carrinho de compras (server-authoritative para preço e disponibilidade).
- Checkout completo.
- Frete: tabela manual, retirada, ou cotação manual (sem integração automática de transportadora ainda).
- Pedido (order) com máquina de estados clara.
- Reserva de estoque durante o processo de compra, com expiração e liberação segura.
- Pagamentos: manual (comprovante) e Pix (fluxo mínimo, sem gateway automatizado complexo nesta fase, salvo definição contrária em `API_CONTRACTS.md`).

### Aceite

- Um cliente consegue adicionar produtos ao carrinho, finalizar um pedido e ver seu status refletir a realidade do servidor.
- Nenhum preço, frete ou desconto é calculado no navegador; todo valor exibido vem de resposta de servidor.
- Reserva de estoque impede overselling comprovadamente (teste de concorrência).
- Estados de pedido documentados e cobertos por testes (criado, aguardando pagamento, pago, cancelado, expirado etc., conforme `DOMAIN_MODEL.md`).

### Migrações

- Criação de tabelas: `carts`, `cart_items`, `orders`, `order_items`, `shipping_options`, `stock_reservations`, `payments`.

### Testes

- Testes de integração do fluxo completo carrinho → checkout → pedido → pagamento.
- Testes de concorrência para reserva de estoque.
- Testes de RLS para pedidos (cliente só vê seus próprios pedidos; admin vê os da própria loja).
- Testes E2E do fluxo de compra mínimo viável.

### Revisão de segurança

- Revisão de todas as rotas de pagamento quanto a exposição de dados sensíveis e validação server-side de valores.
- Revisão de RLS de `orders`/`payments`.

---

## Fase 3 — Conteúdo, presença e confiança

### Escopo

- Construtor de CMS (builder) para páginas/seções da loja.
- Stories.
- Perfil público / link-in-bio.
- Avaliações de produto, FAQ.
- SEO avançado (metadados dinâmicos, sitemap, structured data).
- PWA instalável (manifest, service worker, offline mínimo).

### Aceite

- Uma lojista consegue montar/editar seções de página pelo builder sem intervenção técnica.
- Loja instalável como PWA em dispositivos móveis, com ícone e splash corretos.
- Avaliações e FAQ exibidos apenas quando existem dados reais; caso contrário, estado vazio honesto.

### Migrações

- Criação de tabelas: `pages`, `page_sections`, `stories`, `reviews`, `faqs`, além de tabelas de configuração de SEO por página/produto.

### Testes

- Testes de integração do builder (criação/edição/publicação de seção).
- Testes de acessibilidade nas páginas geradas pelo builder.
- Testes de PWA (lighthouse/manifest válido, service worker registrado).

### Revisão de segurança

- Revisão de sanitização de conteúdo gerado pelo builder (proteção contra XSS).
- Revisão de RLS de avaliações (associação correta a pedidos/clientes reais, quando exigido).

---

## Fase 4 — Operação avançada e retenção

### Escopo

- CRM básico de clientes.
- Chat de atendimento.
- Trocas e devoluções.
- Caixa (controle de caixa/fechamento).
- Comissão de vendedoras.
- Cartões-presente.
- Carnê (parcelamento próprio da loja).

### Aceite

- Fluxo de troca rastreável do pedido original ao novo pedido/reembolso.
- Fechamento de caixa reflete exatamente as transações registradas no período, sem cálculo client-side.
- Comissões calculadas e auditáveis a partir de dados do servidor.

### Migrações

- Criação de tabelas: `customers_crm`, `chat_threads`, `chat_messages`, `exchanges`, `cash_registers`, `cash_register_entries`, `commissions`, `gift_cards`, `installment_plans` (carnê).

### Testes

- Testes de integração para trocas, caixa e comissão.
- Testes de RLS para dados financeiros sensíveis (caixa, comissão).
- Testes de contrato para cálculo de comissão e saldo de cartão-presente.

### Revisão de segurança

- Revisão de controle de acesso por papel (quem pode abrir/fechar caixa, aprovar troca, ver comissão de outra vendedora).
- Auditoria de trilha de auditoria (logs de alteração em dados financeiros).

---

## Fase 5 — Crescimento e integrações externas

### Escopo

- Integrações com Meta (catálogo/anúncios) e Google (Merchant Center/Analytics).
- Integrações de logística (cálculo automático de frete via transportadora).
- Recuperação de carrinho abandonado.
- "Match Time" (funcionalidade de engajamento/promoção, conforme especificação de produto a detalhar em `DOMAIN_MODEL.md`).
- Criador de posts para redes sociais.

### Aceite

- Catálogo sincronizado corretamente com Meta/Google sem duplicidade ou dado divergente do servidor.
- Frete calculado automaticamente reflete cotação real de transportadora, nunca estimativa client-side.
- Fluxo de recuperação de carrinho respeita preferências de contato e LGPD.

### Migrações

- Criação de tabelas/colunas de integração: `integration_credentials` (segredos nunca expostos ao cliente), `abandoned_carts`, `shipping_quotes`, `social_posts`.

### Testes

- Testes de contrato com mocks das integrações externas.
- Testes de RLS para credenciais de integração (acesso restrito a papéis administrativos específicos).
- Testes E2E de recuperação de carrinho.

### Revisão de segurança

- Revisão de armazenamento de credenciais de integrações externas (nunca em texto plano acessível ao cliente).
- Revisão de conformidade com LGPD para dados de clientes usados em recuperação de carrinho e integrações de anúncios.

---

## Visão consolidada das fases

| Fase | Tema                                                          | Depende de                                                     |
| ---- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| 0    | Fundação: docs, design system, shells, navegação, componentes | —                                                              |
| 1    | Dados, identidade, catálogo                                   | Fase 0                                                         |
| 2    | Compra: carrinho, checkout, pagamento                         | Fase 1                                                         |
| 3    | Conteúdo, presença, confiança                                 | Fase 1 (parcialmente Fase 2 para avaliações ligadas a pedidos) |
| 4    | Operação avançada e retenção                                  | Fase 2                                                         |
| 5    | Crescimento e integrações externas                            | Fase 3 e Fase 4                                                |
| 6    | Expansão de Domínios, Contratos, Identidade & Deals (V3)      | Fase 1 a 5                                                     |

---

# Roadmap Canônico de Capabilities — Expansão V3

Abaixo estão os capítulos de capability profunda que regem a expansão contínua da JAH.

---

### Capability 1: Identity & Public Profiles (@handle Uniqueness)

- **Current State:** Autenticação via Supabase Auth e perfis sociais básicos (`profiles`).
- **Target State:** Sistema de `@handle` único, normalizado (`[a-z0-9_]`), case-insensitive, com lista de reserved handles, histórico de mudanças, cooldown de 14 dias e redirects de links antigos.
- **Dependencies:** `profiles`, `auth.users`.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 24).
- **Migration:** Tabela `handle_history`, trigger de validação de formato e unicidade no Postgres.
- **Microphases:**
  1. Adicionar constraints e normalização de handle no banco.
  2. Implementar rota pública `/@:handle` ou `/membro/:id`.
  3. Adicionar visualização de perfil enriquecido (posts, momentos, classificados, histórias).
- **Acceptance:** Colisão de handles é bloqueada no banco; perfil renderiza dados reais.
- **Runtime Proof:** Teste de inserção de handle duplicado com falha esperada e resolução de perfil público.

---

### Capability 2: Personal Account UX (In-Page & Density)

- **Current State:** `/conta` com tabs horizontais e estrutura de dashboard.
- **Target State:** Shell pessoal in-page, leve, com foco em conteúdo do usuário (pedidos, desapegos, ingressos, mensagens, dados de perfil). Sem dashboard ERP corporativo ou criação de organização automática.
- **Dependencies:** `src/routes/_store.conta.tsx`.
- **Canonical Authority:** `docs/PAGE_CATALOG.md`.
- **Microphases:**
  1. Refatorar shell de `/conta` removendo headers inflados.
  2. Alinhar cartões de resumo com queries reais.
- **Acceptance:** Navegação fluida entre Minhas Compras, Meus Ingressos e Meus Classificados.
- **Runtime Proof:** Navegação sem quebra e sem elementos estáticos falsos.

---

### Capability 3: Dynamic Listing Engine & Category Schema

- **Current State:** Classificados básicos (`sale`, `job`, `service`, `trade`) com campos genéricos.
- **Target State:** Editor split-pane desktop (painel de edição 440px com scroll interno + Live Truthful Preview Mobg-style) e mobile step-editor com schemas específicos para Veículos, Imóveis, Serviços, Vagas e Itens Gerais.
- **Dependencies:** `src/services/classifieds.functions.ts`, `public.classifieds`.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 25).
- **Microphases:**
  1. Editor split-pane implementado em `_store.conta.classificados.novo.tsx`.
  2. Ficha técnica rica renderizada na rota pública `_store.classificados.$id.tsx`.
  3. Filtros por atributos de categoria no catálogo/busca.
- **Acceptance:** Veículos renderizam marca/modelo/ano/km; Imóveis renderizam m²/quartos/vagas/IPTU.
- **Runtime Proof:** Teste de submissão com JSONB de atributos e verificação na página pública.

---

### Capability 4: Deals, Negotiations & P2P Transactions

- **Current State:** Negociação ocorre primariamente via link direto de WhatsApp.
- **Target State:** Máquina de estados de acordo formal (`Deal`), vinculando anúncio, comprador e vendedor com proposta, aceite, valor acordado, caução e geração de contrato.
- **Dependencies:** `classifieds`, `profiles`.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 26).
- **Microphases:**
  1. Modelagem da tabela `deals` com status `negotiating`, `accepted`, `rejected`, `closed`.
  2. Interface de propostas no detalhe do anúncio.
- **Acceptance:** Vendedor aceita proposta e gera Deal formal.
- **Runtime Proof:** Transição de status do anúncio para `reserved` ao aceitar deal.

---

### Capability 5: Contract Engine & Electronic Signature

- **Current State:** Nenhum contrato digital ou assinatura formal implementados.
- **Target State:** Contract Engine canônico com templates versionados, biblioteca de cláusulas, preview instantâneo, assistente de IA com visualização de diffs estruturados, envelopes de assinatura com múltiplos níveis (`basic`, `advanced`, `qualified`), manifest criptográfico de evidências e verificação pública em `/verify/document/:code`.
- **Dependencies:** Supabase Database, PDF generator, Web Crypto API.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 27).
- **Microphases:**
  1. Tabelas `contract_templates`, `contracts`, `contract_versions`, `signature_envelopes`.
  2. Editor split-pane de contratos com preview em canvas.
  3. Signing session segura para signatários com link de token escopado.
  4. Rota pública de verificação `/verify/document/:code`.
- **Acceptance:** Contrato assinado gera versão selada imutável e manifest de evidências com hash.
- **Runtime Proof:** Validação de integridade de hash de documento selado.

---

### Capability 6: Identity Verification Engine & Privacy

- **Current State:** Verificação básica de e-mail via Supabase Auth.
- **Target State:** Verification Engine com níveis de conformidade (`email`, `phone`, `identity_document`, `selfie_liveness`), armazenamento isolado em bucket criptografado (`identity-vault`), expurgo programado e concessão de selos de verificação.
- **Dependencies:** Supabase Storage (RLS restrito), Server Functions.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 28).
- **Microphases:**
  1. Criação do bucket `identity-vault` com RLS deny-by-default.
  2. Fluxo de envio de documento com URLs assinadas temporárias.
- **Acceptance:** Contrapartes visualizam apenas selo de verificação; documentos brutos permanecem sigilosos.
- **Runtime Proof:** Acesso não autorizado a documento retorna 403.

---

### Capability 7: Receivables & P2P Billing

- **Current State:** Pagamento apenas em checkout de e-commerce e eventos.
- **Target State:** Motor de contas a receber decorrentes de deals/locações com geração de parcelas, lembretes de vencimento in-app e registro manual de pagamentos com comprovante.
- **Dependencies:** `deals`, `contracts`.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 29).
- **Microphases:**
  1. Tabela `receivables` e `receivable_installments`.
  2. Interface de gestão de parcelas e upload de comprovante.
- **Acceptance:** Parcela quitada reflete no extrato do deal.
- **Runtime Proof:** Alteração de status de parcela com auditoria.

---

### Capability 8: Integration Orchestrator & AI Provider Router

- **Current State:** Variáveis globais de ambiente no worker.
- **Target State:** Secret Vault seguro no banco com criptografia para BYOK (Bring Your Own Key), suporte a escopos globais, organizacionais e pessoais, e roteador de capabilities de IA (Gemini, OpenRouter, Firecrawl, Steel) com controle de budget diário/mensal e fallback resiliente.
- **Dependencies:** `integration_credentials`, Server Functions.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 30).
- **Microphases:**
  1. Tabela `secret_vault` com criptografia e máscara de chaves.
  2. AI capability router no backend (`ai.functions.ts`).
- **Acceptance:** Nenhuma chave de API vaza para o cliente; chamadas respeitam limites de cota.
- **Runtime Proof:** Mascaramento de chave validado no payload do client.

---

### Capability 9: Restaurant & Food Services (Benchmark Foodyman)

- **Current State:** Catálogo de produtos com variantes simples.
- **Target State:** Modifier Engine para gastronomia (Tamanhos, Bordas, Extras, Quantidade Mín/Máx, Preço Delta), KDS operacional em tempo real para cozinha, gestão de mesas/salão com QR Code e orquestração de entregas.
- **Dependencies:** `catalog`, `orders`, `realtime`.
- **Canonical Authority:** `docs/DOMAIN_MODEL.md` (Seção 31).
- **Microphases:**
  1. Tabelas `product_modifier_groups` e `product_modifiers`.
  2. Interface de seleção de adicionais na tela de produto.
  3. KDS Kanban conectado ao Supabase Realtime.
- **Acceptance:** Pedido com modificadores calcula total com precisão de centavos no backend.
- **Runtime Proof:** Teste de cálculo de pedido com modificadores obrigatórios e opcionais.
