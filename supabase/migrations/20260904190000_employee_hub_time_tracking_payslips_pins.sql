-- ============================================================================
-- Jah Commerce — Migration 20260904190000: Hub do Colaborador & Ponto Eletrônico
-- ============================================================================
-- Microfase 1.1:
--  - hr_departments & hr_positions
--  - employees
--  - employee_time_entries (com geolocalização JSONB, IP e auditoria)
--  - employee_payslips (com breakdown salarial, descontos e PDF)
--  - employee_requests (vales, adiantamentos, férias e atestados com workflow)
--  - employee_pins, employee_context_sessions & employee_pin_audit_logs
--  - RLS atômico multi-tenant por store_id com isolamento para colaborador e gestor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS  pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. hr_departments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_hr_departments_store_name UNIQUE (store_id, name)
);

CREATE INDEX IF NOT EXISTS idx_hr_departments_store ON public.hr_departments(store_id);

-- ---------------------------------------------------------------------------
-- 2. hr_positions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_positions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id               UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  department_id          UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  title                  TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  cbo_code               TEXT, -- Classificação Brasileira de Ocupações
  salary_range_min_cents INT,
  salary_range_max_cents INT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_hr_positions_store_title UNIQUE (store_id, title)
);

CREATE INDEX IF NOT EXISTS idx_hr_positions_store ON public.hr_positions(store_id);
CREATE INDEX IF NOT EXISTS idx_hr_positions_dept ON public.hr_positions(department_id);

-- ---------------------------------------------------------------------------
-- 3. employees
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  profile_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name          TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 200),
  cpf_masked         TEXT,
  cpf_hash           TEXT,
  email              TEXT,
  phone              TEXT,
  department_id      UUID REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  position_id        UUID REFERENCES public.hr_positions(id) ON DELETE SET NULL,
  job_title          TEXT NOT NULL CHECK (char_length(job_title) BETWEEN 1 AND 120),
  employment_type    TEXT NOT NULL DEFAULT 'clt' 
                       CHECK (employment_type IN ('clt', 'pj', 'internship', 'apprentice', 'temporary', 'freelancer')),
  status             TEXT NOT NULL DEFAULT 'active' 
                       CHECK (status IN ('active', 'on_leave', 'vacation', 'terminated', 'suspended')),
  base_salary_cents  INT NOT NULL DEFAULT 0 CHECK (base_salary_cents >= 0),
  hire_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date   DATE,
  work_schedule      JSONB NOT NULL DEFAULT '{"weekly_hours": 44, "days": ["seg", "ter", "qua", "qui", "sex"], "daily_hours": 8.8, "flexible": false}'::jsonb,
  emergency_contact  JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_store ON public.employees(store_id);
CREATE INDEX IF NOT EXISTS idx_employees_profile ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(store_id, status);
CREATE INDEX IF NOT EXISTS idx_employees_cpf_hash ON public.employees(store_id, cpf_hash);

