-- ============================================================================
-- Migration: 20260928000000_courier_fraud_prevention_private_stores_and_tokenized_ledger.sql
-- Descrição: Tabelas para Onboarding de Entregadores com Cross-Check Anti-Fraude,
--            Minivídeo de Liveness, Circuit Breaker, Lojas Privadas/Ocultas,
--            Transações Tokenizadas Confidenciais e Termos Legais de Não-Vínculo.
-- ============================================================================

-- 1. Onboarding de Entregadores & Cross-Check Facial/Documental (Anti-Fraude)
CREATE TABLE IF NOT EXISTS public.courier_onboarding_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    initial_kyc_id UUID REFERENCES public.identity_kyc_verifications(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'cnh' CHECK (document_type IN ('cnh', 'rg')),
    document_number TEXT NOT NULL,
    document_front_url TEXT NOT NULL,
    document_back_url TEXT,
    selfie_url TEXT NOT NULL,
    liveness_video_url TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'car', 'van', 'truck', 'bicycle')),
    vehicle_plate TEXT,
    vehicle_model TEXT,
    vehicle_color TEXT,
    crosscheck_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (crosscheck_status IN ('pending', 'processing', 'match_approved', 'divergence_flagged', 'manual_review', 'fraud_rejected', 'circuit_breaker_halted')),
    crosscheck_details JSONB DEFAULT '{}'::jsonb,
    criminal_record_status TEXT DEFAULT 'pending' 
        CHECK (criminal_record_status IN ('pending', 'clean', 'warrant_detected', 'manual_review')),
    police_notification_flag BOOLEAN DEFAULT false,
    legal_acceptance_id UUID REFERENCES public.legal_terms_acceptances(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_courier_apps_user ON public.courier_onboarding_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_courier_apps_status ON public.courier_onboarding_applications(crosscheck_status);
CREATE INDEX IF NOT EXISTS idx_courier_apps_cpf ON public.courier_onboarding_applications(cpf);

-- 2. Dossiê Forense de Fraude Documental e Tentativa de Laranja
CREATE TABLE IF NOT EXISTS public.fraud_investigation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    suspect_name TEXT NOT NULL,
    suspect_cpf TEXT,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('courier_identity_mismatch', 'document_forgery', 'stolen_credentials', 'fake_liveness', 'multiple_accounts_attempt')),
    target_entity_type TEXT NOT NULL DEFAULT 'courier_application',
    target_entity_id TEXT NOT NULL,
    divergence_summary TEXT NOT NULL,
    evidence_payload JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT NOT NULL DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    police_notified BOOLEAN NOT NULL DEFAULT false,
    police_report_protocol TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'forwarded_to_authorities', 'resolved_false_positive', 'banned')),
    investigated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_fraud_logs_suspect ON public.fraud_investigation_logs(suspect_cpf, attempt_type);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_status ON public.fraud_investigation_logs(status, severity);

-- 3. Evolução da tabela STORES (Lojas Ocultas, Proteção por Senha e Marketplace Seletivo)
ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS is_hidden_from_directory BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'public' CHECK (access_type IN ('public', 'password_protected', 'members_only')),
    ADD COLUMN IF NOT EXISTS access_password_hash TEXT,
    ADD COLUMN IF NOT EXISTS marketplace_commission_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS only_catalog_mode BOOLEAN DEFAULT false;

-- 4. Evolução da tabela PRODUCTS (Publicação Seletiva no Marketplace vs Catálogo Direto)
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS publish_to_marketplace BOOLEAN DEFAULT true;

-- 5. Evolução da tabela PERSONAL_FINANCIAL_ENTRIES (Transações Confidenciais & Tokenizadas)
ALTER TABLE public.personal_financial_entries
    ADD COLUMN IF NOT EXISTS is_confidential_tokenized BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS anonymized_token TEXT,
    ADD COLUMN IF NOT EXISTS forensic_key_fingerprint TEXT;

-- 6. Habilitação de RLS nas Novas Tabelas
ALTER TABLE public.courier_onboarding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_investigation_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Políticas RLS: courier_onboarding_applications
DO $$
BEGIN
    DROP POLICY IF EXISTS "courier_apps_user_select" ON public.courier_onboarding_applications;
    DROP POLICY IF EXISTS "courier_apps_user_insert" ON public.courier_onboarding_applications;
    DROP POLICY IF EXISTS "courier_apps_user_update" ON public.courier_onboarding_applications;
    DROP POLICY IF EXISTS "courier_apps_admin_all" ON public.courier_onboarding_applications;

    -- Usuário pode ver suas próprias inscrições
    CREATE POLICY "courier_apps_user_select" ON public.courier_onboarding_applications
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());

    -- Usuário pode submeter sua própria inscrição
    CREATE POLICY "courier_apps_user_insert" ON public.courier_onboarding_applications
        FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid());

    -- Usuário pode atualizar enquanto pendente
    CREATE POLICY "courier_apps_user_update" ON public.courier_onboarding_applications
        FOR UPDATE TO authenticated
        USING (user_id = auth.uid() AND crosscheck_status IN ('pending', 'divergence_flagged'))
        WITH CHECK (user_id = auth.uid());

    -- Master Admin tem acesso irrestrito
    CREATE POLICY "courier_apps_admin_all" ON public.courier_onboarding_applications
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                  AND profiles.role IN ('admin', 'master', 'platform_admin')
            )
        );
