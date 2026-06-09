'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ExternalLink, Plus, Send } from 'lucide-react';
 
export default function MyAccessPage() {
  const { user }         = useAuth();
  const [myPortals,      setMyPortals]      = useState<any[]>([]);
  const [teamPortals,    setTeamPortals]    = useState<any[]>([]);
  const [allPortals,     setAllPortals]     = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showRequest,    setShowRequest]    = useState(false);
  const [requestForm,    setRequestForm]    = useState({ portalId: '', reason: '' });
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState({ msg: '', type: 'success' });
 
  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmp     = user?.role === 'employee';
 
  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };
 
  useEffect(() => {
    if (!user?.id) return;
    fetchData();
  }, [user]);
 
  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res  = await fetch('/api/portals');
        const data = await res.json();
        setMyPortals(Array.isArray(data) ? data.filter((p: any) => p.isActive) : []);
 
      } else if (isManager) {
        const [myRes, allRes, usersRes] = await Promise.all([
          fetch(`/api/portals/access?userId=${user.id}`),
          fetch('/api/portals'),
          fetch('/api/users'),
        ]);
        const myData   = await myRes.json();
        const allData  = await allRes.json();
        const userData = await usersRes.json();
 
        const assigned = Array.isArray(myData)
          ? myData.map((pa: any) => pa.portalId).filter((p: any) => p && p.isActive)
          : [];
        setMyPortals(assigned);
        setAllPortals(Array.isArray(allData) ? allData.filter((p: any) => p.isActive) : []);
 
        if (Array.isArray(userData)) {
          const teamUsers = userData.filter((u: any) =>
            u.managerId?._id === user.id ||
            u.managerId === user.id ||
            u.reportingManagerId === user.id
          );
 
          const teamPortalMap: Record<string, any> = {};
          for (const u of teamUsers) {
            try {
              const tRes  = await fetch(`/api/portals/access?userId=${u._id}`);
              const tData = await tRes.json();
              if (Array.isArray(tData)) {
                tData.forEach((pa: any) => {
                  if (pa.portalId && pa.portalId.isActive) {
                    if (!teamPortalMap[pa.portalId._id]) {
                      teamPortalMap[pa.portalId._id] = { portal: pa.portalId, users: [] };
                    }
                    teamPortalMap[pa.portalId._id].users.push(u.name);
                  }
                });
              }
            } catch {}
          }
          setTeamPortals(Object.values(teamPortalMap));
        }
 
      } else {
        const res  = await fetch(`/api/portals/access?userId=${user.id}`);
        const data = await res.json();
        const assigned = Array.isArray(data)
          ? data.map((pa: any) => pa.portalId).filter((p: any) => p && p.isActive)
          : [];
        setMyPortals(assigned);
 
        const allRes  = await fetch('/api/portals');
        const allData = await allRes.json();
        setAllPortals(Array.isArray(allData) ? allData.filter((p: any) => p.isActive) : []);
      }
    } catch {}
    setLoading(false);
  };
 
  const getUrl = (portal: any) => {
    if ((isAdmin || isManager) && portal.adminUrl) return portal.adminUrl;
    return portal.baseUrl;
  };
 
  const getLabel = (portal: any) => {
    if ((isAdmin || isManager) && portal.adminUrl) return 'Admin Portal';
    return 'Open Portal';
  };
 
  // ✅ FIXED: field names, type value, removed status from payload
  const handleRequest = async () => {
    if (!requestForm.portalId || !requestForm.reason.trim()) return;
    setSubmitting(true);
    try {
      // Find selected portal to get its name
      const selectedPortal = allPortals.find((p: any) => p._id === requestForm.portalId);
      if (!selectedPortal) {
        showToast('Invalid portal selected', 'error');
        setSubmitting(false);
        return;
      }
 
      const res = await fetch('/api/requests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:     user?.id,
          targetId:   requestForm.portalId,   // ✅ was: portalId (wrong field)
          targetName: selectedPortal.name,     // ✅ was: missing entirely
          reason:     requestForm.reason,
          type:       'portal',               // ✅ was: 'portal_access' (invalid enum)
          // ✅ removed: status — backend sets 'pending' by default
        }),
      });
 
      if (res.ok) {
        showToast('Request submitted! Admin will review it.');
        setShowRequest(false);
        setRequestForm({ portalId: '', reason: '' });
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to submit request', 'error');
      }
    } catch {
      showToast('Something went wrong', 'error');
    }
    setSubmitting(false);
  };
 
  const unassignedPortals = allPortals.filter(
    p => !myPortals.some((mp: any) => mp._id === p._id)
  );
 
  const PortalCard = ({ portal, showAdminBadge = false }: { portal: any; showAdminBadge?: boolean }) => (
    <a href={getUrl(portal)} target="_blank" rel="noopener noreferrer"
      className="glass-card rounded-2xl p-5 border border-white/5 transition-all group hover:scale-[1.02] block"
      style={{ textDecoration: 'none' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: (portal.color || '#6366f1') + '25', color: portal.color || '#6366f1' }}>
          {portal.icon || portal.name?.[0]}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
          {showAdminBadge && portal.adminUrl && (
            <span className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              Admin
            </span>
          )}
        </div>
      </div>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{portal.name}</p>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{portal.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 rounded-lg capitalize"
          style={{ background: 'var(--bg-surface-4)', color: 'var(--text-muted)' }}>
          {portal.category}
        </span>
        <span className="text-xs" style={{ color: '#818cf8' }}>{getLabel(portal)}</span>
      </div>
    </a>
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
          style={{
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
          {toast.msg}
        </div>
      )}
 
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isAdmin ? 'All Portals' : isManager ? 'My Portal Access' : 'My Access'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin   ? 'Admin access to all active portals'          : ''}
            {isManager ? 'Your assigned portals and your team portals' : ''}
            {isEmp     ? 'Portals and tools assigned to you by admin'  : ''}
          </p>
        </div>
 
        {!isAdmin && unassignedPortals.length > 0 && (
          <button onClick={() => setShowRequest(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Plus className="w-4 h-4" /> Request Portal Access
          </button>
        )}
      </div>
 
      {/* Admin/Manager banner */}
      {(isAdmin || isManager) && (
        <div className="p-3 rounded-xl text-xs"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
          {isAdmin
            ? 'You have admin access to all portals. These open the admin/management view.'
            : 'Your assigned portals open in admin view. Team portals show your team members\' access.'}
        </div>
      )}
 
      {/* My Portals */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          {isAdmin ? 'All Active Portals' : 'My Portals'} ({myPortals.length})
        </h2>
        {myPortals.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-2">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No portals assigned yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isEmp ? 'Contact your admin to get portal access.' : 'No portals available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {myPortals.map((portal: any) => (
              <PortalCard key={portal._id} portal={portal} showAdminBadge={isAdmin || isManager} />
            ))}
          </div>
        )}
      </div>
 
      {/* Team Portals — Manager only */}
      {isManager && teamPortals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Team Portal Access ({teamPortals.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teamPortals.map((item: any) => (
              <div key={item.portal._id} className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: (item.portal.color || '#6366f1') + '25', color: item.portal.color || '#6366f1' }}>
                    {item.portal.icon || item.portal.name?.[0]}
                  </div>
                  <a href={item.portal.baseUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </a>
                </div>
                <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.portal.name}</p>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{item.portal.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.users.map((name: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Request Portal Access Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
 
            <div className="flex items-center justify-between p-5"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Request Portal Access
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Admin will review your request
                </p>
              </div>
              <button onClick={() => setShowRequest(false)} style={{ color: 'var(--text-muted)' }}>
                <ExternalLink className="w-5 h-5 rotate-180" />
              </button>
            </div>
 
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Select Portal *
                </label>
                <select value={requestForm.portalId}
                  onChange={e => setRequestForm(f => ({ ...f, portalId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="">— Select Portal —</option>
                  {unassignedPortals.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>
 
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Why do you need access? *
                </label>
                <textarea rows={3} placeholder="Explain why you need access to this portal..."
                  value={requestForm.reason}
                  onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
 
              <div className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-secondary)' }}>
                Request will be sent to admin for approval. You'll be notified once reviewed.
              </div>
            </div>
 
            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowRequest(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleRequest}
                disabled={submitting || !requestForm.portalId || !requestForm.reason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                  : <><Send className="w-4 h-4" /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 




