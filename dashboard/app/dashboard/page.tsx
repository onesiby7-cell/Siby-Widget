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
  const [stats, setStats] = useState({ agents: 0, sessions: 0, leads: 0, messages: 0, revenue: 0 });
  const [agents, setAgents] = useState<{ id: string; name: string; status: string; total_sessions: number; total_leads: number }[]>([]);
  const [profile, setProfile] = useState<{ full_name?: string; plan?: string; messages_used?: number; message_quota?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(CHART_DATA_FALLBACK);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || '00000000-0000-0000-0000-000000000000';

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const { data: agentsData } = await supabase.from('agents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', userId);
        const { data: paymentsData } = await supabase.from('payments').select('amount').eq('user_id', userId);

        const allAgents = agentsData || [];
        setProfile(profileData);
        setAgents(allAgents.slice(0, 5));
        setStats({
          agents: allAgents.length,
          sessions: allAgents.reduce((s, a) => s + (a.total_sessions || 0), 0),
          leads: leadsCount || 0,
          messages: allAgents.reduce((s, a) => s + (a.total_messages || 0), 0),
          revenue: (paymentsData || []).reduce((acc, p) => acc + Number(p.amount), 0),
        });
        setLoading(false);
      } catch (err) {
        console.error("Erreur Dashboard:", err);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Revenus Empire', value: `$${stats.revenue}`, icon: '💰', color: '#10B981' },
    { label: 'Capture Leads', value: stats.leads, icon: '🎯', color: '#10B981' },
    { label: 'Agents IA', value: stats.agents, icon: '🛡️', color: '#FFF' },
    { label: 'Messages IA', value: stats.messages, icon: '🧠', color: '#FFF' },
  ];

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            Espace <span className="text-gradient">Premium</span>
          </h1>
          <p className="text-dim text-sm font-medium">Contrôle total de votre infrastructure IA.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="badge-lux">Protocol active</div>
           <Link href="/dashboard/agents/new" className="btn-platinum shadow-xl shadow-white/10">
             + Créer un Agent
           </Link>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="workspace-card group">
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                {s.icon}
              </div>
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black text-white tracking-tighter">
                {loading ? '...' : s.value}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Graph */}
        <div className="lg:col-span-2 workspace-card overflow-visible">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold">Activité Réseau</h2>
              <p className="text-xs text-ghost">Flux de sessions sur les 7 derniers jours</p>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-accent" />
               <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0D0D0D', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#E2E2E2' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#10B981" 
                  strokeWidth={4} 
                  fill="url(#gLeads)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI System Status */}
        <div className="space-y-6">
          <div className="workspace-card bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-xl text-black font-bold shadow-lg shadow-accent/20">🧠</div>
              <h2 className="text-lg font-bold text-white">IA Core Status</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-black text-accent uppercase mb-1">Système</div>
                <div className="text-xs text-dim leading-relaxed font-medium">Moteur Platinum v6.2 opérationnel. Latence moyenne : 1.2s.</div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[10px] font-black text-blue-400 uppercase mb-1">Optimisation</div>
                <div className="text-xs text-dim leading-relaxed font-medium">La base de données a été simplifiée pour une fluidité maximale.</div>
              </div>
            </div>
          </div>

          <Link href="/dashboard/leads" className="workspace-card flex items-center justify-between hover:bg-white/5">
             <div className="flex items-center gap-4">
               <span className="text-2xl">🎯</span>
               <span className="font-bold">Accès CRM</span>
             </div>
             <span className="text-ghost">→</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="workspace-card !p-0 overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="font-bold">Agents récents</h3>
          <Link href="/dashboard/agents" className="text-xs font-bold text-ghost hover:text-white transition-colors">Explorer tout →</Link>
        </div>
        
        {agents.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="text-4xl opacity-20">⚡</div>
            <div className="text-ghost text-sm font-medium">Aucun agent configuré pour le moment.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-ghost uppercase tracking-widest">
                  <th className="px-8 py-5">Agent</th>
                  <th className="px-8 py-5">Performance</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Contrôle</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-bold group-hover:border-accent transition-colors">A</div>
                        <div>
                          <div className="font-bold text-sm">{a.name}</div>
                          <div className="text-[10px] text-ghost font-bold uppercase">ID: {a.id.slice(0,8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent">{a.total_sessions || 0}</span>
                        <span className="text-xs text-ghost">sessions</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${a.status === 'active' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-ghost/10 text-ghost border border-white/10'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/dashboard/agents/${a.id}`} className="btn-ghost !py-2 !px-4 !text-xs">Configurer</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
