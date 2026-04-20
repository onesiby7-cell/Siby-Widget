'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Session, Message } from '@/lib/supabase';

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<(Session & { agents?: { name: string; button_icon?: string } })[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const { data: agentsData } = await supabase.from('agents').select('id, name').eq('user_id', masterId);
      setAgents(agentsData || []);
      const agentIds = (agentsData || []).map((a: { id: string }) => a.id);
      if (agentIds.length === 0) { setLoading(false); return; }
      const { data } = await supabase
        .from('sessions')
        .select('*, agents(name, button_icon)')
        .in('agent_id', agentIds)
        .order('last_message_at', { ascending: false })
        .limit(100);
      setSessions(data || []);
      setLoading(false);
    };
    load();
  }, []);


  const loadMessages = async (sessionId: string) => {
    setSelected(sessionId);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const filtered = sessions.filter(s => {
    const matchAgent = agentFilter === 'all' || s.agent_id === agentFilter;
    const matchSearch = !search || [s.lead_name, s.lead_email, s.visitor_id, s.page_url].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return matchAgent && matchSearch;
  });

  const selectedSession = sessions.find(s => s.id === selected);

  const exportConversation = () => {
    if (!messages.length) return;
    const text = messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `conversation-${selected?.slice(0, 8)}.txt`; a.click();
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>📜 Conversations</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>{sessions.length} session{sessions.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexShrink: 0, flexWrap: 'wrap' }}>
        <input className="input" placeholder="🔍 Rechercher par nom, email, URL..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '280px' }} />
        <select className="input" value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="all">Tous les agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Sessions list */}
        <div style={{ width: '380px', flexShrink: 0, overflowY: 'auto' }}>
          <div className="card" style={{ height: '100%', overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#505050' }}>Chargement...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#505050' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
                <div style={{ fontSize: '14px' }}>Aucune conversation</div>
              </div>
            ) : filtered.map(s => (
              <div key={s.id} onClick={() => loadMessages(s.id)} style={{
                padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                borderBottom: '1px solid var(--border)',
                background: selected === s.id ? 'rgba(192,192,192,0.06)' : 'transparent',
                borderLeft: selected === s.id ? '3px solid #C0C0C0' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    background: s.is_lead ? 'rgba(34,197,94,0.15)' : 'rgba(192,192,192,0.08)',
                    border: `1px solid ${s.is_lead ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                  }}>{s.is_lead ? '🎯' : '👤'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.lead_name || s.visitor_id?.slice(0, 12) || 'Visiteur anonyme'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#606060' }}>
                      {(s as { agents?: { name: string } }).agents?.name || 'Agent'} · {s.message_count || 0} msg
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', color: '#505050' }}>
                      {new Date(s.last_message_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '10px', color: '#404040' }}>
                      {new Date(s.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                {s.lead_email && <div style={{ fontSize: '11px', color: '#888', marginLeft: '44px' }}>✉ {s.lead_email}</div>}
                {s.page_url && <div style={{ fontSize: '10px', color: '#404040', marginLeft: '44px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🌐 {s.page_url}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#505050' }}>
                <div style={{ fontSize: '48px' }}>💬</div>
                <div style={{ fontSize: '14px' }}>Sélectionnez une conversation</div>
              </div>
            ) : (
              <>
                {/* Transcript header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>
                      {selectedSession?.lead_name || selectedSession?.visitor_id?.slice(0, 12) || 'Visiteur'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#606060', display: 'flex', gap: '12px', marginTop: '3px' }}>
                      {selectedSession?.lead_email && <span>✉ {selectedSession.lead_email}</span>}
                      {selectedSession?.lead_phone && <span>📞 {selectedSession.lead_phone}</span>}
                      <span>📄 {selectedSession?.message_count || 0} messages</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={exportConversation} className="btn-secondary" style={{ fontSize: '12px' }}>📥 Exporter</button>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: m.role === 'user' ? 'rgba(192,192,192,0.08)' : 'linear-gradient(135deg, #0A0A0A, #2a2a2a)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                      }}>{m.role === 'user' ? '👤' : '🤖'}</div>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          padding: '10px 14px', borderRadius: '14px', fontSize: '13.5px', lineHeight: 1.6,
                          background: m.role === 'user' ? 'rgba(192,192,192,0.06)' : 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          color: '#E0E0E0',
                          borderBottomRightRadius: m.role === 'user' ? '4px' : '14px',
                          borderBottomLeftRadius: m.role === 'user' ? '14px' : '4px',
                        }}>{m.content}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '10px', color: '#404040', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <span>{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {m.tokens_used && <span>🔢 {m.tokens_used}</span>}
                          {m.latency_ms && <span>⚡ {m.latency_ms}ms</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
