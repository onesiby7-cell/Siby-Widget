-- ================================================================
-- 🔄 SYNC MIGRATION — Ajout des colonnes manquantes v5.6
-- ================================================================

-- 1. Ajout de la gestion des langues
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr';

-- 2. Ajout des connecteurs sociaux (Telegram & WhatsApp)
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;

-- 3. Ajout du suivi de la latence IA dans les messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

-- 4. Ajout du flag de lead dans les sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS lead_email TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS page_url TEXT;

-- 5. Rafraîchir le cache du schéma pour Supabase
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.agents.language IS 'Langue préférée pour les réponses de l''IA.';
