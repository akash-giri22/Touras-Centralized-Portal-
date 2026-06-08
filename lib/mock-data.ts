// lib/mock-data.ts
import { User, Portal, License, WorkLog, AccessRequest, AuditLog } from '@/types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Arjun Sharma', email: 'admin@touras.com', role: 'admin', isActive: true, createdAt: '2024-01-01', department: 'IT' },
  { id: '2', name: 'Priya Mehta', email: 'manager@touras.com', role: 'manager', isActive: true, createdAt: '2024-01-02', department: 'Engineering', managerId: '1', managerName: 'Arjun Sharma' },
  { id: '3', name: 'Rohan Gupta', email: 'employee@touras.com', role: 'employee', isActive: true, createdAt: '2024-01-03', department: 'Engineering', managerId: '2', managerName: 'Priya Mehta' },
  { id: '4', name: 'Sneha Patel', email: 'sneha@touras.com', role: 'employee', isActive: true, createdAt: '2024-01-04', department: 'Design', managerId: '2', managerName: 'Priya Mehta' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@touras.com', role: 'employee', isActive: false, createdAt: '2024-01-05', department: 'QA', managerId: '2', managerName: 'Priya Mehta' },
];

export const MOCK_PORTALS: Portal[] = [
  { id: 'p1', name: 'Microsoft 365', type: 'external', icon: 'M', baseUrl: 'https://www.office.com', isActive: true, description: 'Office suite & email', category: 'Productivity', color: '#0078D4' },
  { id: 'p2', name: 'Jira', type: 'external', icon: 'J', baseUrl: 'https://jira.atlassian.com', isActive: true, description: 'Project management', category: 'Development', color: '#0052CC' },
  { id: 'p3', name: 'AWS Console', type: 'external', icon: 'A', baseUrl: 'https://console.aws.amazon.com', isActive: true, regionBased: true, description: 'Cloud infrastructure', category: 'Infrastructure', color: '#FF9900' },
  { id: 'p4', name: 'Keka HR', type: 'external', icon: 'K', baseUrl: 'https://touras.keka.com', isActive: true, description: 'HR & payroll', category: 'HR', color: '#E91E63' },
  { id: 'p5', name: 'Bitbucket', type: 'external', icon: 'B', baseUrl: 'https://bitbucket.org', isActive: true, description: 'Source code repos', category: 'Development', color: '#0047B3' },
  { id: 'p6', name: 'Postman', type: 'external', icon: 'P', baseUrl: 'https://app.getpostman.com', isActive: true, description: 'API testing platform', category: 'Development', color: '#FF6C37' },
  { id: 'p7', name: 'Confluence', type: 'external', icon: 'C', baseUrl: 'https://confluence.atlassian.com', isActive: true, description: 'Team wiki & docs', category: 'Documentation', color: '#172B4D' },
  { id: 'p8', name: 'GitHub', type: 'external', icon: 'G', baseUrl: 'https://github.com', isActive: true, description: 'Code hosting', category: 'Development', color: '#24292F' },
];

export const MOCK_LICENSES: License[] = [
  { id: 'l1', portalId: 'p1', portalName: 'Microsoft 365', licenseCode: 'MS365-E3', licenseName: 'Microsoft 365 E3', totalSeats: 50, usedSeats: 32, expiresAt: '2025-12-31' },
  { id: 'l2', portalId: 'p2', portalName: 'Jira', licenseCode: 'JIRA-PRE', licenseName: 'Jira Premium', totalSeats: 30, usedSeats: 18, expiresAt: '2025-09-30' },
  { id: 'l3', portalId: 'p3', portalName: 'AWS Console', licenseCode: 'AWS-IN', licenseName: 'AWS India Region', region: 'India', totalSeats: 10, usedSeats: 7 },
  { id: 'l4', portalId: 'p3', portalName: 'AWS Console', licenseCode: 'AWS-DXB', licenseName: 'AWS Dubai Region', region: 'Dubai', totalSeats: 5, usedSeats: 2 },
  { id: 'l5', portalId: 'p6', portalName: 'Postman', licenseCode: 'POST-ENT', licenseName: 'Postman Enterprise', totalSeats: 20, usedSeats: 11, expiresAt: '2025-06-30' },
];

