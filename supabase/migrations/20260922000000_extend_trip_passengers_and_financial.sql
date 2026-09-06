-- ========================================================================================
-- MIGRAÇÃO: EXTENSÃO DE PASSAGEIROS & FINANCEIRO DA VIAGEM
-- Adiciona suporte a Validade de Documentos (< 6 meses de embarque), Regras Tarifárias,
-- Formas de Pagamento, Boletos e Contatos B2B da Operadora.
-- ========================================================================================

-- 1. Extensão de trip_passengers
ALTER TABLE public.trip_passengers
  ADD COLUMN IF NOT EXISTS document_type       text DEFAULT 'rg',
  ADD COLUMN IF NOT EXISTS document_expiry     date,
  ADD COLUMN IF NOT EXISTS nationality         text DEFAULT 'Brasileira',
  ADD COLUMN IF NOT EXISTS documents_metadata  jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_trip_passengers_expiry ON public.trip_passengers(document_expiry);

-- 2. Extensão de tourism_trips
ALTER TABLE public.tourism_trips
  ADD COLUMN IF NOT EXISTS operator_name       text,
  ADD COLUMN IF NOT EXISTS operator_contacts   jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tariff_rules        jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_method      text,
  ADD COLUMN IF NOT EXISTS installments_count  integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS financial_details   jsonb DEFAULT '{}'::jsonb;

-- 3. Trigger opcional para propagar metadados de documento para o cliente (CRM)
CREATE OR REPLACE FUNCTION public.propagate_passenger_document_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _customer_id uuid;
BEGIN
  -- Encontra o customer_id da viagem vinculada
  SELECT customer_id INTO _customer_id
  FROM public.tourism_trips
  WHERE id = NEW.trip_id;

  IF _customer_id IS NOT NULL AND NEW.document IS NOT NULL THEN
    UPDATE public.profiles
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'last_document_type', NEW.document_type,
      'last_document_number', NEW.document,
      'last_document_expiry', NEW.document_expiry,
      'last_updated_at', now()
    )
    WHERE id = _customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_propagate_passenger_document ON public.trip_passengers;
CREATE TRIGGER trg_propagate_passenger_document
  AFTER INSERT OR UPDATE ON public.trip_passengers
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_passenger_document_to_client();
