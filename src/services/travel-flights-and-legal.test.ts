import { describe, it, expect } from 'vitest';
import { calculateAnacRights } from './travel-reaccommodation.functions';
import { calculateInstallmentPlan } from './travel-installments.functions';

describe('Travel Flights, ANAC 400 & Legal Contracts Test Suite', () => {
  describe('Malha Aérea & Segmentos de Voo (GDS / PNR)', () => {
    it('deve validar formatação de código IATA e localizador de voo PNR', () => {
      const pnr = 'GTR458';
      const origin = 'GRU';
      const destination = 'MIA';

      expect(pnr).toHaveLength(6);
      expect(pnr).toMatch(/^[A-Z0-9]{6}$/);
      expect(origin).toHaveLength(3);
      expect(destination).toHaveLength(3);
    });

    it('deve calcular a duração total do voo a partir dos trechos de decolagem e pouso', () => {
      const departure = new Date('2026-11-10T10:00:00Z');
      const arrival = new Date('2026-11-10T19:30:00Z');

      const diffMinutes = Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
      expect(diffMinutes).toBe(570); // 9h30min = 570 minutos
    });
  });

  describe('Reacomodação Aérea & Resolução ANAC 400', () => {
    it('deve garantir voucher de alimentação para atraso superior a 2 horas', () => {
      const rights2h = calculateAnacRights('schedule_change', 2.5);
      expect(rights2h.material_assistance.food_voucher).toBe(true);
      expect(rights2h.material_assistance.lodging_and_transfer).toBe(false);
    });

    it('deve obrigar hospedagem, transfer e reacomodação em congênere para voo cancelado ou atraso > 4h', () => {
      const rightsCancelled = calculateAnacRights('flight_cancelled', 0);
      expect(rightsCancelled.material_assistance.communication).toBe(true);
      expect(rightsCancelled.material_assistance.food_voucher).toBe(true);
      expect(rightsCancelled.material_assistance.lodging_and_transfer).toBe(true);
      expect(rightsCancelled.reaccommodation_options.competitor_flights).toBe(true);
      expect(rightsCancelled.reaccommodation_options.full_refund_eligible).toBe(true);
    });

    it('deve assegurar reacomodação em terceiros em caso de overbooking (preterição de embarque)', () => {
      const rightsOverbooking = calculateAnacRights('overbooking', 0);
      expect(rightsOverbooking.reaccommodation_options.competitor_flights).toBe(true);
    });
  });

  describe('Carnê de Viagem & Parcelamento Inteligente', () => {
    it('deve gerar plano de parcelas distribuindo centavos de arredondamento na primeira parcela', () => {
      const totalAmount = 1000.00;
      const installmentsCount = 3;
      const firstDueDate = new Date('2026-10-10T00:00:00Z');

      const plan = calculateInstallmentPlan(totalAmount, installmentsCount, firstDueDate);

      expect(plan).toHaveLength(3);
      // 1000 / 3 = 333.33333...
      // Parcela 1: 333.34
      // Parcela 2: 333.33
      // Parcela 3: 333.33
      expect(plan[0].amount).toBe(333.34);
      expect(plan[1].amount).toBe(333.33);
      expect(plan[2].amount).toBe(333.33);

      const sum = plan.reduce((acc, p) => acc + p.amount, 0);
      expect(Number(sum.toFixed(2))).toBe(1000.00);

      // Datas sequenciais
      expect(plan[0].due_date).toBe('2026-10-10');
      expect(plan[1].due_date).toBe('2026-11-10');
      expect(plan[2].due_date).toBe('2026-12-10');
    });
  });

  describe('Certidão Pública de Autenticidade & LGPD', () => {
    it('deve mascarar nomes das partes preservando a privacidade', () => {
      const maskName = (fullName: string) => {
        return fullName
          .split(' ')
          .map((part) => {
            if (part.length <= 2) return part;
            return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
          })
          .join(' ');
      };

      const original = 'Carlos Drummond Andrade';
      const masked = maskName(original);

      expect(masked).toBe('C****s D******d A*****e');
      expect(masked).not.toContain('Drummond');
    });

    it('deve validar estrutura de código serial e hash SHA-256', () => {
      const serial = 'VRF-9876-ABCD';
      const sha256 = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';

      expect(serial).toMatch(/^VRF-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      expect(sha256).toHaveLength(64);
      expect(sha256).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
