'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn, getStatusColor, formatDate } from '@/lib/utils';
import { Plus, X, Check, Send } from 'lucide-react';

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests,  setRequests]  = useState<any[]>([]);
  const [portals, setPortals] = useState<any[]>([]); 
  const [availablePortals, setAvailablePortals] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commentModal, setCommentModal] = useState<any>(null);
  const [form, setForm] = useState({
  type: 'portal',
  targetId: '',
  targetName: '',
  reason: '',
});

  const fetchAll = () => {
    const query = user?.role === 'employee'
      ? `/api/requests?userId=${user.id}`
      : '/api/requests';

    Promise.all([
  fetch(query).then(r => r.json()),
  fetch('/api/portals').then(r => r.json()),
]).then(([r, p]) => {

  const requestsData = Array.isArray(r) ? r : [];
  const portalsData = Array.isArray(p) ? p : [];

  setRequests(requestsData);
  setPortals(portalsData);

  if (user?.role === 'employee') {

    const alreadyRequestedOrOwned = requestsData
      .filter((req: any) =>
        req.status !== 'rejected'
      )
      .map((req: any) => req.targetId);

    const filteredPortals = portalsData.filter(
      (portal: any) => !alreadyRequestedOrOwned.includes(portal._id)
    );

    setAvailablePortals(filteredPortals);

  } else {
    setAvailablePortals(portalsData);
  }

  setLoading(false);

}).catch(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const handleSubmit = async () => {
    if (!form.targetId || !form.reason.trim()) return;
    const selected = portals.find((p: any) => p._id === form.targetId);
    await fetch('/api/requests', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:     user?.id,
        type:       form.type,
        targetId:   form.targetId,
        targetName: selected?.name || form.targetId,
        reason:     form.reason,
        status:     'pending',
      }),
    });
    setShowModal(false);
    setForm({ type: 'portal', targetId: '', targetName: '', reason: '' });
    fetchAll();
  };

  const handleApprove = async (req: any) => {
    const status = user?.role === 'manager' ? 'manager-approved' : 'admin-approved';
    await fetch('/api/requests', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:     req._id,
        status,
        ...(user?.role === 'manager'
          ? { managerNote: commentModal?.comment || '' }
          : { adminNote:   commentModal?.comment || '' }),
      }),
    });
    setCommentModal(null);
    fetchAll();
  };

  const handleReject = async (id: string) => {
    await fetch('/api/requests', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'rejected' }),
    });
    fetchAll();
  };

  const pendingForMe = user?.role === 'manager'
    ? requests.filter(r => r.status === 'pending')
    : user?.role === 'admin'
    ? requests.filter(r => r.status === 'manager-approved')
    : [];

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {user?.role === 'employee' ? 'My Requests' : 'Access Requests'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.role === 'employee' ? 'Request portal access' : 'Review and approve requests'}
          </p>
        </div>
        {user?.role === 'employee' && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Request
          </button>
        )}
      </div>

      {/* Pending approvals for manager/admin */}
      {pendingForMe.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Awaiting Your Approval ({pendingForMe.length})
          </h2>
          <div className="space-y-3">
            {pendingForMe.map((req: any) => (
              <div key={req._id} className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-xs font-bold text-brand-300">
                        {req.userId?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{req.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{formatDate(req.createdAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500 capitalize">{req.type}:</span>{' '}
                      <span className="text-white font-medium">{req.targetName}</span>
                    </p>
                    <p className="text-sm text-slate-400 mt-1">"{req.reason}"</p>
                    {req.managerNote && (
                      <p className="text-xs text-brand-400 mt-1">Manager: {req.managerNote}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setCommentModal({ req, comment: '' })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleReject(req._id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All requests table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          {user?.role === 'employee' ? 'My Request History' : 'All Requests'} ({requests.length})
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                {user?.role !== 'employee' && (
                  <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">User</th>
                )}
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Target</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Reason</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No requests yet</td></tr>
              )}
              {requests.map((req: any) => (
                <tr key={req._id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  {user?.role !== 'employee' && (
                    <td className="py-3 px-4 text-white font-medium">
                      {req.userId?.name || 'Unknown'}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <span className="capitalize text-xs px-2 py-0.5 rounded-lg bg-surface-4 text-slate-400">
                      {req.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{req.targetName}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{req.reason}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', getStatusColor(req.status))}>
                      {req.status?.replace(/-/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">New Access Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input type="hidden" value="portal" />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Portal</label>
                <select value={form.targetId}
                  onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                  <option value="">— Select —</option>
                  {availablePortals.map((p: any) => (
  <option key={p._id} value={p._id}>
    {p.name}
  </option>
))}
                </select>
                {availablePortals.length === 0 && (
  <p className="text-xs text-amber-400 mt-2">
    No additional portals available for request.
  </p>
)}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Reason *</label>
                <textarea value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3} placeholder="Why do you need this access?"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleSubmit}
disabled={ 
  !form.targetId ||
  !form.reason.trim() ||
  availablePortals.length === 0
}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Send className="w-4 h-4" /> Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Comment Modal */}
      {commentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Approve Request</h3>
              <button onClick={() => setCommentModal(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400 mb-3">Add a note (optional)</p>
              <textarea value={commentModal.comment}
                onChange={e => setCommentModal((m: any) => ({ ...m, comment: e.target.value }))}
                rows={3} placeholder="Approval note..."
                className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setCommentModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={() => handleApprove(commentModal.req)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}