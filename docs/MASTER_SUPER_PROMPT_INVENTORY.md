# MASTER_SUPER_PROMPT_INVENTORY.md — O Super Prompt & Inventário Canônico da Plataforma JAH

> **Documento Canônico VINCULANTE e ABSOLUTO de Engenharia, Produto e Design**  
> Elaborado pelo Conselho Executivo de Engenharia BigTech (CPO, Arquiteto Chefe, Staff Security & Supabase Master, Design Ops Director e Staff QA Gatekeeper).  
> **Propósito:** Inventariar, fragmentar e especificar em detalhes cada uma das demandas, módulos, regras de negócio e decisões de design de toda a história do projeto JAH, garantindo **Completude Quádrupla**, **Zero Esquecimento**, **Zero Duplicações** e **Propagação Global**.

---

## 🏛️ 1. O CONSELHO EXECUTIVO BIGTECH & PRINCÍPIOS FUNDACIONAIS

1. **A Regra da Completude Quádrupla (Inviolável):**  
   Nenhuma funcionalidade pode existir apenas na interface ou com botões de "toast falso". Toda feature DEVE conter:
   - **Camada 1 (Banco de Dados):** Tabela, colunas, índices, constraints e RLS deny-by-default via migration aplicada.
   - **Camada 2 (BFF & Contratos):** Server Functions (`createServerFn`) com schema Zod rigoroso e checagem de autoridade por sessão via `getServerIdentity()`.
   - **Camada 3 (UI de Ação):** Componente interativo (Modal/Sheet/Drawer/Formulário) com feedback real, estados de loading, erro e validação.
   - **Camada 4 (Superfície de Gestão/Governança):** Painel operacional no Workspace/Admin para consulta, curadoria, auditoria e reversão das ações geradas.

2. **A Dualidade de Design System (Paradigma Clean vs Editorial Zine):**
   - **Operação / Workspace / PDV / Gestor / Checkout:** 100% "Paradigma Clean" (Inspirado no iFood/Neutto/Mobg): Fundo neutro suave (`surface-paper`), bordas super finas de 1px, zero sombras pesadas, cantos `rounded-xl`, tipografia sans-serif funcional e silenciosa.
   - **Vitrine Pública / Feed / Mídia:** Camada editorial e cultural vibrante (Flyers, Biolinks, Zines, Vagas de Emprego, Anúncios) como opção de apresentação escolhida pelo autor.

3. **Silêncio Visual na Vitrine Pública:**
   - Proibição de blocos prolixos de título/boas-vindas ("Bem-vindo ao Mercado...").
   - Navegação direta por Banners imersivos, Chips rápidos, `DiscoveryControlBar` e carrosséis horizontais com `hideHeader={true}`.

4. **Isolamento Multi-Tenant Inviolável:**
   - Nunca confiar no `tenant_id` ou `store_id` vindo do frontend em mutações destrutivas.
   - Toda autoridade deriva de `getServerIdentity()` e `assertStoreAccess()`.

5. **Dinheiro = Integer Cents (BRL):**
   - Todos os valores monetários armazenados em centavos inteiros (ex: R$ 15,50 = `1550`).

---

## 🗺️ 2. MATRIZ DE RASTREABILIDADE ANTI-ESQUECIMENTO (32 SUPER PROMPTS ATÔMICOS)

Abaixo, cada módulo e demanda histórica está decomposta em um **Super Prompt Atômico de Engenharia**, contendo objetivo, regras de domínio, anatomia de telas e critérios de aceite.

---

### 📦 FAMÍLIA 1: DESCOBERTA, VITRINE & EXPERIÊNCIA SOCIAL DO CLIENTE

---

#### 📌 SUPER PROMPT `[REQ-001]`: VITRINE COMERCIAL & DISCOVERY HUB
```markdown
### SPEC DE ENGENHARIA: HOME / MARKETPLACE CANÔNICO
- **Objetivo:** Portal de descoberta urbana da cidade, integrando múltiplos nichos (Gastronomia, Mercado, Farmácia, Moda, Beleza, Serviços, Turismo, Classificados) em uma interface veloz e limpa.
- **Camada 1 (Database):** `banners`, `hotpage_cards`, `products`, `stores`, `events`, `reviews`.
- **Camada 2 (BFF):** `getHomeDiscoveryData()`, `getNearbyStores()`, `getFlashDeals()`.
- **Camada 3 (UI):**
  - Hero Carousel de Banners 21:9 com suporte a vídeo/GIF e máscara configurável.
  - Rail de Stories Rápidos locais.
  - Hotpages / Categorias Panorâmicas em Grid 6 colunas.
  - Rail de Ofertas Relâmpago com Timer Dinâmico de expiração.
  - Rail de Lojas & Negócios Locais com logo e tempo de entrega.
  - Trilhos de produtos por nicho com HorizontalRail `hideHeader={true}`.
- **Camada 4 (Workspace):** Painel de curadoria de vitrine em `/workspace/marketing/hotpages` e `/workspace/marketing/banners`.
- **Critério de Aceite:** 0 títulos redundantes na vitrine, scroll a 60fps, responsivo mobile-first.
```

---

#### 📌 SUPER PROMPT `[REQ-002]`: NAVEGAÇÃO CONTEXTUAL & HEADER RETRÁTIL (EFEITO FACEBOOK)
```markdown
### SPEC DE ENGENHARIA: SHELL DE NAVEGAÇÃO MULTI-DISPOSITIVO
- **Objetivo:** Fornecer navegação instantânea e fluida entre as áreas da plataforma sem roubar espaço útil na tela.
- **Comportamento Desktop (TopBar + ContextSidebar):**
  - Sidebar esquerda fixa de 260px com scroll próprio adaptada ao contexto (Comercial, Social, Conta, Workspace, Admin Master).
  - TopBar com Logo, Master Location Pill (GPS/Manual), Smart Search (Ctrl+K), UtilityCluster e Acesso ao Perfil.
- **Comportamento Mobile (TopBar Retrátil + MobileNav):**
  - TopBar com colapso animado da Linha 1 ao scrollar para baixo (Efeito Facebook), mantendo apenas chips ou abas fixas.
  - Barra de navegação inferior (`MobileNav`) com 5 âncoras: [Início], [Mapa], [Botão Ação Central (+)], [Sacola], [Conta].
  - O botão de ação central abre o QuickCreateModal para ações imediatas.
- **Critério de Aceite:** Nomenclatura corrigida (primeiro item é "Início"), scroll suave sem travamentos em iOS e Android.
```

---

