'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Cloud, Server, HardDrive, Plus, X, Send,
  Check, RefreshCw, AlertTriangle, Key, CheckCircle2,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const RESOURCE_OPTIONS = [
  {
    type:  'server',
    label: 'Server Access',
    desc:  'Access to cloud virtual machine (EC2)',
    icon:  <Server    className="w-6 h-6" />,
    color: '#FF9900',
  },
  {
    type:  'storage',
    label: 'Storage Access',
    desc:  'Access to cloud file storage (S3)',
    icon:  <HardDrive className="w-6 h-6" />,
    color: '#6366f1',
  },
  {
    type:  'both',
    label: 'Server + Storage',
    desc:  'Access to both server and storage',
    icon:  <Cloud     className="w-6 h-6" />,
    color: '#10b981',
  },
];

const statusColor = (s: string) => {
  if (s === 'pending')          return 'text-amber-400   bg-amber-400/10   border-amber-400/20';
  if (s === 'manager-approved') return 'text-blue-400    bg-blue-400/10    border-blue-400/20';
  if (s === 'admin-approved')   return 'text-violet-400  bg-violet-400/10  border-violet-400/20';
  if (s === 'granted')          return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (s === 'rejected')         return 'text-red-400     bg-red-400/10     border-red-400/20';
  return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
};

const statusLabel = (s: string) => {
  if (s === 'pending')          return 'Pending';
  if (s === 'manager-approved') return 'Manager Approved';
  if (s === 'admin-approved')   return 'Admin Approved';
  if (s === 'granted')          return 'Access Granted';
  if (s === 'rejected')         return 'Rejected';
  return s;
};

