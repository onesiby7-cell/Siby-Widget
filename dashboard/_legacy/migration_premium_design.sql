-- ================================================================
-- 💎 SYNC MIGRATION — Design Premium & Visibility v5.7
-- ================================================================

-- Ajout des colonnes de design pour le widget
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS chat_subtitle TEXT DEFAULT 'En ligne';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'DM Sans';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'bottom-right';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS glass_blur TEXT DEFAULT '12px';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS glass_opacity NUMERIC DEFAULT 0.1;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS entrance_animation TEXT DEFAULT 'fade-up';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS placeholder_text TEXT DEFAULT 'Écrivez ici...';

-- Rafraîchir le cache
NOTIFY pgrst, 'reload schema';

COMMENT ON COLUMN public.agents.glass_blur IS 'Intensité du flou glassmorphism.';
