-- 20260829120000_wipe_mock_seeds_and_enforce_clean_state.sql
-- Limpeza absoluta de qualquer dado de seed/mock em vagas, turismo e dados de teste.
-- Garante que o banco opere com 100% de dados reais e Empty States honestos.

DO $$
BEGIN
  -- 1. Remover candidaturas vinculadas a vagas de seed
  BEGIN
    DELETE FROM public.job_applications
    WHERE job_id IN (
      SELECT id FROM public.jobs
      WHERE id::text LIKE 'e0000000-%'
         OR company_name ILIKE '%TechOeste%'
         OR company_name ILIKE '%AgroIndustrial%'
         OR company_name ILIKE '%Studio Criativo Oeste%'
         OR company_name ILIKE '%Clínica Integrada%'
         OR company_name ILIKE '%Express Logística%'
         OR company_name ILIKE '%Bistrô & Cafeteria São Cristóvão%'
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 2. Remover vagas de seed/mock
  BEGIN
    DELETE FROM public.jobs
    WHERE id::text LIKE 'e0000000-%'
       OR company_name ILIKE '%TechOeste%'
       OR company_name ILIKE '%AgroIndustrial%'
       OR company_name ILIKE '%Studio Criativo Oeste%'
       OR company_name ILIKE '%Clínica Integrada%'
       OR company_name ILIKE '%Express Logística%'
       OR company_name ILIKE '%Bistrô & Cafeteria São Cristóvão%';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 3. Remover reservas de turismo vinculadas a experiências de seed
  BEGIN
    DELETE FROM public.tourism_bookings
    WHERE experience_id IN (
      SELECT id FROM public.tourism_experiences
      WHERE id::text LIKE 'b0000000-%'
         OR title ILIKE '%Catamarã%'
         OR title ILIKE '%Rota das Cachoeiras%'
         OR title ILIKE '%Trilha Ecológica%'
    );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 4. Remover experiências de turismo de seed/mock
  BEGIN
    DELETE FROM public.tourism_experiences
    WHERE id::text LIKE 'b0000000-%'
       OR title ILIKE '%Catamarã%'
       OR title ILIKE '%Rota das Cachoeiras%'
       OR title ILIKE '%Trilha Ecológica%';
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
