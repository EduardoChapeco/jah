-- ============================================================================
-- Jah Commerce — Migration 0083: Builder CMS RLS Hardening
-- ============================================================================
-- Ativação das regras de acesso completo para gravação, edição e deleção
-- de Nós (Nodes), Versões (Versions) e Documentos (Documents) do CMS,
-- garantindo End-to-End Tenancy Isolation via PostgreSQL RLS.
-- ============================================================================

BEGIN;

  -- 1. Experience Documents Write Access
  DROP POLICY IF EXISTS "Team can write experience_documents" ON public.experience_documents;
  
  CREATE POLICY "Team can write experience_documents"
    ON public.experience_documents FOR ALL
    USING (
      store_id IN (
        SELECT store_id FROM public.workspace_members
        WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
      )
    )
    WITH CHECK (
      store_id IN (
        SELECT store_id FROM public.workspace_members
        WHERE profile_id = auth.uid() AND role IN ('owner', 'admin', 'manager', 'content')
      )
    );

  -- 2. Experience Versions Write Access
  DROP POLICY IF EXISTS "Team can write experience_versions" ON public.experience_versions;
  
  CREATE POLICY "Team can write experience_versions"
    ON public.experience_versions FOR ALL
    USING (
      document_id IN (
        SELECT ed.id FROM public.experience_documents ed
        JOIN public.workspace_members wm ON wm.store_id = ed.store_id
        WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin', 'manager', 'content')
      )
    )
    WITH CHECK (
      document_id IN (
        SELECT ed.id FROM public.experience_documents ed
        JOIN public.workspace_members wm ON wm.store_id = ed.store_id
        WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin', 'manager', 'content')
      )
    );

  -- 3. Experience Nodes Write Access
  DROP POLICY IF EXISTS "Team can write experience_nodes" ON public.experience_nodes;
  
  CREATE POLICY "Team can write experience_nodes"
    ON public.experience_nodes FOR ALL
    USING (
      version_id IN (
        SELECT ev.id FROM public.experience_versions ev
        JOIN public.experience_documents ed ON ed.id = ev.document_id
        JOIN public.workspace_members wm ON wm.store_id = ed.store_id
        WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin', 'manager', 'content')
      )
    )
    WITH CHECK (
      version_id IN (
        SELECT ev.id FROM public.experience_versions ev
        JOIN public.experience_documents ed ON ed.id = ev.document_id
        JOIN public.workspace_members wm ON wm.store_id = ed.store_id
        WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin', 'manager', 'content')
      )
    );

COMMIT;
