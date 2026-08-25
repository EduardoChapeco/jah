-- 20260824020000_set_platform_admin_role.sql
-- Atribui o role platform_admin ao dono da plataforma

-- Garante que a coluna role exista em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Define platform_admin para o usuario dono da plataforma
-- A query usa auth.users para encontrar pelo email
UPDATE public.profiles p
SET role = 'platform_admin'
FROM auth.users u
WHERE u.id = p.id
  AND (
    u.email ILIKE '%excelencia%'
    OR u.email ILIKE '%admin%'
    OR u.raw_user_meta_data->>'role' = 'platform_admin'
  );
