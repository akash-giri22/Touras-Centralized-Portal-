 import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Group from '@/lib/models/Group';

// ── GET — All groups ──
export async function GET() {
  try {
    await connectDB();
    const groups = await (Group as any).find()
      .populate('leadId',    'name email role')
      .populate('memberIds', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return NextResponse.json(groups);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── POST — Create group ──
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const group = await (Group as any).create({
      name:        body.name,
      description: body.description || '',
      leadId:      body.leadId,
      memberIds:   body.memberIds || [],
      createdBy:   body.createdBy,
    });
    const populated = await (Group as any).findById(group._id)
      .populate('leadId',    'name email role')
      .populate('memberIds', 'name email role')
      .populate('createdBy', 'name email');
    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── PATCH — Update group ──
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, name, description, leadId, memberIds, isActive } = await req.json();
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

    const update: any = {};
    if (name        !== undefined) update.name        = name;
    if (description !== undefined) update.description = description;
    if (leadId      !== undefined) update.leadId      = leadId;
    if (memberIds   !== undefined) update.memberIds   = memberIds;
    if (isActive    !== undefined) update.isActive    = isActive;

    const group = await (Group as any).findByIdAndUpdate(id, update, { new: true })
      .populate('leadId',    'name email role')
      .populate('memberIds', 'name email role')
      .populate('createdBy', 'name email');

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── DELETE — Delete group ──
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });
    await (Group as any).findByIdAndDelete(id);
    return NextResponse.json({ message: 'Group deleted' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}