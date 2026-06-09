'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn, getStatusColor, formatDate } from '@/lib/utils';
import { Plus, X, Check, Send } from 'lucide-react';

export default function RequestsPage() {
  const { user }          = useAuth();
  const [requests,        setRequests]        = useState<any[]>([]);
  const [availablePortals,setAvailablePortals] = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [commentModal,    setCommentModal]    = useState<any>(null);
  const [toast,           setToast]           = useState({ msg: '', type: 'success' });
  const [form,            setForm]            = useState({
    targetId: '',
    reason:   '',
  });

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmp     = user?.role === 'employee';

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchAll = async () => {
    if (!user) return;
    try {
      const query = isEmp ? `/api/requests?userId=${user.id}` : '/api/requests';

      const [reqRes, portalRes, accessRes] = await Promise.all([
        fetch(query),
        fetch('/api/portals'),
        isEmp ? fetch(`/api/portals/access?userId=${user.id}`) : Promise.resolve(null),
      ]);

      const requestsData = await reqRes.json();
      const portalsData  = await portalRes.json();

      const reqs    = Array.isArray(requestsData) ? requestsData : [];
      const portals = Array.isArray(portalsData)  ? portalsData  : [];

      setRequests(reqs);

      if (isEmp && accessRes) {
        const accessData = await accessRes.json();

        // Already assigned portal IDs
        const assignedIds = Array.isArray(accessData)
          ? accessData.map((a: any) => a.portalId?._id || a.portalId)
          : [];

        // Already requested (pending/approved) portal IDs
        const requestedIds = reqs
          .filter((r: any) => r.status !== 'rejected')
          .map((r: any) => r.targetId);

        // Filter out already assigned + already requested
        const available = portals.filter((p: any) =>
          p.isActive &&
          !assignedIds.includes(p._id) &&
          !requestedIds.includes(p._id)
        );

        setAvailablePortals(available);
      } else {
        setAvailablePortals(portals.filter((p: any) => p.isActive));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const handleSubmit = async () => {
    if (!form.targetId || !form.reason.trim()) return;
    setSubmitting(true);
    try {
      const selectedPortal = availablePortals.find((p: any) => p._id === form.targetId);

      const res = await fetch('/api/requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:     user?.id,
          type:       'portal',
          targetId:   form.targetId,
          targetName: selectedPortal?.name || form.targetId,
          reason:     form.reason,
          status:     'pending',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Failed to submit request', 'error');
      } else {
        showToast('Request submitted successfully!');
        setShowModal(false);
        setForm({ targetId: '', reason: '' });
        fetchAll();
      }
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (req: any) => {
    try {
      const status = isManager ? 'manager-approved' : 'admin-approved';
      await fetch('/api/requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:     req._id,
          status,
          ...(isManager
            ? { managerNote: commentModal?.comment || '' }
            : { adminNote:   commentModal?.comment || '' }),
        }),
      });

      // If admin approves — also grant portal access
      if (isAdmin && req.targetId) {
        await fetch('/api/portals/access', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId:    req.userId?._id || req.userId,
            portalId:  req.targetId,
            grantedBy: user?.id,
          }),
        });
      }

      showToast('Request approved!');
      setCommentModal(null);
      fetchAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch('/api/requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected' }),
      });
      showToast('Request rejected');
      fetchAll();
    } catch {}
  };

  const pendingForMe = isManager
    ? requests.filter(r => r.status === 'pending')
    : isAdmin
    ? requests.filter(r => r.status === 'manager-approved' || r.status === 'pending')
    : [];

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEmp ? 'My Requests' : 'Access Requests'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isEmp ? 'Request portal access' : 'Review and approve requests'}
          </p>
        </div>
        {isEmp && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Request
          </button>
        )}
      </div>

      {/* Pending approvals */}
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
                      <span className="text-slate-500 capitalize">Portal:</span>{' '}
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

      {/* Requests table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          {isEmp ? 'My Request History' : 'All Requests'} ({requests.length})
        </h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-surface-3/30">
                {!isEmp && (
                  <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">User</th>
                )}
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Portal</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Reason</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No requests yet
                    {isEmp && (
                      <button onClick={() => setShowModal(true)}
                        className="ml-2 text-brand-400 hover:underline">
                        Make your first request →
                      </button>
                    )}
                  </td>
                </tr>
              )}
              {requests.map((req: any) => (
                <tr key={req._id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  {!isEmp && (
                    <td className="py-3 px-4 text-white font-medium">
                      {req.userId?.name || 'Unknown'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-slate-300 font-medium">{req.targetName}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{req.reason}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize',
                      getStatusColor(req.status))}>
                      {req.status?.replace(/-/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal — Portal only, no License */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-semibold text-white">New Portal Access Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">Admin will review and grant access</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">

              {/* Portal dropdown — only unassigned + unrequested */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Select Portal *
                </label>
                {availablePortals.length === 0 ? (
                  <div className="px-3 py-3 rounded-xl text-sm text-amber-400"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    You already have access to all available portals!
                  </div>
                ) : (
                  <select value={form.targetId}
                    onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                    <option value="">— Select Portal —</option>
                    {availablePortals.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Reason *
                </label>
                <textarea value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3} placeholder="Why do you need this access?"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none" />
              </div>

              <div className="px-3 py-2.5 rounded-xl text-xs text-slate-400"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                Request goes to Manager → Admin → Access granted automatically on approval.
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleSubmit}
                disabled={submitting || !form.targetId || !form.reason.trim() || availablePortals.length === 0}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  : <><Send className="w-4 h-4" /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {commentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-semibold text-white">Approve Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {commentModal.req.userId?.name} → {commentModal.req.targetName}
                </p>
              </div>
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
              {isAdmin && (
                <p className="text-xs text-emerald-400 mt-2">
                  ✅ Portal access will be automatically granted on approval.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setCommentModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={() => handleApprove(commentModal.req)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4" /> Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}