# MASTER_AUDIT_REPORT.md — Relatório Canônico de Auditoria & Inventário de Módulos (Wider Platform)

> Documento oficial de inventário, auditoria de schemas, tabelas, contratos BFF, interfaces visuais e validação de bilateralidade.
> Nenhuma informação é fictícia ou conceitual — este documento reflete o código-fonte real e as migrações aplicadas no banco de dados Supabase.

---

## 📌 Sumário de Módulos Auditados

- [x] **Módulo 1:** Autenticação, Contas, Identidade Multi-Tenant & Governança LGPD
- [x] **Módulo 2:** Banners Globais, Vitrines por Nicho & Live Governance
- [x] **Módulo 3:** Hotpages, Destaques da Loja & Botões Contextuais
- [x] **Módulo 4:** Catálogo de Produtos, Variações & Matriz Multidimensional
- [x] **Módulo 5:** Estoque, Picking, Reservas Atômicas & Logística WMS
- [x] **Módulo 6:** Checkout Atômico ACID, Frete Real, Cupons & Precificação
- [x] **Módulo 7:** Frente de Caixa (PDV/POS), Turnos & Meios de Pagamento
- [x] **Módulo 8:** Despacho de Entregas, Frota & Motoboys
- [x] **Módulo 9:** Mural Social, Feed, Posts, Histórias & Comentários
- [x] **Módulo 10:** Classificados P2P, Negociações & Propostas
- [x] **Módulo 11:** Agendamentos, Serviços & Pacotes (Booking Engine)
- [x] **Módulo 12:** Turismo, Hospedagem, Passeios & Vouchers
- [x] **Módulo 13:** Empregos, Vagas & Recrutamento (ATS)
- [x] **Módulo 14:** Portal de Notícias, Patrocinadores & Telemetria
- [x] **Módulo 15:** Diretório Comercial & Guia de Empresas Locais
- [x] **Módulo 16:** Builder Visual de Experiências & CMS Atômico
- [x] **Módulo 17:** Governança Global, KYC, Auditoria Forense & Faturas Master

---

## 🔍 MÓDULO 1: AUTENTICAÇÃO, CONTAS, IDENTIDADE MULTI-TENANT & GOVERNANÇA LGPD

### 1. Camada de Dados
- `public.profiles`: Perfis sociais, avatars, bio, WhatsApp verificado e role platform_admin/master.
- `public.workspace_members`: Vínculos com lojas, permissões granulares (`owner`, `admin`, `manager`, `seller`, `finance`, `content`, `support`, `stock`).
- `public.legal_consent_logs`: Auditoria forense de consentimento aos Termos de Uso e Políticas de Privacidade.

### 2. Contratos BFF (`src/services/auth.functions.ts`)
- `getUserSession`, `signInWithPassword`, `signUpWithPassword`, `getProfile`, `_updateProfile`, `requestAccountDeletion`.

---

## 🔍 MÓDULO 2: BANNERS GLOBAIS, VITRINES POR NICHO & LIVE GOVERNANCE

### 1. Camada de Dados
- `public.banners`: Cobrindo os 25 nichos (`home`, `gastronomia`, `mercado`, `farmacia`, `bebidas`, `acougue`, `moda`, `eletronicos`, `pet`, `servicos`, `imoveis`, `construcao`, `casa`, `beleza`, `limpeza`, `livros`, `noticias`, `agenda`, `turismo`, `empregos`, `classificados`, `diretorio`, `mobilidade`, `ofertas`, `all`, `store`).
- Switches visuais: `show_title`, `show_description`, `show_overlay`, `show_badge`, `show_cta`.

### 2. Contratos BFF (`src/services/banner.functions.ts`)
- `listActiveBanners`, `createBanner`, `updateBanner`, `deleteBanner`.

---

## 🔍 MÓDULO 3: HOTPAGES, DESTAQUES DA LOJA & BOTÕES CONTEXTUAIS

