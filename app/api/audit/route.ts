import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AuditLog from '@/lib/models/AuditLog';

export async function GET() {
  try {
    await connectDB();
    const logs = await (AuditLog as any).find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const log  = await (AuditLog as any).create(body);
    return NextResponse.json(log, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}