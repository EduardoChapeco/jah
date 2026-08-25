-- ============================================================================
-- JAH PLATFORM — LEGAL COMPLIANCE, LGPD & IMMUTABLE CONSENT LOGS SCHEMA
-- ============================================================================

-- 1. Documentos Legais e Políticas da Plataforma (Editáveis pelo Admin)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'platform_terms' CHECK (category IN ('platform_terms', 'privacy_lgpd', 'cookies', 'disclaimer', 'seller_terms', 'delivery_terms', 'returns_policy', 'general')),
  content_markdown TEXT NOT NULL,
  content_html TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  summary TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_docs_slug ON public.legal_documents(slug);
CREATE INDEX IF NOT EXISTS idx_legal_docs_cat ON public.legal_documents(category);

-- 2. Tabela de Logs Forenses de Aceite (LGPD / Prova de Consentimento)
CREATE TABLE IF NOT EXISTS public.legal_terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  term_type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  ip_address_hash TEXT,
  user_agent TEXT,
  session_id TEXT,
  signature_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Garantir que colunas adicionais existam caso a tabela já tenha sido criada anteriormente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_terms_acceptances' AND column_name = 'ip_address') THEN
    ALTER TABLE public.legal_terms_acceptances ADD COLUMN ip_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_terms_acceptances' AND column_name = 'metadata') THEN
    ALTER TABLE public.legal_terms_acceptances ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Remover check constraint rígido antigo de term_type se existir
ALTER TABLE public.legal_terms_acceptances DROP CONSTRAINT IF EXISTS legal_terms_acceptances_term_type_check;

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON public.legal_terms_acceptances(user_id, term_type);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_created ON public.legal_terms_acceptances(accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_ip ON public.legal_terms_acceptances(ip_address);

-- 3. Habilitar RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para legal_documents
DROP POLICY IF EXISTS "Public can read published legal documents" ON public.legal_documents;
CREATE POLICY "Public can read published legal documents" ON public.legal_documents
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage legal documents" ON public.legal_documents;
CREATE POLICY "Admins can manage legal documents" ON public.legal_documents
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
    OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
  );

-- Políticas de RLS para legal_terms_acceptances
DROP POLICY IF EXISTS "Anyone can insert legal acceptances" ON public.legal_terms_acceptances;
CREATE POLICY "Anyone can insert legal acceptances" ON public.legal_terms_acceptances
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own legal acceptances" ON public.legal_terms_acceptances;
CREATE POLICY "Users can view own legal acceptances" ON public.legal_terms_acceptances
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
    OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS "Admins can manage all legal acceptances" ON public.legal_terms_acceptances;
CREATE POLICY "Admins can manage all legal acceptances" ON public.legal_terms_acceptances
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('platform_admin', 'master', 'admin'))
    OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.profile_id = auth.uid() AND wm.role IN ('owner', 'admin'))
  );

