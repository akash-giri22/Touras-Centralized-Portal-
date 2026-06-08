import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    const users = await (User as any).find()
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const hash = await bcrypt.hash(body.password || 'Welcome@123', 10);

    const user = await (User as any).create({
      ...body,
      passwordHash: hash,
      reportingManagerId: body.reportingManagerId || null,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...update } = body;

    const user = await (User as any).findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}