# Documentação Mestra de Engenharia: Hub de Integrações Multicanal, Módulo Fiscal Brasileiro, Telemetria & Social Studio

> **Status:** Documento Normativo do Conselho Executivo de BigTech (JAH / Wider OS)  
> **Data:** Setembro de 2026  
> **Classificação:** Arquitetura de Referência & Especificação Funcional

---

## 1. Visão Geral do Hub Centralizador

O objetivo desta arquitetura é transformar a plataforma em um **Hub Operacional Autônomo e Centralizado**, capaz de gerenciar múltiplos canais de venda (loja física, e-commerce próprio, classificados locais, marketplaces e apps de delivery) sob uma única árvore de governança e verdade de dados.

### Pilares Fundamentais:
1. **Zero-Fake-Fallback Mandate:** Nenhuma integração desativada ou não configurada exibirá dados falsos, toasts cosméticos ou cards simulados. O sistema é 100% truthful.
2. **Padrões Abertos Globais:** Adoção de **OpenDelivery (Abrasel / ABNT)** para pedidos de refeição e conveniência, **OpenFinance** para conciliação bancária, **OpenAPI v3** para contratos de dados e **WebMCP** para descoberta por inteligências artificiais.
3. **Rastreabilidade Contábil Imutável:** Todas as transações financeiras e movimentações de estoque carregam a tag de origem do canal (`channel_source`), com discriminação explícita de taxas da plataforma, despesas de envio e repasse líquido real.

---

## 2. Mapa de Conectores & Documentação Oficial das Plataformas