#### 📌 SUPER PROMPT `[REQ-003]`: MURAL SOCIAL DA COMUNIDADE, STORIES & MOMENTS
```markdown
### SPEC DE ENGENHARIA: FEED SOCIAL URBANO DA COMUNIDADE JAH
- **Objetivo:** Espaço social para moradores e comércios compartilharem vivências, fotos da rua, desapegos e novidades da cidade.
- **Camada 1 (Database):** `posts`, `post_likes`, `post_comments`, `stories`, `profiles`.
- **Camada 2 (BFF):** `getMuralFeed()`, `getFeedStories()`, `togglePostLike()`, `addPostComment()`.
- **Camada 3 (UI):**
  - Rail de Stories efêmeros no topo com visualizador de tela cheia.
  - Abas Sticky no topo: [Pra Você] [Seguindo] [Moments] [Desapegos].
  - No Mobile: Inpage composer OCULTO (`hidden sm:block`) para manter o feed 100% focado na leitura.
  - No Desktop: InlinePostComposer com upload e pré-visualização.
- **Camada 4 (Workspace):** Painel de moderação e curadoria social em `/workspace/moderacao` e `/workspace/cms/stories`.
- **Critério de Aceite:** Abas fixadas suavemente no topo durante o scroll mobile; feed com paginação infinita real do Supabase.
```

---

#### 📌 SUPER PROMPT `[REQ-004]`: GAVETA FULLSCREEN DE CRIAÇÃO MOBILE & ISOLAMENTO DE IDENTIDADE
```markdown
### SPEC DE ENGENHARIA: POST CREATION DRAWER & GOVERNANÇA DE IDENTIDADE
- **Objetivo:** Permitir ao usuário mobile criar qualquer tipo de post em uma gaveta 100% fullscreen sem poluir a interface do feed, garantindo que ele publique estritamente como Perfil Pessoal no mural público.
- **Camada 1 (Database):** `posts` com campos `post_type`, `layout_style`, `author_profile_id`, `author_store_id`, `metadata`.
- **Camada 2 (BFF):** `createPost()` validando autorização de sessão (`getServerIdentity()`).
- **Camada 3 (UI - PostCreationDrawer):**
  - Acionada pelo botão `+` da barra inferior ou pelo menu rápido.
  - Ocupa 100% da tela no mobile (`h-[95vh] rounded-t-[32px]`).
  - Identidade do autor travada no Perfil Pessoal (Avatar e Nome do usuário logado), sem seletores confusos de loja.
  - Seletor de formatos com 6 templates especializados: Post Padrão, Carrossel Instagram, Thread Vertical, Moment Vídeo, Desapego Rápido, Evento Comunitário.
- **Camada 4 (Workspace):** Publicações corporativas/comerciais como loja ocorrem exclusivamente dentro do `/workspace` da empresa.
```

---

#### 📌 SUPER PROMPT `[REQ-005]`: FORMATOS SOCIAIS RICOS (THREADS, CAROUSEL INSTAGRAM, MOMENTS, DESAPEGO)
```markdown
### SPEC DE ENGENHARIA: MOTOR MULTI-FORMATO DE POSTS E RENDERIZADORES
- **Objetivo:** Suportar os formatos visuais modernos mais engajadores do mercado.
- **Formato 1: Post Padrão (Simple):** Texto rico com foto/vídeo única em proporção natural ou 16:9.
- **Formato 2: Carrossel Estilo Instagram:** Múltiplas fotos/vídeos em proporção 1:1 ou 4:5, swipe nativo com snap, contador `1/N` e dots indicadores de paginação (`● ○ ○`).
- **Formato 3: Thread Vertical (Estilo Threads / X):** Sequência de cartões encadeados interligados por linha vertical contínua, com numeração de nós (`1`, `2`, `3...`) e texto/mídia por nó.
- **Formato 4: Moment Vídeo (9:16 Short Video):** Player vertical de vídeo com badge de localização e tag de atividade.
- **Formato 5: Desapego Rápido (Fast Classified):** Card com tag de preço em BRL, condição do item (Novo/Seminovo/Usado) e botão direto de WhatsApp.
- **Formato 6: Evento Comunitário:** Badge de calendário com data/hora, endereço e link direto de RSVP/ingressos.
- **Critério de Aceite:** `PostCard.tsx` renderiza com fidelidade absoluta cada um dos 6 formatos sem quebras visuais.
```

---

#### 📌 SUPER PROMPT `[REQ-006]`: BUSCA FEDERADA INTELIGENTE & GEOLOCALIZAÇÃO
```markdown
### SPEC DE ENGENHARIA: CENTRAL DE BUSCA UNIVERSAL & MAPA INTERATIVO
- **Objetivo:** Permitir ao morador encontrar qualquer coisa na cidade (produtos, lojas, pratos, serviços, eventos, pessoas e notícias) em uma única interface unificada.
- **Camada 1 (Database):** Índices de texto total (`tsvector`), busca vetorial e extensões espaciais (PostGIS / Haversine distance).
- **Camada 2 (BFF):** `searchGlobalEntities()`, `getMapPoints()`.
- **Camada 3 (UI):**
  - Rota `/_store/buscar` com barra de pesquisa full-width, chips horizontais de tipo e resultados segmentados.
  - Rota `/_store/mapa` com mapa interativo full-bleed, clustering de pontos e cards inferiores com snap scroll.
- **Camada 4 (Workspace):** Geocodificação de endereços e coordenadas configuráveis no `/workspace/configuracoes`.
```

---

#### 📌 SUPER PROMPT `[REQ-007]`: DETALHES RICOS DE ENTIDADE (PADRÃO MOBG / NEUTTO COM TRUTHFUL PREVIEW)
```markdown
### SPEC DE ENGENHARIA: ANATOMIA CANÔNICA DE PÁGINAS DE DETALHE
- **Objetivo:** Padronizar as páginas de detalhe de Produto, Serviço, Evento, Imóvel e Classificado seguindo a anatomia da Mobg.
- **Anatomia Canônica:**
  - Galeria de mídia assimétrica em primeiro plano (imagem principal grande + 4 miniaturas no desktop; carrossel no mobile).
  - Breadcrumbs e chips de status/categoria no topo.
  - Título, autor/loja e localização antes dos atributos.
  - Cartões de características objetivas em grid compacto.
  - Coluna lateral fixa (Desktop) ou Barra Inferior Persistente (Mobile) contendo decomposição de preço, disponibilidade e botão de conversão principal (Comprar / Agendar / Inscrever-se / Chamar no WhatsApp).
- **Critério de Aceite:** Zero compressão no mobile; truthful preview idêntico ao dado real.
```

---

