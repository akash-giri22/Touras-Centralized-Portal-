'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  GitBranch, Cloud, RefreshCw, Key, SendHorizonal,
  ArrowRight, Wrench, Plus, X, Trash2, Upload,
  ExternalLink, Settings, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
 
const DEFAULT_ICONS = [
  '🔧','🔗','☁️','🛠️','📦','🔑','🌐','📊','🤖',
  '🔒','📋','🚀','⚙️','🖥️','📡','🗂️','🔔','💡',
];
 
const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#0ea5e9','#10b981',
  '#f59e0b','#ef4444','#f97316','#64748b','#ec4899',
];
 
const INTERNAL_BY_ROLE: Record<string, any[]> = {
  admin: [
    { label: 'Requests',           description: 'Review and approve portal & license access requests.',          href: '/dashboard/requests',         icon: <SendHorizonal className="w-6 h-6" />, color: '#6366f1', badge: 'Access' },
    { label: 'AWS Requests',       description: 'Manage AWS resource access requests — EC2, S3, IAM.',          href: '/dashboard/aws-requests',     icon: <Cloud         className="w-6 h-6" />, color: '#f59e0b', badge: 'AWS'    },
    { label: 'Jira Integration',   description: 'Manage Jira users — invite, suspend, remove and sync.',        href: '/dashboard/jira-integration', icon: <GitBranch     className="w-6 h-6" />, color: '#0ea5e9', badge: 'Jira'   },
    { label: 'AWS Integration',    description: 'Manage AWS EC2 instances, S3 buckets, and IAM users.',         href: '/dashboard/aws-integration',  icon: <Cloud         className="w-6 h-6" />, color: '#f97316', badge: 'AWS'    },
    { label: 'Sync from Entra ID', description: 'Sync users from Microsoft Entra ID (Azure Active Directory).', href: '/dashboard/sync',             icon: <RefreshCw     className="w-6 h-6" />, color: '#8b5cf6', badge: 'Azure'  },
    { label: 'Licenses',           description: 'Manage software licenses — add, track expiry, assign.',         href: '/dashboard/licenses',         icon: <Key           className="w-6 h-6" />, color: '#10b981', badge: 'License'},
  ],
  manager: [
    { label: 'Requests',         description: 'Review and approve access requests from your team.',    href: '/dashboard/requests',         icon: <SendHorizonal className="w-6 h-6" />, color: '#6366f1', badge: 'Access' },
    { label: 'AWS Requests',     description: 'Review AWS resource access requests from your team.',   href: '/dashboard/aws-requests',     icon: <Cloud         className="w-6 h-6" />, color: '#f59e0b', badge: 'AWS'    },
    { label: 'Jira Integration', description: 'Manage Jira users — invite, suspend, remove and sync.', href: '/dashboard/jira-integration', icon: <GitBranch     className="w-6 h-6" />, color: '#0ea5e9', badge: 'Jira'   },
    { label: 'AWS Integration',  description: 'Manage AWS EC2 instances, S3 buckets, and IAM users.',  href: '/dashboard/aws-integration',  icon: <Cloud         className="w-6 h-6" />, color: '#f97316', badge: 'AWS'    },
  ],
  employee: [
    { label: 'Requests',     description: 'Request access to portals or licenses. Track your status.', href: '/dashboard/requests',     icon: <SendHorizonal className="w-6 h-6" />, color: '#6366f1', badge: 'Access' },
    { label: 'AWS Requests', description: 'Request AWS resource access — EC2, S3 and more.',           href: '/dashboard/aws-requests', icon: <Cloud         className="w-6 h-6" />, color: '#f59e0b', badge: 'AWS'    },
  ],
};
 
