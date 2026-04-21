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
        width: '100%', maxWidth: '600px',
        background: 'rgba(15, 15, 15, 0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 30px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
      }}>
        {/* Search input */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '22px', filter: 'grayscale(1)', opacity: 0.5 }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Que cherchez-vous ?"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F0F0F0', fontSize: '17px', fontWeight: 500, fontFamily: 'inherit', letterSpacing: '-0.3px' }} />
          <kbd style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#606060' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px' }}>
          {results.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#505050', fontSize: '14px' }}>
               <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>🌘</div>
               Aucun résultat trouvé.
            </div>
          )}
          {Object.entries(grouped).map(([type, items]) => {
            if (items.length === 0) return null;
            const labels: Record<string, string> = { page: 'Système', agent: 'IA Agents', client: 'Clients CRM', lead: 'Opportunités / Leads' };
            return (
              <div key={type} style={{ marginBottom: '12px' }}>
                <div style={{ padding: '8px 16px 6px', fontSize: '10px', fontWeight: 900, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{labels[type]}</div>
                {items.map(r => {
                  globalIndex++;
                  const isActive = globalIndex === selectedIndex;
                  const idx = globalIndex;
                  return (
                    <div key={r.id} onClick={() => navigate(r)} onMouseEnter={() => setSelectedIndex(idx)} style={{
                      padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isActive ? 'scale(1.01)' : 'scale(1)',
                    }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        {r.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14.5px', fontWeight: isActive ? 700 : 600, color: isActive ? '#FFF' : '#A0A0A0' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: '#555', marginTop: '1px' }}>{r.subtitle}</div>
                      </div>
                      {isActive && <div style={{ fontSize: '13px', color: '#444', fontWeight: 800 }}>ENTRER ↵</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span><b style={{ color: '#666' }}>↑↓</b> Naviguer</span>
            <span><b style={{ color: '#666' }}>↵</b> Sélectionner</span>
          </div>
          <div>Siby Search v2.0</div>
        </div>
      </div>
    </div>
  );
}
