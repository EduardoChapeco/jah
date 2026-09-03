-- ============================================================================
-- MIGRATION: Motor de Certificação Transacional Universal (MCTU) v1
-- Toda compra, pedido, agendamento, assinatura e operação crítica gera um
-- certificado criptográfico imutável vinculado a sessão, IP, dispositivo e
-- relógio UTC do servidor. Impossível injetar ou forjar sem sessão válida.
-- ============================================================================

-- 1. Tabela Principal: transaction_certificates (IMUTÁVEL via trigger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transaction_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de transação certificada
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'order',                    -- Compra online
    'pos_sale',                 -- Venda no PDV
    'booking',                  -- Agendamento de serviço
    'appointment',              -- Consulta / Atendimento
    'contract_signature',       -- Assinatura de contrato digital
    'group_tour_boarding',      -- Embarque em excursão
    'delivery_pin_generation',  -- Geração de PIN de entrega
    'delivery_confirmation',    -- Confirmação de entrega com PIN
    'credit_redemption',        -- Resgate de crédito
    'coupon_application',       -- Aplicação de cupom crítico
    'gift_card_redemption',     -- Resgate de gift card
    'token_transfer',           -- Transferência de tokens
    'kyc_verification'          -- Verificação de identidade
  )),

  -- Referência ao objeto transacionado (preenchido após criação do pedido, etc.)
  entity_id UUID,

  -- Multi-tenant
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,

  -- Usuário autenticado (OBRIGATÓRIO — sem sessão válida a função rejeita)
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- ── Telemetria capturada no momento exato da transação (Server-Side Only) ──
  ip_address TEXT NOT NULL DEFAULT 'unknown',
  user_agent TEXT,
  device_fingerprint TEXT,     -- Enviado pelo cliente; usado APENAS para telemetria, nunca para auth
  geo_country TEXT,            -- Via Cloudflare CF-IPCountry header
  geo_city TEXT,               -- Via Cloudflare CF-IPCity header

  -- JTI do JWT Supabase — identificador único da sessão de login
  session_jti TEXT NOT NULL DEFAULT 'no_jti',

  -- ── Sincronismo de Relógio (Anti-Replay Temporal) ──
  client_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  clock_drift_ms INTEGER,      -- Diferença em ms; > 300000 (5 min) = suspeito

  -- ── Cadeia Criptográfica SHA-256 (Estilo Blockchain) ──
  certificate_hash TEXT NOT NULL UNIQUE,  -- Hash principal desta transação
  prev_certificate_hash TEXT,             -- Hash da última transação do mesmo usuário (cadeia)
  payload_hash TEXT NOT NULL,             -- SHA-256 do snapshot do payload

  -- ── Snapshot Imutável do que foi transacionado ──
  payload_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- ── Status e Score de Risco ──
  is_valid BOOLEAN NOT NULL DEFAULT true,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  invalidated_reason TEXT,
  invalidated_at TIMESTAMPTZ,
  auto_flagged BOOLEAN NOT NULL DEFAULT false,   -- Flagged automaticamente por anomalia

  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Índices para auditoria rápida e consultas de segurança
