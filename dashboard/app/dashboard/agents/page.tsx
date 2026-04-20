'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import type { Agent } from '@/lib/supabase';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const { data } = await supabase.from('agents').select('*').eq('user_id', masterId).order('created_at', { ascending: false });
      setAgents(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = agents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'inactive' : 'active';
    await supabase.from('agents').update({ status: newStatus }).eq('id', id);
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as 'active' | 'inactive' | 'draft' } : a));
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Supprimer cet agent ? Cette action est irréversible.')) return;
    await supabase.from('agents').delete().eq('id', id);
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  const cloneAgent = async (agent: Agent) => {
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    const { id, created_at, updated_at, total_sessions, total_messages, total_leads, satisfaction_score, slug, ...rest } = agent;
    const { data } = await supabase.from('agents').insert({
      ...rest,
      user_id: masterId,
      name: `${agent.name} (copie)`,
      slug: `agent-${Math.random().toString(36).slice(2, 7)}`,
      total_sessions: 0, total_messages: 0, total_leads: 0,
    }).select().single();
    if (data) setAgents(prev => [data, ...prev]);
  };


  const copyScript = (id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001');
    const script = `<script src="${origin}/widget.js" data-agent-id="${id}" async></script>`;
    navigator.clipboard.writeText(script);
    alert('Script copié ! ✅\n\nNote : Si votre site est en ligne, le dashboard doit aussi être déployé sur une URL publique (ex: Vercel) pour que le widget apparaisse.');
  };


  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>Mes Agents IA</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>{agents.length} agent{agents.length > 1 ? 's' : ''} configuré{agents.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/agents/new" className="btn-primary" style={{ textDecoration: 'none' }}>
          + Créer un agent
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="🔍 Rechercher un agent..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'active', 'inactive', 'draft'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: filter === f ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border)',
              color: filter === f ? '#F0F0F0' : '#606060',
            }}>
              {f === 'all' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '16px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '80px 40px', textAlign: 'center',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '20px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F0', marginBottom: '8px' }}>
            {search ? 'Aucun résultat' : 'Aucun agent'}
          </h2>
          <p style={{ color: '#606060', fontSize: '14px', marginBottom: '24px' }}>
            {search ? 'Essayez avec d\'autres mots-clés.' : 'Créez votre premier agent IA en 2 minutes.'}
          </p>
          {!search && <Link href="/dashboard/agents/new" className="btn-primary" style={{ textDecoration: 'none' }}>Créer mon premier agent →</Link>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(agent => (
            <div key={agent.id} className="card" style={{ padding: '20px' }}>
              {/* Agent header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${agent.primary_color}, #2a2a2a)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', border: '1px solid rgba(255,255,255,0.08)',
                }}>{agent.button_icon || '🤖'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.name}
                    </h3>
                    <span className={`badge ${agent.status === 'active' ? 'badge-green' : agent.status === 'draft' ? 'badge-amber' : 'badge-silver'}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#606060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.model} · {agent.widget_theme} theme
                  </p>
                </div>
              </div>

              {/* Stats mini */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Sessions', value: agent.total_sessions || 0 },
                  { label: 'Messages', value: agent.total_messages || 0 },
                  { label: 'Leads', value: agent.total_leads || 0, color: '#22C55E' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: s.color || '#C0C0C0' }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: '#505050', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Script preview */}
              <div className="code-block" style={{ fontSize: '11px', marginBottom: '14px', padding: '10px 12px' }}>
                <span className="code-tag">&lt;script</span>{' '}
                <span className="code-attr">data-agent-id</span>=
                <span className="code-string">"{agent.id.slice(0, 16)}..."</span>
                <span className="code-tag">&gt;&lt;/script&gt;</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button onClick={() => copyScript(agent.id)} style={{
                  flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.15)',
                  color: '#C0C0C0', cursor: 'pointer',
                }}>📋 Script</button>
                <Link href={`/dashboard/agents/${agent.id}`} style={{
                  flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', textDecoration: 'none', textAlign: 'center',
                }}>✏️ Éditer</Link>
                <button onClick={() => cloneAgent(agent)} title="Dupliquer" style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                  color: '#3B82F6', cursor: 'pointer',
                }}>🔄</button>
                <button onClick={() => toggleStatus(agent.id, agent.status)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                }}>{agent.status === 'active' ? '⏸' : '▶'}</button>
                <button onClick={() => deleteAgent(agent.id)} style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#EF4444', cursor: 'pointer',
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
