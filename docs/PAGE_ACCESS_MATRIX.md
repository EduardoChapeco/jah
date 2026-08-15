# Matriz de Acesso de Páginas (RBAC e Rotas)

Esta matriz documenta o controle de acesso e visibilidade das rotas, separando rigidamente a experiência do Cliente da experiência do Lojista/Admin.

> **Regra de Ouro:** Um usuário comum (Customer) nunca pode acessar ou ler dados referentes ao backoffice administrativo. Toda operação de lojista exige um contexto de `store_id` (Tenant).

## 1. Área Pública (Visitor)

Qualquer pessoa na internet, autenticada ou não. Apenas políticas de leitura (SELECT) em recursos públicos ativados.

| Rota / Prefixo | Propósito                      | Acesso Banco (RLS)                               |
| -------------- | ------------------------------ | ------------------------------------------------ |
| `/`            | Feed Social da Comunidade      | `mural_posts` (is_public=true)                   |
| `/catalogo`    | Lista de Produtos e Categorias | `products` (status='active')                     |
| `/produto/:id` | Detalhe da Oferta              | `products`, `product_variants` (status='active') |
| `/carrinho`    | Cesta de Compras               | Guest ou Sessão Local. DB: `guest_carts`         |
| `/checkout`    | Finalização de Pedido          | Guest/Customer cria `order` e `payment`          |

## 2. Área do Cliente (Customer)

Usuários autenticados que estão consumindo produtos e serviços.

| Rota / Prefixo      | Propósito                     | Acesso Banco (RLS)                            |
| ------------------- | ----------------------------- | --------------------------------------------- |
| `/conta`            | Painel de controle do usuário | `profiles` (auth.uid() = id)                  |
| `/conta/pedidos`    | Histórico de compras          | `orders` (customer_id = auth.uid())           |
| `/conta/creditos`   | Saldo e Extrato de Créditos   | `customer_credits` (customer_id = auth.uid()) |
| `/conta/gift-cards` | Cartões presentes recebidos   | `gift_cards` (purchaser_id = auth.uid())      |
| `/conta/enderecos`  | Endereços de entrega salvos   | `addresses` (profile_id = auth.uid())         |

## 3. Área de Transição / Onboarding

A porta de entrada do usuário comum para se tornar um Gestor/Produtor na plataforma.

| Rota / Prefixo   | Propósito                           | Acesso Banco (RLS)                                                    |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `/criar-negocio` | Formulário para criar loja/coletivo | RPC cria `organizations`, `stores`, e `workspace_members` como owner. |

## 4. Área do Gestor (Workspace / B2B)

Acesso bloqueado por guardião `workspace.tsx` e pelas roles em `workspace_members`. Exige que o usuário pertença ao `store_id` ativo.

| Rota / Prefixo             | Propósito                     | Roles Permitidas (RBAC)         | Acesso Banco (RLS)                                  |
| -------------------------- | ----------------------------- | ------------------------------- | --------------------------------------------------- |
| `/workspace`               | Dashboard                     | owner, admin, manager           | `orders`, `products` (store_id)                     |
| `/workspace/pdv`           | Frente de Caixa e Balcão      | seller, manager, owner          | Leitura: Catálogo. Escrita: `orders`                |
| `/workspace/catalogo`      | Produtos, Opções e Coleções   | content, admin, manager, owner  | Leitura/Escrita em tabelas do catálogo pelo tenant. |
| `/workspace/pedidos`       | Kanban e expedição de pedidos | seller, finance, manager, owner | Leitura/Escrita em `orders` (store_id)              |
| `/workspace/caixa`         | Controle de gaveta e turnos   | finance, admin, manager, owner  | `cash_shifts`, `cash_entries` (store_id)            |
| `/workspace/agenda`        | Reservas e Blocos de Tempo    | admin, manager, owner           | `bookings`, `schedule_resources` (store_id)         |
| `/workspace/configuracoes` | Parâmetros e Equipe da Loja   | admin, owner (Equipe: só owner) | `store_settings`, `workspace_members` (store_id)    |

## Tabela de Permissões RLS (Row Level Security) - Arquitetura Alvo

- **Tenant Isolation:** A imensa maioria das tabelas possui uma coluna `store_id`. A regra geral RLS valida que: `store_id IN (SELECT store_id FROM workspace_members WHERE profile_id = auth.uid())`.
- **Prevenção de Fuga (Leaky Tenant):** Nenhuma policy deve permitir `SELECT` se o ID da loja não corresponder ao ID autorizado para a sessão, salvo se a entidade estiver explicitamente flagada como pública (ex: `products` onde `status = 'active'`).
