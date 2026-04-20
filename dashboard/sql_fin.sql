-- Script FINAL de mise à jour Supabase (Siby Widget)
-- Exécutez ce code dans le SQL Editor de Supabase pour débloquer les templates et le CRM.

-- 1. Ajout de la langue
ALTER TABLE agents ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr';

-- 2. Ajout des options de formulaire
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ask_phone boolean DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ask_company boolean DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ask_website boolean DEFAULT false;

-- 3. Ajout des messages CRM
ALTER TABLE agents ADD COLUMN IF NOT EXISTS lead_intro text DEFAULT 'Laissez-nous vos coordonnées pour que nous puissions vous recontacter.';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS lead_success text DEFAULT 'Merci ! Un expert vous recontactera sous 24h.';

-- 4. Mise à jour de la table leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
