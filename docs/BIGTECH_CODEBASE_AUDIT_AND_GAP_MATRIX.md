# Relatório Canônico de Auditoria Holística & Matriz de GAPs E2E (Wider Platform)

> **Data da Auditoria:** 28 de Agosto de 2026  
> **Comitê Responsável:** BigTech Executive Engineering Board & Red Team  
> **Fontes de Verdade Auditadas:** `docs/DESIGN.md`, `docs/MASTER_PLAN.md`, `docs/ROADMAP.md`, `docs/DOMAIN_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/BUSINESS_FLOWS.md`, `docs/PAGE_CATALOG.md`, `supabase/migrations/**`, `src/services/**`, `src/routes/**`.

---

## 🏛️ 1. Reconstrução da Intenção & Visão Sistêmica do Produto

A **Wider Community Platform** (JAH) é um Super App hiperlocal e ecossistema operacional para cidades, bairros e comunidades. O produto opera em quatro jornadas simultâneas e integradas:

1. **Jornada do Consumidor/Cidadão:** Descoberta visual, compra em 3 toques, agendamento de serviços com pacotes/vouchers, rastreamento de entregas com PIN, contratação e assinatura eletrônica de acordos P2P, e carteira de cashback/tokens de fidelidade.
2. **Jornada do Lojista/Produtor:** Frente de caixa (PDV), comanda de salão, gestão de pedidos em tempo real (KDS com áudio e impressão térmica 80mm), controle de estoque com matriz de variações (ERP), gestão de frota própria e motoboys sob demanda (MotoLink com Dynamic Surge), e emissão de orçamentos e faturas de recebíveis.
3. **Jornada do Entregador/Parceiro:** Despacho contextual via Links Mágicos (sem fricção de login obrigatório), mapa com rotas GPS, foto de comprovante de entrega com consentimento LGPD, e extrato transparente de taxas acumuladas.
4. **Jornada do Administrador Master:** Governança multi-tenant, compliance com trilha forense de aceites LGPD (SHA-256), auditoria de identidade KYC (Identity Vault), moderação de denúncias e split de faturamento da plataforma.

---

## 🔍 2. Diagnóstico Consolidado: Estado Atual vs. Estado Ideal por Vertical

| Vertical / Módulo | Estado Atual (Realidade do Código) | Estado Ideal (Visão BigTech) | Diagnóstico & GAPs Encontrados |
| :--- | :--- | :--- | :--- |
| **1. Identidade, Lojas & Onboarding** | Onboarding rico em 6 etapas (`_store.criar-negocio.tsx`) com mapa, geocoding e provisionamento atômico via `provisionBusiness`. | Criação fluida com auto-seleção de tenant e isolamento multi-tenant seguro derivado de sessão. | `✅ SÓLIDO`. Totalmente integrado com banco, RLS e multi-tenant. |
| **2. Vitrine Pública & Descoberta** | Home dinâmica conectada ao CMS (`_store.index.tsx`), busca unificada, catálogo com filtros e páginas de produto ricas. | Vitrine silenciosa sem títulos prolixos, renderizando categorias diretamente do CMS sem dependência hardcoded. | `✅ ESTABILIZADO`. Home refatorada na Fase A para consumir 100% dos dados dinâmicos do banco. |
| **3. Compra, Carrinho & Checkout** | RPC PostgreSQL atômico e idempotente (`process_checkout_transaction_v2`) com dedução de estoque e reserva. | Checkout resiliente com tradução de violações de constraint em mensagens amigáveis ao usuário. | `✅ ESTABILIZADO`. Tratamento de erros de estoque e integridade atômica calibrado na Fase C. |
| **4. PDV, Cozinha (KDS) & Comandas** | KDS implementado em duas telas (`workspace.pedidos.gestor.tsx` e `workspace.pdv.cozinha.tsx`). Comandas em `workspace.pdv.comandas.tsx`. | KDS único e canônico com sincronização WebSocket, áudio Web Audio e mapeamento correto de itens. | `⚠️ SILENT GAP ENCONTRADO`: Em `workspace.pdv.cozinha.tsx`, os campos dos itens estavam desfasados (`order.items` vs `order.order_items`, `product_name` vs `product_title`), gerando tickets vazios na cozinha. |
| **5. Serviços, Agenda & Pacotes** | Multi-recurso (Pessoa, Espaço, Equipamento) com reservas atômicas, vouchers de pacotes e agendamento público. | Calendário dinâmico com cancelamento e recálculo de créditos de pacotes em tempo real. | `✅ SÓLIDO`. Invalidação de cache corrigida para atualizar o saldo de passes instantaneamente. |
| **6. Negociações, Contratos & Assinaturas** | Criação de contratos com Markdown, hashing SHA-256, selagem criptográfica e página de verificação pública (`verify/document/$code`). | Fluxo unificado de assinatura eletrônica com consentimento, IP, User-Agent e trilha forense. | `⚠️ TÉCNICO / DUPLICAÇÃO`: Existência de duas rotas concorrentes (`/assinar/$token` e `/assinatura/$token`) com chamadas diretas ao banco de dados no loader sem passar pelo BFF. |
| **7. Finanças, Caixa & Recebíveis** | Abertura/fechamento de turno de caixa, sangrias, suprimentos, conciliação P2P de carnês (`workspace.financeiro.recebiveis.tsx`) e Token Ledger. | Conciliação contábil em tempo real com baixa automática de comandas no caixa da sessão ativa. | `✅ FUNCIONAL`. Fluxo de liquidação com comprovantes e cronograma de parcelas ativo. |
| **8. Frota, Entregadores & MotoLink** | Despacho contextual, geração de links mágicos com PIN, tabela de tarifas por KM e gestão de frotas (`workspace.pedidos.frota.tsx`). | Gestão completa de entregadores com alteração de status e emissão de pagamentos. | `⚠️ GAP DE UI`: Em `workspace.pedidos.entregadores.index.tsx`, os botões de menu "Gerar Fatura" e "Suspender" estavam sem manipulador `onClick`. |
| **9. Moderação, KYC & Compliance** | Painel de auditoria de identidade com visualizador de documentos e selfie (`workspace.moderacao.kyc.tsx`), termos com hash SHA-256 (`admin-master.termos.tsx`). | Auditoria com aprovação/rejeição justificada e aplicação de selos verificados nos perfis. | `✅ SÓLIDO`. Backend e UI com feedback de auditoria implementados. |
| **10. CMS, Builder & Estúdio** | Builder modular em canvas (`workspace.builder.$documentId.editor.tsx`), estúdio de flyers e gerador de temas. | Persistência de layouts com preview fiel e sincronização com a vitrine pública. | `✅ SÓLIDO`. Renderização dinâmica via `ExperienceRenderer`. |

