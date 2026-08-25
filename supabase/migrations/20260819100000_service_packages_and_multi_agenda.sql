-- ==============================================================================
-- Migration: Service Packages, Pass Credits & Multi-Staff Agenda Hierarchy
-- ==============================================================================

-- 1. Pacotes de Serviços & Aulas da Empresa (ex: 10 Aulas de Pilates, Plano Mensal)
CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.booking_services(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    total_credits INTEGER NOT NULL CHECK (total_credits > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    validity_days INTEGER NOT NULL DEFAULT 30 CHECK (validity_days > 0),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_interval TEXT DEFAULT 'monthly',
    max_reschedules_per_credit INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_packages_store ON public.service_packages(store_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_service ON public.service_packages(service_id);

-- 2. Carteira de Passes do Cliente (Emitido após compra/checkout)
CREATE TABLE IF NOT EXISTS public.customer_service_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.service_packages(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    total_credits INTEGER NOT NULL CHECK (total_credits > 0),
    remaining_credits INTEGER NOT NULL CHECK (remaining_credits >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'paused')),
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_service_passes_customer ON public.customer_service_passes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_passes_store ON public.customer_service_passes(store_id);

-- 3. Extrato e Ledger de Créditos (Audit Trail Imutável)
CREATE TABLE IF NOT EXISTS public.service_pass_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL REFERENCES public.customer_service_passes(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.booking_appointments(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('credit_grant', 'session_booked', 'session_completed', 'session_cancelled_refund', 'no_show_penalty', 'expired_forfeit')),
    credits_delta INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_pass_ledger_pass ON public.service_pass_ledger(pass_id);

-- 4. Extensões na tabela booking_appointments
ALTER TABLE public.booking_appointments
ADD COLUMN IF NOT EXISTS pass_id UUID REFERENCES public.customer_service_passes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS session_number INTEGER;

-- 5. Row Level Security (RLS)
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pass_ledger ENABLE ROW LEVEL SECURITY;

-- Leitura pública de pacotes ativos
CREATE POLICY "Public read active service packages"
ON public.service_packages FOR SELECT
USING (is_active = TRUE);

-- Gerenciamento de pacotes pelo Lojista
CREATE POLICY "Store staff manage service packages"
ON public.service_packages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.store_id = service_packages.store_id
        AND wm.profile_id = auth.uid()
    )
);

-- Cliente visualiza seus próprios passes
CREATE POLICY "Customers view own service passes"
ON public.customer_service_passes FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Lojista visualiza passes emitidos em sua loja
CREATE POLICY "Store staff view customer passes"
ON public.customer_service_passes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.store_id = customer_service_passes.store_id
        AND wm.profile_id = auth.uid()
    )
);

-- Cliente visualiza extrato dos seus passes
CREATE POLICY "Customers view own pass ledger"
ON public.service_pass_ledger FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.customer_service_passes csp
        WHERE csp.id = service_pass_ledger.pass_id
        AND csp.customer_id = auth.uid()
    )
);