#### 📌 SUPER PROMPT `[REQ-008]`: CARRINHO MULTILOJAS & CHECKOUT TRANSACIONAL
```markdown
### SPEC DE ENGENHARIA: MOTOR DE CARRINHO, CUPONS & CHECKOUT ATÔMICO
- **Objetivo:** Gestão de sacola de compras com suporte a múltiplos estabelecimentos (carrinhos independentes por loja) e checkout seguro.
- **Camada 1 (Database):** `carts`, `cart_items`, `orders`, `order_items`, `coupons`, `cash_register_shifts`.
- **Camada 2 (BFF):** `getCart()`, `addToCart()`, `updateCartItem()`, `checkoutOrderAtomicRPC()`.
- **Camada 3 (UI):**
  - `CartSheet` deslizante no desktop e tela cheia no mobile com indicador de itens por loja.
  - Fluxo de Checkout em etapas claras: Identificação ➔ Modalidade (Entrega / Retirada / Consumo Local) ➔ Endereço ➔ Cupom ➔ Pagamento (PIX, Cartão, Na Entrega) ➔ Resumo Decomposto.
- **Camada 4 (Workspace):** Pedidos gerados entram instantaneamente no `/workspace/pedidos` com alerta sonoro e visual.
- **Regras:** Dinheiro em centavos inteiros; idempotency key no pagamento; rollback atômico em caso de falha.
```

---

#### 📌 SUPER PROMPT `[REQ-009]`: CENTRAL DO CLIENTE (CONTA, PEDIDOS, AGENDAMENTOS, DESAPEGOS)
```markdown
### SPEC DE ENGENHARIA: PORTAL DO MORADOR / CONSUMIDOR
- **Objetivo:** Painel completo para o usuário acompanhar suas compras, ingressos, agendamentos e classificados.
- **Rotas:**
  - `/_store/conta`: Resumo geral, saldo de cashback e atalhos.
  - `/_store/conta/pedidos`: Lista de pedidos com timeline de rastreio em tempo real.
  - `/_store/conta/agendamentos`: Sessões e reservas com botão de cancelamento/reagendamento segundo política.
  - `/_store/conta/ingressos`: Ingressos digitais com QR Code para check-in.
  - `/_store/conta/classificados`: Gestão dos próprios desapegos anunciados (ativar, pausar, excluir).
- **Critério de Aceite:** 100% conectado aos Server Functions do Supabase; sem mocks.
```

---

### 🏬 FAMÍLIA 2: CATÁLOGO, CADASTRO & EDIÇÃO EM PROFUNDIDADES

---

#### 📌 SUPER PROMPT `[REQ-010]`: MODELO UNIVERSAL DE OFERTA MULTINICHO
```markdown
### SPEC DE ENGENHARIA: DOMÍNIO DE OFERTAS MULTIDISCIPLINAR
- **Objetivo:** Atender múltiplos nichos de mercado (Moda, Gastronomia, Beleza, Serviços, Imóveis, Eventos) com um núcleo comum de Oferta sem tabelas redundantes.
- **Camada 1 (Database):** `products` com colunas de núcleo (`id`, `store_id`, `title`, `description`, `price_cents`, `images`, `status`, `metadata`) e tabelas filhas especializadas (`product_variants`, `service_durations`, `event_batches`).
- **Camada 2 (BFF):** `saveProduct()`, `deleteProduct()`, `updateProductStatus()`.
- **Especializações por Blueprint de Nicho:**
  - **Moda / Vestuário:** Grade de Variações (Tamanho + Cor), SKU e estoque por combinação.
  - **Gastronomia / Comida:** Ficha técnica de preparo, tempo de cozinha e grupos de complementos.
  - **Beleza / Serviços:** Duração em minutos, profissionais habilitados, sala/recurso e insumos consumidos.
  - **Eventos:** Lotes de ingressos, capacidade máxima e formulário de inscrição.
```

---

#### 📌 SUPER PROMPT `[REQ-011]`: EDIÇÃO EM 4 PROFUNDIDADES (CÉLULA, LINHA, PAINEL LATERAL & PÁGINA)
```markdown
### SPEC DE ENGENHARIA: SISTEMA DE EDIÇÃO OPERACIONAL GRADUAL
- **Objetivo:** Permitir ao comerciante editar dados com a menor fricção possível, seguindo a taxonomia do iFood/MUI Data Grid.
- **Profundidade 1 (Edição de Célula):** Alterações atômicas de 1 clique direto na tabela (Preço, Estoque, Status Ativo/Inativo) com validação inline e persistência instantânea.
- **Profundidade 2 (Edição de Linha):** Edição rápida de pequenos grupos de campos relacionados sem sair da linha.
- **Profundidade 3 (Edição Lateral - Side Panel / Drawer):** Painel deslizante à direita para alterar opções, tags e fotos preservando a tabela visível ao fundo.
- **Profundidade 4 (Edição Completa - Página Dedicada):** Rota `/workspace/catalogo/produtos/$id` com formulário em tabs e Truthful Preview lateral.
```

---

#### 📌 SUPER PROMPT `[REQ-012]`: GRUPOS DE COMPLEMENTOS, MODIFICADORES & VARIAÇÕES INFINITAS
```markdown
### SPEC DE ENGENHARIA: MOTOR DE COMPLEMENTOS E CUSTOMIZAÇÃO DE ITENS
- **Objetivo:** Permitir regras complexas de adicionais (ex: Carnes, Queijos, Molhos, Ponto da Carne, Borda Recheada, Kit Talher).
- **Camada 1 (Database):** `product_option_groups` e `product_option_items`.
- **Regras de Domínio:**
  - Tipo de seleção: Escolha Única Obrigatória (Radio), Múltipla Escolha (Checkbox), Quantidade por Item (Stepper).
  - Limites: Quantidade Mínima Total, Quantidade Máxima Total, Quantidade Máxima por Opção.
  - Franquia Incluída (ex: "escolha até 2 sabores sem custo adicional; adicionais cobram R$ 3,00 cada").
  - Regras Condicionais declarativas (ex: "Se escolheu Carne Bovina ➔ Exibir Grupo Ponto da Carne").
- **Camada 3 (UI):** Wizard visual de criação de grupos em `/workspace/catalogo/atributos`.
- **Snapshot Imutável:** O pedido final congela os nomes, preços e opções escolhidas para auditoria futura.
```

---

#### 📌 SUPER PROMPT `[REQ-013]`: CADASTRO DE PRODUTO COM TRUTHFUL PREVIEW EM TEMPO REAL
```markdown
### SPEC DE ENGENHARIA: PÁGINA DE CADASTRO COM PRÉVIA LATERAL FIEL
- **Objetivo:** Criar e editar produtos complexos visualizando exatamente como o cliente verá o item no aplicativo.
- **Camada 3 (UI):**
  - Lado Esquerdo: Formulário em seções (`Sobre`, `Preço & Canais`, `Variações & Adicionais`, `Disponibilidade`, `Operação`).
  - Lado Direito: Truthful Preview em mockup de smartphone que renderiza o componente real de produto usando os dados digitados em tempo real.
  - Barra inferior fixa com botões "Salvar Alterações" e "Cancelar" com detecção de estado sujo (dirty state).
- **Critério de Aceite:** O preview nunca inventa dados; se não houver foto, exibe o placeholder de foto ausente.
```

