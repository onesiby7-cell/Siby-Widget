'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const CHART_DATA_FALLBACK = [
  { day: 'Lun', sessions: 0, leads: 0 },
  { day: 'Mar', sessions: 0, leads: 0 },
  { day: 'Mer', sessions: 0, leads: 0 },
  { day: 'Jeu', sessions: 0, leads: 0 },
  { day: 'Ven', sessions: 0, leads: 0 },
  { day: 'Sam', sessions: 0, leads: 0 },
  { day: 'Dim', sessions: 0, leads: 0 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({ agents: 0, sessions: 0, leads: 0, messages: 0 });
  const [agents, setAgents] = useState<{ id: string; name: string; status: string; total_sessions: number; total_leads: number }[]>([]);
  const [profile, setProfile] = useState<{ full_name?: string; plan?: string; messages_used?: number; message_quota?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(CHART_DATA_FALLBACK);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      // On utilise l'ID maître ou l'utilisateur auth si dispo
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: agentsData } = await supabase.from('agents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId);

      const allAgents = agentsData || [];
      setProfile(profileData);
      setAgents(allAgents.slice(0, 5));
      setStats({
        agents: allAgents.length,
        sessions: allAgents.reduce((s, a) => s + (a.total_sessions || 0), 0),
        leads: leadsCount || 0,
        messages: allAgents.reduce((s, a) => s + (a.total_messages || 0), 0),
      });
      setLoading(false);
    };
    load();
  }, []);

  const INSIGHTS = [
    { type: 'trend', text: "Analysez vos performances en temps réel ici.", color: '#22C55E' },
    { type: 'alert', text: "Configurez vos agents pour capturer plus de leads.", color: '#EAB308' },
    { type: 'tip', text: "Partagez votre script widget pour commencer à chatter.", color: '#C0C0C0' },
  ];

  const STAT_CARDS = [
    { label: 'Agents actifs', value: stats.agents, icon: '⚡', color: '#C0C0C0', trend: 'Total' },
    { label: 'Sessions totales', value: stats.sessions, icon: '💬', color: '#C0C0C0', trend: 'Live' },
    { label: 'Leads capturés', value: stats.leads, icon: '🎯', color: '#22C55E', trend: 'CRM' },
    { label: 'Messages envoyés', value: stats.messages, icon: '📨', color: '#C0C0C0', trend: `Quota: ${profile?.message_quota || 10000}` },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{
            fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.8px', marginBottom: '6px',
          }}>
            Bonjour, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Vue d'ensemble de votre plateforme d'agents IA
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            padding: '6px 14px', borderRadius: '100px',
            background: 'rgba(192,192,192,0.08)', border: '1px solid rgba(192,192,192,0.15)',
            fontSize: '12px', fontWeight: 700, color: '#C0C0C0', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Plan {profile?.plan || 'Free'}
          </span>
          <Link href="/dashboard/agents/new" className="btn-primary" style={{ textDecoration: 'none', fontSize: '13px', padding: '8px 16px' }}>
            + Nouvel Agent
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>{s.icon}</div>
              <span style={{ fontSize: '11px', color: s.color === '#22C55E' ? '#22C55E' : '#505050', fontWeight: 600 }}>
                {s.trend}
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-1px', marginBottom: '4px' }}>
              {loading ? '—' : s.value.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#606060', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Activity chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', marginBottom: '4px' }}>
              Activité — 7 derniers jours
            </h2>
            <p style={{ fontSize: '12px', color: '#606060' }}>Sessions et leads par jour</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#404040" tick={{ fontSize: 11 }} />
              <YAxis stroke="#404040" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#C0C0C0' }}
              />
              <Area type="monotone" dataKey="sessions" stroke="#C0C0C0" strokeWidth={2} fill="url(#gSessions)" />
              <Area type="monotone" dataKey="leads" stroke="#22C55E" strokeWidth={2} fill="url(#gLeads)" />
            </AreaChart>
          </ResponsiveContainer>

        </div>

        {/* AI Insights Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#F0F0F0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🧠</span> IA Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {INSIGHTS.map((ins, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: ins.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{ins.type}</div>
                  <div style={{ fontSize: '13px', color: '#888', lineHeight: 1.5 }}>{ins.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { icon: '⚡', label: 'Nouvel Agent', href: '/dashboard/agents/new', color: '#10B981' },
              { icon: '🎯', label: 'Leads CRM', href: '/dashboard/leads', color: '#22C55E' },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                textDecoration: 'none', color: 'var(--text-primary)', fontSize: '13px',
                fontWeight: 600, transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '16px' }}>{a.icon}</span>
                <span>{a.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Agents table */}
      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0' }}>Agents récents</h2>
          <Link href="/dashboard/agents" style={{ fontSize: '12px', color: '#C0C0C0', textDecoration: 'none', fontWeight: 600 }}>
            Voir tous →
          </Link>
        </div>
        {agents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#505050', fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            Aucun agent créé.{' '}
            <Link href="/dashboard/agents/new" style={{ color: '#C0C0C0' }}>Créez votre premier agent →</Link>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
              padding: '10px 24px', fontSize: '11px', fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase',
              borderBottom: '1px solid var(--border)',
            }}>
              <span>Agent</span><span>Sessions</span><span>Leads</span><span>Status</span><span>Actions</span>
            </div>
            {agents.map(a => (
              <div key={a.id} className="table-row" style={{ gridTemplateColumns: '1fr 100px 100px 100px 120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>⚡</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                  </div>
                </div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{a.total_sessions || 0}</span>
                <span style={{ fontSize: '14px', color: '#22C55E', fontWeight: 600 }}>{a.total_leads || 0}</span>
                <span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-amber'}`}>
                  {a.status === 'active' ? '● Actif' : '○ Inactif'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Link href={`/dashboard/agents/${a.id}`} style={{ padding: '5px 10px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>Éditer</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
