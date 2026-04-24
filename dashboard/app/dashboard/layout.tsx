'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import SearchModal from './SearchModal';

const NAV = [
  { href: '/dashboard', icon: '◈', label: 'Vue d\'ensemble' },
  { href: '/dashboard/agents', icon: '⚡', label: 'Mes Agents' },
  { href: '/dashboard/clients', icon: '👥', label: 'Mes Clients' },
  { href: '/dashboard/conversations', icon: '📜', label: 'Conversations' },
  { href: '/dashboard/leads', icon: '🎯', label: 'Leads CRM' },
  { href: '/dashboard/finances', icon: '💰', label: 'Finances' },
  { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
  { href: '/dashboard/playground', icon: '🧪', label: 'Playground' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Paramètres' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAccess = () => {
      const isAuthorized = localStorage.getItem('siby_admin_access') === 'true';
      if (!isAuthorized) { router.push('/auth/login'); return; }
      setUser({ email: 'onesiby7@gmail.com', full_name: 'Admin Siby' });
    };
    checkAccess();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('siby_admin_access');
    localStorage.removeItem('siby_admin_id');
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-screen bg-deep text-main selection:bg-accent/20">
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar Lux */}
      <aside className={`sticky top-0 h-screen transition-all duration-500 ease-expo ${collapsed ? 'w-20' : 'w-72'} border-r border-white/5 bg-base flex flex-col z-50`}>
        <div className="h-20 flex items-center px-6 justify-between">
           {!collapsed && (
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-black text-lg shadow-2xl shadow-white/20">S</div>
               <span className="font-bold text-lg tracking-tight text-white uppercase italic">Siby <span className="text-dim not-italic font-light">Work</span></span>
             </div>
           )}
           <button onClick={() => setCollapsed(!collapsed)} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-full text-ghost transition-colors">
             {collapsed ? '→' : '←'}
           </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
          {NAV.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && pathname === item.href && (
                <div className="ml-auto w-1 h-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
           <button onClick={handleLogout} className="sidebar-link w-full text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all">
             <span>⏻</span> {!collapsed && 'Quitter'}
           </button>
        </div>
      </aside>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-base relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-base/50 backdrop-blur-md z-40 sticky top-0">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 bg-accent rounded-full" />
              <div className="text-[11px] font-bold text-ghost uppercase tracking-[0.3em]">Protocol v6.2 • Platinum Workspace</div>
            </div>

            <div className="flex items-center gap-8">
                {/* Search Trigger */}
                <button 
                  onClick={() => setSearchOpen(true)}
                  className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-ghost hover:border-white/10 transition-all text-xs"
                >
                  <span className="text-sm">⌘</span>
                  <span>Recherche...</span>
                  <span className="ml-4 opacity-50">K</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-main">{user?.full_name}</div>
                      <div className="text-[10px] font-medium text-ghost uppercase tracking-widest">Enterprise</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-white shadow-xl">
                      {user?.full_name?.charAt(0)}
                    </div>
                </div>
            </div>
        </header>

        <main className="flex-1 p-10 relative z-10 overflow-y-auto animate-entrance">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
