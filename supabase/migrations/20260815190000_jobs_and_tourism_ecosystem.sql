-- Migration: 20260815190000_jobs_and_tourism_ecosystem.sql
-- Description: Criação das tabelas reais, RLS e dados canônicos de Empregos (Jobs) e Turismo (Tourism Experiences).

-- ==============================================================================
-- 1. TABELA DE VAGAS DE EMPREGO (jobs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  category TEXT NOT NULL DEFAULT 'clt' CHECK (category IN ('clt', 'pj', 'estagio', 'tech', 'comercial', 'operacional', 'saude', 'outros')),
  location TEXT NOT NULL,
  workplace_type TEXT NOT NULL DEFAULT 'Presencial' CHECK (workplace_type IN ('Presencial', 'Híbrido', 'Remoto')),
  contract_type TEXT NOT NULL DEFAULT 'CLT' CHECK (contract_type IN ('CLT', 'PJ', 'Estágio', 'Freelancer', 'Temporário')),
  salary_display TEXT NOT NULL,
  salary_min_cents BIGINT,
  salary_max_cents BIGINT,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  contact_whatsapp TEXT,
  contact_email TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC) WHERE status = 'active';

-- ==============================================================================
-- 2. TABELA DE CANDIDATURAS A VAGAS (job_applications)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);

-- ==============================================================================
-- 3. TABELA DE EXPERIÊNCIAS TURÍSTICAS (tourism_experiences)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tourism_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'passeios' CHECK (category IN ('passeios', 'hospedagens', 'gastronomia_turistica', 'aventura', 'agencias', 'cultura')),
  location TEXT NOT NULL,
  duration TEXT NOT NULL,
  price_display TEXT NOT NULL,
  price_cents BIGINT,
  image_url TEXT NOT NULL,
  gallery_urls TEXT[] DEFAULT '{}',
  provider_name TEXT NOT NULL,
  provider_logo_url TEXT,
  contact_whatsapp TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 5.0,
  included_items TEXT[] DEFAULT '{}',
  what_to_bring TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tourism_category ON public.tourism_experiences(category) WHERE status = 'active';

-- ==============================================================================
-- 4. TABELA DE RESERVAS / INTERESSES EM TURISMO (tourism_inquiries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tourism_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.tourism_experiences(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  desired_date DATE,
  guests_count INTEGER DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourism_inquiries ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
CREATE POLICY "Jobs são públicos para visualização se ativos"
  ON public.jobs FOR SELECT
  USING (status = 'active' OR auth.uid() = author_profile_id);

CREATE POLICY "Usuários autenticados podem criar vagas"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autores podem atualizar suas vagas"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = author_profile_id);

-- Job Applications Policies
CREATE POLICY "Qualquer visitante ou usuário pode enviar candidatura"
  ON public.job_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Candidatos e donos da vaga podem ver candidaturas"
  ON public.job_applications FOR SELECT
  USING (
    auth.uid() = candidate_profile_id
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND (j.author_profile_id = auth.uid())
    )
  );

-- Tourism Experiences Policies
CREATE POLICY "Experiências turísticas são públicas se ativas"
  ON public.tourism_experiences FOR SELECT
  USING (status = 'active' OR auth.uid() = author_profile_id);

CREATE POLICY "Usuários autenticados podem criar experiências turísticas"
  ON public.tourism_experiences FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autores podem atualizar experiências turísticas"
  ON public.tourism_experiences FOR UPDATE
  USING (auth.uid() = author_profile_id);

-- Tourism Inquiries Policies
CREATE POLICY "Qualquer visitante ou usuário pode enviar interesse turístico"
  ON public.tourism_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes e provedores podem ver solicitações turísticas"
  ON public.tourism_inquiries FOR SELECT
  USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM public.tourism_experiences te
      WHERE te.id = experience_id AND (te.author_profile_id = auth.uid())
    )
  );

