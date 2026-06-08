'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { Users, Globe, Key, ClipboardList, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'];

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', color)}>{icon}</div>
        <TrendingUp className="w-4 h-4 text-emerald-400" />
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-sm"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        {label && <p className="font-medium mb-1">{label}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { user } = useAuth();

  if (user?.role === 'admin')   return <AdminAnalytics />;
  if (user?.role === 'manager') return <ManagerAnalytics />;
  return null;
}

// ── ADMIN ANALYTICS ──
function AdminAnalytics() {
  const [users,    setUsers]    = useState<any[]>([]);
  const [portals,  setPortals]  = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [logs,     setLogs]     = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

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

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  // ── Data prep ──
  const activeUsers   = users.filter(u => u.isActive).length;
  const inactiveUsers = users.length - activeUsers;
  const totalSeats    = licenses.reduce((a, l) => a + (l.totalSeats  || 0), 0);
  const usedSeats     = licenses.reduce((a, l) => a + (l.usedSeats   || 0), 0);
  const totalHours    = logs.reduce((a, l)     => a + (l.hoursSpent  || 0), 0);

  const userRoleData = [
    { name: 'Admin',    value: users.filter(u => u.role === 'admin').length    },
    { name: 'Manager',  value: users.filter(u => u.role === 'manager').length  },
    { name: 'Employee', value: users.filter(u => u.role === 'employee').length },
  ].filter(d => d.value > 0);

  const userStatusData = [
    { name: 'Active',   value: activeUsers   },
    { name: 'Inactive', value: inactiveUsers },
  ].filter(d => d.value > 0);

  const licenseData = licenses.map(l => ({
    name:      l.licenseName?.length > 12 ? l.licenseName.slice(0, 12) + '...' : l.licenseName,
    Used:      l.usedSeats   || 0,
    Available: (l.totalSeats || 0) - (l.usedSeats || 0),
    Total:     l.totalSeats  || 0,
  }));

  const requestStatusData = [
    { name: 'Pending',          value: requests.filter(r => r.status === 'pending').length          },
    { name: 'Mgr Approved',     value: requests.filter(r => r.status === 'manager-approved').length  },
    { name: 'Admin Approved',   value: requests.filter(r => r.status === 'admin-approved').length    },
    { name: 'Rejected',         value: requests.filter(r => r.status === 'rejected').length          },
  ].filter(d => d.value > 0);

  const logStatusData = [
    { name: 'Pending',     value: logs.filter(l => l.status === 'pending').length     },
    { name: 'In Progress', value: logs.filter(l => l.status === 'in-progress').length },
    { name: 'Completed',   value: logs.filter(l => l.status === 'completed').length   },
  ].filter(d => d.value > 0);

  const portalCategoryData = Object.entries(
    portals.reduce((acc: any, p) => {
      const cat = p.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const departmentData = Object.entries(
    users.reduce((acc: any, u) => {
      const dept = u.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Full system overview — users, licenses, portals, logs
        </p>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard label="Total Users"     value={users.length}    icon={<Users      className="w-5 h-5 text-blue-400"    />} color="bg-blue-400/10"    sub={`${activeUsers} active`}          />
        <StatCard label="Active Portals"  value={portals.filter(p => p.isActive).length} icon={<Globe className="w-5 h-5 text-violet-400" />} color="bg-violet-400/10" sub={`${portals.length} total`} />
        <StatCard label="License Seats"   value={`${usedSeats}/${totalSeats}`} icon={<Key className="w-5 h-5 text-amber-400" />} color="bg-amber-400/10" sub="used / total" />
        <StatCard label="Total Work Hours" value={`${totalHours}h`} icon={<ClipboardList className="w-5 h-5 text-emerald-400" />} color="bg-emerald-400/10" sub={`${logs.length} logs`} />
      </div>

      {/* ── Row 1: User Role + User Status ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* User Role Distribution */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>User Role Distribution</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Breakdown by role type</p>
          {userRoleData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={userRoleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {userRoleData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {userRoleData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Status */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>User Status</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Active vs Inactive accounts</p>
          {userStatusData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={userStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {userStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: i === 0 ? '#10b981' : '#ef4444' }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Activation rate</span>
                    <span className="font-bold text-emerald-400">
                      {users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: License Usage Bar Chart ── */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>License Seat Usage</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Used vs available seats per license</p>
        {licenseData.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No licenses found</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={licenseData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 12 }} />
              <Bar dataKey="Used"      fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="Available" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Row 3: Request Status + Work Log Status ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Request Status */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Access Requests</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Requests by approval status</p>
          {requestStatusData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No requests yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={requestStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {requestStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {requestStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Work Log Status */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Work Log Status</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Team productivity overview</p>
          {logStatusData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No logs yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={logStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    <Cell fill="#f59e0b" />
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {logStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: ['#f59e0b','#0ea5e9','#10b981'][i] }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Total: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{totalHours}h</span> logged
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Portal Categories + Departments ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Portal Categories */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Portals by Category</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Distribution across categories</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={portalCategoryData} layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0,4,4,0]} name="Portals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Users by Department */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Users by Department</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Headcount per department</p>
          {departmentData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No department data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departmentData} layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0,4,4,0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Summary Table ── */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>License Health Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['License', 'Portal', 'Used', 'Total', 'Available', 'Usage %', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {licenses.map(l => {
                const pct    = Math.round(((l.usedSeats || 0) / (l.totalSeats || 1)) * 100);
                const avail  = (l.totalSeats || 0) - (l.usedSeats || 0);
                const status = pct > 90 ? 'Critical' : pct > 70 ? 'Warning' : 'Healthy';
                const sColor = pct > 90 ? '#ef4444'  : pct > 70 ? '#f59e0b' : '#10b981';
                return (
                  <tr key={l._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-3 font-medium" style={{ color: 'var(--text-primary)'   }}>{l.licenseName}</td>
                    <td className="py-3 px-3"             style={{ color: 'var(--text-secondary)' }}>{l.portalId?.name || '—'}</td>
                    <td className="py-3 px-3"             style={{ color: 'var(--text-primary)'   }}>{l.usedSeats  || 0}</td>
                    <td className="py-3 px-3"             style={{ color: 'var(--text-primary)'   }}>{l.totalSeats || 0}</td>
                    <td className="py-3 px-3"             style={{ color: 'var(--text-primary)'   }}>{avail}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--bg-surface-3)', minWidth: 60 }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: sColor }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: sColor }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: sColor + '20', color: sColor, border: `1px solid ${sColor}40` }}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── MANAGER ANALYTICS ──
function ManagerAnalytics() {
  const { user }   = useAuth();
  const [logs,     setLogs]     = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/worklogs?managerId=${user?.id}`).then(r => r.json()),
      fetch('/api/requests').then(r => r.json()),
    ]).then(([l, r]) => {
      setLogs(Array.isArray(l) ? l : []);
      setRequests(Array.isArray(r) ? r : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  const totalHours  = logs.reduce((a, l) => a + (l.hoursSpent || 0), 0);
  const completedPct = logs.length > 0
    ? Math.round((logs.filter(l => l.status === 'completed').length / logs.length) * 100) : 0;

  const logStatusData = [
    { name: 'Pending',     value: logs.filter(l => l.status === 'pending').length     },
    { name: 'In Progress', value: logs.filter(l => l.status === 'in-progress').length },
    { name: 'Completed',   value: logs.filter(l => l.status === 'completed').length   },
  ].filter(d => d.value > 0);

  const memberData = Object.entries(
    logs.reduce((acc: any, l) => {
      const name = l.userId?.name || 'Unknown';
      if (!acc[name]) acc[name] = { logs: 0, hours: 0 };
      acc[name].logs  += 1;
      acc[name].hours += l.hoursSpent || 0;
      return acc;
    }, {})
  ).map(([name, v]: any) => ({ name, Logs: v.logs, Hours: v.hours }));

  const reqStatusData = [
    { name: 'Pending',        value: requests.filter(r => r.status === 'pending').length          },
    { name: 'Mgr Approved',   value: requests.filter(r => r.status === 'manager-approved').length  },
    { name: 'Admin Approved', value: requests.filter(r => r.status === 'admin-approved').length    },
    { name: 'Rejected',       value: requests.filter(r => r.status === 'rejected').length          },
  ].filter(d => d.value > 0);

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Team Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your team performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <StatCard label="Total Logs"    value={logs.length}     icon={<ClipboardList className="w-5 h-5 text-blue-400"    />} color="bg-blue-400/10"    />
        <StatCard label="Total Hours"   value={`${totalHours}h`} icon={<TrendingUp    className="w-5 h-5 text-violet-400" />} color="bg-violet-400/10"  />
        <StatCard label="Completion"    value={`${completedPct}%`} icon={<AlertCircle className="w-5 h-5 text-emerald-400" />} color="bg-emerald-400/10" />
        <StatCard label="Requests"      value={requests.length} icon={<Users         className="w-5 h-5 text-amber-400"  />} color="bg-amber-400/10"   />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Log Status Pie */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Work Log Status</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Team task completion breakdown</p>
          {logStatusData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No logs yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={logStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    <Cell fill="#f59e0b" />
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {logStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full"
                        style={{ background: ['#f59e0b','#0ea5e9','#10b981'][i] }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Request Status Pie */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Access Requests</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Request approval status</p>
          {reqStatusData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No requests yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={reqStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {reqStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {reqStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Performance Bar */}
      {memberData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Team Member Performance</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Logs and hours per member</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={memberData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 12 }} />
              <Bar dataKey="Logs"  fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="Hours" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}