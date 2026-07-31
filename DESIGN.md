# DESIGN.md — Hr Shoes Commerce

> Fonte única de verdade do design system. Segue a especificação aberta
> Google Labs `DESIGN.md`: tokens semânticos em YAML + justificativa humana,
> estados, componentes e regras responsivas. Os valores canônicos vivem em
> `src/styles.css`; este documento explica o "porquê". Componentes consomem
> tokens semânticos — nunca hex/radius/shadow soltos.

## 1. Direção criativa

```yaml
brand: Jah
tagline: Identidade, Comunidade e Autenticidade
voice: moderno, direto, universal, focado na comunidade
mood: minimalista, premium, monocromático, alto contraste, focado na imagem
principles:
  - "Espaço em branco é o maior aliado. Deixe o conteúdo respirar."
  - "Monocromático de alto contraste: brancos puros, pretos profundos, cinzas precisos (estilo tech/premium)."
  - "Bordas com raio menor (0.25rem a 0.5rem) transmitem mais firmeza e modernidade."
  - "Sombras ultra-suaves ou uso apenas de bordas de 1px para delimitar conteúdo."
  - "A tipografia deve ser limpa e sem serifa (sans-serif moderno) em todos os níveis, garantindo máxima legibilidade."
anti_patterns:
  - cores berrantes não-intencionais
  - gradientes decorativos ou glassmorphism excessivo
  - caixas fortemente arredondadas (estilo lúdico/infantil)
  - fake data, placeholders visíveis em produção
```

## 2. Tokens de cor (semânticos)

Valores reais em `src/styles.css` (`:root` / `.dark`), formato **oklch**.
Mapeados a utilitários Tailwind via `@theme inline`.

```yaml
color_tokens:
  background:
    {
      value: "#FFFFFF (oklch 1 0 0)",
      role: "canvas branco puro",
      why: "base ultra-minimalista, maximiza foco nas imagens e conteúdo",
    }
  foreground:
    {
      value: "#171717 (oklch 0.2 0 0)",
      role: "preto fosco profundo",
      why: "contraste extremo, legibilidade imediata",
    }
  primary / brand:
    {
      value: "#171717 (oklch 0.2 0 0)",
      role: "acento principal (monocromático)",
      why: "mantém a sobriedade; a marca é o conteúdo",
    }
  primary-foreground: { value: "branco puro", role: "texto sobre primary" }
  brand-soft / accent:
    {
      value: "cinza 5% (oklch 0.95 0 0)",
      role: "realce suave, tags, hovers",
      why: "destaque sem introduzir novas cores",
    }
  secondary: { value: "cinza claro (oklch 0.96 0 0)", role: "superfícies neutras, chips" }
  muted / muted-foreground: { value: "cinza médio (oklch 0.55 0 0)", role: "texto secundário, metadados" }
  card: { value: "branco puro", role: "sem elevação visível, delimitado por borda leve" }
  border / input: { value: "cinza 10% (oklch 0.9 0 0)", role: "divisórias discretas e elegantes" }
  ring: { value: "= foreground", role: "foco visível de teclado alto contraste" }
  destructive: { value: "vermelho puro (oklch 0.6 0.2 25)", role: "erro/exclusão" }
  success: { value: "verde musgo (oklch 0.6 0.12 150)", role: "confirmações" }
  warning: { value: "âmbar suave", role: "atenção, estoque baixo" }
  info: { value: "azul acinzentado", role: "informativo" }
rationale: >
  A interface opera como uma galeria de arte. Cores de marca são removidas da UI estrutural
  para permitir que as imagens dos produtos, lojas e coletivos sejam o único foco de cor e vida.
contrast:
  rule: "WCAG 2.2 AA — texto normal >= 4.5:1, texto grande/ícones >= 3:1."
  check: "Validar contraste no editor de tema antes de publicar (Fase 3)."
```

## 3. Tipografia

```yaml
fonts:
  ui_sans:
    {
      family: "Inter",
      weights: [400, 500, 600, 700],
      use: "toda a UI primária, corpo, labels, dados",
    }
  editorial_serif:
    {
      family: "Inter",
      weights: [400, 500, 600],
      italic: false,
      use: "unificado com ui_sans para consistência total",
    }
loading: "Carregadas via <link> no __root.tsx head."
scale:
  display:
    { size: "clamp(2rem, 6vw, 4rem)", family: sans, weight: 600, tracking: "-0.03em", line: 1.1 }
  h1: { size: "clamp(1.75rem, 4vw, 2.75rem)", family: serif }
  h2: { size: "clamp(1.4rem, 3vw, 2rem)", family: serif }
  h3: { size: "1.25rem", family: serif }
  body: { size: "1rem", family: sans, line: 1.6 }
  small: { size: "0.875rem", family: sans }
  eyebrow: { transform: uppercase, tracking: "0.16em", weight: 600, size: "0.72rem", family: sans }
rationale: >
  Manrope é uma sans altamente legível e distinta (não Inter/Poppins genéricos).
  Fraunces traz o tom editorial de moda apenas em títulos/campanhas, mantendo a
  leitura de dados e formulários 100% na sans.
```

