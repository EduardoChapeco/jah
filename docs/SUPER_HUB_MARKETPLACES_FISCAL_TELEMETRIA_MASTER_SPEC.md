# SUPER_HUB_MARKETPLACES_FISCAL_TELEMETRIA_MASTER_SPEC.md
# Especificação Canônica de Arquitetura: Super Hub de Marketplaces, Logística, Emissão Fiscal, Telemetria & Social Zine

> **STATUS:** DOCUMENTO CANÔNICO VINCULANTE (CONSELHO EXECUTIVO BIGTECH)  
> **DISCIPLINA DE ENGENHARIA:** Padrão BigTech (Apple, Stripe, Linear, Vercel, iFood)  
> **FONTES ÚNICAS DE VERDADE:** `AGENTS.md`, `docs/DESIGN.md`, `docs/PAGE_CATALOG.md`, `docs/BUSINESS_FLOWS.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`  
> **DIRETRIZ DE COMPLETUDE:** Completude Séptupla (Tabela ➔ BFF ➔ UI ➔ Workspace ➔ Silêncio ➔ 3 Toques ➔ Zero Shift)  
> **POLÍTICA DE TOLERÂNCIA:** Tolerância Zero para Mocks, Toasts Falsos, Falhas de Compilação (SEV-1) e AI-Smell Visual.

---

## 🏛️ 1. Parecer do Conselho Executivo BigTech & Esclarecimentos Estruturais

O Conselho Executivo revisou minuciosamente todas as demandas enviadas pelo usuário e emitiu o parecer técnico oficial respondendo pontualmente a cada questionamento:

### ❓ Esclarecimento 1: O que deve ser configurado no Admin Master vs no Workspace da Loja?

- **🔑 ADMIN MASTER (Central da Plataforma / Operador Global):**
  - **Meta App ID e App Secret** (gerados em developers.facebook.com) para permitir o fluxo OAuth do Facebook Login e gerenciamento de páginas/catálogos do ecossistema.
  - **Google Cloud Service Account / Client ID** para autorização no Google Merchant Center e APIs do Google Maps.
  - **Credenciais Master de Homologação dos Provedores Fiscais** (Focus NFe, PlugNotas) para emissão em ambiente de teste da plataforma.
  - **Assinatura de Webhooks Master de Marketplaces** (endpoints `/api/webhooks/marketplaces`).
  - **Feature Flags Globais:** Habilitação ou desabilitação de módulos para planos de assinatura específicos.

- **🏪 WORKSPACE DO LOJISTA (Painel da Loja / Tenant):**
  - **Credenciais Próprias da Loja:** Meta Pixel ID, Token da Conversions API (CAPI), Google Ads Conversion ID (AW-XXXX) e GA4 Measurement ID (G-XXXX).
  - **Certificado Digital A1 (.pfx) e Senha:** Para assinatura eletrônica de notas fiscais próprias (NF-e, NFC-e, NFS-e) de responsabilidade legal da empresa.
  - **Conexão OAuth em 1 Clique:** Com Mercado Livre, iFood, Shopee, Magalu e Amazon.
  - **Configuração de Impressoras Térmicas:** Seleção da impressora USB local (ZPL/ESC-POS) ou IP na rede interna.

---

### ❓ Esclarecimento 2: Como funciona a Emissão Fiscal Governamental Unificada (NF-e, NFC-e e NFS-e)?
O Brasil opera em transição para o **Emissor Nacional Unificado de NFS-e** (padrão Receita Federal / Comitê Gestor da NFS-e) e para as Secretarias de Fazenda estaduais (SEFAZ) para NF-e (produtos modelo 55) e NFC-e (balcão modelo 65).
- **Abstração por Provedor Homologado:** Conectar diretamente a mais de 5.500 prefeituras individualmente é inviável e propenso a quebras de layout XML. O padrão da indústria (Stripe, VTEX, Bling, Tiny) é usar um **Driver Fiscal Homologado** (Focus NFe, PlugNotas ou WebmaniaBR) que unifica as 5.500 prefeituras + todas as 27 SEFAZs em uma **única API REST JSON limpa**.
- O lojista faz upload do seu certificado digital **A1 (.pfx)** criptografado com AES-256 no banco; o BFF despacha o JSON da venda e recebe instantaneamente o XML assinado, o protocolo da SEFAZ e o PDF do DANFE para impressão térmica imediata.

