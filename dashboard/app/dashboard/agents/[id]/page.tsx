'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import type { Agent } from '@/lib/supabase';

const MODELS = [
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — Ultra-Rapide (Conseillé)' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B — Expert & Intelligent' },
  { value: 'llama3-8b-8192', label: 'Llama 3 8B — Standard' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B — Long contexte' },
];

const FONTS = ['DM Sans', 'Inter', 'Poppins', 'Sora', 'Plus Jakarta Sans', 'Outfit'];
const ICONS = ['🤖', '⚡', '💬', '🧠', '🎯', '🌟', '💡', '🔥', '✨', '🛡️', '🚀', '💎'];
const POSITIONS = [
  { value: 'bottom-right', label: '↘ Bas droite' },
  { value: 'bottom-left', label: '↙ Bas gauche' },
  { value: 'top-right', label: '↗ Haut droite' },
  { value: 'top-left', label: '↖ Haut gauche' },
];

const ANIMATIONS = [
  { value: 'fade-up', label: '↑ Glissement haut' },
  { value: 'fade-in', label: '✨ Apparition douce' },
  { value: 'scale-up', label: '🔍 Zoom progressif' },
  { value: 'bounce-in', label: '🏀 Rebond' },
];

const DEFAULT_AGENT: Partial<Agent> = {
  name: '', description: '', status: 'active',
  system_prompt: 'Tu es un assistant IA utile et professionnel. Réponds de manière claire, concise et amicale.',
  knowledge_base: '', model: 'llama-3.1-8b-instant', temperature: 0.7, max_tokens: 1024,
  primary_color: '#0A0A0A', secondary_color: '#FFFFFF', accent_color: '#C0C0C0',
  font_family: 'DM Sans', border_radius: '16px', position: 'bottom-right',
  button_icon: '🤖', button_label: 'Chat', chat_title: 'Assistant',
  chat_subtitle: 'En ligne · répond en quelques secondes',
  welcome_message: 'Bonjour 👋 Comment puis-je vous aider ?',
  placeholder_text: 'Écrivez votre message...',
  glass_blur: '10px', glass_opacity: '0.1', entrance_animation: 'fade-up',
  widget_theme: 'dark', email_capture_enabled: true,
  email_capture_trigger: 'on_lead', rate_limit_per_hour: 50,
  show_typing_indicator: true, show_timestamps: true,
  enable_feedback: true, quick_replies: [],
  ask_phone: false, ask_company: false, ask_website: false,
  lead_intro: 'Laissez-nous vos coordonnées pour que nous puissions vous recontacter.',
  lead_success: 'Merci ! Un expert vous recontactera sous 24h.',
};


const TABS = [
  { id: 'identity', icon: '⚡', label: 'Identité' },
  { id: 'ai', icon: '🧠', label: 'IA & Prompt' },
  { id: 'skills', icon: '🛠️', label: 'Capacités IA' },
  { id: 'design', icon: '🎨', label: 'Design Premium' },
  { id: 'forms', icon: '📋', label: 'Leads Form' },
  { id: 'connectors', icon: '🔌', label: 'Connecteurs' },
  { id: 'advanced', icon: '⚙️', label: 'Config' },
  { id: 'integration', icon: '💾', label: 'Installation' },
];

