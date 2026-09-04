# 📐 DOSSIÊ ARQUITETURAL MASTER: O CONSTRUTOR VISUAL WIX STUDIO STANDARD (JAH PLATFORM)

> **Documento Canônico de Referência de Engenharia e Design Ops**  
> **Fontes de Inspiração & Benchmarks:** Wix Studio, Editor X, Shopify 2.0 (Liquid Sections), Webflow, Framer.  
> **Público:** Engenheiros Fullstack, Arquitetos de Software, Designers e Agentes Autônomos.

---

## 📑 ÍNDICE GERAL

1. [Fundamentos & Arquitetura da Engine Wix Studio Standard](#1-fundamentos--arquitetura-da-engine-wix-studio-standard)
2. [A Matriz de Customização Quádrupla Inviolável](#2-a-matriz-de-customização-quádrupla-inviolável)
3. [Catálogo Master de Seções por Super-Nichos (70+ Seções)](#3-catálogo-master-de-seções-por-super-nichos)
   - 3.1. [Varejo & E-commerce Multicanal](#31-varejo--e-commerce-multicanal)
   - 3.2. [Gastronomia, Restaurantes & Bares](#32-gastronomia-restaurantes--bares)
   - 3.3. [Turismo, Agências & Viagens Boutique](#33-turismo-agências--viagens-boutique)
   - 3.4. [Moda, Vestuário & Editorial Lookbook](#34-moda-vestuário--editorial-lookbook)
   - 3.5. [Serviços Profissionais, B2B & Consultorias](#35-serviços-profissionais-b2b--consultorias)
   - 3.6. [Imobiliário, Hotéis & Locação de Temporada](#36-imobiliário-hotéis--locação-de-temporada)
   - 3.7. [Infoprodutos, Comunidades & Lançamentos](#37-infoprodutos-comunidades--lançamentos)
   - 3.8. [Criadores, Biolinks & Hotpages de Alta Conversão](#38-criadores-biolinks--hotpages-de-alta-conversão)
4. [Motor de Animações de Scroll & Interatividade Física](#4-motor-de-animações-de-scroll--interatividade-física)
5. [Multi-Páginas, Subpáginas & Navegação Integrada](#5-multi-páginas-subpáginas--navegação-integrada)
6. [Infraestrutura de SEO Canônico & GEO (Generative Engine Optimization)](#6-infraestrutura-de-seo-canônico--geo-generative-engine-optimization)
7. [Plano de Ação para Alinhamento Imediato do Código](#7-plano-de-ação-para-alinhamento-imediato-do-código)

---

## 1. FUNDAMENTOS & ARQUITETURA DA ENGINE WIX STUDIO STANDARD

No paradigma tradicional de construtores de páginas simples, os blocos são estáticos ou possuem poucas opções pré-fixadas ("título" e "subtítulo"), forçando o lojista a conviver com designs genéricos ou blocos quebrados.

No **Wix Studio / Editor X**, uma página não é um amontoado de HTML solto, mas sim uma **Árvore Hierárquica de Nós Semânticos (AST - Abstract Syntax Tree)**:

```text
Documento de Experiência (experience_documents)
  └── Versão Ativa / Rascunho (experience_versions)
        └── Nós de Experiência (experience_nodes)
              ├── [Section] (Full Width 100vw, Surface, Padding Vertical)
              │     └── [Container] (Max-Width: 4xl / 6xl / 7xl / Full, Display: Flex / Grid)
              │           └── [Composition / Element] (Hero, Grid, Menu, Carrossel, etc.)
              │                 ├── content: JSONB (Textos, botões, cupons, mídias)
              │                 ├── layout_rules: JSONB (Display, gaps, variantes, docking)
              │                 ├── design_tokens: JSONB (Cores, fontes, bordas, sombras)
              │                 └── data_bindings: JSONB (Conexão CMS / Banco de dados vivo)
```

### Invariantes Estruturais:
1. **Zero Bloqueio Visual:** Todo texto ou imagem visível no canvas DEVE possuir uma entrada de controle editável correspondente no painel Inspetor.
2. **Separação Rígida de Camadas:**
   - O que o bloco **Diz** fica em `content`.
   - Como o bloco se **Organiza** no espaço fica em `layout_rules`.
   - A sua **Estética & Superfície** fica em `design_tokens`.
   - De onde vêm seus **Dados Vivos** fica em `data_bindings`.
3. **Persistência Relacional com Histórico:** Cada mutação gera um novo snapshot seguro na tabela `experience_nodes`, protegida por `store_id` e RLS Deny-by-Default.

---

## 2. A MATRIZ DE CUSTOMIZAÇÃO QUÁDRUPLA INVIOLÁVEL

Para erradicar o sintoma em que *"o configurador não bate com os blocos"*, todo e qualquer bloco cadastrado na plataforma Wider JAH deve obrigatoriamente responder às 4 abas do Inspetor:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              INSPETOR STUDIO                                 │
├─────────────────┬─────────────────┬───────────────────┬──────────────────────┤
│ 1. CONTEÚDO     │ 2. LAYOUT       │ 3. ESTILO         │ 4. DADOS (CMS)       │
│                 │                 │                   │                      │
│ • Títulos       │ • Variação de   │ • Cor de Fundo    │ • Nenhuma (Manual)   │
│ • Subtítulos    │   Grid (Masonry,│ • Cor do Texto    │ • Produtos (Hits,    │
│ • Textos de CTA │   Strip, 50/50) │ • Cor de Destaque │   Lançamentos, etc.) │
│ • Links / Ações │ • Largura Máx   │ • Tipografia      │ • Cupons Ativos da   │
│   (Hotpages,    │   (sm até full) │   (Heading / Body)│   Loja (Select/Sync) │
│   Checkout,     │ • Espaçamento Y │ • Raio de Borda   │ • Campanhas / Hotpage│
│   WhatsApp, URL)│ • Docking       │   (0px até pill)  │ • Destinos / Pacotes │
│ • Cupons & Tags │   (Alinhamento) │ • Sombra & Papel  │ • Avaliações Reais   │
│ • Mídias        │ • Gaps & Fluxo  │ • Animação Scroll │ • Perfil da Loja     │
└─────────────────┴─────────────────┴───────────────────┴──────────────────────┘
```

---

## 3. CATÁLOGO MASTER DE SEÇÕES POR SUPER-NICHOS

Abaixo está o mapeamento detalhado das dezenas de seções canônicas projetadas para o ecossistema JAH, seus casos de uso e variáveis de customização:

### 3.1. Varejo & E-commerce Multicanal

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `hero_carousel` | Destaque de grandes campanhas rotativas com CTA de compra imediata. | Título, subtítulo, botão, link, imagens desktop/mobile, autoPlay, tempo. | Fullwidth, split lateral, overlay centralizado. | `marketing_banners` |
| `flash_sale_hero` | Campanhas relâmpago de escassez máxima com contador e cupom 1-toque. | Título da promoção, badge, porcentagem OFF, código do cupom, link hotpage, data limite. | Banner escuro com timer lateral, faixa horizontal minimalista, cartão flutuante. | `active_coupon`, `hotpage_campaign` |
| `curated_hits_rail` | Trilho de top produtos mais vendidos com economiômetro e medalhas #1, #2. | Título da seção, subtítulo, texto de economia, botão de compra rápida. | Trilho horizontal com snap scroll, grid 4x2, lista compacta. | `dynamic_products` |
| `product_grid` | Catálogo geral com filtros visuais por categoria, preço e ordenação. | Título da vitrine, colunas por linha (2, 3, 4), badge de estoque, paginação. | Grid regular, masonry assinado, lista detalhada com variantes. | `product_collection`, `latest_products` |
| `bento_grid` | Vitrine assimétrica moderna destacando lançamentos em caixas proporcionais. | 4 a 6 cartões: título, foto de capa, tag promocional, link da categoria. | Layout 2x2 desigual, padrão 1 grande + 4 pequenos, 3 colunas altas. | `product_collection` |
| `trust_badges` | Barra de garantias, segurança e credibilidade (Pix, Cartão, Frete Grátis, Devolução). | Ícones, títulos e textos de 3 a 4 benefícios comerciais. | Barra horizontal fina, cartões individuais com borda, badges flutuantes. | Estático ou `store_profile` |
| `countdown_timer` | Contador regressivo independente para ancorar em qualquer parte da página. | Título de urgência, data de encerramento, mensagem pós-expiração. | Faixa colorida cheia, caixa arredondada flutuante, display de dígitos grandes. | Estático / Campanha |

---

### 3.2. Gastronomia, Restaurantes & Bares

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `food_menu_streamlined` | Cardápio ultra-rápido otimizado para celulares com foto à direita e pedido em 1 toque. | Nome do restaurante, horário de entrega, categorias de pratos, itens com preços. | Lista corrida com fotos redondas, lista de alta densidade sem fotos, cards 2 colunas. | `food_menu` |
| `food_menu_tabs` | Cardápio completo organizado por abas (Entradas, Principais, Pizzas, Sobremesas, Drinks). | Nomes das abas, itens detalhados com descrição de ingredientes e alérgenos. | Abas superiores com snap scroll, menu acordeão colapsável, colunas duplas estilo bistrô. | `food_menu` |
| `chef_special_banner` | Destaque do prato ou drink estrela da semana com tempo de preparo e harmonização. | Nome do prato, ingredientes nobres, foto em alta resolução, preço, botão de pedido. | Split 50/50 com foto sangrada, cartão central com moldura dourada, banner cinematográfico. | `featured_dish` |
| `table_order_comanda` | Cartão de mesa interativo com QR Code para autoatendimento no salão físico. | Número da mesa, nome da rede Wi-Fi, senha do Wi-Fi, botão para chamar garçom. | Card vertical para totem de acrílico, sticker horizontal, cartão escuro. | `store_hours`, `table_id` |
| `restaurant_hours_delivery` | Grade clara de funcionamento da cozinha, raio de entrega e taxa motoboy. | Dias da semana, horários de almoço/jantar, taxa fixa/km, tempo médio de espera. | Tabela compacta com status "Aberto/Fechado" dinâmico, lista com ícones, modal rápido. | `store_hours` |
| `table_booking_card` | Formulário para agendamento de reservas de mesa com confirmação no WhatsApp. | Título de boas-vindas, limite de lugares por mesa, horários de turnos, mensagem de confirmação. | Formulário integrado em card, drawer deslizante, pop-up de agendamento. | `whatsapp_leads` |

---

### 3.3. Turismo, Agências & Viagens Boutique

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `tourism_quote_hero` | Hero cinematográfico com buscador de cotações (Destino, Data, Passageiros) e envio direto ao CRM. | Título inspiracional, foto panorâmica, badges de assessoria VIP, destinos rápidos. | Formulário horizontal de busca flutuante, formulário em cartão lateral, split hero. | `whatsapp_leads`, `destinations_catalog` |
| `tourism_destinations_carousel` | Carrossel dinâmico dos destinos mais procurados com preço a partir de e dias de duração. | Título da vitrine, países/cidades em destaque, tags (Praia, Ecoturismo, Neve, Cruzeiros). | Cards 3:4 com gradiente e preço na base, carrossel de fotos redondas, grid de cartões postais. | `destinations_catalog` |
| `tourism_services_grid` | Matriz de diferenciais e especialidades (Aéreos, Resorts All-Inclusive, Seguro, Concierge 24h). | Título da seção, 4 a 8 serviços com ícones personalizados, descrição dos diferenciais. | Grid 4 colunas com micro-cards, grid 2 colunas com descritivo longo, cartões com fotos. | Estático / Serviços |
| `tourism_itinerary_timeline` | Linha do tempo dia a dia detalhando passeios, hospedagens e horários de voos. | Título do roteiro, lista de dias (Dia 1, Dia 2...), atividades, refeições inclusas. | Timeline vertical com marcadores circulares, cartões sanfonados, acordeão dia a dia. | `trip_itinerary` |
| `tourism_traveler_info` | Dicas essenciais do viajante (Clima ideal, documentos/passaporte, franquia de bagagem, câmbio). | Cards de orientações práticas para a viagem, links para emissão de visto. | Cards 3 colunas com ícones monocromáticos, lista de conferência (checklist), tabela de bagagem. | Estático / Documentação |

---

### 3.4. Moda, Vestuário & Editorial Lookbook

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `shop_the_look_hotspots` | Foto editorial de look completo com pontos clicáveis que exibem o preço e adicionam a peça ao carrinho. | Foto do look, coordenadas X/Y dos pontos, produtos vinculados a cada ponto. | Foto central de corpo inteiro com tags flutuantes, split look + lista lateral de peças. | `dynamic_products` |
| `size_guide_table` | Tabela técnica de medidas (Busto, Cintura, Quadril, Comprimento) para eliminar trocas. | Medidas em cm, conversor P/M/G/GG para 38/40/42, instrução de como medir o corpo. | Tabela limpa com alternância de linhas, modal ativado por botão na página do produto. | Estático / Guia |
| `stories_ring` | Círculos de stories estilo Instagram no topo do site para exibir provadores e bastidores em vídeo. | Bolhas com miniaturas, títulos dos destaques, vídeos curtos ou fotos que abrem em tela cheia. | Trilho horizontal com anel colorido de gradiente, barra fixa no topo, grade de círculos. | `stories_feed` |
| `before_after_slider` | Slider interativo antes e depois para procedimentos, tratamentos de tecido ou reformas. | Imagem antes, imagem depois, rótulo dos botões, posição inicial do divisor. | Divisor vertical deslizante com alça central, comparativo lado a lado 50/50. | Estático / Mídia |

---

### 3.5. Serviços Profissionais, B2B & Consultorias

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `service_pricing_table` | Tabela de planos e mensalidades (Básico, Pro, Empresarial) com destaque do "Mais Popular". | Nome do plano, valor mensal/anual, lista de recursos inclusos/exclusos, botão de contratação. | 3 cartões verticais com o do meio elevado, tabela comparativa linha a linha de recursos. | `service_plans` |
| `specialist_team_grid` | Grade de profissionais da clínica, escritório ou consultoria com especialidades e credenciais. | Foto do especialista, nome, cargo, registro profissional (CRM/OAB), botão de agendamento. | Cards com fotos em preto e branco com hover colorido, lista com mini-biografias. | `team_members` |
| `booking_calendar` | Calendário de agendamento de horários com seleção de serviço, profissional e data. | Serviços disponíveis, duração da sessão, horários de atendimento, confirmação online. | Calendário mensal com slots de horários laterais, seletor em 3 passos (Serviço ➔ Data ➔ Dados). | `appointments` |
| `testimonial_carousel` | Depoimentos de clientes satisfeitos com foto, cargo, estrelas e depoimento em aspas. | Nome do cliente, empresa, foto, nota (1 a 5 estrelas), texto do depoimento. | Carrossel deslizante com aspas editoriais grandes, grade de 3 depoimentos, cartão único central. | `dynamic_reviews` |
| `faq_accordion` | Dúvidas frequentes sobre pagamentos, prazos de entrega, garantias e contratos. | Lista de perguntas e respostas com abertura suave e busca interna. | Acordeão limpo de 1 coluna, layout dividido em 2 colunas com títulos de categorias. | Estático / FAQ |

---

### 3.6. Imobiliário, Hotéis & Locação de Temporada

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `property_features_grid` | Atributos do imóvel (Dormitórios, Suítes, Vagas, Metragem, Vista para o mar, Piscina privativa). | Ícones específicos, valores numéricos e etiquetas de comodidades. | Grade de ícones 4x2 com bordas sutis, chips horizontais com badges, lista com marcadores. | `property_catalog` |
| `location_map_card` | Mapa interativo com raio de proximidade (Supermercados, Praias, Hospitais, Aeroporto). | Endereço formatado, coordenadas, pontos de referência próximos com minutos de distância. | Mapa em largura total com card flutuante de endereço, split 50/50 mapa + pontos de interesse. | `store_contact` |
| `gallery_grid` | Galeria de alta resolução para arquitetura e pousadas com zoom e visualização em lightbox. | Múltiplas fotos, legendas, ordenação de fotos de interiores e áreas comuns. | Grid estilo Pinterest (Masonry), grid quadriculado 3x3, carrossel de fotos panorâmicas. | `cms_gallery` |

---

### 3.7. Infoprodutos, Comunidades & Lançamentos

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `video_section` | Vídeo de vendas (VSL) com player customizado, barra de progresso e liberação programada do botão. | URL do vídeo (YouTube/Vimeo/Cloudflare Stream), thumbnail de capa, tempo para liberar o botão. | Player com moldura de cinema, vídeo sem bordas com botão flutuante inferior. | Estático / VSL |
| `routine_steps` | Método sequencial (Módulo 1, 2, 3...) mostrando o caminho de transformação do curso. | Número do passo, título do módulo, resumo das aulas, ícone representativo. | Linha horizontal conectada por traço tracejado, cards verticais numerados grandes. | Estático / Módulos |
| `newsletter_capture` | Captura de e-mail / WhatsApp para pré-venda, catálogo ou cupom de primeira compra. | Chamada de benefício ("Ganhe 10% na primeira compra"), placeholder, texto do botão, LGPD. | Barra de 1 linha centralizada, caixa com foto lateral, pop-up de intenção de saída. | `marketing_leads` |

---

### 3.8. Criadores, Biolinks & Hotpages de Alta Conversão

| Bloco | Caso de Uso | Conteúdo Editável | Variações de Layout | Vínculos CMS |
| :--- | :--- | :--- | :--- | :--- |
| `biolink_profile` | Cabeçalho do perfil social com avatar, arroba (@loja), selo de verificado e bio resumida. | Foto de avatar, título/nome, arroba, biografia de até 150 caracteres, badges de localização. | Avatar redondo com borda gradiente, layout editorial tipográfico, badge minimalista. | `store_profile` |
| `biolink_action_buttons` | Links verticais em estilo botão com ícone, título e destaque pulsante no botão prioritário. | Rótulo do botão, link externo ou página interna, ícone social, efeito de vibração/pulso. | Botões pill com cantos arredondados, botões retangulares flat, botões com efeito vidro (glass). | Estático / Links |
| `biolink_pix_card` | Chave Pix com botão de "Copiar Chave Pix" instantâneo e QR Code para pagamentos rápidos. | Chave Pix (CNPJ/E-mail/Aleatória), titular da conta, banco, valor sugerido opcional. | Card escuro com botão amarelo, card limpo com logo oficial do Pix, mini-card compacto. | `store_pix` |

---

## 4. MOTOR DE ANIMAÇÕES DE SCROLL & INTERATIVIDADE FÍSICA

O padrão **Wix Studio & Framer** destaca-se pela sensação de fluidez e refinamento que as páginas transmitem ao navegar. Toda seção deve permitir ativar animações discretas através da aba **Estilo**:

```text
Configuração de Animação de Scroll (design_tokens.scrollAnimation):
├── type: 'none' | 'fade-in' | 'slide-up' | 'scale-up' | 'reveal-curtain' | 'parallax'
├── trigger: 'on-viewport-enter' | 'continuous-scroll' | 'hover'
├── duration: 'fast' (200ms) | 'normal' (400ms) | 'slow' (700ms)
├── delay: 0ms | 100ms | 200ms | 300ms
└── easing: 'ease-out' | 'cubic-bezier(0.16, 1, 0.3, 1)' (Apple Spring)
```

### Implementação Técnica de Alta Performance (Zero Layout Shift):
- Usar propriedades aceleradas por hardware GPU (`transform: translate3d()` e `opacity`).
- Nunca animar `width`, `height` ou `top`, pois causam *reflow* do documento.
- Utilizar `IntersectionObserver` com `threshold: 0.15` para disparar classes CSS limpas (`animate-fade-in-up`).

---

## 5. MULTI-PÁGINAS, SUBPÁGINAS & NAVEGAÇÃO INTEGRADA

Assim como no Wix Studio, um site comercial completo necessita de **árvore de páginas e navegação unificada**:

```text
Estrutura Hierárquica do Documento (settings.pages):
├── / (Página Inicial / Home) [is_home: true]
├── /produtos (Vitrine Completa)
│     ├── /produtos/feminino (Subpágina)
│     └── /produtos/masculino (Subpágina)
├── /turismo (Hub de Viagens)
│     ├── /turismo/pacotes (Subpágina)
│     └── /turismo/cotacao (Subpágina)
├── /cardapio (Gastronomia)
├── /campanhas/black-friday (Hotpage de Alta Conversão)
└── /sobre-nos (Institucional)
```

### Como a Navegação se Conecta:
1. **Header & Mega Menu Sincronizados:** O componente de cabeçalho lê automaticamente `settings.pages` e renderiza o menu de navegação, com suporte a menus suspensos (dropdowns) para subpáginas.
2. **Seletor de Destino no Inspetor:** Quando o usuário edita um botão (ex: botão do `flash_sale_hero`), o campo `targetLink` permite escolher:
   - Uma página interna cadastrada (`/campanhas/black-friday`).
   - Um produto específico do catálogo (`/produto/jaqueta-bomber`).
   - Uma seção da própria página com rolagem suave (`#depoimentos`).
   - Um link externo ou WhatsApp direto (`https://wa.me/...`).

---

## 6. INFRAESTRUTURA DE SEO CANÔNICO & GEO (GENERATIVE ENGINE OPTIMIZATION)

Para que as lojas e páginas criadas no JAH alcancem posições de topo no Google e sejam compreendidas e recomendadas por **Inteligências Artificiais Generativas (ChatGPT Search, Perplexity AI, Claude e Google Gemini)**, o sistema implementa:

### A. Metatags & OpenGraph Automatizados
Cada página armazena em seu registro:
- `seo_title`: Título semântico otimizado (50-60 caracteres) no formato: `Nome da Página | Nome da Loja — Cidade/UF`.
- `seo_description`: Meta description atraente (140-160 caracteres) com proposta de valor e chamada para ação.
- `canonical_url`: URL canônica para prevenir penalizações de conteúdo duplicado.
- `og_image`: Imagem de alta resolução (1200x630px) para compartilhamento no WhatsApp, Facebook e LinkedIn.

### B. Microdados Estruturados Schema.org (JSON-LD)
Injetados automaticamente no `<head>` do documento:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Nome da Loja",
  "image": "https://images.unsplash.com/...",
  "description": "Descrição comercial da loja.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Brasil, 500",
    "addressLocality": "São Miguel do Oeste",
    "addressRegion": "SC",
    "addressCountry": "BR"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "BRL",
    "lowPrice": "49.90",
    "highPrice": "4890.00"
  }
}
</script>
```

### C. GEO (Generative Engine Optimization) — Preparado para IAs
- **Endpoints de Conteúdo em Markdown Puro:** Rota `/api/ai-manifest/:slug` que cospe a síntese textual limpa da loja para indexadores de IA sem sobrecarga de scripts.
- **Hierarquia de Títulos Impecável:** Apenas um único `<h1>` por página, seguido de `<h2>` para seções temáticas e `<h3>` para itens, garantindo que o web crawler do ChatGPT ou Perplexity extraia os fatos do negócio sem ambiguidade.
- **Preços & Políticas Transparentes:** Regras de parcelamento, entrega e frete descritas em texto legível para que assistentes de voz e chatbots de compra possam recomendar a loja com confiança.

---

## 7. PLANO DE AÇÃO PARA ALINHAMENTO IMEDIATO DO CÓDIGO

Para sanar as queixas imediatas das capturas de tela do usuário:

1. **Refatorar `flash_sale_hero`:**
   - Adicionar os campos no manifesto: `couponCode`, `discountPercentage`, `targetLink`, `buttonText`, `bgImageUrl`.
   - Permitir trocar a cor de destaque (de amber para qualquer cor escolhida no ColorPicker) e trocar a cor do fundo.
2. **Refatorar `countdown_timer`:**
   - Adicionar os controles visuais de cor de fundo, cor do texto e cor das caixas numéricas (`boxColor`, `boxTextColor`).
3. **Expandir o Inspetor (`builder-inspector.tsx`):**
   - Na aba `Conteúdo`, renderizar campos específicos para links de hotpage e cupons.
   - Na aba `Estilo`, habilitar customização de cores de qualquer bloco selecionado.
   - Na aba `Dados`, disponibilizar as fontes dinâmicas de `Cupons da Loja` e `Hotpages / Campanhas`.