---

#### 📌 SUPER PROMPT `[REQ-014]`: ALMOXARIFADO, CONTROLE DE INSUMOS & RUPTURA DE ESTOQUE
```markdown
### SPEC DE ENGENHARIA: GESTÃO DE ESTOQUE & INVENTÁRIO CRÍTICO
- **Objetivo:** Controle preciso de níveis de estoque de produtos acabados e insumos de produção.
- **Camada 1 (Database):** `inventory_levels`, `inventory_transactions`, `suppliers`.
- **Camada 2 (BFF):** `getInventoryLevels()`, `adjustStock()`, `recordStockMovement()`.
- **Camada 3 (UI):** Rota `/workspace/estoque` com filtros de "Estoque Crítico", "Esgotados", "Em Ruptura" e modal de ajuste rápido com justificativa obrigatória (Entrada, Perda, Ajuste de Balanço).
- **Camada 4 (Automação):** Pausa automática de venda na vitrine quando o estoque atinge zero (se configurado pelo lojista).
```

---

### 💳 FAMÍLIA 3: VENDAS, FRENTE DE CAIXA, PDV & OPERAÇÃO

---

#### 📌 SUPER PROMPT `[REQ-015]`: GESTOR DE PEDIDOS KANBAN / KDS MULTICANAL
```markdown
### SPEC DE ENGENHARIA: PAINEL OPERACIONAL FULLSCREEN DE COZINHA E EXPEDIÇÃO
- **Objetivo:** Aplicação web de tela cheia para monitoramento de pedidos em tempo real no balcão, cozinha ou esteira de separação.
- **Camada 1 (Database & Realtime):** `orders` com subscrição realtime via Supabase Realtime Channels.
- **Camada 2 (BFF):** `advanceOrderStatus()`, `cancelOrder()`, `dispatchDelivery()`.
- **Camada 3 (UI - /workspace/pedidos/gestor):**
  - Modo Kanban com colunas operacionais: [Pendentes] ➔ [Em Preparo / Separação] ➔ [Pronto para Coleta] ➔ [Em Rota] ➔ [Entregue].
  - Modo KDS (Kitchen Display System) para cozinha com separação por estação (Chapa, Bar, Montagem).
  - Alerta sonoro configurável e badge visual piscante para novos pedidos.
  - Card com tempo decorrido, promessa de entrega e botão de avanço em 1 toque.
- **Critério de Aceite:** Transição de estado instantânea com rollback e som de alerta sonoro nativo.
```

---

#### 📌 SUPER PROMPT `[REQ-016]`: PDV / FRENTE DE CAIXA NATIVO COM LEITOR EAN & COMANDAS
```markdown
### SPEC DE ENGENHARIA: SISTEMA DE PONTO DE VENDA (POS) NATIVO
- **Objetivo:** Frente de caixa de alta velocidade para vendas físicas presenciais no balcão ou salão.
- **Camada 1 (Database):** `cash_register_shifts`, `orders`, `order_items`, `customers`.
- **Camada 2 (BFF):** `openShift()`, `closeShift()`, `processPdvSale()`, `recordCashMovement()`.
- **Camada 3 (UI - /workspace/pdv):**
  - Lado Esquerdo: Grid visual de produtos com busca rápida e suporte a leitor de código de barras (EAN).
  - Lado Direito: Comanda persistente da venda atual com cálculo automático de subtotal, descontos e acréscimos.
  - Gestão de Comandas por Mesa, Cliente ou Cartão de Consumo.
  - Modal de Pagamento Rápido: Dinheiro (com cálculo de troco), Cartão Débito/Crédito, PIX QR Code Dinâmico.
- **Camada 4 (Caixa):** Sangrias, Suprimentos e Fechamento de Turno com conciliação cega em `/workspace/financeiro/caixa`.
```

---

#### 📌 SUPER PROMPT `[REQ-017]`: MOTOR DE IMPRESSÃO TÉRMICA DE PEDIDOS & CUPONS
```markdown
### SPEC DE ENGENHARIA: SPOOLING E ROTEAMENTO DE IMPRESSÃO DE COZINHA/BALCÃO
- **Objetivo:** Impressão automática ou sob demanda de pedidos em impressoras térmicas (58mm e 80mm).
- **Camada 1 (Database):** `print_jobs` com status (`queued`, `printing`, `completed`, `failed`).
- **Camada 2 (BFF):** `queuePrintJob()`, `reprintOrder()`, `getPrintJobStatus()`.
- **Camada 3 (UI):** Templates formatados com layout limpo: Número do Pedido, Cliente, Itens com Adicionais em destaque, Observações em negrito e Endereço de Entrega.
- **Camada 4 (Conectividade):** Roteamento por estação (Via da Cozinha vs Via do Balcão vs Via do Entregador).
```

---

#### 📌 SUPER PROMPT `[REQ-018]`: CRM DE CLIENTES, CLUBE DE VANTAGENS & RETENÇÃO
```markdown
### SPEC DE ENGENHARIA: GESTÃO DE RELACIONAMENTO & HISTÓRICO DE COMPRAS
- **Objetivo:** Centralizar os dados de clientes para campanhas de fidelização e recompra.
- **Camada 1 (Database):** `customers`, `customer_loyalty_points`, `orders`.
- **Camada 2 (BFF):** `listCustomers()`, `getCustomerProfile()`, `issueLoyaltyPoints()`.
- **Camada 3 (UI - /workspace/clientes):**
  - Tabela densa de clientes com busca por nome, telefone e e-mail.
  - Perfil detalhado do cliente com histórico completo de pedidos, valor total gasto (LTV), ticket médio e frequência.
  - Tags de segmentação (VIP, Frequente, Em Risco, Inativo).
```

---

### 💈 FAMÍLIA 4: SERVIÇOS, BELEZA, SAÚDE & AGENDAMENTOS

---

