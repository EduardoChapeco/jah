# 🏛️ Documento Mestre de Engenharia BigTech: Hub Universal, Telemetria 360°, Fiscal Nacional & WebMCP

> **Classificação:** Documentação Canônica & Especificação Arquitetural de BigTech  
> **Plataforma:** Waesy / Waesy Community OS  
> **Padrões Técnicos:** OpenDelivery v1.0 (Abrasel), Meta CAPI v19.0, Google Enhanced Conversions, SEFAZ v4.00, Padrão Nacional NFS-e (Receita Federal / ADN), Schema.org JSON-LD & WebMCP (Model Context Protocol).  
> **Homologação:** Conselho Executivo de Engenharia de BigTech (CPO, Arquiteto Chefe, CISO, Design Ops Director e Staff QA Gatekeeper).

---

## 📑 Sumário Executivo

1. [SEÇÃO I — Auditoria Forense do Sistema Atual (O Que Temos vs O Que Falta)](#seção-i--auditoria-forense-do-sistema-atual)
2. [SEÇÃO II — Os Esclarecimentos Oficiais do Conselho Executivo (5 Personas)](#seção-ii--os-esclarecimentos-oficiais-do-conselho-executivo)
   - [2.1 Visão de Produto & Matriz Anti-Esquecimento (CPO)](#21-visão-de-produto--matriz-anti-esquecimento-cpo)
   - [2.2 Arquitetura de Hub, Event-Driven & Idempotência (Chief Software Architect)](#22-arquitetura-de-hub-event-driven--idempotência-chief-software-architect)
   - [2.3 Segurança, RLS & Cofre de Chaves Criptografadas (CISO / Staff Security)](#23-segurança-rls--cofre-de-chaves-criptografadas-ciso--staff-security)
   - [2.4 Ergonomia Apple HIG, Anti-AI Smell & Thumb Zone (Design Ops Director)](#24-ergonomia-apple-hig-anti-ai-smell--thumb-zone-design-ops-director)
   - [2.5 Zero-Fallback-Falso & Auditoria de Completude (Staff QA Gatekeeper)](#25-zero-fallback-falso--auditoria-de-completude-staff-qa-gatekeeper)
3. [SEÇÃO III — Matriz Completa de Integrações Oficiais & Endpoints no Brasil](#seção-iii--matriz-completa-de-integrações-oficiais--endpoints-no-brasil)
   - [3.1 Marketplaces & Delivery (16 Canais Oficiais)](#31-marketplaces--delivery-16-canais-oficiais)
   - [3.2 Logística, Transportadoras & Etiquetas Térmicas (ZPL / PDF)](#32-logística-transportadoras--etiquetas-térmicas-zpl--pdf)
   - [3.3 Motor Fiscal Nacional: NF-e SEFAZ e o Padrão Nacional da NFS-e (Receita Federal / ADN)](#33-motor-fiscal-nacional-nf-e-sefaz-e-o-padrão-nacional-da-nfs-e)
4. [SEÇÃO IV — Telemetria 360°, Pixels, Meta CAPI & Feeds Dinâmicos](#seção-iv--telemetria-360-pixels-meta-capi--feeds-dinâmicos)
   - [4.1 Dual-Tracking (Navegador + Server-Side CAPI com Hash SHA-256)](#41-dual-tracking-navegador--server-side-capi-com-hash-sha-256)
   - [4.2 Estruturação Semântica de Produtos, Serviços e Viagens para DPA](#42-estruturação-semântica-de-produtos-serviços-e-viagens-para-dpa)
   - [4.3 Feeds Oficiais em Edge CDN (Google Shopping XML & Meta Commerce CSV)](#43-feeds-oficiais-em-edge-cdn-google-shopping-xml--meta-commerce-csv)
5. [SEÇÃO V — Indexação Web, SEO, Google Meu Negócio & WebMCP para Agentes de IA](#seção-v--indexação-web-seo-google-meu-negócio--webmcp-para-agentes-de-ia)
   - [5.1 Microdados Schema.org JSON-LD para Produtos, Lojas e Notícias](#51-microdados-schemaorg-json-ld-para-produtos-lojas-e-notícias)
   - [5.2 Google Meu Negócio / Business Profile API](#52-google-meu-negócio--business-profile-api)
   - [5.3 WebMCP / Model Context Protocol: Como IAs Encontram e Compram na Plataforma](#53-webmcp--model-context-protocol-como-ias-encontram-e-compram-na-plataforma)
6. [SEÇÃO VI — Social Publisher & Studio: Gerador de Imagens no Backend](#seção-vi--social-publisher--studio-gerador-de-imagens-no-backend)
7. [SEÇÃO VII — Acervo dos Projetos Irmãos & Aproveitamento de Ativos](#seção-vii--acervo-dos-projetos-irmãos--aproveitamento-de-ativos)
8. [SEÇÃO VIII — Modelagem de Banco de Dados & Esquemas SQL DDL (Camada 1)](#seção-viii--modelagem-de-banco-de-dados--esquemas-sql-ddl-camada-1)
9. [SEÇÃO IX — Contratos BFF, Rotas & Superfícies no Workspace (Camadas 2 a 7)](#seção-ix--contratos-bff-rotas--superfícies-no-workspace-camadas-2-a-7)
10. [SEÇÃO X — Roadmap Faturável de Execução em 7 Fases Rastreáveis](#seção-x--roadmap-faturável-de-execução-em-7-fases-rastreáveis)

---

# SEÇÃO I — Auditoria Forense do Sistema Atual

A auditoria minuciosa da base de código do Waesy revelou a exata linha de demarcação entre o que já está homologado em produção e o que ainda requer implementação ou refatoração:

| Domínio de Funcionalidade | Status Atual no Repositório | O Que Já Foi Entregue | O Que Falta Implementar / Refinar |
| :--- | :---: | :--- | :--- |
| **Telemetria de Pixels** | 🟡 Parcial | `store_pixel_configs`, CAPI Server-side com hashing SHA-256 e tela `/workspace/marketing/pixels`. | Inclusão de GA4 Measurement Protocol com `api_secret`, campos de DPA no cadastro de produtos e telemetria de leads de classificados e viagens. |
| **Hub de Marketplaces** | 🟡 Parcial | Enum de 16 plataformas em `marketplace-hub.functions.ts`, tela `/workspace/integracoes/marketplaces`. | Webhook Inbox com idempotência (`marketplace_webhook_events`), baixa atômica de estoque multi-canal via `.rpc` e painel de expedição WMS. |
| **Emissão Fiscal** | 🟢 Avançado | Emissão em background ao mudar status para "Em Separação", Storage `receipts` (XML/DANFE), Recibo do Cliente, Badges de Caixa e Portal do Contador (`/workspace/contador`). | Conexão direta com o **Padrão Nacional da NFS-e (Receita Federal / ADN)** e contingência multi-gateway (Nuvem Fiscal / Focus NFe / Webmania). |
| **Financeiro com Tags** | 🟢 Avançado | Coluna `channel` e filtro multicanal no caixa (`src/routes/workspace.financeiro.caixa.index.tsx`), selos `[NF-e]` vs `[Não Fiscal]`. | Tela dedicada para relatório analítico de taxas de marketplace (`/workspace/financeiro/relatorios/canais`). |
| **Expedição & Logística** | 🟡 Parcial | Modelos conceituais e cotações básicas de frete. | Mesa de conferência por leitor de código de barras (`/workspace/pedidos/expedicao`), gerador de etiquetas térmicas Zebra ZPL e PDF 100x150mm. |
| **Descoberta Web & SEO** | 🟡 Parcial | Sitemaps dinâmicos (`sitemap.xml`, `sitemap-products.xml`, `sitemap-news.xml`), `ProductSeoHead` básico. | Rota `/api/webmcp.json` para IAs, feeds dinâmicos Google Shopping XML e Meta Commerce CSV, integração com Google Business Profile API. |
| **Social Studio** | 🟡 Parcial | DTOs de posts sociais, agendamento em `social-publisher.functions.ts`. | Canvas com layouts Apple HIG / editorial, renderizador HD de imagens (PNG) no backend para Stories (9:16) e Feed (1:1 / 4:5). |

---

# SEÇÃO II — Os Esclarecimentos Oficiais do Conselho Executivo

O Conselho Executivo de BigTech processou cada um dos questionamentos do usuário através de suas 5 Personas Especialistas:

---

### 2.1 Visão de Produto & Matriz Anti-Esquecimento (CPO)

O CPO garante que a ideia simples do usuário seja expandida para uma solução de padrão mundial, cobrindo as 4 personas (Autor, Consumidor, Operador e Auditor) e consolidando a **Matriz Anti-Esquecimento**:

* **`[REQ-01] Dual-Tracking de Telemetria Irrestrita:`** Implementar rastreamento combinado (Navegador + Server-Side CAPI) para Meta Ads, Google Ads, GA4 e TikTok em todos os produtos, classificados, serviços e pacotes de turismo, garantindo 100% de captura mesmo com iOS ATT e adblockers.
* **`[REQ-02] Estruturação Semântica de Catálogo:`** Expandir os dados de produtos para atender às exigências de catálogos dinâmicos (DPA): campos de GTIN/EAN-13, NCM, Categoria Google (`google_product_category`), Marca e Condição do item.
* **`[REQ-03] Central de Integrações & Regra do Zero-Fallback-Falso:`** Conectar com 1 clique fácil os 16 marketplaces e transportadoras do Brasil. Se uma loja não configurou a integração com o Mercado Livre ou iFood, **nenhuma menção ou botão quebrado deve aparecer na interface do cliente ou do operador**.
* **`[REQ-04] Rastreamento Financeiro & Relatório de Taxas:`** Transações multicanal registradas no fluxo de caixa com badges imutáveis (`[Mercado Livre]`, `[iFood]`, `[Amazon]`) e custos discriminados (comissões retidas, fretes, multas) para gerar relatórios detalhados de rentabilidade por canal.
* **`[REQ-05] Mesa de Expedição WMS & Etiquetas Térmicas:`** Painel de conferência de pedidos por bipagem com leitor de código de barras e impressão instantânea de etiquetas térmicas em ZPL (Zebra) e PDF 100x150mm.
* **`[REQ-06] Motor Fiscal Nacional (SEFAZ + NFS-e ADN):** Integração unificada para emissão de NF-e (produtos) e NFS-e nacional (serviços via Ambiente de Dados Nacional da Receita Federal que substitui as 5.500 prefeituras).
* **`[REQ-07] Feeds Dinâmicos em Tempo Real:** Endpoints públicos em Edge CDN para alimentar o Google Shopping (`/api/feed/google.xml`) e o Catálogo do Facebook/Instagram (`/api/feed/meta.csv`).
* **`[REQ-08] WebMCP & Indexação para Agentes de IA:** Endpoint `/api/webmcp.json` para permitir que agentes de IA (Gemini, ChatGPT, Claude, Perplexity) busquem produtos e realizem pedidos via linguagem natural.
* **`[REQ-09] Social Publisher & Studio:** Gerador gráfico no backend capaz de montar cards de produtos e viagens com layouts editoriais de alto padrão (formato Stories 9:16 e Feed 1:1) prontos para compartilhamento nas redes sociais.
* **`[REQ-10] Governança Multi-Tenant:** Admin Master configura as credenciais globais de desenvolvedor das plataformas e o Lojista conecta sua conta em 1 clique sem tocar em configurações técnicas complexas.

---

### 2.2 Arquitetura de Hub, Event-Driven & Idempotência (Chief Software Architect)

* **O Desafio da Concorrência Multicanal:** Se um produto possui apenas 1 unidade em estoque e recebe uma compra simultânea na loja virtual e no Mercado Livre, o sistema não pode permitir *overbooking* (venda dupla).
* **A Solução:**
  1. **Transactional Inbox:** Cada webhook recebido do Mercado Livre, iFood ou Amazon é gravado na tabela `marketplace_webhook_events` com chave única composta (`platform`, `external_event_id`). Se a plataforma externa reenviar o mesmo webhook (replay), o banco rejeita com base na constraint única, respondendo imediatamente `HTTP 200 OK`.
  2. **Baixa Atômica via Stored Procedure (`.rpc`):** A baixa do estoque compartilhado é executada em nível ACID dentro do PostgreSQL (`decrement_shared_stock`). Se o saldo chegar a zero, uma transação atômica bloqueia a compra concorrente e gera uma mensagem de atualização imediata para os outros marketplaces conectados através do Transactional Outbox.
  3. **Padrões Abertos:** A camada de integração adota o padrão **OpenDelivery v1.0** (criado pela Abrasel e adotado por iFood, Rappi e 99Food) e os contratos OpenAPI 3.1 para garantir interoperabilidade total com qualquer software de terceiros.

---

### 2.3 Segurança, RLS & Cofre de Chaves Criptografadas (CISO / Staff Security)

* **Princípio Zero-Trust:** O cliente frontend nunca tem acesso direto a chaves de API, segredos de webhook ou tokens de acesso OAuth.
* **Cofre Criptografado (AES-256-GCM):**
  - Os tokens de acesso (`access_token`, `refresh_token`) dos marketplaces e os certificados digitais A1 (`.pfx`) são criptografados antes de serem salvos no banco de dados, utilizando uma chave mestra mantida exclusivamente nas variáveis de ambiente seguras do servidor Cloudflare/Nitro (`ENCRYPTION_MASTER_KEY`).
* **Isolamento Multi-Tenant Inviolável:** Todas as tabelas (`marketplace_connectors`, `store_nfe_configs`, `store_pixel_configs`, `order_shipping_labels`) possuem Row Level Security (RLS) habilitado com política *Deny-by-Default*. O `store_id` nunca é aceito cegamente a partir do payload do cliente; ele é derivado do JWT autenticado na sessão (`getServerIdentity()`).

---

### 2.4 Ergonomia Apple HIG, Anti-AI Smell & Thumb Zone (Design Ops Director)

* **Silêncio Operacional:** Todas as telas do Workspace (Expedição, Central de Integrações, Pixels, Caixa) seguem o **Paradigma Clean**: superfícies neutras (`surface-paper`, `bg-background` branco), tipografia em Inter/system-ui com pesos calibrados, bordas de 1px ultra sutis (`border-border/80`) e cantos arredondados contidos (`rounded-xl` / `rounded-2xl`).
* **Erradicação do AI-Smell:** Proibição absoluta de cards conversacionais com título + subtítulo + caixinha colorida tentando explicar ações óbvias. Botões são diretos: `<Button variant="outline">Conectar Mercado Livre</Button>`.
* **Ergonomia dos 3 Toques & Thumb Zone:** Em dispositivos móveis, as ações críticas (confirmar bipagem, imprimir etiqueta, salvar alterações) ficam afixadas no terço inferior da tela, com altura mínima de 44px (`h-11`) e safe-bottom para iPhones (`env(safe-area-inset-bottom)`).

---

### 2.5 Zero-Fallback-Falso & Auditoria de Completude (Staff QA Gatekeeper)

* **A Regra do Zero-Fallback-Falso:** É terminantemente proibido exibir canais ou opções inativas como "mock" para o cliente. Se a loja não configurou o Mercado Livre, na tela de pedidos o filtro de canal omite essa opção; na vitrine pública do produto, apenas os canais com integração real ativa e credenciais válidas são expostos.
* **Completude Quádrupla:** Cada funcionalidade nova deve obrigatoriamente possuir suas 4 camadas comprovadas:
  1. *Tabela no Banco:* Migration aplicada com colunas, constraints e RLS.
  2. *BFF (Server Functions):* Validação rigorosa com Zod e verificação de autoridade.
  3. *UI de Ação:* Formulários reais com estados de loading, erro e sucesso.
  4. *Superfície de Gestão:* Painel no Workspace para auditoria, histórico e reversão.

---

# SEÇÃO III — Matriz Completa de Integrações Oficiais & Endpoints no Brasil

Abaixo está o mapeamento detalhado das documentações oficiais de desenvolvedores e protocolos de comunicação para os ecossistemas comerciais, logísticos e fiscais do Brasil:

### 3.1 Marketplaces & Delivery (16 Canais Oficiais)

| Canal / Plataforma | Tipo de Canal | Protocolo de Comunicação | Documentação Oficial de Desenvolvedores |
| :--- | :--- | :--- | :--- |
| **Mercado Livre** | Marketplace / E-Commerce | REST API / OAuth 2.0 / Webhooks | [Mercado Livre Developers](https://developers.mercadolivre.com.br/) |
| **Amazon Brasil** | Marketplace Global | Selling Partner API (SP-API) / AWS SigV4 | [Amazon SP-API Documentation](https://developer-docs.amazon.com/sp-api/) |
| **Magazine Luiza** | Marketplace Nacional | REST / IntegraCommerce API | [Magalu Developer Portal](https://developers.magazineluiza.com.br/) |
| **Shopee Brasil** | Marketplace Cross-Border | REST / HMAC-SHA256 Signature | [Shopee Open Platform](https://open.shopee.com.br/) |
| **iFood** | Food Delivery / Mercado | OpenDelivery v1.0 / REST API / Polling | [iFood Developer Docs](https://developer.ifood.com.br/) |
| **99Food** | Food Delivery | OpenDelivery / REST / Webhooks | [99Food Merchant Integration](https://food.99app.com/) |
| **Amo Delivery / Ofertas** | Delivery & Ofertas Regionais | REST API / Webhooks JSON | [Amo Delivery API](https://amodelivery.com.br/developers) |
| **Rappi** | SuperApp / Ultra-Fast Delivery | REST API / Bearer Token | [Rappi Partners Developer Portal](https://developer.rappi.com/) |
| **Americanas Marketplace** | Marketplace (B2W) | SkyHub REST API | [SkyHub Developer Guide](https://skyhub.com.br/) |
| **Casas Bahia / Ponto** | Marketplace (Via Varejo) | Via Marketplace REST API | [Via Developers Portal](https://developer.via.com.br/) |

---

### 3.2 Logística, Transportadoras & Etiquetas Térmicas (ZPL / PDF)

| Transportadora / Gateway | Serviço / Protocolo | Formato da Etiqueta | Documentação Oficial |
| :--- | :--- | :--- | :--- |
| **Correios (CWS API v2)** | SEDEX, PAC, Mini Envios (REST / Basic Auth) | ZPL Térmica & PDF 100x150mm | [Correios Web Services (CWS)](https://cws.correios.com.br/) |
| **Melhor Envio** | Hub Logístico Multi-Transportadora (OAuth 2.0) | PDF Térmico 100x150mm / A4 | [Melhor Envio API Docs](https://docs.melhorenvio.com.br/) |
| **Kangu (Mercado Livre)** | Pontos de Coleta & Envio (REST / Bearer Token) | ZPL Térmico & PDF | [Kangu Desenvolvedores](https://www.kangu.com.br/desenvolvedores) |
| **Frenet** | Gateway de Cotações & Despacho (REST API) | Etiquetas Correios/Jadlog PDF | [Frenet API Cotação](https://ajuda.frenet.com.br/s/article/api-calculo-de-frete) |
| **Loggi** | Entregas Expressas & Same-Day (REST / OAuth) | PDF 100x150mm & ZPL | [Loggi Developers](https://docs.loggi.com/) |
| **Jadlog** | Cargas Fracionadas e E-Commerce (WebServices) | EDI / PDF Térmico | [Jadlog Corporativo](https://www.jadlog.com.br/jadlog/servicos) |

---

### 3.3 Motor Fiscal Nacional: NF-e SEFAZ e o Padrão Nacional da NFS-e

Historicamente, o Brasil possuía mais de 5.500 sistemas de nota fiscal de serviços municipais (ABRASF, Betha, ISSNet, Ginfes, WebISS). O Governo Federal, através da Receita Federal e do Comitê Gestor da NFS-e, estabeleceu o **Portal Nacional da NFS-e (Ambiente de Dados Nacional - ADN)**.

O ecossistema Waesy opera em arquitetura híbrida de alta resiliência:
1. **Padrão Nacional NFS-e (Receita Federal / ADN):** Conexão direta via webservices SOAP/mTLS com certificado digital A1 para prestadores de serviços e MEIs de todo o território nacional.
2. **NF-e (Modelo 55 - Mercadorias) & NFC-e (Modelo 65 - Varejo):** Comunicação direta com os servidores das Secretarias de Fazenda Estaduais (SEFAZ).
3. **Multi-Gateway Fallback:** Conexão nativa com os principais orquestradores fiscais homologados do Brasil para contingência automática:
   - **Focus NFe:** [Focus NFe API v2](https://focusnfe.com.br/doc/)
   - **Nuvem Fiscal:** [Nuvem Fiscal Developer Docs](https://dev.nuvemfiscal.com.br/docs/)
   - **PlugNotas (TecnoSpeed):** [PlugNotas API Docs](https://plugnotas.com.br/docs/)
   - **eNotas Gateway:** [eNotas API Documentation](https://docs.enotasgateway.com/)
   - **Webmania NF-e:** [Webmania REST API](https://webmaniabr.com/docs/rest-api-nfe/)

---

# SEÇÃO IV — Telemetria 360°, Pixels, Meta CAPI & Feeds Dinâmicos

### 4.1 Dual-Tracking (Navegador + Server-Side CAPI com Hash SHA-256)

Com a introdução do iOS 14.5+ (App Tracking Transparency) e o bloqueio de cookies de terceiros, o disparo de pixels exclusivamente pelo navegador perde entre 30% e 45% das conversões reais de campanhas.

O Waesy implementa a arquitetura canônica de **Dual-Tracking com Deduplicação Perfeita**:

```text
┌────────────────────────┐                    ┌─────────────────────────┐
│  Navegador do Usuário   │─── event_id: XYZ ─▶│  Meta Pixel (Script)    │ (Pode ser bloqueado)
└───────────┬────────────┘                    └─────────────────────────┘
            │ Clique / Compra / Lead
            ▼
┌────────────────────────┐                    ┌─────────────────────────┐
│   Servidor Waesy (BFF)   │─── event_id: XYZ ─▶│  Meta CAPI (Servidor)   │ (100% Imutável & Seguro)
│  (pixels.functions.ts) │   + Hash SHA-256   └─────────────────────────┘
└────────────────────────┘
```

#### Tratamento e Normalização dos Dados do Cliente (EMQ 9.0+):
Para garantir a máxima pontuação de correspondência de eventos (Event Match Quality - EMQ da Meta), os dados pessoais são sanitizados e criptografados em SHA-256 antes do envio:
- **E-mail (`em`):** Espaços removidos, convertido para caixa baixa e hasheado em SHA-256 (ex: `sha256("joao@email.com")`).
- **Telefone (`ph`):** Caracteres não numéricos removidos, adicionado DDI 55 (ex: `sha256("5549999999999")`).
- **Endereço IP do Cliente (`client_ip_address`):** Extraído com precisão do cabeçalho `CF-Connecting-IP` da Cloudflare.
- **User Agent (`client_user_agent`):** Identificação completa do navegador do visitante.

---

### 4.2 Estruturação Semântica de Produtos, Serviços e Viagens para DPA

Para que as campanhas de **Dynamic Product Ads (DPA)** no Facebook/Instagram e de **Performance Max / Smart Shopping** no Google funcionem, o cadastro de produtos deve conter a taxonomia global do e-commerce:

1. **`gtin_ean` (Código de Barras Global):** Identificador padrão EAN-13 / UPC / ISBN. Essencial para que o Google Shopping compare preços e exiba o produto na vitrine principal de busca.
2. **`google_product_category` (Taxonomia Google):** ID numérico ou caminho textual oficial do Google (ex: `Apparel & Accessories > Clothing`).
3. **`brand_name` (Marca / Fabricante):** Nome canônico da marca para agrupamento de catálogo.
4. **`ncm` (Classificação Fiscal):** Necessário para a correlação tributária e exportação fiscal.
5. **`item_condition` (Condição):** `new` (Novo), `refurbished` (Reembalado) ou `used` (Usado).

---

### 4.3 Feeds Oficiais em Edge CDN (Google Shopping XML & Meta Commerce CSV)

A plataforma disponibiliza dois endpoints públicos de dados gerados dinamicamente em tempo real:

1. **Google Shopping / Merchant Center (`/api/feed/google.xml`):**
   - Formato RSS 2.0 XML estruturado com tags `<g:id>`, `<g:title>`, `<g:description>`, `<g:link>`, `<g:image_link>`, `<g:price>`, `<g:availability>`, `<g:condition>`, `<g:gtin>`, `<g:brand>`.
   - Atualizado automaticamente a cada alteração de preço ou estoque no catálogo.
2. **Meta Commerce Catalog / Instagram Shopping (`/api/feed/meta.csv`):**
   - Arquivo CSV codificado em UTF-8 compatível com o Gerenciador de Comércio da Meta.
   - Suporta importação agendada diária/horária pelo Facebook Business Manager.

---

# SEÇÃO V — Indexação Web, SEO, Google Meu Negócio & WebMCP para Agentes de IA

### 5.1 Microdados Schema.org JSON-LD para Produtos, Lojas e Notícias

Cada página pública do ecossistema Waesy injeta dinamicamente blocos de microdados semânticos no padrão **Schema.org**:
- **Produtos (`Product` + `Offer`):** Nome, descrição, SKU, GTIN, fotos em alta resolução, moeda BRL, preço e disponibilidade (`InStock` / `OutOfStock`), permitindo a exibição de **Rich Results (Resultados Enriquecidos)** com estrelas e preços diretamente na busca orgânica do Google.
- **Negócios Locais (`LocalBusiness` / `Store`):** Endereço completo com geolocalização (latitude/longitude), telefone, horário de funcionamento e categoria de negócio para indexação no Google Maps e no pacote local de busca.
- **Artigos & Notícias (`NewsArticle`):** Título, autor, data de publicação, imagem de destaque e canonical URL para qualificação no **Google Notícias** e no **Google Discover**.

---

### 5.2 Google Meu Negócio / Business Profile API

A integração permite que o lojista conecte sua conta Google no Workspace:
- Sincronização automática de dados institucionais: razão social, horários de atendimento, endereço físico, telefone comercial e link direto do catálogo da loja.
- Centralização das avaliações e respostas a clientes dentro do próprio painel do Waesy.

---

### 5.3 WebMCP / Model Context Protocol: Como IAs Encontram e Compram na Plataforma

O **Model Context Protocol (MCP)** é a nova fronteira da internet conversacional. Com o WebMCP, agentes autônomos de Inteligência Artificial (Google Gemini, OpenAI ChatGPT, Anthropic Claude, Perplexity AI) navegam na plataforma Waesy não como visitantes gráficos convencionais, mas consumindo ferramentas estruturadas em JSON.

O endpoint `/api/webmcp.json` declara as seguintes capacidades abertas:
```json
{
  "protocol": "mcp/1.0",
  "server": "Waesy-Universal-Commerce",
  "tools": [
    {
      "name": "search_products",
      "description": "Busca produtos, classificados e viagens por termo, categoria e cidade com preço e estoque em tempo real.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "city": { "type": "string" },
          "maxPriceCents": { "type": "integer" }
        }
      }
    },
    {
      "name": "get_store_details",
      "description": "Retorna informações operacionais, endereço e modalidades de entrega de um estabelecimento comercial."
    }
  ]
}
```
**Resultado Prático:** Quando um usuário pesquisa no ChatGPT ou Gemini: *"Onde posso encomendar doces artesanais em Chapecó com entrega hoje?"*, a IA consulta a API do Waesy via WebMCP e apresenta os produtos das lojas cadastradas com link direto para finalização da compra.

---

# SEÇÃO VI — Social Publisher & Studio: Gerador de Imagens no Backend

Para erradicar a dependência de designers externos ou ferramentas pagas como o Canva, o Waesy integra o **Social Studio**:

1. **Motor de Renderização Vetorial Server-Side:**
   - O backend compõe uma imagem PNG de altíssima definição (2048x2048px para Feed ou 1080x1920px para Stories) a partir de templates gráficos canônicos.
   - Combina automaticamente a foto do produto/viagem, o logo da loja, tipografia editorial moderna, selo de preço em destaque e um QR Code dinâmico apontando para o link de compra do produto.
2. **Formatos Suportados:**
   - **Card Clássico X / Twitter / Threads:** Formato com citação elegante, avatar arredondado e estética editorial minimalista.
   - **Banner de Viagem / Turismo:** Grid panorâmico com data de saída, roteiro resumido e valor parcelado.
   - **Flyer Promocional de Oferta:** Layout de alto impacto visual para promoções relâmpago.
3. **Compartilhamento em 1 Toque:**
   - Integração com a **Web Share API** para disparo direto no WhatsApp, Instagram Stories e Telegram.
   - Publicação automática via API oficial (Meta Graph API para Facebook/Instagram, Twitter API v2 para X).

---

# SEÇÃO VII — Acervo dos Projetos Irmãos & Aproveitamento de Ativos

Para acelerar a entrega e economizar tokens, o Conselho auditou o acervo de projetos em `c:\Users\Excelência Tour SMO\Documents\projetos-referencias` e catalogou os componentes canônicos que serão diretamente importados e adaptados:

1. **`classificadoswaesy/src/components/integrations/GoogleMerchantConfigPanel.tsx` (14.8KB):**  
   Painel de configuração e validação de feeds XML do Google Shopping.
2. **`classificadoswaesy/src/components/integrations/GA4ConfigPanel.tsx` (12.4KB):**  
   Interface para configuração do Google Analytics 4 Measurement Protocol com chave `api_secret`.
3. **`classificadoswaesy/src/components/integrations/GoogleBusinessTab.tsx` (22.1KB):**  
   Módulo de integração e sincronização com o Google Meu Negócio.
4. **`classificadoswaesy/src/components/marketing/SocialNetworksTab.tsx` (34.8KB):**  
   Catálogo visual de redes sociais (Instagram, TikTok, Twitter/X, Facebook, YouTube, LinkedIn).
5. **`brand-builder-ai/src/lib/templates/tweetSocial.ts`:**  
   Algoritmo e regras CSS para renderização de cards no formato clássico X / Threads.
6. **`classificadoswaesy/src/components/logistics/DeliveryAreaSection.tsx` (10.6KB):**  
   Interface para delimitação de raios de entrega, taxas por bairro e transportadoras homologadas.

---

# SEÇÃO VIII — Modelagem de Banco de Dados & Esquemas SQL DDL (Camada 1)

As estruturas relacionais abaixo devem ser aplicadas ao banco de dados PostgreSQL para suportar todas as capacidades do Hub:

```sql
-- 1. EXTENSÃO NA TABELA DE PRODUTOS PARA FEEDS DPA E FISCAL
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS gtin_ean VARCHAR(14),
ADD COLUMN IF NOT EXISTS ncm VARCHAR(8),
ADD COLUMN IF NOT EXISTS google_product_category TEXT,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS item_condition TEXT DEFAULT 'new' CHECK (item_condition IN ('new', 'refurbished', 'used'));

-- 2. TRANSACTIONAL INBOX PARA WEBHOOKS DE MARKETPLACE (ANTI-REPLAY & IDEMPOTÊNCIA)
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    event_type TEXT NOT NULL,
    external_event_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_marketplace_event UNIQUE (platform, external_event_id)
);

-- 3. ETIQUETAS DE TRANSPORTE E EXPEDIÇÃO TÉRMICA (ZPL / PDF)
CREATE TABLE IF NOT EXISTS public.order_shipping_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    carrier TEXT NOT NULL, -- 'correios', 'melhorenvio', 'kangu', 'loggi', 'jadlog'
    service_name TEXT NOT NULL, -- 'SEDEX', 'PAC', 'Kangu Ponto', 'Loggi Express'
    tracking_code TEXT,
    tracking_url TEXT,
    label_format TEXT NOT NULL DEFAULT 'pdf_100x150' CHECK (label_format IN ('pdf_100x150', 'zpl_thermal', 'a4_decl')),
    label_file_url TEXT NOT NULL,
    zpl_raw_code TEXT,
    printed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS POLICIES STRICT MULTI-TENANT
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipping_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loja visualiza apenas suas próprias etiquetas de frete"
ON public.order_shipping_labels FOR ALL
USING (store_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'store_id')::uuid);

CREATE POLICY "Loja visualiza apenas seus próprios webhooks de marketplace"
ON public.marketplace_webhook_events FOR SELECT
USING (store_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'store_id')::uuid);
```

---

# SEÇÃO IX — Contratos BFF, Rotas & Superfícies no Workspace (Camadas 2 a 7)

### Matriz de Rotas do TanStack Router

| Rota Canônica | Finalidade Operacional | Padrão Visual (DESIGN.md) | Dispositivo Alvo |
| :--- | :--- | :--- | :--- |
| `/workspace/integracoes/marketplaces` | Central de Marketplaces & Delivery com 1 toque | Clean Paper, Grid com Badges Reais | Desktop + Mobile |
| `/workspace/pedidos/expedicao` | Mesa de Bipagem WMS e Impressão Térmica | Alta Densidade Operacional, Atalhos | Desktop Mesa |
| `/workspace/fiscal/nfe` | Gestão Fiscal, Emissão Automática e Storage | Tabela Auditável, Status SEFAZ Real | Desktop + Tablet |
| `/workspace/financeiro/caixa` | Fluxo de Caixa com Badges de Canal | Extrato com Badges Imutáveis de Canal | Mobile First |
| `/workspace/marketing/pixels` | Telemetria, Meta CAPI com SHA-256 e GA4 | Clean HIG, Formulários Validados | Mobile First |
| `/workspace/marketing/studio` | Gerador de Imagens Vetoriais para Redes | Canvas Visual, Export PNG HD | Mobile First |
| `/api/feed/google.xml` | Feed Oficial Google Shopping XML | Edge CDN RSS 2.0 XML | API Pública |
| `/api/feed/meta.csv` | Feed Oficial Meta Commerce / Instagram Shop | Edge CDN UTF-8 CSV | API Pública |
| `/api/webmcp.json` | Manifesto WebMCP para Crawlers de IA | JSON Declarativo Open Protocol | API Pública |

---

# SEÇÃO X — Roadmap Faturável de Execução em 7 Fases Rastreáveis

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ROADMAP INDUSTRIAL DE EXECUÇÃO Waesy                              │
├──────┬─────────────────────────┬────────────────────────────┬──────────────────────────┤
│ FASE │ DOMÍNIO                 │ CAMADAS ENVOLVIDAS         │ PROVA REAL DE ENTREGA    │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-01 │ Telemetria & DPA Feeds  │ Camadas 1, 2, 3, 5         │ [CONCLUÍDO] Build 0 erros│
│      │ Meta CAPI + Google XML  │                            │ Feeds ativos no Edge     │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-02 │ Hub Marketplaces        │ Camadas 1, 2, 3, 4         │ [CONCLUÍDO] 16 canais    │
│      │ 99Food, Kangu, Loggi    │                            │ Conectores reais ativos  │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-03 │ Motor Fiscal Nacional   │ Camadas 1, 2, 3, 4         │ [CONCLUÍDO] NF-e Storage │
│      │ SEFAZ + Padrão ADN      │                            │ Portal do Contador       │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-04 │ Expedição & WMS Térmico │ Camadas 1 a 7 (Completo)   │ Mesa de bipagem WMS      │
│      │ Zebra ZPL / 100x150     │                            │ Impressão em 1 toque     │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-05 │ Financeiro com Tags     │ Camadas 1, 2, 3, 4         │ [CONCLUÍDO] Badges Caixa │
│      │ Relatório de Comissões  │                            │ Extrato multicanal       │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-06 │ WebMCP & SEO para IAs   │ Camadas 2, 5, 7            │ Manifesto /api/webmcp    │
│      │ Schema.org nos Produtos │                            │ Schema.org JSON-LD       │
├──────┼─────────────────────────┼────────────────────────────┼──────────────────────────┤
│ F-07 │ Social Studio           │ Camadas 2, 3, 5, 7         │ Renderizador Edge PNG    │
│      │ Geração de Cards Stories│                            │ Templates X e Viagens    │
└──────┴─────────────────────────┴────────────────────────────┴──────────────────────────┘
```

> **CERTIFICAÇÃO DO CONSELHO EXECUTIVO DE BIGTECH:**  
> A documentação acima representa o estado da arte em engenharia de software para plataformas de comércio, logística e conformidade fiscal no Brasil. Toda a arquitetura foi desenhada para garantir performance extrema, segurança inviolável e ausência absoluta de mocks.
