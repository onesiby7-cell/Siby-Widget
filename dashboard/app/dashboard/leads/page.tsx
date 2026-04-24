'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Lead } from '@/lib/supabase';

const STATUS_COLORS: Record<string, string> = {
  new: '#C0C0C0', contacted: '#3B82F6', qualified: '#F59E0B', converted: '#22C55E', lost: '#EF4444'
};
const STATUS_LABELS: Record<string, string> = {
  new: '● Nouveau', contacted: '📞 Contacté', qualified: '⭐ Qualifié', converted: '✅ Converti', lost: '✕ Perdu'
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<(Lead & { agents?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const { data } = await supabase
        .from('leads')
        .select('*, agents(name)')
        .eq('user_id', masterId)
        .order('created_at', { ascending: false });
      setLeads(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as Lead['status'] } : l));
  };

  const filtered = leads.filter(l => {
    const term = search.toLowerCase();
    const matchSearch = !search || [l.name, l.email, l.phone, l.company].some(v => v?.toLowerCase().includes(term));
    const matchFilter = filter === 'all' || l.status === filter;
    return matchSearch && matchFilter;
  });

  const exportCSV = () => {
    const rows = [['Nom', 'Email', 'Téléphone', 'Entreprise', 'Statut', 'Agent', 'Date']];
    filtered.forEach(l => rows.push([l.name || '', l.email || '', l.phone || '', l.company || '', l.status, (l as { agents?: { name?: string } }).agents?.name || '', new Date(l.created_at).toLocaleDateString('fr-FR')]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'leads-siby-widget.csv'; a.click();
  };

  return (
    <div className="space-y-10">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            Intelligence <span className="text-gradient">CRM</span>
          </h1>
          <p className="text-dim text-sm font-medium">Flux de prospects capturés en temps réel.</p>
        </div>
        <button onClick={exportCSV} className="btn-platinum shadow-xl shadow-white/10">
          📥 Exporter (.CSV)
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(STATUS_LABELS).map(([k, v]) => {
          const count = leads.filter(l => l.status === k).length;
          const isActive = filter === k;
          return (
            <div 
              key={k} 
              onClick={() => setFilter(isActive ? 'all' : k)} 
              className={`workspace-card !p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-accent bg-accent/5' : 'hover:bg-white/5'}`}
            >
              <div className="text-2xl font-black text-white mb-1">{count}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-ghost">{v}</div>
            </div>
          );
        })}
      </div>

      {/* Main Table Area */}
      <div className="workspace-card !p-0 border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-6 justify-between items-center">
            <div className="relative w-full max-w-md">
               <input 
                 className="input-lux !pl-12 !py-2" 
                 placeholder="Rechercher un prospect..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ghost text-sm">🔍</span>
            </div>
            <div className="badge-lux text-[9px]">{filtered.length} Résultats</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black text-ghost uppercase tracking-widest">
                <th className="px-8 py-5">Prospect</th>
                <th className="px-8 py-5">Coordonnées</th>
                <th className="px-8 py-5">Source Agent</th>
                <th className="px-8 py-5">Statut de conversion</th>
                <th className="px-8 py-5 text-right">Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-ghost font-bold text-xs">Synchronisation...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-ghost font-bold text-xs italic">Aucune donnée correspondante.</td></tr>
              ) : filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center font-bold text-sm text-white shadow-lg">
                        {(lead.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{lead.name || 'Anonyme'}</div>
                        <div className="text-[10px] text-ghost font-bold uppercase">{lead.company || 'Direct'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-dim">{lead.email || '—'}</div>
                      <div className="text-[10px] font-bold text-ghost">{lead.phone || '—'}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                       <span className="text-[11px] font-bold text-dim uppercase tracking-wider">{(lead as any).agents?.name || 'Inconnu'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-main outline-none focus:border-accent transition-colors"
                      style={{ color: STATUS_COLORS[lead.status] }}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-base">{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="text-xs font-bold text-ghost">
                      {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
