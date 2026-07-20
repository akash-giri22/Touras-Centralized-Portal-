'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Plus, X, RefreshCw, MessageSquare,
  ChevronDown, ChevronUp, Send, Ticket, Tag, Search,
  Monitor, Wifi, Key, HelpCircle, Laptop,
} from 'lucide-react';
import { cn } from '@/lib/utils';
 
const CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'];
const PRIORITIES  = ['low', 'medium', 'high', 'critical'];
const STATUSES    = ['open', 'in-progress', 'resolved', 'closed'];
 
const priorityConfig: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'text-red-700    bg-red-100    border-red-300'    },
  high:     { label: 'High',     cls: 'text-orange-700 bg-orange-100 border-orange-300' },
  medium:   { label: 'Medium',   cls: 'text-amber-700  bg-amber-100  border-amber-300'  },
  low:      { label: 'Low',      cls: 'text-green-700  bg-green-100  border-green-300'  },
};
 
const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  'open':        { label: 'Open',        cls: 'text-blue-700   bg-blue-100   border-blue-300',   dot: 'bg-blue-500'   },
  'in-progress': { label: 'In Progress', cls: 'text-amber-700  bg-amber-100  border-amber-300',  dot: 'bg-amber-500'  },
  'resolved':    { label: 'Resolved',    cls: 'text-green-700  bg-green-100  border-green-300',  dot: 'bg-green-500'  },
  'closed':      { label: 'Closed',      cls: 'text-slate-500  bg-slate-100  border-slate-300',  dot: 'bg-slate-400'  },
};
 
const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  hardware: { icon: <Monitor   className="w-5 h-5" />, color: '#6366f1' },
  software: { icon: <Laptop    className="w-5 h-5" />, color: '#8b5cf6' },
  network:  { icon: <Wifi      className="w-5 h-5" />, color: '#0ea5e9' },
  access:   { icon: <Key       className="w-5 h-5" />, color: '#f59e0b' },
  other:    { icon: <HelpCircle className="w-5 h-5" />, color: '#64748b' },
};
 
const PRIORITY_BTN: Record<string, string> = {
  low:      'border-green-300  bg-green-50  text-green-700  hover:bg-green-100',
  medium:   'border-amber-300  bg-amber-50  text-amber-700  hover:bg-amber-100',
  high:     'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100',
  critical: 'border-red-300    bg-red-50    text-red-700    hover:bg-red-100',
};
 
