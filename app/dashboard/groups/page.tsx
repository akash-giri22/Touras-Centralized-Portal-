 'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Users, Plus, X, Edit2, Trash2, RefreshCw, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GroupsPage() {
  const { user }        = useAuth();
  const [groups,        setGroups]        = useState<any[]>([]);
  const [allUsers,      setAllUsers]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editGroup,     setEditGroup]     = useState<any>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [toast,         setToast]         = useState({ msg: '', type: 'success' });
  const [form,          setForm]          = useState({
    name:        '',
    description: '',
    leadId:      '',
    memberIds:   [] as string[],
  });

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchGroups = async () => {
    try {
      const res  = await fetch('/api/groups');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res  = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchGroups(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  const managers  = allUsers.filter(u => u.role === 'manager' || u.role === 'admin');
  const employees = allUsers.filter(u => u.isActive !== false);

  const openCreate = () => {
    setEditGroup(null);
    setForm({ name: '', description: '', leadId: '', memberIds: [] });
    setShowModal(true);
  };

  const openEdit = (group: any) => {
    setEditGroup(group);
    setForm({
      name:        group.name,
      description: group.description || '',
      leadId:      group.leadId?._id || '',
      memberIds:   group.memberIds?.map((m: any) => m._id) || [],
    });
    setShowModal(true);
  };

  const toggleMember = (userId: string) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter(id => id !== userId)
        : [...f.memberIds, userId],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.leadId) {
      showToast('Group name and lead are required', 'error');
      return;
    }

    try {
      if (editGroup) {
        // Update
        const res  = await fetch('/api/groups', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ id: editGroup._id, ...form }),
        });
        const data = await res.json();
        if (!res.ok) showToast(data.message || 'Failed', 'error');
        else { showToast('Group updated!'); fetchGroups(); }
      } else {
        // Create
        const res  = await fetch('/api/groups', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...form, createdBy: user?.id }),
        });
        const data = await res.json();
        if (!res.ok) showToast(data.message || 'Failed', 'error');
        else { showToast('Group created!'); fetchGroups(); }
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    try {
      await fetch('/api/groups', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      });
      showToast('Group deleted');
      fetchGroups();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

 // Manager groups mein apne groups dikhe + add member kar sake
const visibleGroups = isAdmin
  ? groups
  : groups.filter(g =>
      g.leadId?._id === user?.id ||
      g.leadId?.email === user?.email ||
      g.memberIds?.some((m: any) => m._id === user?.id || m.email === user?.email)
    );
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
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Groups</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Create and manage teams' : 'View your assigned groups'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Plus className="w-4 h-4" /> Create Group
            </button>
          )}
          <button onClick={() => { fetchGroups(); fetchUsers(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Groups',   value: groups.length,                               color: 'text-blue-400'    },
          { label: 'Active Groups',  value: groups.filter(g => g.isActive).length,       color: 'text-emerald-400' },
          { label: 'Total Members',  value: groups.reduce((a, g) => a + (g.memberIds?.length || 0), 0), color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Groups List */}
      {visibleGroups.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? 'No groups yet. Click "Create Group" to start.' : 'You are not part of any group yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((group: any) => (
            <div key={group._id} className="glass-card rounded-2xl overflow-hidden">
              {/* Group Header */}
              <div className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setExpandedGroup(expandedGroup === group._id ? null : group._id)}
                style={{ borderBottom: expandedGroup === group._id ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {group.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{group.name}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border',
                        group.isActive
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                          : 'text-red-400 bg-red-400/10 border-red-400/20')}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Lead: <span style={{ color: '#818cf8' }}>{group.leadId?.name || '—'}</span>
                      {' · '}{group.memberIds?.length || 0} members
                    </p>
                    {group.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <>
  {/* Edit — Admin + Manager (if they are lead) */}
  {(isAdmin || (isManager && group.leadId?._id === user?.id)) && (
    <button onClick={e => { e.stopPropagation(); openEdit(group); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
      <Edit2 className="w-3.5 h-3.5" /> Edit
    </button>
  )}

  {/* Delete — Only Admin */}
  {isAdmin && (
    <button onClick={e => { e.stopPropagation(); handleDelete(group._id); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
      <Trash2 className="w-3.5 h-3.5" /> Delete
    </button>
  )}
</>
                  {expandedGroup === group._id
                    ? <ChevronUp  className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {/* Expanded Members */}
              {expandedGroup === group._id && (
                <div className="p-5">
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                    GROUP MEMBERS ({group.memberIds?.length || 0})
                  </p>
                  {group.memberIds?.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No members yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.memberIds?.map((member: any) => (
                        <div key={member._id} className="flex items-center gap-2 p-2.5 rounded-xl"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: member._id === group.leadId?._id ? '#6366f1' : '#64748b' }}>
                            {member.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {member.name}
                              {member._id === group.leadId?._id && (
                                <span className="ml-1 text-xs" style={{ color: '#818cf8' }}>★</span>
                              )}
                            </p>
                            <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sticky top-0"
              style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {editGroup ? 'Edit Group' : 'Create New Group'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {editGroup ? 'Update group settings and members' : 'Set up a new team group'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Group Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Group Name *
                </label>
                <input type="text" placeholder="e.g. Frontend Team"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description (optional)
                </label>
                <input type="text" placeholder="Brief description..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>

              {/* Group Lead / Manager */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Group Lead / Manager *
                </label>
                <select value={form.leadId}
                  onChange={e => setForm(f => ({ ...f, leadId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="">— Select Group Lead —</option>
                  {managers.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.role}) — {m.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Members */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Select Members ({form.memberIds.length} selected)
                </label>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {employees.map(emp => {
                    const selected = form.memberIds.includes(emp._id);
                    return (
                      <button key={emp._id} type="button"
                        onClick={() => toggleMember(emp._id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
                        style={{
                          background: selected ? 'rgba(99,102,241,0.1)' : 'var(--bg-surface-2)',
                          border:     selected ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)',
                        }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: selected ? '#6366f1' : '#64748b' }}>
                          {emp.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {emp.name}
                          </p>
                          <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>
                            {emp.role} · {emp.email}
                          </p>
                        </div>
                        {selected && <Check className="w-4 h-4 shrink-0" style={{ color: '#818cf8' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 sticky bottom-0"
              style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {editGroup ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}