### 1. Camada de Dados
- `public.hotpages`: Chips de navegação rápida com texturas (`dots`, `noise`, `grid`, `mesh`, `glass`), vídeo MP4 em loop e opacidade de overlay configurável.

### 2. Contratos BFF (`src/services/hotpage.functions.ts`)
- `listHotpages`, `createHotpage`, `updateHotpage`, `saveHotpage`, `deleteHotpage`.

---

## 🔍 MÓDULO 4: CATÁLOGO DE PRODUTOS, VARIAÇÕES & MATRIZ MULTIDIMENSIONAL

### 1. Camada de Dados
- `public.products`: Título, slug, marca, EAN, dimensões e peso logístico (`weight_kg`, `width_cm`, `height_cm`, `length_cm`), flag `show_stock_publicly` (opt-in de visibilidade de estoque na vitrine).
- `public.product_variants`: Matriz multidimensional com SKU, override de preço, estoque em mãos e suporte a backorder (`allow_backorder`, `backorder_lead_time_days`).
- Procedure Atômica `create_product_transaction_v1` e `batch_upsert_variant_matrix_v4`.

### 2. Contratos BFF (`src/services/admin-catalog.functions.ts` & `src/services/product.functions.ts`)
- `listAdminProducts`, `createProduct`, `updateProduct`, `getProductById`, `getProductBySlug` (`showStockPublicly`), `toggleProductStatus`, `duplicateProduct`.

---

## 🔍 MÓDULO 5: ESTOQUE, PICKING, RESERVAS ATÔMICAS & LOGÍSTICA WMS

### 1. Camada de Dados
- `public.stock_movements`: Kardex auditado de todas as entradas, saídas, vendas e perdas.
- Procedure Atômica `adjust_stock`.

### 2. Contratos BFF (`src/services/stock.functions.ts`)
- `getStockLevels`, `adjustStock`, `getStockMovements`.

---

## 🔍 MÓDULO 6: CHECKOUT ATÔMICO ACID, FRETE REAL, CUPONS & PRECIFICAÇÃO

### 1. Camada de Dados
- `public.orders`, `public.order_items`, `public.payments`.
- Stored Procedure `process_checkout_atomic` com bloqueio pessimista `FOR UPDATE` e chave de idempotência.

### 2. Contratos BFF (`src/services/checkout.functions.ts`)
- `processCheckout`, `getOrderByToken`.

---

## 🔍 MÓDULO 7: FRENTE DE CAIXA (PDV/POS), TURNOS & MEIOS DE PAGAMENTO

### 1. Camada de Dados
- `public.cash_registers`, `public.cash_register_entries`.
- Stored Procedure `process_pos_sale_transaction`.

### 2. Contratos BFF (`src/services/cash.functions.ts`)
- `getActiveRegister`, `openCashRegister`, `closeCashRegister`, `recordCashMovement`, `processPOSSale`.

---

## 🔍 MÓDULO 8: DESPACHO DE ENTREGAS, LOGÍSTICA DE FROTA & MOTOBOYS

### 1. Camada de Dados (Tabelas, Enums e RLS)
- **`public.couriers`** (`supabase/migrations/20260813110000_couriers_fleet_management.sql`):
  - `id` (UUID), `store_id` (UUID), `user_id` (UUID), `name` (TEXT), `phone` (TEXT), `cpf` (TEXT), `vehicle_type` (`motorcycle`, `bicycle`, `car`, `van`, `on_foot`), `vehicle_plate` (TEXT), `status` (`available`, `on_route`, `offline`, `suspended`), `default_fee_cents` (INTEGER), `notes` (TEXT).
- **`public.delivery_magic_links`**:
  - Link de despacho para entregadores avulsos com token seguro (`token`), expiração (`expires_at`), preenchimento de dados do motoboy e confirmação de entrega (`delivery_confirmed_at`).
- **`public.delivery_proofs`**:
  - Evidências fotográficas (`proof_type`: `photo_package`, `photo_recipient`, `photo_location`, `signature`), URL assinada no Storage e coordenadas GPS (`latitude`, `longitude`).
