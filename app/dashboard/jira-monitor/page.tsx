'use client';
// app/dashboard/jira-monitor/page.tsx

import { useState } from 'react';
import { MOCK_WORKLOGS, MOCK_USERS } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import { cn, getStatusColor, formatDate } from '@/lib/utils';

export default function JiraMonitorPage() {
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('all');

  const users = MOCK_USERS.filter(u => u.role !== 'admin');

  const filtered = MOCK_WORKLOGS.filter(l => {
    const matchUser = filterUser === 'all' || l.userId === filterUser;
    const matchSearch = !search || l.workDescription.toLowerCase().includes(search.toLowerCase()) || l.userName?.toLowerCase().includes(search.toLowerCase());
    return matchUser && matchSearch;
  });

  // Per-user stats
  const userStats = users.map(u => {
    const userLogs = MOCK_WORKLOGS.filter(l => l.userId === u.id);
    return {
      ...u,
      totalLogs: userLogs.length,
      totalHours: userLogs.reduce((a, l) => a + l.hoursSpent, 0),
      completed: userLogs.filter(l => l.status === 'completed').length,
    };
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Work Log Monitor</h1>
        <p className="text-slate-400 text-sm mt-1">Full visibility into team work logs across the organization</p>
      </div>

      {/* Per user overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map(u => (
          <button key={u.id} onClick={() => setFilterUser(filterUser === u.id ? 'all' : u.id)}
            className={cn('glass-card rounded-xl p-4 text-left transition-all border', filterUser === u.id ? 'border-brand-500/40 bg-brand-600/10' : 'border-white/5 hover:border-white/10')}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-slate-500 capitalize">{u.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div><p className="text-sm font-bold text-white">{u.totalLogs}</p><p className="text-xs text-slate-600">Logs</p></div>
              <div><p className="text-sm font-bold text-white">{u.totalHours}h</p><p className="text-xs text-slate-600">Hours</p></div>
              <div><p className="text-sm font-bold text-emerald-400">{u.completed}</p><p className="text-xs text-slate-600">Done</p></div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work logs..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
        </div>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white focus:outline-none text-sm">
          <option value="all">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* All logs table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Description</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Project</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Hours</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                        {log.userName?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-white">{log.userName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{formatDate(log.logDate)}</td>
                  <td className="py-3 px-4 text-white max-w-xs">{log.workDescription}</td>
                  <td className="py-3 px-4 text-slate-400">{log.project || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{log.hoursSpent}h</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(log.status))}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
