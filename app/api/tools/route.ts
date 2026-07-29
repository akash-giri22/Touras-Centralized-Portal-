import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Tool from '@/lib/models/Tool';
 
// GET — fetch all active tools (filtered by role if passed)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const all  = searchParams.get('all'); // admin: show all incl inactive
 
    let query: any = all === 'true' ? {} : { isActive: true };
    if (role && all !== 'true') {
      query.roles = { $in: [role] };
    }
 
    const tools = await (Tool as any).find(query).sort({ createdAt: -1 });
    return NextResponse.json(tools);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
 
// POST — create new tool
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const tool = await (Tool as any).create(body);
    return NextResponse.json(tool, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
 
// PATCH — update tool (toggle active, edit details)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body        = await req.json();
    const { id, ...update } = body;
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });
    const tool = await (Tool as any).findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(tool);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
 
// DELETE — remove tool
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { id } = await req.json();
    await (Tool as any).findByIdAndDelete(id);
    return NextResponse.json({ message: 'Tool deleted' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
 








