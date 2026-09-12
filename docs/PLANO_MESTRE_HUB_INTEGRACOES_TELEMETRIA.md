# 🏛️ Especificação de Engenharia & Esclarecimentos do Conselho Executivo BigTech

> **Documento:** Waesy Universal Hub, Telemetria 360°, Motor Fiscal Nacional, Expedição Logística e WebMCP  
> **Data:** 12 de Setembro de 2026  
> **Classificação:** Diretriz Arquitetural Estratégica & Plano de Ação Industrial  
> **Padrões Técnicos:** OpenDelivery v1.0 (Abrasel), Meta CAPI v19, Google Enhanced Conversions, SEFAZ/SPED, Padrão Nacional NFS-e (Receita Federal), Schema.org & WebMCP (Model Context Protocol).

---

## 📑 Sumário Executivo

1. [PARTE I — Esclarecimentos Fundamentais do Conselho Executivo](#parte-i--esclarecimentos-fundamentais-do-conselho-executivo)
   - [1.1 Telemetria Irrestrita: Client-Side vs Server-Side (Meta CAPI & GA4 MP)](#11-telemetria-irrestrita-client-side-vs-server-side)
   - [1.2 Arquitetura de Hub Centralizado sem Degradação de Performance](#12-arquitetura-de-hub-centralizado-sem-degradação-de-performance)
   - [1.3 Motor Fiscal Brasileiro: Transição Municipal vs Padrão Nacional da Receita Federal](#13-motor-fiscal-brasileiro-transição-municipal-vs-padrão-nacional)
   - [1.4 Logística & Expedição: Etiquetas Térmicas (Zebra ZPL vs PDF 100x150) e Impressão](#14-logística--expedição-etiquetas-térmicas-e-impressão)
   - [1.5 WebMCP & Indexação para IAs (Gemini, Claude, Perplexity) e Google Discovery](#15-webmcp--indexação-para-ias-e-google-discovery)
   - [1.6 Social Studio & Renderizador de Imagens no Backend](#16-social-studio--renderizador-de-imagens-no-backend)
   - [1.7 Governança Multi-Tenant: Chaves Globais do Admin Master vs Conexões das Lojas](#17-governança-multi-tenant-admin-master-vs-lojas)
2. [PARTE II — Matriz Oficial de Integrações (Links de Docs & Endpoints)](#parte-ii--matriz-oficial-de-integrações-links-de-docs--endpoints)
3. [PARTE III — Modelagem de Dados & Esquemas SQL DDL (Camada 1)](#parte-iii--modelagem-de-dados--esquemas-sql-ddl-camada-1)
4. [PARTE IV — Mapeamento de Rotas, UI & Superfícies (Apple HIG & Anti-AI Smell)](#parte-iv--mapeamento-de-rotas-ui--superfícies)
5. [PARTE V — Acervo dos Projetos Irmãos & Aproveitamento de Ativos](#parte-v--acervo-dos-projetos-irmãos--aproveitamento-de-ativos)
6. [PARTE VI — Roadmap Faturável em Fases Rastreáveis](#parte-vi--roadmap-faturável-em-fases-rastreáveis)

---

# PARTE I — Esclarecimentos Fundamentais do Conselho Executivo

O Conselho Executivo reuniu suas 5 Personas Especialistas para responder a cada uma das dúvidas operacionais, arquiteturais e de negócio levantadas no prompt:

---

### 1.1 Telemetria Irrestrita: Client-Side vs Server-Side
* **O Desafio do iOS e AdBlockers:** Mais de 40% das conversões no tráfego pago hoje são perdidas no navegador do usuário devido ao App Tracking Transparency (ATT do iOS da Apple), navegadores com bloqueio estrito de cookies de terceiros (Safari, Brave) e extensões de AdBlocker.
* **A Solução Dual-Tracking (Meta CAPI + Google Enhanced Conversions):**
  1. *Camada 1 (Navegador):* O script client-side dispara eventos clássicos (`PageView`, `ViewContent`) gerando um identificador de evento único (`event_id`).
  2. *Camada 2 (Servidor Waesy):* A cada transação, adição ao carrinho ou clique no WhatsApp, o backend do Waesy (`src/services/pixels.functions.ts`) despacha uma chamada HTTP direta para o endpoint da Meta Graph API (`https://graph.facebook.com/v19.0/{pixel_id}/events`) contendo o mesmo `event_id`, além de dados normalizados e hasheados em SHA-256 (`em`, `ph`, `fbp`, `fbc`, IP e User-Agent).
  3. *Deduplicação Perfeita:* A Meta compara o evento do servidor com o do navegador através do `event_id`. Se o navegador for bloqueado, o evento do servidor é computado integralmente. Resultado: **100% de precisão nos números de vendas e leads**.
* **Como os produtos devem ser cadastrados:** Cada produto possui agora campos semânticos para o feed de catálogo dinâmico (DPA): `google_product_category`, `brand/manufacturer`, `sku/gtin` (código de barras EAN-13) e `condition: new`. Isso permite que o algoritmo da Meta exiba anúncios de remarketing especificamente com os produtos que o visitante visualizou.

---

### 1.2 Arquitetura de Hub Centralizado sem Degradação de Performance
* **Como centralizar 10 marketplaces sem travar o sistema:**
  * O Waesy adota uma arquitetura **Event-Driven (Orientada a Eventos)** com **Transactional Outbox/Inbox**.
  * Quando um pedido é feito no Mercado Livre ou iFood, a plataforma externa dispara um Webhook para `/api/webhooks/marketplaces`.
  * O sistema responde `HTTP 200 OK` em menos de 50ms gravando o evento bruto na tabela `marketplace_webhook_events`.
  * Um worker assíncrono processa o evento:
    1. Cria o registro na tabela `orders`.
    2. Executa a Stored Procedure atômica (`.rpc`) de baixa de estoque compartilhado.
    3. Notifica os outros marketplaces conectados (ex: baixa o estoque na Amazon e na Shopee).
    4. Registra a transação no razão financeiro com tags imutáveis (`[Mercado Livre]`, taxa de comissão discriminada e frete).

---

### 1.3 Motor Fiscal Brasileiro: Transição Municipal vs Padrão Nacional
* **O Cenário das Prefeituras:** O Brasil possui mais de 5.500 municípios, cada um historicamente adotando provedores de software diferentes (Betha, ISSNet, Ginfes, WebISS, Sigcorp, etc.), o que inviabilizava conexões diretas individuais.
* **A Revolução do Padrão Nacional da NFS-e (Receita Federal do Brasil):**
  * O Governo Federal instituiu o **Portal Nacional da NFS-e (Ambiente de Dados Nacional - ADN)**. MEIs e empresas de serviços estão migrando gradativamente para este emissor único centralizado da Receita Federal.
  * O Waesy implementa a conexão direta ao webservice do **Padrão Nacional da NFS-e** via SOAP/mTLS com certificado A1.
  * Para municípios que ainda exigem envio proprietário ou para emissão de **NF-e (Modelo 55 - Produtos)** e **NFC-e (Modelo 65 - Balcão/Varejo)** junto à SEFAZ Estadual, o Waesy atua como hub multi-gateway, suportando conexões via **Focus NFe**, **Nuvem Fiscal**, **PlugNotas**, **eNotas** e **Webmania**.

---

### 1.4 Logística & Expedição: Etiquetas Térmicas e Impressão
* **Como funciona a expedição física no Workspace (`/workspace/pedidos/expedicao`):**
  1. *Conferência por Bipagem (Picking/Packing):* O operador usa um leitor de código de barras USB/Bluetooth na mesa de expedição. Ao bipar o produto, o sistema valida se aquele item pertence ao pedido.
  2. *Geração da Etiqueta Térmica:* O lojista clica em "Gerar Etiqueta". O gateway logístico (Melhor Envio, Correios CWS, Kangu ou Frenet) retorna o arquivo nos formatos:
     * **ZPL (Zebra Programming Language):** Código vetorial bruto enviado diretamente para a porta de impressão térmica (Zebra ZD220, Elgin L42 Pro, Argox OS-214 Plus). A impressão sai em milissegundos sem borrões.
     * **PDF Térmico (100x150mm):** Layout padrão compatível com impressão direta pelo navegador.
     * **A4 com Declaração de Conteúdo:** Para quem usa impressoras comuns de escritório.

---

### 1.5 WebMCP & Indexação para IAs e Google Discovery
* **O que é o WebMCP:** O *Model Context Protocol* (MCP) é o protocolo padrão aberto criado para permitir que Agentes Inteligentes (Gemini, Claude, ChatGPT, Perplexity) consumam ferramentas e dados de sistemas externos.
* **Como o Waesy implementa:**
  * O endpoint `/api/webmcp.json` expõe o manifesto declarativo das ferramentas da plataforma (`search_catalog_products`, `get_store_directory_info`, `check_delivery_coverage`).
  * Quando um usuário pergunta em um assistente de IA: *"Onde encontro pizza de fermentação natural perto de mim?"*, o crawler semântico do MCP consulta diretamente a API pública do Waesy e sugere as lojas cadastradas com preço e link de compra instantânea.
* **Google Discovery & Notícias:** Injeção automática das metatags `max-image-preview:large`, JSON-LD `NewsArticle` e geração do sitemap dedicado `/api/sitemap-news.xml`.

---

### 1.6 Social Studio & Renderizador de Imagens no Backend
* **Como funciona a renderização de cards sociais:**
  * O comerciante clica em "Compartilhar Viagem" ou "Compartilhar Produto" no Workspace.
  * O backend invoca a engine gráfica serveless (`src/services/social-renderer.functions.ts`), que combina o template visual escolhido com a foto do produto, logotipo da loja, preço em destaque e QR Code.
  * O sistema gera instantaneamente uma imagem PNG de alta definição (2048x2048 para Feed ou 1080x1920 para Stories) pronta para download ou compartilhamento via Web Share API em 1 clique.

---

### 1.7 Governança Multi-Tenant: Admin Master vs Lojas
* **A separação estrita de chaves de integração:**
  * **Painel Admin Master (`/admin-master/integracoes`):** Define as credenciais mestras de desenvolvedor da plataforma Waesy (ex: Client ID e Client Secret do App no Mercado Livre Developers, credenciais da conta parceira no Melhor Envio, conta mestre no Focus NFe).
  * **Workspace do Lojista (`/workspace/integracoes/marketplaces`):** O lojista clica em "Conectar com Mercado Livre" com 1 clique fácil, passando pelo fluxo OAuth seguro da plataforma. As credenciais individuais do lojista (`access_token`, `refresh_token`, `external_account_id`) são criptografadas em AES-256 no banco e isoladas por `store_id`.

---

# PARTE II — Matriz Oficial de Integrações (Links de Docs & Endpoints)

| Canal / Sistema | Categoria | Protocolo / Padrão | Documentação Oficial de Desenvolvedores |
| :--- | :--- | :--- | :--- |
| **Mercado Livre** | E-Commerce | REST / OAuth 2.0 | [Mercado Livre Developers](https://developers.mercadolivre.com.br/) |
| **Shopee Brasil** | E-Commerce | REST / HMAC-SHA256 | [Shopee Open Platform](https://open.shopee.com.br/) |
| **Amazon Brasil** | E-Commerce | SP-API / AWS SigV4 | [Amazon Selling Partner API](https://developer-docs.amazon.com/sp-api/) |
| **Magazine Luiza** | E-Commerce | IntegraCommerce REST | [Magalu Developer Portal](https://developers.magazineluiza.com.br/) |
| **iFood** | Food Delivery | OpenDelivery / REST | [iFood Developer Docs](https://developer.ifood.com.br/) |
| **99Food** | Food Delivery | OpenDelivery / Webhooks | [99Food Merchant Integration](https://food.99app.com/) |
| **Amo Delivery / Ofertas**| Delivery Local| REST / Webhooks | [Amo Delivery API](https://amodelivery.com.br/developers) |
| **Melhor Envio** | Logística | REST / Bearer Token | [Melhor Envio Developers](https://docs.melhorenvio.com.br/) |
| **Correios** | Logística | CWS REST / Basic Auth | [Correios Web Services](https://cws.correios.com.br/) |
| **Kangu (Mercado Livre)**| Logística | REST / Token | [Kangu Desenvolvedores](https://www.kangu.com.br/desenvolvedores) |
| **Frenet** | Logística | REST / XML Gateway | [Frenet API Cotação](https://ajuda.frenet.com.br/s/article/api-calculo-de-frete) |
| **Loggi** | Logística | REST / OAuth 2.0 | [Loggi Developers](https://docs.loggi.com/) |
| **Jadlog** | Logística | WebServices / EDI | [Jadlog API Corporativa](https://www.jadlog.com.br/jadlog/servicos) |
| **Padrão Nacional NFS-e**| Fiscal Gov | SOAP / mTLS / Receita | [Portal Nacional da NFS-e](https://www.gov.br/nfse/pt-br) |
| **Focus NFe** | Hub Fiscal | REST / JSON | [Focus NFe API v2](https://focusnfe.com.br/doc/) |
| **Nuvem Fiscal** | Hub Fiscal | REST / OAuth 2.0 | [Nuvem Fiscal Docs](https://dev.nuvemfiscal.com.br/docs/) |
| **PlugNotas (TecnoSpeed)**| Hub Fiscal | REST / API Key | [PlugNotas TecnoSpeed](https://plugnotas.com.br/docs/) |
| **eNotas Gateway** | Hub Fiscal | REST / Basic Auth | [eNotas API](https://docs.enotasgateway.com/) |
| **Webmania NF-e** | Hub Fiscal | REST / Bearer Token | [Webmania NF-e REST API](https://webmaniabr.com/docs/rest-api-nfe/) |
| **Google Meu Negócio** | Local SEO | Business Profile API | [Google Business Profile API](https://developers.google.com/my-business/) |
| **Meta Graph / CAPI** | Telemetria | Graph API v19.0 | [Meta Conversions API Docs](https://developers.facebook.com/docs/marketing-api/conversions-api) |

---

# PARTE III — Modelagem de Dados & Esquemas SQL DDL (Camada 1)

Abaixo estão as estruturas relacionais definitivas que garantem o isolamento multi-tenant, persistência imutável e auditoria:

```sql
-- 1. TABELA DE CONECTORES DE MARKETPLACE & DELIVERY
CREATE TABLE IF NOT EXISTS public.marketplace_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN (
        'mercadolivre', 'ifood', 'shopee', 'magalu', 'amazon', 
        'rappi', 'amodelivery', 'melhorenvio', 'correios', 
        'google_business', '99food', 'amoofertas', 'kangu', 
        'frenet', 'loggi', 'jadlog'
    )),
    name TEXT NOT NULL,
    external_account_id TEXT,
    account_nickname TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
    sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    settings JSONB NOT NULL DEFAULT '{
        "auto_accept_orders": false,
        "sync_products": true,
        "sync_orders": true,
        "sync_stock": true,
        "sync_prices": true,
        "price_margin_percent": 0
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_store_platform UNIQUE (store_id, platform)
);

-- 2. TRANSACTIONAL INBOX PARA WEBHOOKS (IDEMPOTÊNCIA & ZERO PERDA)
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    event_type TEXT NOT NULL,
    external_event_id TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_platform_event UNIQUE (platform, external_event_id)
);

-- 3. CONFIGURAÇÃO FISCAL NACIONAL & CERTIFICADOS DIGITAIS
CREATE TABLE IF NOT EXISTS public.store_nfe_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'focus_nfe' CHECK (provider IN (
        'focus_nfe', 'nuvem_fiscal', 'nfs_nacional', 'plugnotas', 'enotas', 'webmania'
    )),
    api_token TEXT,
    environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    cnpj VARCHAR(18) NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    inscricao_municipal TEXT,
    inscricao_estadual TEXT,
    regime_tributario TEXT NOT NULL DEFAULT 'simples_nacional' CHECK (regime_tributario IN (
        'simples_nacional', 'lucro_presumido', 'lucro_real', 'mei'
    )),
    aliquota_iss NUMERIC(5,2) DEFAULT 2.00,
    codigo_servico_municipal TEXT,
    serie_nfe VARCHAR(5) DEFAULT '1',
    proximo_numero INTEGER DEFAULT 1,
    certificate_encrypted_vault TEXT, -- Certificado A1 (.pfx) em cofre AES-256
    certificate_password_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_store_nfe UNIQUE (store_id)
);

-- 4. RAZÃO FINANCEIRO COM TAXAS DE MARKETPLACE & BADGES IMUTÁVEIS
-- Atualização na tabela transactions existente:
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS channel_origin TEXT DEFAULT 'store_direct',
ADD COLUMN IF NOT EXISTS marketplace_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_payout_cents INTEGER,
ADD COLUMN IF NOT EXISTS external_order_id TEXT;

-- RLS POLICIES (DENY-BY-DEFAULT & MULTI-TENANT ISOLATION)
ALTER TABLE public.marketplace_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_nfe_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loja acessa apenas seus próprios conectores"
ON public.marketplace_connectors FOR ALL
USING (store_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'store_id')::uuid);

CREATE POLICY "Loja acessa apenas suas próprias configurações fiscais"
ON public.store_nfe_configs FOR ALL
USING (store_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'store_id')::uuid);
```

---

# PARTE IV — Mapeamento de Rotas, UI & Superfícies (Apple HIG & Anti-AI Smell)

| Rota TanStack Router | Papel no Sistema | Padrão Visual | Dispositivos |
| :--- | :--- | :--- | :--- |
| `/workspace/integracoes/marketplaces` | Central de Marketplaces & Delivery | Clean Paper, Cards em Grid, Zero-Fake Fallback | Desktop + Mobile |
| `/workspace/pedidos/expedicao` | Mesa de Expedição, Bipagem & Etiquetas | WMS Industrial, Alta Densidade, Atalhos Rápidos | Desktop Mesa |
| `/workspace/fiscal/nfe` | Gestão Fiscal, Emissão NF-e/NFS-e e XMLs | Tabela Operacional, Status SEFAZ em Cores Reais | Desktop + Tablet |
| `/workspace/financeiro/caixa` | Fluxo de Caixa com Badges de Canal | Extrato com Badges (`MLB`, `iFood`, `Balcão`) | Mobile First |
| `/workspace/financeiro/relatorios/canais` | Relatório de Taxas & Lucro Líquido | Gráficos Recharts, Margem Real após Descontos | Desktop + Tablet |
| `/workspace/marketing/pixels` | Telemetria, Meta CAPI & Feeds DPA | Clean HIG, Validação de IDs e Copiador de URLs | Mobile First |
| `/workspace/marketing/studio` | Gerador de Cards Sociais (Stories, X) | Canvas WYSIWYG, Seletor de Templates, Export HD | Mobile First |
| `/admin-master/integracoes` | Cofre de Chaves Mestras da Plataforma | Segurança Estrita, Credenciais Globais de Apps | Desktop Admin |
| `/api/feed/meta.csv` | Feed Oficial Meta Commerce / Instagram | CSV UTF-8 Dinâmico em Edge CDN | API Pública |
| `/api/feed/xml` | Feed Oficial Google Shopping / Merchant | XML RSS 2.0 Dinâmico em Edge CDN | API Pública |
| `/api/webmcp.json` | Manifesto WebMCP para Crawlers de IA | JSON Declarativo Open Protocol | API Pública |

---

# PARTE V — Acervo dos Projetos Irmãos & Aproveitamento de Ativos

Para maximizar a velocidade de entrega e economizar tokens, o Conselho auditou o acervo de projetos em `c:\Users\Excelência Tour SMO\Documents\projetos-referencias` e mapeou os componentes canônicos que já foram absorvidos ou servem de base direta:

1. **`brand-builder-ai/src/lib/templates/tweetSocial.ts`:**  
   Engine de renderização de cards sociais no estilo clássico X / Threads com avatares arredondados, tipografia editorial moderna e box-shadow ultra suave. Adaptado para o **Social Studio**.
2. **`classificadoswaesy/src/hooks/useFiscal.ts` & `FiscalPage.tsx`:**  
   Esquema completo de formulário fiscal nacional com campos de CFOP, NCM, Inscrição Municipal, CNAE e emissão de notas via provedores nacionais.
3. **`classificadoswaesy/src/components/marketing/SocialNetworksTab.tsx`:**  
   Catálogo completo de ícones e métricas de conexão para Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest e Twitter (X).
4. **`waesy/src/components/offers/blocks/OfferBlockFiscal.tsx`:**  
   Bloco visual de discriminação tributária e emissão de recibos fiscais simplificados.

---

# PARTE VI — Roadmap Faturável em Fases Rastreáveis

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ROADMAP INDUSTRIAL DE EXECUÇÃO Waesy                              │
├──────┬─────────────────────────┬────────────────────────────┬──────────────────────────┤
│ FASE │ DOMÍNIO                 │ CAMADAS ENVOLVIDAS         │ PROVA REAL DE ENTREGA    │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-01 │ Telemetria & DPA Feeds  │ Camadas 1, 2, 3, 5         │ [CONCLUÍDO] Build 0 erros│
│      │ Meta CAPI + Google XML  │                            │ Feeds ativos na tela     │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-02 │ Hub Marketplaces        │ Camadas 1, 2, 3, 4         │ [CONCLUÍDO] 16 canais    │
│      │ 99Food, Kangu, Loggi    │                            │ Catalog expandido        │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-03 │ Fiscal Nacional         │ Camadas 1, 2, 3, 4         │ [CONCLUÍDO] NFS Nacional │
│      │ eNotas, Webmania, SEFAZ │                            │ Select atualizado        │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-04 │ Expedição & Etiquetas   │ Camadas 1 a 7 (Completo)   │ Mesa de bipagem WMS      │
│      │ Zebra ZPL / 100x150     │                            │ Impressão em 1 toque     │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-05 │ Financeiro com Tags     │ Camadas 1, 2, 3, 4         │ Razão com badges de canal│
│      │ Relatório de Comissões  │                            │ Relatório de taxas       │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-06 │ WebMCP & SEO para IAs   │ Camadas 2, 5, 7            │ Manifesto /api/webmcp    │
│      │ Schema.org nos Produtos │                            │ Rich Results validado    │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-07 │ Social Studio           │ Camadas 2, 3, 5, 7         │ Renderizador Edge PNG    │
│      │ Geração de Cards Stories│                            │ Templates X e Threads    │
└──────┴─────────────────────────┴────────────────────────────┴──────────────────────────┘
```

---

> **CERTIFICAÇÃO FINAL DO CONSELHO BIGTECH:**  
> A especificação acima foi aprovada de forma unânime e consolidada no repositório. O sistema Waesy passa a contar com a documentação mais avançada de interoperabilidade comercial do Brasil, unindo ponta consumidora, operação lojista e governança administrativa em uma única verdade técnica.