export default function TicketsPage() {
  const { user }       = useAuth();
  const [tickets,      setTickets]      = useState<any[]>([]);
  const [allUsers,     setAllUsers]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [activeTab,    setActiveTab]    = useState<'my' | 'assigned'>('my');
  const [comments,     setComments]     = useState<Record<string, string>>({});
  const [toast,        setToast]        = useState({ msg: '', type: 'success' });
  const [form,         setForm]         = useState({
    title: '', description: '', category: 'software', priority: 'medium', taggedUserId: '',
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
 
  const myTickets       = tickets.filter(t => t.raisedBy?._id === user?.id || t.raisedBy === user?.id);
  const assignedTickets = tickets.filter(t => t.assignedTo?._id === user?.id || t.assignedTo === user?.id);
  const baseList        = isEmp ? (activeTab === 'my' ? myTickets : assignedTickets) : tickets;
 
  const filtered = baseList
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.ticketNumber?.toLowerCase().includes(q) || t.title?.toLowerCase().includes(q);
    });
 
  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    try {
      const res  = await fetch('/api/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, raisedBy: user?.id, assignedTo: form.taggedUserId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) showToast(data.message || 'Failed', 'error');
      else {
        showToast(`Ticket ${data.ticketNumber} created!`);
        setShowModal(false);
        setForm({ title: '', description: '', category: 'software', priority: 'medium', taggedUserId: '' });
        fetchTickets();
      }
    } catch (err: any) { showToast(err.message, 'error'); }
  };
 
  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/tickets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    showToast('Status updated');
    fetchTickets();
  };
 
  const handleAssign = async (id: string, assignedTo: string) => {
    await fetch('/api/tickets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, assignedTo, status: 'in-progress' }) });
    showToast('Ticket assigned');
    fetchTickets();
  };
 
  const handleComment = async (id: string) => {
    const text = comments[id] || '';
    if (!text.trim()) return;
    await fetch('/api/tickets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, comment: text, userId: user?.id }) });
    setComments(c => ({ ...c, [id]: '' }));
    showToast('Comment added');
    fetchTickets();
  };
 
  // ── Stat counts ──
  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === 'open').length,
    'in-progress': tickets.filter(t => t.status === 'in-progress').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
    closed:      tickets.filter(t => t.status === 'closed').length,
  };
 
  const statCards = [
    { key: 'all',         label: 'Total',       color: 'text-indigo-600' },
    { key: 'open',        label: 'Open',         color: 'text-blue-600'   },
    { key: 'in-progress', label: 'In Progress',  color: 'text-amber-600'  },
    { key: 'resolved',    label: 'Resolved',     color: 'text-green-600'  },
    { key: 'closed',      label: 'Closed',       color: 'text-slate-500'  },
  ];
 
  // ── Ticket Card ──
  const TicketCard = ({ ticket }: { ticket: any }) => {
    const isExpanded     = expandedId === ticket._id;
    const isAssignedToMe = ticket.assignedTo?._id === user?.id || ticket.assignedTo === user?.id;
    const sc  = statusConfig[ticket.status]   || statusConfig['open'];
    const pc  = priorityConfig[ticket.priority] || priorityConfig['medium'];
    const cat = categoryConfig[ticket.category] || categoryConfig['other'];
 
    return (
      <div className={cn(
        'rounded-2xl border transition-all overflow-hidden',
        isExpanded
          ? 'border-indigo-200 shadow-md shadow-indigo-50'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
      )} style={{ background: 'var(--card-bg, #fff)' }}>
 
        {/* Header */}
        <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ticket._id)}>
          <div className="flex items-start gap-3">
            {/* Cat icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: cat.color + '15', color: cat.color }}>
              {cat.icon}
            </div>
 
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--bg-surface-2, #f1f5f9)', color: 'var(--text-muted, #64748b)' }}>
                  {ticket.ticketNumber}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1', sc.cls)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                  {sc.label}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', pc.cls)}>
                  {pc.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ background: 'var(--bg-surface-2, #f1f5f9)', color: 'var(--text-muted, #64748b)', border: '1px solid var(--border, #e2e8f0)' }}>
                  {ticket.category}
                </span>
                {isAssignedToMe && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)' }}>
                    Assigned to you
                  </span>
                )}
              </div>
 
              {/* Title + desc */}
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{ticket.description}</p>
 
              {/* Footer meta */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  By <span style={{ color: 'var(--text-secondary)' }}>{ticket.raisedBy?.name}</span>
                </span>
                {ticket.assignedTo && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Tag className="w-3 h-3" />
                    <span style={{ color: '#6366f1' }}>{ticket.assignedTo?.name}</span>
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
 
            {isExpanded
              ? <ChevronUp   className="w-4 h-4 shrink-0 mt-1 text-slate-400" />
              : <ChevronDown className="w-4 h-4 shrink-0 mt-1 text-slate-400" />}
          </div>
        </div>
 
        {/* Expanded */}
        {isExpanded && (
          <div className="px-4 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border, #e2e8f0)' }}>
 
            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-4 rounded-xl"
              style={{ background: 'var(--bg-surface-2, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
              {[
                { label: 'Ticket No.',  value: ticket.ticketNumber },
                { label: 'Status',      value: sc.label            },
                { label: 'Priority',    value: pc.label            },
                { label: 'Category',    value: ticket.category     },
                { label: 'Raised by',   value: ticket.raisedBy?.name || 'N/A' },
                { label: 'Assigned to', value: ticket.assignedTo?.name || '—'  },
                { label: 'Created',     value: new Date(ticket.createdAt).toLocaleString() },
                { label: 'Updated',     value: new Date(ticket.updatedAt).toLocaleString() },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs font-semibold mb-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  <p className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              ))}
            </div>
 
            {/* Description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ticket.description}</p>
            </div>
 
            {/* Assigned-to-me actions (employee) */}
            {isAssignedToMe && !canManage && (
              <div className="p-4 rounded-xl space-y-2"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6366f1' }}>Your Actions</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This ticket is assigned to you. Update status as you work on it.</p>
                <div className="flex gap-2 flex-wrap">
                  {(['in-progress', 'resolved'] as const).map(s => {
                    const sc2 = statusConfig[s];
                    return (
                      <button key={s} onClick={() => handleStatusChange(ticket._id, s)}
                        disabled={ticket.status === s}
                        className={cn('text-xs px-3 py-1.5 rounded-xl capitalize font-medium border transition-all disabled:opacity-50', sc2.cls)}>
                        Mark as {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
 
            {/* Admin/Manager actions */}
            {canManage && (
              <div className="p-4 rounded-xl space-y-4"
                style={{ background: 'var(--bg-surface-2, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isAdmin ? 'Admin Actions' : 'Manager Actions'}
                </p>
 
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Change Status</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUSES.map(s => {
                      const sc2 = statusConfig[s];
                      const isActive = ticket.status === s;
                      return (
                        <button key={s} onClick={() => handleStatusChange(ticket._id, s)}
                          className={cn(
                            'text-xs px-3 py-1.5 rounded-xl capitalize font-medium border transition-all',
                            isActive ? sc2.cls : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                          )}>
                          {sc2.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
 
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Assign / Reassign To</p>
                  <select value={ticket.assignedTo?._id || ''}
                    onChange={e => handleAssign(ticket._id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e2e8f0)', color: 'var(--text-primary)', outline: 'none' }}>
                    <option value="">— Unassigned —</option>
                    {allUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
 
            {/* Comments */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Comments ({ticket.comments?.length || 0})
              </p>
 
              <div className="space-y-2 mb-3 max-h-52 overflow-y-auto">
                {(ticket.comments || []).length === 0 ? (
                  <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No comments yet.</p>
                ) : (
                  ticket.comments.map((c: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: '#6366f1' }}>
                        {c.userId?.name?.slice(0, 1) || '?'}
                      </div>
                      <div className="flex-1 px-3 py-2 rounded-xl text-xs"
                        style={{ background: 'var(--bg-surface-2, #f8fafc)', border: '1px solid var(--border, #e2e8f0)' }}>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{c.userId?.name || 'User'}</span>
                        <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <p className="mt-0.5" style={{ color: 'var(--text-primary)' }}>{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
 
              {ticket.status !== 'closed' && (
                <div className="flex gap-2">
                  <input type="text" placeholder="Add a comment... (Enter to send)"
                    value={comments[ticket._id] || ''}
                    onChange={e => setComments(c => ({ ...c, [ticket._id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleComment(ticket._id)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--bg-surface-2, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', color: 'var(--text-primary)', outline: 'none' }} />
                  <button onClick={() => handleComment(ticket._id)}
                    className="px-3 py-2 rounded-xl text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
 
  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );
 
  return (
    <div className="page-wrapper p-6 space-y-5 animate-fade-in">
 
      {/* Toast */}
      {toast.msg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff' }}>
          {toast.msg}
        </div>
      )}
 
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>IT Support Tickets</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isEmp ? 'Raise and track your IT support requests' : 'Manage and resolve all IT support tickets'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Plus className="w-4 h-4" /> Raise Ticket
          </button>
          <button onClick={fetchTickets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
 
      {/* Stats — clickable filters */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            className="rounded-xl p-4 text-left transition-all"
            style={{
              background: filterStatus === s.key ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface-2)',
              border:     filterStatus === s.key ? '1.5px solid rgba(99,102,241,0.35)' : '1px solid var(--border)',
            }}>
            <p className={cn('text-2xl font-bold', s.color)}>{counts[s.key as keyof typeof counts]}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </button>
        ))}
      </div>
 
      {/* Tabs + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        {isEmp && (
          <div className="flex gap-1.5">
            {([
              { key: 'my',       label: `My Tickets (${myTickets.length})`           },
              { key: 'assigned', label: `Assigned to Me (${assignedTickets.length})` },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activeTab === tab.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-surface-2)',
                  color:      activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  border:     activeTab === tab.key ? 'none' : '1px solid var(--border)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by ticket number or title..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
        </div>
      </div>
 
      {/* Ticket List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center space-y-3"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <Ticket className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {searchQuery ? `No tickets found for "${searchQuery}"` : 'No tickets here'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {!searchQuery && 'Raise a ticket if you need IT support.'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white mt-1"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Plus className="w-4 h-4" /> Raise First Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket: any) => <TicketCard key={ticket._id} ticket={ticket} />)}
        </div>
      )}
 
      {/* ─── Create Ticket Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[92vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
 
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sticky top-0 z-10"
              style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
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
 
            <div className="p-5 space-y-5">
 
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Issue Title *
                </label>
                <input type="text" placeholder="e.g. Cannot access VPN"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{form.title.length}/100</p>
              </div>
 
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description *
                </label>
                <textarea rows={3} placeholder="Steps to reproduce, error messages, impact..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>{form.description.length}/500</p>
              </div>
 
              {/* Category — pill grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map(c => {
                    const cc = categoryConfig[c];
                    const selected = form.category === c;
                    return (
                      <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))}
                        className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-medium capitalize transition-all border"
                        style={selected
                          ? { background: cc.color + '15', border: `1.5px solid ${cc.color}`, color: cc.color }
                          : { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <span style={{ color: selected ? cc.color : 'var(--text-muted)', display: 'flex' }}>
                          {cc.icon}
                        </span>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Priority — color-coded pills */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(p => {
                    const pc2 = priorityConfig[p];
                    const selected = form.priority === p;
                    return (
                      <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                        className={cn(
                          'py-2.5 rounded-xl text-xs font-semibold capitalize border transition-all',
                          selected ? pc2.cls : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        )}
                        style={{ background: selected ? undefined : 'var(--bg-surface-2)' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Tag person */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Tag className="w-3.5 h-3.5" /> Tag a Person (optional)
                </label>
                <select value={form.taggedUserId} onChange={e => setForm(f => ({ ...f, taggedUserId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="">— No one tagged —</option>
                  {allUsers.filter(u => u._id !== user?.id).map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ticket will be directly assigned to this person</p>
              </div>
 
              {/* Info banner */}
              <div className="p-3 rounded-xl text-xs flex items-start gap-2"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-secondary)' }}>
                <span className="text-indigo-400 shrink-0 mt-0.5">ℹ</span>
                Your ticket will be tracked and the tagged person will be notified.
              </div>
            </div>
 
            {/* Modal Footer */}
            <div className="flex gap-3 p-5 sticky bottom-0"
              style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleCreate}
                disabled={!form.title.trim() || !form.description.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Send className="w-4 h-4" /> Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 






