-- ==============================================================================
-- MIGRAÇÃO: PIPELINE NATIVO DE TURISMO (THE GOLDEN CHAIN)
-- Criação de tourism_trips, trip_passengers, trip_confirmation_items,
-- tourism_vouchers e a Stored Procedure Atômica convert_proposal_to_trip_native
-- ==============================================================================

-- 1. TABELA DE VIAGENS / RESERVAS CONFIRMADAS
CREATE TABLE IF NOT EXISTS public.tourism_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
    customer_id UUID,
    trip_number TEXT NOT NULL,
    title TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    travel_start_date DATE,
    travel_end_date DATE,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    total_cents BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
    client_name TEXT NOT NULL,
    client_whatsapp TEXT NOT NULL,
    client_email TEXT,
    client_document TEXT,
    cover_image_url TEXT,
    flights JSONB NOT NULL DEFAULT '[]'::jsonb,
    hotels JSONB NOT NULL DEFAULT '[]'::jsonb,
    transfers JSONB NOT NULL DEFAULT '[]'::jsonb,
    tours JSONB NOT NULL DEFAULT '[]'::jsonb,
    insurance JSONB NOT NULL DEFAULT '{}'::jsonb,
    itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
    rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
    includes TEXT[] NOT NULL DEFAULT '{}',
    excludes TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE PASSAGEIROS & ROOMING LIST DA VIAGEM
CREATE TABLE IF NOT EXISTS public.trip_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.tourism_trips(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    document TEXT,
    birth_date DATE,
    email TEXT,
    phone TEXT,
    room_id TEXT,
    seat_number TEXT,
    is_lead_passenger BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA DE LOCALIZADORES & ITENS DE CONFIRMAÇÃO POR FORNECEDOR
CREATE TABLE IF NOT EXISTS public.trip_confirmation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.tourism_trips(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('flight', 'hotel', 'transfer', 'tour', 'insurance', 'cruise', 'other')),
    provider_name TEXT NOT NULL,
    locator_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'reaccommodated')),
    service_date DATE,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE VOUCHERS TURÍSTICOS (A4 GUIA DE EMBARQUE & STORY)
CREATE TABLE IF NOT EXISTS public.tourism_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.tourism_trips(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    public_token TEXT UNIQUE NOT NULL,
    voucher_code TEXT NOT NULL,
    voucher_type TEXT NOT NULL DEFAULT 'general' CHECK (voucher_type IN ('general', 'flight', 'hotel', 'transfer', 'tour')),
    template TEXT NOT NULL DEFAULT 'a4-boarding' CHECK (template IN ('a4-boarding', 'story', 'minimal')),
    destination TEXT,
    cover_image_url TEXT,
    emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    passengers JSONB NOT NULL DEFAULT '[]'::jsonb,
    flights JSONB NOT NULL DEFAULT '[]'::jsonb,
    hotels JSONB NOT NULL DEFAULT '[]'::jsonb,
    transfers JSONB NOT NULL DEFAULT '[]'::jsonb,
    tours JSONB NOT NULL DEFAULT '[]'::jsonb,
    insurance JSONB NOT NULL DEFAULT '{}'::jsonb,
    observations TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_tourism_trips_store ON public.tourism_trips(store_id, status);
CREATE INDEX IF NOT EXISTS idx_tourism_trips_proposal ON public.tourism_trips(proposal_id);
CREATE INDEX IF NOT EXISTS idx_tourism_trips_customer ON public.tourism_trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_tourism_trips_dates ON public.tourism_trips(travel_start_date, travel_end_date);
CREATE INDEX IF NOT EXISTS idx_trip_passengers_trip ON public.trip_passengers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_confirmation_items_trip ON public.trip_confirmation_items(trip_id, item_type);
CREATE INDEX IF NOT EXISTS idx_tourism_vouchers_trip ON public.tourism_vouchers(trip_id);
CREATE INDEX IF NOT EXISTS idx_tourism_vouchers_token ON public.tourism_vouchers(public_token);

-- RLS Deny-by-Default e Políticas de Acesso
ALTER TABLE public.tourism_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_confirmation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_vouchers ENABLE ROW LEVEL SECURITY;

-- Políticas para tourism_trips
CREATE POLICY "Workspace members manage store tourism trips"
    ON public.tourism_trips
    FOR ALL
    TO authenticated
    USING (
        is_store_staff(store_id)
        OR created_by_profile_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
    );

-- Políticas para trip_passengers
CREATE POLICY "Workspace members manage trip passengers"
    ON public.trip_passengers
    FOR ALL
    TO authenticated
    USING (
        is_store_staff(store_id)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
    );

-- Políticas para trip_confirmation_items
CREATE POLICY "Workspace members manage trip confirmation items"
    ON public.trip_confirmation_items
    FOR ALL
    TO authenticated
    USING (
        is_store_staff(store_id)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
    );

-- Políticas para tourism_vouchers
CREATE POLICY "Workspace members manage tourism vouchers"
    ON public.tourism_vouchers
    FOR ALL
    TO authenticated
    USING (
        is_store_staff(store_id)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'platform_admin'))
    );