-- 6. Stored Procedure: Resgate Atômico de Crédito do Passe para Agendamento
CREATE OR REPLACE FUNCTION public.redeem_service_pass_credit(
    p_pass_id UUID,
    p_customer_id UUID,
    p_scheduled_at TIMESTAMPTZ,
    p_resource_id UUID DEFAULT NULL,
    p_guest_name TEXT DEFAULT NULL,
    p_guest_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pass RECORD;
    v_service RECORD;
    v_appt_id UUID;
    v_new_balance INTEGER;
    v_session_num INTEGER;
BEGIN
    -- 1. Lock no passe do cliente
    SELECT * INTO v_pass
    FROM public.customer_service_passes
    WHERE id = p_pass_id AND customer_id = p_customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Passe de serviços não encontrado ou não pertence a este cliente.';
    END IF;

    IF v_pass.status != 'active' THEN
        RAISE EXCEPTION 'Este passe está % e não pode ser utilizado.', v_pass.status;
    END IF;

    IF v_pass.expires_at < NOW() THEN
        UPDATE public.customer_service_passes SET status = 'expired' WHERE id = p_pass_id;
        RAISE EXCEPTION 'Este pacote de aulas expirou em %.', v_pass.expires_at;
    END IF;

    IF v_pass.remaining_credits <= 0 THEN
        RAISE EXCEPTION 'Você já utilizou todos os créditos deste pacote.';
    END IF;

    -- 2. Busca dados do serviço do pacote
    SELECT bs.* INTO v_service
    FROM public.service_packages sp
    JOIN public.booking_services bs ON bs.id = sp.service_id
    WHERE sp.id = v_pass.package_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Serviço vinculado ao pacote não foi encontrado.';
    END IF;

    -- 3. Calcula saldo e número da sessão
    v_new_balance := v_pass.remaining_credits - 1;
    v_session_num := (v_pass.total_credits - v_pass.remaining_credits) + 1;

    -- 4. Cria o agendamento
    INSERT INTO public.booking_appointments (
        store_id,
        service_id,
        resource_id,
        customer_id,
        pass_id,
        session_number,
        guest_name,
        guest_phone,
        scheduled_at,
        notes,
        status
    ) VALUES (
        v_pass.store_id,
        v_service.id,
        p_resource_id,
        p_customer_id,
        p_pass_id,
        v_session_num,
        COALESCE(p_guest_name, 'Cliente do Pacote'),
        COALESCE(p_guest_phone, ''),
        p_scheduled_at,
        p_notes,
        'confirmed'
    ) RETURNING id INTO v_appt_id;

    -- 5. Atualiza o saldo do passe
    UPDATE public.customer_service_passes
    SET 
        remaining_credits = v_new_balance,
        status = CASE WHEN v_new_balance = 0 THEN 'exhausted' ELSE 'active' END,
        updated_at = NOW()
    WHERE id = p_pass_id;

    -- 6. Registra no Ledger imutável
    INSERT INTO public.service_pass_ledger (
        pass_id,
        appointment_id,
        movement_type,
        credits_delta,
        balance_after,
        reason
    ) VALUES (
        p_pass_id,
        v_appt_id,
        'session_booked',
        -1,
        v_new_balance,
        FORMAT('Agendamento da sessão %s de %s para %s', v_session_num, v_pass.total_credits, p_scheduled_at)
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appt_id,
        'remaining_credits', v_new_balance,
        'session_number', v_session_num,
        'service_title', v_service.title
    );
END;
$$;

-- 7. Stored Procedure: Cancelamento e Reembolso Atômico do Crédito
CREATE OR REPLACE FUNCTION public.refund_service_pass_credit(
    p_appointment_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Cancelamento solicitado pelo cliente'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_appt RECORD;
    v_pass RECORD;
    v_new_balance INTEGER;
BEGIN
    SELECT * INTO v_appt
    FROM public.booking_appointments
    WHERE id = p_appointment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Agendamento não encontrado.';
    END IF;

    IF v_appt.status = 'cancelled' THEN
        RAISE EXCEPTION 'Este agendamento já foi cancelado.';
    END IF;

    IF v_appt.pass_id IS NULL THEN
        -- Agendamento avulso tradicional
        UPDATE public.booking_appointments SET status = 'cancelled' WHERE id = p_appointment_id;
        RETURN jsonb_build_object('success', true, 'refunded_credit', false);
    END IF;

    -- Lock no passe
    SELECT * INTO v_pass
    FROM public.customer_service_passes
    WHERE id = v_appt.pass_id
    FOR UPDATE;

    v_new_balance := v_pass.remaining_credits + 1;

    -- Atualiza status do agendamento
    UPDATE public.booking_appointments
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_appointment_id;

    -- Reembolsa o crédito no passe
    UPDATE public.customer_service_passes
    SET 
        remaining_credits = v_new_balance,
        status = 'active',
        updated_at = NOW()
    WHERE id = v_appt.pass_id;

    -- Registra no Ledger
    INSERT INTO public.service_pass_ledger (
        pass_id,
        appointment_id,
        movement_type,
        credits_delta,
        balance_after,
        reason
    ) VALUES (
        v_appt.pass_id,
        p_appointment_id,
        'session_cancelled_refund',
        1,
        v_new_balance,
        p_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'refunded_credit', true,
        'remaining_credits', v_new_balance
    );
END;
$$;
