import { createClient as createBrowserSupabaseClient } from '../utils/supabase/client';
import { Agent, Profile, Lead, Session } from './types';

// Client pour les composants Navigateur (Client Components)
// C'est ce qu'utilisent vos pages avec "use client"
export const createClient = () => createBrowserSupabaseClient();

export type Database = {
  public: {
    Tables: {
      agents: { Row: Agent; Insert: Partial<Agent>; Update: Partial<Agent>; };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; };
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead>; };
      sessions: { Row: Session; Insert: Partial<Session>; Update: Partial<Session>; };
    };
  };
};

export type { Agent, Profile, Lead, Session };
