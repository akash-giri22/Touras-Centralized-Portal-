'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { RefreshCw, UserX, UserMinus, UserCheck, AlertTriangle, UserPlus, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function JiraIntegrationPage() {
  const { user }     = useAuth();
  const [users,      setUsers]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [error,      setError]      = useState('');
  const [confirm,    setConfirm]    = useState<{ user: any; action: 'suspend' | 'remove' } | null>(null);
  const [toast,      setToast]      = useState({ msg: '', type: 'success' });
  const [filter,     setFilter]     = useState<'all' | 'active' | 'invited' | 'suspended' | 'removed'>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', displayName: '' });
  const [inviting,   setInviting]   = useState(false);

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchUsers = async () => {
    setSyncing(true);
    setError('');
    try {
      const res  = await fetch('/api/jira/users');
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Failed to fetch');
      else setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) return;
    setInviting(true);
    try {
      const res  = await fetch('/api/jira/users', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Invite failed', 'error');
      } else {
        showToast(data.message || 'Invite sent!');
        setShowInvite(false);
        setInviteForm({ email: '', displayName: '' });
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleAction = async () => {
    if (!confirm) return;
    const { user: u, action } = confirm;
    try {
      const res  = await fetch('/api/jira/users', {
        method:  action === 'remove' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accountId: u.accountId }),
      });
      const data = await res.json();
      showToast(data.message || 'Done');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setConfirm(null);
  };

  const handleReactivate = async (u: any) => {
    try {
      const res  = await fetch('/api/jira/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accountId: u.accountId }),
      });
      const data = await res.json();
      showToast(data.message || `${u.displayName} reactivated`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'active')    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (s === 'invited')   return 'text-blue-400    bg-blue-400/10    border-blue-400/20';
    if (s === 'suspended') return 'text-amber-400   bg-amber-400/10   border-amber-400/20';
    if (s === 'removed')   return 'text-red-400     bg-red-400/10     border-red-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">

      {/* Toast */}
      {toast.msg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up"
          style={{
            background:  toast.type === 'error' ? '#ef4444' : '#10b981',
            color:       '#fff',
            boxShadow:   '0 4px 20px rgba(0,0,0,0.3)',
          }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Jira Integration
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin
              ? 'Invite, suspend, reactivate or remove Jira users from Touras'
              : 'View and suspend Jira user access'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <UserPlus className="w-4 h-4" />
              Invite User
            </button>
          )}
          <button onClick={fetchUsers} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync from Jira'}
          </button>
        </div>
      </div>

      {/* Connection Banner */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4"
        style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg"
          style={{ background: '#0052CC' }}>J</div>
        <div className="flex-1">
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Jira Cloud — tourastest.atlassian.net
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? 'Admin — invite, suspend, reactivate and remove users'
              : 'Manager — view and suspend users only'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Connected</span>
        </div>
      </div>

      {/* Role Permission Banner */}
      <div className="p-4 rounded-2xl"
        style={{
          background: isAdmin ? 'rgba(99,102,241,0.08)' : 'rgba(234,179,8,0.08)',
          border:     isAdmin ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(234,179,8,0.2)',
        }}>
        <p className="text-sm font-semibold mb-2"
          style={{ color: isAdmin ? '#818cf8' : '#eab308' }}>
          {isAdmin ? 'Admin Permissions' : 'Manager Permissions'}
        </p>
        <div className="flex flex-wrap gap-2">
          {(isAdmin
            ? ['Invite new users', 'Sync from Jira', 'Suspend access', 'Reactivate users', 'Remove permanently']
            : ['View all users', 'Sync from Jira', 'Suspend access only']
          ).map(p => (
            <span key={p} className="text-xs px-2 py-1 rounded-lg"
              style={{
                background: isAdmin ? 'rgba(99,102,241,0.15)' : 'rgba(234,179,8,0.15)',
                color:      isAdmin ? '#818cf8' : '#eab308',
              }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3"
          style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Stats — 5 cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total',     value: users.length,                                       color: 'text-blue-400',    key: 'all'       },
          { label: 'Active',    value: users.filter(u => u.status === 'active').length,    color: 'text-emerald-400', key: 'active'    },
          { label: 'Invited',   value: users.filter(u => u.status === 'invited').length,   color: 'text-cyan-400',    key: 'invited'   },
          { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, color: 'text-amber-400',   key: 'suspended' },
          { label: 'Removed',   value: users.filter(u => u.status === 'removed').length,   color: 'text-red-400',     key: 'removed'   },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key as any)}
            className="glass-card rounded-xl p-4 text-left transition-all"
            style={{
              border:     filter === s.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border)',
              background: filter === s.key ? 'rgba(99,102,241,0.1)' : 'var(--card-bg)',
            }}>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Jira Users ({filtered.length})
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Click filter cards above to view by status
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No users found. Click "Sync from Jira" to fetch users.
            </p>
            {isAdmin && (
              <button onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <UserPlus className="w-4 h-4" /> Invite First User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Account ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.accountId || u._id}
                    style={{ borderBottom: '1px solid var(--border)' }}>

                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName}
                            className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: '#0052CC' }}>
                            {u.displayName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {u.displayName}
                        </p>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                      {u.email && u.email !== ''
                        ? u.email
                        : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Hidden by Jira Privacy</span>
                      }
                    </td>

                    {/* Account ID */}
                    <td className="py-3 px-4">
                      <span className="text-xs font-mono px-2 py-1 rounded-lg"
                        style={{ background: 'var(--bg-surface-3)', color: 'var(--text-muted)' }}>
                        {u.accountId?.slice(0, 16)}...
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium border capitalize', statusColor(u.status))}>
                        {u.status || 'active'}
                      </span>
                    </td>

                    {/* Actions */}
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">

                        {/* Suspend — Manager + Admin (only active users) */}
                        {(u.status === 'active' || u.status === 'invited') && (isAdmin || isManager) && (
                          <button onClick={() => setConfirm({ user: u, action: 'suspend' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.2)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(234,179,8,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(234,179,8,0.1)'}>
                            <UserMinus className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                        )}

                        {/* Reactivate — Admin only (suspended users) */}
                        {u.status === 'suspended' && isAdmin && (
                          <button onClick={() => handleReactivate(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}>
                            <UserCheck className="w-3.5 h-3.5" />
                            Reactivate
                          </button>
                        )}

                        {/* Remove — Admin only (not already removed) */}
                        {u.status !== 'removed' && isAdmin && (
                          <button onClick={() => setConfirm({ user: u, action: 'remove' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                            <UserX className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}

                        {u.status === 'removed' && (
                          <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                            Removed from Jira
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invite User Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>

            <div className="flex items-center justify-between p-5"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: '#0052CC' }}>J</div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Invite to Jira
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    User will receive an invitation email
                  </p>
                </div>
              </div>
              <button onClick={() => setShowInvite(false)}
                style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@company.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}>
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  value={inviteForm.displayName}
                  onChange={e => setInviteForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-secondary)' }}>
                An invitation email will be sent. User must accept to join Jira.
              </div>
            </div>

            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowInvite(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleInvite}
                disabled={inviting || !inviteForm.email.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {inviting
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Send className="w-4 h-4" /> Send Invite</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: confirm.action === 'remove' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)' }}>
                {confirm.action === 'remove'
                  ? <UserX     className="w-6 h-6 text-red-400"   />
                  : <UserMinus className="w-6 h-6 text-amber-400" />}
              </div>
              <h3 className="text-lg font-bold text-center mb-2"
                style={{ color: 'var(--text-primary)' }}>
                {confirm.action === 'remove' ? 'Remove from Jira?' : 'Suspend Access?'}
              </h3>
              <p className="text-sm text-center mb-1"
                style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold">{confirm.user.displayName}</span>
              </p>
              <p className="text-xs text-center"
                style={{ color: 'var(--text-muted)' }}>
                {confirm.action === 'remove'
                  ? 'Permanently removes user from Jira and marks as removed in database.'
                  : 'Suspends Jira access. Admin can reactivate anytime.'}
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleAction}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: confirm.action === 'remove' ? '#ef4444' : '#eab308' }}>
                {confirm.action === 'remove' ? 'Yes, Remove' : 'Yes, Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}