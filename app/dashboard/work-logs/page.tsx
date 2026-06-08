'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn, getStatusColor, formatDate } from '@/lib/utils';
import { Plus, Edit2, X, Clock, Check } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'in-progress', 'completed'] as const;
const HOUR_OPTIONS   = [0.5,1,1.5,2,2.5,3,3.5,4,5,6,7,8];

export default function WorkLogsPage() {
  const { user } = useAuth();
  const [logs,      setLogs]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLog,   setEditLog]   = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    workDescription: '',
    hoursSpent: 1,
    status: 'pending',
    logDate: new Date().toISOString().split('T')[0],
    project: '',
    tags: '',
  });

  const fetchLogs = () => {
    fetch(`/api/worklogs?userId=${user?.id}`)
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { if (user?.id) fetchLogs(); }, [user]);

  const openAdd = () => {
    setEditLog(null);
    setForm({
      workDescription: '', hoursSpent: 1, status: 'pending',
      logDate: new Date().toISOString().split('T')[0], project: '', tags: '',
    });
    setShowModal(true);
  };

  const openEdit = (log: any) => {
    setEditLog(log);
    setForm({
      workDescription: log.workDescription,
      hoursSpent:      log.hoursSpent,
      status:          log.status,
      logDate:         log.logDate,
      project:         log.project || '',
      tags:            (log.tags || []).join(', '),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.workDescription.trim()) return;
    const body = {
      ...form,
      tags:   form.tags.split(',').map(t => t.trim()).filter(Boolean),
      userId: user?.id,
    };
    if (editLog) {
      await fetch('/api/worklogs', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: editLog._id, ...body }),
      });
    } else {
      await fetch('/api/worklogs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
    }
    setShowModal(false);
    fetchLogs();
  };

  const filtered = filterStatus === 'all' ? logs : logs.filter(l => l.status === filterStatus);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Work Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Track your daily work & hours</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Log
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {STATUS_OPTIONS.map(s => {
          const count = logs.filter(l => l.status === s).length;
          const hours = logs.filter(l => l.status === s).reduce((a, l) => a + l.hoursSpent, 0);
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
              className={cn('glass-card rounded-xl p-4 text-left transition-all border',
                filterStatus === s ? 'border-brand-500/40 bg-brand-600/10' : 'border-white/5 hover:border-white/10')}>
              <p className="text-xl font-bold text-white">{count}</p>
              <p className={cn('text-xs font-medium capitalize mt-0.5',
                s === 'completed'  ? 'text-emerald-400' :
                s === 'in-progress' ? 'text-blue-400' : 'text-amber-400')}>{s}</p>
              <p className="text-xs text-slate-500 mt-1">{hours}h logged</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Description</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Project</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Hours</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">
                  No logs yet. Click "Add Log" to start!
                </td></tr>
              )}
              {filtered.map(log => (
                <tr key={log._id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{formatDate(log.logDate)}</td>
                  <td className="py-3 px-4">
                    <p className="text-white max-w-xs">{log.workDescription}</p>
                    {log.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {log.tags.map((t: string) => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-surface-4 text-slate-500">{t}</span>
                        ))}
                      </div>
                    )}
                    {log.managerComment && (
                      <p className="text-xs text-brand-400 mt-1 italic">💬 {log.managerComment}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{log.project || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3 h-3 text-slate-500" /> {log.hoursSpent}h
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', getStatusColor(log.status))}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => openEdit(log)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">{editLog ? 'Edit Work Log' : 'Add Work Log'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description *</label>
                <textarea value={form.workDescription}
                  onChange={e => setForm(f => ({ ...f, workDescription: e.target.value }))}
                  rows={3} placeholder="What did you work on?"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
                  <input type="date" value={form.logDate}
                    onChange={e => setForm(f => ({ ...f, logDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Hours</label>
                  <select value={form.hoursSpent}
                    onChange={e => setForm(f => ({ ...f, hoursSpent: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                    {HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                  <select value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Project</label>
                  <input type="text" value={form.project}
                    onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                    placeholder="Project name"
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma separated)</label>
                <input type="text" value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="frontend, api, design"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">Cancel</button>
              <button onClick={handleSave} disabled={!form.workDescription.trim()}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Check className="w-4 h-4" /> {editLog ? 'Save Changes' : 'Add Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}