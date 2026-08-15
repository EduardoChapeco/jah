# JAH DESIGN SYSTEM — Canonical Core, Dual-Universe & Organic Geometry Architecture

Documento alvo para a arquitetura visual da JAH.
Todo o design deve ser estritamente derivado das fontes canônicas. NADA pode ser hardcoded.

---

## 0. Arquitetura dos Dois Universos Visuais

A JAH unifica dois universos complementares sob a mesma fundação de tokens:

### 0.1 Universo Social / Descoberta / Mural / Mercado / Mapa de Moments (Mobile-First)

- **Foco:** Expressividade visual, retenção, descoberta de pessoas, lugares, produtos, gastronomia e eventos.
- **Padrões:**
  - Story Rail horizontal (capsules com `MediaSquircle` e preview de stories).
  - Thumbnail Preview Rail para consumo visual rápido entre stories e posts.
  - 8 Formatos canônicos de postagens: Simples, Carrossel com bordas nítidas, Grid de fotos 2-4+, Momento/Atividade com métricas e mini-mapa, Destino/Lugar com CTA de mapa, Comida/Experiência com foto principal + mini-grid, Banner/Hero Header e Card de Evento estilo ticket.
  - Mapa Social com Moments: Pins enriquecidos em `MediaSquircle` (fotos, avatares, badges de lojas e eventos), chips de filtro rápido e Bottom Sheet contextual.
  - Mercado Dinâmico: Hero Banner do admin no topo, grid de discovery em `JahSquircle`, carrossel 16:9 de curadorias e feed dinâmico em grid.

### 0.2 Universo Workspace / Gestão / PDV / Gestor de Pedidos (Desktop-First)

- **Foco:** Operação ultra-clean, máxima área útil, silêncio visual absoluto (estilo _iFood Portal_, _Avec_ e _Linear_).
- **Padrões:**
  - Sem sombras pesadas, sem caixas com texto explicativo estilo protótipo.
  - Edição em múltiplos níveis: Edição de Célula (inline na tabela), Edição Lateral (Side-panel Sheet para manter o contexto da lista) e Edição Completa In-Page (com Truthful Preview e matriz 2D).
  - Geometria operacional `SoftSquare` nos botões e tabelas, garantindo densidade e precisão.

---

## 1. Regra de Ouro (Proibição Total de Hardcode)

É estritamente proibido o uso de valores literais ou Tailwind crus:

- ❌ Proibido: `bg-red-500`, `text-blue-600`, `p-7`, `m-[13px]`, `rounded-[14px]`, `rounded-[37px]`, `shadow-[0_4px...]`.
- ✅ Obrigatório: Tokens semânticos `bg-primary`, `text-muted-foreground`, `border-border`, `p-4`, `p-6`, `gap-3`, classes canônicas `.squircle`, `.squircle-soft`, `.squircle-organic`, `.squircle-media`, `.squircle-action`.

---

## 2. Fundação Dimensional, Superfícies & Geometria

### 2.1 Spacing (Escala de Respiro)

- `space-1` (4px): Gaps microscópicos (ícone e texto).
- `space-2` (8px): Gaps compactos e chips.
- `space-3` (12px): Gaps padrão entre elementos internos de cards.
- `space-4` (16px): Padding interno padrão de cards mobile.
- `space-6` (24px): Padding de containers e modais desktop.
- `space-8` (32px): Separação de grandes blocos de layout.

### 2.2 Geometria Orgânica & Família Canônica Squircle (Pillow Tiles & Superellipses)

A JAH adota uma assinatura geométrica orgânica baseada em **Superelipses e Pillow Tiles**.
Em vez de cantos circulares recortados mecanicamente, as curvas iniciam gradualmente antes dos cantos, dando a sensação de que o centro da peça concentra mais massa, ficando visualmente **"gordinho" e acolhedor**.

| Token Canônico       | Geometria / Nome | Curvatura / CSS                                                   | Propósito Primário               | Superfícies Alvo                                                               |
| :------------------- | :--------------- | :---------------------------------------------------------------- | :------------------------------- | :----------------------------------------------------------------------------- |
| **`shape.soft`**     | `SoftSquare`     | `16px / 18px` (`.squircle-soft`)                                  | Operacional / Estruturado        | Inputs, tabelas, containers do Workspace, modais técnicos.                     |
| **`shape.squircle`** | `JahSquircle`    | `28px / 32px` (`.squircle`)                                       | Assinatura Central / Pillow Tile | Cards de Escolha (`ChoiceCard`), Categorias do Mercado, Banners de Descoberta. |
| **`shape.organic`**  | `OrganicTile`    | `32px 24px 28px 22px / 26px 32px 22px 28px` (`.squircle-organic`) | Assimetria Sutil Editorial       | Destaques Culturais, Cards de Descoberta Zine, Selos e Curadorias.             |
| **`shape.media`**    | `MediaSquircle`  | `24px / 26px` (`.squircle-media`)                                 | Recorte Impecável de Mídia       | Stories, Moments no Feed, Map Markers, Galeria de Fotos, Avatares Especiais.   |
| **`shape.action`**   | `PillowButton`   | `20px / 22px` (`.squircle-action`)                                | Interação Tátil Suave            | Botões Primários de Ação (`+ Publicar`, `+ Anunciar`), Categorias Clicáveis.   |

### 2.3 Regras de Transição & Feedback Tátil

