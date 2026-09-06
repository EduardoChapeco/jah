-- ========================================================================================
-- MIGRAÇÃO: TICKETS DE INCIDENTES TURÍSTICOS E LINHA DO TEMPO DE EVENTOS
-- Sistema de gestão de incidentes para AGÊNCIAS DE TURISMO (não CIAs aéreas)
-- Cada incidente tem: tipo, passageiro, booking, protocolo CIA, direitos ANAC, timeline
-- ========================================================================================

-- ── 1. TABELA PRINCIPAL: TICKETS DE INCIDENTES TURÍSTICOS ──
CREATE TABLE IF NOT EXISTS public.tourism_incident_tickets (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  opened_by_profile_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Tipo e Criticidade
  incident_type           text NOT NULL DEFAULT 'flight_change'
                          CHECK (incident_type IN (
                            'flight_change',
                            'flight_cancellation',
                            'overbooking',
                            'connection_lost',
                            'schedule_change',
                            'hotel_issue',
                            'transfer_delay',
                            'visa_issue',
                            'other'
                          )),
  priority                text NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status                  text NOT NULL DEFAULT 'open'
                          CHECK (status IN (
                            'open',
                            'in_analysis',
                            'awaiting_airline',
                            'awaiting_client',
                            'resolved',
                            'closed'
                          )),

  -- Passageiro e Reserva
  passenger_name          text,
  passenger_contact       text,
  booking_reference       text,
  trip_id                 uuid,  -- FK para viagem/excursão (sem FK hard para não travar)

  -- Vínculo com sistema de reacomodação ANAC (tabela preservada)
  flight_change_case_id   uuid REFERENCES public.travel_flight_change_cases(id) ON DELETE SET NULL,

  -- Protocolo da CIA Aérea / Fornecedor
  airline_protocol_number text,
  airline_code            text,
  origin_flight_number    text,

  -- Direitos Regulatórios (calculados automaticamente para incidentes de voo)
  anac_rights_summary     jsonb DEFAULT '{}'::jsonb,

  -- Descrição inicial e notas
  description             text,
  internal_notes          text,

  -- Resolução
  resolution_type         text
                          CHECK (resolution_type IS NULL OR resolution_type IN (
                            'rebooking',
                            'refund',
                            'voucher',
                            'upgrade',
                            'no_action',
                            'other'
                          )),
  resolved_at             timestamptz,

  -- Metadados
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 2. TABELA DE LINHA DO TEMPO (EVENTS) ──
-- Registra cada ação/evento do ciclo de vida do incidente
CREATE TABLE IF NOT EXISTS public.tourism_incident_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id             uuid NOT NULL REFERENCES public.tourism_incident_tickets(id) ON DELETE CASCADE,
  created_by_profile_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  event_type              text NOT NULL DEFAULT 'note'
                          CHECK (event_type IN (
                            'opened',             -- Incidente aberto
                            'status_change',      -- Mudança de status
                            'airline_contact',    -- Contato com CIA aérea
                            'client_contact',     -- Contato com passageiro/cliente
                            'anac_rights_sent',   -- Direitos ANAC comunicados ao passageiro
                            'rebooking_offer',    -- Oferta de reacomodação enviada
                            'client_accepted',    -- Cliente aceitou alternativa
                            'client_rejected',    -- Cliente recusou alternativa
                            'protocol_received',  -- Protocolo da CIA recebido
                            'refund_initiated',   -- Reembolso iniciado
                            'resolved',           -- Incidente resolvido
                            'note'                -- Nota interna
                          )),

  description             text NOT NULL,
  metadata                jsonb DEFAULT '{}'::jsonb,  -- dados extras (ex: novo status, protocolo, etc.)

  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 3. ÍNDICES DE PERFORMANCE ──
CREATE INDEX IF NOT EXISTS idx_tourism_incidents_store      ON public.tourism_incident_tickets(store_id);
CREATE INDEX IF NOT EXISTS idx_tourism_incidents_status     ON public.tourism_incident_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tourism_incidents_priority   ON public.tourism_incident_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tourism_incidents_type       ON public.tourism_incident_tickets(incident_type);
CREATE INDEX IF NOT EXISTS idx_tourism_incidents_trip       ON public.tourism_incident_tickets(trip_id);
CREATE INDEX IF NOT EXISTS idx_tourism_events_incident      ON public.tourism_incident_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_tourism_events_created       ON public.tourism_incident_events(created_at);

-- ── 4. ROW LEVEL SECURITY — DENY BY DEFAULT ──
ALTER TABLE public.tourism_incident_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_incident_events   ENABLE ROW LEVEL SECURITY;

-- Política: membros da loja gerenciam incidentes da sua loja
CREATE POLICY "workspace_members_manage_tourism_incidents"
  ON public.tourism_incident_tickets
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'platform_admin')
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM public.workspace_members
      WHERE profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'platform_admin')
    )
  );

-- Política: eventos visíveis para membros da loja do incidente pai
CREATE POLICY "workspace_members_manage_tourism_incident_events"
  ON public.tourism_incident_events
  FOR ALL
  TO authenticated
  USING (
    incident_id IN (
      SELECT id FROM public.tourism_incident_tickets
      WHERE store_id IN (
        SELECT store_id FROM public.workspace_members
        WHERE profile_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'platform_admin')
    )
  )
  WITH CHECK (
    incident_id IN (
      SELECT id FROM public.tourism_incident_tickets
      WHERE store_id IN (
        SELECT store_id FROM public.workspace_members
        WHERE profile_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'platform_admin')
    )
  );

-- ── 5. TRIGGER: updated_at automático ──
CREATE OR REPLACE FUNCTION public.set_tourism_incident_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tourism_incidents_updated_at ON public.tourism_incident_tickets;
CREATE TRIGGER trg_tourism_incidents_updated_at
  BEFORE UPDATE ON public.tourism_incident_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_tourism_incident_updated_at();

-- ── 6. COMENTÁRIOS DE DOCUMENTAÇÃO ──
COMMENT ON TABLE public.tourism_incident_tickets IS
  'Tickets de incidentes turísticos para agências: voos cancelados, reacomodações, problemas de hotel, etc. Cada ticket tem uma linha do tempo de eventos (tourism_incident_events).';

COMMENT ON TABLE public.tourism_incident_events IS
  'Linha do tempo cronológica de um incidente turístico: registra cada ação, contato com CIA, resposta do cliente, comunicação de direitos ANAC, etc.';

COMMENT ON COLUMN public.tourism_incident_tickets.flight_change_case_id IS
  'FK opcional para travel_flight_change_cases — preserva o módulo de reacomodação ANAC como dado complementar do ticket.';

COMMENT ON COLUMN public.tourism_incident_tickets.anac_rights_summary IS
  'JSONB calculado automaticamente para incidentes de voo conforme Resolução ANAC 400/2016: assistência material, opções de reacomodação e reembolso.';
