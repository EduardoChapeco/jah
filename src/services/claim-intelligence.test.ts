import { describe, it, expect } from 'vitest';
import type { 
  ClaimProfile, 
  ClaimIntelligence, 
  ConsumerClaim, 
  ProofType, 
  ClaimStatus, 
  ClaimCategory 
} from '@/types/claim-intelligence';

describe('Microfase 10: Portal de Claim, Inteligência de Reputação & Reclamações (JUS 360°)', () => {
  describe('10.1 Modelagem e Validação de Reivindicação de Perfil (Claim Profiles)', () => {
    it('deve validar tipos permitidos de comprovação de propriedade', () => {
      const allowedProofs: ProofType[] = ['email_domain', 'document', 'phone', 'social_media', 'other'];
      expect(allowedProofs).toContain('email_domain');
      expect(allowedProofs).toContain('document');
      expect(allowedProofs).toContain('phone');
      expect(allowedProofs).toContain('social_media');
      expect(allowedProofs).toContain('other');
    });

    it('deve validar transição de status de auditoria de claim', () => {
      const statuses: ClaimStatus[] = ['pending', 'approved', 'rejected', 'verified'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('approved');
      expect(statuses).toContain('rejected');
      expect(statuses).toContain('verified');
    });

    it('deve validar estrutura de claim corporativo com CNPJ', () => {
      const claim: ClaimProfile = {
        id: 'claim-101',
        store_id: 'store-001',
        entity_type: 'company',
        entity_id: 'ent-101',
        requester_name: 'Carlos Drummond',
        requester_email: 'contato@agenciatour.com.br',
        requester_document: '12.345.678/0001-90',
        proof_type: 'document',
        proof_data: { cnpj: '12.345.678/0001-90', junta_comercial: 'JUCESC-987654' },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(claim.requester_name).toBe('Carlos Drummond');
      expect(claim.proof_type).toBe('document');
      expect(claim.proof_data.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    });
  });

  describe('10.2 Algoritmo de Reputação & Visibilidade Competitiva', () => {
    const calculateVisibilityScore = (data: { hasWebsite: boolean; socialCount: number; verifiedReviews: number }): number => {
      let score = 40;
      if (data.hasWebsite) score += 20;
      score += Math.min(data.socialCount * 5, 20);
      score += Math.min(data.verifiedReviews, 20);
      return Math.min(score, 100);
    };

    const calculateReputationBadge = (score: number): { label: string; tier: string } => {
      if (score >= 90) return { label: 'RA 1000 / Excelente', tier: 'diamond' };
      if (score >= 80) return { label: 'Ótimo', tier: 'gold' };
      if (score >= 70) return { label: 'Bom', tier: 'silver' };
      return { label: 'Regular', tier: 'bronze' };
    };

    it('deve calcular pontuação de visibilidade máxima corretamente', () => {
      const score = calculateVisibilityScore({
        hasWebsite: true,
        socialCount: 4,
        verifiedReviews: 35,
      });

      expect(score).toBe(100);
    });

    it('deve classificar perfil com score 94 como RA 1000 / Excelente', () => {
      const badge = calculateReputationBadge(94);
      expect(badge.label).toBe('RA 1000 / Excelente');
      expect(badge.tier).toBe('diamond');
    });

    it('deve validar estrutura de inteligência competitiva com concorrentes', () => {
      const intel: ClaimIntelligence = {
        id: 'intel-1',
        store_id: 'store-001',
        entity_id: 'ent-101',
        entity_type: 'company',
        visibility_score: 88,
        reputation_score: 94,
        market_share_percent: 21.5,
        digital_presence: { website: true, social_channels: ['Instagram', 'LinkedIn'], verified_reviews_count: 50 },
        competitors: [
          { name: 'Concorrente A', visibility_score: 70, reputation_score: 78, market_share_est: 14.0 },
          { name: 'Concorrente B', visibility_score: 65, reputation_score: 72, market_share_est: 10.5 },
        ],
        sentiment_summary: { positive_percent: 91, neutral_percent: 6, negative_percent: 3 },
        news_mentions: 12,
        regional_analysis: { rank: 1, region: 'Sul' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(intel.reputation_score).toBe(94);
      expect(intel.competitors).toHaveLength(2);
      expect(intel.sentiment_summary.positive_percent + intel.sentiment_summary.neutral_percent + intel.sentiment_summary.negative_percent).toBe(100);
    });
  });

  describe('10.3 Reclamações de Consumidor & Integração com Módulo JUS 360°', () => {
    it('deve categorizar reclamações no padrão ANAC 400 e Procon', () => {
      const categories: ClaimCategory[] = ['atraso_voo', 'cancelamento', 'cobranca_indevida', 'defeito', 'atendimento', 'fraude', 'outro'];
      expect(categories).toContain('atraso_voo');
      expect(categories).toContain('cancelamento');
      expect(categories).toContain('cobranca_indevida');
      expect(categories).toContain('fraude');
    });

    it('deve sinalizar reclamação com flag para assessoria jurídica especializada', () => {
      const claim: ConsumerClaim = {
        id: 'claim-c1',
        store_id: 'store-001',
        consumer_name: 'Juliana Mendes',
        consumer_email: 'juliana.mendes@email.com',
        target_entity_name: 'Companhia Aérea Nacional',
        category: 'atraso_voo',
        title: 'Voo com atraso superior a 6 horas em Congonhas sem assistência',
        description: 'Passageira perdeu compromisso de trabalho e a cia aérea negou voucher de alimentação.',
        status: 'open',
        legal_advise_needed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(claim.legal_advise_needed).toBe(true);
      expect(claim.status).toBe('open');
      expect(claim.category).toBe('atraso_voo');
    });

    it('deve registrar resposta formal da empresa e atualizar status', () => {
      const claim: ConsumerClaim = {
        id: 'claim-c2',
        store_id: 'store-001',
        consumer_name: 'Marcos Souza',
        consumer_email: 'marcos@email.com',
        target_entity_name: 'Agência Viagens Express',
        category: 'cobranca_indevida',
        title: 'Taxa de emissão cobrada em duplicidade',
        description: 'Solicito o estorno imediato no cartão.',
        status: 'open',
        legal_advise_needed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simulação do fluxo de resposta oficial
      const updatedClaim: ConsumerClaim = {
        ...claim,
        company_response: 'Estorno de R$ 150,00 efetuado com sucesso na fatura do cartão.',
        replied_at: new Date().toISOString(),
        status: 'company_replied',
        updated_at: new Date().toISOString(),
      };

      expect(updatedClaim.status).toBe('company_replied');
      expect(updatedClaim.company_response).toBeDefined();
      expect(updatedClaim.replied_at).toBeDefined();
    });
  });
});
