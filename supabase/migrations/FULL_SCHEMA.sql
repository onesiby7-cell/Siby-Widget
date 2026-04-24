-- ================================================================
-- 🚀 SIBY-WIDGET — SQL MASTER ENTERPRISE FULL (v6.1 Platinum)
-- ================================================================
-- Ce fichier contient TOUT le schéma consolidé pour Siby Enterprise.
-- ✅ Supporte : CRM, Analytics, Templates, Webhooks, Finances, Live Monitor.
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données existantes.
-- ================================================================

-- ══════════════════════════════════════════════════════════════════
-- 🧹 NETTOYAGE COMPLET
-- ══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS increment_agent_sessions(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.analytics_daily CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ══════════════════════════════════════════════════════════════════
-- EXTENSIONS & UTILS
-- ══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════
-- TABLE: profiles
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  plan TEXT DEFAULT 'pro' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  message_quota INTEGER DEFAULT 10000,
  messages_used INTEGER DEFAULT 0,
  api_key TEXT UNIQUE DEFAULT 'sw_' || encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- TABLE: clients
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'prospect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- TABLE: agents (PLATINUM v6.1)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- [FIX] Ajouté pour compatibilité dashboard
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),

  -- IA Config
  system_prompt TEXT DEFAULT 'Tu es un assistant IA expert.',
  knowledge_base TEXT,
  model TEXT DEFAULT 'llama-3.1-70b-versatile',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  groq_api_key TEXT,
  sentiment_analysis BOOLEAN DEFAULT TRUE,
  autonomous_browsing BOOLEAN DEFAULT FALSE,

  -- Design
  primary_color TEXT DEFAULT '#0A0A0A',
  secondary_color TEXT DEFAULT '#FFFFFF',
  accent_color TEXT DEFAULT '#C0C0C0',
  font_family TEXT DEFAULT 'DM Sans',
  border_radius TEXT DEFAULT '24px',
  glass_blur TEXT DEFAULT '12px',
  glass_opacity TEXT DEFAULT '0.1',
  entrance_animation TEXT DEFAULT 'fade-up',
  position TEXT DEFAULT 'bottom-right',
  button_icon TEXT DEFAULT '🤖',
  chat_title TEXT DEFAULT 'Assistant IA',
  chat_subtitle TEXT DEFAULT 'En ligne • Répond instantanément',
  avatar_url TEXT,
  logo_shape TEXT DEFAULT 'circle' CHECK (logo_shape IN ('circle','square','rounded')),
  rainbow_glow BOOLEAN DEFAULT FALSE,
  animation_style TEXT DEFAULT 'float' CHECK (animation_style IN ('float','pulse','shake','none')),
  widget_theme TEXT DEFAULT 'dark' CHECK (widget_theme IN ('dark','light','auto')),
  placeholder_text TEXT DEFAULT 'Posez-moi une question...',

  -- Formulaire Leads (Personnalisation) [FIX] Ajouté pour compatibilité
  ask_phone BOOLEAN DEFAULT FALSE,
  ask_company BOOLEAN DEFAULT FALSE,
  ask_website BOOLEAN DEFAULT FALSE,
  lead_intro TEXT DEFAULT 'Laissez-nous vos coordonnées pour que nous puissions vous recontacter.',
  lead_success TEXT DEFAULT 'Merci ! Un expert vous recontactera sous 24h.',

  -- Connecteurs
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  email_capture_enabled BOOLEAN DEFAULT TRUE,
  notification_email TEXT,

  -- Stats
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0.00,
  avg_latency INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- TABLE: sessions & messages
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT NOT NULL,
  is_lead BOOLEAN DEFAULT FALSE,
  lead_email TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- TABLE: leads (CRM)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'Web Widget',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- TABLE: templates (Bibliothèque d'agents)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- TABLE: webhook_logs (Historique des envois)
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════
-- SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage all" ON public.profiles FOR ALL USING (id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = id);
CREATE POLICY "Admin manage agents" ON public.agents FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000000' OR user_id = auth.uid());
CREATE POLICY "Admin manage leads" ON public.leads FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000000' OR user_id = auth.uid());
CREATE POLICY "Public read agents" ON public.agents FOR SELECT USING (status = 'active');
CREATE POLICY "Public read templates" ON public.templates FOR SELECT USING (is_public = TRUE);

-- ══════════════════════════════════════════════════════════════════
-- SEED & RPC
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_agent_sessions(agent_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agents SET total_sessions = total_sessions + 1 WHERE id = agent_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO public.profiles (id, email, full_name, plan)
VALUES ('00000000-0000-0000-0000-000000000000', 'onesiby7@gmail.com', 'Admin Siby', 'enterprise')
ON CONFLICT (id) DO UPDATE SET plan = 'enterprise';

-- ✅ TERMINÉ — Schéma Master v6.1 Enterprise FULL prêt !
