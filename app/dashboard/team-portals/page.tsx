'use client';
// app/dashboard/team-portals/page.tsx

import { MOCK_PORTALS, MOCK_USERS } from '@/lib/mock-data';
import { ExternalLink } from 'lucide-react';

export default function TeamPortalsPage() {
  const teamMembers = MOCK_USERS.filter(u => u.role === 'employee');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Portals</h1>
        <p className="text-slate-400 text-sm mt-1">View portals accessible by your team members</p>
      </div>

      {teamMembers.map(member => (
        <div key={member.id} className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center text-sm font-bold text-brand-300">
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-white">{member.name}</p>
              <p className="text-xs text-slate-500">{member.department} · {member.email}</p>
            </div>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${member.isActive ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MOCK_PORTALS.slice(0, 4).map(p => (
              <a key={p.id} href={p.baseUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-3/50 hover:bg-surface-3 border border-white/3 hover:border-brand-500/20 transition-all group">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: (p.color || '#6366f1') + '30', color: p.color || '#6366f1' }}>
                  {p.icon}
                </div>
                <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{p.name}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
