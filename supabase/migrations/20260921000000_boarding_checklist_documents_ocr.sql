-- ========================================================================================
-- MIGRAÇÃO: SISTEMA COMPLETO DE EMBARQUES — CALENDÁRIO, CHECKLISTS, DOCUMENTOS E OCR
-- Para Agências de Turismo: controle completo do ciclo pré/durante/pós viagem
-- ========================================================================================

-- ── 1. ENRIQUECIMENTO DO KANBAN DE EMBARQUES EXISTENTE ──
-- Adicionar colunas que faltam sem destruir dados existentes

ALTER TABLE public.travel_departures_kanban
  ADD COLUMN IF NOT EXISTS trip_id            uuid,
  ADD COLUMN IF NOT EXISTS airline_code       text,
  ADD COLUMN IF NOT EXISTS flight_number      text,
  ADD COLUMN IF NOT EXISTS airline_locator    text,          -- PNR/localizador
  ADD COLUMN IF NOT EXISTS checkin_link       text,          -- link de check-in da CIA
  ADD COLUMN IF NOT EXISTS hotel_name         text,
  ADD COLUMN IF NOT EXISTS hotel_checkin_at   timestamptz,
  ADD COLUMN IF NOT EXISTS hotel_checkout_at  timestamptz,
  ADD COLUMN IF NOT EXISTS hotel_rules        text,          -- regras do hotel (cancelamento, pets, etc.)
  ADD COLUMN IF NOT EXISTS return_date        timestamptz,
  ADD COLUMN IF NOT EXISTS destination_type   text NOT NULL DEFAULT 'domestic'
                                              CHECK (destination_type IN ('domestic', 'international', 'cruise')),
  ADD COLUMN IF NOT EXISTS checklist_completed_pct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_urgent_alert   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_message      text;

-- Índices
CREATE INDEX IF NOT EXISTS idx_departures_departure_date ON public.travel_departures_kanban(departure_date);
CREATE INDEX IF NOT EXISTS idx_departures_store_stage ON public.travel_departures_kanban(store_id, stage);

-- ── 2. TABELA DE ITENS DE CHECKLIST POR EMBARQUE ──
-- Cada card de embarque pode ter N itens de checklist rastreáveis
CREATE TABLE IF NOT EXISTS public.boarding_checklist_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  departure_id        uuid NOT NULL REFERENCES public.travel_departures_kanban(id) ON DELETE CASCADE,

  category            text NOT NULL DEFAULT 'documentation'
                      CHECK (category IN (
                        'documentation',      -- Passaporte, visto, CNH
                        'health',             -- Vacinas, atestados
                        'insurance',          -- Seguro viagem
                        'financial',          -- Taxas de governo, impostos
                        'logistics',          -- Transfer, bagagem, assento
                        'communication',      -- WhatsApp enviado, contrato enviado
                        'airline',            -- Check-in aéreo feito
                        'hotel',              -- Voucher de hotel enviado
                        'custom'              -- Item personalizado
                      )),

  label               text NOT NULL,           -- Descrição do item
  notes               text,                    -- Observação interna
  is_completed        boolean NOT NULL DEFAULT false,
  completed_at        timestamptz,
  completed_by_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_days_before     integer,                 -- Quantos dias antes do embarque este item deve ser feito
  attachment_url      text,                    -- Comprovante/documento vinculado
  is_required         boolean NOT NULL DEFAULT true,
  sort_order          integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_departure ON public.boarding_checklist_items(departure_id);
CREATE INDEX IF NOT EXISTS idx_checklist_category  ON public.boarding_checklist_items(category);

