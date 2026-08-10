## O que eu verifiquei (fatos, não suposições)

**1. O app está quebrado agora.** A home retorna 500. Causa confirmada no log do dev server:

```text
src/router.tsx → routeTree.gen.ts → routes/admin.stories.tsx
  → services/cms.functions.ts:11  (import estático)
  → lib/supabase-ssr.server.ts:12 → "@tanstack/react-start/server"  ← bloqueado no cliente
```

Isso **não é um caso isolado**: 22 arquivos fazem `import { getSSRClient } from "@/lib/supabase-ssr.server"` no topo do módulo, incluindo `src/lib/identity.ts`, `src/lib/auth-guards.ts`, `src/services/cart-helpers.ts` e — o pior caso — a rota de UI `src/routes/_store.conta.avaliacoes.tsx:3`. Nenhum usa `await import(...)`. Corrigir só o `cms.functions.ts` derruba o próximo arquivo da fila.

**2. Agravante estrutural:** os arquivos `*.functions.ts` não são "wrappers finos". Ex.: `cms.functions.ts:17` exporta `listAdminPagesHandler` como função comum ao lado dos `createServerFn`. Isso impede o bundler de isolar o código de servidor, o que é exatamente o que faz o import proibido vazar para o cliente.

**3. O builder é real, não é maquete.** `admin.vitrine.tsx` e `admin.perfil-publico.tsx` chamam `checkExperienceDocumentExists` / `getOrCreate*Document` e redirecionam para `admin.builder.$documentId.editor.tsx`, que carrega `getExperienceDocument` e salva com `saveBuilderNodes` / `publishBuilderVersion`. As tabelas existem em `supabase/migrations/0048_builder_platform_core.sql` (`experience_documents`, `experience_versions`, `experience_nodes`) + 0049/0050. São 95 migrations reais no repositório.

**4. Não há dados fictícios alimentando o app.** Não existe array de produtos hardcoded; todas as listagens vêm de server functions. Mocks só em `*.test.ts`. Um único `TODO` real: `src/routes/sitemap[.]xml.ts:6` (domínio do projeto). As URLs Unsplash em `builder-registry.ts` e `home-templates-library.ts` são imagens semente de template (editáveis pelo lojista) — legítimas, mas vou revisá-las.

**5. Ressalva importante sobre o banco.** Não existe `.env` em desenvolvimento; só `.env.production`, e nele a primeira linha tem um **espaço no nome da variável** (` VITE_SUPABASE_URL`), o que a invalida. Como você optou por não mexer no backend agora, o app vai continuar caindo em `SupabaseUnconfiguredError` em dev — ou seja, **eu consigo estabilizar o código e validar o builder até o ponto de "banco não configurado", mas não consigo testar salvar/publicar com dados reais** nesta rodada. Digo isso na entrega em vez de fingir que passou.

## Plano

### Fase 1 — Estabilizar a fronteira servidor/cliente (desbloqueia tudo)

- Padronizar o acesso ao cliente SSR: remover os 22 imports estáticos de `supabase-ssr.server` e passar a resolvê-lo com `await import(...)` dentro de cada handler, seguindo o padrão que o próprio projeto já usa para `@/lib/identity` e `@/lib/tenant`.
- `src/lib/identity.ts` e `src/lib/auth-guards.ts`: renomear para `*.server.ts` ou isolar a parte servidor, já que hoje são pontes de vazamento.
- `src/routes/_store.conta.avaliacoes.tsx`: remover o acesso direto ao Supabase da rota e passar por um service — isso viola a regra 1 do `AGENTS.md`.
- Em `cms.functions.ts`, o `getSSRClient` importado parece nem ser usado (os handlers usam `getServerClient`); confirmo com grep e removo se for morto.
- Tornar os `*.functions.ts` wrappers finos: mover helpers/constantes de escopo de módulo para `*.server.ts` irmãos.
- Critério de aceite: `/` responde 200, o editor abre, `tsgo` limpo e a suíte de testes existente passa.

### Fase 2 — Auditoria do builder (vitrine + perfil institucional)

- Percorrer o fluxo ponta a ponta: escolher template → criar documento → editar nós → salvar → publicar → renderizar no storefront (`experience-renderer.tsx`).
- Verificar consistência entre `builder-registry.ts` (1320 linhas), `builder-types.ts` e as seções realmente renderizadas: todo tipo de bloco registrado precisa ter renderer; todo renderer precisa estar no registry. Blocos órfãos são removidos ou implementados.
- Conferir undo/redo, estado sujo/salvo, versionamento (rascunho vs. publicado) e os estados obrigatórios do `DESIGN.md` §5 (loading/empty/error/permission/unconfigured) no editor.
- Validar que `admin.vitrine.tsx` e `admin.perfil-publico.tsx` não divergem em comportamento (hoje são cópias quase idênticas) — extrair o que for duplicado.
- Reportar por escrito o que funciona, o que está quebrado e o que só dá para confirmar com banco ligado.

### Fase 3 — Placeholders e higiene

- Resolver o `TODO` do sitemap.
- Revisar cada "Em breve" encontrado (`contact-form.tsx`, `return-modal.tsx`, `_store.stories.tsx`, `_store.conta.pedidos.$id.tsx`, flag em `lib/routes.ts`): pela regra 5 do `AGENTS.md`, o que for funcionalidade inexistente sai da UI; o que for status transacional legítimo fica.
- Mover ~30 scripts soltos da raiz (`fix-*.mjs`, `audit_variants.ts`, `scratch/`, `res.json()...`, `user_inputs*.txt`) para `scripts/legacy/`.
- Corrigir o espaço no nome da variável em `.env.production` (arquivo de config, sem tocar em credenciais).

### Detalhes técnicos

O motor da correção da Fase 1 é a regra do TanStack Start: um módulo alcançável pelo grafo do cliente não pode conter aresta estática para `@tanstack/react-start/server` nem para arquivos `*.server.ts`. Duas saídas válidas — `await import()` dentro de `.handler()`, ou o helper virar `*.server.ts` e nunca ser importado por código de UI. Vou aplicar as duas conforme o arquivo, sem trocar a arquitetura de services por RPC novo.

### Fora do escopo desta rodada

Provisionar backend, rodar migrations, alterar schema ou credenciais; qualquer mudança de regra de negócio (preço, frete, estoque, comissão).
