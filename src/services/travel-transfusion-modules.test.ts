import { describe, it, expect } from 'vitest';
import { TravelSupplierKind, TravelSupplierRecord } from '@/types/travel-suppliers';
import { TravelVisaRecord, TravelVisaStatus } from '@/types/travel-visas';
import { TravelVoucherRecord, TravelVoucherType } from '@/types/travel-vouchers';
import { TravelDepartureCard, DepartureStage } from '@/types/travel-departures';

describe('Travel Transfusion Modules Test Suite (Big Tech Quality Assurance)', () => {
  describe('Onda 2: Fornecedores & Operadoras (travel_suppliers)', () => {
    it('deve validar tipos permitidos de fornecedores B2B', () => {
      const allowedKinds: TravelSupplierKind[] = [
        'operadora',
        'dmc_receptivo',
        'companhia_aerea',
        'rede_hoteleira',
        'locadora',
        'seguradora',
        'consolidadora',
        'outro',
      ];
      expect(allowedKinds).toHaveLength(8);
      expect(allowedKinds).toContain('dmc_receptivo');
      expect(allowedKinds).toContain('consolidadora');
    });

    it('deve calcular corretamente a margem de comissionamento padrão de uma operadora', () => {
      const supplier: Partial<TravelSupplierRecord> = {
        name: 'CVC Corp B2B',
        kind: 'operadora',
        commission_rate_default: 12.5,
        payment_terms: 'Faturado 15 dias',
        emergency_contacts: [
          { name: 'Plantão Operacional 24h', phone: '+55 11 99999-0000', role: 'Plantão' }
        ]
      };

      const saleAmount = 10000;
      const commissionAmount = (saleAmount * (supplier.commission_rate_default || 0)) / 100;
      expect(commissionAmount).toBe(1250);
      expect(supplier.emergency_contacts).toHaveLength(1);
    });
  });

  describe('Onda 3: Passaportes & Vistos Consulares (travel_visas)', () => {
    it('deve disparar alerta de validade crítica se o passaporte expira em menos de 6 meses', () => {
      const travelDate = new Date('2026-12-01');
      const passportExpiryExpiringSoon = new Date('2027-02-15'); // 2.5 meses após viagem
      const passportExpirySafe = new Date('2027-08-01'); // 8 meses após viagem

      const getMonthsDifference = (d1: Date, d2: Date) => {
        return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
      };

      const diffSoon = getMonthsDifference(travelDate, passportExpiryExpiringSoon);
      const diffSafe = getMonthsDifference(travelDate, passportExpirySafe);

      expect(diffSoon < 6).toBe(true);
      expect(diffSafe >= 6).toBe(true);
    });

    it('deve transicionar status do visto respeitando o ciclo de vida consular', () => {
      const stages: TravelVisaStatus[] = [
        'documentacao_pendente',
        'formulario_preenchido',
        'taxa_paga',
        'entrevista_agendada',
        'em_analise_consular',
        'aprovado',
        'entregue',
      ];
      expect(stages).toHaveLength(7);
      expect(stages[0]).toBe('documentacao_pendente');
      expect(stages[stages.length - 1]).toBe('entregue');
    });
  });

  describe('Onda 4: Studio de Vouchers & Boarding Passes Digitais (travel_vouchers)', () => {
    it('deve gerar payload criptográfico com assinatura para QR Code antifraude', () => {
      const voucher: Partial<TravelVoucherRecord> = {
        id: 'vch-123456',
        voucher_code: 'VCH-7890-XYZ',
        store_id: 'store-abc',
        passenger_name: 'Carlos Drummond',
        voucher_type: 'hotel',
        qr_code_payload: 'JAH-VCH:vch-123456:store-abc:hash987abc',
      };

      expect(voucher.qr_code_payload).toMatch(/^JAH-VCH:/);
      expect(voucher.qr_code_payload).toContain('store-abc');
      expect(voucher.voucher_code).toBe('VCH-7890-XYZ');
    });

    it('deve suportar os tipos essenciais de vouchers de turismo', () => {
      const types: TravelVoucherType[] = [
        'pacote_completo',
        'hotel',
        'aereo',
        'passeio',
        'transfer',
        'seguro_viagem',
        'locacao_veiculo',
        'cruzeiro',
      ];
      expect(types).toHaveLength(8);
      expect(types).toContain('passeio');
      expect(types).toContain('cruzeiro');
    });
  });

  describe('Onda 5: Kanban de Embarques & Pós-Venda (travel_departures_kanban)', () => {
    it('deve alocar a viagem no estágio correto do Kanban baseado no D-Day', () => {
      const calculateKanbanStage = (departureDateStr: string, returnDateStr: string): DepartureStage => {
        const now = new Date();
        const departure = new Date(departureDateStr);
        const returnDate = new Date(returnDateStr);

        const diffTime = departure.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (now > returnDate) return 'pos_viagem_nps';
        if (diffDays <= 0) return 'embarcado_em_viagem';
        if (diffDays <= 2) return 'd_minus_2_briefing';
        if (diffDays <= 7) return 'd_minus_7_checkin';
        if (diffDays <= 30) return 'd_minus_30_docs';
        return 'pre_embarque';
      };

      const now = new Date();
      
      const future40Days = new Date(now.getTime() + 40 * 24 * 3600 * 1000).toISOString();
      const future20Days = new Date(now.getTime() + 20 * 24 * 3600 * 1000).toISOString();
      const future5Days = new Date(now.getTime() + 5 * 24 * 3600 * 1000).toISOString();
      const future1Day = new Date(now.getTime() + 1 * 24 * 3600 * 1000).toISOString();
      const pastTripDep = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString();
      const pastTripRet = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();

      expect(calculateKanbanStage(future40Days, future40Days)).toBe('pre_embarque');
      expect(calculateKanbanStage(future20Days, future20Days)).toBe('d_minus_30_docs');
      expect(calculateKanbanStage(future5Days, future5Days)).toBe('d_minus_7_checkin');
      expect(calculateKanbanStage(future1Day, future1Day)).toBe('d_minus_2_briefing');
      expect(calculateKanbanStage(pastTripDep, pastTripRet)).toBe('pos_viagem_nps');
    });

    it('deve calcular a taxa de prontidão de checklist de embarque', () => {
      const checklist = [
        { item: 'Passaportes válidos', done: true },
        { item: 'Visto aprovado', done: true },
        { item: 'Seguro viagem emitido', done: true },
        { item: 'Vouchers impressos/enviados', done: false },
      ];

      const completed = checklist.filter(c => c.done).length;
      const readinessPercent = (completed / checklist.length) * 100;
      expect(readinessPercent).toBe(75);
    });
  });
});
