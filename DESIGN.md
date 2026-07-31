# DESIGN.md — Plataforma Jah (Design System Canônico)

> Fonte única de verdade do design system da plataforma comunitária Jah. Segue a especificação aberta
> Google Labs `DESIGN.md`: tokens semânticos em YAML + justificativa humana,
> estados, componentes e regras responsivas. Os valores canônicos vivem em
> `src/styles.css`; este documento explica o "porquê". Componentes consomem
> tokens semânticos — nunca hex/radius/shadow soltos.

## 1. Direção Criativa

```yaml
brand: Jah
tagline: Identidade, Comunidade, Eventos, Classificados e Lojas
voice: urbano, direto, comunitário, orgânico, autêntico
mood: cultura de rua, cartazes, zines, papel jornal, colagens, fotografia analógica, brutalismo leve
principles:
  - "O conteúdo deve parecer impresso, carimbado, colado ou datilografado."
  - "Texturas (ruído, papel amarelado, papel de lista telefônica) devem guiar o fundo, sem atrapalhar a acessibilidade."
  - "Contraste forte entre o fundo claro amarelado e a tinta de impressão preta profunda."
  - "Sinalizações e acentos usam cores fortes de gráfica: vermelho cartaz, laranja neon, ciano elétrico."
  - "Tipografia limpa para leitura (sans-serif), mas tipografia editorial/condensada pesada para cartazes, títulos e tickets."
anti_patterns:
  - designs de e-commerce "SaaS genérico" com branco puro e azul tecnológico
  - sombras suaves arredondadas (glassmorphism/lúdico)
  - placeholders falsos e mockups perfeitos corporativos
```

## 2. Tokens de Cor (Semânticos)

Valores reais mapeados para variáveis Oklch no `src/styles.css`. O Tailwind v4 as consumirá via `@theme`.

```yaml
color_tokens:
  background / paper:
    {
      value: "#F4F1EA (oklch 0.96 0.01 90)",
      role: "fundo global, textura de papel natural",
      why: "foge do branco absoluto, aquece a interface simulando impressão",
    }
  foreground / ink:
    {
      value: "#121212 (oklch 0.15 0 0)",
      role: "tinta preta densa para texto",
      why: "contraste extremo (ink on paper)",
    }
  primary / vinyl-black:
    {
      value: "#121212 (oklch 0.15 0 0)",
      role: "acento principal e fundos de botões sólidos",
      why: "cores fortes se aplicam nos detalhes, a base é preto no papel",
    }
  primary-foreground / receipt-white: { value: "branco puro amarelado claro", role: "texto sobre primary" }
  secondary / newsprint:
    {
      value: "#E8E6DF (oklch 0.92 0.01 90)",
      role: "fundos de cards secundários, chips, inputs desativados",
      why: "cinza quente, simulando papel jornal",
    }
  muted / muted-ink: { value: "cinza chumbo (oklch 0.5 0.01 90)", role: "texto secundário, labels" }
  accent / signal-orange: { value: "#FF5E00 (oklch 0.65 0.2 45)", role: "realce, hover audacioso, botões de ação" }
  destructive / poster-red: { value: "#E60000 (oklch 0.55 0.2 25)", role: "erro, exclusão, carimbo de 'esgotado'" }
  directory-yellow: { value: "#FADB5F (oklch 0.88 0.12 100)", role: "fundo de listas/diretórios, selos chamativos" }
  success: { value: "#008A2E (oklch 0.6 0.12 150)", role: "confirmações" }
  border / input: { value: "#D1CDC1 (oklch 0.82 0.01 90)", role: "divisórias fortes, bordas marcadas" }
  ring: { value: "= signal-orange ou ink", role: "foco visível brutalista" }

rationale: >
  A base é analógica e impressa. Trocamos o design estéril por uma paleta orgânica (paper e ink)
  e injetamos cores sólidas (poster-red, signal-orange, directory-yellow) como adesivos e selos.
```

## 3. Tipografia (A Gramática Visual)

```yaml
fonts:
  ui_sans:
    {
      family: "Inter",
      weights: [400, 500, 600],
      use: "Leitura rápida, dashboards, inputs, dados tabulares",
    }
  display_cultural:
    {
      family: "Bebas Neue, Anton ou equivalente pesada/condensada",
      weights: [400, 700],
      use: "Títulos de eventos, cartazes, tickets, ingressos, claims audaciosos",
    }
  mono_ticket:
    {
      family: "JetBrains Mono ou Courier",
      weights: [400],
      use: "Códigos de ingresso, metadados impressos, recibos (receipt-white)",
    }

scale:
  display: { size: "clamp(3rem, 8vw, 6rem)", family: display_cultural, transform: uppercase, line: 0.9 }
  h1: { size: "clamp(2rem, 5vw, 4rem)", family: display_cultural, transform: uppercase }
  h2: { size: "clamp(1.5rem, 4vw, 2.5rem)", family: display_cultural }
  h3: { size: "1.25rem", family: ui_sans, weight: 600 }
  body: { size: "1rem", family: ui_sans, line: 1.5 }
  ticket_code: { size: "0.875rem", family: mono_ticket, tracking: "0.1em" }
```

## 4. Textura, Raio, Espaço e Elevação

```yaml
texture:
  noise: "Um grain levíssimo misturado ao background (paper) pode existir como overlay, com prefers-reduced-motion respeitado."
radius:
  { base: "0rem", scale: "0 a 0.25rem", why: "Cantos afiados (0px) ou levíssimos (4px) evocam impressão em papel cortado. Nada redondo." }
elevation:
  philosophy: "brutalismo leve, sombras duras e deslocadas (ex: 4px 4px 0px ink) em vez de blurs. Ou zero sombra e border 1px preta (ink) forte."
  tokens: [shadow-none, shadow-hard, shadow-stamp]
```

## 5. Superfícies Semânticas (Surfaces)

```yaml
surfaces:
  PaperSurface: "Fundo base limpo (paper), com borda fina preta. Para textos longos e cartões comuns."
  NewsprintSurface: "Fundo ligeiramente mais escuro (newsprint), sem borda ou com separação tracejada."
  DirectorySurface: "Fundo amarelo (directory-yellow), fonte densa, usado em guias locais/classificados."
  PosterSurface: "Alto impacto. Pode ter cores invertidas (vinyl-black base, letras claras)."
  TicketSurface: "Bordas simulando picote/serrilhado (via CSS radial-gradient), usa mono_ticket."
```

## 6. Estados e Navegação

```yaml
required_states:
  loading: "Skeletons quadrados ou loaders tipo 'imprimindo' (linhas monocromáticas)."
  empty: "Honesto, com visual de um espaço de papel em branco ou 'página arrancada'."
  unconfigured: "Visível apenas para admins, como um carimbo 'FALTA CONFIGURAR'."

responsive:
  mobile: "App Shell híbrido. Bottom bar contendo ações (Feed, Buscar, [+], Perfil). Ações vitais na área do polegar."
  desktop: "Sidebar ou grids divididos. Sem duplicação."
  modals: "Full-screen no mobile para edição, sheets laterais no desktop."
```