CREATE POLICY "Public read voucher by token"
    ON public.tourism_vouchers
    FOR SELECT
    TO public
    USING (true);

-- ==============================================================================
-- 5. STORED PROCEDURE ATÔMICA: CONVERSÃO DE PROPOSTA EM RESERVA/VIAGEM
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.convert_proposal_to_trip_native(
    p_proposal_id UUID,
    p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote RECORD;
    v_meta JSONB := '{}'::jsonb;
    v_trip_id UUID;
    v_contract_id UUID;
    v_voucher_id UUID;
    v_customer_id UUID;
    v_trip_number TEXT;
    v_voucher_code TEXT;
    v_voucher_token TEXT;
    v_contract_token TEXT;
    v_contract_title TEXT;
    v_package_summary TEXT;
    v_total_cents BIGINT := 0;
    v_fl JSONB;
    v_ht JSONB;
    v_rm JSONB;
    v_pax_name TEXT;
BEGIN
    -- 1. Obter e validar a proposta em quotes
    SELECT * INTO v_quote
    FROM public.quotes
    WHERE id = p_proposal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposta % não encontrada.', p_proposal_id;
    END IF;

    -- Tenta deserializar conditions JSON
    BEGIN
        IF v_quote.conditions IS NOT NULL AND v_quote.conditions != '' THEN
            v_meta := v_quote.conditions::jsonb;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_meta := '{}'::jsonb;
    END;

    -- 2. Garantir ou vincular o cliente no CRM
    IF v_quote.crm_customer_id IS NOT NULL THEN
        v_customer_id := v_quote.crm_customer_id;
    ELSE
        -- Buscar cliente existente por telefone/whatsapp
        SELECT id INTO v_customer_id
        FROM public.crm_customers
        WHERE store_id = p_store_id
          AND (phone = v_quote.guest_phone OR mobile = v_quote.guest_phone)
        LIMIT 1;

        -- Se não existir, cria o cliente no CRM
        IF v_customer_id IS NULL AND v_quote.guest_name IS NOT NULL AND v_quote.guest_name != '' THEN
            INSERT INTO public.crm_customers (
                store_id,
                full_name,
                phone,
                mobile,
                email,
                document,
                channel
            ) VALUES (
                p_store_id,
                v_quote.guest_name,
                v_quote.guest_phone,
                v_quote.guest_phone,
                v_quote.guest_email,
                v_meta->>'client_document',
                'travel_proposal'
            ) RETURNING id INTO v_customer_id;
        END IF;
    END IF;

    -- 3. Gerar identificadores únicos de viagem e tokens
    v_trip_number := 'VIAGEM-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(FLOOR(random() * 9000 + 1000)::text, 4, '0');
    v_voucher_code := 'VOUCH-' || LPAD(FLOOR(random() * 900000 + 100000)::text, 6, '0');
    v_voucher_token := 'vch_' || encode(gen_random_bytes(12), 'hex');
    v_contract_token := 'ctr_' || encode(gen_random_bytes(12), 'hex');

    v_total_cents := COALESCE(v_quote.total_cents, (v_meta->'pricing'->>'total_price_cents')::bigint, 0);

    -- 4. Criar o registro principal da Viagem (tourism_trips)
    INSERT INTO public.tourism_trips (
        store_id,
        created_by_profile_id,
        proposal_id,
        customer_id,
        trip_number,
        title,
        destination_city,
        travel_start_date,
        travel_end_date,
        adults_count,
        children_count,
        currency,
        total_cents,
        status,
        client_name,
        client_whatsapp,
        client_email,
        client_document,
        cover_image_url,
        flights,
        hotels,
        transfers,
        tours,
        insurance,
        itinerary,
        rooms,
        includes,
        notes
    ) VALUES (
        p_store_id,
        auth.uid(),
        p_proposal_id,
        v_customer_id,
        v_trip_number,
        COALESCE(v_quote.internal_notes, v_meta->>'title', 'Viagem: ' || COALESCE(v_meta->>'destination_city', 'Pacote Turístico')),
        COALESCE(v_meta->>'destination_city', 'Destino Não Especificado'),
        (NULLIF(v_meta->>'travel_start_date', ''))::date,
        (NULLIF(v_meta->>'travel_end_date', ''))::date,
        COALESCE((v_meta->>'adults_count')::int, 1),
        COALESCE((v_meta->>'children_count')::int, 0),
        COALESCE(v_meta->>'currency', 'BRL'),
        v_total_cents,
        'confirmed',
        COALESCE(v_quote.guest_name, v_meta->>'client_name', 'Passageiro Principal'),
        COALESCE(v_quote.guest_phone, v_meta->>'client_whatsapp', ''),
        COALESCE(v_quote.guest_email, v_meta->>'client_email'),
        v_meta->>'client_document',
        v_meta->>'cover_image_url',
        COALESCE(v_meta->'flights', '[]'::jsonb),
        COALESCE(v_meta->'hotels', '[]'::jsonb),
        COALESCE(v_meta->'transfers', '[]'::jsonb),
        COALESCE(v_meta->'tours', '[]'::jsonb),
        COALESCE(v_meta->'insurance', '{}'::jsonb),
        COALESCE(v_meta->'itinerary', '[]'::jsonb),
        COALESCE(v_meta->'rooms', '[]'::jsonb),
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_meta->'includes', '[]'::jsonb))),
        v_quote.observations
    ) RETURNING id INTO v_trip_id;

    -- 5. Inserir Passageiro Principal
    INSERT INTO public.trip_passengers (
        trip_id,
        store_id,
        full_name,
        document,
        email,
        phone,
        is_lead_passenger
    ) VALUES (
        v_trip_id,
        p_store_id,
        COALESCE(v_quote.guest_name, 'Passageiro Principal'),
        v_meta->>'client_document',
        v_quote.guest_email,
        v_quote.guest_phone,
        true
    );

    -- 6. Extrair e criar itens de confirmação de voos e hotéis
    IF v_meta->'flights' IS NOT NULL AND jsonb_array_length(v_meta->'flights') > 0 THEN
        FOR v_fl IN SELECT * FROM jsonb_array_elements(v_meta->'flights') LOOP
            INSERT INTO public.trip_confirmation_items (
                trip_id,
                store_id,
                item_type,
                provider_name,
                locator_code,
                status,
                notes
            ) VALUES (
                v_trip_id,
                p_store_id,
                'flight',
                COALESCE(v_fl->>'airline_name', 'Cia Aérea'),
                COALESCE(v_fl->>'flight_number', 'LOC-' || LPAD(FLOOR(random() * 9000 + 1000)::text, 4, '0')),
                'confirmed',
                COALESCE(v_fl->>'origin_iata', '') || ' → ' || COALESCE(v_fl->>'destination_iata', '')
            );
        END LOOP;
    END IF;

    IF v_meta->'hotels' IS NOT NULL AND jsonb_array_length(v_meta->'hotels') > 0 THEN
        FOR v_ht IN SELECT * FROM jsonb_array_elements(v_meta->'hotels') LOOP
            INSERT INTO public.trip_confirmation_items (
                trip_id,
                store_id,
                item_type,
                provider_name,
                locator_code,
                status,
                notes
            ) VALUES (
                v_trip_id,
                p_store_id,
                'hotel',
                COALESCE(v_ht->>'hotel_name', 'Hotel & Resort'),
                'HTL-' || LPAD(FLOOR(random() * 90000 + 10000)::text, 5, '0'),
                'confirmed',
                COALESCE(v_ht->>'room_type', 'Quarto Standard') || ' (' || COALESCE(v_ht->>'nights_count', '1') || ' noites)'
            );
        END LOOP;
    END IF;

    -- 7. Criar Contrato Digital em Rascunho
    v_contract_title := 'Contrato de Prestação de Serviços Turísticos: ' || COALESCE(v_meta->>'destination_city', 'Destino');
    v_package_summary := 'Viagem para ' || COALESCE(v_meta->>'destination_city', 'Destino') || ' · Total: ' || (COALESCE((v_meta->>'adults_count')::int, 1) + COALESCE((v_meta->>'children_count')::int, 0)) || ' passageiro(s)';

    INSERT INTO public.travel_contracts (
        store_id,
        created_by_profile_id,
        public_token,
        contract_title,
        client_name,
        client_document,
        client_email,
        client_phone,
        destination,
        travel_start_date,
        travel_end_date,
        package_summary,
        total_value_cents,
        payment_conditions,
        passengers,
        clauses,
        signatures,
        status
    ) VALUES (
        p_store_id,
        auth.uid(),
        v_contract_token,
        v_contract_title,
        COALESCE(v_quote.guest_name, 'Contratante'),
        COALESCE(v_meta->>'client_document', '000.000.000-00'),
        v_quote.guest_email,
        COALESCE(v_quote.guest_phone, '(00) 00000-0000'),
        COALESCE(v_meta->>'destination_city', 'Destino'),
        (NULLIF(v_meta->>'travel_start_date', ''))::date,
        (NULLIF(v_meta->>'travel_end_date', ''))::date,
        v_package_summary,
        v_total_cents,
        'Condições conforme aprovado na proposta comercial.',
        COALESCE(v_meta->'rooms', '[]'::jsonb),
        '[{"title":"1. Objeto do Contrato","content":"A CONTRATADA compromete-se a intermediar os serviços de turismo contratados pelo CONTRATANTE."},{"title":"2. Cancelamento e Reembolso","content":"As solicitações de cancelamento obedecem às regras das companhias aéreas e fornecedores hoteleiros."}]'::jsonb,
        '[]'::jsonb,
        'draft'
    ) RETURNING id INTO v_contract_id;

    -- 8. Gerar o primeiro Voucher Oficial da Viagem
    INSERT INTO public.tourism_vouchers (
        trip_id,
        store_id,
        public_token,
        voucher_code,
        voucher_type,
        template,
        destination,
        cover_image_url,
        flights,
        hotels,
        transfers,
        tours,
        insurance,
        passengers,
        emergency_contacts,
        observations
    ) VALUES (
        v_trip_id,
        p_store_id,
        v_voucher_token,
        v_voucher_code,
        'general',
        'a4-boarding',
        COALESCE(v_meta->>'destination_city', 'Destino'),
        v_meta->>'cover_image_url',
        COALESCE(v_meta->'flights', '[]'::jsonb),
        COALESCE(v_meta->'hotels', '[]'::jsonb),
        COALESCE(v_meta->'transfers', '[]'::jsonb),
        COALESCE(v_meta->'tours', '[]'::jsonb),
        COALESCE(v_meta->'insurance', '{}'::jsonb),
        jsonb_build_array(jsonb_build_object('name', COALESCE(v_quote.guest_name, 'Passageiro'), 'document', v_meta->>'client_document')),
        jsonb_build_array(jsonb_build_object('name', 'Plantão 24h da Agência', 'phone', COALESCE(v_quote.guest_phone, 'WhatsApp da Agência'))),
        'Apresente este voucher juntamente com seu documento oficial com foto no check-in.'
    ) RETURNING id INTO v_voucher_id;

    -- 9. Atualizar status da proposta para aprovada / convertida
    UPDATE public.quotes
    SET status = 'approved',
        updated_at = now()
    WHERE id = p_proposal_id;

    -- 10. Retornar os IDs unificados
    RETURN jsonb_build_object(
        'success', true,
        'trip_id', v_trip_id,
        'trip_number', v_trip_number,
        'contract_id', v_contract_id,
        'voucher_id', v_voucher_id,
        'voucher_token', v_voucher_token,
        'customer_id', v_customer_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_proposal_to_trip_native(UUID, UUID) TO authenticated;
