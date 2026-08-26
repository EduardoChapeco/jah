# JAH DESIGN SYSTEM — Canonical Core, Dual-Universe, Organic Geometry & News Telemetry

> **Documento Canônico VINCULANTE (Single Source of Truth).**
> Toda a interface visual, superfícies, componentes e interações da JAH devem ser estritamente derivados deste documento e de `src/styles.css`.
> **Proibição Total de Hardcode**: Não use valores Tailwind literais (ex: `bg-red-500`, `text-white` solto). Use sempre os tokens semânticos (`var(--color-*)`, `var(--radius-*)`).

---

## 0. Arquitetura dos Dois Universos Visuais

A JAH unifica dois universos complementares sob a mesma fundação de tokens semânticos:

### 0.1 Universo Social / Descoberta / Notícias / Mural / Mercado / Mapa (Mobile & Desktop)
- **Foco:** Expressividade visual, retenção, credibilidade editorial e dinamismo comunitário.
- **Padrões Canônicos:**
  - **Manchetes & Artigos de Notícias (`news_articles`):** Tipografia mista com contraste editorial (`Fraunces` para títulos de grande impacto + `Inter` para leitura longa fluida).
  - **Formato Duplo de Leitura:**
    - *No Feed/Mural*: Card compacto com resumo de 3 linhas expansível estilo WhatsApp ("Ver mais") + botão de ação para abrir a matéria inteira.
    - *Página Dedicada (`/noticias/$slug`)*: Leitura imersiva com barra de progresso de scroll, tempo estimado de leitura, blocos de patrocinadores inseridos harmonicamente e comentários de membros reais.
  - **Módulo de Patrocinadores Reais (`sponsors`):** Banners e cards com IntersectionObserver para medição precisa de visualização única, tempo de tela ativo e taxa de cliques (CTR).
  - **Top Banners Hero:** Aspect ratio fixo 16:9 / 21:9 com suporte para Imagens, Vídeos e GIFs com switches de Mídia Limpa (capacidade de ocultar título, badges ou sombras).
  - **Master Location Pill:** Ativação instantânea de GPS por long-press ou abertura de modal com aba de **Pin no Mapa em Tela Cheia** com geocodificação reversa.
  - **Navegação Sem Duplicações:** A barra superior (`TopBar`) abriga o logotipo, Location Pill, busca inteligente e o cluster de utilidades (sacola e perfil), sem duplicar botões da barra lateral.

### 0.2 Universo Workspace / Gestão / PDV / Redação de Notícias (Desktop-First)
- **Foco:** Operação ultra-clean, máxima área útil, silêncio visual absoluto (estilo _Linear_, _iFood Portal_ e _Stripe Dashboard_).
- **Padrões Canônicos:**
  - Zero sombras pesadas, zero placeholders ou dados fictícios.
  - Superfícies `surface-paper` (`bg-background` e `bg-card`) com bordas sutis (`border-border/80`).
  - Edição em múltiplos níveis: Edição de Célula (inline na tabela), Edição Lateral (Side-panel Sheet) e Edição Completa In-Page com *Truthful Preview* lateral.
  - Redator de Matérias por Blocos: Composição de parágrafos, subtítulos, citações e galerias em tempo real.
  - Painel de Telemetria de Audiência: Gráficos de alcance único, impressões e engajamento dos patrocinadores.

---

## 1. Escala de Tokens Semânticos & Cores

### 1.1 Light Mode (Base Minimalista)
- `--background`: `oklch(0.99 0 0)` (Branco suave)
- `--foreground`: `oklch(0.12 0 0)` (Preto suave, legibilidade ótima)
- `--card`: `oklch(1 0 0)` (Branco puro)
- `--primary`: `oklch(0.12 0 0)` (Preto Apple-like)
- `--primary-foreground`: `oklch(0.99 0 0)` (Branco)
- `--secondary`: `oklch(0.96 0 0)` (Cinza claríssimo)
- `--secondary-foreground`: `oklch(0.15 0 0)`
- `--muted`: `oklch(0.96 0 0)`
- `--muted-foreground`: `oklch(0.45 0 0)`
- `--border`: `oklch(0.93 0 0)`

