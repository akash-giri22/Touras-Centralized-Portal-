'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  TrendingUp, Clock, CheckCircle2, AlertCircle,
  Users, Key, Globe, Activity, ArrowRight, ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { cn, getStatusColor, formatDate } from '@/lib/utils';

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div className="glass-card rounded-2xl p-5 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', color)}>{icon}</div>
        <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-sm"                 style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-1"   style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'admin')   return <AdminDashboard />;
  if (user.role === 'manager') return <ManagerDashboard />;
  return <EmployeeDashboard />;
}

// ── ADMIN ──
function AdminDashboard() {
  const [users,    setUsers]    = useState<any[]>([]);
  const [portals,  setPortals]  = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/portals').then(r => r.json()),
      fetch('/api/requests').then(r => r.json()),
    ]).then(([u, p, r]) => {
      setUsers(Array.isArray(u) ? u : []);
      setPortals(Array.isArray(p) ? p : []);
      setRequests(Array.isArray(r) ? r : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  const activeUsers   = users.filter(u => u.isActive).length;
  const activePortals = portals.filter(p => p.isActive).length;
  const pendingReqs   = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Control Center</h1>
        <p className="text-sm mt-1"        style={{ color: 'var(--text-secondary)' }}>Full system overview and governance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard label="Total Users"      value={users.length}   icon={<Users       className="w-5 h-5 text-blue-400"   />} color="bg-blue-400/10"   sub={`${activeUsers} active`} />
        <StatCard label="Active Portals"   value={activePortals}  icon={<Globe       className="w-5 h-5 text-violet-400" />} color="bg-violet-400/10" />
        <StatCard label="Pending Requests" value={pendingReqs}    icon={<AlertCircle className="w-5 h-5 text-red-400"   />} color="bg-red-400/10"    />
        <StatCard label="Total Portals"    value={portals.length} icon={<Activity    className="w-5 h-5 text-amber-400"  />} color="bg-amber-400/10"  />
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>All Users</h3>
          <Link href="/dashboard/users" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#818cf8' }}>
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User','Role','Department','Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'rgba(99,102,241,0.3)' }}>
                        {u.name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        <p className="text-xs"     style={{ color: 'var(--text-muted)'   }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{u.role}</td>
                  <td className="py-3 px-3"            style={{ color: 'var(--text-muted)'     }}>{u.department || '—'}</td>
                  <td className="py-3 px-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(u.isActive ? 'active' : 'inactive'))}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Requests */}
      {requests.filter((r: any) => r.status === 'pending').length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pending Requests</h3>
            <Link href="/dashboard/requests" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#818cf8' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {requests.filter((r: any) => r.status === 'pending').map((r: any) => (
              <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-surface-2)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                  {r.userId?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.userId?.name || 'Unknown'}</p>
                  <p className="text-xs"             style={{ color: 'var(--text-muted)'   }}>{r.targetName}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(r.status))}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MANAGER ──
function ManagerDashboard() {
  const { user }   = useAuth();
  const [logs,     setLogs]     = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [myPortals,setMyPortals]= useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch(`/api/worklogs?managerId=${user.id}`).then(r => r.json()),
      fetch('/api/requests?status=pending').then(r => r.json()),
      fetch(`/api/portals/access?userId=${user.id}`).then(r => r.json()),
    ]).then(([l, r, pa]) => {
      setLogs(Array.isArray(l) ? l : []);
      setRequests(Array.isArray(r) ? r : []);
      // Extract portals from access records
      const portals = Array.isArray(pa)
        ? pa.map((a: any) => a.portalId).filter((p: any) => p && p.isActive)
        : [];
      setMyPortals(portals);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Manager Dashboard</h1>
        <p className="text-sm mt-1"        style={{ color: 'var(--text-secondary)' }}>Team overview and approvals</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard label="Team Logs"         value={logs.length}                                         icon={<ClipboardList className="w-5 h-5 text-blue-400"    />} color="bg-blue-400/10"    />
        <StatCard label="Pending Approvals" value={requests.length}                                     icon={<AlertCircle   className="w-5 h-5 text-amber-400"   />} color="bg-amber-400/10"   />
        <StatCard label="Completed"         value={logs.filter(l => l.status === 'completed').length}   icon={<CheckCircle2  className="w-5 h-5 text-emerald-400" />} color="bg-emerald-400/10" />
        <StatCard label="My Portals"        value={myPortals.length}                                    icon={<Globe         className="w-5 h-5 text-violet-400"  />} color="bg-violet-400/10"  />
      </div>

      {/* My Portals — Manager */}
      {myPortals.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>My Portals</h3>
            <Link href="/dashboard/my-access" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#818cf8' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {myPortals.slice(0, 4).map((p: any) => (
              <a key={p._id} href={p.adminUrl || p.baseUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl transition-all"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: (p.color || '#6366f1') + '40', color: p.color || '#6366f1' }}>
                  {p.icon}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent Team Logs */}
      {logs.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Team Logs</h3>
            <Link href="/dashboard/team-work-logs" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#818cf8' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {logs.slice(0, 4).map(log => (
              <div key={log._id} className="flex gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-surface-2)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                  {log.userId?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{log.workDescription}</p>
                  <p className="text-xs"          style={{ color: 'var(--text-muted)'   }}>
                    {log.userId?.name} · {log.hoursSpent}h · {formatDate(log.logDate)}
                  </p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium shrink-0', getStatusColor(log.status))}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMPLOYEE ──
function EmployeeDashboard() {
  const { user }   = useAuth();
  const [logs,     setLogs]     = useState<any[]>([]);
  const [portals,  setPortals]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetch(`/api/worklogs?userId=${user.id}`).then(r => r.json()),
      // Only fetch assigned portals for employee
      fetch(`/api/portals/access?userId=${user.id}`).then(r => r.json()),
    ]).then(([l, pa]) => {
      setLogs(Array.isArray(l) ? l : []);
      // Extract portal objects from access records
      const assignedPortals = Array.isArray(pa)
        ? pa.map((a: any) => a.portalId).filter((p: any) => p && p.isActive)
        : [];
      setPortals(assignedPortals);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  const totalHours = logs.reduce((a: number, l: any) => a + (l.hoursSpent || 0), 0);

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Workspace</h1>
        <p className="text-sm mt-1"        style={{ color: 'var(--text-secondary)' }}>Your personal dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard label="My Work Logs" value={logs.length}                                              icon={<ClipboardList className="w-5 h-5 text-blue-400"    />} color="bg-blue-400/10"    />
        <StatCard label="Hours Logged" value={`${totalHours}h`}                                         icon={<Clock         className="w-5 h-5 text-violet-400"  />} color="bg-violet-400/10"  />
        <StatCard label="Completed"    value={logs.filter((l: any) => l.status === 'completed').length} icon={<CheckCircle2  className="w-5 h-5 text-emerald-400" />} color="bg-emerald-400/10" />
        <StatCard label="My Portals"   value={portals.length}                                           icon={<Globe         className="w-5 h-5 text-amber-400"   />} color="bg-amber-400/10"   />
      </div>

      {/* My Portals — only assigned */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>My Portals</h3>
          <Link href="/dashboard/my-access" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#818cf8' }}>
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {portals.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No portals assigned yet.{' '}
              <Link href="/dashboard/my-access" style={{ color: '#818cf8' }}>
                Request access →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {portals.slice(0, 4).map((p: any) => (
              <a key={p._id} href={p.baseUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl transition-all"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f140'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: (p.color || '#6366f1') + '40', color: p.color || '#6366f1' }}>
                  {p.icon}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Recent Work Logs */}
      {logs.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Work Logs</h3>
            <Link href="/dashboard/work-logs" className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: '#818cf8' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {logs.slice(0, 3).map(log => (
              <div key={log._id} className="p-3 rounded-xl"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{log.workDescription}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium shrink-0', getStatusColor(log.status))}>
                    {log.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {log.hoursSpent}h · {formatDate(log.logDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}