export const MOCK_WORKLOGS: WorkLog[] = [
  { id: 'w1', userId: '3', userName: 'Rohan Gupta', workDescription: 'Implemented authentication module with JWT tokens and refresh logic', hoursSpent: 4, status: 'completed', logDate: '2025-04-28', createdAt: '2025-04-28', project: 'Touras Portal', tags: ['backend', 'auth'] },
  { id: 'w2', userId: '3', userName: 'Rohan Gupta', workDescription: 'Fixed UI bugs in dashboard — sidebar collapse, mobile responsiveness', hoursSpent: 2, status: 'completed', logDate: '2025-04-27', createdAt: '2025-04-27', project: 'Touras Portal', tags: ['frontend'], managerComment: 'Good work! Keep it up.' },
  { id: 'w3', userId: '3', userName: 'Rohan Gupta', workDescription: 'Working on access request API integration', hoursSpent: 3, status: 'in-progress', logDate: '2025-04-29', createdAt: '2025-04-29', project: 'Touras Portal', tags: ['api'] },
  { id: 'w4', userId: '4', userName: 'Sneha Patel', workDescription: 'Designed new onboarding flow mockups in Figma', hoursSpent: 5, status: 'completed', logDate: '2025-04-28', createdAt: '2025-04-28', project: 'Design System', tags: ['design'] },
  { id: 'w5', userId: '4', userName: 'Sneha Patel', workDescription: 'Reviewed design system tokens and updated color palette', hoursSpent: 2, status: 'pending', logDate: '2025-04-29', createdAt: '2025-04-29', project: 'Design System', tags: ['design'] },
  { id: 'w6', userId: '2', userName: 'Priya Mehta', workDescription: 'Sprint planning for Q2 — assigned tickets, reviewed velocity', hoursSpent: 3, status: 'completed', logDate: '2025-04-28', createdAt: '2025-04-28', project: 'Management', tags: ['planning'] },
];

export const MOCK_REQUESTS: AccessRequest[] = [
  { id: 'r1', userId: '3', userName: 'Rohan Gupta', type: 'portal', targetId: 'p3', targetName: 'AWS Console', reason: 'Need access for infrastructure monitoring and deployment', status: 'pending', requestedAt: '2025-04-29', managerId: '2' },
  { id: 'r2', userId: '4', userName: 'Sneha Patel', type: 'license', targetId: 'l2', targetName: 'Jira Premium', reason: 'Need Jira access to track design tasks and sprint boards', status: 'manager-approved', requestedAt: '2025-04-27', managerId: '2', managerNote: 'Approved. Design team needs Jira.' },
  { id: 'r3', userId: '3', userName: 'Rohan Gupta', type: 'license', targetId: 'l5', targetName: 'Postman Enterprise', reason: 'API testing for backend development', status: 'admin-approved', requestedAt: '2025-04-25', managerId: '2', managerNote: 'Approved', adminNote: 'License assigned' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', userId: '3', userName: 'Rohan Gupta', action: 'LOGIN', timestamp: '2025-04-29T09:15:00Z', ip: '192.168.1.45' },
  { id: 'a2', userId: '4', userName: 'Sneha Patel', action: 'LOGIN', timestamp: '2025-04-29T09:22:00Z', ip: '192.168.1.67' },
  { id: 'a3', userId: '3', userName: 'Rohan Gupta', action: 'ACCESS_REQUEST', target: 'AWS Console', timestamp: '2025-04-29T10:05:00Z', ip: '192.168.1.45' },
  { id: 'a4', userId: '2', userName: 'Priya Mehta', action: 'APPROVE_REQUEST', target: 'Jira Premium for Sneha Patel', timestamp: '2025-04-28T14:30:00Z', ip: '192.168.1.12' },
  { id: 'a5', userId: '1', userName: 'Arjun Sharma', action: 'USER_ACTIVATED', target: 'Rohan Gupta', timestamp: '2025-04-27T11:00:00Z', ip: '192.168.1.1' },
  { id: 'a6', userId: '1', userName: 'Arjun Sharma', action: 'LICENSE_ASSIGNED', target: 'Postman Enterprise → Rohan Gupta', timestamp: '2025-04-27T11:05:00Z', ip: '192.168.1.1' },
];
