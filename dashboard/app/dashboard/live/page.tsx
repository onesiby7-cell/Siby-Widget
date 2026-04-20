'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Eye, MessageCircle, Clock, Trash2, ArrowRight } from 'lucide-react';

interface ActiveSession {
  id: string;
  agent_id: string;
  visitor_id: string;
  last_message: string;
  updated_at: string;
  agents: { name: string; button_icon: string };
  messages_count?: number;
}

export default function LiveMonitorPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // ── Load active sessions ──────────────────────────
  useEffect(() => {
    const loadSessions = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      
      // 1. Get agent IDs for this master user
      const { data: agentsData } = await supabase.from('agents').select('id').eq('user_id', masterId);
      const agentIds = (agentsData || []).map(a => a.id);
      
      if (agentIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // 2. Load sessions only for those agents
      const { data } = await supabase
        .from('sessions')
        .select('*, agents(name, button_icon)')
        .in('agent_id', agentIds)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      setSessions(data || []);
      setLoading(false);
    };

    loadSessions();

    // Realtime subscription
    const channel = supabase.channel('live-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadSessions();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (selectedSession && payload.new.session_id === selectedSession) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedSession]);


  // ── Load messages for specific session ─────────────
  useEffect(() => {
    if (!selectedSession) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', selectedSession)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    loadMessages();
  }, [selectedSession]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* Sidebar: Active Sessions */}
      <div style={{
        width: '350px', borderRight: '1px solid var(--border)',
        background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Live Monitoring
          </h1>
          <p style={{ fontSize: '12px', color: '#606060', marginTop: '4px' }}>Surveillance des IA en temps réel</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading ? <div style={{ textAlign: 'center', padding: '20px', color: '#606060' }}>Chargement...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#444', fontSize: '13px' }}>Aucune session active</div>}
              {sessions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedSession(s.id)}
                  style={{
                    padding: '16px', borderRadius: '14px', cursor: 'pointer',
                    background: selectedSession === s.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedSession === s.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                  className="hover-bg"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                    }}>{s.agents?.button_icon || '🤖'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.agents?.name || 'Agent'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#505050' }}>ID: {s.visitor_id.slice(0, 8)}...</div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#444' }}>
                      {new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '12px', color: '#888', fontStyle: 'italic', 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {s.last_message || "En attente d'interaction..."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail: Conversation View */}
      <div style={{ flex: 1, background: '#050505', display: 'flex', flexDirection: 'column' }}>
        {selectedSession ? (
          <>
            <div style={{ 
              padding: '20px 32px', borderBottom: '1px solid var(--border)', 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F0F0F0' }}>Session {selectedSession.slice(0, 8)}</div>
                <div style={{ fontSize: '12px', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }}></span>
                  En direct
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" style={{ fontSize: '12px', opacity: 0.5, cursor: 'not-allowed' }} title="Fonctionnalité en cours de développement">Prendre le contrôle (Bientôt)</button>
                <button onClick={async () => {
                  if(confirm('Fermer cette session ?')) {
                    await supabase.from('sessions').delete().eq('id', selectedSession);
                    setSelectedSession(null);
                  }
                }} className="btn-secondary" style={{ fontSize: '12px', color: '#EF4444' }}>Fermer session</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeInUp 0.3s ease'
                }}>
                  <div style={{
                    maxWidth: '70%', padding: '14px 18px', borderRadius: '18px',
                    background: m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                    border: '1px solid',
                    borderColor: m.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(34,197,94,0.2)',
                    color: '#F0F0F0', fontSize: '14px', lineHeight: 1.6
                  }}>
                    {m.content}
                    <div style={{ 
                      fontSize: '10px', color: '#444', marginTop: '6px',
                      textAlign: m.role === 'user' ? 'right' : 'left'
                    }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', items: 'center', justifyContent: 'center', color: '#444' }}>
            <Eye size={64} style={{ marginBottom: '20px', opacity: 0.1 }} />
            <p style={{ fontSize: '15px' }}>Sélectionnez une session pour voir le live</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .hover-bg:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>
    </div>
  );
}
