'use client';
// app/dashboard/sync/page.tsx

import { useState } from 'react';
import { RefreshCw, UserPlus, Check, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTRA_USERS = [
  { id: 'e1', name: 'Amit Kumar', email: 'amit.kumar@touras.com', department: 'DevOps', isNew: true },
  { id: 'e2', name: 'Deepa Nair', email: 'deepa.nair@touras.com', department: 'Product', isNew: true },
  { id: 'e3', name: 'Rohan Gupta', email: 'employee@touras.com', department: 'Engineering', isNew: false },
  { id: 'e4', name: 'Sneha Patel', email: 'sneha@touras.com', department: 'Design', isNew: false },
  { id: 'e5', name: 'Kiran Reddy', email: 'kiran.reddy@touras.com', department: 'Sales', isNew: true },
];

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<Set<string>>(new Set());

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
    setSynced(true);
  };

  const handleActivate = async (id: string) => {
    setActivating(id);
    await new Promise(r => setTimeout(r, 800));
    setActivating(null);
    setActivated(prev => new Set([...prev, id]));
  };

  const newUsers = ENTRA_USERS.filter(u => u.isNew);
  const existingUsers = ENTRA_USERS.filter(u => !u.isNew);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Sync from Entra ID</h1>
        <p className="text-slate-400 text-sm mt-1">Import and activate users from Microsoft Entra ID (Azure AD)</p>
      </div>

      {/* Sync banner */}
      <div className="glass-card rounded-2xl p-6 border border-brand-500/20 bg-brand-600/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Microsoft Entra ID</p>
              <p className="text-sm text-slate-400">Connected · Last synced: Today at 9:00 AM</p>
            </div>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
            <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Refresh List'}
          </button>
        </div>
        {synced && (
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> Sync complete! {newUsers.length} new users found.
          </div>
        )}
      </div>

      {/* New users */}
      <div>
        <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          New Users (not in portal yet)
        </h3>
        <div className="space-y-3">
          {newUsers.map(u => (
            <div key={u.id} className={cn('glass-card rounded-xl p-4 border flex items-center gap-4', activated.has(u.id) ? 'border-emerald-500/20' : 'border-amber-500/10')}>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-300">
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email} · {u.department}</p>
              </div>
              {activated.has(u.id) ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <Check className="w-4 h-4" /> Activated
                </span>
              ) : (
                <button onClick={() => handleActivate(u.id)} disabled={activating === u.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 text-xs font-medium transition-colors border border-brand-500/20">
                  {activating === u.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  Activate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Existing users */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Already in Portal</h3>
        <div className="space-y-2">
          {existingUsers.map(u => (
            <div key={u.id} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border border-white/3">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                {u.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-sm">{u.name} <span className="text-slate-600">·</span> <span className="text-slate-500 text-xs">{u.email}</span></p>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Synced</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
