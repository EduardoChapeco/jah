import fs from 'fs';

const termos = fs.readFileSync('scripts/legal-content/termos.md', 'utf8');
const isencao = fs.readFileSync('scripts/legal-content/isencao.md', 'utf8');
const lojistas = fs.readFileSync('scripts/legal-content/lojistas.md', 'utf8');
const entregadores = fs.readFileSync('scripts/legal-content/entregadores.md', 'utf8');
const privacidade = fs.readFileSync('scripts/legal-content/privacidade.md', 'utf8');
const cookies = fs.readFileSync('scripts/legal-content/cookies.md', 'utf8');
const usoIa = fs.readFileSync('scripts/legal-content/uso-de-ia.md', 'utf8');

const migration = `-- ============================================================================
-- WIDER PLATFORM: DOCUMENTOS LEGAIS COMPLETOS v3.0 (BENCHMARKS BIGTECH)
-- Inclui: Magazine Luiza, Mercado Livre, Amazon, Casas Bahia, OLX, iFood,
--         Uber, 99, CVC, Booking, Avec, Asaas, Nubank, Meta, Marco Civil, LGPD
-- ============================================================================

-- 1. TERMOS GERAIS DE USO
UPDATE public.legal_documents SET
  title = 'Termos Gerais de Uso e Condições da Plataforma Wider',
  version = '3.0',
  summary = 'Canal de comunicação digital comunitário. Isenções setoriais totais (Turismo, Alimentação, Estética, Entregas, E-commerce, FinTech), cessão de biometria para IA, PEP e denúncia de crimes.',
  content_markdown = $sql_doc$` + termos + `$sql_doc$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'termos';

-- 2. POLÍTICA DE PRIVACIDADE
UPDATE public.legal_documents SET
  title = 'Política de Privacidade e Proteção de Dados (LGPD)',
  version = '3.0',
  summary = 'Tratamento de dados pessoais, biometria facial/voz, retenção de até 24 meses para IA, monetização de dados anonimizados e tabela de bases legais LGPD.',
  content_markdown = $sql_doc$` + privacidade + `$sql_doc$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'privacidade';

-- 3. POLÍTICA DE COOKIES
UPDATE public.legal_documents SET
  title = 'Política de Cookies e Gestão de Consentimento Digital',
  version = '3.0',
  summary = 'Device fingerprinting, pixels de publicidade segmentada, cookies de sessão e valor probatório forense de aceite.',
  content_markdown = $sql_doc$` + cookies + `$sql_doc$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'cookies';

-- 4. TERMO DE ISENÇÃO SETORIAL
UPDATE public.legal_documents SET
  title = 'Termo de Isenção da Plataforma e Diretrizes de Negociações P2P',
  version = '3.0',
  summary = 'Isenção setorial detalhada: Turismo (CVC/Booking), Alimentação (iFood/ANVISA), Beleza/Saúde (Avec/CRM), Entregas (Uber/99), Classificados (OLX) e FinTech (Asaas).',
  content_markdown = $sql_doc$` + isencao + `$sql_doc$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'isencao';

-- 5. TERMOS DE LOJISTAS E EMPRESAS
UPDATE public.legal_documents SET
  title = 'Termos de Adesão e Responsabilidades de Lojistas, Empresas e Anunciantes',
  version = '3.0',
  summary = 'Contrato de adesão comercial, exigências CADASTUR, ANVISA, INMETRO, chargebacks padrão Asaas/Stripe, proibição de lucros cessantes e multicanalidade.',
  content_markdown = $sql_doc$` + lojistas + `$sql_doc$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'lojistas';

-- 6. TERMOS PARA ENTREGADORES E LOGÍSTICA
INSERT INTO public.legal_documents (slug, title, category, version, is_published, is_mandatory, summary, content_markdown)
VALUES (
  'entregadores',
  'Termos e Condições para Entregadores, Motoboys e Parceiros de Logística',
  'delivery_terms',
  '3.0',
  true,
  true,
  'Trabalho autônomo pleno (CLT art. 442-B), tarifas dinâmicas sugeridas, isenção em acidentes de trânsito e conduta sanitária de bags.',
  $sql_doc$` + entregadores + `$sql_doc$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  summary = EXCLUDED.summary,
  content_markdown = EXCLUDED.content_markdown,
  updated_at = timezone('utc'::text, now());

-- 7. AVISO DE IA E BIOMETRIA
INSERT INTO public.legal_documents (slug, title, category, version, is_published, is_mandatory, summary, content_markdown)
VALUES (
  'uso-de-ia',
  'Aviso sobre Uso de Inteligência Artificial e Dados Biométricos',
  'privacy_lgpd',
  '3.0',
  true,
  true,
  'Sistemas de IA utilizados, dados biométricos coletados (facial, voz), prazos de retenção para treinamento e direito de revisão humana (Art. 20 LGPD).',
  $sql_doc$` + usoIa + `$sql_doc$
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  version = EXCLUDED.version,
  summary = EXCLUDED.summary,
  content_markdown = EXCLUDED.content_markdown,
  updated_at = timezone('utc'::text, now());
`;

fs.writeFileSync('supabase/migrations/20260827180000_update_legal_documents_full_content.sql', migration, 'utf8');
console.log('Migration SQL gerada com sucesso! Tamanho:', migration.length, 'bytes');