-- ---------------------------------------------------------------------------
-- 4. employee_time_entries (Ponto Eletrônico com GPS e Auditoria)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_time_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id        UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entry_type         TEXT NOT NULL 
                       CHECK (entry_type IN ('clock_in', 'lunch_out', 'lunch_in', 'clock_out', 'break_out', 'break_in', 'overtime_in', 'overtime_out')),
  recorded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  source             TEXT NOT NULL DEFAULT 'web' 
                       CHECK (source IN ('web', 'mobile_pwa', 'biometric_terminal', 'supervisor_manual')),
  ip_address         TEXT,
  user_agent         TEXT,
  geolocation        JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_url          TEXT,
  status             TEXT NOT NULL DEFAULT 'verified' 
                       CHECK (status IN ('verified', 'pending_approval', 'rejected', 'adjusted')),
  adjustment_reason  TEXT,
  adjusted_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adjusted_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON public.employee_time_entries(employee_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_store_date ON public.employee_time_entries(store_id, recorded_at);

-- ---------------------------------------------------------------------------
-- 5. employee_payslips (Holerites com Breakdown Salarial e PDF)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_payslips (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id                       UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id                    UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reference_period               TEXT NOT NULL CHECK (reference_period ~ '^[0-9]{4}-[0-9]{2}$'), -- 'YYYY-MM'
  gross_salary_cents             INT NOT NULL CHECK (gross_salary_cents >= 0),
  net_salary_cents               INT NOT NULL CHECK (net_salary_cents >= 0),
  inss_discount_cents            INT NOT NULL DEFAULT 0,
  irrf_discount_cents            INT NOT NULL DEFAULT 0,
  fgts_provision_cents           INT NOT NULL DEFAULT 0,
  transport_voucher_discount_cents INT NOT NULL DEFAULT 0,
  meal_voucher_discount_cents    INT NOT NULL DEFAULT 0,
  other_discounts_cents          INT NOT NULL DEFAULT 0,
  bonus_additions_cents          INT NOT NULL DEFAULT 0,
  overtime_pay_cents             INT NOT NULL DEFAULT 0,
  salary_breakdown               JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_document_url               TEXT,
  status                         TEXT NOT NULL DEFAULT 'issued' 
                                   CHECK (status IN ('draft', 'issued', 'paid', 'acknowledged')),
  payment_date                   DATE,
  acknowledged_at                TIMESTAMPTZ,
  acknowledged_ip                TEXT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_employee_payslip_period UNIQUE (employee_id, reference_period)
);

CREATE INDEX IF NOT EXISTS idx_payslips_store_period ON public.employee_payslips(store_id, reference_period);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.employee_payslips(employee_id);

-- ---------------------------------------------------------------------------
-- 6. employee_requests (Vales, Adiantamentos, Férias e Atestados)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL 
                    CHECK (request_type IN ('salary_advance', 'leave_absence', 'vacation', 'time_adjustment', 'reimbursement', 'document_copy', 'other')),
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  description     TEXT NOT NULL,
  amount_cents    INT CHECK (amount_cents IS NULL OR amount_cents >= 0),
  start_date      DATE,
  end_date        DATE,
  attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  reviewer_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes  TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_requests_store ON public.employee_requests(store_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_emp ON public.employee_requests(employee_id);

-- ---------------------------------------------------------------------------
-- 7. employee_pins (Segurança e Autenticação Rápida em Terminal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_pins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  pin_hash        TEXT NOT NULL,
  salt            TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_pins_store ON public.employee_pins(store_id);

-- ---------------------------------------------------------------------------
-- 8. employee_context_sessions (Sessões Rápidas em Dispositivos Compartilhados)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_context_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id        UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  terminal_device_id TEXT NOT NULL,
  session_token      TEXT NOT NULL UNIQUE,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at         TIMESTAMPTZ NOT NULL,
  is_revoked         BOOLEAN NOT NULL DEFAULT false,
  revoked_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_context_sessions_token ON public.employee_context_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_context_sessions_active ON public.employee_context_sessions(store_id, employee_id) WHERE is_revoked = false;

-- ---------------------------------------------------------------------------
-- 9. employee_pin_audit_logs (Trilha de Auditoria de Acesso e PIN)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_pin_audit_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id           UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id        UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  attempt_type       TEXT NOT NULL 
                       CHECK (attempt_type IN ('auth_success', 'auth_failed', 'pin_change', 'pin_locked', 'session_override')),
  terminal_device_id TEXT,
  ip_address         TEXT,
  user_agent         TEXT,
  details            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pin_audit_store ON public.employee_pin_audit_logs(store_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS (ROW LEVEL SECURITY)
-- ---------------------------------------------------------------------------
ALTER TABLE public.hr_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_context_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_pin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Staff da Loja: Gestão Completa dos Recursos de RH
DROP POLICY IF EXISTS staff_manage_hr_departments ON public.hr_departments;
CREATE POLICY staff_manage_hr_departments ON public.hr_departments FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_hr_positions ON public.hr_positions;
CREATE POLICY staff_manage_hr_positions ON public.hr_positions FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_employees ON public.employees;
CREATE POLICY staff_manage_employees ON public.employees FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_time_entries ON public.employee_time_entries;
CREATE POLICY staff_manage_time_entries ON public.employee_time_entries FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_payslips ON public.employee_payslips;
CREATE POLICY staff_manage_payslips ON public.employee_payslips FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_employee_requests ON public.employee_requests;
CREATE POLICY staff_manage_employee_requests ON public.employee_requests FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_employee_pins ON public.employee_pins;
CREATE POLICY staff_manage_employee_pins ON public.employee_pins FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_context_sessions ON public.employee_context_sessions;
CREATE POLICY staff_manage_context_sessions ON public.employee_context_sessions FOR ALL
  USING (public.is_store_staff(store_id));

DROP POLICY IF EXISTS staff_manage_pin_audit_logs ON public.employee_pin_audit_logs;
CREATE POLICY staff_manage_pin_audit_logs ON public.employee_pin_audit_logs FOR ALL
  USING (public.is_store_staff(store_id));

-- Políticas Granulares de Acesso Pessoal para o Próprio Colaborador:
DROP POLICY IF EXISTS employee_read_own_record ON public.employees;
CREATE POLICY employee_read_own_record ON public.employees FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS employee_read_own_time_entries ON public.employee_time_entries;
CREATE POLICY employee_read_own_time_entries ON public.employee_time_entries FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS employee_insert_own_time_entry ON public.employee_time_entries;
CREATE POLICY employee_insert_own_time_entry ON public.employee_time_entries FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS employee_read_own_payslips ON public.employee_payslips;
CREATE POLICY employee_read_own_payslips ON public.employee_payslips FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS employee_acknowledge_own_payslip ON public.employee_payslips;
CREATE POLICY employee_acknowledge_own_payslip ON public.employee_payslips FOR UPDATE
  USING (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()))
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS employee_read_own_requests ON public.employee_requests;
CREATE POLICY employee_read_own_requests ON public.employee_requests FOR SELECT
  USING (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS employee_create_own_request ON public.employee_requests;
CREATE POLICY employee_create_own_request ON public.employee_requests FOR INSERT
  WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()));

-- Triggers para updated_at automático
DROP TRIGGER IF EXISTS trg_hr_departments_updated_at ON public.hr_departments;
CREATE TRIGGER trg_hr_departments_updated_at
  BEFORE UPDATE ON public.hr_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_hr_positions_updated_at ON public.hr_positions;
CREATE TRIGGER trg_hr_positions_updated_at
  BEFORE UPDATE ON public.hr_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employee_payslips_updated_at ON public.employee_payslips;
CREATE TRIGGER trg_employee_payslips_updated_at
  BEFORE UPDATE ON public.employee_payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employee_requests_updated_at ON public.employee_requests;
CREATE TRIGGER trg_employee_requests_updated_at
  BEFORE UPDATE ON public.employee_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employee_pins_updated_at ON public.employee_pins;
CREATE TRIGGER trg_employee_pins_updated_at
  BEFORE UPDATE ON public.employee_pins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