-- ==============================================================================
-- 6. SEED CANÔNICO REAL DE VAGAS E TURISMO
-- ==============================================================================
INSERT INTO public.jobs (
  id, title, company_name, category, location, workplace_type, contract_type,
  salary_display, salary_min_cents, salary_max_cents, description,
  requirements, benefits, contact_whatsapp, is_featured, status
) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  'Desenvolvedor(a) Full Stack React & Node.js',
  'TechOeste Inovação Digital',
  'tech',
  'Centro — Chapecó / Híbrido',
  'Híbrido',
  'CLT',
  'R$ 6.500 a R$ 8.500',
  650000,
  850000,
  'Buscamos profissional experiente para integrar nosso squad de produto, atuando na arquitetura, desenvolvimento de novas features e otimização contínua de plataformas web e mobile em TypeScript, React, Tailwind CSS e Supabase.',
  ARRAY['Experiência sólida com React, TypeScript e Node.js', 'Conhecimento prático em modelagem relacional PostgreSQL', 'Familiaridade com Docker, CI/CD e boas práticas de Clean Architecture', 'Experiência com APIs REST e Serverless Functions'],
  ARRAY['Vale Refeição / Alimentação R$ 950/mês no cartão flexível', 'Plano de Saúde Unimed Nacional sem coparticipação', 'Auxílio Home Office & Ergonomia R$ 300/mês', 'Gympass / TotalPass', 'Budget anual de R$ 3.000 para cursos e conferências'],
  '49998811223',
  true,
  'active'
),
(
  'e0000000-0000-0000-0000-000000000002',
  'Consultor(a) de Vendas B2B & Expansão Comercial',
  'AgroIndustrial Chapecó',
  'comercial',
  'Distrito Industrial — Chapecó',
  'Presencial',
  'CLT',
  'R$ 3.800 + Comissões sem teto',
  380000,
  950000,
  'Responsável pela prospecção ativa de cooperativas, produtores e indústrias no Oeste Catarinense, apresentação de catálogo técnico de insumos e negociação de contratos de médio e grande porte.',
  ARRAY['Experiência comprovada em vendas consultivas B2B no segmento agro ou industrial', 'CNH B ativa e disponibilidade para viagens regionais', 'Excelente comunicação interpessoal e poder de negociação', 'Domínio de ferramentas de CRM (HubSpot, RD Station ou Salesforce)'],
  ARRAY['Comissões atrativas e sem teto de faturamento', 'Veículo da empresa para rotas comerciais', 'Vale Combustível e reembolso de despesas de viagem', 'Plano Odontológico e Seguro de Vida', 'Participação nos Lucros e Resultados (PLR)'],
  '49991224455',
  true,
  'active'
),
(
  'e0000000-0000-0000-0000-000000000003',
  'Estágio em Marketing Digital & Criação de Conteúdo',
  'Studio Criativo Oeste',
  'estagio',
  'Santa Maria — Chapecó',
  'Híbrido',
  'Estágio',
  'Bolsa R$ 1.600 + VT',
  160000,
  160000,
  'Apoio na produção criativa para redes sociais (Instagram Reels, TikTok e LinkedIn), elaboração de roteiros, edição de vídeos curtos, monitoramento de métricas e suporte no planejamento de campanhas pagas.',
  ARRAY['Cursando a partir do 3º semestre de Publicidade, Design, Marketing ou Jornalismo', 'Noções de Figma, Photoshop, Illustrator ou Premiere/CapCut', 'Excelente redação e afinidade com tendências digitais', 'Proatividade e vontade de aprender na prática'],
  ARRAY['Bolsa auxílio compatível com o mercado', 'Vale Transporte ou Auxílio Mobilidade', 'Ambiente descontraído com café especial e lanches', 'Possibilidade real de efetivação como Assistente em 6 meses'],
  '49999331122',
  false,
  'active'
),
(
  'e0000000-0000-0000-0000-000000000004',
  'Enfermeiro(a) Plantonista 12x36',
  'Clínica Integrada Regional',
  'saude',
  'Jardim Itália — Chapecó',
  'Presencial',
  'CLT',
  'R$ 4.850 + Insalubridade 20%',
  485000,
  582000,
  'Supervisão da equipe técnica de enfermagem, acolhimento humanizado e triagem ambulatorial de pacientes, administração de medicamentos complexos e cumprimento rigoroso dos protocolos sanitários.',
  ARRAY['Graduação completa em Enfermagem', 'Registro ativo e regular no COREN-SC', 'Experiência prévia em pronto atendimento, UTI ou clínica especializada', 'Cursos atualizados de ACLS ou BLS são diferenciais'],
  ARRAY['Adicional de Insalubridade (20%)', 'Alimentação balanceada fornecida no refeitório da clínica', 'Plano de Saúde Unimed e Plano Odontológico', 'Convênio farmácia com desconto em folha', 'Estacionamento privativo no local'],
  '4933224400',
  false,
  'active'
),
(
  'e0000000-0000-0000-0000-000000000005',
  'Assistente de Logística & Expedição de Cargas',
  'Express Logística & Transportes',
  'operacional',
  'Efapi — Chapecó',
  'Presencial',
  'CLT',
  'R$ 2.650 + Bônus Produtividade',
  265000,
  320000,
  'Conferência física e fiscal de mercadorias no recebimento e expedição, roteirização otimizada para entregas municipais e interestaduais, controle de estoques e emissão de manifestos de transporte.',
  ARRAY['Ensino Médio completo (curso técnico em Logística é um diferencial)', 'Experiência em expedição, armazém ou transporte rodoviário', 'Conhecimento em sistemas WMS ou ERP de logística', 'Disponibilidade de horário para turnos rotativos'],
  ARRAY['Cesta Básica mensal de R$ 350', 'Vale Transporte ou Estacionamento gratuito', 'Seguro de Vida em grupo', 'Refeitório no local com refeições inclusas', 'Bônus por metas operacionais batidas'],
  '49998117788',
  false,
  'active'
),
(
  'e0000000-0000-0000-0000-000000000006',
  'Atendente de Restaurante & Caixa',
  'Bistrô & Cafeteria São Cristóvão',
  'clt',
  'São Cristóvão — Chapecó',
  'Presencial',
  'CLT',
  'R$ 2.100 + Gorjetas Semanais',
  210000,
  280000,
  'Atendimento receptivo aos clientes no balcão e salão, preparação de cafés especiais e bebidas não alcoólicas, operação de PDV/caixa e zelo pela higienização e organização do bistrô.',
  ARRAY['Ensino Médio completo', 'Excelente simpatia, empatia e facilidade de comunicação', 'Disponibilidade para escala 6x1 (incluindo fins de semana e feriados)', 'Experiência em cafeteria, bar ou restaurante é bem-vinda'],
  ARRAY['Divisão semanal de gorjetas da equipe', 'Alimentação de alta qualidade no local', 'Vale Transporte integral', 'Desconto de 40% em todos os produtos do cardápio', 'Folga semanal fixa e 1 domingo no mês'],
  '49991223399',
  false,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Canônico de Turismo
INSERT INTO public.tourism_experiences (
  id, title, subtitle, description, category, location, duration,
  price_display, price_cents, image_url, gallery_urls, provider_name,
  contact_whatsapp, rating, included_items, what_to_bring, is_featured, status
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'Passeio de Catamarã no Vale do Rio Uruguai',
  'Navegação cênica pelas águas calmas do Rio Uruguai com almoço colonial típico a bordo.',
  'Uma das experiências mais emblemáticas do Oeste Catarinense. Embarque em um catamarã moderno e estável para navegar pelos cânions e ilhas fluviais do Rio Uruguai. Durante o trajeto de 4 horas, você apreciará a fauna nativa, formações rochosas milenares e desfrutará de um autêntico almoço colonial servido a bordo com costelão assado e acompanhamentos típicos da serra.',
  'passeios',
  'Porto Goio-Ên — Chapecó / Nonoai',
  '4 horas de passeio',
  'R$ 135,00 / pessoa',
  13500,
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'
  ],
  'Rota das Águas Ecoturismo',
  '49991223344',
  4.95,
  ARRAY['Passeio guiado de catamarã com comandante habilitado', 'Almoço colonial completo a bordo', 'Seguro de viagem aquaviário', 'Música acústica ao vivo'],
  ARRAY['Protetor solar e óculos de sol', 'Câmera fotográfica ou smartphone', 'Casaco leve para o vento no rio', 'Documento com foto para o embarque'],
  true,
  'active'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Diária Romântica em Cabana de Montanha & Spa',
  'Cabana privativa com hidromassagem, lareira, vista panorâmica da serra e café da manhã colonial.',
  'Refúgio perfeito para casais em meio à natureza preservada. Nossas cabanas arquitetônicas de alto padrão contam com cama king size, banheira de hidromassagem dupla com vista panorâmica para o vale, deck suspenso com fire pit, adega climatizada e lareira aconchegante. Pela manhã, uma cesta artesanal com pães quentes, geleias caseiras, frutas frescas e queijos finos é entregue na sua porta.',
  'hospedagens',
  'Linha Rodeio Bonito — Chapecó',
  'Check-in 15h / Check-out 12h',
  'R$ 520,00 / diária casal',
  52000,
  'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80'
  ],
  'Pousada Morada dos Canyons',
  '49998877665',
  5.0,
  ARRAY['Hospedagem em cabana privativa completa', 'Cesta de café da manhã colonial entregue na cabana', 'Lenha para lareira e fire pit no deck', 'Roupões felpudos e amenities orgânicos', 'Wi-Fi Starlink de alta velocidade'],
  ARRAY['Roupas confortáveis para clima serrano', 'Vinho ou espumante preferido', 'Tênis para caminhadas leves nas trilhas da propriedade'],
  true,
  'active'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'Circuito das Vinícolas Coloniais & Degustação Harmonizada',
  'Roteiro guiado por 3 vinícolas familiares com degustação de rótulos artesanais e queijos premiados.',
  'Descubra a rica herança enológica do Oeste Catarinense. Um tour imersivo com sommelier local visitando vinhedos de altitude, adegas históricas e processos de vinificação de pequenos produtores. Inclui degustação técnica de 9 rótulos selecionados (vinhos tintos, brancos, espumantes brut) harmonizados com tábua de charcutaria artesanal, queijos maturados e pães de fermentação natural.',
  'gastronomia_turistica',
  'Interior de Chapecó & Guatambu',
  '6 horas de circuito',
  'R$ 175,00 / pessoa',
  17500,
  'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    'https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=800&q=80'
  ],
  'Vinhos & Tradição Turismo',
  '49999334455',
  4.88,
  ARRAY['Transporte em van executiva climatizada com saída do centro', 'Visita guiada a 3 vinícolas familiares', 'Degustação de 9 rótulos com taça de cristal personalizada', 'Tábua farta de queijos coloniais, salames e antepastos'],
  ARRAY['Calçado confortável sem salto para caminhar no parreiral', 'Chapéu ou boné', 'Garrafa de água mineral'],
  false,
  'active'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'Expedição de Caiaque & Stand Up Paddle nas Cachoeiras',
  'Aventura aquática com instrução profissional, coletes e paradas para banho em piscinas naturais.',
  'Adrenalina e contato direto com águas cristalinas. Desça o curso do rio em caiaques individuais ou pranchas de SUP, guiado por instrutores certificados de resgate e turismo de aventura. Passaremos por corredeiras nível I (leves e seguras para iniciantes), cânions verdes e faremos parada obrigatória para salto e banho revigorante na Cachoeira do Guatambu.',
  'aventura',
  'Trilha da Cachoeira do Guatambu',
  '3 horas e meia',
  'R$ 95,00 / pessoa',
  9500,
  'https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=800&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=800&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80'
  ],
  'Oeste Adventure Club',
  '49991112233',
  4.94,
  ARRAY['Equipamentos completos (caiaque/SUP, remos, colete salva-vidas)', 'Instrução teórica e prática com guias de aventura', 'Seguro de acidentes pessoais', 'Fotos e vídeos em alta resolução feitos com GoPro'],
  ARRAY['Roupa de banho e camiseta com proteção UV', 'Sapatilha aquática ou tênis velho que possa molhar', 'Toalha e muda de roupa seca para a volta', 'Repelente ecológico'],
  false,
  'active'
),
(
  'b0000000-0000-0000-0000-000000000005',
  'Excursão de Fim de Semana: Serra Gaúcha & Gramado',
  'Pacote completo com transporte executivo leito-turismo, hospedagem central e guia credenciado.',
  'Roteiro imperdível de sexta a domingo para conhecer as belezas de Gramado, Canela e Nova Petrópolis. Saída confortável em ônibus Double Decker leito-turismo, hospedagem em hotel 4 estrelas com café colonial da manhã incluso, city tour nos principais pontos turísticos (Lago Negro, Rua Torta, Catedral de Pedra, Mini Mundo) e paradas em fábricas de chocolate artesanal.',
  'agencias',
  'Saída da Praça Coronel Bertaso — Chapecó',
  '3 dias (Sexta a Domingo)',
  'R$ 920,00 / pessoa',
  92000,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'
  ],
  'Excelência Tour Agência de Viagens',
  '4933221100',
  4.98,
  ARRAY['Transporte em ônibus leito-turismo com serviço de bordo', '2 diárias em hotel central com café da manhã farto', 'Guia de turismo credenciado pelo Ministério do Turismo (Cadastur)', 'Seguro viagem completo', 'Passeios programados conforme o itinerário'],
  ARRAY['Documento de identidade original (RG ou CNH)', 'Roupas para frio/meia estação', 'Remédios de uso pessoal', 'Cartão ou dinheiro para almoços e compras'],
  true,
  'active'
)
ON CONFLICT (id) DO NOTHING;
