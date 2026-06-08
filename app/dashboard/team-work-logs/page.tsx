'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn, getStatusColor, formatDate } from '@/lib/utils';
import { Search, MessageSquare, X, Check } from 'lucide-react';

export default function TeamWorkLogsPage() {
  const { user }   = useAuth();
  const [logs,     setLogs]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [commentModal, setCommentModal] = useState<any>(null);

  const fetchLogs = () => {
    const url = user?.role === 'admin'
      ? '/api/worklogs'
      : `/api/worklogs?managerId=${user?.id}`;

    fetch(url)
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchLogs(); }, [user]);

  const handleComment = async () => {
    if (!commentModal) return;
    await fetch('/api/worklogs', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        id:             commentModal.logId,
        managerComment: commentModal.comment,
      }),
    });
    setCommentModal(null);
    fetchLogs();
  };

  const filtered = logs.filter(l => {
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSearch = !search ||
      l.workDescription?.toLowerCase().includes(search.toLowerCase()) ||
      l.userId?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalHours = filtered.reduce((a, l) => a + (l.hoursSpent || 0), 0);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Work Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor and comment on team activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Logs',   value: filtered.length,                                        color: 'text-white'        },
          { label: 'Total Hours',  value: `${totalHours}h`,                                       color: 'text-blue-400'     },
          { label: 'Completed',    value: filtered.filter(l => l.status === 'completed').length,   color: 'text-emerald-400'  },
          { label: 'In Progress',  value: filtered.filter(l => l.status === 'in-progress').length, color: 'text-amber-400'    },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white focus:outline-none text-sm">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Member</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Description</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Project</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Hours</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                  No work logs found
                </td></tr>
              )}
              {filtered.map(log => (
                <tr key={log._id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                        {log.userId?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                      </div>
                      <span className="text-white">{log.userId?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{formatDate(log.logDate)}</td>
                  <td className="py-3 px-4">
                    <p className="text-white max-w-xs">{log.workDescription}</p>
                    {log.managerComment && (
                      <p className="text-xs text-brand-400 mt-0.5 italic">💬 {log.managerComment}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{log.project || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{log.hoursSpent}h</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(log.status))}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setCommentModal({ logId: log._id, comment: log.managerComment || '' })}
                      className={cn('p-1.5 rounded-lg transition-all',
                        log.managerComment
                          ? 'text-brand-400 bg-brand-400/10'
                          : 'text-slate-500 hover:text-white hover:bg-white/10')}>
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Manager Comment</h3>
              <button onClick={() => setCommentModal(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <textarea value={commentModal.comment}
                onChange={e => setCommentModal((m: any) => ({ ...m, comment: e.target.value }))}
                rows={4} placeholder="Add your feedback..."
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setCommentModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleComment}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4" /> Save Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}