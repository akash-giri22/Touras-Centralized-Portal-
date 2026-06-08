'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  RefreshCw, Server, Database, Shield, UserPlus,
  X, Check, Trash2, Play, Square,
  HardDrive, Cloud, Key, Users, Copy, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AwsIntegrationPage() {
  const { user }       = useAuth();
  const [activeTab,    setActiveTab]    = useState<'ec2' | 's3' | 'iam'>('ec2');
  const [ec2List,      setEc2List]      = useState<any[]>([]);
  const [s3List,       setS3List]       = useState<any[]>([]);
  const [iamList,      setIamList]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState({ msg: '', type: 'success' });
  const [showGrant,    setShowGrant]    = useState(false);
  const [granting,     setGranting]     = useState(false);
  const [credentials,  setCredentials]  = useState<any>(null);
  const [showSecret,   setShowSecret]   = useState(false);
  const [grantForm,    setGrantForm]    = useState({
    userName:     '',
    email:        '',
    displayName:  '',
    resourceType: 'ec2',
    resourceId:   '',
    resourceName: '',
    policies:     ['arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess'],
  });

  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`);
  };

  const fetchEC2 = async () => {
    try {
      const res  = await fetch('/api/aws/ec2');
      const data = await res.json();
      setEc2List(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchS3 = async () => {
    try {
      const res  = await fetch('/api/aws/s3');
      const data = await res.json();
      setS3List(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchIAM = async () => {
    try {
      const res  = await fetch('/api/aws/iam');
      const data = await res.json();
      setIamList(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchEC2(), fetchS3(), fetchIAM()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEC2Action = async (instanceId: string, action: 'start' | 'stop') => {
    try {
      const res  = await fetch('/api/aws/ec2', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ instanceId, action }),
      });
      const data = await res.json();
      showToast(data.message);
      setTimeout(fetchEC2, 5000);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleGrantAccess = async () => {
    if (!grantForm.userName || !grantForm.email) return;
    setGranting(true);
    try {
      const res  = await fetch('/api/aws/iam', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...grantForm, assignedBy: user?.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed', 'error');
      } else {
        setShowGrant(false);
        setCredentials(data);
        setGrantForm({ userName: '', email: '', displayName: '', resourceType: 'ec2', resourceId: '', resourceName: '', policies: ['arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess'] });
        fetchIAM();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = async (iamUsername: string) => {
    if (!confirm(`Remove AWS access for ${iamUsername}?`)) return;
    try {
      const res  = await fetch('/api/aws/iam', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ iamUsername }),
      });
      const data = await res.json();
      showToast(data.message);
      fetchIAM();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const stateColor = (state: string) => {
    if (state === 'running')  return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (state === 'stopped')  return 'text-red-400     bg-red-400/10     border-red-400/20';
    if (state === 'pending')  return 'text-amber-400   bg-amber-400/10   border-amber-400/20';
    if (state === 'stopping') return 'text-amber-400   bg-amber-400/10   border-amber-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  if (loading) return (
    <div className="page-wrapper p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#FF9900', borderTopColor: 'transparent' }} />
    </div>
  );

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AWS Integration</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage EC2 servers, S3 storage and IAM user access
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setShowGrant(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
              <UserPlus className="w-4 h-4" /> Grant AWS Access
            </button>
          )}
          <button onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* AWS Banner */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4"
        style={{ border: '1px solid rgba(255,153,0,0.3)', background: 'rgba(255,153,0,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#FF9900' }}>
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            AWS Cloud — Touras-Cloud (ap-south-1 Mumbai)
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            EC2: {ec2List.length} instances · S3: {s3List.length} buckets · IAM: {iamList.length} users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Connected</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'EC2 Instances', value: ec2List.length,                                    color: '#FF9900', icon: <Server   className="w-5 h-5" /> },
          { label: 'Running',       value: ec2List.filter(i => i.state === 'running').length, color: '#10b981', icon: <Play     className="w-5 h-5" /> },
          { label: 'S3 Buckets',    value: s3List.length,                                     color: '#6366f1', icon: <Database className="w-5 h-5" /> },
          { label: 'IAM Users',     value: iamList.length,                                    color: '#0ea5e9', icon: <Users    className="w-5 h-5" /> },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className="p-2 rounded-lg w-fit mb-2"
              style={{ background: s.color + '20', color: s.color }}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'ec2', label: 'EC2 Instances', icon: <Server   className="w-4 h-4" /> },
          { key: 's3',  label: 'S3 Buckets',    icon: <Database className="w-4 h-4" /> },
          { key: 'iam', label: 'IAM Users',     icon: <Shield   className="w-4 h-4" /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? 'rgba(255,153,0,0.15)' : 'var(--bg-surface-2)',
              color:      activeTab === tab.key ? '#FF9900'              : 'var(--text-secondary)',
              border:     activeTab === tab.key ? '1px solid rgba(255,153,0,0.3)' : '1px solid var(--border)',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* EC2 Tab */}
      {activeTab === 'ec2' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>EC2 Instances ({ec2List.length})</h3>
          </div>
          {ec2List.length === 0 ? (
            <div className="p-12 text-center">
              <Server className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No EC2 instances found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Instance ID', 'Type', 'State', 'Public IP', 'Region', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ec2List.map((i: any) => (
                    <tr key={i.instanceId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4" style={{ color: '#FF9900' }} />
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{i.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono px-2 py-1 rounded-lg"
                          style={{ background: 'var(--bg-surface-3)', color: 'var(--text-muted)' }}>
                          {i.instanceId}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{i.type}</td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs px-2 py-1 rounded-full border font-medium capitalize', stateColor(i.state))}>
                          {i.state}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{i.publicIp || '—'}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{i.region}</td>
                      <td className="py-3 px-4">
                        {isAdmin && (
                          <div className="flex gap-2">
                            {i.state === 'stopped' && (
                              <button onClick={() => handleEC2Action(i.instanceId, 'start')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <Play className="w-3 h-3" /> Start
                              </button>
                            )}
                            {i.state === 'running' && (
                              <button onClick={() => handleEC2Action(i.instanceId, 'stop')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <Square className="w-3 h-3" /> Stop
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* S3 Tab */}
      {activeTab === 's3' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>S3 Buckets ({s3List.length})</h3>
          </div>
          {s3List.length === 0 ? (
            <div className="p-12 text-center">
              <HardDrive className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No S3 buckets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)' }}>
                    {['Bucket Name', 'Region', 'Created'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s3List.map((b: any) => (
                    <tr key={b.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4" style={{ color: '#6366f1' }} />
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{b.region}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                        {b.creationDate ? new Date(b.creationDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* IAM Tab */}
      {activeTab === 'iam' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>IAM Users ({iamList.length})</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Users with AWS access — full visibility</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowGrant(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                <UserPlus className="w-3.5 h-3.5" /> Grant Access
              </button>
            )}
          </div>
          {iamList.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No IAM users yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)' }}>
                    {['User', 'Email', 'Resource', 'Policies', 'Access Key', 'Assigned By', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {iamList.map((u: any) => (
                    <tr key={u.username} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: '#FF9900' }}>
                            {(u.displayName || u.username)?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.displayName || u.username}</p>
                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{u.email || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded-lg uppercase font-medium"
                          style={{ background: 'rgba(255,153,0,0.1)', color: '#FF9900' }}>
                          {u.resourceType || 'ec2'}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{u.resourceName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(u.policies || []).slice(0, 2).map((p: string) => (
                            <span key={p} className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(255,153,0,0.1)', color: '#FF9900' }}>
                              {p.replace('Amazon','').replace('Access','').replace('FullAccess','(Full)').replace('ReadOnlyAccess','(Read)')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(u.accessKeys || []).map((k: any) => (
                          <div key={k.keyId} className="flex items-center gap-1">
                            <Key className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                              {k.keyId?.slice(0, 14)}...
                            </span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded',
                              k.status === 'Active' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10')}>
                              {k.status}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>{u.assignedBy || '—'}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {(isAdmin || isManager) && (
                          <button onClick={() => handleRevokeAccess(u.username)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                            <Trash2 className="w-3.5 h-3.5" /> Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrant && (
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
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Grant AWS Access</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Create IAM user with AWS permissions</p>
                </div>
              </div>
              <button onClick={() => setShowGrant(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Display Name *', key: 'displayName', type: 'text',  placeholder: 'John Doe'           },
                  { label: 'Email *',        key: 'email',       type: 'email', placeholder: 'john@company.com'   },
                  { label: 'IAM Username *', key: 'userName',    type: 'text',  placeholder: 'john-doe-aws'       },
                  { label: 'Resource Name',  key: 'resourceName',type: 'text',  placeholder: 'touras-server-1'    },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={(grantForm as any)[f.key]}
                      onChange={e => setGrantForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#FF9900'}
                      onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Resource Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ec2', 's3'].map(t => (
                    <button key={t} onClick={() => setGrantForm(f => ({ ...f, resourceType: t }))}
                      className="py-2.5 rounded-xl text-sm font-medium uppercase"
                      style={{
                        background: grantForm.resourceType === t ? 'rgba(255,153,0,0.15)' : 'var(--bg-surface-2)',
                        color:      grantForm.resourceType === t ? '#FF9900' : 'var(--text-secondary)',
                        border:     grantForm.resourceType === t ? '1px solid rgba(255,153,0,0.3)' : '1px solid var(--border)',
                      }}>
                      {t === 'ec2' ? 'EC2 Server' : 'S3 Storage'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>AWS Policy</label>
                <select value={grantForm.policies[0]}
                  onChange={e => setGrantForm(f => ({ ...f, policies: [e.target.value] }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess">EC2 — Read Only</option>
                  <option value="arn:aws:iam::aws:policy/AmazonEC2FullAccess">EC2 — Full Access</option>
                  <option value="arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess">S3 — Read Only</option>
                  <option value="arn:aws:iam::aws:policy/AmazonS3FullAccess">S3 — Full Access</option>
                  <option value="arn:aws:iam::aws:policy/ReadOnlyAccess">AWS — Read Only (All)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.2)', color: 'var(--text-secondary)' }}>
                IAM user will be created with selected policy. Access Key ID and Secret Key shown once — save immediately!
              </div>
            </div>

            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowGrant(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleGrantAccess}
                disabled={granting || !grantForm.userName || !grantForm.email}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                {granting
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                  : <><Check className="w-4 h-4" /> Grant Access</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl w-full max-w-md shadow-2xl animate-slide-up"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid rgba(255,153,0,0.3)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>AWS Access Granted!</h3>
                  <p className="text-xs text-red-400 font-medium">Save these credentials NOW — Secret Key shown only once!</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {[
                { label: 'IAM Username',   value: credentials.iamUsername,     secret: false },
                { label: 'Access Key ID',  value: credentials.accessKeyId,     secret: false },
                { label: 'Secret Key',     value: credentials.secretAccessKey, secret: true  },
                { label: 'Region',         value: credentials.region,          secret: false },
              ].map(item => (
                <div key={item.label}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                    <span className="flex-1 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                      {item.secret && !showSecret
                        ? '•'.repeat(20)
                        : item.value}
                    </span>
                    {item.secret && (
                      <button onClick={() => setShowSecret(!showSecret)}
                        style={{ color: 'var(--text-muted)' }}>
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => copyToClipboard(item.value, item.label)}
                      style={{ color: 'var(--text-muted)' }}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                Warning: Secret Access Key cannot be retrieved again. Copy and store it securely now!
              </div>
            </div>

            <div className="p-5" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setCredentials(null); setShowSecret(false); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #FF9900, #FF6B00)' }}>
                I have saved the credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}