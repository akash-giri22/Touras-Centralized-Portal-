 import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PortalAccess from '@/lib/models/PortalAccess';

// GET — fetch users who have access to a portal, or portals a user has access to
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get('portalId');
    const userId   = searchParams.get('userId');

    if (portalId) {
      const access = await (PortalAccess as any).find({ portalId })
        .populate('userId', 'name email role');
      return NextResponse.json(access);
    }

    if (userId) {
      const access = await (PortalAccess as any).find({ userId })
        .populate('portalId', 'name icon color baseUrl adminUrl description category isActive');
      return NextResponse.json(access);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// POST — grant portal access to user
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId, portalId, grantedBy } = await req.json();

    if (!userId || !portalId || !grantedBy) {
      return NextResponse.json({ message: 'userId, portalId, grantedBy required' }, { status: 400 });
    }

    // upsert — avoid duplicate
    const access = await (PortalAccess as any).findOneAndUpdate(
      { userId, portalId },
      { userId, portalId, grantedBy },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: 'Access granted', access }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// DELETE — revoke portal access
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { userId, portalId } = await req.json();

    if (!userId || !portalId) {
      return NextResponse.json({ message: 'userId and portalId required' }, { status: 400 });
    }

    await (PortalAccess as any).findOneAndDelete({ userId, portalId });
    return NextResponse.json({ message: 'Access revoked' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
