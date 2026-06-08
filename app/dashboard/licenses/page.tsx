'use client';
import { useEffect, useState } from 'react';
import { Key, AlertTriangle, Plus, X, Check } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [portals,  setPortals]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    portalId: '', licenseCode: '', licenseName: '',
    region: '', totalSeats: 10, expiresAt: '',
  });

  const fetchAll = () => {
    Promise.all([
      fetch('/api/licenses').then(r => r.json()),
      fetch('/api/portals').then(r => r.json()),
    ]).then(([l, p]) => {
      setLicenses(Array.isArray(l) ? l : []);
      setPortals(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async () => {
    if (!form.portalId || !form.licenseCode || !form.licenseName) return;
    setSaving(true);
    await fetch('/api/licenses', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        totalSeats: Number(form.totalSeats),
        expiresAt:  form.expiresAt || null,
      }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ portalId: '', licenseCode: '', licenseName: '', region: '', totalSeats: 10, expiresAt: '' });
    fetchAll();
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Licenses</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor and manage software licenses</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add License
        </button>
      </div>

      {licenses.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-slate-400">No licenses found.</p>
          <p className="text-slate-500 text-sm mt-1">
            Run seed first:{' '}
            <a href="/api/seed" target="_blank" className="text-brand-400 underline">
              /api/seed
            </a>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 animate-stagger">
          {licenses.map((license: any) => {
            const pct      = Math.round(((license.usedSeats || 0) / (license.totalSeats || 1)) * 100);
            const isWarning = pct > 80;
            return (
              <div key={license._id}
                className={cn('glass-card rounded-2xl p-5 border', isWarning ? 'border-amber-500/20' : 'border-white/5')}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                      <Key className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{license.licenseName}</p>
                      <p className="text-xs text-slate-500">
                        {license.portalId?.name || 'Portal'}
                        {license.region && ` · ${license.region} Region`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    <span className={cn('text-sm font-bold',
                      pct > 90 ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-emerald-400')}>
                      {pct}% used
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{license.usedSeats || 0} used</span>
                    <span>{(license.totalSeats || 0) - (license.usedSeats || 0)} available</span>
                  </div>
                  <div className="h-2 bg-surface-4 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all',
                      pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-brand-500')}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-3/50 text-center">
                    <p className="text-lg font-bold text-white">{license.totalSeats}</p>
                    <p className="text-xs text-slate-500">Total Seats</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-3/50 text-center">
                    <p className="text-sm font-bold text-white font-mono">{license.licenseCode}</p>
                    <p className="text-xs text-slate-500">License Code</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-3/50 text-center">
                    <p className="text-xs font-medium text-white mt-1">
                      {license.expiresAt ? formatDate(license.expiresAt) : 'No expiry'}
                    </p>
                    <p className="text-xs text-slate-500">Expires</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add License Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-2 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold text-white">Add New License</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Portal *</label>
                <select value={form.portalId}
                  onChange={e => setForm(f => ({ ...f, portalId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm">
                  <option value="">— Select Portal —</option>
                  {portals.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {[
                { label: 'License Code *', key: 'licenseCode', placeholder: 'MS365-E3'          },
                { label: 'License Name *', key: 'licenseName', placeholder: 'Microsoft 365 E3'  },
                { label: 'Region',         key: 'region',      placeholder: 'India / Dubai (optional)' },
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
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Total Seats</label>
                  <input type="number" value={form.totalSeats}
                    onChange={e => setForm(f => ({ ...f, totalSeats: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Expires At</label>
                  <input type="date" value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-3 border border-white/8 text-white focus:outline-none focus:border-brand-500 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleAdd}
                disabled={saving || !form.portalId || !form.licenseCode || !form.licenseName}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? 'Adding...' : 'Add License'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}