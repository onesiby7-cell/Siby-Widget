-- ================================================================
-- 🚀 SIBY-WIDGET — SQL COMPLET (Schéma Consolidé v5.1)
-- ================================================================
-- Ce fichier contient TOUT :
--   ✅ Nettoyage complet (DROP de tout)
--   ✅ Extensions (UUID-OSSP, PGCRYPTO)
--   ✅ Tables (Profiles, Agents, Sessions, Messages, leads, etc.)
--   ✅ Bypass SQL Auth pour Admin Maître (ID 00000000-0000-0000-0000-000000000000)
--   ✅ Triggers + RLS + RPC + Seed (Templates)
-- ================================================================


-- ══════════════════════════════════════════════════════════════════
-- 🧹 NETTOYAGE COMPLET — Supprime tout l'ancien
-- ══════════════════════════════════════════════════════════════════

-- Supprimer le trigger sur auth.users
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

-- Supprimer les RPC functions (CASCADE supprime les triggers liés)
DROP FUNCTION IF EXISTS increment_agent_sessions(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_messages_used(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- Supprimer les tables (ordre inversé des dépendances)
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
-- EXTENSIONS
-- ══════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ══════════════════════════════════════════════════════════════════
-- FONCTION: updated_at automatique
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ══════════════════════════════════════════════════════════════════
-- TABLE: profiles
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY, -- Pas de REFERENCES auth.users(id) pour autoriser l'ID maître local
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company TEXT,
  plan TEXT DEFAULT 'pro' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  widget_quota INTEGER DEFAULT 100,
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
  phone TEXT,
  company TEXT,
  website TEXT,
  logo_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'prospect')),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════════
-- TABLE: agents
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

  -- Identité
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),

  -- IA
  system_prompt TEXT NOT NULL DEFAULT 'Tu es un assistant utile et professionnel.',
  knowledge_base TEXT,
  model TEXT DEFAULT 'llama3-8b-8192',
  temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1024,
  groq_api_key TEXT,

  -- Design
  primary_color TEXT DEFAULT '#0A0A0A',
  secondary_color TEXT DEFAULT '#FFFFFF',
  accent_color TEXT DEFAULT '#C0C0C0',
  font_family TEXT DEFAULT 'DM Sans',
  border_radius TEXT DEFAULT '12px',
  position TEXT DEFAULT 'bottom-right' CHECK (position IN ('bottom-right','bottom-left','top-right','top-left')),
  button_icon TEXT DEFAULT 'bot',
  button_label TEXT DEFAULT 'Chat avec nous',
  chat_title TEXT DEFAULT 'Assistant',
  chat_subtitle TEXT DEFAULT 'Généralement répond en quelques secondes',
  avatar_url TEXT,
  welcome_message TEXT DEFAULT 'Bonjour 👋 Comment puis-je vous aider ?',
  placeholder_text TEXT DEFAULT 'Écrivez votre message...',
  widget_theme TEXT DEFAULT 'dark' CHECK (widget_theme IN ('dark','light','auto')),

  -- EmailJS
  emailjs_service_id TEXT,
  emailjs_template_id TEXT,
  emailjs_public_key TEXT,
  email_capture_enabled BOOLEAN DEFAULT TRUE,
  email_capture_trigger TEXT DEFAULT 'on_lead' CHECK (email_capture_trigger IN ('on_lead','on_session_end','always')),
  notification_email TEXT,

  -- Webhooks
  webhook_url TEXT,
  webhook_secret TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  webhook_events TEXT[] DEFAULT ARRAY['lead.captured', 'session.ended'],

  -- Formulaire Leads (Personnalisation)
  ask_phone BOOLEAN DEFAULT FALSE,
  ask_company BOOLEAN DEFAULT FALSE,
  ask_website BOOLEAN DEFAULT FALSE,
  lead_intro TEXT DEFAULT 'Laissez-nous vos coordonnées pour que nous puissions vous recontacter.',
  lead_success TEXT DEFAULT 'Merci ! Un expert vous recontactera sous 24h.',

  -- Fonctionnalités avancées
  rate_limit_per_hour INTEGER DEFAULT 50,
  allowed_domains TEXT[],
  blocked_keywords TEXT[],
  auto_close_after_minutes INTEGER DEFAULT 30,
  show_typing_indicator BOOLEAN DEFAULT TRUE,
  show_timestamps BOOLEAN DEFAULT TRUE,
  enable_feedback BOOLEAN DEFAULT TRUE,
  custom_css TEXT,
  quick_replies TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Stats
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  satisfaction_score NUMERIC(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════════
-- TABLE: sessions
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','ended','archived')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);


-- ══════════════════════════════════════════════════════════════════
-- TABLE: messages
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════════
-- TABLE: leads
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════════
-- TABLE: templates
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  knowledge_base TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_sessions_agent_id ON public.sessions(agent_id);
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_leads_user_id ON public.leads(user_id);


-- ══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ══════════════════════════════════════════════════════════════════
-- RLS (Activation)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════
-- RLS POLICIES (Bypass Master ID 00000000-0000-0000-0000-000000000000)
-- ══════════════════════════════════════════════════════════════════

-- Profiles
CREATE POLICY "Admin manage own profile" ON public.profiles 
FOR ALL USING (id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = id);

-- Agents
CREATE POLICY "Admin manage own agents" ON public.agents 
FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

-- Sessions
CREATE POLICY "Admin view sessions" ON public.sessions 
FOR ALL USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = '00000000-0000-0000-0000-000000000000' OR user_id = auth.uid()));

-- Messages
CREATE POLICY "Admin view messages" ON public.messages 
FOR ALL USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = '00000000-0000-0000-0000-000000000000' OR user_id = auth.uid()));

-- Leads
CREATE POLICY "Admin view leads" ON public.leads 
FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

-- Templates
CREATE POLICY "Templates public read" ON public.templates FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Admin manage templates" ON public.templates 
FOR ALL USING (created_by = '00000000-0000-0000-0000-000000000000' OR auth.uid() = created_by);


-- ══════════════════════════════════════════════════════════════════
-- RPC FUNCTIONS
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_agent_sessions(agent_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agents SET total_sessions = COALESCE(total_sessions, 0) + 1, updated_at = NOW() WHERE id = agent_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ══════════════════════════════════════════════════════════════════
-- SEED: Admin Maître + Templates
-- ══════════════════════════════════════════════════════════════════

-- Insertion Admin Maître (ID 2008)
INSERT INTO public.profiles (id, email, full_name, plan)
VALUES ('00000000-0000-0000-0000-000000000000', 'onesiby7@gmail.com', 'Admin Siby', 'pro')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Templates par défaut
INSERT INTO public.templates (name, category, description, system_prompt, tags, is_public, created_by) VALUES
('Assistant E-commerce', 'commerce', 'Agent pour boutiques en ligne', 'Tu es un assistant expert en shopping.', ARRAY['ecommerce'], TRUE, '00000000-0000-0000-0000-000000000000'),
('Support Technique', 'tech', 'Agent support IT', 'Tu es un technicien expert.', ARRAY['tech'], TRUE, '00000000-0000-0000-0000-000000000000'),
('Agent Immobilier', 'immobilier', 'Assistant pour agences immobilières', 'Tu es un consultant immobilier.', ARRAY['immobilier'], TRUE, '00000000-0000-0000-0000-000000000000');


-- ══════════════════════════════════════════════════════════════════
-- ✅ TERMINÉ — Schéma Consolidé v5.1 prêt !
-- ══════════════════════════════════════════════════════════════════
