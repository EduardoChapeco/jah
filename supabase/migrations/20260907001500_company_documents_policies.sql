-- ============================================================================
-- Migration: 20260907001500_company_documents_policies.sql
-- Módulo de Documentos Corporativos, Manuais & Políticas para Colaboradores (Wider/JAH)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'geral' CHECK (category IN ('politica', 'manual', 'procedimento', 'formulario', 'geral')),
  file_url            TEXT,
  file_name           TEXT,
  file_type           TEXT,
  file_size           INT,
  is_required_reading BOOLEAN NOT NULL DEFAULT false,
  version             TEXT NOT NULL DEFAULT '1.0',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_documents_store ON public.company_documents(store_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_category ON public.company_documents(category);

CREATE TABLE IF NOT EXISTS public.company_document_reads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.company_documents(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_doc_reads UNIQUE(document_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_company_doc_reads_employee ON public.company_document_reads(employee_id);

-- RLS Deny by Default
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_document_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores e gestores visualizam documentos da loja"
  ON public.company_documents FOR SELECT
  USING (true);

CREATE POLICY "Gestores criam e atualizam documentos"
  ON public.company_documents FOR ALL
  USING (true);

CREATE POLICY "Colaboradores registram leitura"
  ON public.company_document_reads FOR ALL
  USING (true);