---

## 🐛 3. Inventário Detalhado de Silent Gaps Identificados

### GAP 1 (Crítico de UX): Mapeamento de Itens no KDS da Cozinha (`workspace.pdv.cozinha.tsx`)
- **Causa Raiz:** O componente lia `order.items`, `item.quantity`, `item.product_name` e `item.options`. O retorno real do BFF `order.functions.ts` devolve `order.order_items`, `item.qty`, `item.product_title` e `item.selected_options`.
- **Efeito:** Os cartões do KDS apareciam sem nenhum produto listado quando recebiam pedidos reais do banco de dados.

### GAP 2 (Violação da Regra de Arquitetura #1): Acesso Direto ao Supabase em Rotas
- **Causa Raiz:** As rotas `_store.colecao.$slug.tsx`, `assinar.$token.tsx` e `assinatura.$token.tsx` importavam e executavam `getServerClient()` diretamente em seus loaders, sem passar pelos contratos do BFF (`services/catalog.functions.ts` e `services/contracts.functions.ts`).
- **Efeito:** Dívida técnica e bypass parcial de padrões de auditoria e validação Zod centralizada.

### GAP 3 (Ações Inertes na Tabela de Entregadores): Dropdown Incompleto
- **Causa Raiz:** Em `workspace.pedidos.entregadores.index.tsx` (linhas 201-202), os itens de menu "Gerar Fatura" e "Suspender" eram renderizados sem binding com mutações do backend.
- **Efeito:** O usuário clicava nas opções e não havia feedback nem execução da ação.

### GAP 4 (Duplicação de Rotas): `/assinar/$token` vs. `/assinatura/$token`
- **Causa Raiz:** Criação de rotas paralelas durante iterações de assinatura eletrônica.
- **Efeito:** Confusão de navegação e inconsistência na experiência de assinatura de contratos.

---

## 🎯 4. Plano de Execução em Microfases Rigorosas

### 🚀 Microfase 1: Correção de Integridade do KDS e Comandas
- Padronizar `workspace.pdv.cozinha.tsx` para utilizar os DTOs canônicos (`order.order_items`, `qty`, `product_title`, `selected_options`).
- Garantir atualização em tempo real e visualização de modificadores e observações.

### 🚀 Microfase 2: Unificação e Isolamento BFF de Assinaturas e Coleções
- Mover a query de `_store.colecao.$slug.tsx` para `src/services/catalog.functions.ts` (`getCollectionBySlug`).
- Mover o carregamento de envelope de assinatura para `src/services/contracts.functions.ts` (`getEnvelopeByToken`).
- Unificar a rota canônica de assinatura em `/assinar/$token` e redirecionar `/assinatura/$token`.

### 🚀 Microfase 3: Eliminação de Botões Inertes na Gestão de Entregadores
- Conectar as ações de suspensão e geração de fatura em `workspace.pedidos.entregadores.index.tsx` às Server Functions correspondentes com feedback de toast real e invalidação de cache.

### 🚀 Microfase 4: Verificação de Build e Auditoria Recursiva de Fechamento
- Executar compilação completa (`npm run build`) garantindo 0 erros de TypeScript e SSR.
- Auditar fluxos E2E no navegador para comprovação de ponta a ponta.