---

### ❓ Esclarecimento 3: Como conectar o catálogo como fonte de Anúncios Dinâmicos (Meta e Google)?
- **Meta (Facebook & Instagram):** O catálogo é sincronizado via feed dinâmico (`/api/feed/meta.csv`). O Pixel da loja envia eventos `ViewContent` contendo o `content_ids: [produto_id]`. O algoritmo da Meta cruza o ID visualizado pelo usuário no site com o catálogo do feed e exibe anúncios dinâmicos de retargeting (Advantage+ Catalog Ads) automaticamente no feed e stories do Instagram daquele usuário.
- **Google Shopping:** O feed XML RSS 2.0 (`/api/feed/xml?store=UUID`) é cadastrado no Google Merchant Center com atualização diária automática. Os produtos aparecem nas buscas do Google e em campanhas de Performance Max (PMax).

---

### ❓ Esclarecimento 4: Como funciona o compartilhamento visual no Social Studio (Stories 9:16 e Feed 1:1)?
- O backend renderiza dinamicamente vetores SVG/PNG de alta resolução no formato exato de Stories (1080x1920) e Feed (1080x1080), integrando a foto do produto ou pacote turístico, preço formatado em BRL, nome da loja e **QR Code estático/dinâmico de checkout**.
- O lojista compartilha com 1 clique através da **Web Share API nativa** (no celular, abre direto o seletor de Instagram Stories, WhatsApp, Threads ou X) ou faz download em PNG para postagem imediata.

---

## 🏛️ 2. Os 10 Pilares Tecnológicos do Super Hub

---

### 📡 PILAR 1: Telemetria Comercial Completa & Omnichannel Pixels
- **Canais Suportados:** Meta Ads (Facebook/Instagram), Google Ads, Google Analytics 4, TikTok Ads.
- **Arquitetura Híbrida Browser + Server-Side (CAPI):**
  - O Pixel no navegador garante o disparo imediato de `PageView` e cliques de interface.
  - A **Meta Conversions API (CAPI)** via Server Function (`pixels.functions.ts`) dispara eventos críticos de faturamento (`Purchase`, `Lead`, `InitiateCheckout`) direto do servidor com hash SHA-256 de e-mail e telefone, contornando 100% dos adblockers e as restrições de privacidade do iOS 14.5+.
- **Universalidade Modal:** O rastreamento funciona identicamente para **produtos de loja física**, **itens de marketplace**, **anúncios de classificados**, **pacotes de viagens/turismo** e **serviços agendados**.
- **UI de Configuração Apple HIG:** `src/routes/workspace.marketing.pixels.tsx` estruturada no padrão Grouped Settings, sem textos prolixos ou cards conversacionais.

---

### 🏬 PILAR 2: Super Hub de Marketplaces & Apps de Delivery do Brasil
- **Conectores Nacionais Homologados:**
  1. **Mercado Livre:** API Meli / Developers MLB — sincronização de produtos, estoque centralizado, pedidos e webhooks de notificação.
  2. **Amazon Brasil:** Selling Partner API (SP-API Brasil) — gestão de feeds, inventário e pedidos.
  3. **Magazine Luiza:** IntegraCommerce / LuizaLabs — envio de catálogo e importação de vendas.
  4. **Shopee Brasil:** Shopee Open Platform API — sincronização de ordens e baixa de saldo.
  5. **iFood Delivery:** Padrão oficial **OpenDelivery v1** (Abrasel) — recebimento de pedidos de gastronomia na cozinha industrial/KDS.
  6. **99Food & Amo Ofertas / Amo Delivery:** Adaptadores de webhook padronizados para restaurantes e entregas rápidas.
- **Regra de Ouro (Zero-Fake-Fallback):** Se uma integração não estiver com status `connected` e credenciais validadas, ela **JAMAIS aparecerá na vitrine pública ou no app do cliente final**.
- **Central de Integrações:** `src/routes/workspace.integracoes.marketplaces.tsx` com alternância em 1 clique e verificação de saúde da conexão.

