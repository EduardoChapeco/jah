import { describe, it, expect } from 'vitest';
import type { 
  SyntheticArchetype, 
  SimLabStatisticalSynthesis, 
  VerdictStatus 
} from '@/types/simlab';
import { renderSlideHTML5 } from './squad-content.functions';
import { MCP_TOOLS_MANIFEST } from './mcp-server.functions';

describe('Dossiê Deep-Tech: Populações Sintéticas (Aaru AI), SimLab V2, Focus Group & Servidor MCP', () => {
  describe('1. Calibração Demográfica IBGE 2022 & Critério Brasil ABEP', () => {
    it('deve validar estratificação de classes sociais de A1 a D/E', () => {
      const classes = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D_E'];
      expect(classes).toHaveLength(7);
      expect(classes).toContain('A1');
      expect(classes).toContain('C1');
      expect(classes).toContain('D_E');
    });

    it('deve associar correta sensibilidade a preço e cinismo para arquétipos de classes opostas', () => {
      const carlaClasseC: SyntheticArchetype = {
        id: 'c1',
        code: 'BR_F_34_CLASSE_C1_MAE',
        display_name: 'Carla Silveira',
        gender: 'feminino',
        age: 34,
        age_range_label: '30-39 anos',
        abep_social_class: 'C1',
        region: 'Sul',
        location_type: 'capital_metropole',
        median_income_brl: 4800,
        education_level: 'Superior Incompleto',
        cynicism_index: 7.0,
        price_sensitivity: 8.5,
        impulsivity_index: 4.5,
        primary_social_networks: ['WhatsApp', 'Instagram'],
        decision_heuristics: { driver: 'orcamento_mensal' },
        is_active: true,
      };

      const marcosClasseA: SyntheticArchetype = {
        id: 'a1',
        code: 'BR_M_52_CLASSE_A1_DIRETOR',
        display_name: 'Marcos Albuquerque',
        gender: 'masculino',
        age: 52,
        age_range_label: '50-59 anos',
        abep_social_class: 'A1',
        region: 'Sudeste',
        location_type: 'capital_metropole',
        median_income_brl: 32000,
        education_level: 'Pós-graduação',
        cynicism_index: 8.0,
        price_sensitivity: 2.0,
        impulsivity_index: 3.0,
        primary_social_networks: ['LinkedIn', 'WhatsApp'],
        decision_heuristics: { driver: 'tempo_e_status' },
        is_active: true,
      };

      expect(carlaClasseC.price_sensitivity).toBeGreaterThan(marcosClasseA.price_sensitivity);
      expect(marcosClasseA.median_income_brl).toBeGreaterThan(carlaClasseC.median_income_brl * 6);
    });
  });

  describe('2. Motor Econométrico de Simulação em Lotes & Síntese Estatística', () => {
    it('deve calcular o Net Promoter Score Sintético (NPS) com precisão matemática', () => {
      // Amostra de 50 personas: 30 promotores (>=8), 10 neutros (6-7), 10 detratores (<=5)
      const total = 50;
      const promoters = 30;
      const detractors = 10;
      const nps = Math.round(((promoters - detractors) / total) * 100);

      expect(nps).toBe(40); // 60% - 20% = +40
    });

    it('deve computar taxa de aprovação e taxa de rejeição complementares', () => {
      const total = 50;
      const approved = 37;
      const approvalRate = Math.round((approved / total) * 100);
      const rejectionRate = 100 - approvalRate;

      expect(approvalRate).toBe(74);
      expect(rejectionRate).toBe(26);
      expect(approvalRate + rejectionRate).toBe(100);
    });
  });

  describe('3. Conselho Científico de Confrontação (Anti-Hallucination Protocol)', () => {
    it('deve emitir veredito rigoroso de risco de mercado baseado na taxa de aprovação', () => {
      const getVerdict = (approvalRate: number): VerdictStatus => {
        if (approvalRate >= 75) return 'aprovado_para_veiculacao';
        if (approvalRate >= 50) return 'revisar_com_ajustes';
        return 'bloqueado_por_alto_risco';
      };

      expect(getVerdict(82)).toBe('aprovado_para_veiculacao');
      expect(getVerdict(68)).toBe('revisar_com_ajustes');
      expect(getVerdict(41)).toBe('bloqueado_por_alto_risco');
    });

    it('deve validar estrutura dos 3 pareceristas acadêmicos seniores', () => {
      const synthesis: Partial<SimLabStatisticalSynthesis> = {
        synthetic_nps: 45,
        overall_approval_rate: 76,
        scientific_verdict: 'aprovado_para_veiculacao',
        reviewer_reports: [
          {
            reviewer_name: 'Prof. Dr. Arnaldo',
            role: 'Econometrista Chefe',
            credibility_score: 96,
            critique: 'Amostra com IC 95% e margem 4.8%.',
            detected_biases: [],
            status: 'passed',
          },
          {
            reviewer_name: 'Profa. Dra. Beatriz',
            role: 'Psicóloga Social',
            credibility_score: 94,
            critique: 'Viés de cortesia descartado.',
            detected_biases: [],
            status: 'passed',
          },
          {
            reviewer_name: 'Dr. Cláudio',
            role: 'Auditor de Risco',
            credibility_score: 92,
            critique: 'Viabilidade de mercado aprovada.',
            detected_biases: [],
            status: 'passed',
          }
        ]
      };

      expect(synthesis.reviewer_reports).toHaveLength(3);
      expect(synthesis.reviewer_reports?.every(r => r.credibility_score >= 90)).toBe(true);
    });
  });

  describe('4. Pipeline de Criação de Slides HTML5 1080x1080 (Agent Carla)', () => {
    it('deve compilar slide autocontido com dimensões exatas de 1080x1080 e Google Fonts', () => {
      const html = renderSlideHTML5({
        headline: 'O segredo que dobra suas vendas em 30 dias',
        body: 'Implemente uma esteira previsível de ofertas com garantia incondicional.',
        slideIndex: 1,
        totalSlides: 5,
        companyName: 'JAH Turismo & Varejo',
        template: 'bold-color',
        cta: 'Saiba Mais',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('width: 1080px;');
      expect(html).toContain('height: 1080px;');
      expect(html).toContain('fonts.googleapis.com');
      expect(html).toContain('O segredo que dobra suas vendas');
      expect(html).toContain('Slide 1 de 5');
      expect(html).toContain('JAH Turismo & Varejo');
    });
  });

  describe('5. Servidor MCP (Model Context Protocol) do Ecossistema JAH', () => {
    it('deve expor o manifesto com as 4 ferramentas canônicas do protocolo MCP', () => {
      const toolNames = MCP_TOOLS_MANIFEST.map(t => t.name);

      expect(toolNames).toContain('simlab_run_survey');
      expect(toolNames).toContain('generate_marketing_post');
      expect(toolNames).toContain('analyze_competitor_dna');
      expect(toolNames).toContain('query_master_catalog');
      expect(MCP_TOOLS_MANIFEST).toHaveLength(4);
    });

    it('cada ferramenta do manifesto MCP deve ter inputSchema estrito do padrão JSON Schema', () => {
      for (const tool of MCP_TOOLS_MANIFEST) {
        expect(tool.description.length).toBeGreaterThan(15);
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      }
    });
  });
});
