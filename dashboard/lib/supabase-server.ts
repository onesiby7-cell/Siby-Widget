import { createClient as createServerSupabaseClient } from '../utils/supabase/server';
import { cookies } from 'next/headers';
import { Agent, Profile, Lead, Session } from './types';

// Client pour les Composants Serveur (Server Components) / Route Handlers
// À utiliser UNIQUEMENT dans du code serveur
export async function createServerClient() {
  const cookieStore = cookies();
  return createServerSupabaseClient(cookieStore);
}

export type { Agent, Profile, Lead, Session };
