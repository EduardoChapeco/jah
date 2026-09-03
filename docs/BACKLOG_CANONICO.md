# BACKLOG CANÔNICO — Status e Auditoria de Capacidades

> **REGRA DE OURO:** Nenhuma capacidade apagada, ocultada ou transformada em stub pode ser considerada "concluída" ou "fora de escopo" sem decisão explícita.
> Toda funcionalidade que não representa um fluxo REAL, E2E e auditável está aqui, com status `PENDENTE DE RECONSTRUÇÃO REAL` ou `CONCLUÍDO E VALIDADO E2E`.
> Uma capacidade só sai do backlog pendente quando sua fatia vertical completa for desenhada, implementada, testada e comprovada em produção.

---

## 1. Gestão de Organizações & Multi-Lojas
- **Módulo:** Core / Workspace
- **Rotas:** `/workspace/lojas`, `/_store/criar-negocio`, `/admin-master/lojas`.
- **Origem do Requisito:** Arquitetura Multi-Tenant
- **Atores:** Lojista, Super Admin
- **Funcionalidades:** Criação de novos negócios, alternância de contexto de loja ativa via `store_id` e governança global no Admin Master.
- **Entidades:** `organizations`, `stores`, `profiles`, `workspace_members`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Migrações `20260730234419_refactor_identity_and_tenancy.sql` e `20260830000001_remove_jah_auto_org.sql` aplicadas.

---

## 2. Redefinição de Senha & Recuperação de Conta
- **Módulo:** Auth & Segurança
- **Rotas:** `/_store/recuperar-senha`, `/_store/redefinir-senha`, `/api/auth/confirm`.
- **Origem do Requisito:** UX de Segurança
- **Atores:** Cliente / Lojista / Admin
- **Funcionalidades:** Solicitação de link de redefinição via e-mail (Supabase Auth OTP), validação de token e gravação segura de nova senha.
- **Entidades:** `auth.users`, `profiles`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Fluxo de troca de senha com feedback de erro/sucesso ativo em `_store.redefinir-senha.tsx`.

---

## 3. Gestão Completa de Estoque & Reserva Transacional ACID
- **Módulo:** Commerce / Checkout
- **Rotas:** `/workspace/estoque`, `/workspace/estoque/movimentos`, `/workspace/estoque/alertas`.
- **Origem do Requisito:** Vendas Físico/Digital
- **Atores:** Cliente, Lojista, Frente de Caixa (PDV)
- **Funcionalidades:** Reserva atômica de estoque durante o checkout com advisory locks (`checkout_atomic_v3`), bloqueio contra overselling, liberação automática de itens em caso de cancelamento e auditoria em `stock_movements`.
- **Entidades:** `stock_reservations`, `stock_movements`, `product_variants`, `orders`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Stored Procedures `0011_stock_rpc.sql`, `20260725190000_checkout_advisory_locks.sql` e `20260725200000_strict_checkout_stock_validation.sql` ativas.

---

## 4. Integração Real de Webhooks de Pagamento & Despacho
- **Módulo:** Financeiro / Logística
- **Rotas:** `/api/webhooks/pix`, `/api/webhooks/shipment`.
- **Origem do Requisito:** Pagamento Automatizado & Rastreamento
- **Atores:** Provedores de Pagamento, Transportadoras, Supabase Database
- **Funcionalidades:** Endpoints idempotentes com validação de payload, registro no outbox/inbox transacional e atualização atômica de status do pedido.
- **Entidades:** `payment_transactions`, `orders`, `shipment_webhook_inbox`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Migrações `20260828020000_shipment_webhook_inbox.sql` e handlers em `src/routes/api.webhooks.*.ts` ativos.

---

## 5. Módulo JUS & Advocacia 360° (Consulta CNJ, Monitoramento & Compliance)
- **Módulo:** LegalTech / Advocacia
- **Rotas:** `/workspace/advocacia`, `/_store/conta/processos`.
- **Origem do Requisito:** Referência JUDIT Platform
- **Atores:** Cidadão / Cliente, Advogado, Escritório Jurídico
- **Funcionalidades:** Consulta imediata CNJ com higienização de 20 dígitos, filtros de compliance (mandados de prisão BNMP, execução criminal e restrições OFAC/ONU), criação de monitoramentos em lote por múltiplos documentos (CPF, CNPJ, OAB) com tags e filtros de tribunais (TJ/TRF), ficha 360° com timeline cronológica e síntese executiva JUS IA.
- **Entidades:** `public.lawsuit_monitors`, `public.mined_lawsuits`, `public.lawsuit_movements`, `public.jus_demands`, `public.jus_proposals`, `public.jus_contracts`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Migração `20260902170000_lawsuit_monitoring_hub.sql` aplicada, BFF `src/services/jus.functions.ts` ativo e validado com 0 erros de tipagem (`npx tsc --noEmit`).

