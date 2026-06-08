'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Key } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function MyLicensesPage() {
  const { user }   = useAuth();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // For now show all licenses — later filter by assigned licenses
    fetch('/api/licenses')
      .then(r => r.json())
      .then(data => {
        setLicenses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Licenses</h1>
        <p className="text-slate-400 text-sm mt-1">Software licenses assigned to you</p>
      </div>

      {licenses.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-slate-400">No licenses assigned yet.</p>
          <p className="text-slate-500 text-sm mt-1">Request license access from the Requests page.</p>
        </div>
      ) : (
        <div className="grid gap-4 animate-stagger">
          {licenses.map((license: any) => {
            const pct = Math.round(((license.usedSeats || 0) / (license.totalSeats || 1)) * 100);
            return (
              <div key={license._id} className="glass-card rounded-2xl p-5 border border-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                      <Key className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{license.licenseName}</p>
                      <p className="text-xs text-slate-500">
                        {license.portalId?.name || 'Portal'}
                        {license.region && ` · ${license.region}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-medium">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-surface-3/50">
                    <p className="text-xs text-slate-500 mb-1">License Code</p>
                    <p className="text-white font-mono text-xs">{license.licenseCode}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-3/50">
                    <p className="text-xs text-slate-500 mb-1">Seats Used</p>
                    <p className="text-white">{license.usedSeats} / {license.totalSeats}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-3/50">
                    <p className="text-xs text-slate-500 mb-1">Expires</p>
                    <p className="text-white text-xs">
                      {license.expiresAt ? formatDate(license.expiresAt) : 'No expiry'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}