-- 4. Seed de Documentos Legais Canônicos
INSERT INTO public.legal_documents (slug, title, category, version, is_published, is_mandatory, summary, content_markdown)
VALUES
(
  'termos',
  'Termos Gerais de Uso e Condições da Plataforma JAH',
  'platform_terms',
  '2.0',
  true,
  true,
  'Regras gerais de utilização, responsabilidades de contas, comércio eletrônico, intermediação e convivência na plataforma JAH.',
  E'# Termos Gerais de Uso e Condições da Plataforma JAH\n\n**Última atualização:** Agosto de 2026 | **Versão:** 2.0\n\nBem-vindo à **JAH**, uma plataforma de ecossistema integrado que reúne comércio local, serviços, classificados, cultura e mobilidade urbana.\n\nAo acessar ou utilizar a plataforma JAH, você concorda integralmente com estes Termos de Serviço e com todas as diretrizes complementares aqui referenciadas.\n\n---\n\n### 1. Objeto e Natureza da Plataforma\n1.1. A JAH opera como plataforma tecnológica de intermediação digital, permitindo que consumidores, produtores, comerciantes independentes, prestadores de serviços e motoristas parceiros se conectem de forma ágil e segura.\n1.2. O cadastro e utilização de recursos transacionais da plataforma implicam a aceitação expressa e inequívoca destas regras.\n\n### 2. Cadastro, Conta e Responsabilidade do Usuário\n2.1. Para usufruir de recursos completos (compras, agendamentos, anúncios de classificados e gestão de lojas), o usuário deve criar uma conta fornecendo dados verídicos e atualizados.\n2.2. A conta é pessoal e intransferível. O usuário é o único responsável pela guarda e sigilo de suas credenciais de acesso.\n2.3. A JAH reserva-se o direito de suspender ou encerrar contas que violem normas legais, pratiquem fraudes ou desrespeitem as políticas comunitárias.\n\n### 3. Compras, Pagamentos e Liquidação Financeira\n3.1. As transações realizadas através do checkout integrado são processadas por instituições de pagamento parceiras devidamente autorizadas pelo Banco Central do Brasil.\n3.2. Os preços exibidos na vitrine pública são informados e mantidos pelos respectivos lojistas e vendedores parceiros.\n\n### 4. Propriedade Intelectual\n4.1. Toda a identidade visual, código-fonte, arquitetura, design system, logomarcas e conteúdos originais da JAH são de propriedade exclusiva da plataforma e protegidos pela legislação de propriedade industrial e direitos autorais.\n\n### 5. Foro e Legislação Aplicável\n5.1. Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o Marco Civil da Internet (Lei nº 12.965/2014) e o Código de Defesa do Consumidor (Lei nº 8.078/1990).'
),
(
  'privacidade',
  'Política de Privacidade e Proteção de Dados (LGPD)',
  'privacy_lgpd',
  '2.0',
  true,
  true,
  'Diretrizes de coleta, tratamento, armazenamento seguro e direitos dos titulares de dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
  E'# Política de Privacidade e Proteção de Dados (LGPD)\n\n**Última atualização:** Agosto de 2026 | **Versão:** 2.0\n\nA **JAH** está comprometida com a privacidade, transparência e proteção rigorosa dos dados pessoais de todos os seus usuários, visitantes, clientes e parceiros comerciais, em estrita conformidade com a **Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)**.\n\n---\n\n### 1. Dados Pessoais Coletados\nColetamos apenas os dados necessários para o fornecimento seguro e eficiente de nossos serviços:\n- **Dados Cadastrais:** Nome completo, e-mail, telefone/WhatsApp, CPF/CNPJ e endereço de entrega.\n- **Dados Técnicos & Logs:** Endereço IP, tipo de navegador (User-Agent), identificadores de sessão, data/hora de acessos e registros forenses de aceite de termos.\n- **Dados Transacionais:** Histórico de pedidos, comprovantes de pagamento e registros de agendamentos.\n\n### 2. Finalidades do Tratamento de Dados\nOs dados são tratados para as seguintes finalidades legítimas:\n- Processamento e entrega de pedidos e encomendas.\n- Autenticação e segurança contra acessos não autorizados e fraudes.\n- Comunicação operacional sobre pedidos, reservas e entregas via WhatsApp e e-mail.\n- Cumprimento de obrigações legais, fiscais e regulatórias (Marco Civil da Internet, art. 15).\n\n### 3. Compartilhamento Seguro de Dados\n3.1. A JAH não comercializa nem compartilha dados pessoais com terceiros para fins de marketing sem o seu consentimento expresso.\n3.2. O compartilhamento ocorre estritamente com:\n  - Lojistas parceiros (apenas os dados essenciais para despacho do pedido);\n  - Operadores logísticos e entregadores (endereço e nome do destinatário);\n  - Gateways de pagamento e autoridades públicas quando legalmente requisitado.\n\n### 4. Direitos do Titular de Dados\nEm conformidade com o Artigo 18 da LGPD, você pode a qualquer momento:\n- Confirmar a existência de tratamento e acessar seus dados;\n- Solicitar a correção de dados incompletos ou inexatos;\n- Solicitar a portabilidade ou a anonimização/exclusão de sua conta.\n\nPara exercer seus direitos, acesse o painel **Minha Conta > Suporte & LGPD** ou envie e-mail para privacidade@jah.com.br.'
),
(
  'cookies',
  'Política de Cookies e Gestão de Consentimento Digital',
  'cookies',
  '2.0',
  true,
  false,
  'Explicação sobre o uso de cookies estritamente necessários, funcionais, analíticos e como seu consentimento é registrado com valor probatório.',
  E'# Política de Cookies e Gestão de Consentimento Digital\n\n**Última atualização:** Agosto de 2026 | **Versão:** 2.0\n\nEsta Política de Cookies explica como a plataforma **JAH** utiliza cookies e tecnologias similares para garantir uma navegação fluida, segura e personalizada.\n\n---\n\n### 1. O que são Cookies?\nCookies são pequenos arquivos de texto armazenados no seu navegador que auxiliam no reconhecimento do seu dispositivo, na manutenção da sua sessão segura e na preservação de suas preferências.\n\n### 2. Categorias de Cookies Utilizados\n- **Cookies Estritamente Necessários:** Indispensáveis para o funcionamento da plataforma, login seguro, identificação do espaço de trabalho (tenant ativo) e persistência do carrinho de compras.\n- **Cookies de Funcionalidade:** Armazenam suas preferências visuais (modo escuro/claro, loja favorita e localização aproximada para cálculo de frete).\n- **Cookies de Auditoria e Consentimento:** Registram com valor probatório o momento, versão e IP do aceite dos termos legais, garantindo que o aviso não seja reexibido desnecessariamente.\n\n### 3. Gerenciamento e Revogação\nVocê pode alterar suas preferências de cookies ou limpar os dados salvos a qualquer momento através das configurações do seu navegador ou na aba de governança da sua conta.'
),
(
  'isencao',
  'Termo de Isenção da Plataforma e Diretrizes de Negociações P2P',
  'disclaimer',
  '2.0',
  true,
  false,
  'Isenção de responsabilidade sobre negociações diretas entre usuários, anúncios de classificados, contratações de serviços autônomos e cuidados preventivos.',
  E'# Termo de Isenção da Plataforma e Diretrizes de Negociações P2P\n\n**Última atualização:** Agosto de 2026 | **Versão:** 2.0\n\nEste documento estabelece as diretrizes e limites de responsabilidade referentes à utilização das áreas de **Classificados, Desapego, Mural Comunitário, Empregos e Negociações Diretas (P2P)** na plataforma JAH.\n\n---\n\n### 1. Intermediação e Papel da Plataforma\n1.1. A JAH atua como facilitadora tecnológica e vitrine digital para que usuários particulares, autônomos e anunciantes publiquem itens, veículos, imóveis, serviços e vagas.\n1.2. Nas negociações diretas entre particulares que não utilizam o checkout integrado da JAH, a plataforma **não é parte integrante do contrato de compra e venda** e não detém a posse física dos bens anunciados.\n\n### 2. Isenção Expressa de Responsabilidade\n2.1. A JAH não se responsabiliza por:\n  - Vícios ocultos, defeitos, autenticidade ou qualidade dos produtos negociados diretamente fora do fluxo com garantia da plataforma;\n  - Prazos de entrega ou acordos verbais firmados exclusivamente entre compradores e vendedores autônomos;\n  - Pagamentos realizados fora dos meios seguros disponibilizados pela JAH (ex: depósitos antecipados não rastreados).\n\n### 3. Recomendações de Segurança para Negociações\n- **Nunca realize pagamentos antecipados** a vendedores não verificados sem antes inspecionar o produto presencialmente;\n- Marque encontros para entrega em locais públicos e movimentados;\n- Denuncie imediatamente qualquer anúncio com indício de fraude ou conteúdo proibido através do botão **Denunciar Anúncio**.'
),
(
  'lojistas',
  'Termos de Adesão e Responsabilidades de Lojistas e Empresas',
  'seller_terms',
  '2.0',
  true,
  true,
  'Contrato de parceria e credenciamento de vendedores, normas de catálogo, atendimento ao consumidor, comissões, prazos de envio e conduta comercial.',
  E'# Termos de Adesão e Responsabilidades de Lojistas e Empresas\n\n**Última atualização:** Agosto de 2026 | **Versão:** 2.0\n\nEstes Termos regulam o credenciamento, manutenção de loja virtual e venda de produtos e serviços por estabelecimentos comerciais e produtores no ecossistema **JAH**.\n\n---\n\n### 1. Credenciamento e Verificação (KYC)\n1.1. O lojista deve comprovar regularidade cadastral (CNPJ/MEI ou CPF de produtor rural/artesão) e passar pelo processo de verificação de identidade antes de receber repasses financeiros.\n1.2. É expressamente proibida a comercialização de produtos ilícitos, falsificados, medicamentos sem prescrição, armas ou itens que infrinjam direitos autorais.\n\n### 2. Estoque, Prazos de Envio e Atendimento\n2.1. O lojista se compromete a manter os estoques e preços rigorosamente sincronizados no catálogo do Workspace.\n2.2. Pedidos confirmados devem ser despachados dentro do prazo acordado com o cliente.\n2.3. O atendimento a dúvidas e pedidos de suporte deve ser respondido com presteza e cortesia.\n\n### 3. Comissões e Repasses Financeiros\n3.1. As taxas de intermediação e tarifas de processamento são descontadas automaticamente na liquidação financeira de cada venda conforme o plano contratado.\n3.2. Em caso de chargeback ou cancelamento motivado por falha do lojista, os valores serão debitados do saldo a receber.'
),
(
  'trocas-e-devolucoes',
  'Políticas de Trocas, Devoluções e Cancelamentos',
  'returns_policy',
  '2.0',
  true,
  false,
  'Regras para exercício do direito de arrependimento (Art. 49 do CDC), devolução por defeito, prazos de estorno e procedimento de logística reversa.',
  E'# Políticas de Trocas, Devoluções e Cancelamentos\n\n**Última atualização:** Agosto de 2026 | **Versão:** 2.0\n\nA plataforma **JAH** assegura a todos os consumidores o pleno exercício dos seus direitos conforme estabelecido no **Código de Defesa do Consumidor (Lei nº 8.078/1990)**.\n\n---\n\n### 1. Direito de Arrependimento (Compras Online)\n1.1. Para produtos não perecíveis adquiridos online, o consumidor tem o prazo de **7 (sete) dias corridos**, contados a partir da data de recebimento da mercadoria, para manifestar o arrependimento e solicitar a devolução.\n1.2. O produto deve estar em sua embalagem original, sem indícios de uso indevido e acompanhado de todos os seus acessórios e nota fiscal.\n\n### 2. Produtos com Vício ou Defeito de Fabricação\n2.1. Caso o item entregue apresente avaria ou defeito, o cliente tem até **30 dias** (produtos não duráveis) ou **90 dias** (produtos duráveis) para acionar a garantia.\n\n### 3. Como Solicitar uma Troca ou Devolução\n3.1. Acesse **Minha Conta > Meus Pedidos**, selecione o pedido em questão e clique em **Solicitar Troca / Devolução**.\n3.2. A equipe do lojista e o time de suporte da JAH analisarão a solicitação e fornecerão as instruções de postagem ou coleta reversa.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  version = EXCLUDED.version,
  summary = EXCLUDED.summary,
  content_markdown = EXCLUDED.content_markdown,
  updated_at = timezone('utc'::text, now());
