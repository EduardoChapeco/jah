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
- A UI lida adequadamente com o estado de *Loading*, *Error*, e *Vazio Honesto*?

## Regra de Ouro:
> Se o usuário pedir para adicionar um campo de formulário, você não adiciona apenas o `<input>`. Você cria a coluna na migration, o schema Zod na BFF, a policy de RLS se necessário, e SÓ ENTÃO você desenha a UI.
