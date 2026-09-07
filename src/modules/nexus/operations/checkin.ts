export type ProcessCheckinResponse = {
  success: boolean;
  reason: string | null;
  checkin_id: string | null;
  already_used: boolean;
};

export const getCheckinErrorMessage = (reason: string | null) => {
  switch (reason) {
    case 'event_not_found':
      return 'Evento não encontrado.';
    case 'invalid_code':
      return 'Código inválido.';
    case 'ticket_not_found':
      return 'Ingresso não encontrado para este código.';
    case 'event_mismatch':
      return 'Ingresso pertence a outro evento.';
    case 'already_used':
      return 'Ingresso JÁ UTILIZADO!';
    case 'invalid_ticket_status':
      return 'Ingresso inválido para check-in.';
    default:
      return 'Falha ao processar check-in.';
  }
};