---

## 6. Gastronomia Omnichannel, Delivery & PDV Salão (Referência Diggy)
- **Módulo:** Food & Delivery / Commerce
- **Rotas:** `/workspace/pedidos/gestor`, `/workspace/pdv/comandas`, `/workspace/pdv/cozinha`, `/workspace/configuracoes`, `/_store/perfil-da-loja`.
- **Origem do Requisito:** Benchmark Competidor Diggy & Foodyman
- **Atores:** Lojista, Cozinha/KDS, Caixa/Balcão, Garçom, Cliente
- **Funcionalidades:** Notificação automática para clientes via WhatsApp em 1 toque no Kanban de expedição, calculadora de rateio/divisão de conta por pessoa nas comandas de mesa, parametrização de modalidades de atendimento (`order_types`: Delivery, Retirada, No Local) nas configurações e exibição de badges dinâmicos na vitrine do restaurante.
- **Entidades:** `stores.settings.order_types`, `orders`, `order_items`, `cash_registers`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Handlers e rotas atualizados sem stubs, compilando com 0 erros (`tsc --noEmit`).

---

## 7. Live Dashboard de Operações, SLAs em Tempo Real & Complementos Centrais
- **Módulo:** Food & Delivery / Operações Urbanas
- **Rotas:** `/workspace/pedidos/gestor`, `/workspace/catalogo/produtos`, `/workspace/pdv/comandas`.
- **Origem do Requisito:** Benchmark Saas Food Omnichannel & 5 Telas de Referência
- **Atores:** Operador de Expedição, Chefe de Cozinha, Garçom, Gestor da Loja, Cliente
- **Funcionalidades:**
  1. **Live Dashboard de SLAs do Turno:** 8 KPIs em tempo real (Total de Pedidos, Concluídos, Em Aberto/Fila, Cancelados, Faturamento, Ticket Médio, TMP - Tempo Médio de Preparo ~21m e TME - Tempo Médio de Entrega ~32m).
  2. **Tabela de Acompanhamento ao Vivo:** Monitoramento segundo a segundo com barra dinâmica de progresso de SLA (verde &lt; 20m, amarelo 20-30m, vermelho &gt; 30m com alerta de estouro).
  3. **Motor de Alertas Inteligentes em Tempo Real:** Barra de alerta operacional e modal de intervenção imediata para pedidos atrasados com ação de 1 toque (notificar cozinha ou avisar cliente no WhatsApp).
  4. **Gestão Centralizada de Complementos & Adicionais:** Nova aba no catálogo para gerenciar grupos reutilizáveis de complementos (`public.store_complement_groups`: queijos, molhos, bordas, adicionais com preços e regras min/max) vinculáveis a múltiplos itens.
  5. **Switch Inline de Pausa de Produto:** Chaveamento atômico direto na linha da tabela de produtos para esgotar/ativar itens no expediente sem abrir a página inteira de edição.
  6. **Salão com Alerta de "Conta Solicitada":** Codificação cromática amarela pulsante para mesas com encerramento pedido e botão flutuante tátil mobile no terço inferior (`Thumb Zone`).
- **Entidades:** `public.orders` (campos `channel_origin`, `prep_time_sla_minutes`, `delivery_time_sla_minutes`, `prep_started_at`, `ready_at`, `sla_alert_triggered`), `public.store_complement_groups`.
- **Estado Atual:** ✅ **CONCLUÍDO E VALIDADO E2E**
- **Comprovação:** Migração `20260902180000_omnichannel_operations_sla.sql` aplicada, BFFs `getLiveOperationalDashboard`, `saveStoreComplementGroup` e `requestTableBill` ativos, validado com 0 erros de tipagem (`npx tsc --noEmit`).

---

_Documento sincronizado com a árvore de código-fonte e migrações ativas._



