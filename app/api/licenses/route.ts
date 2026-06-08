import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import License from '@/lib/models/License';

export async function GET() {
  try {
    await connectDB();
    const licenses = await (License as any).find()
      .populate('portalId', 'name color icon')
      .sort({ createdAt: -1 });
    return NextResponse.json(licenses);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body    = await req.json();
    const license = await (License as any).create(body);
    return NextResponse.json(license, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...update } = body;
    const license = await (License as any).findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(license);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}