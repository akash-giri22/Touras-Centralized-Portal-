import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AccessRequest from '@/lib/models/AccessRequest';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';

// ── Notification helper ──
async function notify(userId: string, title: string, message: string, type: string, link?: string) {
  try {
    await connectDB();
    await (Notification as any).create({ userId, title, message, type, link: link || null });
  } catch {}
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const requests = await (AccessRequest as any).find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(requests);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body    = await req.json();
    const request = await (AccessRequest as any).create(body);

    // Notify all admins and managers about new request
    const adminsManagers = await (User as any).find({
      role:     { $in: ['admin', 'manager'] },
      isActive: true,
    });

    for (const u of adminsManagers) {
      await notify(
        u._id.toString(),
        '🔔 New Access Request',
        `A new access request has been submitted and needs your review.`,
        'info',
        '/dashboard/requests'
      );
    }

    return NextResponse.json(request, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body            = await req.json();
    const { id, ...update } = body;

    const oldRequest = await (AccessRequest as any).findById(id).populate('userId', 'name email');

    const request = await (AccessRequest as any).findByIdAndUpdate(
      id, update, { new: true }
    ).populate('userId', 'name email');

    // Send notification based on status change
    if (update.status && oldRequest?.userId) {
      const requesterId = oldRequest.userId._id?.toString() || oldRequest.userId.toString();

      if (update.status === 'approved') {
        await notify(
          requesterId,
          '✅ Request Approved!',
          `Your access request has been approved.`,
          'success',
          '/dashboard/requests'
        );
      } else if (update.status === 'rejected') {
        await notify(
          requesterId,
          '❌ Request Rejected',
          `Your access request has been rejected. Please contact your manager for more info.`,
          'error',
          '/dashboard/requests'
        );
      } else if (update.status === 'pending') {
        // Notify admins/managers
        const adminsManagers = await (User as any).find({
          role:     { $in: ['admin', 'manager'] },
          isActive: true,
        });
        for (const u of adminsManagers) {
          await notify(
            u._id.toString(),
            '🔔 Request Updated',
            `An access request status has been updated to pending review.`,
            'info',
            '/dashboard/requests'
          );
        }
      }
    }

    return NextResponse.json(request);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}