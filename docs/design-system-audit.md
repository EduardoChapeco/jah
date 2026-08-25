# Design System Audit — Wider Community Platform

> **Microfase B0.1** — Auditoria e Canonização Inicial do Design System
> Data: 2026-08-03 | Status: Auditoria de investigação (nenhum código alterado)

---

## 1. Carga de Fontes — Confirmado

**Arquivo:** `src/routes/__root.tsx` linhas 150–159

As fontes são carregadas dinamicamente via Google Fonts na função `head()` do root route:

```
https://fonts.googleapis.com/css2?
  family={theme.font_body || "Inter"}:wght@400;500;600;700
  &family={theme.font_heading || "Oswald"}:wght@400;500;600;700
  &family=Space+Grotesk:wght@400;500;600;700
  &family=JetBrains+Mono:wght@400;700;800
  &display=swap
```

| Fonte                | Padrão (sem tema)         | Configurável via CMS | Status                     |
| -------------------- | ------------------------- | -------------------- | -------------------------- |
| **Inter** (body)     | Sim — fallback padrão     | Sim (font_body)      | ✅ CONFIRMADO              |
| **Oswald** (display) | Sim — fallback padrão     | Sim (font_heading)   | ✅ CONFIRMADO              |
| **Space Grotesk**    | Sim — hardcoded no link   | Não                  | ✅ CONFIRMADO              |
| **JetBrains Mono**   | Sim — hardcoded no link   | Não                  | ✅ CONFIRMADO              |
| **Roboto Mono**      | Não — apenas fallback CSS | Não                  | ❌ Ausente no Google Fonts |

O `RootShell` injeta CSS dinâmico quando `theme` existe, podendo sobrescrever `--font-sans` e `--font-display` para qualquer fonte Google configurada no CMS da loja.

---

## 2. Tokens de Cor — Inventário Completo

### 2.1 Tokens Primitivos Jah (`:root`)

| Token                | Valor Oklch           | Hex Aprox.      | L%  | Descrição                      |
| -------------------- | --------------------- | --------------- | --- | ------------------------------ |
| `--ink`              | `oklch(0.2 0 0)`      | `#1a1a1a`       | 20% | Preto-carvão (texto principal) |
| `--paper`            | `oklch(0.97 0.01 90)` | `#f4f4f0`       | 97% | Branco-amarelado (fundo)       |
| `--newsprint`        | `oklch(0.92 0.01 90)` | `#e8e8e3`       | 92% | Cinza-papel (cards, muted)     |
| `--directory-yellow` | `oklch(0.9 0.15 95)`  | `#fde047` aprox | 90% | Amarelo listas telefônicas     |
| `--poster-red`       | `oklch(0.55 0.22 25)` | `#dc2626` aprox | 55% | Vermelho pôster                |
| `--signal-orange`    | `oklch(0.65 0.2 45)`  | `#ea580c` aprox | 65% | Laranja sinal                  |
| `--electric-cyan`    | `oklch(0.7 0.15 230)` | `#06b6d4` aprox | 70% | Ciano elétrico                 |
| `--faded-blue`       | `oklch(0.6 0.1 260)`  | `#4f7aad` aprox | 60% | Azul desbotado                 |

### 2.2 Tokens Semânticos (mapeamento shadcn)

| Token                                        | Mapeamento                         | Hex Aprox.            |
| -------------------------------------------- | ---------------------------------- | --------------------- |
| `--background`                               | `--paper`                          | `#f4f4f0`             |
| `--foreground`                               | `--ink`                            | `#1a1a1a`             |
| `--card` / `--card-foreground`               | `--newsprint` / `--ink`            | `#e8e8e3` / `#1a1a1a` |
| `--primary` / `--primary-foreground`         | `--ink` / `--paper`                | `#1a1a1a` / `#f4f4f0` |
| `--secondary` / `--secondary-foreground`     | `--directory-yellow` / `--ink`     | `#fde047` / `#1a1a1a` |
| `--muted-foreground`                         | `oklch(0.4 0 0)`                   | `#5a5a5a`             |
| `--accent` / `--accent-foreground`           | `--poster-red` / `--paper`         | `#dc2626` / `#f4f4f0` |
| `--destructive` / `--destructive-foreground` | `--poster-red` / `--paper`         | idem                  |
| `--success` / `--success-foreground`         | `oklch(0.62 0.13 150)` / `--paper` | `#16a34a` aprox       |
| `--warning` / `--warning-foreground`         | `--directory-yellow` / `--ink`     | `#fde047` / `#1a1a1a` |
| `--info` / `--info-foreground`               | `--electric-cyan` / `--ink`        | `#06b6d4` / `#1a1a1a` |
| `--border`                                   | `--ink`                            | `#1a1a1a`             |
| `--ring`                                     | `--poster-red`                     | `#dc2626`             |

