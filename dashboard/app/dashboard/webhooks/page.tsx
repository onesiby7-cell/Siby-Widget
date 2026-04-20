'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface WebhookLog {
  id: string; agent_id: string; event: string;
  payload: Record<string, unknown>; response_status: number;
  success: boolean; created_at: string;
  agents?: { name: string };
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WebhookLog | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const agentIds = (await supabase.from('agents').select('id').eq('user_id', masterId)).data?.map((a: { id: string }) => a.id) || [];
      if (!agentIds.length) { setLoading(false); return; }
      const { data } = await supabase.from('webhook_logs').select('*, agents(name)').in('agent_id', agentIds).order('created_at', { ascending: false }).limit(100);
      setLogs(data || []);
      setLoading(false);
    };
    load();
  }, []);


  const EVENT_COLORS: Record<string, string> = {
    'lead.captured': '#22C55E',
    'session.ended': '#C0C0C0',
    'message.received': '#3B82F6',
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>🔗 Webhooks</h1>
        <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>
          Logs des événements envoyés vers vos URLs webhook
        </p>
      </div>

      {/* Info card */}
      <div style={{
        padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
        background: 'rgba(192,192,192,0.04)', border: '1px solid rgba(192,192,192,0.1)',
        display: 'flex', gap: '16px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px' }}>ℹ️</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#C0C0C0', marginBottom: '4px' }}>Comment configurer un webhook ?</div>
          <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
            Dans la configuration de votre agent → onglet "Avancé" → champ "URL Webhook". Les événements disponibles : <code style={{ color: '#C0C0C0' }}>lead.captured</code>, <code style={{ color: '#C0C0C0' }}>session.ended</code>. Chaque requête est signée avec HMAC-SHA256.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Logs list */}
        <div style={{ flex: 1 }}>
          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F0F0F0' }}>Logs récents</span>
              <span style={{ fontSize: '12px', color: '#606060' }}>{logs.length} entrées</span>
            </div>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#505050' }}>Chargement...</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#505050' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔗</div>
                Aucun webhook envoyé. Configurez une URL dans vos agents.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="table-row"
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', padding: '12px 20px' }}
                  onClick={() => setSelected(selected?.id === log.id ? null : log)}
                >
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50', flexShrink: 0,
                    background: log.success ? '#22C55E' : '#EF4444',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: EVENT_COLORS[log.event] || '#888' }}>{log.event}</span>
                      <span style={{ fontSize: '11px', color: '#505050' }}>{log.agents?.name}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#505050' }}>
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                    background: log.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: log.success ? '#22C55E' : '#EF4444',
                    border: `1px solid ${log.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>{log.response_status || '—'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: '340px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0' }}>Détails</span>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#606060', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payload</div>
              <pre style={{
                background: '#000', padding: '12px', borderRadius: '8px', fontSize: '11px',
                color: '#C0C0C0', overflow: 'auto', maxHeight: '400px', fontFamily: 'DM Mono, monospace',
                border: '1px solid var(--border)',
              }}>{JSON.stringify(selected.payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
