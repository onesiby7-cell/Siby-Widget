'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'agent' | 'lead' | 'client' | 'page';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
}

const PAGES: SearchResult[] = [
  { type: 'page', id: 'overview', title: 'Vue d\'ensemble', subtitle: 'Dashboard principal', icon: '◈', href: '/dashboard' },
  { type: 'page', id: 'agents', title: 'Mes Agents', subtitle: 'Gérer les agents IA', icon: '⚡', href: '/dashboard/agents' },
  { type: 'page', id: 'new-agent', title: 'Créer un agent', subtitle: 'Nouveau agent IA', icon: '➕', href: '/dashboard/agents/new' },
  { type: 'page', id: 'clients', title: 'Mes Clients', subtitle: 'Gestion des clients', icon: '👥', href: '/dashboard/clients' },
  { type: 'page', id: 'conversations', title: 'Conversations', subtitle: 'Historique des chats', icon: '📜', href: '/dashboard/conversations' },
  { type: 'page', id: 'leads', title: 'Leads CRM', subtitle: 'Contacts capturés', icon: '🎯', href: '/dashboard/leads' },
  { type: 'page', id: 'analytics', title: 'Analytics', subtitle: 'Statistiques et performances', icon: '📊', href: '/dashboard/analytics' },
  { type: 'page', id: 'playground', title: 'Playground', subtitle: 'Tester un agent', icon: '🧪', href: '/dashboard/playground' },
  { type: 'page', id: 'templates', title: 'Templates', subtitle: 'Prompts prédéfinis', icon: '📋', href: '/dashboard/templates' },
  { type: 'page', id: 'settings', title: 'Paramètres', subtitle: 'Compte et préférences', icon: '⚙️', href: '/dashboard/settings' },
];

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(PAGES);
      return;
    }
    const q = query.toLowerCase();
    const pageResults = PAGES.filter(p => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q));
    setResults([...pageResults, ...dbResults.filter(r => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q))]);
    setSelectedIndex(0);
  }, [query, dbResults]);

  // Load agents, leads, clients for search
  useEffect(() => {
    const loadData = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const [{ data: agents }, { data: leads }, { data: clients }] = await Promise.all([
        supabase.from('agents').select('id, name, model, button_icon').eq('user_id', masterId),
        supabase.from('leads').select('id, name, email, phone').eq('user_id', masterId).limit(50),
        supabase.from('clients').select('id, name, company, email').eq('user_id', masterId),
      ]);
      const res: SearchResult[] = [];
      (agents || []).forEach((a: { id: string; name: string; model: string; button_icon?: string }) => {
        res.push({ type: 'agent', id: a.id, title: a.name, subtitle: a.model, icon: a.button_icon || '🤖', href: `/dashboard/agents/${a.id}` });
      });
      (leads || []).forEach((l: { id: string; name?: string; email?: string; phone?: string }) => {
        res.push({ type: 'lead', id: l.id, title: l.name || l.email || 'Lead', subtitle: l.email || l.phone || '', icon: '🎯', href: '/dashboard/leads' });
      });
      (clients || []).forEach((c: { id: string; name: string; company?: string; email?: string }) => {
        res.push({ type: 'client', id: c.id, title: c.name, subtitle: c.company || c.email || '', icon: '👤', href: '/dashboard/clients' });
      });
      setDbResults(res);
    };
    if (isOpen) loadData();
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { navigate(results[selectedIndex]); }
    else if (e.key === 'Escape') { onClose(); }
  };

  const navigate = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };

  if (!isOpen) return null;

  const grouped = {
    page: results.filter(r => r.type === 'page'),
    agent: results.filter(r => r.type === 'agent'),
    client: results.filter(r => r.type === 'client'),
    lead: results.filter(r => r.type === 'lead'),
  };

  let globalIndex = -1;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '560px',
        background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Search input */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', color: '#606060' }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Rechercher agents, clients, pages..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F0F0F0', fontSize: '15px', fontFamily: 'inherit' }} />
          <kbd style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#606060' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {results.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#505050', fontSize: '14px' }}>Aucun résultat pour &quot;{query}&quot;</div>
          )}
          {Object.entries(grouped).map(([type, items]) => {
            if (items.length === 0) return null;
            const labels: Record<string, string> = { page: 'Pages', agent: 'Agents', client: 'Clients', lead: 'Leads' };
            return (
              <div key={type}>
                <div style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: 700, color: '#505050', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{labels[type]}</div>
                {items.map(r => {
                  globalIndex++;
                  const isActive = globalIndex === selectedIndex;
                  const idx = globalIndex;
                  return (
                    <div key={r.id} onClick={() => navigate(r)} onMouseEnter={() => setSelectedIndex(idx)} style={{
                      padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: isActive ? 'rgba(192,192,192,0.08)' : 'transparent',
                      transition: 'background 0.1s',
                    }}>
                      <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: isActive ? '#F0F0F0' : '#C0C0C0' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: '#505050' }}>{r.subtitle}</div>
                      </div>
                      {isActive && <span style={{ fontSize: '11px', color: '#606060' }}>↵</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '16px', fontSize: '11px', color: '#404040' }}>
          <span>↑↓ naviguer</span><span>↵ ouvrir</span><span>esc fermer</span>
        </div>
      </div>
    </div>
  );
}
