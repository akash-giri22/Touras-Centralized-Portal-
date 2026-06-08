'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const typeColor = (type: string) => {
  if (type === 'success') return '#10b981';
  if (type === 'warning') return '#f59e0b';
  if (type === 'error')   return '#ef4444';
  return '#6366f1';
};

const typeBg = (type: string) => {
  if (type === 'success') return 'rgba(16,185,129,0.1)';
  if (type === 'warning') return 'rgba(245,158,11,0.1)';
  if (type === 'error')   return 'rgba(239,68,68,0.1)';
  return 'rgba(99,102,241,0.1)';
};

const typeIcon = (type: string) => {
  if (type === 'success') return '✅';
  if (type === 'warning') return '⚠️';
  if (type === 'error')   return '❌';
  return 'ℹ️';
};

export default function NotificationBell() {
  const { user }          = useAuth();
  const router            = useRouter();
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef              = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.isRead).length;

  const fetchNotifs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifs();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
    setNotifs(n => n.map(x => x._id === id ? { ...x, isRead: true } : x));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: user?.id, markAll: true }),
    });
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
  };

  const deleteNotif = async (id: string) => {
    await fetch('/api/notifications', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
    setNotifs(n => n.filter(x => x._id !== id));
  };

  const clearAll = async () => {
    await fetch('/api/notifications', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: user?.id, deleteAll: true }),
    });
    setNotifs([]);
  };

  const handleClick = async (notif: any) => {
    if (!notif.isRead) await markRead(notif._id);
    if (notif.link) router.push(notif.link);
    setOpen(false);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell Button */}
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifs(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: open ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
        <Bell className="w-4 h-4" style={{ color: open ? '#818cf8' : 'var(--text-secondary)' }} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{ background: '#ef4444', fontSize: '10px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: '#818cf8' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </p>
              {unread > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: '#ef4444' }}>
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 rounded-lg transition-all text-xs"
                  style={{ color: '#818cf8' }}>
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={clearAll} title="Clear all"
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: 'var(--text-muted)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                  style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
              </div>
            ) : notifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</p>
              </div>
            ) : (
              notifs.map(notif => (
                <div key={notif._id}
                  className="group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
                  style={{
                    background:   notif.isRead ? 'transparent' : typeBg(notif.type),
                    borderBottom: '1px solid var(--border)',
                  }}
                  onClick={() => handleClick(notif)}>

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5"
                    style={{ background: typeBg(notif.type) }}>
                    {typeIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: typeColor(notif.type) }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(notif.createdAt)}
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {notif.link && (
                          <ExternalLink className="w-3 h-3" style={{ color: '#818cf8' }} />
                        )}
                        <button onClick={e => { e.stopPropagation(); deleteNotif(notif._id); }}
                          className="p-0.5 rounded"
                          style={{ color: 'var(--text-muted)' }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                {notifs.length} notification{notifs.length > 1 ? 's' : ''}
                {unread > 0 && ` · ${unread} unread`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}