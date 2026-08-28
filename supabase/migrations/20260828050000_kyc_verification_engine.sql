-- Migration: Identity Verification Engine (KYC) Storage Bucket
-- Protocolo V4 - Motor de Verificação de Identidade com Cofre Isolado

-- 1. Criar o bucket identity-vault caso não exista
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-vault', 
  'identity-vault', 
  false, 
  10485760, -- 10MB
  '{"image/jpeg","image/png","application/pdf"}'
) ON CONFLICT (id) DO NOTHING;

-- 2. RLS do Storage: Strict Deny-by-Default com acesso pontual
-- Permitir que o usuário faça upload no seu próprio diretório dentro do identity-vault
CREATE POLICY "Users can upload identity documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'identity-vault' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- O usuário PODE listar/ler os próprios arquivos, para recuperar ou deletar
CREATE POLICY "Users can read own identity documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'identity-vault' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Service Role (backend bypass RLS) será usada para master admin ler esses dados.
