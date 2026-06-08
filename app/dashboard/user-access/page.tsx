'use client';
import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Key, Globe, ClipboardList, Shield } from 'lucide-react';
import { cn, getStatusColor, formatDate } from '@/lib/utils';

export default function UserAccessPage() {
  const [users,    setUsers]    = useState<any[]>([]);
  const [portals,  setPortals]  = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [logs,     setLogs]     = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/portals').then(r => r.json()),
      fetch('/api/licenses').then(r => r.json()),
      fetch('/api/worklogs').then(r => r.json()),
      fetch('/api/requests').then(r => r.json()),
    ]).then(([u, p, l, w, r]) => {
      setUsers(Array.isArray(u) ? u : []);
      setPortals(Array.isArray(p) ? p : []);
      setLicenses(Array.isArray(l) ? l : []);
      setLogs(Array.isArray(w) ? w : []);
      setRequests(Array.isArray(r) ? r : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const getUserLogs     = (uid: string) => logs.filter(l => l.userId?._id === uid || l.userId === uid);
  const getUserRequests = (uid: string) => requests.filter(r => r.userId?._id === uid || r.userId === uid);

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>User Access View</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Full visibility into every user — portals, licenses, logs, requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    value: users.length,                         color: 'text-blue-400'    },
          { label: 'Active',         value: users.filter(u => u.isActive).length, color: 'text-emerald-400' },
          { label: 'Total Portals',  value: portals.length,                       color: 'text-violet-400'  },
          { label: 'Total Licenses', value: licenses.length,                      color: 'text-amber-400'   },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, department..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
          style={{
            background:   'var(--bg-surface-2)',
            border:       '1px solid var(--border)',
            color:        'var(--text-primary)',
            outline:      'none',
          }} />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filtered.map(u => {
          const isOpen    = expanded === u._id;
          const userLogs  = getUserLogs(u._id);
          const userReqs  = getUserRequests(u._id);
          const totalHours = userLogs.reduce((a: number, l: any) => a + (l.hoursSpent || 0), 0);

          return (
            <div key={u._id} className="glass-card rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}>

              {/* User Header Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : u._id)}
                className="w-full flex items-center gap-4 p-5 text-left transition-all"
                style={{ background: isOpen ? 'var(--bg-surface-2)' : 'transparent' }}>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {u.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border capitalize font-medium',
                      u.role === 'admin'   ? 'text-violet-400 bg-violet-400/10 border-violet-400/20' :
                      u.role === 'manager' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                      'text-slate-400 bg-slate-400/10 border-slate-400/20')}>
                      {u.role}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium',
                      getStatusColor(u.isActive ? 'active' : 'inactive'))}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {u.email} {u.department && `· ${u.department}`}
                  </p>
                </div>

                {/* Quick stats */}
                <div className="hidden sm:flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{portals.length}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Portals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{userLogs.length}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Logs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{totalHours}h</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{userReqs.length}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Requests</p>
                  </div>
                </div>

                {/* Expand icon */}
                <div style={{ color: 'var(--text-muted)' }}>
                  {isOpen
                    ? <ChevronUp   className="w-5 h-5" />
                    : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isOpen && (
                <div className="px-5 pb-5 space-y-5 animate-fade-in"
                  style={{ borderTop: '1px solid var(--border)' }}>

                  {/* ── Portals ── */}
                  <div className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4" style={{ color: '#818cf8' }} />
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Portals Access ({portals.filter(p => p.isActive).length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {portals.filter(p => p.isActive).map((p: any) => (
                        <a key={p._id} href={p.baseUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-xl transition-all"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f140'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: (p.color || '#6366f1') + '30', color: p.color || '#6366f1' }}>
                            {p.icon || p.name?.[0]}
                          </div>
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* ── Licenses ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-4 h-4" style={{ color: '#f59e0b' }} />
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Licenses ({licenses.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {licenses.map((l: any) => (
                        <div key={l._id} className="p-3 rounded-xl"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {l.licenseName}
                          </p>
                          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                            {l.licenseCode}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {l.usedSeats}/{l.totalSeats} seats
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Work Logs ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="w-4 h-4" style={{ color: '#10b981' }} />
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Work Logs ({userLogs.length}) · {totalHours}h total
                      </h4>
                    </div>
                    {userLogs.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No work logs yet</p>
                    ) : (
                      <div className="space-y-2">
                        {userLogs.slice(0, 5).map((log: any) => (
                          <div key={log._id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                {log.workDescription}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {formatDate(log.logDate)} · {log.hoursSpent}h
                                {log.project && ` · ${log.project}`}
                              </p>
                            </div>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium shrink-0',
                              getStatusColor(log.status))}>
                              {log.status}
                            </span>
                          </div>
                        ))}
                        {userLogs.length > 5 && (
                          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                            +{userLogs.length - 5} more logs
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Access Requests ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4" style={{ color: '#6366f1' }} />
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Access Requests ({userReqs.length})
                      </h4>
                    </div>
                    {userReqs.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No requests yet</p>
                    ) : (
                      <div className="space-y-2">
                        {userReqs.map((req: any) => (
                          <div key={req._id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                {req.targetName}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {req.reason} · {formatDate(req.createdAt)}
                              </p>
                            </div>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium shrink-0',
                              getStatusColor(req.status))}>
                              {req.status?.replace(/-/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}