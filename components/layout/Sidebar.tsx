'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import {
  LayoutDashboard, ClipboardList, FolderOpen, Key, SendHorizonal,
  Users, ScrollText, GitBranch, LogOut, Globe, BarChart3,
  Briefcase, X, Sun, Moon, ShieldCheck, Cloud, Ticket, Wrench,
} from 'lucide-react';
 
const NAV_BY_ROLE: Record<string, any[]> = {
  employee: [
    { label: 'Dashboard',       href: '/dashboard',               icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Software & Tools', href: '/dashboard/software-tools', icon: <Wrench        className="w-4 h-4" /> },
    { label: 'My Work Logs',    href: '/dashboard/work-logs',     icon: <ClipboardList   className="w-4 h-4" /> },
    { label: 'My Access',       href: '/dashboard/my-access',     icon: <FolderOpen      className="w-4 h-4" /> },
    { label: 'My Groups',       href: '/dashboard/groups',        icon: <Users           className="w-4 h-4" /> },
    { label: 'My Tickets',      href: '/dashboard/tickets',       icon: <Ticket          className="w-4 h-4" /> },

  ],
  manager: [
    { label: 'Dashboard',        href: '/dashboard',               icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Access',        href: '/dashboard/my-access',     icon: <FolderOpen      className="w-4 h-4" /> },
    { label: 'My Work Logs',     href: '/dashboard/work-logs',     icon: <ClipboardList   className="w-4 h-4" /> },
    { label: 'Team Work Logs',   href: '/dashboard/team-work-logs', icon: <Briefcase      className="w-4 h-4" /> },
    { label: 'My Groups',        href: '/dashboard/groups',        icon: <Users           className="w-4 h-4" /> },
    { label: 'Team Portals',     href: '/dashboard/team-portals',  icon: <Globe           className="w-4 h-4" /> },
    { label: 'Tickets',          href: '/dashboard/tickets',       icon: <Ticket          className="w-4 h-4" /> },
    { label: 'Analytics',        href: '/dashboard/analytics',     icon: <BarChart3       className="w-4 h-4" /> },
    { label: 'Software & Tools', href: '/dashboard/software-tools', icon: <Wrench        className="w-4 h-4" /> },
  ],
  admin: [
    { label: 'Dashboard',        href: '/dashboard',               icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Software & Tools', href: '/dashboard/software-tools', icon: <Wrench        className="w-4 h-4" /> },
    { label: 'Portals',          href: '/dashboard/portals',       icon: <Globe           className="w-4 h-4" /> },
    { label: 'Users',            href: '/dashboard/users',         icon: <Users           className="w-4 h-4" /> },
    { label: 'Groups',           href: '/dashboard/groups',        icon: <Users           className="w-4 h-4" /> },
    { label: 'User Access View', href: '/dashboard/user-access',   icon: <ShieldCheck     className="w-4 h-4" /> },
    { label: 'Tickets',          href: '/dashboard/tickets',       icon: <Ticket          className="w-4 h-4" /> },
    { label: 'Work Logs Monitor', href: '/dashboard/jira-monitor', icon: <BarChart3       className="w-4 h-4" /> },
    { label: 'Audit Logs',       href: '/dashboard/audit-logs',    icon: <ScrollText      className="w-4 h-4" /> },
    { label: 'Analytics',        href: '/dashboard/analytics',     icon: <BarChart3       className="w-4 h-4" /> },
  ],
};
 
export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router   = useRouter();
 
  if (!user) return null;
  const navItems = NAV_BY_ROLE[user.role] || [];
 
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
 
  return (
    <aside className="w-64 h-full flex flex-col"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>
 
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-xl" style={{ background: 'white' }}>
              <img src="/images/Touras12334.png" alt="Touras"
                className="h-8 w-auto object-contain"
                onError={e => {
                  (e.target as any).style.display = 'none';
                  (e.target as any).parentElement.innerHTML =
                    '<span style="font-weight:900;color:#6366f1;font-size:18px">T</span>';
                }} />
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden" style={{ color: 'var(--text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
 
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          // Software & Tools active agar us page pe hain ya kisi bhi sub-tool pe
          const softwareToolsRoutes = [
            '/dashboard/software-tools',
            '/dashboard/requests',
            '/dashboard/aws-requests',
            '/dashboard/jira-integration',
            '/dashboard/aws-integration',
            '/dashboard/sync',
            '/dashboard/licenses',
          ];
          const active = item.href === '/dashboard/software-tools'
            ? softwareToolsRoutes.some(r => pathname === r || pathname.startsWith(r))
            : pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
 
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                color:      active ? '#818cf8' : 'var(--text-secondary)',
                border:     active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}>
              <span style={{ color: active ? '#818cf8' : 'var(--text-muted)' }}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
 
      {/* Role Badge */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#818cf8' }} />
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Logged in as</p>
            <p className="text-xs font-semibold capitalize" style={{ color: '#818cf8' }}>{user.role}</p>
          </div>
        </div>
      </div>
 
      {/* User + Actions */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1"
          style={{ background: 'var(--bg-surface-2)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-xs truncate"             style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        </div>
 
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
 
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
 








