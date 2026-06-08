'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  ExternalLink, Plus, ToggleLeft, ToggleRight,
  X, Check, Users, UserPlus, Trash2,
} from 'lucide-react';

export default function PortalsPage() {
  const { user }          = useAuth();
  const [portals,         setPortals]         = useState<any[]>([]);
  const [allUsers,        setAllUsers]        = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [accessModal,     setAccessModal]     = useState<any>(null);
  const [portalUsers,     setPortalUsers]     = useState<any[]>([]);
  const [accessLoading,   setAccessLoading]   = useState(false);
  const [selectedUser,    setSelectedUser]    = useState('');
  const [toast,           setToast]           = useState({ msg: '', type: 'success' });
  const [saving,          setSaving]          = useState(false);
  const [form, setForm] = useState({
    name: '', icon: '', baseUrl: '', adminUrl: '',
    description: '', category: '', color: '#6366f1', type: 'external',
  });

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchPortals = () => {
    fetch('/api/portals?all=true')
      .then(r => r.json())
      .then(data => { setPortals(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchUsers = () => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setAllUsers(Array.isArray(data) ? data : []));
  };

  useEffect(() => { fetchPortals(); fetchUsers(); }, []);

  const togglePortal = async (id: string, current: boolean) => {
    await fetch('/api/portals', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, isActive: !current }),
    });
    fetchPortals();
  };

  const handleAdd = async () => {
    if (!form.name || !form.baseUrl) return;
    setSaving(true);
    await fetch('/api/portals', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: '', icon: '', baseUrl: '', adminUrl: '', description: '', category: '', color: '#6366f1', type: 'external' });
    fetchPortals();
    showToast('Portal added!');
  };

  const openAccessModal = async (portal: any) => {
    setAccessModal(portal);
    setAccessLoading(true);
    setSelectedUser('');
    try {
      const res  = await fetch(`/api/portals/access?portalId=${portal._id}`);
      const data = await res.json();
      setPortalUsers(Array.isArray(data) ? data : []);
    } catch {}
    setAccessLoading(false);
  };

  const grantAccess = async () => {
    if (!selectedUser || !accessModal) return;
    await fetch('/api/portals/access', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        userId:    selectedUser,
        portalId:  accessModal._id,
        grantedBy: user?.id,
      }),
    });
    showToast('Access granted!');
    // Refresh portal users
    const res  = await fetch(`/api/portals/access?portalId=${accessModal._id}`);
    const data = await res.json();
    setPortalUsers(Array.isArray(data) ? data : []);
    setSelectedUser('');
  };

  const revokeAccess = async (userId: string) => {
    await fetch('/api/portals/access', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, portalId: accessModal._id }),
    });
    showToast('Access revoked');
    setPortalUsers(prev => prev.filter(p => p.userId?._id !== userId));
  };

  const categories = [...new Set(portals.map((p: any) => p.category).filter(Boolean))];

  // Users who don't have access yet
  const usersWithoutAccess = allUsers.filter(u =>
    !portalUsers.some(pu => pu.userId?._id === u._id)
  );

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const PortalCard = ({ portal }: { portal: any }) => (
    <div className={cn('glass-card rounded-2xl p-5 border transition-all',
      portal.isActive ? 'border-white/5' : 'border-white/3 opacity-60')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: (portal.color || '#6366f1') + '25', color: portal.color || '#6366f1' }}>
            {portal.icon || portal.name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-white">{portal.name}</p>
            <p className="text-xs text-slate-500 capitalize">{portal.type}</p>
          </div>
        </div>
        <button onClick={() => togglePortal(portal._id, portal.isActive)}
          className="text-slate-500 hover:text-brand-400 transition-colors">
          {portal.isActive
            ? <ToggleRight className="w-6 h-6 text-brand-400" />
            : <ToggleLeft  className="w-6 h-6" />}
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">{portal.description}</p>

      <div className="flex items-center justify-between">
        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium',
          portal.isActive
            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
            : 'text-slate-500 bg-slate-400/10 border-slate-400/20')}>
          {portal.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center gap-2">
          {/* Grant Access Button */}
          <button onClick={() => openAccessModal(portal)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
            <Users className="w-3 h-3" /> Access
          </button>
          <a href={portal.baseUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
            Open <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Toast */}
      {toast.msg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portals</h1>
          <p className="text-slate-400 text-sm mt-1">Manage all integrated portals and tools</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Portal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Portals', value: portals.length,                         color: 'text-white'       },
          { label: 'Active',        value: portals.filter(p => p.isActive).length,  color: 'text-emerald-400' },
          { label: 'Inactive',      value: portals.filter(p => !p.isActive).length, color: 'text-red-400'     },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Portals by category */}
      {categories.length > 0 ? categories.map(cat => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{cat}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portals.filter(p => p.category === cat).map((portal: any) => (
              <PortalCard key={portal._id} portal={portal} />
            ))}
          </div>
        </div>
      )) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map((portal: any) => <PortalCard key={portal._id} portal={portal} />)}
        </div>
      )}

      {/* ── Access Modal ── */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>

            <div className="flex items-center justify-between p-5 sticky top-0"
              style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: (accessModal.color || '#6366f1') + '25', color: accessModal.color || '#6366f1' }}>
                  {accessModal.icon || accessModal.name?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {accessModal.name} — Access Control
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Grant or revoke user access
                  </p>
                </div>
              </div>
              <button onClick={() => setAccessModal(null)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Grant Access */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Grant Access to User
                </label>
                <div className="flex gap-2">
                  <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                    <option value="">— Select User —</option>
                    {usersWithoutAccess.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  <button onClick={grantAccess} disabled={!selectedUser}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <UserPlus className="w-4 h-4" /> Grant
                  </button>
                </div>
              </div>

              {/* Users with access */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  USERS WITH ACCESS ({portalUsers.length})
                </p>
                {accessLoading ? (
                  <div className="py-4 text-center">
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                      style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
                  </div>
                ) : portalUsers.length === 0 ? (
                  <p className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                    No users have access yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {portalUsers.map((pa: any) => (
                      <div key={pa._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: '#6366f1' }}>
                            {pa.userId?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              {pa.userId?.name}
                            </p>
                            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                              {pa.userId?.role} · {pa.userId?.email}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => revokeAccess(pa.userId?._id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: '#f87171' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setAccessModal(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Portal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0"
              style={{ background: 'var(--bg-surface-2)' }}>
              <h3 className="font-semibold text-white">Add New Portal</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Portal Name *', key: 'name',        placeholder: 'Microsoft 365'              },
                { label: 'Icon Letter',   key: 'icon',        placeholder: 'M'                          },
                { label: 'Base URL *',    key: 'baseUrl',     placeholder: 'https://www.office.com'     },
                { label: 'Admin URL',     key: 'adminUrl',    placeholder: 'https://admin.microsoft.com'},
                { label: 'Description',   key: 'description', placeholder: 'Office suite & email'       },
                { label: 'Category',      key: 'category',    placeholder: 'Productivity'               },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                  <input type="text" placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
                  <input type="color" value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full h-10 rounded-xl bg-surface-3 border border-white/8 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none text-sm">
                    <option value="external">External</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving || !form.name || !form.baseUrl}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? 'Adding...' : 'Add Portal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}