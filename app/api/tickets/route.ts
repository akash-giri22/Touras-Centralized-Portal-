import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/lib/models/Ticket';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role   = searchParams.get('role');

    let query: any = {};
    if (role === 'employee') query.raisedBy = userId;

    const tickets = await (Ticket as any).find(query)
      .populate('raisedBy',  'name email')
      .populate('assignedTo','name email')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(tickets);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body   = await req.json();
   const ticket = await (Ticket as any).create({
  title: body.title,
  description: body.description,
  category: body.category || 'other',
  priority: body.priority || 'medium',
  raisedBy: body.raisedBy,
  assignedTo: body.assignedTo || null,
});
    const populated = await (Ticket as any).findById(ticket._id)
  .populate('raisedBy', 'name email')
  .populate('assignedTo', 'name email');
    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, status, assignedTo, comment, userId } = await req.json();
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

    const update: any = {};
    if (status)     update.status     = status;
    if (assignedTo) update.assignedTo = assignedTo;
    if (status === 'resolved') update.resolvedAt = new Date();

    let ticket;
    if (comment && userId) {
      ticket = await (Ticket as any).findByIdAndUpdate(
        id,
        {
          ...update,
          $push: { comments: { userId, text: comment, createdAt: new Date() } },
        },
        { new: true }
      ).populate('raisedBy','name email')
       .populate('assignedTo','name email')
       .populate('comments.userId','name');
    } else {
      ticket = await (Ticket as any).findByIdAndUpdate(id, update, { new: true })
        .populate('raisedBy','name email')
        .populate('assignedTo','name email');
    }

    return NextResponse.json(ticket);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { id } = await req.json();
    await (Ticket as any).findByIdAndDelete(id);
    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}