export default function AwsRequestsPage() {
  const { user }        = useAuth();
  const [requests,      setRequests]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [commentModal,  setCommentModal]  = useState<any>(null);
  const [grantModal,    setGrantModal]    = useState<any>(null);
  const [granting,      setGranting]      = useState(false);
  const [credentials,   setCredentials]   = useState<any>(null);
  const [toast,         setToast]         = useState({ msg: '', type: 'success' });
  const [form,          setForm]          = useState({
    resourceType: '',
    resourceName: '',
    reason:       '',
  });

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmp     = user?.role === 'employee';

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let url = '/api/aws/requests';
      if (isEmp)     url += `?userId=${user?.id}`;
      if (isManager) url += `?role=manager`;
      if (isAdmin)   url += `?role=admin`;

      const res  = await fetch(url);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (user) fetchRequests(); }, [user]);

  const handleSubmit = async () => {
    if (!form.resourceType || !form.reason.trim()) return;
    try {
      const res = await fetch('/api/aws/requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:       user?.id,
          userName:     user?.name,
          userEmail:    user?.email,
          resourceType: form.resourceType,
          resourceName: form.resourceName || RESOURCE_OPTIONS.find(r => r.type === form.resourceType)?.label || '',
          reason:       form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) showToast(data.message || 'Failed', 'error');
      else {
        showToast('AWS access request submitted!');
        setShowModal(false);
        setForm({ resourceType: '', resourceName: '', reason: '' });
        fetchRequests();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApprove = async (req: any, note: string) => {
    const newStatus = isManager ? 'manager-approved' : 'admin-approved';
    try {
      await fetch('/api/aws/requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req._id, status: newStatus, note, role: user?.role }),
      });
      showToast(`Request ${isManager ? 'approved — sent to admin' : 'approved!'}`);
      setCommentModal(null);
      fetchRequests();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch('/api/aws/requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected', role: user?.role }),
      });
      showToast('Request rejected');
      fetchRequests();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleGrantAws = async () => {
    if (!grantModal) return;
    setGranting(true);
    try {
      const req = grantModal;
      const iamUsername = `${req.userName?.toLowerCase().replace(/\s+/g, '-')}-aws-${Date.now().toString().slice(-4)}`;
      const policyMap: Record<string, string[]> = {
        server:  ['arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess'],
        storage: ['arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'],
        both:    ['arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess', 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'],
      };

      const res = await fetch('/api/aws/iam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName:     iamUsername,
          email:        req.userId?.email || req.userEmail,
          displayName:  req.userId?.name  || req.userName,
          policies:     policyMap[req.resourceType] || policyMap['server'],
          resourceType: req.resourceType === 'server' ? 'ec2' : req.resourceType === 'storage' ? 's3' : 'ec2',
          resourceName: req.resourceName,
          assignedBy:   user?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to grant', 'error');
      } else {
        // Mark request as granted
        await fetch('/api/aws/requests', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id:          req._id,
            status:      'granted',
            role:        'admin',
            iamUsername: data.iamUsername,
            accessKeyId: data.accessKeyId,
          }),
        });
        setGrantModal(null);
        setCredentials(data);
        fetchRequests();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGranting(false);
    }
  };

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }} />
    </div>
  );

  const pendingCount = requests.filter(r =>
    isManager ? r.status === 'pending' :
    isAdmin   ? r.status === 'manager-approved' : false
  ).length;

  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">

      {/* Toast */}
      {toast.msg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            AWS Access Requests
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isEmp     ? 'Request cloud server or storage access'               : ''}
            {isManager ? 'Review and approve team AWS access requests'           : ''}
            {isAdmin   ? 'Final approval — grant AWS credentials to users'       : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEmp && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
              <Plus className="w-4 h-4" /> Request AWS Access
            </button>
          )}
          <button onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Flow Banner */}
      <div className="glass-card rounded-2xl p-4"
        style={{ border: '1px solid rgba(255,153,0,0.2)', background: 'rgba(255,153,0,0.04)' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: '#FF9900' }}>Access Request Flow</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Employee Requests', color: '#FF9900', active: true },
            { label: '→', color: 'var(--text-muted)', active: false },
            { label: 'Manager Approves', color: '#0ea5e9', active: isManager || isAdmin },
            { label: '→', color: 'var(--text-muted)', active: false },
            { label: 'Admin Grants Access', color: '#10b981', active: isAdmin },
            { label: '→', color: 'var(--text-muted)', active: false },
            { label: 'AWS Credentials Sent', color: '#6366f1', active: isAdmin },
          ].map((s, i) => (
            <span key={i} className="text-xs font-medium"
              style={{ color: s.active ? s.color : 'var(--text-muted)' }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Pending approval banner */}
      {pendingCount > 0 && (isManager || isAdmin) && (
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-bold text-amber-400">{pendingCount}</span> request{pendingCount > 1 ? 's' : ''} waiting for your approval
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total',            value: requests.length,                                          color: 'text-blue-400'    },
          { label: 'Pending',          value: requests.filter(r => r.status === 'pending').length,          color: 'text-amber-400'   },
          { label: 'Mgr Approved',     value: requests.filter(r => r.status === 'manager-approved').length,  color: 'text-blue-400'    },
          { label: 'Granted',          value: requests.filter(r => r.status === 'granted').length,           color: 'text-emerald-400' },
          { label: 'Rejected',         value: requests.filter(r => r.status === 'rejected').length,          color: 'text-red-400'     },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEmp     ? 'My AWS Requests'              : ''}
            {isManager ? 'Team AWS Requests'             : ''}
            {isAdmin   ? 'All AWS Requests'              : ''}
            {' '}({requests.length})
          </h3>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Cloud className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isEmp ? 'No requests yet. Click "Request AWS Access" to get started.' : 'No pending requests.'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {requests.map((req: any) => {
              const resourceOpt = RESOURCE_OPTIONS.find(r => r.type === req.resourceType);
              return (
                <div key={req._id} className="p-5 transition-all"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">

                      {/* Resource Icon */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: (resourceOpt?.color || '#FF9900') + '20', color: resourceOpt?.color || '#FF9900' }}>
                        {resourceOpt?.icon || <Cloud className="w-6 h-6" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {resourceOpt?.label || req.resourceType}
                          </p>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', statusColor(req.status))}>
                            {statusLabel(req.status)}
                          </span>
                        </div>

                        {/* User info (for manager/admin) */}
                        {!isEmp && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: '#6366f1' }}>
                              {req.userId?.name?.split(' ').map((n: string) => n[0]).join('') || req.userName?.slice(0, 2)}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {req.userId?.name || req.userName}
                              {req.userId?.email && <span style={{ color: 'var(--text-muted)' }}> · {req.userId.email}</span>}
                            </p>
                          </div>
                        )}

                        {/* Reason */}
                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                          "{req.reason}"
                        </p>

                        {/* Notes */}
                        {req.managerNote && (
                          <p className="text-xs mb-1" style={{ color: '#0ea5e9' }}>
                            Manager note: {req.managerNote}
                          </p>
                        )}
                        {req.adminNote && (
                          <p className="text-xs" style={{ color: '#10b981' }}>
                            Admin note: {req.adminNote}
                          </p>
                        )}

                        {/* Granted credentials info */}
                        {req.status === 'granted' && req.iamUsername && (
                          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              IAM User: <span className="font-mono text-emerald-400">{req.iamUsername}</span>
                            </p>
                          </div>
                        )}

                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          Requested: {formatDate(req.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">

                      {/* Manager approves pending */}
                      {isManager && req.status === 'pending' && (
                        <>
                          <button onClick={() => setCommentModal({ req, comment: '' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => handleReject(req._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}

                      {/* Admin grants manager-approved */}
                      {isAdmin && req.status === 'manager-approved' && (
                        <>
                          <button onClick={() => setGrantModal(req)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                            style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                            <Key className="w-3.5 h-3.5" /> Grant AWS
                          </button>
                          <button onClick={() => handleReject(req._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}

                      {/* Admin can also see all and approve pending directly */}
                      {isAdmin && req.status === 'pending' && (
                        <button onClick={() => setCommentModal({ req, comment: '' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Request Modal — Employee */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: '#FF9900' }}>
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Request AWS Access</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your manager will review this request</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Resource Type Selection */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  What do you need access to? *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {RESOURCE_OPTIONS.map(opt => (
                    <button key={opt.type}
                      onClick={() => setForm(f => ({ ...f, resourceType: opt.type }))}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        background:   form.resourceType === opt.type ? opt.color + '15' : 'var(--bg-surface-2)',
                        border:       form.resourceType === opt.type ? `1px solid ${opt.color}40` : '1px solid var(--border)',
                      }}>
                      <div className="mb-2" style={{ color: opt.color }}>{opt.icon}</div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Which resource? (optional)
                </label>
                <input type="text" placeholder="e.g. touras-server-1 or leave blank for general access"
                  value={form.resourceName}
                  onChange={e => setForm(f => ({ ...f, resourceName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#FF9900'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Why do you need this access? *
                </label>
                <textarea rows={3} placeholder="Explain why you need this AWS access..."
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#FF9900'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>

              <div className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.2)', color: 'var(--text-secondary)' }}>
                Your request will be sent to your manager for approval, then to admin for final access.
              </div>
            </div>

            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleSubmit}
                disabled={!form.resourceType || !form.reason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                <Send className="w-4 h-4" /> Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment/Approve Modal */}
      {commentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {isManager ? 'Approve Request' : 'Approve & Forward to Admin'}
              </h3>
              <button onClick={() => setCommentModal(null)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                Approving: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {commentModal.req.userId?.name || commentModal.req.userName}
                </span> — {RESOURCE_OPTIONS.find(r => r.type === commentModal.req.resourceType)?.label}
              </p>
              <textarea rows={3} placeholder="Add a note (optional)..."
                value={commentModal.comment}
                onChange={e => setCommentModal((m: any) => ({ ...m, comment: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setCommentModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={() => handleApprove(commentModal.req, commentModal.comment)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ background: '#10b981' }}>
                <Check className="w-4 h-4" /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant AWS Modal — Admin */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid rgba(255,153,0,0.3)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Grant AWS Access</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                This will create an IAM user and generate AWS credentials
              </p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'User',          value: grantModal.userId?.name  || grantModal.userName  },
                { label: 'Email',         value: grantModal.userId?.email || grantModal.userEmail },
                { label: 'Access Type',   value: RESOURCE_OPTIONS.find(r => r.type === grantModal.resourceType)?.label },
                { label: 'Resource',      value: grantModal.resourceName || 'General Access'      },
                { label: 'Reason',        value: grantModal.reason                                },
                { label: 'Manager Note',  value: grantModal.managerNote || '—'                    },
              ].map(item => (
                <div key={item.label} className="flex gap-3">
                  <span className="text-xs w-24 shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}

              <div className="p-3 rounded-xl text-xs mt-2"
                style={{ background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.2)', color: 'var(--text-secondary)' }}>
                AWS credentials (Access Key + Secret) will be generated. Share them with the user securely.
              </div>
            </div>
            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setGrantModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleGrantAws} disabled={granting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                {granting
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Granting...</>
                  : <><Key className="w-4 h-4" /> Grant AWS Access</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Access Granted!</h3>
                  <p className="text-xs text-red-400 font-medium">Save Secret Key NOW — shown only once!</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'IAM Username',  value: credentials.iamUsername,     copy: true },
                { label: 'Access Key ID', value: credentials.accessKeyId,     copy: true },
                { label: 'Secret Key',    value: credentials.secretAccessKey, copy: true },
                { label: 'Region',        value: credentials.region,          copy: false },
              ].map(item => (
                <div key={item.label}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <span className="flex-1 text-xs font-mono break-all" style={{ color: 'var(--text-primary)' }}>
                      {item.value}
                    </span>
                    {item.copy && (
                      <button onClick={() => { navigator.clipboard.writeText(item.value); showToast(`${item.label} copied!`); }}
                        style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                        <Key className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setCredentials(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                I have saved the credentials — Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}