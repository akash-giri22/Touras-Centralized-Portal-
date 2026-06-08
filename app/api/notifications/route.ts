import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';

// ── GET — Fetch notifications for user ──
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json([], { status: 200 });

    const notifications = await (Notification as any).find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(notifications);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── POST — Create notification ──
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Can create for single user or multiple users
    if (Array.isArray(body.userIds)) {
      const notifications = body.userIds.map((userId: string) => ({
        userId,
        title:   body.title,
        message: body.message,
        type:    body.type || 'info',
        link:    body.link || null,
      }));
      await (Notification as any).insertMany(notifications);
      return NextResponse.json({ message: 'Notifications sent' }, { status: 201 });
    }

    const notification = await (Notification as any).create({
      userId:  body.userId,
      title:   body.title,
      message: body.message,
      type:    body.type || 'info',
      link:    body.link || null,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── PATCH — Mark as read ──
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, userId, markAll } = await req.json();

    if (markAll && userId) {
      await (Notification as any).updateMany({ userId, isRead: false }, { isRead: true });
      return NextResponse.json({ message: 'All marked as read' });
    }

    if (id) {
      await (Notification as any).findByIdAndUpdate(id, { isRead: true });
      return NextResponse.json({ message: 'Marked as read' });
    }

    return NextResponse.json({ message: 'id or markAll required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// ── DELETE — Delete notification ──
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { id, userId, deleteAll } = await req.json();

    if (deleteAll && userId) {
      await (Notification as any).deleteMany({ userId });
      return NextResponse.json({ message: 'All notifications cleared' });
    }

    if (id) {
      await (Notification as any).findByIdAndDelete(id);
      return NextResponse.json({ message: 'Notification deleted' });
    }

    return NextResponse.json({ message: 'id required' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}