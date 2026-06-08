import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import WorkLog from '@/lib/models/WorkLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId    = searchParams.get('userId');
    const managerId = searchParams.get('managerId');

    let users: any[] = [];

    if (managerId) {
      // Get team members of this manager
      const User = (await import('@/lib/models/User')).default;
      const teamMembers = await (User as any).find({ managerId });
      const teamIds = teamMembers.map((u: any) => u._id);
      users = teamIds;
    }

    let query: any = {};
    if (userId)    query.userId = userId;
    if (managerId) query.userId = { $in: users };

    const logs = await (WorkLog as any).find(query)
      .populate('userId', 'name email role')
      .sort({ logDate: -1 });

    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const log  = await (WorkLog as any).create(body);
    const populated = await (WorkLog as any).findById(log._id).populate('userId', 'name email');
    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body        = await req.json();
    const { id, ...update } = body;
    const log = await (WorkLog as any).findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(log);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}