import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Portal from '@/lib/models/Portal';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all');

    // If all=true, return all portals (for admin)
    // Otherwise return only active portals
    const query = all === 'true' ? {} : { isActive: true };
    const portals = await (Portal as any).find(query).sort({ category: 1 });
    return NextResponse.json(portals);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body   = await req.json();
    const portal = await (Portal as any).create(body);
    return NextResponse.json(portal, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body          = await req.json();
    const { id, ...update } = body;
    const portal = await (Portal as any).findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(portal);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}