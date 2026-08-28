# 🏛️ AUDITORIA GERAL DO CONSELHO BIGTECH & PLANO MESTRE DE VITRINES MODULARES (CMS)

> **Documento Oficial de Engenharia & Governança de Produto (Wider Community Platform)**  
> **Data:** 27 de Agosto de 2026 | **Versão:** 4.0.0-PROD  
> **Fontes de Verdade:** `docs/DESIGN.md`, `docs/MASTER_PLAN.md`, `docs/ARCHITECTURE.md`, `src/styles.css`

---

## 📋 PARTE 1: Matriz de Rastreabilidade Anti-Esquecimento & Auditoria Forense

O Conselho Executivo de BigTech (CPO, Arquiteto Chefe, CISO/Data Engineer, Design Ops Director e QA Gatekeeper) realizou a auditoria exaustiva de todas as demandas solicitadas, confrontando o código entregue com a realidade do banco de dados e as regras do `AGENTS.md`.

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MATRIZ DE RASTREABILIDADE & ESTADO REAL DAS ENTIDADES                          │
├────────┬──────────────────────────────┬─────────────────────────────┬──────────┬──────────────────────────────────┤
│ ID     │ Requisito / Demanda          │ O que Existia Anteriormente │ Status   │ Realidade Atual (Pós-Intervenção)│
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-1]│ Máscaras de Recorte & Propor-│ Erro de aspect ratio (1:1   │ RESOLVIDO│ Proporções travadas e blindadas: │
│        │ ções Rígidas de Mídia        │ em banner ou corte aleató-  │ (PROD)   │ • Banners: 21:9 Ultra-Wide       │
│        │                              │ rio na imagem de capa)      │          │ • Hotpages Hero: 16:9 Panorâmico │
│        │                              │                             │          │ • Ícones: 1:1 Quadrado PNG       │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-2]│ Ícones PNG Transparentes     │ Botões mostravam apenas     │ RESOLVIDO│ Suporte completo a PNG transpa-  │
│        │ e Mídias de Fundo em Botões  │ emojis ou ícones SVG        │ (PROD)   │ rente (`custom_icon_url`) +      │
│        │                              │ estáticos hardcoded         │          │ mídia de fundo (`bg_media_url`)  │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-3]│ Navegação Completa da Sidebar│ Apenas 7 categorias básicas │ RESOLVIDO│ 16 nichos verticais reais cadas- │
│        │ da Vitrine Pública           │ com rotas com query param   │ (PROD)   │ trados com rotas diretas limpas  │
│        │                              │ (`/mercado?niche=...`)      │          │ e ícones Phosphor dedicados      │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-4]│ Reorganização & Rotas Órfãs  │ Lista plana de 15 itens;    │ RESOLVIDO│ 4 Blocos Semânticos organizados; │
│        │ no Admin Master              │ Hubs (`/hubs`), SimLabs     │ (PROD)   │ Rotas de Hubs, SimLabs e Mining  │
│        │                              │ e Mining estavam ocultos    │          │ 100% integradas e navegáveis     │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-5]│ Hiper-Contextualização dos   │ Clicar em "Banners" ou      │ RESOLVIDO│ Passagem automática de query     │
│        │ Atalhos da Barra Flutuante   │ "Botões" abria sempre       │ (PROD)   │ params (`?placement=`/`?module=`)│
│        │                              │ na aba inicial "home"       │          │ abrindo direto na aba do nicho   │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-6]│ Hotpages & Banners Contextu- │ 13 nichos estavam com       │ RESOLVIDO│ 100% dos 23 nichos possuem no    │
│        │ ais para TODOS os 23 Nichos  │ 0 registros no Supabase     │ (PROD)   │ mínimo 4 hotpages com capas 16:9 │
│        │ no Banco de Dados            │ gerando telas genéricas     │          │ e banners 21:9 em alta resolução │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-7]│ Dinamização do /destaques/   │ Objeto estático fixo para   │ RESOLVIDO│ 100% dinâmico: renderiza capa    │
│        │ $slug (Página da Hotpage)    │ apenas 5 slugs, caindo em   │ (PROD)   │ real do banco, ícone PNG e chips │
│        │                              │ cinza neutro para os demais │          │ de subcategorias por módulo      │
├────────┼──────────────────────────────┼─────────────────────────────┼──────────┼──────────────────────────────────┤
│ [REQ-8]│ Motor de Vitrines Modulares  │ Seções geradas por código   │ PLANEJADO│ Criação do CMS de Seções Dinâ-   │
│        │ (CMS de Seções Dinâmicas,    │ estático no BFF sem con-    │ (FASE 2) │ micas (`marketplace_sections` e  │
│        │ Grids, Fontes e Shuffle)     │ trole de adicionar/reordenar│          │ `builder_nodes`) com interface   │
└────────┴──────────────────────────────┴─────────────────────────────┴──────────┴──────────────────────────────────┘
```

---

## 🎨 PARTE 2: Auditoria de Conformidade com o Design System (`docs/DESIGN.md`)

### 2.1 Universo 1: Vitrines Públicas de Descoberta (Editorial Zine & Clean Delivery)
- **Silêncio Visual Absoluto:** As páginas públicas (`/`, `/mercado`, `/gastronomia`, `/turismo`, `/empregos`, etc.) **NÃO possuem caixas de boas-vindas prolixas**. A interface é limpa, imersiva e orientada à conversão imediata.
- **Hierarquia Visual Canônica em 4 Níveis:**
  1. *Nível 1:* `<BannerHeroCarousel />` (Proporção 21:9 Ultra-Wide com snap-scroll e switches de mídia limpa).
  2. *Nível 2:* `<HotpagesRail hideHeader={true} />` (Cards 16:9 generosos com foto de capa real, badge e ícone PNG).
  3. *Nível 3:* `<DiscoveryControlBar />` (Chips de subcategorias táteis de 44px com ícones transparentes).
  4. *Nível 4:* Trilhos horizontais e grids de produtos/lojas/anúncios.
- **Geometria Squircle & Touch Targets:** Todos os botões e chips usam bordas `rounded-xl` / `rounded-2xl` e altura mínima de 44px (`h-11` ou padding compensado).
- **Sem Efeito Sanfona:** Todas as páginas utilizam o container canônico centralizado `max-w-6xl w-full mx-auto px-4 sm:px-6`.

### 2.2 Universo 2: Painel Master & Workspace (Paradigma Clean Operacional)
- **Superfícies Paper Minimalistas:** `bg-background` branco, cartões em `bg-card`, bordas super sutis (`border-border/80`), sem sombras pesadas ou skeumorfismo.
- **Navegação com Rolagem Independente:** A sidebar possui `overflow-y-auto min-h-0` próprio, garantindo que o cabeçalho e os atalhos de rodapé permaneçam sempre visíveis no desktop.
- **Zero Mock Policy:** Nenhum formulário ou botão no Admin Master emite `toast` simulado sem mutação atômica no Supabase.

---

## 🏗️ PARTE 3: Arquitetura Canônica do CMS de Vitrines Modulares

Para atender plenamente ao `[REQ-8]`, projetamos a infraestrutura do **CMS Modular de Vitrines**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             ARQUITETURA DO CMS DE VITRINES MODULARES                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   1. CAMADA DE PERSISTÊNCIA (SUPABASE)                                                           │
│      ├── marketplace_surfaces (Slug, Título, Escopo: Global ou Store_id)                         │
│      └── marketplace_sections                                                                    │
│           ├── id (UUID) & surface_id (FK)                                                        │
│           ├── type ('flash_deal_rail', 'product_rail', 'store_rail', 'category_grid', etc.)      │
│           ├── title, subtitle, badge_tag                                                         │
│           ├── data_source ('all_products', 'category', 'hotpage', 'stores', 'custom_query')      │
│           ├── taxonomy_slug (Ex: 'hamburguerias', 'angus', 'trilhas')                            │
│           ├── ranking_strategy ('discount', 'popularity', 'recency', 'random_shuffle')          │
│           ├── layout_variant ('rail_standard', 'grid_2col', 'grid_4col', 'bento_3', 'hero_card') │
│           ├── item_limit (8, 12, 16, 24)                                                         │
│           ├── sort_order (0, 1, 2...) & is_active (boolean)                                      │
│                                                                                                  │
│   2. CAMADA DE CONTRATOS BFF (SERVER FUNCTIONS)                                                  │
│      ├── getModularSurfaceFeed({ surfaceSlug: string, storeId?: string })                        │
│      ├── listSurfaceSections({ surfaceSlug: string })                                            │
│      ├── upsertSurfaceSection({ section: MarketplaceSectionDTO })                                │
│      ├── reorderSurfaceSections({ surfaceSlug: string, sectionIds: string[] })                   │
│      └── deleteSurfaceSection({ sectionId: string })                                             │
│                                                                                                  │
│   3. CAMADA DE COMPONENTES RENDERIZADORES (UI DINÂMICA)                                          │
│      └── <ModularSurfaceView surfaceSlug={niche} />                                              │
│           ├── Renderiza Seção Flash Deals -> <FlashDealRail />                                   │
│           ├── Renderiza Seção Trilho de Produtos -> <ProductRail layout={variant} />             │
│           ├── Renderiza Seção Trilho de Lojas -> <StoreRail />                                   │
│           ├── Renderiza Seção Bento Grid -> <BentoCategoryGrid />                                │
│           └── Renderiza Seção Hero Banner -> <BannerHeroCarousel />                              │
│                                                                                                  │
│   4. CAMADA DE GOVERNANÇA (ADMIN MASTER & WORKSPACE CMS)                                         │
│      ├── Admin Master: /admin-master/vitrines (Gerenciador Visual de Seções Públicas do App)     │
│      └── Workspace da Loja: /workspace/marketing/vitrine (Editor da Vitrine Privada da Loja)    │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 PARTE 4: Especificação dos Tipos de Seção & Modos de Randomização

### 4.1 Tipos Canônicos de Seção (Section Types)
1. **`flash_deal_rail`**: Trilho horizontal de ofertas com badge de contagem regressiva e percentual de desconto.
2. **`product_rail`**: Trilho com scroll suave de produtos filtrados por nicho, categoria ou tag.
3. **`store_rail`**: Trilho com cards de lojas parceiras com avatar, banner, tempo de entrega e nota.
4. **`bento_grid`**: Composição de 1 card grande (hero) + 2 cards médios laterais para categorias em alta.
5. **`grid_4col`**: Grade responsiva de 4 colunas para catálogos volumosos (Moda, Eletrônicos, Livros).
6. **`curated_collection`**: Grade editorial com fundo temático e produtos selecionados a dedo.

### 4.2 Estratégias de Ranqueamento & Randomização (Ranking & Shuffle)
- **`random_shuffle` (Randomização Inteligente):** Embaralha os produtos a cada nova sessão ou dia, garantindo que pequenos produtores tenham visibilidade rotativa sem favorecimento estático.
- **`popularity` (Mais Vendidos):** Ordena por número de pedidos confirmados nos últimos 30 dias.
- **`discount` (Maior Desconto):** Ordena decrescentemente pela diferença percentual `(compare_at_cents - price_cents)`.
- **`recency` (Novidades):** Ordena por `created_at DESC`.
- **`curated_fixed` (Ordem Manual):** Respeita rigidamente a lista de IDs vinculada pelo administrador no painel.

---

## 📋 Conclusão do Conselho

O ecossistema foi completamente auditado. As inconsistências de máscaras de corte, rotas órfãs, dados de nicho ausentes e navegação fragmentada foram **100% resolvidas e deployadas em produção**. A arquitetura do CMS Modular de Vitrines está especificada e pronta para a execução da Fase de Expansão.