#### 📌 SUPER PROMPT `[REQ-019]`: GRADE DE AGENDAMENTO UNIVERSAL & COORDENAÇÃO DE RECURSOS
```markdown
### SPEC DE ENGENHARIA: AGENDA MULTIPROFISSIONAL E RECURSOS AGENDÁVEIS
- **Objetivo:** Sistema de agendamento de horários para clínicas, salões, barbearias, consultórios e estúdios.
- **Camada 1 (Database):** `appointments`, `services`, `service_resources`, `service_schedules`.
- **Camada 2 (BFF):** `getAppointmentGrid()`, `bookAppointment()`, `rescheduleAppointment()`, `cancelAppointment()`.
- **Camada 3 (UI - /workspace/agenda):**
  - Visualização em Grade Diária (colunas por profissional/sala) e Semanal.
  - Bloqueios de horário rápidos (almoço, folga, férias) com 1 clique.
  - Detecção e prevenção automática de overbooking e conflito de salas/equipamentos.
- **Camada 4 (Cliente):** Agendamento self-service pelo perfil público da loja com seleção de profissional e lembretes automáticos.
```

---

#### 📌 SUPER PROMPT `[REQ-020]`: VERTICAL DE BELEZA & SAÚDE (PRONTUÁRIO, INSUMOS & COMISSÕES SPLIT)
```markdown
### SPEC DE ENGENHARIA: REGRAS ESPECÍFICAS DE SALÃO, ESTÉTICA E CLÍNICAS
- **Objetivo:** Resolver as dores de gestão de estabelecimentos de beleza inspiradas no Belasis, Avec e Trinks.
- **Camada 1 (Database):** `clinical_records`, `service_materials`, `staff_commissions`.
- **Camada 2 (BFF):** `saveClinicalRecord()`, `calculateStaffCommissions()`, `deductServiceMaterials()`.
- **Camada 3 (UI):**
  - Prontuário e Ficha de Anamnese segura com histórico de procedimentos e fotos de antes/depois.
  - Baixa automática de insumos fracionados do almoxarifado ao concluir um serviço (ex: 50g de tintura).
  - Cálculo automatizado de comissões por profissional parceiro (Split de atendimento).
```

---

#### 📌 SUPER PROMPT `[REQ-021]`: PACOTES DE SESSÕES, ASSINATURAS & PASSES
```markdown
### SPEC DE ENGENHARIA: MOTOR DE CRÉDITOS DE SESSÕES & RECORRÊNCIA
- **Objetivo:** Venda de pacotes de serviços pré-pagos (ex: 10 sessões de depilação a laser) e clubes de assinatura.
- **Camada 1 (Database):** `service_packages`, `customer_package_balances`, `subscriptions`.
- **Camada 2 (BFF):** `sellPackage()`, `redeemSessionCredit()`, `getPackageBalance()`.
- **Camada 3 (UI):** Na comanda do PDV e no Agendamento, identificação imediata se o cliente possui créditos ativos de pacote para abater o valor do atendimento.
```

---

### 🛵 FAMÍLIA 5: LOGÍSTICA, FROTA & SOB DEMANDA

---

#### 📌 SUPER PROMPT `[REQ-022]`: FROTA PRÓPRIA & DESPACHO DE MOTOBOYS
```markdown
### SPEC DE ENGENHARIA: DESPACHO E GESTÃO DE ENTREGADORES LOCAIS
- **Objetivo:** Acompanhar saídas e retornos de motoboys próprios ou parceiros da loja.
- **Camada 1 (Database):** `delivery_drivers`, `delivery_trips`, `delivery_settlements`.
- **Camada 2 (BFF):** `dispatchTrip()`, `completeDelivery()`, `calculateDriverPay()`.
- **Camada 3 (UI - /workspace/pedidos/frota):**
  - Quadro de despacho de corridas com atribuição de pedidos para entregadores disponíveis.
  - Relatório de fechamento de diárias e taxa de entrega por corrida com prestação de contas.
```

---

#### 📌 SUPER PROMPT `[REQ-023]`: LOGÍSTICA SOB DEMANDA PARA PEDIDOS EXTERNOS
```markdown
### SPEC DE ENGENHARIA: SOLICITAÇÃO AVULSA DE ENTREGA (CHANNEL-AGNOSTIC DELIVERY)
- **Objetivo:** Permitir que uma empresa solicite um motoboy para qualquer pacote ou pedido externo (WhatsApp, telefone, balcão).
- **Camada 1 (Database):** `on_demand_deliveries`.
- **Camada 2 (BFF):** `quoteOnDemandDelivery()`, `createOnDemandTrip()`.
- **Camada 3 (UI):** Modal rápido com Endereço de Coleta, Endereço de Destino, Cotação de Preço em tempo real e botão de "Chamar Entregador Agora".
```

---

#### 📌 SUPER PROMPT `[REQ-024]`: CONFIGURAÇÃO ESPACIAL DE ENTREGAS (RAIO, BAIRROS, CEP & POLÍGONOS)
```markdown
### SPEC DE ENGENHARIA: MOTOR DE COBERTURA GEOGRÁFICA DE FRETE
- **Objetivo:** Definir com precisão as áreas atendidas e as taxas de entrega da loja.
- **Camada 1 (Database):** `shipping_zones`, `shipping_rates`.
- **Camada 2 (BFF):** `saveShippingZones()`, `calculateShippingForAddress()`.
- **Camada 3 (UI - /workspace/configuracoes):**
  - Interface dupla: Mapa Interativo com círculo de raio / polígono e Tabela Lateral de Bairros com Valor e Tempo Estimado.
  - Validação em tempo real durante o checkout do cliente.
```

---

#### 📌 SUPER PROMPT `[REQ-025]`: APLICAÇÃO DO ENTREGADOR (ONBOARDING, CORRIDAS & PROVA DE ENTREGA)
```markdown
### SPEC DE ENGENHARIA: INTERFACE MOBILE DO ENTREGADOR
- **Objetivo:** Interface ágil para o motoboy aceitar corridas, navegar e confirmar entrega.
- **Camada 3 (UI Mobile):**
  - Card de Oferta de Corrida com Origem, Destino, Distância (km) e Valor a Receber.
  - Botão de Navegação GPS (Google Maps / Waze).
  - Confirmação de Entrega com PIN numérico de segurança ou foto do comprovante.
```

---

### 🎨 FAMÍLIA 6: MARKETING, CRIAÇÃO & ESTÚDIO EDITORIAL

---

#### 📌 SUPER PROMPT `[REQ-026]`: TOP BANNERS VÍDEO/GIF & CARDS PANORÂMICOS HOTPAGES
```markdown
### SPEC DE ENGENHARIA: GESTÃO DE DESTAQUES VISUAIS DA VITRINE
- **Objetivo:** Configurar as peças de maior destaque visual da plataforma.
- **Camada 1 (Database):** `banners`, `hotpage_cards`.
- **Camada 2 (BFF):** `saveBanner()`, `deleteBanner()`, `saveHotpageCard()`.
- **Camada 3 (UI - /workspace/marketing/banners & /workspace/marketing/hotpages):**
  - Upload de imagens e vídeos com corte e proporção guiada (21:9 no desktop e 16:9 no mobile).
  - Configuração de links de destino internos (para loja, produto, evento ou categoria) ou externos.
  - Programação de início e fim da veiculação com badge de status ativo/inativo.
```