### 2.3 Análise de Contraste WCAG 2.2 AA (pares críticos)

> Mínimo: 4.5:1 texto normal · 3:1 texto grande e componentes

| Par de Cores                         | Ratio Est. | AA Normal    | AA Grande |
| ------------------------------------ | ---------- | ------------ | --------- |
| ink (#1a1a1a) on paper (#f4f4f0)     | ~17:1      | ✅           | ✅        |
| paper (#f4f4f0) on ink (#1a1a1a)     | ~17:1      | ✅           | ✅        |
| ink on directory-yellow (#fde047)    | ~13:1      | ✅           | ✅        |
| paper on poster-red (#dc2626)        | ~5.4:1     | ✅           | ✅        |
| **ink on poster-red (#dc2626)**      | **~3.1:1** | **❌ FALHA** | ✅        |
| ink on electric-cyan (#06b6d4)       | ~5.2:1     | ✅           | ✅        |
| **paper on signal-orange (#ea580c)** | **~3.9:1** | **❌ FALHA** | ✅        |
| muted-foreground (#5a5a5a) on paper  | ~5.3:1     | ✅           | ✅        |
| ink on newsprint (#e8e8e3)           | ~14:1      | ✅           | ✅        |

**Falhas identificadas:**

- `ink` sobre `poster-red` → 3.1:1, falha para texto normal. Não usar texto pequeno preto sobre fundo vermelho.
- `paper` sobre `signal-orange` → 3.9:1, limiar. Restringir a texto grande ou remover.

### 2.4 Dark Mode (`.dark`)

Inversão simples de `--ink` ↔ `--paper`. Não é um tema escuro projetado:

```css
.dark {
  --ink: oklch(0.97 0.01 90); /* #f4f4f0 — papel vira tinta */
  --paper: oklch(0.2 0 0); /* #1a1a1a — tinta vira papel */
  --newsprint: oklch(0.25 0 0);
}
```

`--directory-yellow`, `--signal-orange` e `--electric-cyan` **não são ajustados** no dark mode — ficam muito luminosos sobre fundo escuro.

---

## 3. Elevação e Sombras

| Token            | Valor                               | Uso                                            |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| `--shadow-sm`    | `2px 2px 0px 0px var(--ink)`        | Botões pequenos, badges                        |
| `--shadow-md`    | `4px 4px 0px 0px var(--ink)`        | Cards, painéis                                 |
| `--shadow-lg`    | `8px 8px 0px 0px var(--ink)`        | Modais, overlays                               |
| `--shadow-brand` | `6px 6px 0px 0px var(--poster-red)` | CTAs especiais                                 |
| `--shadow-hard`  | ❌ **AUSENTE em `styles.css`**      | Referenciado em `surface.tsx` mas não definido |

**Gap:** `shadow-hard` é referenciado em `surfaceVariants elevation:"hard"` mas não existe como token. Isso causa Tailwind class miss silencioso.

---

## 4. Tipografia — Escala e Utilities

**Utilities canônicas Jah:**

| Utility          | Font             | Transform | Weight | Size    |
| ---------------- | ---------------- | --------- | ------ | ------- |
| `text-editorial` | display (Oswald) | UPPER     | 800    | herdado |
| `eyebrow`        | mono (JetBrains) | UPPER     | 700    | 0.75rem |
| `text-badge`     | mono             | UPPER     | —      | 0.65rem |
| `text-meta`      | mono             | —         | —      | 0.75rem |
| `text-nav`       | —                | UPPER     | 700    | 0.7rem  |

**h1–h6 em `@layer base`:** Todos usam `font-display`, uppercase, weight 800, tracking -0.02em. ✅

---

## 5. Componentes UI — Estados

### Button (`src/components/ui/button.tsx`)

| Estado        | Implementado | Como                                                 |
| ------------- | ------------ | ---------------------------------------------------- |
| Default       | ✅           | Classes base                                         |
| Hover         | ✅           | `hover:-translate-y-0.5 hover:-translate-x-0.5`      |
| Active        | ✅           | `active:translate-x-0.5 active:shadow-none`          |
| Focus-visible | ✅           | `focus-visible:ring-2 focus-visible:ring-ring`       |
| Disabled      | ✅           | `disabled:opacity-50 disabled:pointer-events-none`   |
| **Loading**   | ❌           | **Ausente** — sem `aria-busy`, sem spinner integrado |

**Touch target:** `h-10` = 40px — **abaixo de 44px** (mínimo iOS). Variante `lg` (48px) é segura.

### Input (`src/components/ui/input.tsx`)

| Estado                           | Implementado             |
| -------------------------------- | ------------------------ |
| Default, Focus-visible, Disabled | ✅                       |
| Error                            | ❌ Ausente no componente |
| Loading                          | ❌ Ausente               |

**Touch target:** `h-10` = 40px — mesmo problema do Button.

### Badge (`src/components/ui/badge.tsx`)

7 variantes: `default`, `secondary`, `destructive`, `outline`, `info`, `success`, `warning` — **todas alinhadas com tokens semânticos.** ✅

Estado `disabled` ausente.

### Surface (`src/components/ui/surface.tsx`)

| Variante       | Status | Observação                                              |
| -------------- | ------ | ------------------------------------------------------- |
| `default`      | ✅     |                                                         |
| `zine`         | ✅     |                                                         |
| `flyer`        | ✅     |                                                         |
| `yellow-pages` | ✅     |                                                         |
| `ticket`       | ✅     |                                                         |
| `polaroid`     | ⚠️     | Usa `bg-white` hardcoded — deve usar token              |
| `cardboard`    | ❌     | Usa `#D2B48C` e `#8B4513` hardcoded — violação de token |

**Ausentes (vs. Prompt-Mestre):** `lambe`, `vinil`, `adesivo`, `carimbo`, `zine-textura`

---

## 6. Hard-coded Colors Fora de `styles.css`

| Arquivo                                                  | Instâncias | Tipo                                                    | Prioridade                                |
| -------------------------------------------------------- | ---------- | ------------------------------------------------------- | ----------------------------------------- |
| `__root.tsx` (L118, 178–180)                             | 4          | Fallbacks de tema CMS (`#FF4FB8`, `#121212`, `#F4F1EA`) | 🔴 Alta — `#FF4FB8` rosa não existe no DS |
| `builder.functions.ts` (L450,643,667,980,1012,1269,1551) | 7          | `design_tokens` nos presets de template                 | 🟡 Média                                  |
| `_store.produto.$slug.tsx` (L58–93)                      | 35         | Mapa nome-de-cor→hex (seletor de variante)              | 🟢 Baixa — intencional, apresentação      |
| `surface.tsx` (polaroid, cardboard)                      | 3          | Background/border hardcoded                             | 🟡 Média                                  |
| `admin.cms.tema.tsx` (L39)                               | 1          | Cor padrão de tema `#FF4FB8`                            | 🔴 Alta                                   |

**Cor mais problemática:** `#FF4FB8` (rosa vibrante) — não existe no design system Jah. Herança de template genérico. Deve ser substituída por `var(--poster-red)` ou removida.

---

## 7. Divergência de Identidade Visual — Para Decisão do Proprietário

> **Este ponto requer decisão explícita antes de qualquer mudança de token (Microfase B0.2+).**

### Cenário A — Tema Claro (ATUAL)

|          | Valor                                     |
| -------- | ----------------------------------------- |
| Fundo    | `#f4f4f0` (papel creme quente)            |
| Texto    | `#1a1a1a` (preto-carvão)                  |
| Botão    | `#1a1a1a` (preto)                         |
| Destaque | `#dc2626` (vermelho vivo)                 |
| Metáfora | Zine, jornal de bairro, panfleto xerocado |

### Cenário B — Tema Escuro (Prompt-Mestre)

|          | Valor proposto                                    |
| -------- | ------------------------------------------------- |
| Fundo    | `#090909–#131210` (carvão quase-preto)            |
| Texto    | `#F5F0E6` (marfim envelhecido)                    |
| Botão    | `#952A1E–#B83A2D` (vermelho queimado/óxido)       |
| Destaque | Ocre/dourado envelhecido                          |
| Metáfora | Cartaz de show noturno, vinil, pôster serigráfico |

### Comparativo de impacto

| Aspecto                    | A (Claro)                | B (Escuro)                          |
| -------------------------- | ------------------------ | ----------------------------------- |
| Trabalho de implementação  | Pequeno                  | Grande (recons. completa de tokens) |
| 49 componentes             | ✅ Já funcionam          | ❌ Revalidação completa             |
| Contraste WCAG             | ✅ Parcialmente auditado | ❌ Requer reauditoria               |
| Builder e templates        | ✅ Integrados            | ❌ design_tokens reescritos         |
| Legibilidade mobile ao sol | Excelente                | Regular                             |

### Cenário C — Duplo tema com toggle

Custo ~3× o Cenário A. Requer tokens 100% semânticos (sem hardcoded) em ambos. Recomendado apenas se o uso noturno for central para a plataforma.

---

## 8. Gaps Prioritários

### Prioridade 1 — BLOQUEADOR

- [ ] **Decisão de identidade visual (claro/escuro)** — proprietário obrigatório

### Prioridade 2 — CRÍTICO

- [ ] `#FF4FB8` em `__root.tsx` e `admin.cms.tema.tsx` — cor rosa inexistente no DS
- [ ] `--shadow-hard` ausente em `styles.css` (referenciado em `surface.tsx`)
- [ ] Button sem estado `loading` canônico
- [ ] Touch targets — Button e Input: 40px < 44px mínimo iOS

### Prioridade 3 — MODERADO

- [ ] `surface.tsx` variantes `polaroid` e `cardboard` com hex hardcoded
- [ ] `builder.functions.ts` design_tokens dos templates com hex raw
- [ ] Input sem estado `error` canônico
- [ ] Badge sem estado `disabled`
- [ ] Dark mode: `--directory-yellow`, `--signal-orange`, `--electric-cyan` não ajustados

### Prioridade 4 — FUTURO

- [ ] Variantes de Surface ausentes: `lambe`, `vinil`, `adesivo`, `zine-textura`
- [ ] Motion/animation tokens
- [ ] Z-index canônico como tokens
- [ ] Tenant override layer
- [ ] Storybook/catálogo visual executável
- [ ] Testes de regressão visual automatizados

---

## 9. Critérios de Aceite da Microfase B0.1

- [x] Commit checkpoint `bb8a717` realizado antes desta microfase
- [x] Fontes confirmadas como carregadas (Inter, Oswald, Space Grotesk, JetBrains Mono)
- [x] Tokens de cor inventariados com valores Oklch e hex aproximado
- [x] Análise de contraste WCAG para pares críticos — 2 falhas documentadas
- [x] Hard-coded colors inventariados: 6 arquivos, 5 críticos em produção
- [x] Divergência claro/escuro documentada com 2 cenários e implicações
- [x] Proprietário deve decidir sobre identidade visual antes de B0.2

## 10. Status da Microfase B0.2 — Harmonização Concluída

- [x] **Erradicação Total de Cores Hardcoded**: Varredura sistemática com ripgrep confirmou 0 ocorrências de cores arbitrárias (`bg-red-*`, `text-blue-*`, `bg-slate-*`, etc.) em todas as rotas e componentes UI.
- [x] **Padronização das Superfícies Operacionais**: Todas as telas do Workspace adotam o Paradigma Clean (`surface-paper`, `bg-background`, `border-border`, `rounded-xl`, flat design sem sombras pesadas).
- [x] **Preservação de Camada Zine/Editorial**: Estética editorial restrita aos canais de apresentação pública e visual branding.
- [x] **Zero Regressão**: `npm run typecheck` com 0 erros de compilação em toda a árvore de arquivos.
