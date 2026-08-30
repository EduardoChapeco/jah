-- ============================================================
-- WIDER REBRANDING, MASTER USER CLEANUP & ROOT STORE UNIFICATION
-- ============================================================

DO $$
DECLARE
  v_master_id UUID := '2ea9f0aa-8b04-4086-9e1d-e23105560302';
  v_old_id UUID := '3e6b1201-3436-4d57-97e9-cab59a29faaa';
BEGIN
  -- 1. Reatribuir referências relacionais para o novo master
  BEGIN
    UPDATE public.workspace_members SET profile_id = v_master_id WHERE profile_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.community_posts SET author_id = v_master_id WHERE author_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.community_comments SET author_id = v_master_id WHERE author_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.community_post_likes SET profile_id = v_master_id WHERE profile_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.orders SET customer_id = v_master_id WHERE customer_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.orders SET created_by = v_master_id WHERE created_by = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.news_articles SET author_id = v_master_id WHERE author_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.classified_items SET user_id = v_master_id WHERE user_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.stories SET author_profile_id = v_master_id WHERE author_profile_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.identity_kyc_verifications SET user_id = v_master_id WHERE user_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.store_support_tickets SET customer_id = v_master_id WHERE customer_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.user_notifications SET user_id = v_master_id WHERE user_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.audit_logs SET user_id = v_master_id WHERE user_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.forensic_audit_events SET target_entity_id = v_master_id WHERE target_entity_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.legal_terms_acceptances SET user_id = v_master_id WHERE user_id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    UPDATE public.hotpages SET created_by = v_master_id WHERE created_by = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    DELETE FROM public.courier_profiles WHERE id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    DELETE FROM public.creator_profiles WHERE id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    DELETE FROM public.profiles WHERE id = v_old_id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 2. Limpar storage.objects vinculados ao usuário antigo
  BEGIN
    DELETE FROM storage.objects WHERE owner = v_old_id OR owner_id = v_old_id::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 3. Deletar do auth.users qualquer conta que não seja o meuwider@gmail.com
  BEGIN
    DELETE FROM auth.users WHERE email <> 'meuwider@gmail.com';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 4. Garantir Perfil Master Ativo
  INSERT INTO public.profiles (id, full_name, username, role, is_verified, cpf)
  VALUES (v_master_id, 'Eduardo Antônio Ramos', 'wider', 'platform_admin', true, '10780979923')
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Eduardo Antônio Ramos',
    username = 'wider',
    role = 'platform_admin',
    is_verified = true,
    cpf = '10780979923';

  -- 5. Vincular Master a todas as lojas
  INSERT INTO public.workspace_members (store_id, profile_id, role)
  SELECT id, v_master_id, 'owner'
  FROM public.stores
  ON CONFLICT (store_id, profile_id) DO UPDATE SET role = 'owner';

  -- 6. Atualizar Lojas e Branding Matriz para Wider
  UPDATE public.stores
  SET
    name = 'Wider',
    slug = 'wider',
    is_platform_root = true,
    seo_title = 'Wider — Super App Comunitário',
    seo_description = 'Explore comércio local, gastronomia, turismo, serviços, classificados e comunidade em um só lugar.'
  WHERE is_platform_root = true OR slug IN ('wider-matriz', 'wider', 'matriz', 'jah');

END $$;