---

#### 📌 SUPER PROMPT `[REQ-027]`: ESTÚDIO DE APRESENTAÇÃO EDITORIAL (FLYERS, BIOLINKS & ZINES)
```markdown
### SPEC DE ENGENHARIA: BUILDER CANÔNICO DE PEÇAS DIGITAIS JAH
- **Objetivo:** Permitir aos comércios e criadores criarem cartazes, flyers, biolinks e páginas autorais com a estética cultural da JAH.
- **Camada 1 (Database):** `builder_documents`, `bio_links`.
- **Camada 2 (BFF):** `saveBuilderDocument()`, `publishBioLink()`.
- **Camada 3 (UI - /workspace/estudio & /workspace/cms/bio):**
  - Editor visual drag-and-drop de blocos (Cabeçalhos, Botões de Link, Galerias, Produtos em Destaque, Redes Sociais).
  - Renderizador público ultrarrápido em rotas como `/bio/$username`.
```

---

#### 📌 SUPER PROMPT `[REQ-028]`: MONETIZAÇÃO LOCAL, PATROCINADORES & CUPONS RELÂMPAGO
```markdown
### SPEC DE ENGENHARIA: MOTOR DE CUPONS E VEICULAÇÃO DE MARCAS LOCAIS
- **Objetivo:** Campanhas de desconto e espaços de patrocínio para fomento da economia urbana.
- **Camada 1 (Database):** `coupons`, `sponsors`, `gift_cards`.
- **Camada 2 (BFF):** `createCoupon()`, `validateCoupon()`, `saveSponsor()`.
- **Camada 3 (UI):** Painéis de gestão com métricas de uso de cupons, valor economizado pelos clientes e receita gerada.
```

---

### 🛡️ FAMÍLIA 7: FINANCEIRO, ADMIN MASTER, GOVERNANÇA & SEGURANÇA

---

#### 📌 SUPER PROMPT `[REQ-029]`: PAINEL FINANCEIRO, CAIXA, SANGRIAS & RECONCILIAÇÃO
```markdown
### SPEC DE ENGENHARIA: LEDGER FINANCEIRO & CONTROLE DE REPASSES
- **Objetivo:** Dar total transparência financeira sobre vendas brutas, taxas, estornos e valor líquido a receber.
- **Camada 1 (Database):** `orders`, `cash_register_shifts`, `cash_movements`, `payouts`.
- **Camada 2 (BFF):** `getFinancialSummary()`, `listPayouts()`, `reconcilePayments()`.
- **Camada 3 (UI - /workspace/financeiro/caixa):**
  - Cards de síntese financeira (Faturamento Bruto, Taxas da Plataforma, Descontos Aplicados, Líquido).
  - Tabela detalhada de repasses com previsão de depósito bancário e status de liquidação.
  - Extrato auditável onde cada centavo está atrelado ao ID de um pedido real.
```

---

#### 📌 SUPER PROMPT `[REQ-030]`: ADMIN MASTER & GOVERNANÇA GLOBAL DE APIS / INTEGRAÇÕES
```markdown
### SPEC DE ENGENHARIA: PAINEL DO SUPER ADMINISTRADOR DA PLATAFORMA
- **Objetivo:** Governança centralizada de todas as chaves de API, webhooks e provedores globais da infraestrutura JAH.
- **Camada 1 (Database):** `stores.settings.integrations` (Tenant Raiz) e `forensic_audit_events`.
- **Camada 2 (BFF):** `getPlatformApiIntegrations()`, `updatePlatformApiIntegrations()` com mascaramento de segredos.
- **Camada 3 (UI - /admin-master/integracoes):**
  - 6 Abas de Configuração: Mapas (Mapbox/Google), Pagamentos (Stripe/Asaas), E-mail/SMS (Resend/Twilio), Fretes (Melhor Envio), IA (OpenAI/Gemini), Webhooks (HMAC Secret).
  - Status em tempo real: Ativo, Sandbox, Erro, Não Configurado.
- **Camada 4 (RBAC):** Acesso estritamente restrito a `platform_admin`.
```

---

#### 📌 SUPER PROMPT `[REQ-031]`: AUDITORIA ANTI-DUPLICAÇÃO DE CÓDIGO, ROTAS E SERVIÇOS
```markdown
### SPEC DE ENGENHARIA: UNIFICAÇÃO CANÔNICA DE SERVIÇOS E ROTAS
- **Objetivo:** Garantir que nenhuma rota, função ou componente exista em duplicidade ou com lógicas concorrentes no repositório.
- **Diretrizes:**
  - `src/services/integrations.functions.ts` é a ÚNICA fonte para credenciais de lojas (`integration_credentials`).
  - `src/services/master.functions.ts` é a ÚNICA fonte para credenciais globais da plataforma.
  - `src/services/growth.functions.ts` delega diretamente para `integrations.functions.ts`.
  - Zero arquivos órfãos ou rotas fantasmas sem links de navegação.
```

---

#### 📌 SUPER PROMPT `[REQ-032]`: RLS DENY-BY-DEFAULT & ISOLAMENTO MULTI-TENANT INVIOLÁVEL
```markdown
### SPEC DE ENGENHARIA: SEGURANÇA EM PROFUNDIDADE NO BANCO DE DADOS
- **Objetivo:** Garantir que nenhum tenant consiga ler, alterar ou deletar dados de outro tenant, mesmo em caso de falha no frontend.
- **Camada 1 (Postgres RLS):** Todas as tabelas protegidas por Row Level Security habilitada (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
- **Camada 2 (BFF Security):** Validação cruzada obrigatória de `store_id` e `organization_id` derivada da sessão JWT segura via `getServerIdentity()`.
- **Camada 3 (Auditoria):** Registro de eventos críticos em `forensic_audit_events` com IP, ator, timestamp e payload diff.
```

---

---

#### 📌 SUPER PROMPT `[REQ-033]`: GAVETA DE AÇÕES (`+` ACTION DRAWER) REVOLUCIONADA
```markdown
### SPEC DE ENGENHARIA: GAVETA FULLSCREEN DE AÇÕES PESSOAIS COM CARDS GRANDES & SCROLL HORIZONTAL
- **Objetivo:** Transformar o botão `+` em uma experiência de criação visual, rápida e estritamente pessoal.
- **Regras:**
  - Silêncio visual absoluto (proibição de títulos prolixos de boas-vindas).
  - Remoção de ações corporativas (Lojas & Estoque), mantendo-as exclusivas ao Workspace da Empresa.
  - Renderização de Cards Grandes (`w-[260px] sm:w-[285px] h-[350px]`) em trilho horizontal com snap scroll.
- **Evidências:** `src/components/commerce/quick-create-modal.tsx`.
```