- **Hover Desktop (`.squircle-hover`):** Elevação microscópica (`translateY(-2px) scale(1.01)`), realce suave de sombra com dispersão suave. Imagens ganham zoom de 2% no container.
- **Press / Touch Mobile:** Compressão mínima elástica (`scale(0.985)`), reforçando a sensação física de almofada (_pillow tile_).
- **Seleção (`.squircle-selected`):** Contorno nítido de 2px no token `primary`, fundo no token `card` com sutil glow, sem bordas brutais ou deformações.
- **Acessibilidade Inviolável:** O formato visual nunca reduz a área de toque (mínimo de 44x44px). O focus ring segue o outline exato com `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-offset-2`.

---

## 3. Padrões Canônicos de Shell Pessoal e Criação Especializada

### 3.1 PersonalShell & Navigation Rail

- **Gramática de Navegação:** Compartilha a mesma geometria, densidade, tipografia e componentes do shell social/Mural (`_store`).
- **Eliminação de Heros Inflados:** Removidos quaisquer headers pretos, avatares gigantes ou fileiras de tabs horizontais.
- **Estrutura:**
  - Rail lateral desktop (68px fixo) com navegação global (Mural, Mapa, Mercado, Eventos, Diretório) + Context Sidebar (240px) contextual (Perfil, Meus Anúncios, Compras, Mensagens, Carteira, Endereços, Pagamentos).
  - Main area `flex-1 min-w-0` para renderização in-page fluida.

### 3.2 CreateTypePicker (Escolha de Jornada em Cards Squircle)

- **Localização:** `/conta/classificados/novo` (antes de qualquer formulário).
- **Cards:** Assumem a geometria `JahSquircle` com proporção ergonômica, 100% clicáveis, com ícone de destaque, badge de capability, título, subtítulo e descrição concisa.
- **Opções:** Desapego, Imóvel, Veículo, Serviço, Vaga, Troca.

### 3.3 SpecializedEditor & Live Truthful Preview

- **Ativação:** Disparada após a seleção do tipo de anúncio (ex: `/conta/classificados/novo?tipo=imovel`).
- **Desktop (Split-Grid 5/7 ou 42%/58%):**
  - **Painel Esquerdo (Editor):** Scroll próprio interno, organizado em sections progressivas do domínio (Operação, Detalhes, Valores, Mídia, Contato).
  - **Painel Direito (Truthful Preview):** Sticky, renderizando a página pública real (`_store.classificados.$id.tsx`) em tempo real, sem dados fictícios.
- **Mobile:** Full-page step editor com switcher no topo `[Editar]` / `[Prévia]` e barra de ações sticky no rodapé.

---

## 4. Tipografia Canônica

Toda a tipografia é baseada em `Inter` (sans-serif):

- **Títulos de Painel:** `text-lg font-bold text-foreground` (contidos e operacionais).
- **Títulos de Descoberta Social:** `text-xl sm:text-2xl font-black text-foreground tracking-tight`.
- **Corpo:** `text-sm text-foreground` ou `text-sm text-muted-foreground`.
- **Overline / Badges:** `text-[10px] uppercase font-bold tracking-wider text-muted-foreground`.

---

## 5. Matriz de Auditoria e Classificação da Geometria

| Elemento / Componente                      | Classificação               | Geometria Alvo                      | Racional                                                                          |
| :----------------------------------------- | :-------------------------- | :---------------------------------- | :-------------------------------------------------------------------------------- |
| **Cards de Categoria (Novo Classificado)** | **MIGRAR**                  | `JahSquircle` (`.squircle`)         | Transforma seleção técnica em tiles físicos fáceis de tocar e visualmente ricos.  |
| **Stories & Moments Rail**                 | **MIGRAR**                  | `MediaSquircle` (`.squircle-media`) | Substitui círculos e retângulos duros por cápsulas suaves de alto valor estético. |
| **Map Markers (Fotos/Locais no Mapa)**     | **MIGRAR**                  | `MediaSquircle` (`.squircle-media`) | Cria assinatura proprietária da JAH no mapa interativo.                           |
| **Pílulas & Filtros de Nicho (Mercado)**   | **MIGRAR**                  | `PillowButton` (`.squircle-action`) | Melhora a ergonomia de toque e a resposta háptica visual.                         |
| **Banners de Descoberta no Feed**          | **MIGRAR**                  | `OrganicTile` (`.squircle-organic`) | Confere personalidade editorial aos blocos de curadoria sem quebrar a harmonia.   |
| **Post Cards do Feed Textual**             | **MANTER GEOMETRIA NEUTRA** | `SoftSquare` (`rounded-2xl`)        | Mantém a legibilidade, o foco no conteúdo e o silêncio visual do feed.            |
| **Tabelas e Formulários do Workspace**     | **MANTER GEOMETRIA NEUTRA** | `SoftSquare` (`rounded-xl`)         | Garante precisão geométrica e máxima densidade de dados operacionais.             |
| **Inputs, Dropdowns e Modais Técnicos**    | **MANTER GEOMETRIA NEUTRA** | `SoftSquare` (`rounded-xl`)         | Não interfere nos padrões nativos de foco do navegador e acessibilidade.          |
| **Linhas de Separação e Divisores**        | **NÃO APLICÁVEL**           | N/A                                 | Elementos puramente dimensionais.                                                 |