END $$;

-- 6.2 Políticas RLS: fraud_investigation_logs (Acesso restrito ao CISO / Admin Master)
DO $$
BEGIN
    DROP POLICY IF EXISTS "fraud_logs_admin_only" ON public.fraud_investigation_logs;
    CREATE POLICY "fraud_logs_admin_only" ON public.fraud_investigation_logs
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                  AND profiles.role IN ('admin', 'master', 'platform_admin')
            )
        );
END $$;

-- 7. Seed/Upsert dos Termos Legais Invioláveis de Entregadores (Não-Vínculo & Liberdade)
INSERT INTO public.legal_documents (
    slug,
    title,
    category,
    version,
    is_mandatory,
    is_published,
    summary,
    content_markdown,
    published_at,
    created_at,
    updated_at
) VALUES (
    'entregadores',
    'Termos e Condições para Entregadores, Motoristas e Parceiros de Logística',
    'delivery_terms',
    '4.0',
    true,
    true,
    'Diretrizes de autonomia total, não-vínculo empregatício, liberdade de jornada, não-punitividade na recusa de chamados e conformidade de segurança pública.',
    '# Termos de Parceria, Autonomia e Prestação de Serviços de Logística (Wider Platform v4.0)

## 1. Natureza Jurídica e Inexistência de Vínculo Empregatício
1.1. O presente instrumento regula a relação estritamente comercial de intermediação tecnológica entre a Plataforma Wider e o Entregador/Motorista Parceiro autônomo.
1.2. Não há qualquer subordinação jurídica, dependência econômica, habitualidade obrigatória ou vínculo empregatício de qualquer natureza sob as regras da CLT (Consolidação das Leis do Trabalho).
1.3. O Entregador atua como profissional autônomo, MEI ou pessoa jurídica, detentor exclusivo de seus instrumentos de trabalho (veículo próprio, smartphone e equipamentos).

## 2. Liberdade Plena de Horários, Jornada e Escolha de Clientes
2.1. **Autonomia de Conexão:** O Entregador tem total e irrestrita liberdade para decidir os dias, horários e locais em que deseja se conectar ou permanecer desconectado do aplicativo, sem exigência de cumprimento de jornada mínima ou máxima.
2.2. **Livre Escolha de Chamados (Não-Punitividade Absoluta):** O Entregador é plenamente livre para aceitar, ignorar ou recusar qualquer chamado, corrida ou frete que lhe seja apresentado.
2.3. **Proibição de Penalidades:** A recusa ou o não atendimento de chamados NUNCA acarretará punições, bloqueios, multas, desativações ou rebaixamentos algorítmicos. Quem escolhe o atendimento é soberanamente o Entregador.
2.4. **Pluralidade de Plataformas:** O Entregador tem o direito garantido de prestar serviços simultaneamente para outros aplicativos, empresas concorrentes ou clientes particulares.

## 3. Verificação de Identidade, Biometria e Triagem de Segurança Pública
3.1. **Conformidade em Duas Etapas:** Para proteção de toda a comunidade, o Entregador consente com a validação em 2 etapas: verificação de perfil inicial e validação especializada de CNH, selfie com prova de vida (minivídeo de liveness) e antecedentes criminais.
3.2. **Cross-Check de Titularidade (Prevenção de Fraudes e "Laranjas"):** A Plataforma utiliza inteligência de dados para confrontar os registros da conta principal com a documentação do entregador. É expressamente vedado o uso de conta por terceiros ou o cadastro de documentos alheios.
3.3. **Comunicação às Autoridades Policiais:** Constatada tentativa deliberada de falsidade ideológica, uso de documento falso ou identificação de mandado de prisão em aberto (status de foragido da justiça), a Plataforma encaminhará incontinente o dossiê probatório às autoridades policiais e judiciais competentes.

## 4. Repasses Financeiros e Tarifas Dinâmicas
4.1. O Entregador receberá integralmente o valor acordado pelo serviço de transporte, deduzida exclusivamente a taxa de intermediação tecnológica transparente quando aplicável.
4.2. O Entregador pode utilizar o motor de Precificação Dinâmica (Surge Pricing) para configurar suas próprias tarifas de chuva, horários de pico e taxas noturnas.',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    version = EXCLUDED.version,
    is_published = true,
    summary = EXCLUDED.summary,
    content_markdown = EXCLUDED.content_markdown,
    updated_at = timezone('utc'::text, now());
