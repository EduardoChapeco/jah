import { describe, expect, it } from 'vitest';
import { getCheckinErrorMessage } from './checkin';

describe('getCheckinErrorMessage', () => {
  it('maps known reasons', () => {
    expect(getCheckinErrorMessage('already_used')).toBe('Ingresso JÁ UTILIZADO!');
    expect(getCheckinErrorMessage('event_mismatch')).toBe('Ingresso pertence a outro evento.');
    expect(getCheckinErrorMessage('ticket_not_found')).toBe('Ingresso não encontrado para este código.');
  });

  it('uses fallback for unknown reasons', () => {
    expect(getCheckinErrorMessage('whatever')).toBe('Falha ao processar check-in.');
    expect(getCheckinErrorMessage(null)).toBe('Falha ao processar check-in.');
  });
});