function ToolCard({ label, description, color, badge, icon, iconUrl, iconEmoji, isExternal=false, isActive=true, onClick, onDelete, onToggle, isAdmin }: any) {
  return (
    <div className={cn('group relative rounded-2xl p-5 transition-all border text-left', !isActive && 'opacity-50')}
      style={{ background: 'var(--card-bg, var(--bg-surface-1))', border: '1px solid var(--border)' }}
      onMouseEnter={e => { if (!isActive) return; e.currentTarget.style.borderColor = color+'60'; e.currentTarget.style.boxShadow = `0 4px 20px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
 
      {isAdmin && isExternal && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onToggle?.(); }}
            className="p-1.5 rounded-lg" title={isActive ? 'Deactivate' : 'Activate'}
            style={{ background: 'var(--bg-surface-2)', color: isActive ? '#10b981' : '#64748b' }}>
            {isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete?.(); }}
            className="p-1.5 rounded-lg" title="Delete"
            style={{ background: 'var(--bg-surface-2)', color: '#ef4444' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
 
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
          style={{ backgroundColor: color+'18' }}>
          {iconUrl ? <img src={iconUrl} alt={label} className="w-8 h-8 object-contain rounded" />
          : icon   ? <span style={{ color }}>{icon}</span>
                   : <span className="text-2xl">{iconEmoji || '🔧'}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {isExternal && (
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              External
            </span>
          )}
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: color+'15', color, border: `1px solid ${color}30` }}>
              {badge}
            </span>
          )}
        </div>
      </div>
 
      <p className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p className="text-xs leading-relaxed mb-4"  style={{ color: 'var(--text-muted)' }}>{description}</p>
 
      <button onClick={onClick}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        {isExternal
          ? <><ExternalLink className="w-3.5 h-3.5" /> Open</>
          : <><ArrowRight   className="w-3.5 h-3.5" /> Open</>}
      </button>
    </div>
  );
}
 
export default function SoftwareToolsPage() {
  const { user }     = useAuth();
  const router       = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const [dbTools,     setDbTools]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState({ msg: '', type: 'success' });
  const [iconPreview, setIconPreview] = useState('');
  const [iconBase64,  setIconBase64]  = useState('');
  const [form,        setForm]        = useState({
    name: '', description: '', url: '', iconEmoji: '🔧', color: '#6366f1', roles: ['admin'] as string[],
  });
 
  const isAdmin = user?.role === 'admin';
 
  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };
 
  const fetchTools = async () => {
    try {
      const url  = isAdmin ? '/api/tools?all=true' : `/api/tools?role=${user?.role}`;
      const res  = await fetch(url);
      const data = await res.json();
      setDbTools(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };
 
  useEffect(() => { if (user) fetchTools(); }, [user]);
 
  const handleIconFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { showToast('Image must be under 1MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      setIconPreview(b64);
      setIconBase64(b64);
    };
    reader.readAsDataURL(file);
  };
 
  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }));
  };
 
  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), description: form.description.trim(),
          url: form.url.trim(), iconUrl: iconBase64, iconEmoji: form.iconEmoji,
          color: form.color, roles: form.roles, isActive: true, isExternal: true, createdBy: user?.id,
        }),
      });
      if (res.ok) { showToast('Tool added!'); setShowModal(false); resetForm(); fetchTools(); }
      else          showToast('Failed to add tool', 'error');
    } catch { showToast('Something went wrong', 'error'); }
    setSaving(false);
  };
 
  const handleToggle = async (tool: any) => {
    await fetch('/api/tools', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tool._id, isActive: !tool.isActive }) });
    fetchTools();
  };
 
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    await fetch('/api/tools', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }) });
    showToast('Tool deleted');
    fetchTools();
  };
 
  const resetForm = () => {
    setForm({ name: '', description: '', url: '', iconEmoji: '🔧', color: '#6366f1', roles: ['admin'] });
    setIconPreview(''); setIconBase64('');
  };
 
  if (!user) return null;
  const internalTools  = INTERNAL_BY_ROLE[user.role] || [];
  const externalTools  = dbTools;
 
  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
 
      {toast.msg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff' }}>
          {toast.msg}
        </div>
      )}
 
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Software & Tools</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>All integrations and external tools in one place</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Plus className="w-4 h-4" /> Add Tool
          </button>
        )}
      </div>
 
      {/* Internal Tools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4" style={{ color: '#818cf8' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Internal Tools ({internalTools.length})</p>
          <div className="flex-1 h-px ml-1" style={{ background: 'var(--border)' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {internalTools.map((tool: any) => (
            <ToolCard key={tool.href} {...tool} isAdmin={isAdmin} onClick={() => router.push(tool.href)} />
          ))}
        </div>
      </div>
 
      {/* External Tools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-4 h-4" style={{ color: '#818cf8' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>External Tools ({externalTools.length})</p>
          <div className="flex-1 h-px ml-1" style={{ background: 'var(--border)' }} />
        </div>
 
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
          </div>
        ) : externalTools.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
            <ExternalLink className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No external tools yet</p>
            {isAdmin && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click "Add Tool" to add your first external tool.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalTools.map((tool: any) => (
              <ToolCard key={tool._id} label={tool.name} description={tool.description}
                color={tool.color} iconUrl={tool.iconUrl} iconEmoji={tool.iconEmoji}
                isExternal isActive={tool.isActive} isAdmin={isAdmin}
                onClick={() => { if (!tool.isActive) return; window.open(tool.url, '_blank', 'noopener,noreferrer'); }}
                onDelete={() => handleDelete(tool._id)}
                onToggle={() => handleToggle(tool)} />
            ))}
          </div>
        )}
      </div>
 
      {/* Add Tool Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
 
            <div className="flex items-center justify-between p-5 sticky top-0 z-10"
              style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add New Tool</h3>
                  <p className="text-xs"       style={{ color: 'var(--text-muted)' }}>Fill details to add an external tool</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
 
            <div className="p-5 space-y-5">
 
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tool Name *</label>
                <input type="text" placeholder="e.g. Notion, Figma, Slack..."
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>
 
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea rows={2} placeholder="What does this tool do?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>
 
              {/* URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tool URL *</label>
                <input type="url" placeholder="https://..."
                  value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              </div>
 
              {/* Icon */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Icon</label>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-dashed overflow-hidden"
                    style={{ borderColor: iconPreview ? form.color : 'var(--border)', background: 'var(--bg-surface-2)' }}>
                    {iconPreview
                      ? <img src={iconPreview} alt="preview" className="w-10 h-10 object-contain rounded" />
                      : <span className="text-2xl">{form.iconEmoji}</span>}
                  </div>
                  <div className="flex-1">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full justify-center"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <Upload className="w-3.5 h-3.5" /> Upload from files
                    </button>
                    <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>PNG, JPG, SVG — max 1MB</p>
                    {iconPreview && (
                      <button onClick={() => { setIconPreview(''); setIconBase64(''); }}
                        className="text-xs mt-1 w-full text-center"
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Remove image
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconFile} />
                </div>
                {!iconPreview && (
                  <>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Or pick a default icon:</p>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_ICONS.map(emoji => (
                        <button key={emoji} onClick={() => setForm(f => ({ ...f, iconEmoji: emoji }))}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
                          style={{
                            background: form.iconEmoji === emoji ? form.color+'20' : 'var(--bg-surface-2)',
                            border:     form.iconEmoji === emoji ? `2px solid ${form.color}` : '1px solid var(--border)',
                          }}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
 
              {/* Color */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Card Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{ background: c, border: form.color === c ? '3px solid var(--text-primary)' : '3px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                  ))}
                </div>
              </div>
 
              {/* Roles */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Visible to *</label>
                <div className="flex gap-2">
                  {['admin','manager','employee'].map(role => (
                    <button key={role} onClick={() => toggleRole(role)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                      style={{
                        background: form.roles.includes(role) ? '#6366f120' : 'var(--bg-surface-2)',
                        border:     form.roles.includes(role) ? '1.5px solid #6366f1' : '1px solid var(--border)',
                        color:      form.roles.includes(role) ? '#818cf8' : 'var(--text-muted)',
                      }}>
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Select which roles can see this tool</p>
              </div>
 
              {/* Live Preview */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Preview</label>
                <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                      style={{ backgroundColor: form.color+'18' }}>
                      {iconPreview
                        ? <img src={iconPreview} alt="icon" className="w-7 h-7 object-contain rounded" />
                        : <span className="text-xl">{form.iconEmoji}</span>}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{form.name || 'Tool Name'}</p>
                      <p className="text-xs mt-0.5"        style={{ color: 'var(--text-muted)' }}>{form.description || 'Tool description will appear here'}</p>
                    </div>
                  </div>
                </div>
              </div>
 
            </div>
 
            <div className="flex gap-3 p-5 sticky bottom-0"
              style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.url.trim() || form.roles.length === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  : <><Plus className="w-4 h-4" /> Add Tool</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 








