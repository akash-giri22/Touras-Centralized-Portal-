 
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AwsRequest from '@/lib/models/AwsRequest';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const role   = searchParams.get('role');

    let query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    // Manager sees pending requests for their team
    if (role === 'manager') query.status = 'pending';

    // Admin sees manager-approved requests
    if (role === 'admin') query.status = 'manager-approved';

    const requests = await (AwsRequest as any).find(query)
      .populate('userId', 'name email department')
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

    const request = await (AwsRequest as any).create({
      userId:       body.userId,
      userName:     body.userName,
      userEmail:    body.userEmail,
      resourceType: body.resourceType,
      resourceName: body.resourceName,
      reason:       body.reason,
      status:       'pending',
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { id, status, note, role } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ message: 'id and status required' }, { status: 400 });
    }

    const update: any = { status };
    if (role === 'manager') update.managerNote = note || '';
    if (role === 'admin')   update.adminNote   = note || '';

    const request = await (AwsRequest as any).findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(request);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}