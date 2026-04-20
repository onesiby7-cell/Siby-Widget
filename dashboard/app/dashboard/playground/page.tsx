'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { Agent } from '@/lib/supabase';

interface Message { role: 'user' | 'assistant'; content: string; latency?: number; tokens?: number; }

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemPromptOverride, setSystemPromptOverride] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const EDGE_URL = process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL || '';

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const { data } = await supabase.from('agents').select('*').eq('user_id', masterId).eq('status', 'active');
      setAgents(data || []);
      if (data?.[0]) { setSelectedAgent(data[0]); setSystemPromptOverride(data[0].system_prompt); }
    };
    load();
  }, []);


  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setSystemPromptOverride(agent.system_prompt);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !selectedAgent) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: userMsg,
          visitorId: 'playground_test',
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const latency = Date.now() - start;
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Erreur', latency, tokens: data.tokensUsed }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur de connexion. Vérifiez votre Edge Function URL dans .env.local' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>🧪 Playground</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>Testez vos agents en temps réel</p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="btn-secondary" style={{ fontSize: '13px' }}>
          {showConfig ? '✕ Masquer config' : '⚙️ Config avancée'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Agent selector */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#606060', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Agent</div>
          <div className="card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {agents.map(a => (
              <button key={a.id} onClick={() => selectAgent(a)} style={{
                padding: '10px 12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                background: selectedAgent?.id === a.id ? 'rgba(192,192,192,0.08)' : 'transparent',
                border: selectedAgent?.id === a.id ? '1px solid rgba(192,192,192,0.2)' : '1px solid transparent',
                color: selectedAgent?.id === a.id ? '#F0F0F0' : '#888',
                fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>{a.button_icon || '🤖'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              </button>
            ))}
            {agents.length === 0 && (
              <div style={{ padding: '12px', fontSize: '12px', color: '#505050', textAlign: 'center' }}>Aucun agent actif</div>
            )}
          </div>

          {/* Infos */}
          {selectedAgent && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#606060', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div style={{ color: '#505050', marginBottom: '2px' }}>Modèle</div>
                <div style={{ color: '#C0C0C0', fontWeight: 600 }}>{selectedAgent.model}</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div style={{ color: '#505050', marginBottom: '2px' }}>Température</div>
                <div style={{ color: '#C0C0C0', fontWeight: 600 }}>{selectedAgent.temperature}</div>
              </div>
            </div>
          )}
        </div>

        {/* Chat window */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {showConfig && (
            <div style={{ marginBottom: '12px', flexShrink: 0 }}>
              <label className="label">Prompt système (override temporaire)</label>
              <textarea className="input" value={systemPromptOverride} onChange={e => setSystemPromptOverride(e.target.value)}
                style={{ minHeight: '80px', fontSize: '12px', fontFamily: 'DM Mono, monospace' }} />
            </div>
          )}

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#505050' }}>
                  <div style={{ fontSize: '40px' }}>{selectedAgent?.button_icon || '🤖'}</div>
                  <div style={{ fontSize: '14px', textAlign: 'center' }}>
                    {selectedAgent ? `Prêt à tester "${selectedAgent.name}"` : 'Sélectionnez un agent'}
                  </div>
                  {selectedAgent?.welcome_message && (
                    <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: '13px', color: '#888', maxWidth: '300px', textAlign: 'center' }}>
                      {selectedAgent.welcome_message}
                    </div>
                  )}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'user' ? '#1A1A1A' : `linear-gradient(135deg, ${selectedAgent?.primary_color || '#0A0A0A'}, #2a2a2a)`,
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                  }}>{m.role === 'user' ? '👤' : (selectedAgent?.button_icon || '🤖')}</div>
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: '14px', fontSize: '14px', lineHeight: 1.6,
                      background: m.role === 'user' ? 'linear-gradient(135deg, #1A1A1A, #222)' : 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: '#F0F0F0',
                      borderBottomRightRadius: m.role === 'user' ? '4px' : '14px',
                      borderBottomLeftRadius: m.role === 'user' ? '14px' : '4px',
                    }}>{m.content}</div>
                    {m.role === 'assistant' && (m.latency || m.tokens) && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '11px', color: '#404040' }}>
                        {m.latency && <span>⚡ {m.latency}ms</span>}
                        {m.tokens && <span>🔢 {m.tokens} tokens</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                    {selectedAgent?.button_icon || '🤖'}
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#888', animation: `siby-typing 1.2s ease ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexShrink: 0 }}>
              <input
                className="input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={selectedAgent ? `Testez "${selectedAgent.name}"...` : 'Sélectionnez un agent...'}
                disabled={!selectedAgent || loading}
                style={{ flex: 1 }}
              />
              <button onClick={sendMessage} disabled={!selectedAgent || loading || !input.trim()} className="btn-primary" style={{ flexShrink: 0 }}>
                {loading ? '⏳' : '➤ Envoyer'}
              </button>
              <button onClick={() => setMessages([])} className="btn-secondary" style={{ flexShrink: 0, fontSize: '13px' }}>🗑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
