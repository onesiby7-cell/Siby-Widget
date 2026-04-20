'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const TT_STYLE = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' };
const LBL_STYLE = { color: '#C0C0C0' };

interface AgentStat { id: string; name: string; button_icon: string; total_sessions: number; total_messages: number; total_leads: number; status: string }

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d');
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [totals, setTotals] = useState({ sessions: 0, messages: 0, leads: 0, agents: 0, leadsNew: 0, leadsConverted: 0, leadsLost: 0, leadsQualified: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const supabase = createClient();

  useEffect(() => { load(); }, [range]);

  const load = async () => {
    setLoading(true);
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';

    const { data: agentsData } = await supabase.from('agents').select('id, name, button_icon, total_sessions, total_messages, total_leads, status').eq('user_id', masterId);
    const agts = (agentsData || []) as AgentStat[];
    setAgents(agts);

    const totalSessions = agts.reduce((s, a) => s + (a.total_sessions || 0), 0);
    const totalMessages = agts.reduce((s, a) => s + (a.total_messages || 0), 0);
    const totalLeads = agts.reduce((s, a) => s + (a.total_leads || 0), 0);

    // Leads breakdown
    const { count: leadsNew } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', masterId).eq('status', 'new');
    const { count: leadsConverted } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', masterId).eq('status', 'converted');
    const { count: leadsLost } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', masterId).eq('status', 'lost');
    const { count: leadsQualified } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', masterId).eq('status', 'qualified');

    setTotals({
      sessions: totalSessions, messages: totalMessages, leads: totalLeads, agents: agts.length,
      leadsNew: leadsNew || 0, leadsConverted: leadsConverted || 0, leadsLost: leadsLost || 0, leadsQualified: leadsQualified || 0,
    });
    setLoading(false);
  };


  const KPIS = [
    { label: 'Agents', value: totals.agents, icon: '⚡', color: '#C0C0C0' },
    { label: 'Sessions', value: totals.sessions, icon: '💬', color: '#C0C0C0' },
    { label: 'Messages', value: totals.messages, icon: '📨', color: '#C0C0C0' },
    { label: 'Leads', value: totals.leads, icon: '🎯', color: '#22C55E' },
    { label: 'Taux conversion', value: totals.leads > 0 ? `${Math.round((totals.leadsConverted / totals.leads) * 100)}%` : '0%', icon: '📈', color: '#22C55E' },
    { label: 'Agents actifs', value: agents.filter(a => a.status === 'active').length, icon: '🟢', color: '#22C55E' },
  ];

  const PIE_DATA = [
    { name: 'Convertis', value: totals.leadsConverted || 0, color: '#22C55E' },
    { name: 'Qualifiés', value: totals.leadsQualified || 0, color: '#F59E0B' },
    { name: 'Nouveaux', value: totals.leadsNew || 0, color: '#C0C0C0' },
    { name: 'Perdus', value: totals.leadsLost || 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  // Agent comparison chart data
  const AGENT_DATA = agents.map(a => ({
    name: a.name.length > 12 ? a.name.slice(0, 12) + '…' : a.name,
    sessions: a.total_sessions || 0,
    messages: a.total_messages || 0,
    leads: a.total_leads || 0,
  }));

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>📊 Analytics</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>Performance de vos agents IA — données en temps réel</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['24h', '7d', '30d', '90d'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              background: range === r ? 'rgba(192,192,192,0.1)' : 'transparent',
              border: range === r ? '1px solid rgba(192,192,192,0.3)' : '1px solid var(--border)',
              color: range === r ? '#C0C0C0' : '#606060',
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {KPIS.map(k => (
          <div key={k.label} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>{k.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: k.color, letterSpacing: '-0.5px' }}>
              {loading ? '—' : typeof k.value === 'number' ? k.value.toLocaleString() : k.value}
            </div>
            <div style={{ fontSize: '11px', color: '#505050', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Agent comparison bar chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', marginBottom: '20px' }}>Comparaison par Agent</h3>
          {AGENT_DATA.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#505050', fontSize: '14px' }}>
              Aucun agent configuré
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={AGENT_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#404040" tick={{ fontSize: 11 }} />
                <YAxis stroke="#404040" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TT_STYLE} labelStyle={LBL_STYLE} />
                <Bar dataKey="sessions" fill="#C0C0C0" radius={[4, 4, 0, 0]} opacity={0.8} name="Sessions" />
                <Bar dataKey="leads" fill="#22C55E" radius={[4, 4, 0, 0]} opacity={0.9} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lead status pie chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', marginBottom: '20px' }}>Statut des leads</h3>
          {PIE_DATA.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#505050', fontSize: '14px' }}>
              Aucun lead
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Agent detail table */}
      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>Performance par agent</h2>
          <select className="input" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} style={{ maxWidth: '200px', padding: '6px 10px', fontSize: '12px' }}>
            <option value="all">Tous les agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 100px 100px',
          padding: '10px 24px', fontSize: '11px', fontWeight: 700,
          color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
        }}>
          <span>Agent</span><span>Sessions</span><span>Messages</span><span>Leads</span><span>Msg/Session</span><span>Status</span>
        </div>
        {(selectedAgent === 'all' ? agents : agents.filter(a => a.id === selectedAgent)).map(a => (
          <div key={a.id} className="table-row" style={{ gridTemplateColumns: '1fr 100px 100px 100px 100px 100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{a.button_icon || '🤖'}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0' }}>{a.name}</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#C0C0C0' }}>{(a.total_sessions || 0).toLocaleString()}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#C0C0C0' }}>{(a.total_messages || 0).toLocaleString()}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>{(a.total_leads || 0).toLocaleString()}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#888' }}>
              {a.total_sessions > 0 ? (a.total_messages / a.total_sessions).toFixed(1) : '0'}
            </span>
            <span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-amber'}`}>{a.status}</span>
          </div>
        ))}
        {agents.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#505050', fontSize: '14px' }}>
            Aucun agent. Créez votre premier agent pour voir les statistiques.
          </div>
        )}
      </div>
    </div>
  );
}
