-- Migration: 20260905190000_eventos_enterprise_transfusion.sql
-- Description: Transplants full event management suite from persona-nexus to Wider OS
-- Tables: eventos_quadros, eventos_quadros_colunas, eventos_tarefas, eventos_orcamentos, eventos_setores, eventos_parceiros, eventos_lineup, eventos_documentos

-- ============================================================================
-- 1. EVENTOS_QUADROS (Kanban Boards for Event Project Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_quadros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL DEFAULT 'Quadro Principal de Operações',
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_quadros_evento_id ON public.eventos_quadros(evento_id);

-- ============================================================================
-- 2. EVENTOS_QUADROS_COLUNAS (Kanban Columns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_quadros_colunas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quadro_id UUID REFERENCES public.eventos_quadros(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cor_hex VARCHAR(7) DEFAULT '#6366f1',
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_quadros_colunas_quadro ON public.eventos_quadros_colunas(quadro_id);
CREATE INDEX IF NOT EXISTS idx_eventos_quadros_colunas_ordem ON public.eventos_quadros_colunas(quadro_id, ordem);

-- ============================================================================
-- 3. EVENTOS_TAREFAS (Kanban Tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coluna_id UUID REFERENCES public.eventos_quadros_colunas(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  responsavel_nome VARCHAR(255),
  data_inicio DATE,
  data_fim DATE,
  prioridade VARCHAR(50) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  ordem INT NOT NULL DEFAULT 0,
  checklist JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_tarefas_coluna ON public.eventos_tarefas(coluna_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tarefas_ordem ON public.eventos_tarefas(coluna_id, ordem);

-- ============================================================================
-- 4. VIEW: eventos_tarefas_view (Para compatibilidade perfeita com frontend)
-- ============================================================================
CREATE OR REPLACE VIEW public.eventos_tarefas_view AS
SELECT 
  t.id,
  t.coluna_id,
  t.titulo,
  t.descricao,
  t.responsavel_id,
  t.responsavel_nome,
  t.data_inicio,
  t.data_fim,
  t.prioridade,
  t.ordem,
  t.checklist,
  t.tags,
  t.created_at,
  t.updated_at,
  c.nome AS coluna_nome,
  c.cor_hex AS coluna_cor,
  q.id AS quadro_id,
  e.id AS evento_id,
  e.title AS evento_titulo,
  CASE 
    WHEN jsonb_array_length(COALESCE(t.checklist, '[]'::jsonb)) = 0 THEN 0
    ELSE ROUND(
      (
        SELECT count(*)::numeric 
        FROM jsonb_array_elements(COALESCE(t.checklist, '[]'::jsonb)) elem 
        WHERE (elem->>'concluido')::boolean = true
      ) * 100.0 / NULLIF(jsonb_array_length(COALESCE(t.checklist, '[]'::jsonb)), 0)
    )
  END AS checklist_progresso
FROM public.eventos_tarefas t
JOIN public.eventos_quadros_colunas c ON c.id = t.coluna_id
JOIN public.eventos_quadros q ON q.id = c.quadro_id
JOIN public.events e ON e.id = q.evento_id;

-- ============================================================================
-- 5. FUNCTION: init_evento_kanban (Auto-inicializa Quadro e 3 Colunas Padrão)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.init_evento_kanban(p_evento_id UUID)
RETURNS UUID AS $$
DECLARE
  v_quadro_id UUID;
BEGIN
  -- Verifica se já existe
  SELECT id INTO v_quadro_id 
  FROM public.eventos_quadros 
  WHERE evento_id = p_evento_id 
  LIMIT 1;

  IF v_quadro_id IS NULL THEN
    INSERT INTO public.eventos_quadros (evento_id, nome, descricao)
    VALUES (p_evento_id, 'Quadro Operacional', 'Gestão ágil de tarefas e entregas do evento')
    RETURNING id INTO v_quadro_id;

    -- Cria colunas padrão
    INSERT INTO public.eventos_quadros_colunas (quadro_id, nome, cor_hex, ordem)
    VALUES 
      (v_quadro_id, 'A Fazer', '#94a3b8', 0),
      (v_quadro_id, 'Em Andamento', '#3b82f6', 1),
      (v_quadro_id, 'Concluído', '#10b981', 2);
  END IF;

  RETURN v_quadro_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. EVENTOS_ORCAMENTOS (Versões de Orçamento, Fornecedores e Custos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  versao INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'rascunho',
  total_receitas DECIMAL(15,2) DEFAULT 0,
  total_despesas DECIMAL(15,2) DEFAULT 0,
  margem_lucro DECIMAL(15,2) DEFAULT 0,
  itens JSONB NOT NULL DEFAULT '[]',
  observacoes TEXT,
  aprovado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  aprovado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_eventos_orcamentos_versao UNIQUE(evento_id, versao)
);

CREATE INDEX IF NOT EXISTS idx_eventos_orcamentos_evento ON public.eventos_orcamentos(evento_id);

-- ============================================================================
-- 7. EVENTOS_SETORES (Setores, Áreas e Capacidades)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  capacidade INT,
  cor_hex VARCHAR(7) DEFAULT '#6366f1',
  coordenadas JSONB DEFAULT '{}',
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_setores_evento ON public.eventos_setores(evento_id);

-- ============================================================================
-- 8. EVENTOS_PARCEIROS (Patrocinadores, Apoiadores e Cotas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'apoio',
  nivel VARCHAR(50) DEFAULT 'prata',
  logo_url TEXT,
  site_url TEXT,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_parceiros_evento ON public.eventos_parceiros(evento_id);

-- ============================================================================
-- 9. EVENTOS_LINEUP (Artistas, Palcos e Programação)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_lineup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  nome_artista VARCHAR(255) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  horario_inicio TIMESTAMPTZ,
  horario_fim TIMESTAMPTZ,
  palco VARCHAR(100),
  bio TEXT,
  imagem_url TEXT,
  redes_sociais JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_lineup_evento ON public.eventos_lineup(evento_id);

-- ============================================================================
-- 10. EVENTOS_DOCUMENTOS (Alvarás, Contratos e Licenças)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eventos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'outro',
  arquivo_url TEXT NOT NULL,
  data_validade DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_documentos_evento ON public.eventos_documentos(evento_id);

-- Habilita RLS em todas as tabelas
ALTER TABLE public.eventos_quadros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_quadros_colunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_documentos ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Simplificadas para Membros Autenticados
DO $$
BEGIN
  -- quadros
  DROP POLICY IF EXISTS "eventos_quadros_auth" ON public.eventos_quadros;
  CREATE POLICY "eventos_quadros_auth" ON public.eventos_quadros FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  -- colunas
  DROP POLICY IF EXISTS "eventos_quadros_colunas_auth" ON public.eventos_quadros_colunas;
  CREATE POLICY "eventos_quadros_colunas_auth" ON public.eventos_quadros_colunas FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- tarefas
  DROP POLICY IF EXISTS "eventos_tarefas_auth" ON public.eventos_tarefas;
  CREATE POLICY "eventos_tarefas_auth" ON public.eventos_tarefas FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- orcamentos
  DROP POLICY IF EXISTS "eventos_orcamentos_auth" ON public.eventos_orcamentos;
  CREATE POLICY "eventos_orcamentos_auth" ON public.eventos_orcamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- setores
  DROP POLICY IF EXISTS "eventos_setores_auth" ON public.eventos_setores;
  CREATE POLICY "eventos_setores_auth" ON public.eventos_setores FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- parceiros
  DROP POLICY IF EXISTS "eventos_parceiros_auth" ON public.eventos_parceiros;
  CREATE POLICY "eventos_parceiros_auth" ON public.eventos_parceiros FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- lineup
  DROP POLICY IF EXISTS "eventos_lineup_auth" ON public.eventos_lineup;
  CREATE POLICY "eventos_lineup_auth" ON public.eventos_lineup FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- documentos
  DROP POLICY IF EXISTS "eventos_documentos_auth" ON public.eventos_documentos;
  CREATE POLICY "eventos_documentos_auth" ON public.eventos_documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