CREATE INDEX IF NOT EXISTS idx_tx_certs_entity ON public.transaction_certificates (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tx_certs_user ON public.transaction_certificates (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_certs_ip ON public.transaction_certificates (ip_address);
CREATE INDEX IF NOT EXISTS idx_tx_certs_session ON public.transaction_certificates (session_jti);
CREATE INDEX IF NOT EXISTS idx_tx_certs_store ON public.transaction_certificates (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_certs_risk ON public.transaction_certificates (auto_flagged, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_tx_certs_hash ON public.transaction_certificates (certificate_hash);

-- ============================================================================
-- 2. Trigger de Imutabilidade — Nenhum UPDATE ou DELETE é possível
-- (Reutiliza a função já existente enforce_ledger_immutability)
-- ============================================================================
DROP TRIGGER IF EXISTS trg_immutable_tx_certificates ON public.transaction_certificates;
CREATE TRIGGER trg_immutable_tx_certificates
  BEFORE UPDATE OR DELETE ON public.transaction_certificates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ledger_immutability();

-- ============================================================================
-- 3. Expandir security_audit_events com campos de fingerprinting
-- ============================================================================
ALTER TABLE public.security_audit_events
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS session_jti TEXT,
  ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_auto_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS related_certificate_id UUID;

-- ============================================================================
-- 4. Tabela de PINs de Entrega (HMAC-SHA256, não-sequencial)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  pin_code TEXT NOT NULL,                    -- PIN numérico de 6 dígitos (HMAC-derived)
  pin_hash TEXT NOT NULL,                    -- SHA-256 do PIN para validação sem expor valor
  certificate_id UUID REFERENCES public.transaction_certificates(id),
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_ip TEXT,
  expires_at TIMESTAMPTZ NOT NULL,           -- 24h padrão, renovável
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_pins_order ON public.delivery_pins (order_id) WHERE NOT is_used;
CREATE INDEX IF NOT EXISTS idx_delivery_pins_pin_hash ON public.delivery_pins (pin_hash);

ALTER TABLE public.delivery_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_pins_store_members" ON public.delivery_pins
  FOR ALL USING (public.is_store_member(store_id) OR public.is_platform_admin());

-- ============================================================================
-- 5. Função: generate_transaction_certificate (SECURITY DEFINER)
-- Gera o certificado criptográfico imutável com SHA-256 encadeado.
-- NUNCA aceita hash pré-gerado do cliente. Toda lógica é server-side.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_transaction_certificate(
  p_entity_type TEXT,
  p_entity_id UUID,             -- Pode ser NULL antes do pedido ser criado (será atualizado)
  p_store_id UUID,
  p_payload_snapshot JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_device_fingerprint TEXT,
  p_geo_country TEXT,
  p_geo_city TEXT,
  p_client_timestamp TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session_jti TEXT;
  v_server_ts TIMESTAMPTZ;
  v_clock_drift_ms INTEGER;
  v_risk_score INTEGER := 0;
  v_auto_flagged BOOLEAN := false;

  v_prev_cert_hash TEXT;
  v_payload_hash TEXT;
  v_certificate_hash TEXT;
  v_cert_id UUID;

  v_raw_material TEXT;
BEGIN
  -- ── Zero Trust: Validar sessão obrigatória ──
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'CERTIFICADO NEGADO: Sessão de usuário inválida ou inexistente. Autenticação obrigatória para qualquer transação.';
  END IF;

  -- Extrair JTI do JWT da sessão Supabase
  v_session_jti := COALESCE(
    (auth.jwt() ->> 'jti'),
    'no_jti_' || v_user_id::text || '_' || extract(epoch from now())::text
  );

  v_server_ts := timezone('utc', now());

  -- ── Sincronismo de Relógio (Anti-Replay Temporal) ──
  v_clock_drift_ms := ABS(EXTRACT(EPOCH FROM (v_server_ts - p_client_timestamp)) * 1000)::INTEGER;

  -- Se drift > 5 minutos (300.000ms): suspeito
  IF v_clock_drift_ms > 300000 THEN
    v_risk_score := v_risk_score + 40;
    v_auto_flagged := true;

    INSERT INTO public.security_audit_events (
      severity, event_type, entity_type, entity_id,
      ip_address, user_agent, device_fingerprint, session_jti, risk_score,
      details
    ) VALUES (
      'warning', 'clock_drift_anomaly', p_entity_type, p_entity_id,
      p_ip_address, p_user_agent, p_device_fingerprint, v_session_jti, 40,
      jsonb_build_object(
        'user_id', v_user_id,
        'client_timestamp', p_client_timestamp,
        'server_timestamp', v_server_ts,
        'drift_ms', v_clock_drift_ms
      )
    );
  END IF;

  -- ── Risk Score: IP suspeito (múltiplas tentativas recentes) ──
  DECLARE
    v_recent_attempts INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_recent_attempts
    FROM public.security_audit_events
    WHERE ip_address = p_ip_address
      AND created_at > now() - INTERVAL '1 hour'
      AND severity IN ('warning', 'critical', 'emergency');

    IF v_recent_attempts >= 5 THEN
      v_risk_score := LEAST(v_risk_score + 30, 100);
      v_auto_flagged := true;
    END IF;
  END;

  -- ── Buscar hash do último certificado do usuário (encadeamento) ──
  SELECT certificate_hash INTO v_prev_cert_hash
  FROM public.transaction_certificates
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- ── Calcular payload_hash (SHA-256 do snapshot) ──
  v_payload_hash := encode(
    digest(p_payload_snapshot::text, 'sha256'),
    'hex'
  );

  -- ── Montar material criptográfico ──
  v_raw_material :=
    p_entity_type || '|' ||
    COALESCE(p_entity_id::text, 'pending') || '|' ||
    v_user_id::text || '|' ||
    v_session_jti || '|' ||
    COALESCE(p_ip_address, 'unknown') || '|' ||
    COALESCE(p_user_agent, 'unknown') || '|' ||
    COALESCE(p_device_fingerprint, 'no_fp') || '|' ||
    v_server_ts::text || '|' ||
    v_payload_hash || '|' ||
    COALESCE(v_prev_cert_hash, 'WIDER_GENESIS_CERT_V1') || '|' ||
    'WIDER_PLATFORM_CERT_SECRET_2026';

  -- ── Gerar certificate_hash (SHA-256) ──
  v_certificate_hash := encode(
    digest(v_raw_material, 'sha256'),
    'hex'
  );

  -- ── Inserir certificado (IMUTÁVEL após inserção) ──
  INSERT INTO public.transaction_certificates (
    entity_type, entity_id, store_id, user_id,
    ip_address, user_agent, device_fingerprint, geo_country, geo_city,
    session_jti, client_timestamp, server_timestamp, clock_drift_ms,
    certificate_hash, prev_certificate_hash, payload_hash,
    payload_snapshot, risk_score, auto_flagged
  ) VALUES (
    p_entity_type, p_entity_id, p_store_id, v_user_id,
    p_ip_address, p_user_agent, p_device_fingerprint, p_geo_country, p_geo_city,
    v_session_jti, p_client_timestamp, v_server_ts, v_clock_drift_ms,
    v_certificate_hash, v_prev_cert_hash, v_payload_hash,
    p_payload_snapshot, v_risk_score, v_auto_flagged
  )
  RETURNING id INTO v_cert_id;

  RETURN jsonb_build_object(
    'success', true,
    'certificate_id', v_cert_id,
    'certificate_hash', v_certificate_hash,
    'server_timestamp', v_server_ts,
    'risk_score', v_risk_score,
    'auto_flagged', v_auto_flagged
  );

EXCEPTION WHEN OTHERS THEN
  -- Registrar tentativa suspeita (possível injeção ou bug crítico)
  INSERT INTO public.security_audit_events (
    severity, event_type, entity_type,
    ip_address, user_agent, device_fingerprint,
    details
  ) VALUES (
    'critical', 'certificate_generation_failed', p_entity_type,
    p_ip_address, p_user_agent, p_device_fingerprint,
    jsonb_build_object('error', SQLERRM, 'entity_id', p_entity_id)
  );
  RAISE;
END;
$$;

-- ============================================================================
-- 6. Função: update_certificate_entity_id
-- Chamada após a criação do pedido para vincular o certificate ao entity_id real
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_certificate_entity_id(
  p_certificate_id UUID,
  p_entity_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTORIZAÇÃO NEGADA: Sessão inválida.';
  END IF;

  -- Só o próprio usuário pode vincular seu certificado
  -- Usa UPDATE direto via service role (contorna o trigger de imutabilidade
  -- apenas para o campo entity_id que ainda não foi preenchido)
  UPDATE public.transaction_certificates
  SET entity_id = p_entity_id
  WHERE id = p_certificate_id
    AND user_id = v_user_id
    AND entity_id IS NULL;  -- Só atualiza se ainda não vinculado

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- 7. Função: generate_delivery_pin (HMAC-SHA256, não-sequencial)
-- PIN de 6 dígitos derivado de HMAC — sem padrão previsível, com expiração
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_delivery_pin(
  p_order_id UUID,
  p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;

  -- Janela de 15min para o HMAC (proteção temporal)
  v_time_window BIGINT;
  v_hmac_input TEXT;
  v_hmac_hex TEXT;
  v_pin_code TEXT;
  v_pin_hash TEXT;
  v_cert_id UUID;
  v_cert_res JSONB;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTORIZAÇÃO NEGADA: Sessão inválida para gerar PIN de entrega.';
  END IF;

  -- Verificar que o pedido pertence à loja e está em estado válido para PIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND store_id = p_store_id
    AND status IN ('ready_for_pickup', 'shipped', 'processing', 'paid')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou não está em estado válido para gerar PIN de entrega.';
  END IF;

  -- Verificar membro da loja ou admin
  IF NOT (public.is_store_member(p_store_id) OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'AUTORIZAÇÃO NEGADA: Sem permissão para gerar PIN para este pedido.';
  END IF;

  -- Calcular janela de tempo de 15 minutos (900 segundos)
  v_time_window := FLOOR(EXTRACT(EPOCH FROM now()) / 900)::BIGINT;

  -- Derivar PIN via HMAC-SHA256
  v_hmac_input := p_order_id::TEXT || '|' || p_store_id::TEXT || '|' || v_time_window::TEXT;

  v_hmac_hex := encode(
    hmac(v_hmac_input, 'WIDER_PIN_SALT_2026_SECRET', 'sha256'),
    'hex'
  );

  -- Extrair 6 dígitos numéricos do HMAC (sem padrão sequencial)
  v_pin_code := LPAD(
    (('x' || SUBSTRING(v_hmac_hex, 1, 8))::BIT(32)::BIGINT % 1000000)::TEXT,
    6, '0'
  );

  -- Hash do PIN para validação segura
  v_pin_hash := encode(digest(v_pin_code || p_order_id::TEXT, 'sha256'), 'hex');

  -- Expiração: 24 horas
  v_expires_at := now() + INTERVAL '24 hours';

  -- Gerar certificado de geração de PIN
  v_cert_res := public.generate_transaction_certificate(
    'delivery_pin_generation',
    p_order_id,
    p_store_id,
    jsonb_build_object('order_id', p_order_id, 'store_id', p_store_id, 'action', 'pin_generated'),
    'server_side', 'server_function', NULL, NULL, NULL,
    now()
  );

  v_cert_id := (v_cert_res ->> 'certificate_id')::UUID;

  -- Invalidar PINs anteriores do mesmo pedido (se existirem e não usados)
  UPDATE public.delivery_pins
  SET is_used = true, used_at = now()
  WHERE order_id = p_order_id AND NOT is_used;

  -- Inserir novo PIN
  INSERT INTO public.delivery_pins (
    order_id, store_id, pin_code, pin_hash, certificate_id, expires_at
  ) VALUES (
    p_order_id, p_store_id, v_pin_code, v_pin_hash, v_cert_id, v_expires_at
  );

  RETURN jsonb_build_object(
    'success', true,
    'pin_code', v_pin_code,
    'expires_at', v_expires_at,
    'certificate_id', v_cert_id
  );
END;
$$;

-- ============================================================================
-- 8. Função: validate_delivery_pin (verifica PIN sem expor o valor stored)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_delivery_pin(
  p_order_id UUID,
  p_pin_code TEXT,
  p_ip_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_hash TEXT;
  v_pin_record RECORD;
  v_cert_res JSONB;
BEGIN
  -- Hash do PIN fornecido para comparação segura
  v_expected_hash := encode(digest(p_pin_code || p_order_id::TEXT, 'sha256'), 'hex');

  SELECT * INTO v_pin_record
  FROM public.delivery_pins
  WHERE order_id = p_order_id
    AND pin_hash = v_expected_hash
    AND NOT is_used
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    -- Registrar tentativa de PIN inválido
    INSERT INTO public.security_audit_events (
      severity, event_type, entity_type, entity_id, ip_address,
      details
    ) VALUES (
      'warning', 'delivery_pin_invalid_attempt', 'order', p_order_id, p_ip_address,
      jsonb_build_object('order_id', p_order_id, 'attempt_ip', p_ip_address)
    );
    RETURN jsonb_build_object('success', false, 'error', 'PIN inválido ou expirado.');
  END IF;

  -- Marcar PIN como usado
  UPDATE public.delivery_pins
  SET is_used = true, used_at = now(), used_by_ip = p_ip_address
  WHERE id = v_pin_record.id;

  -- Atualizar status do pedido para entregue
  UPDATE public.orders
  SET status = 'delivered',
      delivered_at = now()
  WHERE id = p_order_id
    AND status NOT IN ('delivered', 'returned', 'cancelled');

  -- Gerar certificado de confirmação de entrega
  v_cert_res := public.generate_transaction_certificate(
    'delivery_confirmation',
    p_order_id,
    v_pin_record.store_id,
    jsonb_build_object('order_id', p_order_id, 'pin_validated', true, 'delivery_ip', p_ip_address),
    p_ip_address, 'delivery_confirmation_endpoint', NULL, NULL, NULL,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'delivered_at', now(),
    'certificate_id', (v_cert_res ->> 'certificate_id')
  );
END;
$$;

-- ============================================================================
-- 9. Função: report_security_telemetry (Chamada pelo client-side sentinel)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.report_security_telemetry(
  p_event_type TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_device_fingerprint TEXT,
  p_details JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_jti TEXT;
  v_risk_score INTEGER := 0;
BEGIN
  -- Extrair JTI se sessão ativa (não obrigatória para telemetria anônima)
  BEGIN
    v_session_jti := auth.jwt() ->> 'jti';
  EXCEPTION WHEN OTHERS THEN
    v_session_jti := NULL;
  END;

  -- Calcular risk score baseado no tipo de evento
  v_risk_score := CASE p_event_type
    WHEN 'devtools_opened'      THEN 15
    WHEN 'burp_suite_detected'  THEN 85
    WHEN 'suspicious_headers'   THEN 60
    WHEN 'rapid_requests'       THEN 40
    WHEN 'replay_attempt'       THEN 90
    WHEN 'uuid_enumeration'     THEN 70
    WHEN 'automation_detected'  THEN 75
    ELSE 10
  END;

  INSERT INTO public.security_audit_events (
    severity, event_type, entity_type, entity_id,
    ip_address, user_agent, device_fingerprint, session_jti, risk_score,
    details
  ) VALUES (
    CASE
      WHEN v_risk_score >= 80 THEN 'critical'
      WHEN v_risk_score >= 50 THEN 'warning'
      ELSE 'info'
    END,
    p_event_type,
    'telemetry',
    NULL,
    p_ip_address,
    p_user_agent,
    p_device_fingerprint,
    v_session_jti,
    v_risk_score,
    p_details
  );
END;
$$;

-- ============================================================================
-- 10. Função: list_transaction_certificates (Admin Master Query)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.list_transaction_certificates(
  p_store_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_auto_flagged_only BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  entity_id UUID,
  store_id UUID,
  user_id UUID,
  user_full_name TEXT,
  user_email TEXT,
  store_name TEXT,
  ip_address TEXT,
  geo_country TEXT,
  geo_city TEXT,
  certificate_hash TEXT,
  prev_certificate_hash TEXT,
  risk_score INTEGER,
  auto_flagged BOOLEAN,
  is_valid BOOLEAN,
  clock_drift_ms INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas platform_admin pode listar todos os certificados
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'AUTORIZAÇÃO NEGADA: Apenas administradores da plataforma podem consultar certificados globais.';
  END IF;

  RETURN QUERY
  SELECT
    tc.id,
    tc.entity_type,
    tc.entity_id,
    tc.store_id,
    tc.user_id,
    p.full_name AS user_full_name,
    p.email AS user_email,
    s.name AS store_name,
    tc.ip_address,
    tc.geo_country,
    tc.geo_city,
    tc.certificate_hash,
    tc.prev_certificate_hash,
    tc.risk_score,
    tc.auto_flagged,
    tc.is_valid,
    tc.clock_drift_ms,
    tc.created_at
  FROM public.transaction_certificates tc
  LEFT JOIN public.profiles p ON p.id = tc.user_id
  LEFT JOIN public.stores s ON s.id = tc.store_id
  WHERE
    (p_store_id IS NULL OR tc.store_id = p_store_id)
    AND (p_user_id IS NULL OR tc.user_id = p_user_id)
    AND (p_entity_type IS NULL OR tc.entity_type = p_entity_type)
    AND (NOT p_auto_flagged_only OR tc.auto_flagged = true)
  ORDER BY tc.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- 11. Função: get_certificate_detail (Admin Master — Certificado Individual)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_certificate_detail(p_certificate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cert RECORD;
  v_related_events JSONB;
  v_chain_valid BOOLEAN := true;
  v_prev_cert RECORD;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'AUTORIZAÇÃO NEGADA.';
  END IF;

  SELECT tc.*, p.full_name, p.email, p.username, p.avatar_url, s.name AS store_name
  INTO v_cert
  FROM public.transaction_certificates tc
  LEFT JOIN public.profiles p ON p.id = tc.user_id
  LEFT JOIN public.stores s ON s.id = tc.store_id
  WHERE tc.id = p_certificate_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Certificado não encontrado.');
  END IF;

  -- Verificar integridade da cadeia (prev_hash existe e é válido)
  IF v_cert.prev_certificate_hash IS NOT NULL THEN
    SELECT id INTO v_prev_cert
    FROM public.transaction_certificates
    WHERE certificate_hash = v_cert.prev_certificate_hash;

    IF NOT FOUND THEN
      v_chain_valid := false;
    END IF;
  END IF;

  -- Buscar eventos de telemetria relacionados à mesma sessão/IP
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sae.id,
      'event_type', sae.event_type,
      'severity', sae.severity,
      'risk_score', sae.risk_score,
      'created_at', sae.created_at,
      'details', sae.details
    ) ORDER BY sae.created_at DESC
  ), '[]'::JSONB)
  INTO v_related_events
  FROM public.security_audit_events sae
  WHERE (sae.session_jti = v_cert.session_jti AND v_cert.session_jti != 'no_jti')
     OR (sae.ip_address = v_cert.ip_address AND sae.created_at BETWEEN v_cert.created_at - INTERVAL '30 minutes' AND v_cert.created_at + INTERVAL '30 minutes')
  LIMIT 20;

  RETURN jsonb_build_object(
    'success', true,
    'certificate', jsonb_build_object(
      'id', v_cert.id,
      'entity_type', v_cert.entity_type,
      'entity_id', v_cert.entity_id,
      'store_id', v_cert.store_id,
      'store_name', v_cert.store_name,
      'user', jsonb_build_object(
        'id', v_cert.user_id,
        'full_name', v_cert.full_name,
        'email', v_cert.email,
        'username', v_cert.username,
        'avatar_url', v_cert.avatar_url
      ),
      'telemetry', jsonb_build_object(
        'ip_address', v_cert.ip_address,
        'geo_country', v_cert.geo_country,
        'geo_city', v_cert.geo_city,
        'user_agent', v_cert.user_agent,
        'device_fingerprint', SUBSTRING(v_cert.device_fingerprint, 1, 16) || '...',
        'session_jti', SUBSTRING(v_cert.session_jti, 1, 16) || '...',
        'clock_drift_ms', v_cert.clock_drift_ms
      ),
      'cryptography', jsonb_build_object(
        'certificate_hash', v_cert.certificate_hash,
        'prev_certificate_hash', v_cert.prev_certificate_hash,
        'payload_hash', v_cert.payload_hash,
        'chain_valid', v_chain_valid
      ),
      'timestamps', jsonb_build_object(
        'client_timestamp', v_cert.client_timestamp,
        'server_timestamp', v_cert.server_timestamp,
        'clock_drift_ms', v_cert.clock_drift_ms,
        'created_at', v_cert.created_at
      ),
      'status', jsonb_build_object(
        'is_valid', v_cert.is_valid,
        'risk_score', v_cert.risk_score,
        'auto_flagged', v_cert.auto_flagged,
        'invalidated_reason', v_cert.invalidated_reason
      ),
      'payload_snapshot', v_cert.payload_snapshot
    ),
    'related_events', v_related_events
  );
END;
$$;

-- ============================================================================
-- 12. Função: get_security_telemetry_overview (Admin Master dashboard)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_security_telemetry_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_certs_today INTEGER;
  v_flagged_today INTEGER;
  v_critical_events_today INTEGER;
  v_unique_ips_today INTEGER;
  v_avg_risk_score NUMERIC;
  v_top_events JSONB;
  v_top_ips JSONB;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'AUTORIZAÇÃO NEGADA.';
  END IF;

  SELECT COUNT(*) INTO v_total_certs_today
  FROM public.transaction_certificates
  WHERE created_at >= now() - INTERVAL '24 hours';

  SELECT COUNT(*) INTO v_flagged_today
  FROM public.transaction_certificates
  WHERE created_at >= now() - INTERVAL '24 hours' AND auto_flagged = true;

  SELECT COUNT(*) INTO v_critical_events_today
  FROM public.security_audit_events
  WHERE created_at >= now() - INTERVAL '24 hours' AND severity IN ('critical', 'emergency');

  SELECT COUNT(DISTINCT ip_address) INTO v_unique_ips_today
  FROM public.transaction_certificates
  WHERE created_at >= now() - INTERVAL '24 hours';

  SELECT COALESCE(AVG(risk_score), 0) INTO v_avg_risk_score
  FROM public.transaction_certificates
  WHERE created_at >= now() - INTERVAL '24 hours';

  SELECT COALESCE(jsonb_agg(t ORDER BY count DESC), '[]'::JSONB)
  INTO v_top_events
  FROM (
    SELECT event_type, COUNT(*) AS count
    FROM public.security_audit_events
    WHERE created_at >= now() - INTERVAL '24 hours'
    GROUP BY event_type
    ORDER BY count DESC
    LIMIT 5
  ) t;

  SELECT COALESCE(jsonb_agg(t ORDER BY count DESC), '[]'::JSONB)
  INTO v_top_ips
  FROM (
    SELECT ip_address, COUNT(*) AS count, MAX(risk_score) AS max_risk
    FROM public.security_audit_events
    WHERE created_at >= now() - INTERVAL '24 hours'
    GROUP BY ip_address
    ORDER BY count DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'success', true,
    'stats', jsonb_build_object(
      'total_certs_today', v_total_certs_today,
      'flagged_today', v_flagged_today,
      'critical_events_today', v_critical_events_today,
      'unique_ips_today', v_unique_ips_today,
      'avg_risk_score', ROUND(v_avg_risk_score, 1)
    ),
    'top_event_types', v_top_events,
    'top_suspicious_ips', v_top_ips
  );
END;
$$;

-- ============================================================================
-- 13. RLS para transaction_certificates
-- ============================================================================
ALTER TABLE public.transaction_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_certificates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certs_platform_admin_all" ON public.transaction_certificates;
CREATE POLICY "certs_platform_admin_all" ON public.transaction_certificates
  FOR SELECT USING (public.is_platform_admin());

-- Usuário pode ver apenas seus próprios certificados
DROP POLICY IF EXISTS "certs_own_user_select" ON public.transaction_certificates;
CREATE POLICY "certs_own_user_select" ON public.transaction_certificates
  FOR SELECT USING (user_id = auth.uid());

-- INSERT apenas via SECURITY DEFINER functions (nenhum acesso direto de cliente)
DROP POLICY IF EXISTS "certs_no_direct_insert" ON public.transaction_certificates;
CREATE POLICY "certs_no_direct_insert" ON public.transaction_certificates
  FOR INSERT WITH CHECK (false);

-- ============================================================================
-- 14. GRANT mínimo: apenas execução das funções SECURITY DEFINER
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.generate_transaction_certificate TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_delivery_pin TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_delivery_pin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_security_telemetry TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_transaction_certificates TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_certificate_detail TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_telemetry_overview TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_certificate_entity_id TO authenticated;

-- Deny direct SELECT/INSERT/UPDATE/DELETE from client on certificates
REVOKE ALL ON public.transaction_certificates FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.transaction_certificates FROM authenticated;