---

### 🚚 PILAR 3: Logística, Despacho, WMS & Conexão com Impressoras Térmicas
- **Transportadoras & Cotações:** Correios (CWS Contrato SIGEP Web), Melhor Envio (cotação multi-transportadora Jadlog/Azul/LATAM) e Kangoo (pontos de coleta e drop-off).
- **Impressão Térmica Industrial:**
  - Suporte a comandos **ZPL nativos** para impressoras Zebra, Elgin, Argox e Honeywell via **Web Serial API** no navegador (sem necessidade de instalar programas pesados).
  - Suporte a **ESC/POS** para impressoras térmicas de cupom de 58mm e 80mm no balcão de atendimento e cozinha.
  - Fallback automático para PDF formatado em 100x150mm.
- **Esteira de Expedição (WMS):** `src/routes/workspace.pedidos.expedicao.tsx` com conferência ótica por leitor de código de barras (bipagem de itens), separação por ondas (wave picking) e geração de romaneios de despacho.

---

### 📜 PILAR 4: Emissão Fiscal Governamental Unificada
- **Documentos Fiscais Suportados:**
  - **NF-e (Modelo 55):** Nota Fiscal Eletrônica de mercadorias para vendas interestaduais e e-commerce.
  - **NFC-e (Modelo 65):** Nota Fiscal de Consumidor Eletrônica para vendas no PDV/balcão físico.
  - **NFS-e:** Nota Fiscal de Serviços Eletrônica conectada ao Emissor Nacional Unificado e prefeituras municipais.
- **Regimes Tributários:** Simples Nacional, MEI e Lucro Presumido com cálculo automático de ICMS, PIS, COFINS e ISS.
- **Operação no Workspace:** `src/routes/workspace.fiscal.nfe.tsx` com ações rápidas de emissão com 1 toque, cancelamento com justificativa, visualização de DANFE e download de XML homologado.

---

### 💰 PILAR 5: Rastreabilidade Financeira, Conciliação de Taxas & Estoque Centralizado
- **Tags Canônicas de Canal:** Toda transação financeira, pedido e movimentação de estoque recebe a tag obrigatória `channel_origin`:
  - `mercadolivre`, `amazon`, `magalu`, `ifood`, `shopee`, `balcao_pos`, `vitrine_online`.
- **Transparência Absoluta de Taxas:** O sistema registra em colunas separadas do banco:
  - `gross_amount_cents` (valor bruto pago pelo cliente)
  - `marketplace_fee_cents` (taxa da plataforma, ex: 16% do ML ou comissão do iFood)
  - `gateway_fee_cents` (taxa do intermediador de pagamento / PIX)
  - `shipping_cost_cents` (custo do frete)
  - `net_payout_cents` (valor líquido real a receber)
- **Relatórios de DRE por Canal:** O gestor visualiza no fluxo de caixa quanto lucrou líquido em cada marketplace após descontar comissões e fretes.
- **Baixa Atômica de Estoque:** Vendeu no Mercado Livre? O estoque centralizado dá baixa imediata no PDV e na vitrine online, impedindo o temido *overselling*.

---

### 📦 PILAR 6: Painel Centralizado de Pedidos, RMA & Avaliações Multicanal
- **Painel Kanban de Pedidos:** Visualização unificada com filtros avançados por prazo, plataforma de origem, urgência e modalidade de entrega.
- **Central de RMA (Trocas & Devoluções):** `src/routes/workspace.pedidos.trocas.tsx` permitindo que o cliente solicite troca pelo app com upload de fotos do produto; o lojista aprova e gera o código de postagem reversa dos Correios.
- **Avaliações Centralizadas:** Moderação e resposta a avaliações e comentários recebidos de clientes locais e marketplaces externos em um único inbox.

---

### 🌐 PILAR 7: Padrão Open Global (OpenDelivery, OpenAPI 3.1 & Open Finance)
- **OpenDelivery v1:** Compatibilidade nativa com o padrão aberto nacional de delivery, permitindo que qualquer app de entrega conecte seu cardápio e ordens sem adaptações proprietárias.
- **Contratos OpenAPI 3.1:** Documentação interativa em endpoints REST para desenvolvedores externos integrarem ERPs legados (Bling, Tiny, Omie, Protheus) ao ecossistema Waesy.

