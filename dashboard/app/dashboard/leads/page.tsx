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
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>Leads CRM</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>{leads.length} lead{leads.length > 1 ? 's' : ''} capturé{leads.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary" style={{ fontSize: '13px' }}>
          📥 Exporter CSV
        </button>
      </div>

      {/* Kanban stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
        {Object.entries(STATUS_LABELS).map(([k, v]) => {
          const count = leads.filter(l => l.status === k).length;
          return (
            <div key={k} onClick={() => setFilter(filter === k ? 'all' : k)} style={{
              padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
              background: filter === k ? 'rgba(255,255,255,0.06)' : 'var(--bg-surface)',
              border: `1px solid ${filter === k ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: STATUS_COLORS[k] }}>{count}</div>
              <div style={{ fontSize: '11px', color: '#606060', marginTop: '2px', whiteSpace: 'nowrap' }}>{v}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input className="input" placeholder="🔍 Rechercher par nom, email, téléphone..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '360px' }} />
      </div>

      {/* Table */}
      <div className="card">
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 180px 140px 100px 130px 80px',
          padding: '10px 20px', fontSize: '11px', fontWeight: 700,
          color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase',
          borderBottom: '1px solid var(--border)',
        }}>
          <span>Contact</span><span>Email</span><span>Téléphone</span><span>Agent</span><span>Statut</span><span>Date</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#505050' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#505050' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <div style={{ fontSize: '14px' }}>
              {search || filter !== 'all' ? 'Aucun résultat.' : 'Aucun lead pour l\'instant. Les leads apparaissent automatiquement quand un visiteur partage ses coordonnées.'}
            </div>
          </div>
        ) : filtered.map(lead => (
          <div key={lead.id} className="table-row"
            style={{
              gridTemplateColumns: '1fr 180px 140px 100px 130px 80px',
              cursor: 'pointer',
              background: selected === lead.id ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}
            onClick={() => setSelected(selected === lead.id ? null : lead.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: `hsl(${(lead.name?.charCodeAt(0) || 65) * 5 % 360}, 30%, 20%)`,
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: '#C0C0C0',
              }}>{(lead.name || '?')[0].toUpperCase()}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F0' }}>{lead.name || 'Inconnu'}</div>
                {lead.company && <div style={{ fontSize: '11px', color: '#606060' }}>{lead.company}</div>}
              </div>
            </div>
            <span style={{ fontSize: '13px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email || '—'}</span>
            <span style={{ fontSize: '13px', color: '#888' }}>{lead.phone || '—'}</span>
            <span style={{ fontSize: '12px', color: '#606060' }}>{(lead as { agents?: { name?: string } }).agents?.name || '—'}</span>
            <div>
              <select
                value={lead.status}
                onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                style={{
                  background: 'transparent', border: 'none', color: STATUS_COLORS[lead.status],
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', outline: 'none',
                }}
                onClick={e => e.stopPropagation()}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: '#1A1A1A' }}>{v}</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: '12px', color: '#505050' }}>
              {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
