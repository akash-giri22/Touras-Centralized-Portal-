'use client';
import { useEffect, useState } from 'react';
import { cn, getStatusColor, formatDate } from '@/lib/utils';
import { Search, UserCheck, UserX, Plus, X, Check } from 'lucide-react';

export default function UsersPage() {
  const [users,      setUsers]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const [form, setForm] = useState({
    name:               '',
    email:              '',
    password:           '',
    role:               'employee',
    department:         '',
    reportingManagerId: '',
  });

  const fetchUsers = () => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch('/api/users', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, isActive: !current }),
    });
    fetchUsers();
  };

  const handleAddUser = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    await fetch('/api/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        managerId: form.reportingManagerId, // same field
      }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: '', email: '', password: '', role: 'employee', department: '', reportingManagerId: '' });
    fetchUsers();
  };

  const filtered = users.filter(u => {
    const matchRole   = filterRole === 'all' || u.role === filterRole;
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  // All users can be reporting manager
  const allManagers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">Manage user accounts and roles</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: users.length,                              color: 'text-white'       },
          { label: 'Active',   value: users.filter(u => u.isActive).length,      color: 'text-emerald-400' },
          { label: 'Inactive', value: users.filter(u => !u.isActive).length,     color: 'text-red-400'     },
          { label: 'Admins',   value: users.filter(u => u.role === 'admin').length, color: 'text-violet-400' },
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
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-white/8 text-white focus:outline-none text-sm">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                {['User', 'Role', 'Department', 'Reporting Manager', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">No users found</td>
                </tr>
              )}
              {filtered.map(u => (
                <tr key={u._id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                        {u.name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border capitalize font-medium',
                      u.role === 'admin'   ? 'text-violet-400 bg-violet-400/10 border-violet-400/20' :
                      u.role === 'manager' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                                             'text-slate-300 bg-slate-400/10 border-slate-400/20'
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{u.department || '—'}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {u.managerId?.name || u.reportingManagerId?.name || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium',
                      getStatusColor(u.isActive ? 'active' : 'inactive'))}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(u._id, u.isActive)}
                      className={cn('p-1.5 rounded-lg transition-all',
                        u.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-emerald-400 hover:bg-emerald-400/10')}>
                      {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0"
              style={{ background: 'var(--bg-surface-2)' }}>
              <h3 className="font-semibold text-white">Add New User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Text fields */}
              {[
                { label: 'Full Name *',  key: 'name',       type: 'text',     placeholder: 'John Doe'         },
                { label: 'Email *',      key: 'email',      type: 'email',    placeholder: 'john@touras.com'  },
                { label: 'Password',     key: 'password',   type: 'password', placeholder: 'Default: Welcome@123' },
                { label: 'Department',   key: 'department', type: 'text',     placeholder: 'Engineering'      },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Reporting Manager — ONLY ONE dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Reporting Manager
                </label>
                <select value={form.reportingManagerId}
                  onChange={e => setForm(f => ({ ...f, reportingManagerId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                  <option value="">— No Reporting Manager —</option>
                  {allManagers.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1 text-slate-500">
                  Requests will be sent to this manager first for approval
                </p>
              </div>

            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleAddUser} disabled={saving || !form.name || !form.email}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Check className="w-4 h-4" />
                {saving ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}