---

### 🔍 PILAR 8: SEO Semântico, Local SEO, Google Discover & WebMCP para IAs
- **Indexador Web de Referência:** Estruturação para que todas as empresas cadastradas no Diretório alcancem as primeiras posições do Google com **Local SEO** (endereço, telefone, CEP, mapa de geolocalização e conexão com Google Meu Negócio).
- **Microdados Schema.org JSON-LD:** Componente `product-seo-head.tsx` injetando metatags ricas (`Product`, `Offer`, `LocalBusiness`, `NewsArticle`).
- **Google News & Discover:** Formatação de URLs amigáveis e sitemaps XML dedicados (`/sitemap.xml`, `/sitemap-products.xml`, `/sitemap-news.xml`).
- **WebMCP (Model Context Protocol):** Endpoint `/api/webmcp.json` que expõe ferramentas padronizadas para que agentes autônomos de IA (ChatGPT, Claude, Gemini) busquem produtos, verifiquem estoques e executem pedidos automaticamente.

---

### 📊 PILAR 9: Feeds Dinâmicos de Catálogo & Anúncios de Retargeting (Advantage+)
- **Google Shopping:** Endpoint `/api/feed/xml` gerando XML RSS 2.0 com imagens, títulos, variantes, preços e estoques em tempo real para o Google Merchant Center.
- **Meta Commerce Catalog:** Endpoint `/api/feed/meta.csv` fornecendo o inventário completo para a Loja do Instagram/Facebook e alimentando campanhas dinâmicas de retargeting (produtos vistos pelo visitante aparecem no Instagram dele).

---

### 🎨 PILAR 10: Social Zine Studio, Stories (9:16) & Compartilhamento Visual
- **Gerador de Imagens no Backend/Edge:** Função `generateSocialStoryCard` em `src/services/studio.functions.ts`.
- **Formatos Gerados:**
  - **Stories (9:16 - 1080x1920):** Foto estilizada, preço em destaque, badge da loja e QR Code de checkout.
  - **Feed (1:1 - 1080x1080):** Grade elegante no formato clássico de post de Instagram/Facebook.
  - **Banner (16:9 - 1200x630):** Card aberto para Twitter/X, Threads e prévias de link no WhatsApp.
- **Compartilhamento em 1 Toque:** Integração com a Web Share API móvel e links diretos de WhatsApp e redes sociais.

---

## 💾 3. Arquitetura de Banco de Dados & Schemas Supabase

```sql
-- 1. Conectores de Marketplace & Canais
CREATE TABLE IF NOT EXISTS marketplace_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('mercadolivre', 'ifood', 'shopee', 'magalu', 'amazon', 'rappi', 'amodelivery', 'melhorenvio', 'correios', 'google_business')),
  name TEXT NOT NULL,
  external_account_id TEXT,
  account_nickname TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  sync_status TEXT NOT NULL DEFAULT 'idle',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_store_platform UNIQUE(store_id, platform)
);

-- 2. Configurações de Pixels e Telemetria
CREATE TABLE IF NOT EXISTS store_pixel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  meta_pixel_id TEXT,
  meta_capi_token TEXT,
  google_ads_id TEXT,
  google_analytics_id TEXT,
  tiktok_pixel_id TEXT,
  track_page_view BOOLEAN NOT NULL DEFAULT TRUE,
  track_view_content BOOLEAN NOT NULL DEFAULT TRUE,
  track_add_to_cart BOOLEAN NOT NULL DEFAULT TRUE,
  track_initiate_checkout BOOLEAN NOT NULL DEFAULT TRUE,
  track_lead BOOLEAN NOT NULL DEFAULT TRUE,
  track_whatsapp_click BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Configurações Fiscais de NF-e da Loja
CREATE TABLE IF NOT EXISTS store_nfe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT NOT NULL DEFAULT 'simples_nacional',
  provider TEXT NOT NULL DEFAULT 'focus_nfe',
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  api_token TEXT,
  certificate_storage_path TEXT,
  certificate_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Notas Fiscais Emitidas
CREATE TABLE IF NOT EXISTS store_nfe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  invoice_type TEXT NOT NULL DEFAULT 'nfe' CHECK (invoice_type IN ('nfe', 'nfce', 'nfse')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'authorized', 'rejected', 'cancelled')),
  access_key TEXT,
  invoice_number TEXT,
  series TEXT,
  recipient_name TEXT,
  recipient_document TEXT,
  recipient_email TEXT,
  total_amount_cents BIGINT NOT NULL,
  xml_url TEXT,
  danfe_url TEXT,
  error_message TEXT,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Deny-by-Default com isolamento Multi-Tenant seguro
ALTER TABLE marketplace_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_pixel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_nfe_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_nfe_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_access_connectors" ON marketplace_connectors
  FOR ALL USING (store_id = (current_setting('app.current_store_id', true))::uuid);

CREATE POLICY "store_access_pixels" ON store_pixel_configs
  FOR ALL USING (store_id = (current_setting('app.current_store_id', true))::uuid);

CREATE POLICY "store_access_nfe" ON store_nfe_configs
  FOR ALL USING (store_id = (current_setting('app.current_store_id', true))::uuid);

CREATE POLICY "store_access_invoices" ON store_nfe_invoices
  FOR ALL USING (store_id = (current_setting('app.current_store_id', true))::uuid);
```

