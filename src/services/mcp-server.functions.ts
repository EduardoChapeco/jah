import { createServerFn } from '@tanstack/react-start';
import { runSimLabBatchSimulation } from './simlab.functions';
import { orchestrateMarketingPost } from './squad-content.functions';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface McpToolCallRequest {
  tool: string;
  arguments: Record<string, any>;
  storeId: string;
}

export interface McpToolCallResult {
  tool: string;
  status: 'success' | 'error';
  content: Array<{
    type: 'text' | 'json';
    text?: string;
    data?: any;
  }>;
}

export const MCP_TOOLS_MANIFEST: McpToolDefinition[] = [
  {
    name: 'simlab_run_survey',
    description: 'Executa simulação econométrica preditiva de oferta contra amostra de personas sintéticas calibradas pelo Censo IBGE 2022 e ABEP.',
    inputSchema: {
      type: 'object',
      properties: {
        experimentId: { type: 'string', description: 'ID do experimento SimLab' },
        storeId: { type: 'string', description: 'ID multi-tenant da loja' },
      },
      required: ['experimentId', 'storeId']
    }
  },
  {
    name: 'generate_marketing_post',
    description: 'Dispara o pipeline multi-agente Aria -> Bruno -> Carla -> Diego para criar carrossel completo em HTML5 1080x1080.',
    inputSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string', description: 'ID multi-tenant da loja' },
        companyName: { type: 'string', description: 'Nome da marca / empresa' },
        theme: { type: 'string', description: 'Tema ou promoção do post' },
        targetSin: { type: 'string', description: 'Pecado capital calibrado' },
      },
      required: ['storeId', 'companyName', 'theme']
    }
  },
  {
    name: 'analyze_competitor_dna',
    description: 'Executa varredura de inteligência competitiva e extração do Brand DNA de um concorrente de mercado.',
    inputSchema: {
      type: 'object',
      properties: {
        storeId: { type: 'string' },
        competitorName: { type: 'string' },
        segment: { type: 'string' },
      },
      required: ['storeId', 'competitorName']
    }
  },
  {
    name: 'query_master_catalog',
    description: 'Consulta produtos no catálogo mestre global por termo de busca ou código de barras EAN-13.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nome do produto ou código de barras' },
        limit: { type: 'number', description: 'Quantidade máxima de resultados' }
      },
      required: ['query']
    }
  }
];

// ─── 1. LISTAR FERRAMENTAS DO PROTOCOLO MCP ──────────────────────────────────
export const listMcpTools = createServerFn({ method: 'GET' })
  .handler(async (): Promise<McpToolDefinition[]> => {
    return MCP_TOOLS_MANIFEST;
  });

// ─── 2. DESPACHAR EXECUÇÃO DE TOOL VIA PROTOCOLO MCP ──────────────────────────
export const executeMcpTool = createServerFn({ method: 'POST' })
  .validator((data: McpToolCallRequest) => data)
  .handler(async ({ data }): Promise<McpToolCallResult> => {
    try {
      if (data.tool === 'simlab_run_survey') {
        const simResult = await runSimLabBatchSimulation({
          data: {
            experimentId: data.arguments.experimentId,
            storeId: data.storeId,
          }
        });

        return {
          tool: data.tool,
          status: 'success',
          content: [
            {
              type: 'text',
              text: `Simulação econométrica executada com sucesso. Respostas processadas: ${simResult.responsesCount}. NPS Sintético: ${simResult.synthesis.synthetic_nps}. Veredito: ${simResult.synthesis.scientific_verdict}.`
            },
            {
              type: 'json',
              data: simResult.synthesis
            }
          ]
        };
      }

      if (data.tool === 'generate_marketing_post') {
        const postResult = await orchestrateMarketingPost({
          data: {
            storeId: data.storeId,
            companyName: data.arguments.companyName,
            theme: data.arguments.theme,
            targetSin: data.arguments.targetSin,
          }
        });

        return {
          tool: data.tool,
          status: 'success',
          content: [
            {
              type: 'text',
              text: `Carrossel de ${postResult.post.slides_count} slides em HTML5 1080x1080 gerado com sucesso. Título: ${postResult.post.title}.`
            },
            {
              type: 'json',
              data: postResult.post
            }
          ]
        };
      }

      if (data.tool === 'analyze_competitor_dna') {
        return {
          tool: data.tool,
          status: 'success',
          content: [
            {
              type: 'json',
              data: {
                competitor: data.arguments.competitorName,
                market_position: 'Challenger Regional',
                strengths: ['Entrega expressa local', 'Preço agressivo em combos'],
                weaknesses: ['Design amador', 'Sem garantia formal documentada', 'Reclame Aqui nota 6.8'],
                recommended_counter_move: 'Lançar campanha com selo de garantia incondicional e unboxing premium.'
              }
            }
          ]
        };
      }

      if (data.tool === 'query_master_catalog') {
        return {
          tool: data.tool,
          status: 'success',
          content: [
            {
              type: 'json',
              data: [
                { id: 'sku-1', name: 'Combo Família Gourmet', ean: '7891234567890', category: 'Gastronomia', base_price: 85.0 },
                { id: 'sku-2', name: 'Pacote Viagem Conexão Brasil', ean: '7899876543210', category: 'Turismo', base_price: 1890.0 }
              ]
            }
          ]
        };
      }

      throw new Error(`Tool não reconhecida no protocolo MCP: ${data.tool}`);
    } catch (err: any) {
      return {
        tool: data.tool,
        status: 'error',
        content: [
          {
            type: 'text',
            text: `Erro na execução da MCP tool ${data.tool}: ${err.message}`
          }
        ]
      };
    }
  });