### 1.2 Dark Mode (Alto Contraste AAA — Sem Texto Invisível)
- `--background`: `oklch(0.14 0 0)` (Preto fosco)
- `--foreground`: `oklch(0.98 0 0)` (Branco puro)
- `--card`: `oklch(0.18 0 0)` (Tom de superfície elevado)
- `--primary`: `oklch(0.98 0 0)` (Branco puro para ação primária)
- `--primary-foreground`: `oklch(0.10 0 0)` (Preto forte para contraste total com o botão)
- `--secondary`: `oklch(0.24 0 0)` (Cinza grafite com borda sutil)
- `--secondary-foreground`: `oklch(0.96 0 0)`
- `--muted`: `oklch(0.22 0 0)`
- `--muted-foreground`: `oklch(0.72 0 0)`
- `--border`: `oklch(0.26 0 0)`

---

## 2. Família de Botões & Ações (Pill-Squircle System)

| Variante | Classe / Tailwind | Propósito & Sensação Visual |
| :--- | :--- | :--- |
| **`default`** | `bg-primary text-primary-foreground` | Ação principal da página / modal com alto contraste e leve sombra. |
| **`heroAction`** | `bg-linear-to-r from-primary ... hover:scale-[1.02]` | CTAs de conversão de alto impacto (ex: "Criar Minha Loja", "Publicar"). |
| **`pillow`** | `rounded-full bg-primary text-primary-foreground` | Botão pill orgânico com micro-elevação ao toque. |
| **`pillowOutline`**| `rounded-full border border-border bg-card` | Filtros, chips de categoria e seletores táteis. |
| **`secondary`** | `bg-secondary text-secondary-foreground` | Ações secundárias e de apoio no fluxo. |
| **`outline`** | `border border-border/90 bg-background text-foreground` | Botões neutros, cancelamento e alternadores. |
| **`ghost`** | `hover:bg-muted text-muted-foreground hover:text-foreground` | Ações compactas e ícones em barras de ferramentas. |

---

## 3. Geometria Orgânica & Padrão de Botões Squircle ("Quadrado Inflado")

- **Botões Squircle / Gordinhos (`rounded-2xl` ~16px-20px com h-10/h-11):** Todos os botões interativos de ação, triggers de busca/sacola/perfil e botões de adicionar ao carrinho usam geometria squircle tátil ("quadrado inflado", estilo Apple / VisionOS / Linear), NUNCA pílulas compridas finas ou cápsulas verticais estranhas.
- **`shape.soft` (`.squircle-soft` / `rounded-xl` ~12px-14px):** Chips internos, tags, selects, pequenos badges e inputs.
- **`shape.media` (`.squircle-media` / `rounded-2xl` ~18px-22px):** Fotos de produtos, mídias de post, avatares e miniaturas de stories.
- **`shape.card` (`.squircle-card` / `rounded-3xl` ~24px-32px):** Containers de posts do Mural, caixas de banners herói, cards de lojas e trilhos de produtos.

---

## 4. Largura Canônica Única & Fim do Efeito Sanfona

Para eliminar qualquer variação abrupta de largura ao navegar entre abas ("efeito sanfona"):
- **Container Canônico Único:** `max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8`.
- Todas as rotas de descoberta (`Home`, `Mercado`, `Mural`, `Notícias`, `Agenda`, `Diretório`, `Mapa`) utilizam rigorosamente essa mesma largura máxima e mesmo ritmo de padding.

---

## 5. Anatomia Canônica Quádrupla de Páginas de Descoberta

Toda página pública de exploração segue o mesmo ritmo visual hierárquico:
1. **Camada 1 — Top Banner Hero:** Banner dinâmico carrossel com fotos reais do Supabase (16:9 / 21:9) e fallback curado.
2. **Camada 2 — HotpagesRail Contextual:** Trilho de cartões visuais de categorias/nichos da região.
3. **Camada 3 — Chips de Subcategorias & Filtros:** Barra horizontal de filtros rápidos com scroll suave (`DiscoveryControlBar`).
4. **Camada 4 — Trilhos & Grades de Cards Grandes:** Sliders horizontais e grades com proporção generosa para produtos, ofertas relâmpago, lojas e publicações.

