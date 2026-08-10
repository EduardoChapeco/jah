# AGENTS.md — Regras de implementação (Jah Community Platform)

> Regras vinculantes para qualquer pessoa/agente que edite este projeto.
> Nenhuma regra crítica pode existir só no chat. As fontes únicas de verdade
> estão listadas abaixo; em caso de conflito, o documento vence o chat.

## Fontes únicas de verdade

| Assunto                                           | Documento                              |
| ------------------------------------------------- | -------------------------------------- |
| Tokens de design, tipografia, estados, responsivo | `DESIGN.md` + `src/styles.css`         |
| Plano, escopo, fora de escopo, critérios          | `docs/MASTER_PLAN.md`                  |
| Fases e aceite                                    | `docs/ROADMAP.md`                      |
| Camadas, cache, filas, observabilidade            | `docs/ARCHITECTURE.md`                 |
| Entidades, invariantes, máquinas de estado        | `docs/DOMAIN_MODEL.md`                 |
| Rotas, permissão, fase                            | `docs/ROUTES.md` + `src/lib/routes.ts` |
| Segurança, RBAC/RLS, LGPD, uploads, webhooks      | `docs/SECURITY.md`                     |
| Contratos de API/serviços                         | `docs/API_CONTRACTS.md`                |
| Componentes canônicos e estados                   | `docs/COMPONENT_CATALOG.md`            |
| Testes                                            | `docs/TEST_STRATEGY.md`                |

O registro tipado de rotas em `src/lib/routes.ts` é a fonte de verdade
programática de navegação e deve espelhar `docs/ROUTES.md`.

## Stack

- TanStack Start + React 19, TypeScript **strict**, Tailwind v4, shadcn/ui.
- Roteamento file-based em `src/routes/`. Data fetching centralizado
  (TanStack Query) — nunca `useEffect + fetch` para carga inicial.
- Estrutura de pastas obrigatória:
  - `src/components/ui` — primitivos shadcn / Jah Primitives (`<Surface>`, etc.)
  - `src/components/commerce` — componentes de vitrine/feed/eventos
  - `src/components/admin` — componentes de painel (sem modais apertados)
  - `src/components/state` — estados (empty/error/loading/permission/...)
  - `src/features/*` — features por domínio
  - `src/routes/*` — rotas
  - `src/lib/*` — utilidades, registry de rotas, formatação
  - `src/services/*` — domain services tipados (BFF/server functions)
  - `src/types/*` — tipos de domínio e DTOs
- Nada de `App.tsx` monolítico; nada de `src/pages/`.

## Regras invioláveis

1. **Sem acesso direto ao Supabase em componentes React.** Toda leitura/mutação
   de domínio passa por `src/services/*` (server functions / BFF). Supabase é
   persistência + Auth, protegido por RLS deny-by-default — nunca atalho de
   segurança.
2. **Identidade Multi-Contexto e Separação.** A Jah tem contas de Pessoa (Social) e Perfil de Negócio (Loja/Organizador). Toda mutação e leitura deve exigir validação de sessão em qual contexto o usuário está atuando.
3. **Dinheiro = integer cents + currency `BRL`.** Nunca float. Formatação via
   `src/lib/money.ts`.
4. **Datas** ISO UTC no armazenamento; exibição em `America/Sao_Paulo` via
   `src/lib/datetime.ts`.
5. **Sem dados fictícios, "Em breve" ou integrações "Mocks".** Nada de mock APIs, produtos inventados, botões sem destino. Eventos, produtos e serviços exibidos na interface (Feed/Diretório) devem consumir instâncias REAIS do banco. O motor de CMS/Builder não substitui entidades do banco de dados (ex: Não copie horários em um JSON).
6. **Integrações (Mapas, Pagamento, Frete)** têm status `unconfigured | testing | active | error`. Sem credencial => a UI de integração desaparece (utiliza-se fluxo manual fallback).
7. **Design System da Rua (Jah).** Uso exclusivo dos Design Tokens de `src/styles.css`. Não criar novos `Dialogs` pequenos para fluxos complexos (usar `Sheet` expansivo 75% da tela ou página inteira). Use o componente genérico `<Surface>` para variar temas (zine, ticket, lambe, journal) em vez de aplicar estilos ad-hoc.
8. **Idempotência e transação** em toda operação financeira/estoque/pedido
   (contratos definidos, implementação nas fases seguintes).
9. **Segredos** nunca no bundle/logs. Service role só no servidor.
10. **UUID não substitui autorização.** RBAC e verificação cruzada de tenant no servidor sempre.

## Convenções de código

- `TypeScript strict`; sem `any` implícito; DTOs distintos das entidades.
- Validação compartilhada por schema (`zod`).
- Rotas e menus refletem estritamente o estado funcional do sistema. Funcionalidades planejadas não devem vazar para o registro de rotas se a infraestrutura/persistência não estiver validada.
- Componentes de dado/ação implementam: loading, empty, error, permission,
  disabled, unconfigured.
- Acessibilidade WCAG 2.2 AA. Tipografia legível para operacional, expressiva apenas para display/decorativo.

## Fase atual

**Fase 1 Jah** — Substituição Documental e Fundação do Design System da Rua (Zines/Flyers/Tickets/Papers). Atualização do núcleo canônico de uma loja comum para Plataforma Comunitária. Não avance para as lógicas de evento/feed sem consolidar as primitivas visuais.

## Protocolo de Execução e Auditoria Rigorosa (Product Owner / PM)

A plataforma Jah é um ecossistema vivo onde uma alteração afeta profundamente outros domínios. Atue sempre com o rigor de um Product Owner e Engenheiro Sênior de uma big tech:

- **Planejamento em Microfases (Planos de Implementação Completos):** Antes de codificar, crie um plano detalhado para cada microfase cobrindo _a raiz completa_: impacto nas tabelas, schemas, contratos, inputs, colunas, rotas, storage, RLS e componentes.
- **Auditoria End-to-End:** Nunca faça correções locais. Reconstrua a árvore de impacto completa. Descubra quem produz, valida, persiste, transforma, consulta, exibe e protege o dado.
- **Rigor Documental e Científico:** Faça análise holística para cada incremento, referenciando melhores metodologias. Todo novo recurso ou refatoração deve ter comentários, casos de uso mapeados (admin, cliente, logista, etc.) e aderência estrita às regras globais.
- **Verdade no Runtime:** A prova de completude deve vir do código executado, persistência real no Supabase, reload do browser, RLS testado e experiência do usuário — e não apenas de tipagem, build ou documentação. Não simule, não use hardcode, não mantenha código morto.
