import { NextRequest, NextResponse } from 'next/server';
import {
  IAMClient,
  CreateUserCommand,
  DeleteUserCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  CreateAccessKeyCommand,
  DeleteAccessKeyCommand,
  ListUsersCommand,
  ListAttachedUserPoliciesCommand,
  ListAccessKeysCommand,
} from '@aws-sdk/client-iam';
import { connectDB } from '@/lib/mongodb';
import AwsAccess from '@/lib/models/AwsAccess';

const iam = new IAMClient({
  region:      process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    await connectDB();
    const response = await iam.send(new ListUsersCommand({ MaxItems: 100 }));

    const users = await Promise.all(
      (response.Users || []).map(async u => {
        let policies: string[] = [];
        let accessKeys: any[]  = [];

        try {
          const polRes = await iam.send(new ListAttachedUserPoliciesCommand({ UserName: u.UserName! }));
          policies = polRes.AttachedPolicies?.map(p => p.PolicyName || '') || [];
        } catch {}

        try {
          const keyRes = await iam.send(new ListAccessKeysCommand({ UserName: u.UserName! }));
          accessKeys = keyRes.AccessKeyMetadata?.map(k => ({
            keyId:  k.AccessKeyId,
            status: k.Status,
          })) || [];
        } catch {}

        const dbRecord = await (AwsAccess as any).findOne({ iamUsername: u.UserName });

        return {
          userId:       u.UserId,
          username:     u.UserName,
          arn:          u.Arn,
          createdAt:    u.CreateDate,
          policies,
          accessKeys,
          displayName:  dbRecord?.userName     || u.UserName,
          email:        dbRecord?.userEmail    || '',
          resourceType: dbRecord?.resourceType || 'ec2',
          resourceName: dbRecord?.resourceName || '—',
          assignedBy:   dbRecord?.assignedBy   || '—',
          status:       dbRecord?.status       || 'active',
        };
      })
    );

    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const {
      userName, email, displayName,
      policies, resourceType, resourceId,
      resourceName, assignedBy, userId,
    } = await req.json();

    if (!userName || !email) {
      return NextResponse.json({ message: 'userName and email required' }, { status: 400 });
    }

    // Create IAM user
    await iam.send(new CreateUserCommand({
      UserName: userName,
      Tags: [
        { Key: 'Email',       Value: email       },
        { Key: 'CreatedBy',   Value: 'TourasPortal' },
        { Key: 'DisplayName', Value: displayName || userName },
      ],
    }));

    // Attach policies
    const policiesToAttach = Array.isArray(policies) ? policies : [policies || 'arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess'];
    for (const policy of policiesToAttach) {
      try {
        await iam.send(new AttachUserPolicyCommand({
          UserName:  userName,
          PolicyArn: policy,
        }));
      } catch {}
    }

    // Create access keys
    const keyRes    = await iam.send(new CreateAccessKeyCommand({ UserName: userName }));
    const accessKey = keyRes.AccessKey;

    // Save to DB — userId is completely optional
    const dbData: any = {
      userName:     displayName || userName,
      userEmail:    email,
      resourceType: resourceType || 'ec2',
      resourceId:   resourceId   || 'all',
      resourceName: resourceName || 'AWS Access',
      region:       process.env.AWS_REGION || 'ap-south-1',
      status:       'active',
      assignedBy:   assignedBy || 'admin',
      iamUsername:  userName,
      accessKeyId:  accessKey?.AccessKeyId,
    };

    // Only add userId if it's provided and valid
    if (userId && userId !== 'undefined' && userId !== 'null') {
      dbData.userId = userId;
    }

    await (AwsAccess as any).create(dbData);

    return NextResponse.json({
      message:         `AWS access granted to ${displayName || userName}`,
      iamUsername:     userName,
      accessKeyId:     accessKey?.AccessKeyId,
      secretAccessKey: accessKey?.SecretAccessKey,
      region:          process.env.AWS_REGION || 'ap-south-1',
      note:            'Save Secret Key now — it will not be shown again!',
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { iamUsername, accessId } = await req.json();

    if (!iamUsername) {
      return NextResponse.json({ message: 'iamUsername required' }, { status: 400 });
    }

    try {
      const keyRes = await iam.send(new ListAccessKeysCommand({ UserName: iamUsername }));
      for (const key of keyRes.AccessKeyMetadata || []) {
        await iam.send(new DeleteAccessKeyCommand({
          UserName:    iamUsername,
          AccessKeyId: key.AccessKeyId!,
        }));
      }
    } catch {}

    try {
      const polRes = await iam.send(new ListAttachedUserPoliciesCommand({ UserName: iamUsername }));
      for (const policy of polRes.AttachedPolicies || []) {
        await iam.send(new DetachUserPolicyCommand({
          UserName:  iamUsername,
          PolicyArn: policy.PolicyArn!,
        }));
      }
    } catch {}

    await iam.send(new DeleteUserCommand({ UserName: iamUsername }));

    if (accessId) {
      await (AwsAccess as any).findByIdAndUpdate(accessId, { status: 'revoked' });
    } else {
      await (AwsAccess as any).updateMany({ iamUsername }, { status: 'revoked' });
    }

    return NextResponse.json({ message: `AWS access revoked for ${iamUsername}` });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}