### 5.1 Regra Absoluta de Silêncio Visual na Vitrine Pública (Sem Títulos/Descrições Prolixas)
- **Zero Textos Introdutórios Redundantes:** As páginas públicas NUNCA exibem caixas de texto com boas-vindas prolixas ("Bem-vindo ao Mercado...", "Aqui você encontra..."). O usuário quer ver produtos, lojas, ofertas e ações imediatas.
- **`HorizontalRail` com `hideHeader={true}`:** Em vitrines públicas, os carrosséis fluem naturalmente através de snap-scroll sem cabeçalhos textuais redundantes competindo com a riqueza visual dos cards.
- **Botões com Geometria Squircle (`rounded-xl` / `rounded-2xl`):** Proibição de botões tipo cápsula fina ou `rounded-full` em botões de ação e checkout. Usar sempre squircle tátil com tipografia em peso `font-bold`.

---

## 6. Telemetria de Audiência & Padrões Antifraude

1. **Visualizações Únicas:** Calculadas combinando `user_id` autenticado com `session_hash` (IP + User-Agent mascarados via hash SHA-256 no backend).
2. **Tempo de Visualização Ativo:** Monitorado via evento de heartbeat a cada 5 segundos enquanto o elemento estiver visível no viewport (IntersectionObserver com ratio > 0.5 e document em foco).
3. **Curtidas Únicas:** Inserção atômica com chave primária composta `(item_id, user_id)` impedindo contagens duplicadas.

---

## 7. Responsividade Adaptativa Mobile & Ergonomia Tátil Proporcional (Apple HIG, Material 3, iFood, Threads, Avec, Belasis)

### 7.1 A Regra de Adaptação ao Frame de Visualização (Viewport Elasticity)
A interface móvel deve se adaptar organicamente ao frame de qualquer aparelho móvel (de iPhones compactos de 320px/375px a modelos Max/Plus de 430px e dobráveis):
- **Tipografia Fluida com `clamp()`**: Títulos e textos de corpo utilizam funções `clamp(min, val, max)` para escalar continuamente sem saltos bruscos de breakpoint.
- **Touch Targets Invioláveis de 44x44px**: Todo botão, ícone de ação, trigger de filtro, switch ou chip possui área de toque mínima de **44x44px** (altura `h-11` ou padding compensado com `.touch-target`), mesmo quando o elemento visual for visualmente menor.
- **Safe Areas & Dynamic Viewport (`dvh`)**:
  - Uso obrigatório de `safe-bottom` (`env(safe-area-inset-bottom)`) em barras fixas inferiores, drawers (`Vaul`) e botões de checkout para não colidir com o Home Indicator do iOS.
  - Uso de `safe-top` (`env(safe-area-inset-top)`) em cabeçalhos fixos para acomodar Dynamic Island e Notch sem sobreposição.
  - Alturas de tela cheia usam sempre `100dvh` (Dynamic Viewport Height) em vez de `100vh`, evitando o salto de layout ao abrir a barra de endereços do Safari/Chrome.

### 7.2 Compressão Progressiva & Colapso de Rótulos
Em telas ultra-compactas ou com alta densidade de informação:
- **Prioridade Visual de Texto**: Textos secundários e descrições são truncados ou omitidos antes de qualquer redução de legibilidade.
- **Colapso Inteligente de Botões (`.mobile-collapse-label`)**: Em viewports estreitos (< 380px), botões que continham texto + ícone mantêm apenas o ícone centralizado com `touch-target` de 44px intacto e `aria-label` para acessibilidade.
- **Container Queries em Cards**: Cards de produtos de gôndola (`GroceryProductCard`), cards de lojas (`StoreCard`) e feeds (`ThreadsFeedCard`) usam `@container` para rearranjar a imagem e informações conforme a largura real do slot, evitando quebras de linha artificiais.

### 7.3 Arquitetura da Zona do Polegar (Thumb-Zone Navigation)
Inspirada nos aplicativos de alta retenção (*iFood, Instagram, Threads, WhatsApp*):
- **Ações Primárias no Terço Inferior**: Botões de "Adicionar à Sacola", "Confirmar Pedido", "Finalizar Atendimento" e abas de navegação principal residem fixos no terço inferior da tela, ao alcance natural do polegar.
- **Snap-Scroll Horizontal**: Trilhos de banners e categorias usam `scroll-snap-type: x mandatory` com desaceleração nativa de toque (`-webkit-overflow-scrolling: touch`) e sem barras de rolagem visíveis.