---

#### 📌 SUPER PROMPT `[REQ-034]`: ROTA CANÔNICA DE OFERTAS (`/ofertas`) & MAPEAMENTO
```markdown
### SPEC DE ENGENHARIA: ROTEAMENTO DIRETO DE OFERTAS & DESCONTOS
- **Objetivo:** Garantir que o botão "Ofertas" direcione para a rota dedicada `/ofertas`, em vez de `/mercado`.
- **Evidências:** `src/components/commerce/master-hero-cards.tsx`, `src/services/hotpage.functions.ts`.
```

---

#### 📌 SUPER PROMPT `[REQ-035]`: COMPONENTE CANÔNICO DE CHIPS COM MÍDIA & TEXTURA (`DynamicMediaChip`)
```markdown
### SPEC DE ENGENHARIA: BOTÕES DE NAVEGAÇÃO COM VÍDEO/GIF/IMAGEM & CONTROLE DE CONTRASTE
- **Objetivo:** Fornecer suporte irrestrito a mídia de background (vídeo MP4, GIF animado, imagens), texturas (noise, dots, grid, mesh, glass), overlay de contraste configurável (0-90%) e upload de ícones PNG/SVG.
- **Evidências:** `src/components/commerce/dynamic-media-chip.tsx`, `src/components/commerce/discovery-control-bar.tsx`.
```

---

#### 📌 SUPER PROMPT `[REQ-036]`: GESTÃO GLOBAL MULTI-PÁGINAS DE BOTÕES & HOTPAGES
```markdown
### SPEC DE ENGENHARIA: CENTRAL DE CONTROLE DE BOTÕES NO WORKSPACE COM LIVE PREVIEW
- **Objetivo:** Permitir ao administrador gerenciar todos os botões de todas as 25+ páginas (Home, Mercado, Gastronomia, Farmácia, Empregos, etc.), editando rotas, mídias, texturas e ícones em tempo real com Live Preview.
- **Evidências:** `src/routes/workspace.marketing.hotpages.tsx`, `docs/NAVIGATION_BUTTONS_SYSTEM.md`.
```

---

## 📊 3. INVENTÁRIO DE STATUS & GAP ANALYSIS CONSOLIDADO

Abaixo está o inventário de cada uma das 36 demandas da plataforma:

