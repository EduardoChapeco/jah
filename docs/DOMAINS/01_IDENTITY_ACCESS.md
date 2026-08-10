# Dossiê 01: Identidade, Acessos e Isolamento Multi-Contexto

**Status**: Especificação Final  
**Domínio**: Identity & Access Management (IAM)

---

## 1. Necessidade Humana

**Quem utiliza?** Qualquer indivíduo navegando na plataforma (seja público geral, artistas, empresários, entregadores ou produtores de eventos).
**Por que utiliza?** Para ter uma única conta de login e transitar de forma fluida entre consumir (comprar ingressos, curtir posts) e produzir (vender produtos, validar tickets da sua festa), sem precisar criar múltiplos e-mails ou deslogar.
**Problema que resolve:** O sistema legado de E-commerce travava o usuário em um viés estático de "Cliente" ou "Administrador de 1 loja". Na Jah, uma pessoa é polivalente. Ela pode ser dona de um Coletivo (Organização), colaboradora financeira em uma Loja de Discos, e usuária comum no final de semana.
**Resultado esperado:** Uma única identidade atrelada ao Auth (email/senha/OAuth), possuindo um perfil público pessoal por padrão, e capacidades de criar ou aceitar convites para Organizações (Pessoas Jurídicas/Coletivos), Lojas e Projetos, herdando papéis estritos por cada tenant.

---

## 2. Fluxo Principal

1. **Criação da Conta (Global):**
   - O usuário faz sign-up. A `auth.users` cria a identidade imutável.
   - Um gatilho automático gera um `profiles` (Perfil Pessoal Global) contendo nome, bio, foto.
2. **Entrada na Plataforma:**
   - O usuário loga. O servidor resolve o JWT e injeta a sessão.
   - O contexto inicial ativo é **sempre o contexto Pessoal** (`tenant = null`, `role = visitor/customer`). Ele cai no Feed Comunitário Público.
3. **Criação de um Negócio/Coletivo:**
   - O usuário clica em "Criar Negócio". Ele preenche CNPJ/CPF Profissional, Nome e Nicho.
   - A plataforma cria uma `organizations` (Pessoa Jurídica/Coletivo) e uma sub-unidade operacional `stores` (Loja/Projeto).
   - O usuário vira o `owner` na tabela associativa `organization_members` e `store_members`.
4. **Alternância de Contexto (Context Switch):**
   - No menu lateral (ou nav-bar), há um seletor "Alternar Conta".
   - O usuário escolhe a "Loja de Discos".
   - O frontend emite uma request para o servidor via cookie/session patch (ex: `POST /api/context { store_id: 'abc' }`).
   - A interface do usuário se transforma: o Feed some, o Dashboard Operacional aparece (Caixa, Pedidos, Catálogo).
5. **Convite para Equipe:**
   - No Dashboard da Loja, o `owner` gera um convite informando o E-mail e o Papel (`finance`).
   - Um e-mail transacional é enviado com link mágico.
   - O convidado clica. Se não tem conta, cria. Se tem, aceita o convite.
   - O convidado ganha o registro na `store_members` com a role `finance`.

---

## 3. Fluxos Alternativos e Resiliência

- **Abas diferentes com contextos diferentes:**
  - **Problema:** Usuário abre a Loja A numa aba e a Loja B na outra. Faz uma venda. O dado pode vazar?
  - **Solução:** O `tenant_id` e a `role` não devem ser apenas dependentes do Cookie de "Sessão Ativa". Todo request mutável (RPC ou Server Function) DEVE receber explicitamente no corpo qual `store_id` a aba está manipulando, e o backend cruza isso com a tabela de permissões. O "Cookie de contexto ativo" serve apenas de fallback visual e default redirect para a Home, nunca como prova autoritativa.
- **Remoção de Permissão Instantânea:**
  - Se o dono expulsa o financeiro, a API exclui a linha em `store_members`. O backend imediatamente falha a próxima request do financeiro e força um logout ou re-resolução de contexto. O frontend captura HTTP 403 e ejeta para a Home.
- **Sessão Expira:** Revalidação via Refresh Token; se falhar, limpa Query Cache.
- **Deleção da Conta Global:** Remove o `profile`. O Supabase Auth desliga. Se ele for o único `owner` de uma organização, a organização passa para estado Órfão ou Suspensa (regra de segurança para não sumir dados contábeis irreversíveis).

---

## 4. Máquina de Estados e Transições

**`profile` (Identidade Global)**

- `active`: Conta normal.
- `suspended`: Bloqueio por infração global da plataforma.
- `deleted`: Exclusão soft.

