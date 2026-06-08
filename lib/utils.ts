// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'in-progress': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'manager-approved': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'admin-approved': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    inactive: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  };
  return map[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}
