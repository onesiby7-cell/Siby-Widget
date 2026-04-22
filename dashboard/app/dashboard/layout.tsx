'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import SearchModal from './SearchModal';

const NAV = [
  { href: '/dashboard', icon: '◈', label: 'Vue d\'ensemble' },
  { href: '/dashboard/agents', icon: '⚡', label: 'Mes Agents' },
  { href: '/dashboard/live', icon: '👁', label: 'Live Monitor' },
  { href: '/dashboard/clients', icon: '👥', label: 'Mes Clients' },
  { href: '/dashboard/conversations', icon: '📜', label: 'Conversations' },
  { href: '/dashboard/leads', icon: '🎯', label: 'Leads CRM' },
  { href: '/dashboard/finances', icon: '💰', label: 'Finances' },
  { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
  { href: '/dashboard/playground', icon: '🧪', label: 'Playground' },
  { href: '/dashboard/templates', icon: '📋', label: 'Templates' },
  { href: '/dashboard/webhooks', icon: '🔗', label: 'Webhooks' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Paramètres' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    const checkAccess = () => {
      const isAuthorized = localStorage.getItem('siby_admin_access') === 'true';
      if (!isAuthorized) {
        router.push('/auth/login');
        return;
      }
      setUser({ email: 'onesiby7@gmail.com', full_name: 'Admin Siby' });
    };
    checkAccess();
  }, [router]);

  useEffect(() => {
    const channel = supabase.channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const lead = payload.new as any;
        showToast(`🎯 Nouveau lead : ${lead.full_name || lead.email || 'Anonyme'}`);
        setNotifCount(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, showToast]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('siby_admin_access');
    localStorage.removeItem('siby_admin_id');
    router.push('/auth/login');
  };


  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('siby_theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('siby_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="flex min-h-screen bg-base text-primary font-sans transition-colors duration-300">
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {toast && (
        <div className="fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl bg-surface border border-green-500/30 text-sm font-medium animate-in slide-in-from-right-10 shadow-xl">
          {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sticky top-0 h-screen transition-all ${collapsed ? 'w-20' : 'w-72'} border-r border-border bg-base flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
           {!collapsed && (
             <Link href="/dashboard" className="flex items-center gap-3">
               <img src="/logo.png" alt="Siby" className="w-8 h-8 opacity-80" />
               <span className="font-extrabold text-xl tracking-tighter italic color-primary">SIBY <span className="text-muted not-italic font-light">SAAS</span></span>
             </Link>
           )}
           <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-elevated rounded-lg text-muted">
             {collapsed ? '→' : '←'}
           </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-elevated text-primary border border-border shadow-sm' : 'text-muted hover:bg-elevated hover:text-primary'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
              {!collapsed && item.label === 'Leads CRM' && notifCount > 0 && (
                <span className="ml-auto bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">{notifCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
           <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-500/5 rounded-xl text-sm font-bold">
             <span>⏻</span> {!collapsed && 'Déconnexion'}
           </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border p-6 flex justify-between items-center h-20 shadow-sm">
            <div className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">SIBY CLOUD PROTOCOL V5.1</div>
            <div className="flex items-center gap-6">
                <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl bg-elevated border border-border hover:border-muted transition-all text-lg">
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black uppercase text-primary">{user?.full_name || 'Admin'}</span>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Owner Access</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-elevated border border-border flex items-center justify-center font-black text-primary shadow-inner">
                      {user?.full_name?.charAt(0) || 'A'}
                    </div>
                </div>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 bg-base">{children}</div>
      </main>
    </div>

  );
}
