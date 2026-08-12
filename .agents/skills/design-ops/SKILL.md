---
name: design-ops
description: "Use when creating or modifying ANY UI components (React, Tailwind) for the JAH project. Triggers: layout, typography, UI, Tailwind, components, styling, surface, button, design system, colors, clean, minimal."
---

# Design Ops Protocol (JAH)

## Core Principles

**1. A 'Cara' do Projeto é CLEAN e MINIMALISTA**
A JAH adotou um visual estritamente profissional, sofisticado e neutro (estilo Vercel/Apple).
> **PROIBIDO:** Estilos "Neo-Brutalist", bordas grossas (border-4), sombras sólidas rígidas e cores chamativas gritantes.

**2. Proibição de Cores e Fontes Genéricas**
Você **NUNCA** deve usar `bg-red-500`, `text-blue-600` ou afins.
Você deve **SEMPRE** utilizar as variáveis semânticas (ex: `bg-primary`, `text-muted-foreground`, `border-border`) baseadas no sistema limpo em `src/styles.css` e `docs/DESIGN.md`.

## Regras de Estilização Canônica

- **Tipografia**: O padrão é `Inter` (sans). Use as utilities prontas para coesão:
  - `.text-editorial`: Fonte sans para cabeçalhos limpos.
  - `.eyebrow`: Para overlines pequenas e discretas.
  - `.text-meta`: Textos utilitários em cor `muted-foreground`.

- **Superfícies**:
  - Prefira o componente padrão `<Card>` do Shadcn para painéis e invólucros.
  - Para bordas finas com sombra suave, utilize o padrão do Tailwind `border rounded-lg shadow-sm`.
  - O Light Theme padrão usa `bg-background` (Branco) para dar respiro.

- **Elevação e Animação**:
  - Sombras devem ser esfumaçadas e sutis (`shadow-sm`, `shadow-md`).
  - Efeitos de hover devem se basear em transições suaves de cor, opacidade ou sombras leves, não em saltos (`translate-y-0.5`).

## Brainstorming & Projection (Seja um UI/UX Designer Minimalista)
Antes de construir uma tela:
1. Pense no "Respiro" (White Space). Componentes clean exigem bom padding (`p-6`, `p-8`) e gaps definidos.
2. Contraste focado na usabilidade: a ação principal deve estar clara (normalmente botão preto sólido), enquanto as ações secundárias são outlines ou ghosts.

## O que NÃO Fazer:
- Não crie elementos extravagantes ou cores literais no className.
- Nunca adicione `shadow-hard` ou `hover-lift`.
