-- ================================================================
-- 💰 SIBY FINANCIAL SUITE — Table des Paiements
-- ================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'refunded', 'cancelled')),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage own payments" ON public.payments
FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

-- Index pour les graphiques
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);

-- Commentaire de version
COMMENT ON TABLE public.payments IS 'Table pour le suivi des revenus de la plateforme AgentIQ Platinum.';