- **`public.mobility_price_tables`** (`20260815170000_mobility_and_logistics_ecosystem.sql`):
  - Tarifação dinâmica por km rodado (`per_km_cents`), minuto (`per_minute_cents`), tarifa base (`base_fare_cents`) e taxa mínima (`minimum_fare_cents`).

### 2. Contratos BFF (`src/services/dispatch.functions.ts` & `src/services/mobility.functions.ts`)
- `listDispatches`: Consulta os despachos da loja com status de entrega e localização.
- `createDispatch`: Registra novo despacho, gera token de tracking público e link mágico para o motoboy.
- `listLogisticsPriceTables` / `saveLogisticsPriceTable`: Gerenciamento das tarifas logísticas de entrega expressa.

### 3. Camada Visual & Telas Conectadas
- **Quadro de Despacho & Frota (`/workspace/pedidos/frota`)**: Quadro Kanban de pedidos para entrega, botão de novo despacho e tabela de preços por modalidade.
- **Tracking Público de Entrega (`/_store/entrega/$token`)**: Visão do cliente e do entregador com mapa e botão de confirmação com foto/GPS.

---

## 🔍 MÓDULO 9: MURAL SOCIAL, FEED, POSTS, HISTÓRIAS & COMENTÁRIOS

### 1. Camada de Dados (Tabelas e Interações Reais)
- **`public.posts`** (`20260811200000_social_feed_unified.sql`):
  - `id` (UUID), `store_id` (UUID), `profile_id` (UUID), `title` (TEXT), `content` (TEXT), `media_urls` (TEXT[]), `post_type` (`standard`, `moment`, `promotion`, `news`, `classified`, `deal`), `location_name` (TEXT), `tags` (TEXT[]), `likes_count` (INTEGER), `comments_count` (INTEGER).
- **`public.post_likes` & `public.post_media_likes`** (`20260825170000_post_media_interactions_and_comments.sql`):
  - Curtidas no post e curtidas individuais em fotos específicas do carrossel com integridade referencial.
- **`public.post_comments` & `public.post_comment_likes`**:
  - Comentários vinculados ao post ou a uma mídia específica (`media_url`), suporte a respostas encadeadas (`parent_id`) e curtidas em comentários.
- **`public.user_followers`** (`20260815150000_user_followers_and_real_follows.sql`):
  - Relacionamento de seguidores entre membros e lojas com timestamp real.

### 2. Contratos BFF (`src/services/social.functions.ts`)
- `getMuralFeed`: Feed unificado com paginação infinita (`cursor`), segmentação por abas (Pra Você, Seguindo, Momentos e Desapegos), enriquecido com contagem de likes e status `likedByMe`.
- `createPost`: Inserção atômica de posts com suporte a carrossel de fotos, tags e geolocalização.
- `togglePostLike` / `togglePostMediaLike`: Curtir/Descurtir com incremento no banco.
- `addPostComment` / `listPostComments`: Inserção e listagem de comentários e respostas.

### 3. Camada Visual & Telas Conectadas
- **Mural Social (`/_store/mural`)**: Feed estilo Threads/Instagram com Stories no topo (`StoryRail`), Composer inline e abas contextuais.
- **Perfil Público do Membro (`/_store/membro/$id`)**: Exibição dos posts do autor, contadores auditados e interações ao vivo.

---

## 🔍 MÓDULO 10: CLASSIFICADOS P2P, NEGOCIAÇÕES, PROPOSTAS & REPUTAÇÃO

### 1. Camada de Dados (Tabelas e RLS)
- **`public.classifieds`** (`20260810130000_classifieds_extended_schema.sql`):
  - `id` (UUID), `author_profile_id` (UUID), `title` (TEXT), `content` (TEXT), `price_cents` (BIGINT), `images` (TEXT[]), `contact_whatsapp` (TEXT), `location_text` (TEXT), `category` (`sale`, `trade`, `service`, `real_estate`, `vehicle`, `job_offer`, `donation`), `condition` (`new`, `used`, `refurbished`), `negotiable` (BOOLEAN), `status` (`active`, `paused`, `sold`, `archived`), `search_vector` (TSVECTOR para busca full-text).