export default function AgentFormPage() {
  const [form, setForm] = useState<Partial<Agent>>(DEFAULT_AGENT);
  const [tab, setTab] = useState('identity');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [quickReplyInput, setQuickReplyInput] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const isEdit = params?.id && params.id !== 'new';
  const supabase = createClient();

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('agents').select('*').eq('id', params.id).single();
      if (data) setForm(data);
      setLoading(false);
    };
    load();
  }, [isEdit]);

  const set = useCallback((key: keyof Agent, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const client = createClient();
    const keyPrefix = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 5);
    console.log(`[Debug] Uploading with key prefix: ${keyPrefix}...`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `logos/${fileName}`;
    
    const { error: uploadError } = await client.storage
      .from('agent-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Erreur Storage:', uploadError);
      alert(`Erreur d'upload : ${uploadError.message}. (Astuce: Vérifiez que la clé commence par "eyJ" dans Vercel)`);
      setUploading(false);
      return;
    } else {
      const { data } = supabase.storage.from('agent-assets').getPublicUrl(filePath);
      // 🔥 Ajout d'un timestamp (?t=...) pour forcer le rafraîchissement du logo par le navigateur (Cache Flush)
      const freshUrl = `${data.publicUrl}?t=${Date.now()}`;
      set('avatar_url', freshUrl);
      setSaved(false);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError('Le nom de l\'agent est requis.'); return; }
    if (!form.system_prompt?.trim()) { setError('Le prompt système est requis.'); return; }
    setSaving(true); setError('');
    
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';

    const payload = { ...form, user_id: masterId, updated_at: new Date().toISOString() };
    let res;
    if (isEdit) {
      res = await supabase.from('agents').update(payload).eq('id', params.id as string).select().single();
    } else {
      res = await supabase.from('agents').insert(payload).select().single();
    }
    
    if (res.error) { 
      console.error('Erreur Supabase:', res.error);
      setError(res.error.message); 
    }
    else { setSaved(true); if (!isEdit) router.push(`/dashboard/agents/${res.data.id}`); }
    setSaving(false);
  };



  const addQuickReply = () => {
    if (!quickReplyInput.trim()) return;
    set('quick_replies', [...(form.quick_replies || []), quickReplyInput.trim()]);
    setQuickReplyInput('');
  };

  const removeQuickReply = (i: number) => {
    set('quick_replies', (form.quick_replies || []).filter((_, idx) => idx !== i));
  };

  const scriptCode = form.id
    ? `<script src="${process.env.NEXT_PUBLIC_WIDGET_CDN_URL || (typeof window !== 'undefined' ? window.location.origin + '/widget.js' : 'https://cdn.siby-widget.com/widget.js')}" data-agent-id="${form.id}" async></script>`
    : '⚠️ Sauvegardez d\'abord pour obtenir votre script.';

  if (loading) return (
    <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <div style={{ color: '#606060', fontSize: '14px' }}>Chargement...</div>
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => router.back()} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
          }}>←</button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
              {isEdit ? `Éditer : ${form.name}` : 'Créer un nouvel agent'}
            </h1>
            <p style={{ fontSize: '13px', color: '#606060', marginTop: '2px' }}>
              Configuration complète de votre agent IA
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button onClick={() => setPreviewOpen(!previewOpen)} className="btn-secondary" style={{ fontSize: '13px' }}>
            {previewOpen ? '✕ Fermer aperçu' : '👁 Aperçu widget'}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: '13px' }}>
            {saving ? '⏳ Sauvegarde...' : isEdit ? '💾 Sauvegarder' : '⚡ Créer l\'agent'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#EF4444', fontSize: '13px',
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Tabs sidebar */}
        <div style={{ width: '180px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: tab === t.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: tab === t.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                color: tab === t.id ? '#F0F0F0' : '#606060',
                fontSize: '13px', fontWeight: tab === t.id ? 600 : 500,
                cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                transition: 'all 0.15s',
              }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: '28px' }}>
            {/* ── TAB: IDENTITY ─────────────────────────── */}
            {tab === 'identity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Identité de l'agent</SectionTitle>
                <FormRow label="Nom de l'agent *">
                  <input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Ex: Assistant Support Acme" />
                </FormRow>
                <FormRow label="Description (interne)">
                  <input className="input" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Notes privées sur cet agent..." />
                </FormRow>
                <FormRow label="Statut de l'Agent (Contrôle d'accès)">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['active', 'inactive', 'draft'] as const).map(s => (
                      <button key={s} onClick={() => set('status', s)} style={{
                        padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: form.status === s 
                          ? (s === 'active' ? 'rgba(34,197,94,0.15)' : s === 'inactive' ? 'rgba(239,68,68,0.15)' : 'rgba(192,192,192,0.1)') 
                          : 'rgba(255,255,255,0.02)',
                        border: form.status === s 
                          ? (s === 'active' ? '1px solid #22C55E' : s === 'inactive' ? '1px solid #EF4444' : '1px solid #C0C0C0') 
                          : '1px solid rgba(255,255,255,0.05)',
                        color: form.status === s 
                          ? (s === 'active' ? '#22C55E' : s === 'inactive' ? '#EF4444' : '#C0C0C0') 
                          : '#404040',
                        boxShadow: form.status === s ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                      }}>
                        {s === 'active' ? '● Actif' : s === 'inactive' ? '■ Stopé' : '○ Brouillon'}
                      </button>
                    ))}
                  </div>
                  <Hint>Mettez sur "Stopé" pour bloquer immédiatement l'accès à ce widget (ex: non-paiement).</Hint>
                </FormRow>
                <FormRow label="Titre de la fenêtre chat">
                  <input className="input" value={form.chat_title || ''} onChange={e => set('chat_title', e.target.value)} placeholder="Assistant" />
                </FormRow>
                <FormRow label="Sous-titre">
                  <input className="input" value={form.chat_subtitle || ''} onChange={e => set('chat_subtitle', e.target.value)} placeholder="En ligne · répond en quelques secondes" />
                </FormRow>
                <FormRow label="Langue de l'agent">
                  <select className="input" value={form.language || 'fr'} onChange={e => set('language', e.target.value)}>
                    <option value="fr">Français (Auto-détection)</option>
                    <option value="en">English (Global)</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                  </select>
                  <Hint>L'IA adaptera ses réponses et l'interface du widget à cette langue.</Hint>
                </FormRow>
                <FormRow label="Message de bienvenue">
                  <textarea className="input" value={form.welcome_message || ''} onChange={e => set('welcome_message', e.target.value)} placeholder="Bonjour 👋 Comment puis-je vous aider ?" style={{ minHeight: '80px' }} />
                </FormRow>
                <FormRow label="Placeholder input">
                  <input className="input" value={form.placeholder_text || ''} onChange={e => set('placeholder_text', e.target.value)} placeholder="Écrivez votre message..." />
                </FormRow>
                <FormRow label="Réponses rapides (quick replies)">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input className="input" value={quickReplyInput} onChange={e => setQuickReplyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addQuickReply()}
                      placeholder="Ex: Voir les tarifs" style={{ flex: 1 }} />
                    <button onClick={addQuickReply} className="btn-secondary" style={{ flexShrink: 0 }}>+ Ajouter</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(form.quick_replies || []).map((qr, i) => (
                      <span key={i} style={{
                        padding: '5px 10px', borderRadius: '20px', fontSize: '12px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        {qr}
                        <button onClick={() => removeQuickReply(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', padding: '0' }}>✕</button>
                      </span>
                    ))}
                  </div>
                </FormRow>
              </div>
            )}

            {/* ── TAB: AI ───────────────────────────────── */}
            {tab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Configuration IA</SectionTitle>
                <FormRow label="Clé API Groq (optionnelle — remplace la clé globale)">
                  <input className="input" type="password" value={form.groq_api_key || ''} onChange={e => set('groq_api_key', e.target.value)} placeholder="gsk_••••••••••••••" />
                  <Hint>Laissez vide pour utiliser la clé Groq configurée dans vos variables d'env Supabase.</Hint>
                </FormRow>
                <FormRow label="Modèle Groq *">
                  <select className="input" value={form.model || 'llama3-8b-8192'} onChange={e => set('model', e.target.value)}>
                    {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </FormRow>
                <FormRow label={`Température : ${form.temperature}`}>
                  <input type="range" min="0" max="2" step="0.1" value={form.temperature || 0.7} onChange={e => set('temperature', parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#C0C0C0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#505050', marginTop: '4px' }}>
                    <span>0 — Précis</span><span>1 — Équilibré</span><span>2 — Créatif</span>
                  </div>
                </FormRow>
                <FormRow label={`Max tokens : ${form.max_tokens}`}>
                  <input type="range" min="128" max="4096" step="128" value={form.max_tokens || 1024} onChange={e => set('max_tokens', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#C0C0C0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#505050', marginTop: '4px' }}>
                    <span>128</span><span>2048</span><span>4096</span>
                  </div>
                </FormRow>
                <FormRow label="Prompt système *">
                  <textarea className="input" value={form.system_prompt || ''} onChange={e => set('system_prompt', e.target.value)}
                    placeholder="Tu es un assistant professionnel pour [Entreprise]. Tu aides les visiteurs à..." style={{ minHeight: '160px' }} />
                  <Hint>Ce prompt définit le comportement et la personnalité de votre agent. Soyez précis et complet.</Hint>
                </FormRow>
                <FormRow label="Base de connaissances (Knowledge Base)">
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input className="input" placeholder="https://monsite.com/a-propos" id="crawler-url" />
                      <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '12px', color: '#444' }}>🌐</span>
                    </div>
                    <button onClick={async () => {
                      const urlInput = (document.getElementById('crawler-url') as HTMLInputElement).value;
                      if (!urlInput) return;
                      const btn = document.getElementById('crawler-btn');
                      if (btn) btn.innerText = '⏳ Analyse en cours...';
                      
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/crawler`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: urlInput })
                        });
                        const data = await res.json();
                        
                        if (data.content) {
                          const formatted = `\n--- CONTENU EXTRAIT DE ${urlInput} ---\n${data.content}\n`;
                          set('knowledge_base', (form.knowledge_base || '') + formatted);
                          if (btn) btn.innerText = '✨ Terminé !';
                        } else {
                          alert('Erreur : ' + (data.error || 'Impossible de lire le site.'));
                          if (btn) btn.innerText = '❌ Erreur';
                        }
                      } catch (e) {
                        console.error(e);
                        if (btn) btn.innerText = '❌ Erreur';
                      }

                      setTimeout(() => { if (btn) btn.innerText = '🔍 Crawler'; }, 3000);
                    }} id="crawler-btn" className="btn-secondary" style={{ flexShrink: 0 }}>🔍 Crawler</button>
                  </div>
                  <textarea className="input" value={form.knowledge_base || ''} onChange={e => set('knowledge_base', e.target.value)}
                    placeholder="Ajoutez ici les informations spécifiques à votre entreprise : FAQ, tarifs, procédures, produits..."
                    style={{ minHeight: '200px' }} />
                  <Hint>Cette base sera injectée dans chaque conversation. Le crawler ajoute du contenu sans effacer l'existant.</Hint>
                </FormRow>
              </div>
            )}

            {/* ── TAB: DESIGN ──────────────────────────── */}
            {tab === 'design' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Design du widget (Canvas)</SectionTitle>
                
                <div style={{ 
                  padding: '20px', borderRadius: '12px', background: 'rgba(192,192,192,0.03)', 
                  border: '1px solid var(--border)', display: 'flex', gap: '20px', alignItems: 'center'
                }}>
                  <div style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', 
                    background: 'var(--bg-elevated)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}>
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '24px' }}>🖼️</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', marginBottom: '4px' }}>Photo de profil / Logo</div>
                    <p style={{ fontSize: '12px', color: '#606060', marginBottom: '12px' }}>Style TikTik/WhatsApp. Les images sont automatiquement recadrées en cercle.</p>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} id="logo-upload" />
                    <label htmlFor="logo-upload" className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block', fontSize: '12px' }}>
                      {uploading ? '⏳ Envoi...' : '📤 Changer la photo'}
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <FormRow label="Thème visuel">
                    <select className="input" value={form.widget_theme || 'dark'} onChange={e => set('widget_theme', e.target.value)}>
                      <option value="dark">🌙 Dark Mode (Premium)</option>
                      <option value="light">☀️ Light Mode (Clean)</option>
                      <option value="auto">🌗 Auto (Système)</option>
                    </select>
                  </FormRow>
                  <FormRow label="Position">
                    <select className="input" value={form.position || 'bottom-right'} onChange={e => set('position', e.target.value)}>
                      {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </FormRow>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { key: 'primary_color', label: 'Primaire' },
                    { key: 'secondary_color', label: 'Secondaire' },
                    { key: 'accent_color', label: 'Accent' },
                  ].map(c => (
                    <FormRow key={c.key} label={c.label}>
                      <div className="color-swatch" style={{ background: (form as any)[c.key] || '#000', width: '100%', height: '36px' }}>
                        <input type="color" value={(form as any)[c.key] || '#000000'} onChange={e => set(c.key as keyof Agent, e.target.value)} />
                      </div>
                    </FormRow>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormRow label={`Flou Glass : ${form.glass_blur}`}>
                     <input type="range" min="0" max="30" value={parseInt(form.glass_blur || '10')} onChange={e => set('glass_blur', `${e.target.value}px`)} style={{ width: '100%' }} />
                  </FormRow>
                  <FormRow label={`Opacité : ${form.glass_opacity}`}>
                     <input type="range" min="0" max="1" step="0.05" value={parseFloat(form.glass_opacity || '0.1')} onChange={e => set('glass_opacity', e.target.value)} style={{ width: '100%' }} />
                  </FormRow>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormRow label="Style du Bouton">
                    <select className="input" value={form.animation_style || 'float'} onChange={e => set('animation_style', e.target.value)}>
                      <option value="float">Flottant (Zen)</option>
                      <option value="pulse">Pulsation (Glow)</option>
                      <option value="shake">Secousse (Attention)</option>
                      <option value="none">Statique</option>
                    </select>
                  </FormRow>

                  <FormRow label="Forme du Logo (TikTok Style)">
                    <select className="input" value={form.logo_shape || 'circle'} onChange={e => set('logo_shape', e.target.value)}>
                      <option value="circle">Cercle Parfait</option>
                      <option value="square">Carré Moderne</option>
                      <option value="rounded">Arrondi (Squircle)</option>
                    </select>
                  </FormRow>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div className="text-sm font-bold text-primary">Rainbow Glow Mode 🌈</div>
                    <div className="text-[10px] text-muted uppercase font-black tracking-wider">Feature Surprise Platinum</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={form.rainbow_glow || false} onChange={e => set('rainbow_glow', e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            )}

            {/* ── TAB: CONNECTORS ──────────────────────── */}
            {tab === 'connectors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <SectionTitle>Connecteurs & Notifications</SectionTitle>
                
                <div className="card" style={{ padding: '20px', border: '1px solid rgba(0,136,204,0.2)', background: 'rgba(0,136,204,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '24px' }}>✈️</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0' }}>Telegram Bot</div>
                      <div style={{ fontSize: '12px', color: '#606060' }}>Recevez les leads instantanément sur Telegram.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <FormRow label="Bot Token">
                      <input className="input" type="password" value={form.telegram_bot_token || ''} onChange={e => set('telegram_bot_token', e.target.value)} placeholder="123456:ABC-DEF..." />
                    </FormRow>
                    <div style={{ 
                      padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,136,204,0.05)', 
                      border: '1px solid rgba(0,136,204,0.1)', fontSize: '12px', color: '#0088CC' 
                    }}>
                      💡 <strong>Configuration simplifiée :</strong> Plus besoin d'ID ! Envoyez simplement un message (ex: "/start") à votre bot sur Telegram, et Siby détectera automatiquement où envoyer les leads.
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px', border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '24px' }}>💬</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0' }}>WhatsApp (Twilio)</div>
                      <div style={{ fontSize: '12px', color: '#606060' }}>Connectez votre numéro métier WhatsApp.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <FormRow label="Numéro WhatsApp">
                      <input className="input" value={form.whatsapp_phone || ''} onChange={e => set('whatsapp_phone', e.target.value)} placeholder="+33612345678" />
                    </FormRow>
                    <FormRow label="Clé API / Token">
                      <input className="input" type="password" value={form.whatsapp_api_key || ''} onChange={e => set('whatsapp_api_key', e.target.value)} placeholder="Clé secrète WhatsApp..." />
                    </FormRow>
                  </div>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                   <ToggleRow label="Activer les notifications EmailJS" checked={!!form.email_capture_enabled} onChange={v => set('email_capture_enabled', v)} />
                   {form.email_capture_enabled && (
                     <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <FormRow label="Template ID">
                          <input className="input" value={form.emailjs_template_id || ''} onChange={e => set('emailjs_template_id', e.target.value)} />
                        </FormRow>
                     </div>
                   )}
                </div>
              </div>
            )}

            {/* ── TAB: EMAIL ────────────────────────────── */}
            {tab === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Configuration EmailJS</SectionTitle>
                <div style={{
                  padding: '14px 16px', borderRadius: '10px',
                  background: 'rgba(192,192,192,0.05)', border: '1px solid rgba(192,192,192,0.1)',
                  fontSize: '13px', color: '#888', lineHeight: 1.7,
                }}>
                  💡 EmailJS vous permet d'envoyer des emails directement depuis le frontend. Créez un compte gratuit sur{' '}
                  <a href="https://emailjs.com" target="_blank" style={{ color: '#C0C0C0' }}>emailjs.com</a>,
                  puis configurez un service et un template.
                </div>
                <FormRow label="Service ID EmailJS">
                  <input className="input" value={form.emailjs_service_id || ''} onChange={e => set('emailjs_service_id', e.target.value)} placeholder="service_xxxxxxx" />
                </FormRow>
                <FormRow label="Template ID EmailJS">
                  <input className="input" value={form.emailjs_template_id || ''} onChange={e => set('emailjs_template_id', e.target.value)} placeholder="template_xxxxxxx" />
                </FormRow>
                <FormRow label="Public Key EmailJS">
                  <input className="input" value={form.emailjs_public_key || ''} onChange={e => set('emailjs_public_key', e.target.value)} placeholder="xxxxxxxxxxxxxxxxxxx" />
                </FormRow>
                <FormRow label="Email de réception des notifications">
                  <input className="input" type="email" value={form.notification_email || ''} onChange={e => set('notification_email', e.target.value)} placeholder="vous@exemple.com" />
                </FormRow>
                <FormRow label="Déclencheur d'envoi">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { value: 'on_lead', label: '🎯 Dès qu\'un lead est détecté', desc: 'Email envoyé immédiatement quand un visiteur partage ses coordonnées' },
                      { value: 'on_session_end', label: '⏱ Fin de session', desc: 'Email envoyé après 30 min d\'inactivité' },
                      { value: 'always', label: '📨 À chaque message', desc: 'Un email par message (non recommandé)' },
                    ].map(opt => (
                      <label key={opt.value} style={{
                        padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                        background: form.email_capture_trigger === opt.value ? 'rgba(192,192,192,0.06)' : 'var(--bg-elevated)',
                        border: form.email_capture_trigger === opt.value ? '1px solid rgba(192,192,192,0.2)' : '1px solid var(--border)',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                      }}>
                        <input type="radio" name="trigger" value={opt.value}
                          checked={form.email_capture_trigger === opt.value}
                          onChange={() => set('email_capture_trigger', opt.value)}
                          style={{ marginTop: '2px', accentColor: '#C0C0C0' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F0' }}>{opt.label}</div>
                          <div style={{ fontSize: '12px', color: '#606060', marginTop: '2px' }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </FormRow>
                <FormRow label="">
                  <ToggleRow label="Activer la capture de leads par email" checked={!!form.email_capture_enabled} onChange={v => set('email_capture_enabled', v)} />
                </FormRow>
              </div>
            )}

            {/* ── TAB: FORMS ────────────────────────────── */}
            {tab === 'forms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Configuration du Formulaire de Leads</SectionTitle>
                <div style={{
                  padding: '14px 16px', borderRadius: '10px',
                  background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)',
                  fontSize: '13px', color: '#888', lineHeight: 1.7,
                }}>
                  Sélectionnez les informations que l&apos;agent doit collecter auprès du visiteur.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ToggleRow label="Demander le Nom Complet" checked={true} onChange={() => {}} />
                  <ToggleRow label="Demander l'Email (Requis)" checked={true} onChange={() => {}} />
                  <ToggleRow label="Demander le Numéro de Téléphone" checked={!!form.ask_phone} onChange={v => set('ask_phone', v)} />
                  <ToggleRow label="Demander le Nom de l'Entreprise" checked={!!form.ask_company} onChange={v => set('ask_company', v)} />
                  <ToggleRow label="Demander l'URL du Site Web" checked={!!form.ask_website} onChange={v => set('ask_website', v)} />
                </div>

                <FormRow label="Message d'introduction du formulaire">
                  <input className="input" value={form.lead_intro || ''} onChange={e => set('lead_intro', e.target.value)} 
                    placeholder="Laissez-nous vos coordonnées pour que nous puissions vous recontacter." />
                </FormRow>

                <FormRow label="Message de confirmation (après envoi)">
                  <input className="input" value={form.lead_success || ''} onChange={e => set('lead_success', e.target.value)} 
                    placeholder="Merci ! Un expert vous recontactera sous 24h." />
                </FormRow>

                <div style={{ marginTop: '10px', padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#C0C0C0', marginBottom: '8px' }}>👁️ Aperçu du formulaire</div>
                  <div style={{ background: '#0F0F0F', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ width: '100%', height: '24px', background: 'var(--bg-base)', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '10px', color: '#333' }}>Nom complet</div>
                    <div style={{ width: '100%', height: '24px', background: 'var(--bg-base)', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '10px', color: '#333' }}>Email</div>
                    {form.ask_phone && <div style={{ width: '100%', height: '24px', background: 'var(--bg-base)', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '10px', color: '#333' }}>Téléphone</div>}
                    <div style={{ width: '100%', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#000' }}>Envoyer</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ADVANCED ─────────────────────────── */}
            {tab === 'advanced' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Fonctionnalités avancées</SectionTitle>
                <FormRow label={`Rate limit : ${form.rate_limit_per_hour} messages/heure/visiteur`}>
                  <input type="range" min="10" max="500" step="10" value={form.rate_limit_per_hour || 50} onChange={e => set('rate_limit_per_hour', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#C0C0C0' }} />
                </FormRow>
                <FormRow label="Domaines autorisés (un par ligne)">
                  <textarea className="input" value={(form.allowed_domains || []).join('\n')}
                    onChange={e => set('allowed_domains', e.target.value.split('\n').filter(Boolean))}
                    placeholder="monsite.com&#10;boutique.fr" style={{ minHeight: '80px' }} />
                  <Hint>Laissez vide pour autoriser tous les domaines.</Hint>
                </FormRow>
                <FormRow label="Mots-clés bloqués (un par ligne)">
                  <textarea className="input" value={(form.blocked_keywords || []).join('\n')}
                    onChange={e => set('blocked_keywords', e.target.value.split('\n').filter(Boolean))}
                    placeholder="spam&#10;concurrent" style={{ minHeight: '80px' }} />
                </FormRow>
                <FormRow label="URL Webhook (POST JSON)">
                  <input className="input" value={form.webhook_url || ''} onChange={e => set('webhook_url', e.target.value)} placeholder="https://hooks.zapier.com/..." />
                </FormRow>
                <FormRow label="Clé secrète webhook (HMAC-SHA256)">
                  <input className="input" value={form.webhook_secret || ''} readOnly style={{ fontFamily: 'monospace', fontSize: '12px' }} />
                </FormRow>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#606060', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Interface</div>
                  <ToggleRow label="Indicateur de frappe (typing...)" checked={!!form.show_typing_indicator} onChange={v => set('show_typing_indicator', v)} />
                  <ToggleRow label="Afficher les horodatages" checked={!!form.show_timestamps} onChange={v => set('show_timestamps', v)} />
                  <ToggleRow label="Boutons de feedback 👍👎" checked={!!form.enable_feedback} onChange={v => set('enable_feedback', v)} />
                  <ToggleRow label="Activer la capture de lead (détection email/tél)" checked={!!form.email_capture_enabled} onChange={v => set('email_capture_enabled', v)} />
                </div>
              </div>
            )}

            {/* ── TAB: INTEGRATION ──────────────────────── */}
            {tab === 'integration' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SectionTitle>Code d'intégration</SectionTitle>
                {!form.id ? (
                  <div style={{
                    padding: '20px', borderRadius: '12px', textAlign: 'center',
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                    color: '#F59E0B', fontSize: '14px',
                  }}>
                    ⚠️ Sauvegardez d'abord votre agent pour obtenir le code d'intégration.
                  </div>
                ) : (
                  <>
                    <div>
                      <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                        Copiez-collez ce code avant la balise <code style={{ color: '#C0C0C0' }}>&lt;/body&gt;</code> de votre site :
                      </p>
                      <div className="code-block" style={{ position: 'relative' }}>
                        <span className="code-tag">&lt;script</span>{' '}
                        <span className="code-attr">src</span>=<span className="code-string">"https://dashboard-zeta-sand-24.vercel.app/widget.js"</span>{' '}
                        <span className="code-attr">data-agent-id</span>=<span className="code-string">"{form.id}"</span>{' '}
                        <span className="code-attr">async</span>
                        <span className="code-tag">&gt;&lt;/script&gt;</span>
                        <button onClick={() => { navigator.clipboard.writeText(scriptCode); }} style={{
                          position: 'absolute', top: '10px', right: '10px',
                          padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          background: 'rgba(192,192,192,0.1)', border: '1px solid rgba(192,192,192,0.2)',
                          color: '#C0C0C0', cursor: 'pointer',
                        }}>📋 Copier</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'WordPress', icon: '🔵', code: 'Appearance → Theme Editor → footer.php → avant </body>' },
                        { label: 'Shopify', icon: '🟢', code: 'Online Store → Themes → Edit code → theme.liquid → avant </body>' },
                        { label: 'Webflow', icon: '🟣', code: 'Project Settings → Custom Code → Footer Code' },
                        { label: 'Wix', icon: '🟡', code: 'Settings → Advanced → Custom Code → Body (end)' },
                      ].map(p => (
                        <div key={p.label} style={{
                          padding: '14px', borderRadius: '10px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', marginBottom: '6px' }}>
                            {p.icon} {p.label}
                          </div>
                          <div style={{ fontSize: '12px', color: '#606060', lineHeight: 1.6 }}>{p.code}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      padding: '16px', borderRadius: '10px',
                      background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#22C55E', marginBottom: '8px' }}>✓ Checklist d'intégration</div>
                      {[
                        'Clé Groq configurée dans Supabase Edge Function ou dans cet agent',
                        'Script collé avant </body> sur votre site',
                        'Agent en statut "Actif"',
                        'EmailJS configuré si vous voulez des notifications lead',
                        'Domaines autorisés ajoutés si vous voulez restreindre l\'accès',
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#888', marginBottom: '4px' }}>
                          <span style={{ color: '#22C55E' }}>✓</span>{item}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Widget preview panel — LIVE */}
        {previewOpen && (
          <div style={{ width: '360px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '16px', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#606060', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  ✨ Aperçu temps réel
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>LIVE</span>
                </div>
              </div>

              {/* Simulated website background */}
              <div style={{
                background: '#1a1a2e', borderRadius: '12px', padding: '12px',
                position: 'relative', minHeight: '480px',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}>
                {/* Fake website content */}
                <div style={{ opacity: 0.3, marginBottom: '20px' }}>
                  <div style={{ width: '60%', height: '8px', background: '#333', borderRadius: '4px', marginBottom: '8px' }}></div>
                  <div style={{ width: '80%', height: '6px', background: '#333', borderRadius: '4px', marginBottom: '6px' }}></div>
                  <div style={{ width: '45%', height: '6px', background: '#333', borderRadius: '4px', marginBottom: '16px' }}></div>
                  <div style={{ width: '100%', height: '40px', background: '#333', borderRadius: '8px', marginBottom: '8px' }}></div>
                  <div style={{ width: '100%', height: '40px', background: '#333', borderRadius: '8px' }}></div>
                </div>

                {/* Widget chat window */}
                <div style={{
                  borderRadius: (form.border_radius as string) || '16px',
                  overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  fontFamily: form.font_family || 'DM Sans, sans-serif',
                  position: 'relative',
                  backdropFilter: `blur(${form.glass_blur || '10px'})`,
                  backgroundColor: form.widget_theme === 'light' 
                    ? `rgba(250, 250, 250, ${1 - parseFloat(form.glass_opacity || '0.1')})`
                    : `rgba(13, 13, 13, ${1 - parseFloat(form.glass_opacity || '0.1')})`,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: `linear-gradient(135deg, ${form.primary_color || '#0A0A0A'}, #1e1e1e)`,
                  }}>
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.2)' }} />
                    ) : (
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '18px',
                      }}>{form.button_icon || '🤖'}</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{form.chat_title || 'Assistant'}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }}></span>
                        {form.chat_subtitle || 'En ligne'}
                      </div>
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>✕</div>
                  </div>

                  {/* Messages area */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' }}>
                    {/* Bot welcome message */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      {form.avatar_url ? (
                         <img src={form.avatar_url} alt="B" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                         <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{form.button_icon || '🤖'}</div>
                      )}
                      <div style={{
                        padding: '10px 14px', borderRadius: '14px 14px 14px 4px', fontSize: '12.5px', lineHeight: 1.5,
                        background: form.widget_theme === 'light' ? '#F0F0F0' : '#1A1A1A',
                        color: form.widget_theme === 'light' ? '#1A1A1A' : '#E8E8E8',
                        maxWidth: '80%', border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {form.welcome_message || 'Bonjour 👋 Comment puis-je vous aider ?'}
                      </div>
                    </div>

                    {/* User message */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: 'row-reverse' }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: '14px 14px 4px 14px', fontSize: '12.5px',
                        background: `linear-gradient(135deg, ${form.primary_color || '#0A0A0A'}, ${form.accent_color || '#C0C0C0'})`,
                        color: '#fff', maxWidth: '80%',
                      }}>Bonjour, j&apos;ai besoin d&apos;aide 🙏</div>
                    </div>

                    {/* Bot reply */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      {form.avatar_url ? (
                         <img src={form.avatar_url} alt="B" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                         <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{form.button_icon || '🤖'}</div>
                      )}
                      <div>
                        <div style={{
                          padding: '10px 14px', borderRadius: '14px 14px 14px 4px', fontSize: '12.5px', lineHeight: 1.5,
                          background: form.widget_theme === 'light' ? '#F0F0F0' : '#1A1A1A',
                          color: form.widget_theme === 'light' ? '#1A1A1A' : '#E8E8E8',
                          maxWidth: '100%', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          Bien sûr ! Je suis là pour vous aider. Que puis-je faire pour vous ? 😊
                        </div>
                        {/* Feedback buttons */}
                        {form.enable_feedback && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>👍</span>
                            <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>👎</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick replies */}
                    {form.quick_replies && form.quick_replies.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '32px' }}>
                        {form.quick_replies.slice(0, 3).map((qr, i) => (
                          <span key={i} style={{
                            padding: '6px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 500,
                            background: 'transparent', border: `1px solid ${form.accent_color || '#C0C0C0'}40`,
                            color: form.accent_color || '#C0C0C0', cursor: 'pointer',
                          }}>{qr}</span>
                        ))}
                      </div>
                    )}

                    {/* Typing indicator */}
                    {form.show_typing_indicator && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>{form.button_icon || '🤖'}</div>
                        <div style={{
                          padding: '10px 14px', borderRadius: '14px', fontSize: '12px',
                          background: form.widget_theme === 'light' ? '#F0F0F0' : '#1A1A1A',
                          border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', gap: '4px', alignItems: 'center',
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#888', animation: 'siby-typing 1.2s ease 0s infinite' }}></span>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#888', animation: 'siby-typing 1.2s ease 0.2s infinite' }}></span>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#888', animation: 'siby-typing 1.2s ease 0.4s infinite' }}></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ padding: '10px 14px', borderTop: `1px solid ${form.widget_theme === 'light' ? '#E0E0E0' : 'rgba(255,255,255,0.06)'}` }}>
                    <div style={{
                      display: 'flex', gap: '8px', alignItems: 'center',
                      background: form.widget_theme === 'light' ? '#fff' : '#1A1A1A',
                      border: `1px solid ${form.widget_theme === 'light' ? '#E0E0E0' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '10px', padding: '8px 12px',
                    }}>
                      <span style={{ flex: 1, fontSize: '12px', color: 'rgba(128,128,128,0.5)' }}>
                        {form.placeholder_text || 'Écrivez votre message...'}
                      </span>
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: `linear-gradient(135deg, ${form.primary_color || '#0A0A0A'}, ${form.accent_color || '#C0C0C0'})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                      }}>➤</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ textAlign: 'center', padding: '6px', fontSize: '10px', color: '#505050' }}>
                    Propulsé par <strong style={{ color: '#888' }}>Siby</strong>
                  </div>
                </div>

                {/* Floating button */}
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: form.position?.includes('left') ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${form.primary_color || '#0A0A0A'}, ${form.accent_color || '#C0C0C0'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 6px 25px rgba(0,0,0,0.5)',
                    animation: 'siby-pulse 2s ease infinite',
                  }}>{form.button_icon || '🤖'}</div>
                </div>
              </div>

              {/* Preview info */}
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#505050', textAlign: 'center' }}>
                Font: <span style={{ color: '#888' }}>{form.font_family || 'DM Sans'}</span> · 
                Position: <span style={{ color: '#888' }}>{form.position || 'bottom-right'}</span> · 
                Thème: <span style={{ color: '#888' }}>{form.widget_theme || 'dark'}</span>
              </div>
            </div>

            <style>{`
              @keyframes siby-typing { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
              @keyframes siby-pulse { 0%, 100% { box-shadow: 0 6px 25px rgba(0,0,0,0.5); } 50% { box-shadow: 0 6px 25px rgba(0,0,0,0.5), 0 0 0 8px rgba(192,192,192,0.1); } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.3px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
      {children}
    </h2>
  );
}
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
    </div>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '12px', color: '#505050', marginTop: '5px', lineHeight: 1.5 }}>{children}</p>;
}
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
}