| Categoria | Plataforma | Protocolo / Padrão | Documentação Oficial |
| :--- | :--- | :--- | :--- |
| **E-Commerce** | **Mercado Livre** | REST / OAuth 2.0 / Webhooks | [Mercado Livre Developers](https://developers.mercadolivre.com.br/) |
| **E-Commerce** | **Shopee Brasil** | REST / HMAC-SHA256 / Webhooks | [Shopee Open Platform](https://open.shopee.com.br/) |
| **E-Commerce** | **Amazon Brasil (SP-API)** | REST / AWS IAM / LWA | [Amazon Selling Partner API](https://developer-docs.amazon.com/sp-api/) |
| **E-Commerce** | **Magazine Luiza (Magalu)** | REST / OAuth / IntegraCommerce | [Magalu Developers](https://developers.magazineluiza.com.br/) |
| **Delivery** | **iFood** | REST / OpenDelivery v1.0 | [iFood Developer Portal](https://developer.ifood.com.br/) |
| **Delivery** | **Rappi** | REST / Webhooks | [Rappi Developers](https://developer.rappi.com/) |
| **Delivery** | **Amo Delivery / AmoOfertas** | REST / Webhooks | [Amo Delivery API](https://amodelivery.com.br/developers) |
| **Logística** | **Melhor Envio** | REST / OAuth 2.0 | [Melhor Envio Docs](https://docs.melhorenvio.com.br/) |
| **Logística** | **Correios** | REST / CWS Token | [Correios Web Services (CWS)](https://cws.correios.com.br/) |
| **Logística** | **Kangoo / Jadlog / Loggi** | REST / API Token | APIs de Parceiros de Fulfillment |
| **Fiscal** | **Focus NFe** | REST / Token / Webhooks | [Focus NFe Documentação](https://focusnfe.com.br/doc/) |
| **Fiscal** | **Nuvem Fiscal** | REST / OAuth 2.0 | [Nuvem Fiscal Devs](https://dev.nuvemfiscal.com.br/docs/) |
| **Fiscal** | **NFS-e Padrão Nacional** | REST / Certificado A1 / ADN | [Portal Nacional NFS-e](https://www.gov.br/nfse/) |
| **Marketing** | **Meta Conversions API (CAPI)**| Graph API / Token / SHA256 | [Meta CAPI Docs](https://developers.facebook.com/docs/marketing-api/conversions-api) |
| **Marketing** | **Google Ads Enhanced Conversions**| Google Ads API / gclid | [Google Ads API](https://developers.google.com/google-ads/api/docs/conversions/enhanced-conversions) |
| **Catálogo** | **Google Merchant Center** | RSS 2.0 XML Feed | [Google Product Feed Spec](https://support.google.com/merchants/answer/7052112) |
| **Catálogo** | **Meta Commerce Manager** | CSV / TSV Catalog Feed | [Meta Product Catalog Feed](https://www.facebook.com/business/help/120325381656392) |
| **IA / Discovery**| **WebMCP / MCP** | JSON / SSE / Tool Calls | [Model Context Protocol](https://modelcontextprotocol.io/) |

---

## 3. Modelo de Dados Relacional (Postgres / Supabase)

### 3.1. Tabela de Conectores (`marketplace_connectors`)
Armazena credenciais e status de conexão por loja:
```sql
CREATE TABLE public.marketplace_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'mercadolivre', 'ifood', 'shopee', 'magalu', 'amazon', 'melhorenvio', 'correios'
  name TEXT NOT NULL,
  external_account_id TEXT,
  account_nickname TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  credentials JSONB DEFAULT '{}',
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error', 'partial')),
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  settings JSONB DEFAULT '{
    "auto_accept_orders": false,
    "sync_products": true,
    "sync_orders": true,
    "sync_stock": true,
    "sync_prices": true,
    "price_margin_percent": 0
  }',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, platform)
);

ALTER TABLE public.marketplace_connectors ENABLE ROW LEVEL SECURITY;
```

### 3.2. Tabela de Pedidos Externos (`marketplace_external_orders`)
Importação e telemetria financeira completa:
```sql
CREATE TABLE public.marketplace_external_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES public.marketplace_connectors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  external_order_id TEXT NOT NULL,
  external_status TEXT NOT NULL,
  buyer_name TEXT,
  buyer_document TEXT,
  buyer_email TEXT,
  buyer_phone TEXT,
  shipping_address JSONB,
  subtotal_cents INTEGER NOT NULL,
  shipping_cost_cents INTEGER DEFAULT 0,
  marketplace_fee_cents INTEGER DEFAULT 0,
  net_payout_cents INTEGER NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  payment_method TEXT,
  shipping_method TEXT,
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  items JSONB DEFAULT '[]',
  import_status TEXT DEFAULT 'imported' CHECK (import_status IN ('pending', 'imported', 'error', 'skipped')),
  raw_data JSONB,
  imported_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connector_id, external_order_id)
);

ALTER TABLE public.marketplace_external_orders ENABLE ROW LEVEL SECURITY;
```

### 3.3. Configuração Fiscal (`store_nfe_configs`) e Histórico (`store_nfe_invoices`)
```sql
CREATE TABLE public.store_nfe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID UNIQUE NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'focus_nfe' CHECK (provider IN ('focus_nfe', 'nuvem_fiscal', 'nfs_nacional')),
  api_token TEXT,
  environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  cnpj TEXT NOT NULL,
  inscricao_municipal TEXT,
  inscricao_estadual TEXT,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional' CHECK (
    regime_tributario IN ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei')
  ),
  aliquota_iss DECIMAL(5,2) DEFAULT 2.00,
  codigo_servico_municipal TEXT,
  serie_nfe TEXT DEFAULT '1',
  proximo_numero INTEGER DEFAULT 1,
  certificate_vault_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.store_nfe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_type TEXT DEFAULT 'nfe' CHECK (invoice_type IN ('nfe', 'nfse', 'nfce')),
  nfe_number TEXT,
  nfe_serie TEXT,
  nfe_key TEXT, -- 44 dígitos
  danfe_pdf_url TEXT,
  xml_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'issued', 'cancelled', 'error')),
  valor_total_cents INTEGER NOT NULL,
  tomador_documento TEXT,
  tomador_nome TEXT,
  error_message TEXT,
  issued_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Telemetria Irrestrita de Pixels & Retorno de Conversões Meta CAPI

### Deduplicação e Formato CAPI
Para que os eventos de pixel não sejam duplicados entre o navegador e o servidor, utiliza-se o identificador determinístico `event_id` (ex: `ord_<order_id>` ou `lead_<lead_id>`).

```typescript
// Exemplo de payload enviado para a Graph API Meta CAPI:
{
  "event_name": "Purchase",
  "event_time": Math.floor(Date.now() / 1000),
  "event_id": `order_${order.id}`,
  "event_source_url": `https://meudominio.com.br/pedido/${order.id}`,
  "action_source": "website",
  "user_data": {
    "em": [sha256(email.trim().toLowerCase())],
    "ph": [sha256(phone.replace(/\D/g, ''))],
    "client_ip_address": req.headers.get("cf-connecting-ip"),
    "client_user_agent": req.headers.get("user-agent"),
    "fbc": cookies.get("_fbc"),
    "fbp": cookies.get("_fbp")
  },
  "custom_data": {
    "currency": "BRL",
    "value": (order.total_amount_cents / 100).toFixed(2),
    "content_type": "product",
    "contents": order.items.map(item => ({
      "id": item.product_id,
      "quantity": item.quantity,
      "item_price": (item.unit_price_cents / 100).toFixed(2)
    }))
  }
}
```

---

## 5. Feeds Dinâmicos de Catálogo & WebMCP

### 5.1. Google Merchant Center (RSS 2.0 XML)
Rota: `/api/feeds/google-shopping.xml?store_id=<store_id>`
Gera feed com atributos obrigatórios: `<g:id>`, `<g:title>`, `<g:description>`, `<g:link>`, `<g:image_link>`, `<g:price>`, `<g:availability>` (`in stock` / `out of stock`), `<g:brand>`, `<g:condition>` (`new`).

### 5.2. Meta Commerce Manager (CSV / TSV)
Rota: `/api/feeds/meta-catalog.csv?store_id=<store_id>`
Gera planilha delimitada por vírgula compatível com Facebook Shops e Instagram Shopping para anúncios dinâmicos (DPA).

### 5.3. WebMCP Server (`/.well-known/webmcp.json`)
Exposição de ferramentas declarativas que agentes de inteligência artificial podem invocar para consultar produtos e disponibilidade:
```json
{
  "name": "Wider Store AI Discovery",
  "version": "1.0.0",
  "tools": [
    {
      "name": "search_products",
      "description": "Busca produtos em tempo real por termo, categoria e faixa de preço.",
      "parameters": {
        "query": { "type": "string" },
        "max_price": { "type": "number" }
      }
    },
    {
      "name": "get_store_schedule",
      "description": "Retorna horários de atendimento, endereço e telefone da empresa.",
      "parameters": {
        "store_id": { "type": "string" }
      }
    }
  ]
}
```

---

## 6. Social Studio & Gerador Visual de Compartilhamento

O Social Studio permite gerar ativos visuais de alta qualidade diretamente no navegador ou via backend, prontos para publicação:
1. **Stories do Instagram (9:16 - 1080x1920px)**: Moldura editorial com imagem de destaque, preço/informação em tipografia limpa, badge da loja e CTA minimalista.
2. **Feed do Instagram (1:1 - 1080x1080px)**: Grid simétrico com espaçamento HIG.
3. **Twitter / Threads / X (16:9 - 1200x675px)**: Card widescreen otimizado para previsualização social.

---

## 7. Roteiro de Execução em Fases

- **Fase 1:** Aplicação da migration de conectores de marketplace, pedidos externos, tabelas fiscais e colunas de canal em caixa/estoque.
- **Fase 2:** Criação dos contratos BFF em `src/services/marketplace-hub.functions.ts` e `src/services/fiscal-nfe.functions.ts`, com transplante dos adaptadores de `wider-669929d7`.
- **Fase 3:** Implementação dos endpoints de feeds (`/api/feeds/google-shopping.xml`, `/api/feeds/meta-catalog.csv`) e WebMCP.
- **Fase 4:** Telas do Workspace: Central de Integrações (`/workspace/integracoes/marketplaces`), Emissor Fiscal (`/workspace/fiscal/nfe`), Badges no Fluxo de Caixa (`/workspace/financeiro/caixa/lancamentos`) e Impressão de Etiquetas na Expedição (`/workspace/pedidos/expedicao`).
- **Fase 5:** Social Studio Modal para geração de templates visuais em 1 clique.
- **Fase 6:** Testes automatizados com Vitest e compilação do bundle de produção.
