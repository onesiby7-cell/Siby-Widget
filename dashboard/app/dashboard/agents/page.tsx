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
    alert('Code d\'intégration copié ! ✅');
  };

  return (
    <div className="space-y-10">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            Flotte d'<span className="text-gradient">Agents</span>
          </h1>
          <p className="text-dim text-sm font-medium">Gérez vos intelligences artificielles déployées.</p>
        </div>
        <Link href="/dashboard/agents/new" className="btn-platinum shadow-xl shadow-white/10">
          + Nouveau Déploiement
        </Link>
      </div>

      {/* Control Bar */}
      <div className="workspace-card flex flex-col md:flex-row gap-6 items-center bg-white/[0.02]">
        <div className="relative flex-1 w-full">
           <input 
             className="input-lux !pl-12" 
             placeholder="Filtrer par nom ou ID..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ghost">🔍</span>
        </div>
        <div className="flex gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
           {(['all', 'active', 'inactive', 'draft'] as const).map(f => (
             <button 
               key={f} 
               onClick={() => setFilter(f)} 
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white/10 text-white shadow-lg' : 'text-ghost hover:text-dim'}`}
             >
               {f.toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="workspace-card h-64 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="workspace-card py-24 text-center space-y-6">
          <div className="text-6xl opacity-20">🛡️</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Zone de déploiement vide</h2>
            <p className="text-dim text-sm">Initialisez votre premier agent pour commencer la capture.</p>
          </div>
          {!search && <Link href="/dashboard/agents/new" className="btn-platinum">Initialiser →</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(agent => (
            <div key={agent.id} className="workspace-card group flex flex-col h-full">
              {/* Agent Head */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-transform duration-500">
                  {agent.button_icon || '🤖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white truncate">{agent.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${agent.status === 'active' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-ghost border border-white/10'}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-ghost font-bold uppercase tracking-widest">{agent.model}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { l: 'SESSIONS', v: agent.total_sessions || 0 },
                  { l: 'MESSAGES', v: agent.total_messages || 0 },
                  { l: 'LEADS', v: agent.total_leads || 0, c: 'text-accent' },
                ].map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 text-center">
                    <div className={`text-lg font-black tracking-tighter ${s.c || 'text-white'}`}>{s.v}</div>
                    <div className="text-[8px] font-black text-ghost">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Actions Deck */}
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                <button onClick={() => copyScript(agent.id)} className="btn-ghost !text-xs !py-2 hover:!bg-white/5 transition-all">
                  📋 CODE
                </button>
                <Link href={`/dashboard/agents/${agent.id}`} className="btn-platinum !text-xs !py-2 !px-4 text-center justify-center">
                  ÉDITER
                </Link>
                <div className="col-span-2 flex gap-2">
                   <button onClick={() => cloneAgent(agent)} className="flex-1 btn-ghost !py-2 !px-0 hover:!text-blue-400">🔄</button>
                   <button onClick={() => toggleStatus(agent.id, agent.status)} className="flex-1 btn-ghost !py-2 !px-0 hover:!text-yellow-400">{agent.status === 'active' ? '⏸' : '▶'}</button>
                   <button onClick={() => deleteAgent(agent.id)} className="flex-1 btn-ghost !py-2 !px-0 hover:!text-red-500">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
