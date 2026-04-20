'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface TeamMember {
  id: string; email: string; role: string; status: string;
  invited_at: string; joined_at?: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('team_members').select('*').eq('owner_id', user.id).order('invited_at', { ascending: false });
      setMembers(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('team_members').insert({ owner_id: user.id, email: inviteEmail.trim(), role: inviteRole, status: 'pending' }).select().single();
    if (!error && data) {
      setMembers(prev => [data, ...prev]);
      setInviteEmail('');
    }
    setInviting(false);
  };

  const removeMember = async (id: string) => {
    if (!confirm('Retirer ce membre ?')) return;
    await supabase.from('team_members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const ROLE_COLORS: Record<string, string> = { admin: '#EF4444', editor: '#F59E0B', viewer: '#C0C0C0' };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>👥 Équipe</h1>
        <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>Gérez les accès à votre dashboard</p>
      </div>

      {/* Invite form */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', marginBottom: '16px' }}>Inviter un membre</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input className="input" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemple.com" style={{ flex: 1, minWidth: '220px' }} onKeyDown={e => e.key === 'Enter' && invite()} />
          <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: '140px' }}>
            <option value="viewer">Viewer</option>
            <option value="editor">Éditeur</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={invite} disabled={inviting || !inviteEmail.trim()} className="btn-primary" style={{ flexShrink: 0 }}>
            {inviting ? '⏳' : '+ Inviter'}
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="card">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#F0F0F0' }}>{members.length} membre{members.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#505050' }}>Chargement...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '14px', color: '#505050' }}>Aucun membre dans votre équipe. Invitez des collaborateurs pour gérer vos agents ensemble.</div>
          </div>
        ) : (
          members.map(m => (
            <div key={m.id} className="table-row" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: '#C0C0C0',
              }}>{m.email[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0' }}>{m.email}</div>
                <div style={{ fontSize: '11px', color: '#505050', marginTop: '2px' }}>
                  Invité le {new Date(m.invited_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: `${ROLE_COLORS[m.role]}18`, color: ROLE_COLORS[m.role], border: `1px solid ${ROLE_COLORS[m.role]}30` }}>
                {m.role}
              </span>
              <span style={{
                padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
                background: m.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                color: m.status === 'active' ? '#22C55E' : '#F59E0B',
                border: `1px solid ${m.status === 'active' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }}>{m.status === 'active' ? '● Actif' : '○ En attente'}</span>
              <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* Role descriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
        {[
          { role: 'Viewer', color: '#C0C0C0', perms: ['Voir les agents', 'Voir les leads', 'Voir les analytics'] },
          { role: 'Éditeur', color: '#F59E0B', perms: ['Tout Viewer', 'Créer/Éditer les agents', 'Gérer les leads'] },
          { role: 'Admin', color: '#EF4444', perms: ['Tout Éditeur', 'Supprimer agents', 'Gérer l\'équipe'] },
        ].map(r => (
          <div key={r.role} style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: r.color, marginBottom: '8px' }}>{r.role}</div>
            {r.perms.map(p => <div key={p} style={{ fontSize: '12px', color: '#606060', marginBottom: '4px' }}>✓ {p}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}
