-- 20260824010000_notifications_triggers.sql
-- Triggers automaticos para inserir notificacoes em eventos chave

-- 1. Trigger: Novo Seguidor de Membro
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'Alguem'), avatar_url
  INTO v_name, v_avatar
  FROM public.profiles WHERE id = NEW.follower_user_id;

  INSERT INTO public.notifications (user_id, type, title, message, avatar_url, author_name, link_url)
  VALUES (
    NEW.following_user_id,
    'interaction',
    'Novo seguidor',
    v_name || ' começou a te seguir.',
    v_avatar,
    v_name,
    '/membro/' || NEW.follower_user_id::TEXT
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.user_followers;
CREATE TRIGGER trg_notify_new_follower
  AFTER INSERT ON public.user_followers
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- 2. Trigger: Novo Pedido criado (notifica o vendedor/loja)
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_store_owner UUID;
  v_token TEXT;
BEGIN
  v_token := COALESCE(NEW.public_token, LEFT(NEW.id::TEXT, 8));

  SELECT owner_id INTO v_store_owner
  FROM public.stores WHERE id = NEW.store_id;

  IF v_store_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link_url)
    VALUES (
      v_store_owner,
      'order',
      'Novo pedido recebido',
      'Pedido #' || v_token || ' recebido.',
      '/workspace/pedidos/' || NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

-- 3. RLS policies para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_self_read" ON public.notifications;
CREATE POLICY "notifications_self_read"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_service_insert" ON public.notifications;
CREATE POLICY "notifications_service_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
