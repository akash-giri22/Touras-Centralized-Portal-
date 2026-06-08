'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/layout/Sidebar';
import { Menu } from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (isLoading || !user) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}
      className="flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }} />
    </div>
  );

  const segments  = pathname.replace('/dashboard', '').split('/').filter(Boolean);
  const breadcrumb = ['Home', ...segments.map(s =>
    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))];

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden sm:flex items-center gap-1.5 text-sm">
              {breadcrumb.map((seg, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span style={{ color: 'var(--text-muted)' }}>/</span>}
                  <span style={{ color: i === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    className={i === breadcrumb.length - 1 ? 'font-medium' : ''}>
                    {seg}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
          <NotificationBell />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}