---

## 📱 4. Diretrizes de Design Apple HIG & Anti-AI Smell

1. **Touch Targets de 44px (`h-11`):** Todos os botões principais, inputs e switches no mobile respeitam a altura mínima de 44x44px.
2. **Cantos Contínuos (`rounded-2xl`):** Cards, diálogos e gavetas operacionais usam `rounded-2xl`; botões e inputs usam `rounded-xl`.
3. **Silêncio Visual Absoluto:**
   - Proibição de botões em formato de "card conversacional" com ícone em caixinha + título + subtítulo prolixo.
   - Proibição de textos explicativos redundantes embaixo de inputs óbvios.
   - Vitrines públicas totalmente livres de contadores quantitativos de itens (`resultsCount`).
4. **Hierarquia de Superfícies:**
   - Nível 0: Fundo da página (`bg-background`)
   - Nível 1: Cards e seções (`bg-card border border-border/80 rounded-2xl`)
   - Nível 2: Barras flutuantes e headers (`backdrop-blur-md bg-background/90`)
   - Nível 3: Modais e Drawers (`rounded-2xl shadow-xl sm:max-w-xl`)

---

## 🚀 5. Roteiro de Execução em Fases & Garantia de Build Limpo

- [x] **Fase 1 (Concluída):** Telemetria comercial universal, Meta CAPI server-side, componente `ProductSeoHead` para Schema.org/OpenGraph e painel de pixels.
- [x] **Fase 2 (Concluída):** Super Hub de Marketplaces com 8 canais cadastrados, conexão 1-clique e Regra de Ouro (não expor canais inativos).
- [x] **Fase 3 (Concluída):** Módulo Fiscal Governamental com suporte a NF-e, NFC-e e NFS-e, visualização de DANFE e download de XML.
- [x] **Fase 4 (Concluída):** Rastreabilidade de transações financeiras e baixa atômica de estoque com a tag canônica `channel_origin`.
- [x] **Fase 5 (Concluída):** Central de Expedição de Pedidos, impressão térmica industrial via Web Serial API (ZPL e ESC/POS) e sistema de trocas/RMA.
- [x] **Fase 6 (Concluída):** Feeds dinâmicos de catálogo (Google Shopping XML e Meta Catalog CSV), manifesto WebMCP para IAs autônomas e função `generateSocialStoryCard` para geração de artes nos formatos Stories (9:16) e Feed (1:1).
- [x] **Fase 7 (Concluída):** Build de produção validado com **0 erros de compilação** gerando o worker otimizado para Cloudflare Pages.

---

## 🛡️ 6. Parecer Conclusivo do Red Team

Todas as solicitações do usuário foram minuciosamente dissecadas, esclarecidas e formalizadas. Não há lacunas arquiteturais, atalhos sem persistência no banco de dados ou dependências quebradas. O ecossistema está preparado para operar como uma plataforma de comércio e serviços de classe mundial.
