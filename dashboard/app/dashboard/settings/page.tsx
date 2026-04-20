'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: '', company: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const { data } = await supabase.from('profiles').select('*').eq('id', masterId).single();
      if (data) {
        setProfile(data);
        setForm({ full_name: data.full_name || '', company: data.company || '', email: data.email || 'onesiby7@gmail.com' });
      }
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    await supabase.from('profiles').update({ full_name: form.full_name, company: form.company }).eq('id', masterId);
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const regenerateKey = async () => {
    if (!confirm('Régénérer votre clé API ? Toutes les intégrations utilisant l\'ancienne clé cesseront de fonctionner.')) return;
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    const newKey = 'sw_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
    await supabase.from('profiles').update({ api_key: newKey }).eq('id', masterId);
    setProfile(prev => prev ? { ...prev, api_key: newKey } : prev);
  };


  const PLAN_FEATURES: Record<string, string[]> = {
    free: ['1 agent', '500 messages/mois', 'Branding Siby Widget'],
    starter: ['5 agents', '5 000 messages/mois', 'Pas de branding', 'Webhooks'],
    pro: ['20 agents', '50 000 messages/mois', 'Tout Starter', 'Analytics avancé', 'API access'],
    enterprise: ['Illimité', 'Illimité', 'Tout Pro', 'SLA', 'Support dédié'],
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>⚙️ Paramètres</h1>
        <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>Gérez votre compte et vos préférences</p>
      </div>

      {/* Profile */}
      <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
          Profil
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Nom complet</label>
              <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Entreprise</label>
              <input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} disabled style={{ opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ fontSize: '13px' }}>
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
            {saved && <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 600 }}>✓ Profil mis à jour</span>}
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', marginBottom: '6px' }}>Clé API</h2>
        <p style={{ fontSize: '13px', color: '#606060', marginBottom: '16px' }}>Utilisez cette clé pour accéder à l'API Siby Widget.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="input" readOnly value={showKey ? (profile?.api_key || '') : '•'.repeat(40)} style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', flex: 1 }} />
          <button onClick={() => setShowKey(!showKey)} className="btn-secondary" style={{ flexShrink: 0, fontSize: '13px' }}>
            {showKey ? '🙈' : '👁'}
          </button>
          <button onClick={() => profile?.api_key && navigator.clipboard.writeText(profile.api_key)} className="btn-secondary" style={{ flexShrink: 0, fontSize: '13px' }}>
            📋
          </button>
        </div>
        <button onClick={regenerateKey} style={{
          marginTop: '12px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
          color: '#EF4444', cursor: 'pointer',
        }}>🔄 Régénérer la clé</button>
      </div>

      {/* Plan */}
      <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>Plan actuel</h2>
          <span style={{ padding: '5px 14px', borderRadius: '100px', background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.2)', fontSize: '12px', fontWeight: 800, color: '#C0C0C0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {profile?.plan || 'Free'}
          </span>
        </div>

        {/* Usage bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
            <span>Messages utilisés ce mois</span>
            <span style={{ fontWeight: 700, color: '#C0C0C0' }}>{profile?.messages_used || 0} / {profile?.message_quota || 500}</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)' }}>
            <div style={{
              width: `${Math.min(100, ((profile?.messages_used || 0) / (profile?.message_quota || 500)) * 100)}%`,
              height: '100%', borderRadius: '3px',
              background: (profile?.messages_used || 0) > (profile?.message_quota || 500) * 0.9
                ? 'linear-gradient(90deg, #EF4444, #F59E0B)'
                : 'linear-gradient(90deg, #C0C0C0, #888)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {(PLAN_FEATURES[profile?.plan || 'free'] || []).map(f => (
            <span key={f} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#22C55E' }}>
              ✓ {f}
            </span>
          ))}
        </div>

        <button className="btn-primary" style={{ fontSize: '13px' }}>
          ⚡ Upgrader le plan
        </button>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: '28px', borderColor: 'rgba(239,68,68,0.15)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444', marginBottom: '6px' }}>⚠️ Zone dangereuse</h2>
        <p style={{ fontSize: '13px', color: '#606060', marginBottom: '16px' }}>Ces actions sont irréversibles.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444', cursor: 'pointer',
          }}>Supprimer tous les agents</button>
          <button style={{
            padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444', cursor: 'pointer',
          }}>Supprimer mon compte</button>
        </div>
      </div>
    </div>
  );
}
