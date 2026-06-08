// types/index.ts

export type Role = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  createdAt: string;
  department?: string;
  avatar?: string;
}

export interface Portal {
  id: string;
  name: string;
  type: 'internal' | 'external';
  icon: string;
  baseUrl: string;
  isActive: boolean;
  regionBased?: boolean;
  description?: string;
  category?: string;
  color?: string;
}

export interface License {
  id: string;
  portalId: string;
  portalName: string;
  licenseCode: string;
  licenseName: string;
  region?: string;
  totalSeats: number;
  usedSeats: number;
  expiresAt?: string;
}

export interface WorkLog {
  id: string;
  userId: string;
  userName?: string;
  workDescription: string;
  hoursSpent: number;
  status: 'pending' | 'in-progress' | 'completed';
  logDate: string;
  createdAt: string;
  managerComment?: string;
  tags?: string[];
  project?: string;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userName?: string;
  type: 'portal' | 'license';
  targetId: string;
  targetName: string;
  reason: string;
  status: 'pending' | 'manager-approved' | 'admin-approved' | 'rejected';
  requestedAt: string;
  managerId?: string;
  managerNote?: string;
  adminNote?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  ip?: string;
}
