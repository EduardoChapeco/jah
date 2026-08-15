-- Migration 0086: Deals, Negotiations & P2P Agreements
-- Protocolo V3 - Expansão Canônica de Negociações

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID REFERENCES public.classifieds(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'negotiating'
    CHECK (status IN ('negotiating', 'accepted', 'rejected', 'cancelled', 'completed')),
  proposed_price_cents BIGINT NOT NULL,
  deposit_cents BIGINT DEFAULT 0,
  installments_count INT DEFAULT 1,
  deal_type TEXT NOT NULL DEFAULT 'sale'
    CHECK (deal_type IN ('sale', 'rental', 'service', 'trade')),
  terms TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Mensagens e Contrapropostas da Negociação
CREATE TABLE IF NOT EXISTS public.deal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('message', 'proposal', 'counter_proposal', 'accept', 'reject', 'cancel', 'contract_created')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_events ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Comprador e Vendedor podem visualizar e interagir com seus deals
CREATE POLICY "deals_participants_select" ON public.deals
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "deals_buyer_insert" ON public.deals
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
  );

CREATE POLICY "deals_participants_update" ON public.deals
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "deal_events_participants_select" ON public.deal_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_events.deal_id
      AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
    )
  );

CREATE POLICY "deal_events_sender_insert" ON public.deal_events
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.deals
      WHERE deals.id = deal_events.deal_id
      AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS deals_buyer_idx ON public.deals(buyer_id);
CREATE INDEX IF NOT EXISTS deals_seller_idx ON public.deals(seller_id);
CREATE INDEX IF NOT EXISTS deals_classified_idx ON public.deals(classified_id);
CREATE INDEX IF NOT EXISTS deal_events_deal_idx ON public.deal_events(deal_id);