**`organizations` / `stores` (Tenant)**

- `active`: Opera normalmente.
- `past_due`: Assinatura/Boleto da plataforma vencido (Trava saídas, permite leitura).
- `banned`: Fraude.

**`store_members` (Convite/Acesso)**

- `pending`: E-mail enviado.
- `active`: Aceitou.
- `revoked`: Expulso (Soft delete ou exclusão física dependendo da auditoria).

---

## 5. Regras de Negócio e Concorrência

1. **Permissões Explícitas (Não use boolean `admin`):**
   - Papéis fixos: `owner`, `admin`, `manager`, `seller`, `finance`, `content`, `support`, `stock`, `delivery`.
2. **Isolamento de Caches (TanStack Query):**
   - TODA Query Key do frontend DEVE incluir o `store_id` atual, ou `null` se for escopo global.
   - `['orders', 'list', storeId]` garante que trocar de loja não mostre um split-second do pedido alheio.
3. **Escopo Global vs Tenant:**
   - Usuários (`profiles`) são globais.
   - Categorias mestres da plataforma são globais.
   - Produtos, Eventos, Pedidos e Lançamentos Financeiros DEVEM possuir obrigatoriamente `store_id` e `organization_id`.

---

## 6. Experiência de UI/UX (Rotas)

- `/_store/` (Escopo Público Pessoal). Sem painéis complexos. Feed, Biolinks, Explorar.
- `/admin/` (Escopo Tenant). Shell com Layout de Sidebar.
- `GET /admin/select-tenant`: Tela "Qual negócio você quer acessar?" (Caso não haja cookie ativo e tenha múltiplos acessos).
- **Modais:** O seletor de contexto não é um popup interruptivo. Fica ancorado no canto superior esquerdo ou num bottom sheet (mobile).

---

## 7. Persistência (Modelagem Base Canônica)

- **`profiles`**: `id (FK auth.users)`, `full_name`, `avatar_url`, `username`, `bio`.
- **`organizations`**: `id`, `name`, `cnpj`, `status`. A "Pessoa Jurídica/Conta Master".
- **`stores`**: `id`, `organization_id (FK)`, `name`, `type (ecommerce, creator, band, event_producer)`, `settings_snapshot`.
- **`store_members`**: `id`, `store_id (FK)`, `profile_id (FK)`, `role (ENUM)`. Tabela ponte central de RBAC.
- **`delivery_profiles`**: `id (FK profiles)`, `vehicle_type`, `cnh`. (Extensão de perfil se o cara for motoboy).

---

## 8. Contratos e BFF

- `getServerIdentity()`: Retorna:
  ```ts
  {
     id: "uuid",
     active_store_id: "uuid" | null,
     active_role: Role,
     memberships: Array<{ store_id: "uuid", role: Role }>
  }
  ```
- `assertStoreAccess(identity, targetStoreId, allowedRoles)`: Usado em todas as funções de mutação.

---

## 9. Segurança e RLS (Row Level Security)

- **Regra de Ouro RLS:** O RLS atua como _Defense in Depth_, mas a validação real ocorre no BFF (Server Functions) para retornar erros de negócio descritivos.
- **Política RLS em `stores`**: `auth.uid() IN (SELECT profile_id FROM store_members WHERE store_id = stores.id)`.
- **Ownership:** Nada pertence à "Jah". Tudo pertence ao `store_id`.

---

## 10. Propagação e Sincronização

- Se um usuário atualiza o seu `avatar_url` global no perfil pessoal, ele deve atualizar automaticamente em todos os lugares onde ele interage (Posts, Comentários, Operador do PDV). Isso significa que as visualizações devem realizar JOIN com `profiles` na query, em vez de duplicar o nome em `cash_entries`, EXCETO em recibos impressos (onde usamos snapshots).

---

## 11. Observabilidade (Auditoria)

- Toda deleção de `store_members` ou alteração de role (ex: Manager promovido a Admin) deve disparar um log inserido na tabela `audit_logs`, vinculando quem fez (`actor_id`) e quem sofreu (`target_profile_id`).

---

## 12. Critério de Conclusão

Este domínio só estará concluído na Fase de Código quando:

1. Um usuário puder logar, criar dois `stores` distintos.
2. Navegar no Store A e cadastrar o "Produto X".
3. Alternar para o Store B pelo menu.
4. Tentar buscar o "Produto X" e não encontrá-lo no cache, no painel, nem na API (isolamento garantido).
5. O BFF barrar programaticamente o acesso cruzado de abas.