## 4. Espaço, raio, elevação

```yaml
radius:
  { base: "0.75rem", scale: "sm..4xl derivado", why: "cantos macios, contemporâneos, sem exageros" }
spacing: { unit: "4px base (Tailwind)", rhythm: "seções generosas; respiro > densidade na vitrine" }
elevation:
  philosophy: "sombras suaves e curtas; luz difusa; nunca sombra dura de template"
  tokens: [shadow-xs, shadow-sm, shadow-md, shadow-lg, shadow-brand]
grid:
  container: "fluido, max-w-screen-xl; gutters responsivos"
  product_grid: "2 col mobile, 3 col md, 4 col lg"
```

## 5. Estados obrigatórios (todo componente de dado/ação)

```yaml
required_states:
  loading: "skeleton sem layout shift; nunca spinner solto em bloco grande"
  empty: "estado vazio honesto (sem produtos falsos); texto + ação quando fizer sentido"
  error: "mensagem clara + ação de retry; nunca tela branca"
  permission: "bloqueio de acesso claro (sem vazar dados)"
  disabled: "affordance visível e acessível"
  unconfigured: "integração sem credencial -> 'configuração ausente', nunca sucesso simulado"
  coming_soon: "somente no painel: 'Planejado para a Fase X'; nunca na vitrine pública"
success: "confirmações discretas via toast/inline"
```

## 6. Acessibilidade (WCAG 2.2 AA)

```yaml
a11y:
  touch_target: ">= 44x44px em todos os alvos interativos"
  focus: "foco visível (ring = brand) em todo elemento focável"
  keyboard: "navegação e ativação completas por teclado"
  reduced_motion: "respeitar prefers-reduced-motion (global no CSS)"
  labels: "todo input com label; ícones com aria-label"
  errors: "mensagens de erro associadas ao campo, texto claro em pt-BR"
  landmarks: "header/nav/main/footer semânticos; um único h1 por página"
  safe_area: "respeitar env(safe-area-inset-*) em barras fixas"
```

## 7. Layout responsivo

```yaml
responsive:
  approach: "mobile-first; excelente também em desktop"
  public_nav:
    mobile: "header enxuto + sticky bottom nav (>=44px alvos, pb-safe)"
    desktop: "header com navegação horizontal; sem bottom nav"
  admin_shell:
    mobile: "topbar + sticky bottom nav com ações principais"
    desktop: "sidebar recolhível + conteúdo arejado"
  invariants:
    - "sem sobreposição, corte de texto ou scroll horizontal involuntário"
    - "conteúdo nunca escondido atrás de barras fixas (usar padding/safe-area)"
    - "linhas com texto + widget usam grid + min-w-0 + shrink-0 (ver responsive rules)"
```

## 8. Componentes canônicos

Ver `docs/COMPONENT_CATALOG.md` para o catálogo completo com estados.
Resumo de camadas:

```yaml
component_layers:
  ui: "primitivos shadcn adaptados por variantes (src/components/ui)"
  commerce: "vitrine: ProductCard, PriceDisplay, SectionRenderer, ... (src/components/commerce)"
  admin: "painel: AdminShell, DataTable, PhaseGate, ... (src/components/admin)"
  state: "EmptyState, ErrorState, LoadingState, PermissionGate, UnconfiguredState, ComingSoon"
rules:
  - "Nenhum componente faz cálculo comercial (preço/desconto/frete/estoque) no cliente."
  - "PriceDisplay apenas formata cents+BRL vindos do servidor."
  - "Cores/raio/sombra sempre via token; nunca className com hex/bg-white/text-black."
```

## 9. Regras de consumo dos tokens

- Novas cores: adicionar em `:root` **e** `.dark`, registrar em `@theme inline`.
- Preferir tokens semânticos (`bg-primary`, `text-muted-foreground`) a tokens
  brutos (`bg-brand`) — brutos só quando o semântico não expressa a intenção.
- Variantes de componente (cva) para estilos recorrentes, nunca overrides ad hoc.
