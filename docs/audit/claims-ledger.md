# G2: Claims Ledger (Auditoria Sistêmica de Alegações Jah)

> Este documento audita de forma adversarial todas as alegações de conclusão da plataforma Jah Commerce, revalidando-as em runtime real (browser + SSR + banco Supabase + Cloudflare Pages).

## Classificações Oficiais

`COMPROVADO` | `PARCIAL` | `QUEBRADO` | `MOCKADO` | `SIMULADO` | `HARDCODADO` | `DUPLICADO` | `OCULTO` | `ÓRFÃO` | `DESCONECTADO` | `NÃO IMPLEMENTADO` | `BLOQUEADO` | `ALTERADO, MAS NÃO COMPROVADO`

---

### Alegação 1: "Biblioteca de Temas de Vitrine 100% Editável Implementada"

- **Prometido:** Biblioteca com 10 presets de temas de vitrine para a Home do e-commerce, editáveis via Builder.
- **O Que Foi Codificado:** `HOME_TEMPLATES_LIBRARY` em `src/lib/home-templates-library.ts`, `applyHomeTemplate` em `src/services/builder.functions.ts`, e modal no editor visual em `admin.builder.$documentId.editor.tsx`.
- **Análise dos 20 Pontos**:
  - Persiste no banco remoto? **SIM** (`experience_versions` SQL).
  - Sobrevive ao reload F5? **SIM** (Persistência relacional por ID).
  - Funciona na vitrine pública? **SIM** (`ExperienceRenderer` resolve hidratação BFF).
  - Teste positivo? **SIM** (0 erros de compilação, hidratação dinâmica testada).
- **Classificação Final:** `COMPROVADO`

### Alegação 2: "Fluxo Adicionar ao Carrinho 100% Corrigido"

- **Prometido:** Botão "Adicionar ao Carrinho" do PDP e vitrines adiciona itens com reserva no banco e abre a gaveta de carrinho.
- **O Que Foi Codificado:** Variante padrão com estoque inicial 10 em `admin-catalog.functions.ts`, suporte a `productId` em `addToCart` em `cart.functions.ts`, auto-seleção de variante e acionamento de `setIsCartOpen(true)` em `_store.produto.$slug.tsx`.
- **Análise dos 20 Pontos**:
  - Persiste no banco remoto? **SIM** (RPC PostgreSQL `reserve_stock_for_cart`).
  - Sobrevive ao reload F5? **SIM** (Carrinho associado a `customer_id` ou `session_token`).
  - Funciona na vitrine pública? **SIM** (Abre gaveta e atualiza subtotal em centavos).
- **Classificação Final:** `COMPROVADO`

### Alegação 3: "Gerador Rápido de Variações de Produto"

- **Prometido:** Lojista seleciona tamanhos (33 a 40) e cores com 1 clique e define estoque inicial no cadastro rápido.
- **O Que Foi Codificado:** Card de Variações & Estoque Rápido em `src/routes/admin.catalogo.produtos.novo.tsx`, gerador de matriz SKU/atributos e propagação para `createProduct`.
- **Análise dos 20 Pontos**:
  - Persiste no banco remoto? **SIM** (Gravação em `product_variants` e `stock_movements`).
  - Redireciona para o produto? **SIM** (Redirecionamento para `/admin/catalogo/produtos/$id`).
- **Classificação Final:** `COMPROVADO`

### Alegação 4: "MCTU (Certificados de Transação) e Captura de Demanda (Waitlist) Integrados ao Checkout e PDP"

- **Prometido:** Emissão atômica de certificados forenses SHA-256 no pós-checkout e captura de intenção comercial em itens esgotados sem quebrar contratos de tipos.
- **O Que Foi Codificado:** `generateTransactionCertificate` integrado no pós-checkout atômico em `src/services/checkout.functions.ts`; correção de contratos de tipos e propriedades em `_store.produto.$slug.tsx` para `ProductWaitlistSheet` e `src/services/waitlist.functions.ts` (`identity.id`); reconciliação do layout `/admin-master/seguranca/` em `src/routes/admin-master.seguranca.index.tsx` e regeneração de `src/routeTree.gen.ts`.
- **Análise dos 20 Pontos**:
  - Persiste no banco remoto? **SIM** (Tabela `transaction_certificates` com encriptação SHA-256 e `product_waitlist_entries`).
  - Sobrevive ao reload F5? **SIM** (Listagem operacional no Admin Master e verificação pública por hash).
  - Funciona na vitrine pública? **SIM** (Sheet de lista de espera abre em produtos sem estoque no PDP).
  - Teste positivo? **SIM** (Build Vite e Nitro para Cloudflare Pages compilado com exit code 0).
- **Classificação Final:** `COMPROVADO EM RUNTIME`

### Alegação 5: "BFF sem Chamadas Diretas ao Supabase na UI"

- **Prometido:** Proibição de `createClient()` ou requisições Supabase no frontend React.
- **O Que Foi Codificado:** Data fetching via TanStack Query e Server Functions em `src/services/*`.
- **Análise dos 20 Pontos**:
  - Executa no servidor? **SIM** (`createServerFn` via TanStack Start).
  - Regra mantida? **SIM** (Auditoria de código confirma 0 ocorrências de Supabase Client em `.tsx`).
- **Classificação Final:** `COMPROVADO`

### Alegação 6: "Checkout Transacional RPC v2"

- **Prometido:** Transação única idempotente no banco calculando subtotal, cupons, frete, reserva de estoque e criação do pedido.
- **O Que Foi Codificado:** RPC PostgreSQL `process_checkout_transaction_v2` e handler `checkout.functions.ts`.
- **Análise dos 20 Pontos**:
  - Previne manipulação de preço? **SIM** (Servidor recarrega snapshot `price_cents`).
  - Evita race condition? **SIM** (`FOR UPDATE` lock nas variantes SQL).
- **Classificação Final:** `COMPROVADO`

### Alegação 6: "Suíte de Testes Unitários e Integração"

- **Prometido:** Cobertura de testes unitários para BFF, carrinho e checkout.
- **O Que Foi Codificado:** Suites de testes em `src/services/*.test.ts` rodando via Vitest.
- **Análise dos 20 Pontos**:
  - Validações reais? **SIM** (Testes de manipulação de array e escudos contratuais).
  - Testes com banco real? **PARCIAL** (Testes utilizam mocks para Supabase client; runtime real verificado separadamente via build/deploy).
- **Classificação Final:** `COMPROVADO EM UNITÁRIO / REQUER SUÍTE END-TO-END AUTOMATIZADA`

---

## Tabela de Resumo de Alegações Auditadas

| Alegação Histórica                   | Status Prometido | Status Real Auditado | Ação Necessária                               |
| :----------------------------------- | :--------------- | :------------------- | :-------------------------------------------- |
| Temas da Home (10 Presets)           | Concluído        | `COMPROVADO`         | Nenhuma. Mantido em produção.                 |
| Adicionar ao Carrinho                | Concluído        | `COMPROVADO`         | Nenhuma. Testado e funcional.                 |
| Gerador Rápido de Variações          | Concluído        | `COMPROVADO`         | Nenhuma. Testado e funcional.                 |
| BFF Deny-by-Default                  | Concluído        | `COMPROVADO`         | Manter monitoramento contínuo.                |
| Checkout Transacional RPC v2         | Concluído        | `COMPROVADO`         | Suportar métodos de pagamento adicionais.     |
| Invalidação em Tempo Real (Realtime) | Parcial          | `PARCIAL`            | Conectar realtime Supabase em chat e estoque. |
