import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ ATTENTION: NEXT_PUBLIC_SUPABASE_URL manquant dans l environnement.');
  }
  
  return createClientComponentClient();
};

// Server client — only call this from Server Components / Route Handlers
export async function createServerClient() {
  const { cookies } = await import('next/headers');
  const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
  return createServerComponentClient({ cookies });
}

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: Agent;
        Insert: Partial<Agent>;
        Update: Partial<Agent>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead>;
        Update: Partial<Lead>;
      };
      sessions: {
        Row: Session;
        Insert: Partial<Session>;
        Update: Partial<Session>;
      };
    };
  };
};

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  slug?: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  system_prompt: string;
  knowledge_base?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  groq_api_key?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  border_radius: string;
  glass_blur?: string;
  glass_opacity?: string;
  entrance_animation?: string;
  position: string;
  button_icon: string;
  button_label: string;
  chat_title: string;
  chat_subtitle: string;
  avatar_url?: string;
  welcome_message: string;
  placeholder_text: string;
  widget_theme: 'dark' | 'light' | 'auto';
  emailjs_service_id?: string;
  emailjs_template_id?: string;
  emailjs_public_key?: string;
  email_capture_enabled: boolean;
  email_capture_trigger: string;
  notification_email?: string;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_events?: string[];
  rate_limit_per_hour: number;
  allowed_domains?: string[];
  blocked_keywords?: string[];
  auto_close_after_minutes: number;
  show_typing_indicator: boolean;
  show_timestamps: boolean;
  enable_feedback: boolean;
  quick_replies?: string[];
  enabled_tools?: string[];
  custom_css?: string;
  total_sessions: number;
  total_messages: number;
  total_leads: number;
  satisfaction_score?: number;
  created_at: string;
  updated_at: string;
  client_id?: string;
  ask_phone?: boolean;
  ask_company?: boolean;
  ask_website?: boolean;
  lead_intro?: string;
  lead_success?: string;
  language?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  company?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  widget_quota: number;
  message_quota: number;
  messages_used: number;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  session_id: string;
  user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  tags?: string[];
  created_at: string;
}

export interface Session {
  id: string;
  agent_id: string;
  visitor_id: string;
  is_lead: boolean;
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  status: 'active' | 'ended' | 'archived';
  message_count: number;
  page_url?: string;
  referrer?: string;
  visitor_browser?: string;
  started_at: string;
  last_message_at: string;
  ended_at?: string;
  satisfaction_rating?: number;
}

export interface Message {
  id: string;
  session_id: string;
  agent_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  model_used?: string;
  latency_ms?: number;
  feedback?: 'positive' | 'negative';
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  logo_url?: string;
  notes?: string;
  status: 'active' | 'paused' | 'cancelled' | 'prospect';
  tags?: string[];
  created_at: string;
  updated_at: string;
}