- **`public.deals`** (`20260813210000_deals_negotiations_schema.sql`):
  - `id` (UUID), `classified_id` (UUID), `buyer_id` (UUID), `seller_id` (UUID), `status` (`negotiating`, `accepted`, `rejected`, `cancelled`, `completed`), `proposed_price_cents` (BIGINT), `deposit_cents` (BIGINT), `installments_count` (INTEGER), `deal_type` (`sale`, `rental`, `service`, `trade`), `terms` (TEXT).
- **`public.deal_events`**:
  - Histórico de mensagens e contrapropostas (`event_type`: `message`, `proposal`, `counter_proposal`, `accept`, `reject`, `cancel`, `contract_created`).

### 2. Contratos BFF (`src/services/classifieds.functions.ts` & `src/services/deals.functions.ts`)
- `getPublicClassifieds` / `getPublicClassifiedById`: Listagem e detalhes com busca full-text.
- `createClassified` / `updateClassified`: Criação e edição do anúncio pelo morador.
- `createDealProposal` / `sendDealMessage` / `acceptDeal`: Motor transacional de propostas e contrapropostas P2P.

### 3. Camada Visual & Telas Conectadas
- **Vitrine de Desapegos (`/_store/classificados`)**: Descoberta com filtros de categoria, condição e tipo de negócio.
- **Ficha do Anúncio & Proposta (`/_store/classificados/$id`)**: Visualizador de fotos, botão de WhatsApp e botão de Fazer Proposta.
- **Central de Negociações (`/_store/conta/negociacoes`)**: Chat transacional de negociação com aceitação de proposta.

---

## 🔍 MÓDULO 11: AGENDAMENTOS, SERVIÇOS, PACOTES & RECURSOS (BOOKING ENGINE)

### 1. Camada de Dados (Tabelas e Hierarquia de Agendas)
- **`public.booking_services`** (`0080_booking_appointments.sql` e `20260815200000_booking_categories_and_real_services.sql`):
  - `id` (UUID), `store_id` (UUID), `title` (TEXT), `description` (TEXT), `duration_minutes` (INTEGER), `price_cents` (INTEGER), `category` (TEXT), `gender_target` (TEXT), `status` (`active`, `archived`).
