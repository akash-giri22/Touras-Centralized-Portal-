'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Plus, X, RefreshCw, MessageSquare,
  ChevronDown, ChevronUp, Send, Ticket, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'];
const PRIORITIES  = ['low', 'medium', 'high', 'critical'];
const STATUSES    = ['open', 'in-progress', 'resolved', 'closed'];

const priorityColor = (p: string) => {
  if (p === 'critical') return 'text-red-400    bg-red-400/10    border-red-400/20';
  if (p === 'high')     return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
  if (p === 'medium')   return 'text-amber-400  bg-amber-400/10  border-amber-400/20';
  if (p === 'low')      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  return '';
};

const statusColor = (s: string) => {
  if (s === 'open')        return 'text-blue-400   bg-blue-400/10   border-blue-400/20';
  if (s === 'in-progress') return 'text-amber-400  bg-amber-400/10  border-amber-400/20';
  if (s === 'resolved')    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (s === 'closed')      return 'text-slate-400  bg-slate-400/10  border-slate-400/20';
  return '';
};

const categoryIcon = (c: string) => {
  if (c === 'hardware') return '🖥️';
  if (c === 'software') return '💻';
  if (c === 'network')  return '🌐';
  if (c === 'access')   return '🔑';
  return '🎫';
};

export default function TicketsPage() {
  const { user }        = useAuth();
  const [tickets,       setTickets]       = useState<any[]>([]);
  const [allUsers,      setAllUsers]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [comments,      setComments]      = useState<Record<string, string>>({});
  const [toast,         setToast]         = useState({ msg: '', type: 'success' });
  const [form,          setForm]          = useState({
    title:       '',
    description: '',
    category:    'software',
    priority:    'medium',
    taggedUserId: '',
  });

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmp     = user?.role === 'employee';
  const canManage = isAdmin || isManager;

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchTickets = async () => {
    try {
      let url = '/api/tickets';
      if (isEmp) url += `?userId=${user?.id}&role=employee`;
      const res  = await fetch(url);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
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
    if (user) Promise.all([fetchTickets(), fetchUsers()]).finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    try {
      const res  = await fetch('/api/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          raisedBy:    user?.id,
          assignedTo:  form.taggedUserId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) showToast(data.message || 'Failed', 'error');
      else {
        showToast(`Ticket ${data.ticketNumber} created!`);
        setShowModal(false);
        setForm({ title: '', description: '', category: 'software', priority: 'medium', taggedUserId: '' });
        fetchTickets();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/tickets', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    });
    showToast('Status updated');
    fetchTickets();
  };

  const handleAssign = async (id: string, assignedTo: string) => {
    await fetch('/api/tickets', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, assignedTo, status: 'in-progress' }),
    });
    showToast('Ticket assigned');
    fetchTickets();
  };

  const handleComment = async (id: string) => {
    const text = comments[id] || '';
    if (!text.trim()) return;
    await fetch('/api/tickets', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, comment: text, userId: user?.id }),
    });
    setComments(c => ({ ...c, [id]: '' }));
    showToast('Comment added');
    fetchTickets();
  };

  const filtered = filterStatus === 'all'
    ? tickets
    : tickets.filter(t => t.status === filterStatus);

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            IT Support Tickets
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isEmp ? 'Raise and track your IT support requests' : 'Manage and resolve all IT support tickets'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* All roles can create ticket */}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Plus className="w-4 h-4" /> Raise Ticket
          </button>
          <button onClick={fetchTickets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: tickets.length,                                        color: 'text-blue-400',    key: 'all'         },
          { label: 'Open',        value: tickets.filter(t => t.status === 'open').length,        color: 'text-blue-400',    key: 'open'        },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: 'text-amber-400',   key: 'in-progress' },
          { label: 'Resolved',    value: tickets.filter(t => t.status === 'resolved').length,    color: 'text-emerald-400', key: 'resolved'    },
          { label: 'Closed',      value: tickets.filter(t => t.status === 'closed').length,      color: 'text-slate-400',   key: 'closed'      },
        ].map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            className="glass-card rounded-xl p-4 text-left transition-all"
            style={{
              border:     filterStatus === s.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border)',
              background: filterStatus === s.key ? 'rgba(99,102,241,0.1)' : 'var(--card-bg)',
            }}>
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No tickets found.</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Plus className="w-4 h-4" /> Raise First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket: any) => (
            <div key={ticket._id} className="glass-card rounded-2xl overflow-hidden">

              {/* Ticket Header */}
              <div className="p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === ticket._id ? null : ticket._id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: 'var(--bg-surface-2)' }}>
                      {categoryIcon(ticket.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>
                          {ticket.ticketNumber}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', statusColor(ticket.status))}>
                          {ticket.status}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', priorityColor(ticket.priority))}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>
                          {ticket.category}
                        </span>
                      </div>

                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {ticket.title}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                        {ticket.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          By: <span style={{ color: 'var(--text-secondary)' }}>{ticket.raisedBy?.name}</span>
                        </span>
                        {ticket.assignedTo && (
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <Tag className="w-3 h-3" />
                            Tagged: <span style={{ color: '#818cf8' }}>{ticket.assignedTo?.name}</span>
                          </span>
                        )}
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <MessageSquare className="w-3 h-3" /> {ticket.comments?.length || 0}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedId === ticket._id
                    ? <ChevronUp   className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />
                    : <ChevronDown className="w-4 h-4 shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {/* Expanded View */}
              {expandedId === ticket._id && (
                <div className="px-5 pb-5 space-y-4"
                  style={{ borderTop: '1px solid var(--border)' }}>

                    <div
  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl"
  style={{
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)'
  }}
>
  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      TICKET NUMBER
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {ticket.ticketNumber}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      STATUS
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {ticket.status}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      PRIORITY
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {ticket.priority}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      CATEGORY
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {ticket.category}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      CREATED BY
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {ticket.raisedBy?.name || 'N/A'}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      ASSIGNED TO
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {ticket.assignedTo?.name || 'Unassigned'}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      CREATED ON
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {new Date(ticket.createdAt).toLocaleString()}
    </p>
  </div>

  <div>
    <p className="text-xs font-semibold mb-1"
      style={{ color: 'var(--text-muted)' }}>
      LAST UPDATED
    </p>
    <p style={{ color: 'var(--text-primary)' }}>
      {new Date(ticket.updatedAt).toLocaleString()}
    </p>
  </div>

  {ticket.resolvedAt && (
    <div>
      <p className="text-xs font-semibold mb-1"
        style={{ color: 'var(--text-muted)' }}>
        RESOLVED ON
      </p>
      <p style={{ color: 'var(--text-primary)' }}>
        {new Date(ticket.resolvedAt).toLocaleString()}
      </p>
    </div>
  )}
</div>

                  {/* Full description */}
                  <div className="pt-4">
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>DESCRIPTION</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ticket.description}</p>
                  </div>

                  {/* Admin + Manager Actions */}
                  {canManage && (
                    <div className="p-4 rounded-xl space-y-3"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {isAdmin ? 'ADMIN ACTIONS' : 'MANAGER ACTIONS'}
                      </p>

                      {/* Status change */}
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Change Status
                        </label>
                        <div className="flex gap-1.5 flex-wrap">
                          {STATUSES.map(s => (
                            <button key={s} onClick={() => handleStatusChange(ticket._id, s)}
                              className={cn('text-xs px-2.5 py-1.5 rounded-xl capitalize font-medium transition-all border',
                                ticket.status === s ? statusColor(s) : 'border-transparent')}
                              style={{
                                background: ticket.status === s ? undefined : 'var(--bg-surface-3)',
                                color:      ticket.status === s ? undefined : 'var(--text-muted)',
                              }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assign/Tag — Admin + Manager both */}
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Tag / Assign To
                        </label>
                        <select value={ticket.assignedTo?._id || ''}
                          onChange={e => handleAssign(ticket._id, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs"
                          style={{ background: 'var(--bg-surface-3)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                          <option value="">— Unassigned —</option>
                          {allUsers.map(u => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                      COMMENTS ({ticket.comments?.length || 0})
                    </p>
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                      {(ticket.comments || []).length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No comments yet.</p>
                      ) : (
                        ticket.comments.map((c: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl"
                            style={{ background: 'var(--bg-surface-2)' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: '#6366f1' }}>
                              {c.userId?.name?.slice(0, 1) || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {c.userId?.name || 'User'}
                                <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-primary)' }}>{c.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add comment — all roles */}
                    {ticket.status !== 'closed' && (
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add a comment..."
                          value={comments[ticket._id] || ''}
                          onChange={e => setComments(c => ({ ...c, [ticket._id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleComment(ticket._id)}
                          className="flex-1 px-3 py-2 rounded-xl text-sm"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
                        <button onClick={() => handleComment(ticket._id)}
                          className="px-3 py-2 rounded-xl text-white"
                          style={{ background: '#6366f1' }}>
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>

            <div className="flex items-center justify-between p-5 sticky top-0"
              style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Raise IT Support Ticket</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Describe your issue clearly</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Issue Title *
                </label>
                <input type="text" placeholder="e.g. Cannot access VPN"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description *
                </label>
                <textarea rows={3} placeholder="Describe the issue in detail..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Category
                  </label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryIcon(c)} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Priority
                  </label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Tag User */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tag a Person (optional)
                  </span>
                </label>
                <select value={form.taggedUserId}
                  onChange={e => setForm(f => ({ ...f, taggedUserId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="">— No one tagged —</option>
                  {allUsers
                    .filter(u => u._id !== user?.id)
                    .map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Ticket will be directly assigned to this person
                </p>
              </div>

              <div className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-secondary)' }}>
                Your ticket will be tracked and the tagged person will be notified.
              </div>
            </div>

            <div className="flex gap-3 p-5 sticky bottom-0"
              style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleCreate}
                disabled={!form.title.trim() || !form.description.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}