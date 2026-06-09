import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/lib/models/Ticket';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
 
// ── Notification helper ──
async function notify(userId: string, title: string, message: string, type: string, link?: string) {
  try {
    await (Notification as any).create({ userId, title, message, type, link: link || null });
  } catch {}
}
 
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role   = searchParams.get('role');
 
    let query: any = {};
 
    if (role === 'employee' && userId) {
      // ✅ FIXED: show tickets raised BY employee OR assigned TO employee
      query = {
        $or: [
          { raisedBy:   userId },
          { assignedTo: userId },
        ],
      };
    }
    // admin/manager: no filter → all tickets
 
    const tickets = await (Ticket as any).find(query)
      .populate('raisedBy',        'name email')
      .populate('assignedTo',      'name email')
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
    const body = await req.json();
 
    const ticket = await (Ticket as any).create({
      title:       body.title,
      description: body.description,
      category:    body.category   || 'other',
      priority:    body.priority   || 'medium',
      raisedBy:    body.raisedBy,
      assignedTo:  body.assignedTo || null,
    });
 
    const populated = await (Ticket as any).findById(ticket._id)
      .populate('raisedBy',   'name email')
      .populate('assignedTo', 'name email');
 
    // ✅ Notify assigned user if someone was tagged
    if (body.assignedTo) {
      const raiser = await (User as any).findById(body.raisedBy).select('name');
      await notify(
        body.assignedTo,
        '🎫 Ticket Assigned to You',
        `${raiser?.name || 'Someone'} assigned ticket "${body.title}" to you.`,
        'info',
        '/dashboard/tickets'
      );
    }
 
    // ✅ Notify admins + managers about new ticket
    const managers = await (User as any).find({
      role:     { $in: ['admin', 'manager'] },
      isActive: true,
      _id:      { $ne: body.assignedTo }, // don't double-notify if admin was tagged
    });
 
    for (const u of managers) {
      await notify(
        u._id.toString(),
        '🔔 New Support Ticket',
        `A new ticket "${body.title}" has been raised and needs attention.`,
        'info',
        '/dashboard/tickets'
      );
    }
 
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
 
    // Get old ticket before update (for notification comparison)
    const oldTicket = await (Ticket as any).findById(id)
      .populate('raisedBy', 'name email');
 
    if (!oldTicket) return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
 
    const update: any = {};
    if (status)              update.status     = status;
    if (assignedTo)          update.assignedTo = assignedTo;
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
      ).populate('raisedBy',        'name email')
       .populate('assignedTo',      'name email')
       .populate('comments.userId', 'name');
    } else {
      ticket = await (Ticket as any).findByIdAndUpdate(id, update, { new: true })
        .populate('raisedBy',   'name email')
        .populate('assignedTo', 'name email');
    }
 
    const raiserId = oldTicket.raisedBy?._id?.toString() || oldTicket.raisedBy?.toString();
 
    // ✅ Notify raiser on status change
    if (status && raiserId) {
      if (status === 'resolved') {
        await notify(
          raiserId,
          '✅ Ticket Resolved',
          `Your ticket "${oldTicket.title}" has been marked as resolved.`,
          'success',
          '/dashboard/tickets'
        );
      } else if (status === 'closed') {
        await notify(
          raiserId,
          '🔒 Ticket Closed',
          `Your ticket "${oldTicket.title}" has been closed.`,
          'info',
          '/dashboard/tickets'
        );
      } else if (status === 'in-progress') {
        await notify(
          raiserId,
          '⚙️ Ticket In Progress',
          `Your ticket "${oldTicket.title}" is now being worked on.`,
          'info',
          '/dashboard/tickets'
        );
      }
    }
 
    // ✅ Notify newly assigned user
    if (assignedTo && assignedTo !== oldTicket.assignedTo?.toString()) {
      await notify(
        assignedTo,
        '🎫 Ticket Assigned to You',
        `Ticket "${oldTicket.title}" has been assigned to you.`,
        'info',
        '/dashboard/tickets'
      );
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
 