-- ── 3. TABELA DE DOCUMENTOS DO EMBARQUE (para OCR e gestão) ──
CREATE TABLE IF NOT EXISTS public.boarding_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  departure_id        uuid NOT NULL REFERENCES public.travel_departures_kanban(id) ON DELETE CASCADE,

  document_type       text NOT NULL DEFAULT 'other'
                      CHECK (document_type IN (
                        'contract',           -- Contrato/reserva do pacote
                        'airline_ticket',     -- Bilhete aéreo
                        'hotel_voucher',      -- Voucher de hotel
                        'insurance_policy',   -- Apólice de seguro
                        'passport_copy',      -- Cópia do passaporte
                        'visa_stamp',         -- Visto/carimbo
                        'vaccine_card',       -- Cartão de vacinas
                        'invoice',            -- Nota fiscal
                        'transfer_voucher',   -- Voucher de transfer
                        'other'
                      )),

  file_url            text NOT NULL,           -- URL do arquivo no storage
  file_name           text,
  file_size_bytes     integer,
  mime_type           text,

  -- Resultado do OCR (quando aplicável)
  ocr_status          text NOT NULL DEFAULT 'pending'
                      CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'not_applicable')),
  ocr_extracted_data  jsonb DEFAULT '{}'::jsonb,  -- dados extraídos pelo OCR
  ocr_confidence      numeric(4,3),               -- 0.000 a 1.000

  -- Dados extraídos do documento (preenchidos após OCR ou manualmente)
  passenger_name      text,
  passenger_document  text,
  valid_until         date,
  issuing_country     text,
  booking_reference   text,

  uploaded_by_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boarding_docs_departure ON public.boarding_documents(departure_id);
CREATE INDEX IF NOT EXISTS idx_boarding_docs_type      ON public.boarding_documents(document_type);

-- ── 4. TEMPLATE DE CHECKLIST POR TIPO DE DESTINO ──
-- Permite a agência criar checklists-padrão que são aplicados automaticamente
CREATE TABLE IF NOT EXISTS public.boarding_checklist_templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name                text NOT NULL,
  destination_type    text NOT NULL DEFAULT 'international'
                      CHECK (destination_type IN ('domestic', 'international', 'cruise', 'all')),
  is_default          boolean NOT NULL DEFAULT false,
  items               jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array de { label, category, due_days_before, is_required }
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_store ON public.boarding_checklist_templates(store_id);

-- ── 5. RLS POLICIES ──
ALTER TABLE public.boarding_checklist_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_documents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_checklist_templates     ENABLE ROW LEVEL SECURITY;

-- Checklist items
CREATE POLICY "store_members_manage_boarding_checklist"
  ON public.boarding_checklist_items FOR ALL TO authenticated
  USING (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','platform_admin'))
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','platform_admin'))
  );

-- Boarding documents
CREATE POLICY "store_members_manage_boarding_documents"
  ON public.boarding_documents FOR ALL TO authenticated
  USING (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','platform_admin'))
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','platform_admin'))
  );

-- Checklist templates
CREATE POLICY "store_members_manage_checklist_templates"
  ON public.boarding_checklist_templates FOR ALL TO authenticated
  USING (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','platform_admin'))
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM public.workspace_members WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','platform_admin'))
  );

-- ── 6. INSERIR TEMPLATES PADRÃO DE CHECKLIST ──
-- (Serão inseridos em runtime via BFF quando uma nova loja ativa turismo)

COMMENT ON TABLE public.boarding_checklist_items IS
  'Itens de checklist individuais por embarque: documentação, saúde, seguro, taxas, check-in aéreo, vouchers. Cada item pode ter comprovante anexado.';

COMMENT ON TABLE public.boarding_documents IS
  'Documentos digitalizados do embarque com suporte a OCR: contratos, bilhetes, vouchers, passaportes. Os dados extraídos são armazenados em ocr_extracted_data JSONB.';

COMMENT ON TABLE public.boarding_checklist_templates IS
  'Templates reutilizáveis de checklist por tipo de destino (nacional, internacional, cruzeiro). Aplicados automaticamente ao criar um novo embarque.';

COMMENT ON COLUMN public.travel_departures_kanban.checkin_link IS
  'URL de check-in online da CIA aérea para este embarque. Gerado automaticamente pela combinação airline_code + departure_date quando possível.';
