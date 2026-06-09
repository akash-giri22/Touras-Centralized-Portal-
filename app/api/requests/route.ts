import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AccessRequest from '@/lib/models/AccessRequest';
import Notification from '@/lib/models/Notification';
import PortalAccess from '@/lib/models/PortalAccess';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
 
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
 
    const query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
 
    const requests = await (AccessRequest as any)
      .find(query)
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
    const body = await req.json();
 
    const { userId, type, targetId, targetName, reason } = body;
 
    if (!userId || !type || !targetId || !targetName || !reason) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
 
    // Validate type enum
    if (!['portal', 'license'].includes(type)) {
      return NextResponse.json({ message: 'Invalid type. Must be portal or license' }, { status: 400 });
    }
 
    const request = await (AccessRequest as any).create({
      userId,
      type,
      targetId,
      targetName,
      reason,
      status: 'pending',
    });
 
    // Notify all admins + managers
    const adminsManagers = await (User as any).find({
      role: { $in: ['admin', 'manager'] },
      isActive: true,
    });
 
    for (const u of adminsManagers) {
      await notify(
        u._id.toString(),
        '🔔 New Access Request',
        `A new access request for "${targetName}" needs your review.`,
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
    const body = await req.json();
    const { id, status, managerId, managerNote, adminNote, adminId } = body;
 
    if (!id) {
      return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
    }
 
    const oldRequest = await (AccessRequest as any)
      .findById(id)
      .populate('userId', 'name email');
 
    if (!oldRequest) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
 
    // Whitelist update fields only
    const update: any = {};
    if (status)      update.status      = status;
    if (managerId)   update.managerId   = managerId;
    if (managerNote) update.managerNote = managerNote;
    if (adminNote)   update.adminNote   = adminNote;
 
    const request = await (AccessRequest as any)
      .findByIdAndUpdate(id, update, { new: true })
      .populate('userId', 'name email');
 
    const requesterId = oldRequest.userId._id?.toString() || oldRequest.userId.toString();
 
    if (status === 'manager-approved') {
      await notify(
        requesterId,
        '✅ Manager Approved',
        `Your request for "${oldRequest.targetName}" has been approved by your manager and is pending admin review.`,
        'success',
        '/dashboard/requests'
      );
 
    } else if (status === 'admin-approved') {
      // ✅ FIXED: using correct PortalAccess model fields (portalId + grantedBy)
      if (!adminId) {
        return NextResponse.json({ message: 'adminId is required for admin approval' }, { status: 400 });
      }
 
      // Check if access already exists (avoid duplicate unique index crash)
      const existing = await (PortalAccess as any).findOne({
        userId:   new mongoose.Types.ObjectId(requesterId),
        portalId: new mongoose.Types.ObjectId(oldRequest.targetId),
      });
 
      if (!existing) {
        await (PortalAccess as any).create({
          userId:    new mongoose.Types.ObjectId(requesterId),
          portalId:  new mongoose.Types.ObjectId(oldRequest.targetId), // ✅ portalId not targetId
          grantedBy: new mongoose.Types.ObjectId(adminId),              // ✅ grantedBy required
          type:      oldRequest.type,
          grantedAt: new Date(),
        });
      }
 
      await notify(
        requesterId,
        '🎉 Access Granted!',
        `Your request for "${oldRequest.targetName}" has been fully approved. You now have access.`,
        'success',
        '/dashboard'
      );
 
    } else if (status === 'rejected') {
      await notify(
        requesterId,
        '❌ Request Rejected',
        `Your request for "${oldRequest.targetName}" was rejected. Contact your manager for details.`,
        'error',
        '/dashboard/requests'
      );
    }
 
    return NextResponse.json(request);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
 




