# COMPONENT_CATALOG.md — Jah Platform Design System

> Componentes canônicos e seus estados obrigatórios. Fonte de verdade de UI
> junto de `DESIGN.md` e `docs/design-system-audit.md`. Todo componente de dado/ação
> implementa: **loading, empty, error, permission, disabled, unconfigured** (ver `DESIGN.md` §5), além
> de default/success quando aplicável. Nenhum componente faz cálculo comercial
> no cliente.

## Camadas

- `src/components/ui` — primitivos shadcn / Jah Primitives (adaptados por variantes/tokens).
- `src/components/commerce` — vitrine pública.
- `src/components/admin` — painel.
- `src/components/state` — estados reutilizáveis.

## Primitivos Canônicos Jah (`src/components/ui`)

| Componente | Variantes / Recursos | Notas de Estado & Acessibilidade |
|---|---|---|
| `<Surface>` | `default`, `zine`, `flyer`, `yellow-pages`, `ticket`, `polaroid`, `cardboard`, `charcoal` | Elevações: `none`, `sm`, `md`, `hard`. Usa tokens Oklch semânticos que respondem ao dual theme. |
| `<Button>` | Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Tamanhos: `default (44px)`, `sm`, `lg`, `icon (44px)` | Suporta `isLoading` (exibe spinner Jah + `aria-busy`), `loadingText`, `disabled`. Touch target mínimo de 44px para iOS. |
| `<Input>` | Estilo brutalista borda dura 2px | Suporta `hasError` (`border-destructive`, `aria-invalid`), `disabled`. Touch target mínimo de 44px (`h-11`). |
| `<Badge>` | `default`, `secondary`, `destructive`, `outline`, `info`, `success`, `warning` | 7 variantes alinhadas com os tokens de status do design system. |
| `<ThemeToggle>` | Alternador contextual de tema (`system` → `light` → `dark`) | Acessível por teclado, `title` e `aria-label` dinâmicos. Ícone contextual (Monitor / Sol / Lua). |

## Gerenciamento de Tema (`src/lib/theme.ts`)

- `useTheme()`: Hook para resolver tema (`system` | `light` | `dark`). Sincroniza com `prefers-color-scheme` do celular e persiste em `localStorage`.
- `themeInitScript`: Script inline anti-FOUC injetado no `<head>` em `__root.tsx`. Executa antes do primeiro paint para evitar o efeito de "piscar" a cor errada.
- Suporta classes `.light` e `.dark` no elemento `<html>` para override manual.

## Estados (`src/components/state`)

| Componente | Uso | Estados que representa |
|---|---|---|
| `EmptyState` | Sem dados (honesto, sem fake) | empty |
| `ErrorState` | Falha de carga + retry | error |
| `PermissionState` (alias de `PermissionDenied`) | Sem autorização | permission |
| `UnconfiguredState` | Integração sem credencial | unconfigured |
| `LoadingState` | Indicador central com `role="status"` | loading |
| `ProductCardSkeleton` / `ProductGridSkeleton` / `LinesSkeleton` | Carregamento sem layout shift | loading |
| `StatusBadge` | Pílula de status por token (`unconfigured/testing/active/error/planned`) | status |
| `SectionFrame` | Wrapper de seção com eyebrow/título/ação | — |
| `PlannedFeature` / `PhaseGate` (admin) | Funcionalidade não construída | "Planejado para a Fase X" (somente painel) |

## Vitrine (`src/components/commerce`)

| Componente | Descrição | Notas de estado |
|---|---|---|
| `BrandLogo` / `Logo` | Marca real Jah (imagem) | — |
| `PublicHeader` | Cabeçalho + menu mobile (Sheet) + ThemeToggle | navegação sempre válida (derivada do registry) |
| `MobileBottomNav` / `BottomNav` | Navegação inferior sticky (mobile) | alvos >= 44px, `pb-safe` |
| `PublicFooter` | Rodapé com colunas | links reais |
| `PageHeader` | Título/eyebrow/ações | responsivo (grid + min-w-0) |
| `ProductCard` | Card de produto (DTO server-side) | loading via skeleton; sem cálculo local |
| `PriceDisplay` | Formata cents+BRL do servidor | apenas formatação, nunca cálculo |

## Painel (`src/components/admin`)

| Componente | Descrição | Notas |
|---|---|---|
| `AdminShell` | Sidebar recolhível (desktop) + topbar + ThemeToggle + bottom nav (mobile) | responsivo, safe-area, alvos >= 44px |
| `PlannedFeature` / `PhaseGate` | Estado honesto de fase | nunca na vitrine |

## Acessibilidade (todos)

- Alvos interativos >= 44x44px (`min-h: 44px`); foco visível (`ring` = brand); navegação por teclado.
- Ícones decorativos com `aria-hidden`; ícones de ação com `aria-label`.
- Respeita `prefers-reduced-motion` e `prefers-color-scheme` do dispositivo; contraste WCAG 2.2 AA.

## Regra de dados

- Componentes nunca acessam Supabase diretamente nem calculam preço/desconto/frete/estoque. Consomem DTOs da camada de serviços (`src/services`).