- **`public.booking_appointments`**:
  - `id` (UUID), `store_id` (UUID), `service_id` (UUID), `customer_id` (UUID), `guest_name` (TEXT), `guest_phone` (TEXT), `scheduled_at` (TIMESTAMPTZ), `status` (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`), `pass_id` (UUID), `check_in_at` (TIMESTAMPTZ).
- **`public.service_packages` & `public.customer_service_passes`** (`20260819100000_service_packages_and_multi_agenda.sql`):
  - Pacotes de sessões/créditos (ex: 10 aulas), validade em dias e ledger auditado (`service_pass_ledger`).

### 2. Contratos BFF (`src/services/booking.functions.ts`)
- `listBookingServices`: Serviços ativos com duração e preços em centavos.
- `getAvailableSlots`: Cálculo real de horários livres com base no horário de funcionamento (`WorkingHours`) e agendamentos existentes.
- `createAppointment`: Reserva do horário com vinculação a passe de créditos ou pagamento direto.
- `cancelAppointment` / `checkInAppointment`: Gestão do ciclo de vida do atendimento.

### 3. Camada Visual & Telas Conectadas
- **Portal de Agendamento (`/_store/agendar`)**: Calendário com seleção de data, slots de horário calculados e confirmação.
- **Agenda do Workspace (`/workspace/agenda`)**: Visão diária/semanal de compromissos para o estabelecimento/profissional.
- **Carteira de Pacotes (`/_store/conta/pacotes`)**: Controle de saldo de sessões do cliente com histórico de consumo.

---

## 🔍 MÓDULO 12: TURISMO, HOSPEDAGEM, PASSEIOS & VOUCHERS

### 1. Camada de Dados (Tabelas e Reservas Turísticas)
- **`public.tourism_experiences`** (`supabase/migrations/20260815190000_jobs_and_tourism_ecosystem.sql`):
  - `id` (UUID), `store_id` (UUID), `author_profile_id` (UUID), `title` (TEXT), `subtitle` (TEXT), `description` (TEXT), `category` (`passeios`, `hospedagens`, `gastronomia_turistica`, `aventura`, `agencias`, `cultura`), `location` (TEXT), `duration` (TEXT), `price_display` (TEXT), `price_cents` (BIGINT), `image_url` (TEXT), `gallery_urls` (TEXT[]), `provider_name` (TEXT), `contact_whatsapp` (TEXT), `rating` (NUMERIC), `included_items` (TEXT[]), `what_to_bring` (TEXT[]), `is_featured` (BOOLEAN), `status` (`active`, `inactive`, `draft`).
- **`public.tourism_inquiries`**:
  - `id` (UUID), `experience_id` (UUID), `profile_id` (UUID), `customer_name` (TEXT), `customer_email` (TEXT), `customer_phone` (TEXT), `desired_date` (DATE), `guests_count` (INTEGER), `message` (TEXT), `status` (`pending`, `contacted`, `confirmed`, `cancelled`).

### 2. Contratos BFF (`src/services/tourism.functions.ts`)
- `listPublicTourism`: Listagem com filtros por categoria (`passeios`, `hospedagens`, `aventura`), busca e destaques.
- `getTourismExperienceById`: Ficha técnica completa com galeria, itens inclusos e dados do operador.
- `createTourismInquiry` / `createTourismBookingWithVoucher`: Solicitação de reserva e emissão de voucher seguro.
- `createTourismExperience` / `updateTourismExperience`: Gestão da experiência pelo operador ou Admin Master.

### 3. Camada Visual & Telas Conectadas
- **Portal de Turismo (`/_store/turismo`)**: Hub com trilhos temáticos, atrações imperdíveis, hotéis e passeios da região.
- **Detalhes da Experiência & Voucher (`/_store/turismo/$slug`)**: Galeria de fotos, mapa, itinerário, botão de reserva e botão de WhatsApp direto.
- **Gestor no Workspace (`/workspace/turismo`)**: Painel do operador turístico para cadastro de roteiros e acompanhamento de reservas.

---

## 🔍 MÓDULO 13: EMPREGOS, VAGAS & RECRUTAMENTO (ATS)

### 1. Camada de Dados (Tabelas de Vagas e Candidaturas)
- **`public.jobs`** (`supabase/migrations/20260815190000_jobs_and_tourism_ecosystem.sql`):
  - `id` (UUID), `store_id` (UUID), `author_profile_id` (UUID), `title` (TEXT), `company_name` (TEXT), `company_logo_url` (TEXT), `category` (`clt`, `pj`, `estagio`, `tech`, `comercial`, `operacional`, `saude`, `outros`), `location` (TEXT), `workplace_type` (`Presencial`, `Híbrido`, `Remoto`), `contract_type` (`CLT`, `PJ`, `Estágio`, `Freelancer`, `Temporário`), `salary_display` (TEXT), `salary_min_cents` (BIGINT), `salary_max_cents` (BIGINT), `description` (TEXT), `requirements` (TEXT[]), `benefits` (TEXT[]), `contact_whatsapp` (TEXT), `contact_email` (TEXT), `is_featured` (BOOLEAN), `status` (`active`, `paused`, `closed`, `draft`).
- **`public.job_applications`**:
  - `id` (UUID), `job_id` (UUID REFERENCES jobs(id)), `candidate_profile_id` (UUID), `candidate_name` (TEXT), `candidate_email` (TEXT), `candidate_phone` (TEXT), `resume_url` (TEXT), `cover_letter` (TEXT), `status` (`pending`, `reviewed`, `shortlisted`, `rejected`, `hired`).

### 2. Contratos BFF (`src/services/jobs.functions.ts`)
- `listPublicJobs`: Listagem pública de vagas ativas com filtros por modalidade, categoria e tipo de contrato.
- `getJobById`: Detalhes da vaga com requisitos, benefícios e status de inscrição.
- `applyToJob`: Envio de candidatura com anexo de currículo e carta de apresentação.
- `createJob` / `updateJob` / `updateApplicationStatus`: Gestão da vaga e movimentação de candidatos no funil ATS pelo empregador.

### 3. Camada Visual & Telas Conectadas
- **Portal de Vagas (`/_store/empregos`)**: Feed de vagas da cidade com badges de regime (CLT/PJ/Remoto), faixa salarial e busca inteligente.
- **Ficha da Vaga & Candidatura (`/_store/empregos/$id`)**: Requisitos, benefícios da empresa e modal de envio de currículo com 1 clique.
- **Gestor de Recrutamento ATS (`/workspace/vagas`)**: Kanban do RH para triagem de candidatos (Pendente ➔ Em Análise ➔ Pré-Selecionado ➔ Contratado).

---

## 🔍 MÓDULO 14: PORTAL DE NOTÍCIAS, PATROCINADORES & TELEMETRIA

### 1. Camada de Dados (Tabelas e Telemetria de Audiência)
- **`public.news_articles`** (`supabase/migrations/20260815160000_news_portals_sponsors_and_telemetry.sql`):
  - `id` (UUID), `store_id` (UUID), `author_profile_id` (UUID), `title` (TEXT), `slug` (TEXT), `kicker` (TEXT — Chapéu editorial), `subtitle` (TEXT), `content_sections` (JSONB — Blocos modulares: parágrafos, citações, galerias, vídeos), `cover_media_url` (TEXT), `cover_media_type` (`image`, `video`, `gif`), `category` (TEXT), `tags` (TEXT[]), `reading_time_minutes` (INTEGER), `views_count` (INTEGER), `unique_views_count` (INTEGER), `status` (`draft`, `published`, `archived`), `published_at` (TIMESTAMPTZ).
- **`public.sponsors` & `public.sponsor_placements`**:
  - Patrocinadores com logo, banner, vídeo e URL de destino vinculados a posições editoriais (`news_top`, `news_in_article`, `news_footer`, `story_moment`, `portal_sidebar`, `global_feed`).
- **`public.ad_telemetry_events`**:
  - Telemetria com registro de impressões (`view_impression`), visualizações únicas (`view_unique`), tempo de leitura (`duration_seconds`), profundidade de rolagem (`scroll_percentage`) e cliques (`click`).
- **`public.news_comments` & `public.news_likes`**:
  - Comentários moderáveis e curtidas únicas por usuário.

### 2. Contratos BFF (`src/services/news.functions.ts`)
- `listPublicArticles`: Listagem de notícias publicadas com filtro de categoria e ordenação cronológica.
- `getPublicArticleBySlug`: Notícia completa com seções de conteúdo, patrocinadores vinculados e contagem de leitura.
- `recordNewsTelemetry`: Registro de telemetria antifraude para impressões e scroll depth.
- `createArticle` / `updateArticle` / `deleteArticle`: CRUD editorial completo para o Admin Master e lojistas.

### 3. Camada Visual & Telas Conectadas
- **Portal de Notícias (`/_store/noticias`)**: Grid moderno estilo zine editorial com manchete em destaque, mini-chapéus e banners de patrocinadores.
- **Artigo Completo (`/_store/noticias/$slug`)**: Leitura imersiva com tipografia refinada, galeria de imagens, inserção de patrocinadores entre os parágrafos e seção de comentários.
- **Gestor Editorial Master (`/admin-master/noticias`)**: Painel de criação e edição com seletor de blocos de conteúdo e vinculação de cotas de patrocínio.

---

## 🔍 MÓDULO 15: DIRETÓRIO COMERCIAL & GUIA DE EMPRESAS LOCAIS

### 1. Camada de Dados (Tabelas e Orçamentos)
- **`public.directory_listings`** (`supabase/migrations/20260815210000_directory_full_ecosystem.sql`):
  - `id` (UUID), `store_id` (UUID NULL), `author_profile_id` (UUID), `business_name` (TEXT), `category` (TEXT), `description` (TEXT), `specialties` (TEXT[] — Especialidades e serviços prestados), `address` (TEXT), `latitude` (NUMERIC), `longitude` (NUMERIC), `contact_phone` (TEXT), `contact_whatsapp` (TEXT), `contact_email` (TEXT), `website_url` (TEXT), `working_hours` (JSONB/TEXT), `is_verified` (BOOLEAN), `rating` (NUMERIC), `reviews_count` (INTEGER), `avatar_url` (TEXT), `banner_url` (TEXT), `status` (`active`, `inactive`).
- **`public.directory_inquiries`**:
  - `id` (UUID), `listing_id` (UUID REFERENCES directory_listings(id)), `profile_id` (UUID), `customer_name` (TEXT), `customer_email` (TEXT), `customer_phone` (TEXT), `service_needed` (TEXT), `message` (TEXT), `status` (`pending`, `contacted`, `quoted`, `completed`, `cancelled`).

### 2. Contratos BFF (`src/services/directory.functions.ts`)
- `getPublicDirectory`: Consulta empresas locais verificadas com filtros por nicho (`saude`, `reformas`, `auto`, `beleza`, `servicos`) e geolocalização.
- `getPublicDirectoryById`: Ficha completa da empresa com especialidades, horário de funcionamento e avaliações.
- `createDirectoryInquiry`: Envio de solicitação de orçamento pelo morador.
- `createDirectoryListing` / `updateDirectoryListing`: Cadastro e edição do negócio pelo profissional ou Admin Master.

### 3. Camada Visual & Telas Conectadas
- **Guia Comercial da Cidade (`/_store/diretorio`)**: Diretório visual com cards ricos, badge de verificado, avaliação por estrelas e especialidades em tags.
- **Ficha da Empresa (`/_store/diretorio/$slug`)**: Banner, logo, botão de WhatsApp direto, mapa de localização e formulário de Solicitar Orçamento.
- **Gestor no Workspace (`/workspace/diretorio`)**: Painel para o prestador de serviços gerenciar sua presença comercial e responder a orçamentos recebidos.

---

## 🔍 MÓDULO 16: BUILDER VISUAL DE EXPERIÊNCIAS & CMS ATÔMICO

### 1. Camada de Dados (Árvore de Nós Hierárquica e Versionamento Atômico)
- **`public.experience_documents`** (`supabase/migrations/0048_builder_platform_core.sql`):
  - `id` (UUID), `store_id` (UUID), `document_type` (`storefront`, `biolink`, `pwa`, `campaign`), `owner_id` (UUID), `slug` (TEXT), `title` (TEXT), `seo_metadata` (JSONB), `is_active` (BOOLEAN).
- **`public.experience_versions`**:
  - `id` (UUID), `document_id` (UUID), `version_number` (INTEGER), `status` (`draft`, `published`, `archived`), `commit_message` (TEXT), `created_by` (UUID).
- **`public.experience_nodes`**:
  - `id` (UUID), `version_id` (UUID), `parent_id` (UUID — Auto-relacionamento de árvore DOM), `node_type` (`section`, `container`, `element`, `composition`), `block_type` (Hero, Carrossel, Bento Grid, Rich Text, Bio Links, Vitrine de Produtos), `content` (JSONB), `design_tokens` (JSONB), `layout_rules` (JSONB), `responsive_overrides` (JSONB), `data_bindings` (JSONB — Vinculação dinâmica com produtos, coleções ou posts), `action_bindings` (JSONB), `sort_order` (INTEGER), `is_hidden` (BOOLEAN).

### 2. Contratos BFF (`src/services/builder.functions.ts`)
- `getPublicExperienceDocumentBySlug`: Hidratação atômica da árvore de nós da versão publicada para o storefront público.
- `getExperienceDocumentForEditor`: Carregamento do documento e da versão draft para o Workspace Builder.
- `saveExperienceTreeDraft`: Gravação em lote da árvore de nós com reconciliação transacional.
- `publishExperienceVersion`: Publicação atômica que ativa a versão e arquiva a anterior.

### 3. Camada Visual & Telas Conectadas
- **Editor Visual Drag & Drop (`/workspace/builder/$id`)**: Painel esquerdo com Árvore de Camadas, Canvas central com renderização ao vivo e Painel direito (Inspector de Design Tokens, Espaçamentos e Bindings).
- **Renderizador de Experiências (`ExperienceRenderer.tsx` / `/_store/p/$slug`)**: Motor de renderização que transforma os nós JSON em componentes React otimizados sem layout shift.

---

## 🔍 MÓDULO 17: GOVERNANÇA GLOBAL MASTER, KYC, AUDITORIA FORENSE & FATURAS

### 1. Camada de Dados (Tabelas de Compliance e Controle Master)
- **`public.platform_invoices`** (`supabase/migrations/20260816000000_master_governance_and_compliance.sql`):
  - `id` (UUID), `store_id` (UUID), `amount_cents` (INTEGER), `status` (`pending`, `paid`, `overdue`, `cancelled`), `plan_name` (TEXT), `due_date` (DATE), `paid_at` (TIMESTAMPTZ).
- **`public.identity_kyc_verifications`**:
  - `id` (UUID), `user_id` (UUID), `full_name` (TEXT), `document_type` (`cnh`, `rg`, `passport`, `cnpj`), `document_number` (TEXT), `selfie_url` (TEXT), `document_front_url` (TEXT), `liveness_video_url` (TEXT), `status` (`pending`, `under_review`, `approved`, `rejected`), `reviewed_by` (UUID).
- **`public.user_moderation_sanctions` & `public.store_moderation_suspensions`**:
  - Sanções graduais (`warning`, `mute_comments`, `block_posts`, `block_classifieds`, `block_commerce`, `ban_permanent`) e congelamento de lojas (`is_checkout_blocked`, `is_catalog_hidden`, `is_payout_frozen`).
- **`public.forensic_audit_events`**:
  - Registro forense imutável com `actor_id`, `target_entity_type`, `action`, `payload_snapshot`, `ip_address` e `checksum_sha256`.

### 2. Contratos BFF (`src/services/master.functions.ts` & `src/services/legal.functions.ts`)
- `getPlatformMetrics`: Dashboard executivo com receita total, receita pendente, total de lojas ativas, total de usuários e solicitações KYC pendentes.
- `getPlatformStoresList` / `toggleStoreStatus`: Ativação, suspensão e mudança de planos de lojas.
- `getPlatformUsersList` / `setUserRole` / `applyUserSanction`: Gestão de permissões globais e sanções.
- `getForensicAuditLogs`: Extrato forense para auditoria de segurança e litígios.

### 3. Camada Visual & Telas Conectadas
- **Dashboard Master (`/admin-master`)**: Visão consolidada de KPIs da cidade e atalhos de governança.
- **Central de Lojas Master (`/admin-master/lojas`)**: Gestão de todas as empresas cadastradas com switch de status e plano.
- **Trilha Forense (`/admin-master/auditoria`)**: Extrato de eventos com payload JSON e verificação de integridade criptográfica.
- **Gestor Legal & LGPD (`/admin-master/legal`)**: Central de versionamento de Termos de Uso e consentimento de moradores.
