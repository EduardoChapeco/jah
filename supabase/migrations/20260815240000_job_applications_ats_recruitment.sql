-- Migration: 20260815240000_job_applications_ats_recruitment.sql
-- Expansão do ATS de Vagas com Pipeline Kanban, Agendador de Entrevistas e Contratação

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS rating INT CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS interview_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interview_meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS hired_role TEXT,
  ADD COLUMN IF NOT EXISTS hired_salary_cents BIGINT;

-- Atualizar constraint de status para suportar interview_scheduled
ALTER TABLE public.job_applications 
  DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_status_check 
  CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'approved', 'rejected', 'hired'));

-- Policy de update para o dono da vaga
DROP POLICY IF EXISTS "store_owners_manage_job_applications" ON public.job_applications;

CREATE POLICY "store_owners_manage_job_applications"
  ON public.job_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = public.job_applications.job_id
        AND j.author_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = public.job_applications.job_id
        AND j.author_profile_id = auth.uid()
    )
  );
