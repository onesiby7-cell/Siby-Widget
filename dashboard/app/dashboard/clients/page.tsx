'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Client, Agent } from '@/lib/supabase';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '● Actif', color: '#22C55E' },
  paused: { label: '⏸ En pause', color: '#F59E0B' },
  cancelled: { label: '✕ Résilié', color: '#EF4444' },
  prospect: { label: '◎ Prospect', color: '#3B82F6' },
};

export default function ClientsPage() {
  const [clients, setClients] = useState<(Client & { agents?: Agent[] })[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', website: '', notes: '', status: 'active' as string, tags: '' });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    const [{ data: clientsData }, { data: agentsData }] = await Promise.all([
      supabase.from('clients').select('*').eq('user_id', masterId).order('created_at', { ascending: false }),
      supabase.from('agents').select('*').eq('user_id', masterId),
    ]);
    setClients(clientsData || []);
    setAgents(agentsData || []);
    setLoading(false);
  };

  const saveClient = async () => {
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    if (!form.name.trim()) return;
    const payload = {
      user_id: masterId, name: form.name, email: form.email || null, phone: form.phone || null,
      company: form.company || null, website: form.website || null, notes: form.notes || null,
      status: form.status, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (editing) {
      await supabase.from('clients').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('clients').insert(payload);
    }
    setShowForm(false); setEditing(null);
    setForm({ name: '', email: '', phone: '', company: '', website: '', notes: '', status: 'active', tags: '' });
    load();
  };


  const deleteClient = async (id: string) => {
    if (!confirm('Supprimer ce client ? Les agents associés ne seront pas supprimés.')) return;
    await supabase.from('clients').delete().eq('id', id);
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedClient === id) setSelectedClient(null);
  };

  const editClient = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', website: c.website || '', notes: c.notes || '', status: c.status, tags: (c.tags || []).join(', ') });
    setShowForm(true);
  };

  const assignAgent = async (agentId: string, clientId: string) => {
    await supabase.from('agents').update({ client_id: clientId }).eq('id', agentId);
    load();
  };

  const unassignAgent = async (agentId: string) => {
    await supabase.from('agents').update({ client_id: null }).eq('id', agentId);
    load();
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search || [c.name, c.email, c.company, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const getClientAgents = (clientId: string) => agents.filter(a => a.client_id === clientId);
  const unassignedAgents = agents.filter(a => !a.client_id);
  const selectedClientData = clients.find(c => c.id === selectedClient);

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>👥 Mes Clients</h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>{clients.length} client{clients.length > 1 ? 's' : ''} · {agents.length} agent{agents.length > 1 ? 's' : ''} configuré{agents.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', email: '', phone: '', company: '', website: '', notes: '', status: 'prospect', tags: '' }); }} className="btn-primary" style={{ fontSize: '13px' }}>
          + Nouveau client
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {Object.entries(STATUS_MAP).map(([k, v]) => {
          const count = clients.filter(c => c.status === k).length;
          return (
            <div key={k} onClick={() => setFilter(filter === k ? 'all' : k)} style={{
              padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
              background: filter === k ? 'rgba(255,255,255,0.06)' : 'var(--bg-surface)',
              border: `1px solid ${filter === k ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: v.color }}>{count}</div>
              <div style={{ fontSize: '11px', color: '#606060', whiteSpace: 'nowrap' }}>{v.label}</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input className="input" placeholder="🔍 Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '320px' }} />
      </div>

      {/* Create/Edit form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '520px', background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F0', marginBottom: '24px' }}>
              {editing ? `Modifier : ${editing.name}` : '➕ Nouveau client'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label className="label">Nom *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Mon Client" /></div>
                <div><label className="label">Entreprise</label><input className="input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="client@email.com" /></div>
                <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+33 6 12 34 56 78" /></div>
              </div>
              <div><label className="label">Site web</label><input className="input" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://monsite.com" /></div>
              <div><label className="label">Notes internes</label><textarea className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes privées sur ce client..." style={{ minHeight: '80px' }} /></div>
              <div><label className="label">Tags (séparés par virgule)</label><input className="input" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="premium, e-commerce, v2" /></div>
              <div>
                <label className="label">Statut</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(p => ({ ...p, status: k }))} style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      background: form.status === k ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: form.status === k ? `1px solid ${v.color}40` : '1px solid var(--border)',
                      color: form.status === k ? v.color : '#606060',
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
              <button onClick={saveClient} className="btn-primary">{editing ? '💾 Sauvegarder' : '⚡ Créer le client'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Client list */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '16px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
              <h3 style={{ color: '#F0F0F0', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Aucun client</h3>
              <p style={{ color: '#606060', fontSize: '13px' }}>Ajoutez votre premier client pour lui associer des agents IA.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {filtered.map(client => {
                const clientAgents = getClientAgents(client.id);
                const isSelected = selectedClient === client.id;
                return (
                  <div key={client.id} className="card" onClick={() => setSelectedClient(isSelected ? null : client.id)} style={{
                    padding: '18px', cursor: 'pointer',
                    border: isSelected ? '1px solid rgba(192,192,192,0.3)' : undefined,
                    boxShadow: isSelected ? '0 0 0 1px rgba(192,192,192,0.1)' : undefined,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                        background: `hsl(${(client.name.charCodeAt(0) * 17) % 360}, 25%, 18%)`,
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: 800, color: '#C0C0C0',
                      }}>{client.name[0].toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</h3>
                          <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: STATUS_MAP[client.status]?.color, background: `${STATUS_MAP[client.status]?.color}15`, border: `1px solid ${STATUS_MAP[client.status]?.color}25`, whiteSpace: 'nowrap' }}>
                            {STATUS_MAP[client.status]?.label}
                          </span>
                        </div>
                        {client.company && <div style={{ fontSize: '12px', color: '#606060' }}>{client.company}</div>}
                      </div>
                    </div>

                    {/* Contact infos */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', fontSize: '12px', color: '#888' }}>
                      {client.email && <span>✉ {client.email}</span>}
                      {client.phone && <span>📞 {client.phone}</span>}
                      {client.website && <span>🌐 {client.website}</span>}
                    </div>

                    {/* Agents */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {clientAgents.length === 0 ? (
                        <span style={{ fontSize: '11px', color: '#505050' }}>Aucun agent associé</span>
                      ) : clientAgents.map(a => (
                        <span key={a.id} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(192,192,192,0.06)', border: '1px solid var(--border)', color: '#C0C0C0' }}>
                          {a.button_icon || '🤖'} {a.name}
                        </span>
                      ))}
                    </div>

                    {/* Tags */}
                    {client.tags && client.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {client.tags.map(tag => (
                          <span key={tag} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>#{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={e => { e.stopPropagation(); editClient(client); }} style={{ flex: 1, padding: '7px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>✏️ Modifier</button>
                      <button onClick={e => { e.stopPropagation(); deleteClient(client.id); }} style={{ padding: '7px 10px', borderRadius: '8px', fontSize: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedClient && selectedClientData && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <div className="card" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F0', marginBottom: '16px' }}>Agents associés</h3>
              {getClientAgents(selectedClient).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: '6px' }}>
                  <span>{a.button_icon || '🤖'}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#F0F0F0', fontWeight: 500 }}>{a.name}</span>
                  <span className={`badge ${a.status === 'active' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '10px' }}>{a.status}</span>
                  <button onClick={() => unassignAgent(a.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
              ))}
              {unassignedAgents.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#505050', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '16px 0 8px' }}>Assigner un agent</div>
                  {unassignedAgents.map(a => (
                    <button key={a.id} onClick={() => assignAgent(a.id, selectedClient)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      borderRadius: '8px', background: 'transparent', border: '1px dashed var(--border)',
                      color: '#888', cursor: 'pointer', marginBottom: '4px', fontSize: '13px', textAlign: 'left',
                    }}>
                      <span>{a.button_icon || '🤖'}</span> <span>{a.name}</span> <span style={{ marginLeft: 'auto', color: '#22C55E' }}>+</span>
                    </button>
                  ))}
                </>
              )}

              {selectedClientData.notes && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#505050', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</div>
                  <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>{selectedClientData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
