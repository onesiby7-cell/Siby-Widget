'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Notification {
  id: string; type: string; title: string; message: string; read: boolean; created_at: string;
}

const NOTIF_ICONS: Record<string, string> = {
  lead: '🎯', session: '💬', agent: '⚡', system: 'ℹ️', billing: '💳', default: '🔔',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
      const { data } = await supabase.from('notifications').select('*').eq('user_id', masterId).order('created_at', { ascending: false });
      setNotifs(data || []);
      setLoading(false);
      // Mark all as read
      await supabase.from('notifications').update({ read: true }).eq('user_id', masterId).eq('read', false);
    };
    load();
  }, []);


  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
            🔔 Notifications {unread > 0 && <span style={{ fontSize: '16px', background: '#EF4444', color: '#fff', borderRadius: '100px', padding: '2px 8px', marginLeft: '8px' }}>{unread}</span>}
          </h1>
          <p style={{ color: '#606060', fontSize: '13px', marginTop: '4px' }}>{notifs.length} notification{notifs.length > 1 ? 's' : ''}</p>
        </div>
        {notifs.length > 0 && (
          <button onClick={async () => {
            const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
            await supabase.from('notifications').delete().eq('user_id', masterId);
            setNotifs([]);
          }} className="btn-secondary" style={{ fontSize: '13px' }}>
            🗑 Tout effacer
          </button>

        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px' }} />)}
        </div>
      ) : notifs.length === 0 ? (
        <div style={{
          padding: '80px 40px', textAlign: 'center',
          background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F0', marginBottom: '8px' }}>Aucune notification</div>
          <div style={{ fontSize: '13px', color: '#606060' }}>Les nouvelles notifications apparaîtront ici.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {notifs.map(n => (
            <div key={n.id} style={{
              padding: '16px 20px', borderRadius: '12px',
              background: n.read ? 'var(--bg-surface)' : 'rgba(192,192,192,0.04)',
              border: `1px solid ${n.read ? 'var(--border)' : 'rgba(192,192,192,0.12)'}`,
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              transition: 'all 0.2s',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}>{NOTIF_ICONS[n.type] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: n.read ? 500 : 700, color: n.read ? '#888' : '#F0F0F0' }}>
                    {n.title}
                    {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C0C0C0', display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', color: '#606060', cursor: 'pointer', fontSize: '12px', padding: '2px 6px', borderRadius: '4px' }}>Lu</button>
                    )}
                    <button onClick={() => deleteNotif(n.id)} style={{ background: 'none', border: 'none', color: '#404040', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  </div>
                </div>
                {n.message && <div style={{ fontSize: '13px', color: '#606060', marginTop: '3px', lineHeight: 1.5 }}>{n.message}</div>}
                <div style={{ fontSize: '11px', color: '#404040', marginTop: '5px' }}>
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
