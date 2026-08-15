---
name: recursive-audit
description: "Use when creating, debugging, or modifying ANY feature that spans across UI, BFF (Server Functions), and Database. Triggers: audit, recursively check, bug, E2E, data flow, new feature, component missing data."
---

# Recursive Audit Protocol (JAH)

## Core Principles

A JAH exige a Verificação Recursiva Obrigatória. **Nenhuma mudança é local se for uma mudança sistêmica.**

Antes de criar ou alterar qualquer interface (UI), você **DEVE OBRIGATORIAMENTE** seguir a trilha de dados da ponta até a raiz.

## O Pipeline E2E (Checklist do Arquiteto de Dados)

Siga sempre a direção Banco de Dados -> BFF -> UI quando estiver criando algo novo, e UI -> BFF -> Banco quando estiver resolvendo um bug.

### 1. Banco de Dados (A Raiz)

- A tabela (ex: `carts`) existe no banco e reflete os requisitos?
- Há uma migration que cria ou altera as colunas?
- **Segurança:** O RLS (Row Level Security) está criado para a tabela? Existe proteção por `store_id` (Isolamento Multi-Tenant)?

### 2. Contratos BFF (O Middleware)

- Os serviços em `src/services/` expõem os dados corretamente?
- O Zod Schema de input e output tipa exatamente as colunas que estão no banco? Não use `any` ou tipos não verificados.
- As Server Functions requerem sessão correta (`requireAdmin` ou similares) e fazem as transações ou consultas via RLS (`getServerClient`)?

### 3. Interface (UI) e Componente

- A UI consome a Server Function via hooks apropriados (como React Query via TanStack Start).
- A UI lida adequadamente com o estado de _Loading_, _Error_, e _Vazio Honesto_?
- **PROIBIDO:** Botões com `toast()` falso sem mutação real.

### 4. Governança & Superfície Operacional (Workspace / Gestão)

- Para onde vão os dados gerados por essa ação?
- Existe uma tela no Workspace para o lojista ou administrador visualizar, filtrar, moderar ou reverter essa ação?
- Se a feature cria registros (ex: denúncias, pedidos, trocas, propostas, reservas), a tela de gestão correspondente DEVE ser criada no mesmo PR/entrega.

## Regra de Ouro da Completude Quádrupla:

> Se o usuário pedir para adicionar um recurso (ex: Denúncias, Propostas, Modificadores):
>
> 1. Você cria a **Tabela + RLS** na migration e aplica no banco remoto.
> 2. Você cria as **Server Functions (BFF)** com Zod e checagem de autoridade.
> 3. Você cria o **Componente UI** de ação do usuário com mutação real.
> 4. Você cria a **Tela Operacional no Workspace** para curadoria/gestão pelo admin.
>    NADA pode ser entregue pela metade ou apenas visual.
