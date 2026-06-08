import { NextRequest, NextResponse } from 'next/server';
import JiraAccess from '@/lib/models/JiraAccess';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

const JIRA_BASE_URL  = process.env.JIRA_BASE_URL!;
const JIRA_EMAIL     = process.env.JIRA_ADMIN_EMAIL!;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;

const jiraAuth = () => ({
  'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
  'Accept':        'application/json',
  'Content-Type':  'application/json',
});

// ── GET — Fetch + Sync users ──
export async function GET() {
  try {
    await connectDB();

    const res = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/users/search?maxResults=200`,
      { headers: jiraAuth() }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ message: `Jira API error: ${err}` }, { status: res.status });
    }

    const allUsers = await res.json();

    const realUsers = allUsers.filter((u: any) =>
      u.accountType === 'atlassian' &&
      u.displayName &&
      !['Bot','bot','Automation','addon','App'].some(x => u.displayName.includes(x))
    );

    const detailedUsers = await Promise.all(
      realUsers.map(async (u: any) => {
        try {
          const r = await fetch(
            `${JIRA_BASE_URL}/rest/api/3/user?accountId=${u.accountId}`,
            { headers: jiraAuth() }
          );
          if (r.ok) {
            const d = await r.json();
            return { ...u, emailAddress: d.emailAddress || '', active: d.active, avatarUrls: d.avatarUrls };
          }
        } catch {}
        return u;
      })
    );

    for (const u of detailedUsers) {
      const existing = await (JiraAccess as any).findOne({ accountId: u.accountId });
      let status = 'active';
      if (existing?.status === 'removed')        status = 'removed';
      else if (existing?.status === 'suspended') status = 'suspended';
      else if (u.active === false)               status = 'suspended';
      else                                        status = 'active';

      await (JiraAccess as any).findOneAndUpdate(
        { accountId: u.accountId },
        {
          accountId:   u.accountId,
          displayName: u.displayName,
          email:       u.emailAddress || existing?.email || '',
          avatarUrl:   u.avatarUrls?.['48x48'] || existing?.avatarUrl || null,
          status,
        },
        { upsert: true, new: true }
      );
    }

    const dbUsers = await (JiraAccess as any).find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(dbUsers);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── PUT — Invite user ──
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { email, displayName } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/user`, {
      method: 'POST', headers: jiraAuth(),
      body: JSON.stringify({
        emailAddress: email,
        displayName:  displayName || email.split('@')[0],
        notification: true,
        products:     ['jira-software'],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let msg = 'Failed to invite';
      try { const j = JSON.parse(errText); msg = j.errorMessages?.[0] || j.errors?.emailAddress || msg; } catch {}
      return NextResponse.json({ message: msg }, { status: res.status });
    }

    const newUser = await res.json();
    await (JiraAccess as any).findOneAndUpdate(
      { accountId: newUser.accountId },
      { accountId: newUser.accountId, displayName: newUser.displayName || displayName, email, avatarUrl: null, status: 'invited' },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: `Invite sent to ${email}`, user: newUser }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── PATCH — Revoke Jira Access (works on free plan) ──
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { accountId } = await req.json();
    if (!accountId) return NextResponse.json({ message: 'accountId required' }, { status: 400 });

    // Remove user from jira-software product — this revokes Jira access
    // Works on free plan unlike disable/suspend
    
    // Best available approach for free plan:
    // Remove from all groups which revokes project access
    const groupsRes = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/user/groups?accountId=${accountId}`,
      { headers: jiraAuth() }
    );

    let jiraSuccess = false;

    if (groupsRes.ok) {
      const groups = await groupsRes.json();
      // Remove from all groups
      for (const group of groups) {
        await fetch(
          `${JIRA_BASE_URL}/rest/api/3/group/user?groupId=${group.groupId}&accountId=${accountId}`,
          { method: 'DELETE', headers: jiraAuth() }
        );
      }
      jiraSuccess = true;
    }

    // Update DB
    await (JiraAccess as any).findOneAndUpdate({ accountId }, { status: 'suspended' });

    return NextResponse.json({
      message: jiraSuccess
        ? 'User access revoked in Jira and database'
        : 'Access revoked in database',
      jiraSuccess,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── POST — Restore access ──
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { accountId } = await req.json();
    if (!accountId) return NextResponse.json({ message: 'accountId required' }, { status: 400 });

    // Add back to default jira-software-users group
    const groupRes = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/group/user`,
      {
        method:  'POST',
        headers: jiraAuth(),
        body: JSON.stringify({
          groupId:   'jira-software-users',
          accountId,
        }),
      }
    );

    // Also try by name
    const groupRes2 = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/group/user?groupname=jira-software-users`,
      {
        method:  'POST',
        headers: jiraAuth(),
        body:    JSON.stringify({ accountId }),
      }
    );

    await (JiraAccess as any).findOneAndUpdate({ accountId }, { status: 'active' });

    return NextResponse.json({ message: 'User access restored in Jira and database' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── DELETE — Remove user from Jira ──
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { accountId } = await req.json();
    if (!accountId) return NextResponse.json({ message: 'accountId required' }, { status: 400 });

    const res = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/user?accountId=${accountId}`,
      { method: 'DELETE', headers: jiraAuth() }
    );

    await (JiraAccess as any).findOneAndUpdate({ accountId }, { status: 'removed' });

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ message: 'User removed from Jira and database' });
    }

    return NextResponse.json({ message: 'Removed from database' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}