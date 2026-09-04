import { describe, it, expect } from 'vitest';
import { ModuleAuditor } from './module-auditor';

describe('ONDA 6.2: VERIFICAÇÃO DE SANIDADE PELO MODULE AUDITOR', () => {
  it('deve auditar um workspace simulado e retornar score e capacidades coerentes', async () => {
    // Mock do Supabase Client para teste de sanidade estrito em runtime
    const mockClient: any = {
      from: (table: string) => {
        return {
          select: (cols: string, opts?: any) => {
            return {
              eq: (field: string, val: any) => {
                if (table === 'stores') {
                  return {
                    maybeSingle: async () => ({
                      data: {
                        id: 'store-123',
                        name: 'Restaurante Exemplo JAH',
                        slug: 'restaurante-exemplo',
                        phone: '11999998888',
                        document: '11222333000181',
                        settings: {},
                        is_active: true,
                      },
                      error: null,
                    }),
                  };
                }

                // Tabelas com count
                return {
                  eq: () => ({ count: 5, data: [], error: null }),
                  count: 5,
                  data: [],
                  error: null,
                };
              },
            };
          },
        };
      },
    };

    const report = await ModuleAuditor.auditStoreWorkspace('store-123', 'gastronomia', mockClient);

    expect(report.storeId).toBe('store-123');
    expect(report.niche).toBe('gastronomia');
    expect(report.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.healthScore).toBeLessThanOrEqual(100);
    expect(report.status).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(typeof report.capabilities.canReceiveOrders).toBe('boolean');
  });
});
