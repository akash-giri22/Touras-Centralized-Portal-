'use client';
import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils';
import { Search, RefreshCw } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  LOGIN:            'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  LOGOUT:           'text-slate-400   bg-slate-400/10   border-slate-400/20',
  ACCESS_REQUEST:   'text-blue-400    bg-blue-400/10    border-blue-400/20',
  APPROVE_REQUEST:  'text-violet-400  bg-violet-400/10  border-violet-400/20',
  REJECT_REQUEST:   'text-red-400     bg-red-400/10     border-red-400/20',
  USER_CREATED:     'text-amber-400   bg-amber-400/10   border-amber-400/20',
  USER_ACTIVATED:   'text-cyan-400    bg-cyan-400/10    border-cyan-400/20',
  PORTAL_TOGGLE:    'text-pink-400    bg-pink-400/10    border-pink-400/20',
};

export default function AuditLogsPage() {
  const [logs,     setLogs]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = () => {
    setLoading(true);
    fetch('/api/audit')
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const actions = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    const matchAction = filterAction === 'all' || l.action === filterAction;
    const matchSearch = !search ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.target?.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Complete system activity trail</p>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-slate-300 hover:text-white text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length },
          { label: 'Logins',       value: logs.filter(l => l.action === 'LOGIN').length },
          { label: 'Requests',     value: logs.filter(l => l.action === 'ACCESS_REQUEST').length },
          { label: 'Approvals',    value: logs.filter(l => l.action === 'APPROVE_REQUEST').length },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, target..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white focus:outline-none text-sm">
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Action</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-slate-500">
                  No audit logs yet — actions will appear here automatically
                </td></tr>
              )}
              {filtered.map(log => (
                <tr key={log._id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-xs font-mono">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                        {(log.userName || log.userId?.name || '?').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span className="text-white">{log.userName || log.userId?.name || 'System'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium font-mono ${ACTION_COLORS[log.action] || 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{log.target || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}