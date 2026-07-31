# Dossiê 04: Comunidade, Feed e Diretório

**Status**: Especificação Final  
**Domínio**: Social & Community Discovery  

---

## 1. Necessidade Humana
**Quem utiliza?** Toda a base de usuários.
**Por que utiliza?** Para descobrir o que está acontecendo ao seu redor (Eventos, Oportunidades, Discos Novos, Bandas) e interagir com o ecossistema.
**Problema que resolve:** Elimina o abismo entre "plataforma de compra" (e-commerce frio) e "rede social" (engajamento sem transação). A Jah junta os dois: O usuário vê um post sobre um show, e ali mesmo pode garantir o ingresso.
**Resultado esperado:** Um Feed unificado (Timeline) e um Diretório de Serviços (Páginas Amarelas) hiper-locais. Toda entidade publicável (Produto, Evento, Artigo) deve poder ser "encapsulada" num modelo visual (Renderer) para o Feed.

---

## 2. Fluxo Principal

1. **Criação de Postagem Simples:**
   - O usuário abre o app. No topo: "O que está rolando?".
   - Digita um texto e anexa uma foto (Storage).
   - O backend cria um registro na tabela `posts`, vinculado ao seu `profile_id`.
2. **Postagem Atrelada (Produto/Evento/Vaga):**
   - O dono de uma loja cadastra uma "Jaqueta Vintage". Ao salvar e publicar, o sistema pergunta: "Deseja anunciar no Feed?".
   - Ao confirmar, o sistema gera um registro em `posts` com o campo `reference_type = 'product'` e `reference_id = 'id-da-jaqueta'`.
   - O renderer do Frontend identifica a referência, busca os dados da Jaqueta via cache e desenha o post com o card de compra acoplado.
3. **Consumo e Interação:**
   - Usuário desce o feed. Dá like (tabela `post_likes`), comenta (tabela `post_comments`).
   - Clica no Card da Jaqueta e o `<Sheet>` do Produto se abre (sem trocar a rota global, ou com navegação paralela no router).
4. **O Diretório (Busca Local):**
   - Usuário clica na Aba "Diretório". 
   - Procura por "Estúdio de Tatuagem".
   - A query bate na tabela `organizations` / `stores` filtrada por `is_public = true` e busca vetorial/textual por categoria.

---

## 3. Fluxos Alternativos e Resiliência

- **Entidade Apagada (Dangling References):**
  - **Problema:** O post exibe a "Jaqueta Vintage", mas o dono apagou o produto.
  - **Solução:** O Post não quebra. O Frontend tenta resolver o `reference_id`. Se falhar (404), o post exibe: "[Este item foi removido pelo anunciante]". 
- **Moderação / Denúncia:**
  - O Post recebe 3 reports. O Status vai para `hidden`. No Feed, ele é suprimido na query SQL (`where status = 'active'`). 
  - Se for falso positivo, o Admin Master restaura e ele reaparece.

---

## 4. Máquina de Estados e Transições

**`posts` (Feed)**
- `draft`: Rascunho (útil para agendamentos).
- `active`: Visível.
- `hidden`: Suspenso por moderação.
- `archived`: Ocultado pelo próprio autor.

**`organizations` (Diretório)**
- `active`: Listado nas Páginas Amarelas.
- `invisible`: Operando, mas escondido do diretório público (ex: evento privado).

---

## 5. Regras de Negócio e Concorrência

1. **Paginamento Otimizado (Cursor-based):**
   - O Feed nunca deve usar `OFFSET`. Usa-se `cursor = last_post_id` ou `created_at` para não perder posts novos enquanto o usuário rola a página.
2. **Propriedade da Postagem (Identity):**
   - Um usuário logado como Pessoa Física escreve um post: `author_profile_id = user, author_store_id = null`.
   - Um usuário no Contexto de "Loja": `author_profile_id = user, author_store_id = loja`. A foto do post será a logo da loja, não a foto pessoal.

---

## 6. Experiência de UI/UX (Rotas)

- Feed Global (Home): `/`
- Feed da Loja/Usuário: `/:slug` (Perfil de Pessoas ou Lojas).
- Diretório: `/diretorio` (Layout em cards, com categorias no sidebar tipo "Guia Cultural").

---

## 7. Persistência (Modelagem Base Canônica)

- **`posts`**: `id`, `author_profile_id (FK)`, `author_store_id (FK opcional)`, `content_text`, `media_urls (Array)`, `reference_type (ENUM)`, `reference_id (UUID)`, `status`, `created_at`.
- **`post_likes`**: `post_id`, `profile_id`. (PK Composta).
- **`post_comments`**: `id`, `post_id`, `profile_id`, `content`.

---

## 8. Contratos e BFF

- `getFeed(cursor, type)`: Resolve a query JOIN `profiles` e `stores` para exibir o nome do autor corretamente.
- `createInteraction(post_id, type)`: Lida com Likes. Precisa de Debounce e UI otimista no frontend (o coração acende instantaneamente).

---

## 9. Segurança e RLS (Row Level Security)

- Feed de leitura pública (visitor): RLS permite `SELECT` onde `status = 'active'`.
- Deletar post: RLS obriga `auth.uid() = author_profile_id` ou (se for loja) `auth.uid()` tem que estar em `store_members`.

---

## 10. Propagação e Sincronização

- Um post curtido propaga uma notificação na tabela `notifications` pro autor do post. (Ex: "João curtiu sua publicação").

---

## 11. Observabilidade (Auditoria)

- Tabela de reports (`user_reports`) para abrigar queixas de violação de termos de uso no Feed.

---

## 12. Critério de Conclusão

Este domínio estará pronto quando:
1. Puder criar post como Pessoa Física.
2. Mudar pro contexto Loja e criar post como Loja.
3. Rolagem infinita funcionar sem duplicar posts.
4. O Renderer do Feed conseguir plugar um Card de Produto caso `reference_type == 'product'`.
