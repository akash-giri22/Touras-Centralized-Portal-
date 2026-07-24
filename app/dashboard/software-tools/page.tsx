'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  GitBranch, Cloud, RefreshCw, Key,
  SendHorizonal, ArrowRight, Wrench,
} from 'lucide-react';
 
// ── Tool definitions per role ──────────────────────────────────
const TOOLS_BY_ROLE: Record<string, {
  label:       string;
  description: string;
  href:        string;
  icon:        React.ReactNode;
  color:       string;
  badge?:      string;
}[]> = {
  admin: [
    {
      label:       'Requests',
      description: 'Review and approve portal & license access requests from employees.',
      href:        '/dashboard/requests',
      icon:        <SendHorizonal className="w-6 h-6" />,
      color:       '#6366f1',
      badge:       'Access',
    },
    {
      label:       'AWS Requests',
      description: 'Manage AWS resource access requests — EC2, S3, IAM and more.',
      href:        '/dashboard/aws-requests',
      icon:        <Cloud className="w-6 h-6" />,
      color:       '#f59e0b',
      badge:       'AWS',
    },
    {
      label:       'Jira Integration',
      description: 'Manage Jira users — invite, suspend, remove and sync team members.',
      href:        '/dashboard/jira-integration',
      icon:        <GitBranch className="w-6 h-6" />,
      color:       '#0ea5e9',
      badge:       'Jira',
    },
    {
      label:       'AWS Integration',
      description: 'Manage AWS EC2 instances, S3 buckets, and IAM users directly.',
      href:        '/dashboard/aws-integration',
      icon:        <Cloud className="w-6 h-6" />,
      color:       '#f97316',
      badge:       'AWS',
    },
    {
      label:       'Sync from Entra ID',
      description: 'Sync users and groups from Microsoft Entra ID (Azure Active Directory).',
      href:        '/dashboard/sync',
      icon:        <RefreshCw className="w-6 h-6" />,
      color:       '#8b5cf6',
      badge:       'Azure',
    },
    {
      label:       'Licenses',
      description: 'Manage software licenses — add, track expiry, and assign to portals.',
      href:        '/dashboard/licenses',
      icon:        <Key className="w-6 h-6" />,
      color:       '#10b981',
      badge:       'License',
    },
  ],
  manager: [
    {
      label:       'Requests',
      description: 'Review and approve access requests from your team members.',
      href:        '/dashboard/requests',
      icon:        <SendHorizonal className="w-6 h-6" />,
      color:       '#6366f1',
      badge:       'Access',
    },
    {
      label:       'AWS Requests',
      description: 'Review AWS resource access requests from your team.',
      href:        '/dashboard/aws-requests',
      icon:        <Cloud className="w-6 h-6" />,
      color:       '#f59e0b',
      badge:       'AWS',
    },
    {
      label:       'Jira Integration',
      description: 'Manage Jira users — invite, suspend, remove and sync team members.',
      href:        '/dashboard/jira-integration',
      icon:        <GitBranch className="w-6 h-6" />,
      color:       '#0ea5e9',
      badge:       'Jira',
    },
    {
      label:       'AWS Integration',
      description: 'Manage AWS EC2 instances, S3 buckets, and IAM users.',
      href:        '/dashboard/aws-integration',
      icon:        <Cloud className="w-6 h-6" />,
      color:       '#f97316',
      badge:       'AWS',
    },
  ],
  employee: [
    {
      label:       'Requests',
      description: 'Request access to portals or licenses. Track your request status.',
      href:        '/dashboard/requests',
      icon:        <SendHorizonal className="w-6 h-6" />,
      color:       '#6366f1',
      badge:       'Access',
    },
    {
      label:       'AWS Requests',
      description: 'Request AWS resource access — EC2, S3 and more.',
      href:        '/dashboard/aws-requests',
      icon:        <Cloud className="w-6 h-6" />,
      color:       '#f59e0b',
      badge:       'AWS',
    },
  ],
};
 
export default function SoftwareToolsPage() {
  const { user } = useAuth();
  const router   = useRouter();
 
  if (!user) return null;
 
  const tools = TOOLS_BY_ROLE[user.role] || [];
 
  return (
    <div className="page-wrapper p-6 space-y-6 animate-fade-in">
 
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Software & Tools
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            All integrations, requests and tools in one place
          </p>
        </div>
      </div>
 
      {/* Info banner */}
      <div className="p-3 rounded-xl text-sm flex items-center gap-2"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-secondary)' }}>
        <Wrench className="w-4 h-4 shrink-0" style={{ color: '#818cf8' }} />
        Select a tool below to open it. Each tool opens in its own full page.
      </div>
 
      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => (
          <button
            key={tool.href}
            onClick={() => router.push(tool.href)}
            className="group text-left rounded-2xl p-5 transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--card-bg, var(--bg-surface-1))',
              border:     '1px solid var(--border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = tool.color + '60';
              e.currentTarget.style.boxShadow   = `0 4px 20px ${tool.color}18`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow   = 'none';
            }}
          >
            {/* Icon + Badge row */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: tool.color + '18', color: tool.color }}>
                {tool.icon}
              </div>
              {tool.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tool.color + '15', color: tool.color, border: `1px solid ${tool.color}30` }}>
                  {tool.badge}
                </span>
              )}
            </div>
 
            {/* Label */}
            <p className="font-semibold mb-1.5 text-sm" style={{ color: 'var(--text-primary)' }}>
              {tool.label}
            </p>
 
            {/* Description */}
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              {tool.description}
            </p>
 
            {/* Open arrow */}
            <div className="flex items-center gap-1 text-xs font-medium transition-all"
              style={{ color: tool.color }}>
              Open
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
 