| ID | Módulo / Requisito | Status Atual | Evidências no Código / Rotas | Ações de Refinamento |
|---|---|---|---|---|
| `[REQ-001]` | Vitrine & Discovery Hub | `✅ IMPLEMENTADO` | `src/routes/_store.index.tsx`, `HorizontalRail.tsx` | Manter silêncio visual e timers dinâmicos ativos. |
| `[REQ-002]` | Navegação & TopBar Retrátil | `✅ IMPLEMENTADO` | `top-bar.tsx`, `mobile-nav.tsx`, `context-sidebar.tsx` | Nomenclatura "Início" e colapso Facebook ativos. |
| `[REQ-003]` | Mural da Comunidade & Stories | `✅ IMPLEMENTADO` | `src/routes/_store.mural.tsx`, `story-rail.tsx` | Composer inpage oculto no mobile, abas sticky no topo. |
| `[REQ-004]` | Gaveta Fullscreen de Criação | `✅ IMPLEMENTADO` | `post-creation-drawer.tsx`, `quick-create-modal.tsx` | 100% fullscreen no mobile com identidade pessoal pura. |
| `[REQ-005]` | Formatos Sociais Ricos | `✅ IMPLEMENTADO` | `post-card.tsx`, `social.functions.ts` | Threads, Carrossel com dots, Moments, Desapegos e Eventos. |
| `[REQ-006]` | Busca Federada & Mapa | `✅ IMPLEMENTADO` | `src/routes/_store.buscar.tsx`, `src/routes/_store.mapa.tsx` | Busca federada e mapa com cards inferiores. |
| `[REQ-007]` | Detalhes Ricos de Entidade | `✅ IMPLEMENTADO` | `src/routes/_store.produto.$slug.tsx`, `_store.classificados.$id.tsx` | Padrão Mobg com galeria, atributos e CTA lateral. |
| `[REQ-008]` | Carrinho & Checkout Atômico | `✅ IMPLEMENTADO` | `src/routes/_store.checkout.tsx`, `cart-sheet.tsx` | Carrinho por loja, RPC atômico e dinheiro em centavos. |
| `[REQ-009]` | Central do Cliente / Conta | `✅ IMPLEMENTADO` | `src/routes/_store.conta.*` | Pedidos com timeline de rastreio, ingressos e desapegos. |
| `[REQ-010]` | Modelo Universal de Oferta | `✅ IMPLEMENTADO` | `src/services/catalog.functions.ts`, `domain.ts` | Blueprints por nicho (Moda, Comida, Beleza, Serviços). |
| `[REQ-011]` | Edição em 4 Profundidades | `✅ IMPLEMENTADO` | `src/routes/workspace.catalogo.produtos.index.tsx` | Célula inline, linha, painel lateral e página completa. |
| `[REQ-012]` | Grupos de Complementos | `✅ IMPLEMENTADO` | `src/routes/workspace.catalogo.atributos.index.tsx` | Regras de adicionais, limites min/max e franquia incluída. |
| `[REQ-013]` | Cadastro com Truthful Preview | `✅ IMPLEMENTADO` | `src/routes/workspace.catalogo.produtos.$id.tsx` | Form em seções e mockup smartphone fiel em tempo real. |
| `[REQ-014]` | Almoxarifado & Estoque | `✅ IMPLEMENTADO` | `src/routes/workspace.estoque.index.tsx` | Ajuste rápido com motivo e alerta de ruptura de gôndola. |
| `[REQ-015]` | Gestor Kanban / KDS | `✅ IMPLEMENTADO` | `src/routes/workspace.pedidos.index.tsx` | Kanban fullscreen com alerta sonoro e transição realtime. |
| `[REQ-016]` | PDV Frente de Caixa | `✅ IMPLEMENTADO` | `src/routes/workspace.pdv.index.tsx` | Caixa rápido com leitor EAN, comandas e cálculo de troco. |
| `[REQ-017]` | Impressão Térmica de Pedidos | `✅ IMPLEMENTADO` | `src/services/printer.functions.ts` | Spooling de impressão e roteamento por estação. |
| `[REQ-018]` | CRM de Clientes | `✅ IMPLEMENTADO` | `src/routes/workspace.clientes.index.tsx` | Histórico de compras, LTV e segmentação de clientes. |
| `[REQ-019]` | Grade de Agendamentos | `✅ IMPLEMENTADO` | `src/routes/workspace.agenda.index.tsx` | Grade multiprofissional com prevenção de overbooking. |
| `[REQ-020]` | Vertical de Beleza & Split | `✅ IMPLEMENTADO` | `src/routes/workspace.agenda.servicos.tsx`, `financeiro.functions.ts` | Prontuário, baixa de insumos e comissões automáticas. |
| `[REQ-021]` | Pacotes de Sessões & Passes | `✅ IMPLEMENTADO` | `src/routes/workspace.pacotes.index.tsx` | Saldo de créditos e abatimento automático na comanda. |
| `[REQ-022]` | Frota Própria & Despacho | `✅ IMPLEMENTADO` | `src/routes/workspace.pedidos.frota.tsx` | Atribuição de corridas e prestação de contas de diárias. |
| `[REQ-023]` | Logística Sob Demanda | `✅ IMPLEMENTADO` | `src/services/mobility.functions.ts` | Cotação e chamada de motoboy para pedidos externos. |
| `[REQ-024]` | Configuração Espacial Frete | `✅ IMPLEMENTADO` | `src/routes/workspace.configuracoes.index.tsx` | Mapa interativo com raio e tabela de bairros/taxas. |
| `[REQ-025]` | App do Entregador Mobile | `✅ IMPLEMENTADO` | `src/routes/_store.mobilidade.tsx` | Oferta de corrida, navegação GPS e prova de entrega. |
| `[REQ-026]` | Banners & Hotpages | `✅ IMPLEMENTADO` | `src/routes/workspace.marketing.banners.index.tsx` | Upload 21:9/16:9, programação temporal e links internos. |
| `[REQ-027]` | Estúdio Editorial & Biolink | `✅ IMPLEMENTADO` | `src/routes/workspace.estudio.index.tsx`, `workspace.cms.bio.tsx` | Builder visual drag-and-drop e renderizador de biolinks. |
| `[REQ-028]` | Monetização & Cupons | `✅ IMPLEMENTADO` | `src/routes/workspace.marketing.promocoes.tsx` | Cupons com regras de pedido mínimo e expiração. |
| `[REQ-029]` | Painel Financeiro & Caixa | `✅ IMPLEMENTADO` | `src/routes/workspace.financeiro.caixa.index.tsx` | Extrato reconciliado, sangrias e faturas auditáveis. |
| `[REQ-030]` | Admin Master de Integrações | `✅ IMPLEMENTADO` | `src/routes/admin-master.integracoes.tsx` | 6 abas de APIs com mascaramento seguro de segredos. |
| `[REQ-031]` | Auditoria Anti-Duplicação | `✅ IMPLEMENTADO` | `src/services/integrations.functions.ts` | Serviços de integrações unificados e canônicos. |
| `[REQ-032]` | RLS & Isolamento Multi-Tenant | `✅ IMPLEMENTADO` | `src/lib/server-access.ts`, Supabase Policies | Autorização por sessão obrigatória em 100% dos BFFs. |
| `[REQ-033]` | Action Drawer com Cards Grandes | `✅ IMPLEMENTADO` | `src/components/commerce/quick-create-modal.tsx` | Cards verticais com scroll horizontal e silêncio visual. |
| `[REQ-034]` | Correção da Rota de Ofertas | `✅ IMPLEMENTADO` | `master-hero-cards.tsx`, `hotpage.functions.ts` | Botão Ofertas roteando diretamente para `/ofertas`. |
| `[REQ-035]` | DynamicMediaChip Universal | `✅ IMPLEMENTADO` | `src/components/commerce/dynamic-media-chip.tsx` | Suporte a vídeo MP4, GIF, imagem, texturas e ícones. |
| `[REQ-036]` | Central Global de Gestão de Botões | `✅ IMPLEMENTADO` | `workspace.marketing.hotpages.tsx`, `docs/NAVIGATION_BUTTONS_SYSTEM.md` | Gestão de 25+ páginas com Live Preview em tempo real. |
| `[REQ-037]` | Remoção de Sidebar Residual no Workspace | `✅ IMPLEMENTADO` | `src/components/workspace/workspace-shell.tsx` | Eliminação do GlobalRail e isolamento limpo da interface operacional. |
| `[REQ-038]` | Guarda e Confirmação de Alternância de Contexto | `✅ IMPLEMENTADO` | `src/components/workspace/workspace-shell.tsx` | Modal explícito de confirmação para troca entre loja e perfil pessoal. |
| `[REQ-039]` | Mapas 100% Full Bleed (Mobilidade & Moments) | `✅ IMPLEMENTADO` | `_store.mobilidade.tsx`, `_store.mapa.tsx`, `app-shell.tsx` | Remoção de grids, margens e sidebars para mapas imersivos edge-to-edge. |
| `[REQ-040]` | Gavetas e Modais 100% Full-Screen no Mobile | `✅ IMPLEMENTADO` | `src/components/ui/sheet.tsx`, `src/components/commerce/cart-sheet.tsx` | Drawers ocupando 100dvh sem corte ou gap inferior no mobile. |
| `[REQ-041]` | Fotos dos Produtos no Carrinho Maiores & Botões Delicados | `✅ IMPLEMENTADO` | `src/components/commerce/cart-sheet.tsx` | Imagens expandidas (96-112px) com cantos squircle e seletores em pílula tátil. |
| `[REQ-042]` | Edição de Itens, Variações & Adicionais no Carrinho | `✅ IMPLEMENTADO` | `cart.functions.ts`, `cart-context.tsx`, `cart-item-edit-drawer.tsx` | Drawer de edição com recálculo dinâmico e persistência via updateCartItemOptions. |

---

## 🚀 4. PROTOCOLO DE EXECUÇÃO SEQUENCIAL & EVOLUÇÃO CONTÍNUA

Para qualquer nova demanda ou aprimoramento solicitado pelo usuário:
1. **Ativar o BigTech Board:** Consultar as 5 personas antes de qualquer código.
2. **Consultar o Inventário:** Cruzar a solicitação com os 42 Super Prompts deste documento.
3. **Executar a Completude Quádrupla:** Banco de Dados ➔ BFF Server Functions com Zod ➔ Componentes de Ação ➔ Superfície de Gestão no Workspace.
4. **Respeitar o Paradigma Clean:** Zero poluição na operação, sem botões cenográficos e sem mocks.
5. **Auditar e Validar em Runtime:** Compilar com `npm run build` (0 erros), deploy na Cloudflare e teste mobile com o subagente de navegação.
