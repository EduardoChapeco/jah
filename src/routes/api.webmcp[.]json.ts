import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webmcp.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const manifest = {
          name: "Waesy AI Agent & MCP Protocol",
          version: "2.0.0",
          description: "Especificação WebMCP para busca de produtos, estoques, empresas e compras autônomas por IA.",
          protocol: "model-context-protocol/v1",
          capabilities: {
            tools: true,
            resources: true,
            prompts: false,
          },
          tools: [
            {
              name: "search_catalog_products",
              description: "Busca produtos, estoques e preços atualizados no marketplace local Waesy.",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Termo de busca do produto" },
                  store_id: { type: "string", description: "ID opcional da loja" },
                  max_price: { type: "number", description: "Preço máximo em reais" },
                },
                required: ["query"],
              },
              endpoint: `${url.origin}/api/search`,
            },
            {
              name: "get_store_directory_info",
              description: "Retorna dados de contato, endereço, horários e reputação de uma empresa no Diretório.",
              parameters: {
                type: "object",
                properties: {
                  slug_or_id: { type: "string", description: "Slug ou ID da empresa" },
                },
                required: ["slug_or_id"],
              },
              endpoint: `${url.origin}/api/store/info`,
            },
            {
              name: "check_delivery_coverage",
              description: "Valida se um CEP é atendido pela frota e calcula taxa de entrega em tempo real.",
              parameters: {
                type: "object",
                properties: {
                  cep: { type: "string", description: "CEP de entrega no Brasil" },
                },
                required: ["cep"],
              },
              endpoint: `${url.origin}/api/shipping/calculate`,
            },
            {
              name: "get_google_shopping_feed",
              description: "Retorna o feed RSS XML padronizado para integração direta com Google Merchant Center.",
              parameters: {
                type: "object",
                properties: {
                  store: { type: "string", description: "UUID da loja para filtragem do catálogo" },
                },
                required: ["store"],
              },
              endpoint: `${url.origin}/api/feed/xml`,
            },
            {
              name: "get_meta_catalog_feed",
              description: "Retorna o feed CSV compatível com Meta Commerce Manager e anúncios dinâmicos (DPA).",
              parameters: {
                type: "object",
                properties: {
                  store: { type: "string", description: "UUID da loja para filtragem do catálogo" },
                },
                required: ["store"],
              },
              endpoint: `${url.origin}/api/feed/meta.csv`,
            },
            {
              name: "inbound_marketplace_webhook",
              description: "Endpoint transacional para recepção e conciliação de webhooks de Mercado Livre, iFood e emissão fiscal.",
              parameters: {
                type: "object",
                properties: {
                  platform: { type: "string", description: "Plataforma emissora (mercadolivre, ifood, focus_nfe, etc.)" },
                  store_id: { type: "string", description: "UUID opcional da loja de destino" },
                },
                required: ["platform"],
              },
              endpoint: `${url.origin}/api/webhooks/marketplaces`,
            },
          ],
        };

        return new Response(JSON.stringify(manifest, null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
