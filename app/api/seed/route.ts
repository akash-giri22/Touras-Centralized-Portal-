import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Portal from '@/lib/models/Portal';
import License from '@/lib/models/License';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();

    // ── Drop and re-seed Portals with adminUrl ──
    await (Portal as any).deleteMany({});
    await (Portal as any).insertMany([
      {
        name: 'Microsoft 365', icon: 'M',
        baseUrl:  'https://www.office.com',
        adminUrl: 'https://admin.microsoft.com',
        description: 'Office suite & email', category: 'Productivity', color: '#0078D4',
      },
      {
        name: 'Jira', icon: 'J',
        baseUrl:  'https://tourastest.atlassian.net/jira/your-work',
        adminUrl: 'https://admin.atlassian.com',
        description: 'Project management', category: 'Development', color: '#0052CC',
      },
      {
        name: 'AWS Console', icon: 'A',
        baseUrl:  'https://console.aws.amazon.com',
        adminUrl: 'https://console.aws.amazon.com/iam',
        description: 'Cloud infrastructure', category: 'Infrastructure', color: '#FF9900', regionBased: true,
      },
      {
        name: 'Keka HR', icon: 'K',
        baseUrl:  'https://app.keka.com',
        adminUrl: 'https://app.keka.com/admin',
        description: 'HR & payroll', category: 'HR', color: '#E91E63',
      },
      {
        name: 'Bitbucket', icon: 'B',
        baseUrl:  'https://bitbucket.org',
        adminUrl: 'https://bitbucket.org/account/admin',
        description: 'Source code repos', category: 'Development', color: '#0047B3',
      },
      {
        name: 'Postman', icon: 'P',
        baseUrl:  'https://app.getpostman.com',
        adminUrl: 'https://app.getpostman.com/settings/team',
        description: 'API testing platform', category: 'Development', color: '#FF6C37',
      },
      {
        name: 'Confluence', icon: 'C',
        baseUrl:  'https://confluence.atlassian.com',
        adminUrl: 'https://admin.atlassian.com',
        description: 'Team wiki & docs', category: 'Documentation', color: '#172B4D',
      },
      {
        name: 'GitHub', icon: 'G',
        baseUrl:  'https://github.com',
        adminUrl: 'https://github.com/orgs/touras/settings',
        description: 'Code hosting', category: 'Development', color: '#24292F',
      },
    ]);

    // ── Seed Licenses ──
    const licenseCount = await (License as any).countDocuments();
    if (licenseCount === 0) {
      const ms365   = await (Portal as any).findOne({ name: 'Microsoft 365' });
      const jira    = await (Portal as any).findOne({ name: 'Jira' });
      const aws     = await (Portal as any).findOne({ name: 'AWS Console' });
      const postman = await (Portal as any).findOne({ name: 'Postman' });

      if (ms365 && jira && aws && postman) {
        await (License as any).insertMany([
          { portalId: ms365._id,   licenseCode: 'MS365-E3',  licenseName: 'Microsoft 365 E3',  totalSeats: 50, usedSeats: 0, expiresAt: '2025-12-31' },
          { portalId: jira._id,    licenseCode: 'JIRA-PRE',  licenseName: 'Jira Premium',       totalSeats: 30, usedSeats: 0, expiresAt: '2025-09-30' },
          { portalId: aws._id,     licenseCode: 'AWS-IN',    licenseName: 'AWS India Region',   totalSeats: 10, usedSeats: 0, region: 'India' },
          { portalId: aws._id,     licenseCode: 'AWS-DXB',   licenseName: 'AWS Dubai Region',   totalSeats: 5,  usedSeats: 0, region: 'Dubai' },
          { portalId: postman._id, licenseCode: 'POST-ENT',  licenseName: 'Postman Enterprise', totalSeats: 20, usedSeats: 0, expiresAt: '2025-06-30' },
        ]);
      }
    }

    // ── Seed Admin ──
    const adminExists = await (User as any).findOne({ email: 'admin@touras.com' });
    if (!adminExists) {
      const hash = await bcrypt.hash('admin123', 10);
      await (User as any).create({
        email: 'admin@touras.com', name: 'Portal Admin',
        role: 'admin', passwordHash: hash, isActive: true,
      });
    }

    return NextResponse.json({ message: '✅ Database seeded with admin URLs!' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}