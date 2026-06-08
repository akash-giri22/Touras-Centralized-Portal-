import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const user = await (User as any).findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Account inactive. Contact admin.' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ message: 'Password not set. Contact admin.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // ── Save Audit Log ──
    try {
      const AuditLog = (await import('@/lib/models/AuditLog')).default;
      await (AuditLog as any).create({
        userId:   user._id,
        userName: user.name,
        action:   'LOGIN',
        target:   user.email,
      });
    } catch {}

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    return NextResponse.json({
      access_token: token,
      user: {
        id:         user._id,
        email:      user.email,
        name:       user.name,
        role:       user.role,
        managerId:  user.managerId,
        department: user.department,
      }
    });

  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}