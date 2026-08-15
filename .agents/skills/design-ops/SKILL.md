---
name: design-ops
description: "Use when creating or modifying ANY UI components (React, Tailwind) for the JAH project. Triggers: layout, typography, UI, Tailwind, components, styling, surface, button, design system, colors, clean, minimal."
---

# Design Ops Protocol (JAH)

## Core Principles (Estilo iFood / Threads)

**1. A 'Cara' do Projeto é ULTRA CLEAN e MINIMALISTA**
A JAH adotou um visual estritamente moderno, focado em silêncio visual, retenção e usabilidade fluida (semelhante ao Threads, iOS, iFood, Vercel).

> **PROIBIDO:** Estilos "Neo-Brutalist", bordas grossas (border-2 ou border-4), sombras sólidas, backgrounds coloridos desnecessários, cantos quadrados duros (`rounded-none` ou `rounded-sm`).

**2. Proibição Total de Cores e Medidas Genéricas (HARDCODE ZERO)**
Você **NUNCA** deve usar `bg-red-500`, `text-blue-600`, `px-7`, `gap-5` ou afins.
Você deve **SEMPRE** utilizar as variáveis semânticas do Tailwind (ex: `bg-primary`, `text-muted-foreground`, `border-border`, `p-6`, `gap-6`). A fonte da verdade é o `docs/DESIGN.md`.

## Regras de Estilização Canônica

- **Tipografia**: O padrão é `Inter` (sans). Use as classes nativas limpas:
  - Textos de corpo: `text-sm text-foreground` ou `text-sm text-muted-foreground`.
  - Cabeçalhos: `text-lg font-semibold text-foreground` (nunca abuse de tamanhos gigantes).
  - Overlines: `text-xs uppercase tracking-wider font-medium text-muted-foreground`.

- **Superfícies e Formas (Radiuses)**:
  - Formas são arredondadas e amigáveis.
  - Cards padrão: `border border-border rounded-xl bg-background`.
  - Paineis ou Modais: `rounded-2xl`.
  - Inputs e botões pequenos: `rounded-md` ou `rounded-lg`.
  - Chips e status: `rounded-full` (pill).

- **Elevação (Sem Sombras)**:
  - O design é predominantemente "Flat". Separe blocos através de **bordas finas** (`border-border`) e espaços generosos (`gap-6`), não com box-shadow.
  - Sombras (`shadow-sm`) são reservadas _estritamente_ para modais, dropdowns flutuantes ou destaque muito sutil ao passar o mouse (`hover-elevate`).

## Brainstorming & Projection (Seja um UI/UX Designer Minimalista)

Antes de codar uma tela:

1. **Respiro (White Space)**: Você tem padding suficiente? `p-6` ou `p-8` é o ideal para containers.
2. **Contraste de Ação**: O botão principal é escuro/sólido (`bg-foreground text-background`). Todo o resto é outline ou ghost (`variant="ghost"`).
3. **Erradicação do Lixo Visual**: Remova divisórias desnecessárias. Remova textos redundantes. Menos é mais.

## O que NÃO Fazer:

- Não crie elementos extravagantes ou cores literais no className.
- Nunca crie páginas que parecem Landing Pages coloridas dentro da área operacional. A operação é focada no trabalho do usuário.
