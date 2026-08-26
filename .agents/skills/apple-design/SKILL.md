---
name: apple-design
description: >
  Revisor de UI/UX e Design System de alto padrão baseado no Apple Human Interface Guidelines (HIG)
  e adaptado universalmente para a plataforma JAH (React + Tailwind CSS v4 + Radix UI + Phosphor/Lucide).
  Audita e impõe regras estritas de tipografia, contraste (WCAG AA/AAA), touch targets mínimos (44px),
  elevação em camadas (Background -> Card -> Floating Bar -> Sheet/Modal), física de movimento e glassmorphism refinado.
---

# JAH Apple-Grade Design System & HIG Reviewer

Esta skill define os padrões de excelência visual, ergonomia e usabilidade canônica para o ecossistema **JAH Platform**.

---

## 1. Princípios Fundamentais (Apple HIG adaptados)

1. **Clareza e Silêncio Operacional**:
   - Painéis operacionais (Workspace, PDV, Pedidos, Catálogo, Admin) devem ser limpos, silenciosos e funcionais.
   - Textos de alto contraste sobre superfícies neutras (`#FAFAFA` / `#FFFFFF`).
   - Sem ruídos visuais, sem gradientes caóticos e sem sombras artificiais exageradas.

2. **Ergonomia & Touch Targets (Regra dos 44px)**:
   - Todo elemento interativo clicável em dispositivos móveis (botões, ícones, chips, checkboxes) deve possuir área de toque mínima de **44x44px** (altura `h-11` ou espaçamento com hit-area expandida).
   - Desktop: alvos mínimos de 24x24px a 32x32px.

3. **Hierarquia de Camadas e Elevação (Superfícies)**:
   - **Level 0 (Base)**: Fundo principal `bg-background` (`oklch(0.98 0 0)`).
   - **Level 1 (Cards & Conteúdo)**: `bg-card` (`#FFFFFF`), borda sutil de 1px (`border-border/80`), cantos arredondados contidos (`rounded-2xl`).
   - **Level 2 (Barras Flutuantes & Sticky)**: `bg-background/95 backdrop-blur-md border-b border-border/40` (TopBar, BottomNav, Floating Controls).
   - **Level 3 (Overlays / Modais / Drawers)**: `bg-background rounded-2xl shadow-xl backdropEscuro 50%`.

4. **Transições Físicas & Sem Jitter**:
   - Zero `scroll-behavior: smooth` no elemento global `html`.
   - Centralização horizontal de abas via fórmula canônica (`tab.offsetLeft - container.clientWidth / 2 + tab.clientWidth / 2`).
   - Animações curtas (150ms a 250ms) com curvas cúbicas naturais (`cubic-bezier(0.16, 1, 0.3, 1)`).

5. **Acessibilidade & Contraste**:
   - Contraste mínimo de 4.5:1 para texto normal e 3:1 para texto grande (WCAG AA).
   - Estados de foco nítidos (`focus-visible:ring-1 focus-visible:ring-primary`).
   - Textos legíveis com suporte a ampliação dinâmica.

---

## 2. Tabela de Tradução Apple HIG -> JAH Stack

| Conceito Apple HIG | Equivalente JAH Stack (React + Tailwind v4 + Radix) | Regra de Implementação |
| :--- | :--- | :--- |
| **SF Pro / Typography** | `Inter, system-ui, -apple-system, sans-serif` | `font-sans`, pesos 400, 500, 600, 700. |
| **Dynamic Type Scale** | `text-xs (12px)`, `text-sm (14px)`, `text-base (16px)`, `text-2xl (24px)` | Tamanho mínimo de leitura corporal: 13-14px. |
| **Touch Target 44pt** | `min-h-[44px] min-w-[44px]` ou `h-11` | Botões primários mobile e inputs sempre `h-11`. |
| **Liquid Glass / Blur** | `backdrop-blur-md bg-background/90 border border-border/40` | Usado em headers flutuantes, barras inferiores e pills. |
| **Continuous Corners** | `rounded-xl (12px)`, `rounded-2xl (16px)`, `rounded-3xl (24px)` | Squircles suaves e contidos. Sem brutalismo. |
| **Spring Physics** | `transition-all duration-200 ease-out active:scale-98` | Feedback tátil visual ao clique/toque. |
| **Grouped Tables** | `rounded-2xl border border-border bg-card divide-y divide-border/40` | Padrão iOS Settings para formulários e listagens. |
| **Action Sheet / Drawer** | `SheetPage` / `Drawer` via Radix / Vaul (`100dvh` mobile) | Abertura inferior no mobile e lateral no desktop. |

---

## 3. Checklist de Auditoria de Design (53+ Diretrizes HIG)

Ao criar ou editar qualquer tela na plataforma JAH, execute a seguinte verificação:
1. **Layout & Viewport**: O container tem scroll acidental? As barras fixas têm `shrink-0` e altura invariável?
2. **Touch Targets**: Todos os botões e links no mobile têm área de toque >= 44px?
3. **Contraste**: O texto preto está sobre fundo claro ou branco no dark mode sem inversões caóticas?
4. **Alinhamento de Imagens**: Proporções padronizadas (1:1 produtos, 16:9 banners, 21:9 hero desktop)?
5. **Silêncio Operacional**: Ausência de textos prolixos de IA, caixas de ajuda redundantes ou bullet points desnecessários?
6. **Responsividade Adaptativa Mobile**: Textos com tipografia fluida `clamp()`, safe-areas (`safe-bottom` com `env(safe-area-inset-bottom)`) e alturas de tela cheia usando `100dvh`?
7. **Thumb-Zone & Touch Area**: Ações primárias no terço inferior da tela móvel e todos os botões/chips com área de toque mínima de 44x44px (`.touch-target` ou `h-11`)?
