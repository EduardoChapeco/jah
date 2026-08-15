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

## 3. Geometria Orgânica (Superelipses & Pillow Tiles)

- **`shape.soft` (`.squircle-soft` / `rounded-xl` ~16px):** Inputs, selects, células de tabela e cards do Workspace.
- **`shape.squircle` (`.squircle` / `rounded-3xl` ~28px-32px):** Cards de categorias, banners e caixas de descoberta.
- **`shape.media` (`.squircle-media` / `rounded-2xl` ~20px-24px):** Imagens de capa de notícias, stories, avatares e produtos.
- **`shape.action` (`rounded-2xl` / `rounded-full`):** Botões e controles de navegação.

---

## 4. Telemetria de Audiência & Padrões Antifraude

1. **Visualizações Únicas:** Calculadas combinando `user_id` autenticado com `session_hash` (IP + User-Agent mascarados via hash SHA-256 no backend).
2. **Tempo de Visualização Ativo:** Monitorado via evento de heartbeat a cada 5 segundos enquanto o elemento estiver visível no viewport (IntersectionObserver com ratio > 0.5 e document em foco).
3. **Curtidas Únicas:** Inserção atômica com chave primária composta `(item_id, user_id)` impedindo contagens duplicadas.
