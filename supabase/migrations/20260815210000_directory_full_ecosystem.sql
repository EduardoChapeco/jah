-- Migration: 20260815210000_directory_full_ecosystem.sql
-- Description: Elevação do Módulo Guia & Diretório com campos ricos, solicitações de orçamento reais e sementes canônicas.

-- 1. Aprimorar a tabela directory_listings
ALTER TABLE public.directory_listings
ALTER COLUMN store_id DROP NOT NULL;

ALTER TABLE public.directory_listings
ADD COLUMN IF NOT EXISTS author_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- 2. Tabela de Solicitações de Orçamento / Contato do Diretório (directory_inquiries)
CREATE TABLE IF NOT EXISTS public.directory_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_needed TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'quoted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RLS para directory_inquiries
ALTER TABLE public.directory_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer visitante ou cliente pode solicitar orçamento"
  ON public.directory_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes e profissionais podem ver orçamentos"
  ON public.directory_inquiries FOR SELECT
  USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM public.directory_listings dl
      WHERE dl.id = listing_id AND (dl.author_profile_id = auth.uid())
    )
  );

-- 4. Seeds Canônicos Reais para o Guia & Diretório de Chapecó e Região
INSERT INTO public.directory_listings (
  id, category, business_name, description, specialties, address,
  contact_phone, contact_whatsapp, contact_email, website_url,
  working_hours, is_verified, rating, reviews_count, avatar_url, banner_url, status
) VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'saude',
  'Clínica Integrada de Fisioterapia & Pilates Avançado',
  'Centro de excelência em reabilitação física, fisioterapia ortopédica e traumatológica, pilates clínico, osteopatia e recuperação funcional para atletas e idosos.',
  ARRAY['Fisioterapia Ortopédica', 'Pilates Clínico em Aparelhos', 'Osteopatia Estrutural', 'Dry Needling & Ventosaterapia', 'Reabilitação Postural Global (RPG)'],
  'Av. Fernando Machado, 1240D — Centro, Chapecó - SC',
  '(49) 3322-8811',
  '49998124411',
  'contato@clinicafisiopilates.com.br',
  'https://clinicafisiopilates.com.br',
  '{"weekdays": "07:30 - 19:30", "saturday": "08:00 - 12:00"}',
  true,
  4.95,
  48,
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  'active'
),
(
  'f0000000-0000-0000-0000-000000000002',
  'reformas',
  'Studio D’Art Engenharia & Reformas Inteligentes',
  'Escritório multidisciplinar de engenharia civil e arquitetura especializado em reformas completas residenciais e corporativas, laudos estruturais, elétrica de alta precisão e gestão de obras turn-key.',
  ARRAY['Projetos Arquitetônicos 3D', 'Reformas Completas Turn-Key', 'Marcenaria Fina e Planejados', 'Elétrica e Automação Residencial', 'Laudos e Vistorias Prediais'],
  'Rua Marechal Deodoro, 310E — Jardim Itália, Chapecó - SC',
  '(49) 3328-5500',
  '49988225533',
  'orcamentos@studiodart.com.br',
  'https://studiodartreformas.com.br',
  '{"weekdays": "08:00 - 18:00", "saturday": "Fechado"}',
  true,
  5.0,
  34,
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80',
  'active'
),
(
  'f0000000-0000-0000-0000-000000000003',
  'auto',
  'Oeste Auto Center & Centro Automotivo Tecnológico',
  'Oficina mecânica completa com diagnósticos computadorizados via scanner, suspensão, freios ABS, injeção eletrônica, alinhamento 3D a laser, balanceamento e troca de pneus das melhores marcas.',
  ARRAY['Injeção Eletrônica & Diagnóstico Scanner', 'Alinhamento 3D & Balanceamento', 'Revisão Preventiva e Troca de Óleo', 'Freios e Suspensão Reforçada', 'Ar Condicionado Automotivo'],
  'Av. General Osório, 890D — Santa Maria, Chapecó - SC',
  '(49) 3322-1144',
  '49999114422',
  'atendimento@oesteautocenter.com.br',
  'https://oesteautocenter.com.br',
  '{"weekdays": "08:00 - 18:30", "saturday": "08:00 - 12:00"}',
  true,
  4.88,
  62,
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&q=80',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&q=80',
  'active'
),
(
  'f0000000-0000-0000-0000-000000000004',
  'pet',
  'Hospital Veterinário 24h & Pet Hotel Quatro Patas',
  'Estrutura hospitalar veterinária 24 horas para cães e gatos com UTI, centro cirúrgico moderno, exames laboratoriais na hora, ultrassonografia, cardiologia veterinária e hotelzinho climatizado.',
  ARRAY['Plantão Emergencial 24 Horas', 'Cirurgias Especializadas', 'Exames de Sangue e Ultrassom', 'Vacinação e Microchipagem', 'Hotelzinho e Creche Day Care'],
  'Rua Benjamin Constant, 450D — São Cristóvão, Chapecó - SC',
  '(49) 3324-7700',
  '49991337788',
  'contato@hospitalquatropatas.com.br',
  'https://hospitalquatropatas.com.br',
  '{"weekdays": "24 Horas", "saturday": "24 Horas", "sunday": "24 Horas"}',
  true,
  4.97,
  112,
  'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
  'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&q=80',
  'active'
),
(
  'f0000000-0000-0000-0000-000000000005',
  'servicos',
  'Valente & Associados Assessoria Jurídica & Empresarial',
  'Sociedade de advogados com foco em direito empresarial, contratos comerciais, direito tributário, trabalhista consultivo e estruturação societária para cooperativas e empresas do agronegócio.',
  ARRAY['Direito Empresarial e Societário', 'Planejamento Tributário e Recuperação de Créditos', 'Contratos Comerciais e Agronegócio', 'Compliance e LGPD', 'Assessoria Trabalhista Patronal'],
  'Av. Nereu Ramos, 750D — Edifício Plaza, Sala 804 — Centro, Chapecó - SC',
  '(49) 3328-9900',
  '49999442211',
  'contato@valenteadvogados.com.br',
  'https://valenteadvogados.com.br',
  '{"weekdays": "08:30 - 18:00", "saturday": "Fechado"}',
  true,
  4.92,
  27,
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  'active'
),
(
  'f0000000-0000-0000-0000-000000000006',
  'servicos',
  'Ateliê Fina Linha Alfaiataria & Alta Costura',
  'Alta costura personalizada, confecção de vestidos de noiva e gala sob medida, ajustes finos em ternos e alfaiataria italiana com tecidos nobres e acabamento manual.',
  ARRAY['Vestidos de Noiva & Festa Sob Medida', 'Alfaiataria Masculina Customizada', 'Ajustes Finos e Restauração de Peças', 'Consultoria de Imagem e Visagismo Têxtil'],
  'Rua Quintino Bocaiúva, 210D — Centro, Chapecó - SC',
  '(49) 3323-4545',
  '49998776655',
  'atelie@finalinha.com.br',
  'https://finalinhaalfaiataria.com.br',
  '{"weekdays": "09:00 - 18:30", "saturday": "09:00 - 13:00"}',
  true,
  4.96,
  39,
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
  'active'
)
ON CONFLICT (id) DO NOTHING;
