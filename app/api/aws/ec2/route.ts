import { NextResponse } from 'next/server';
import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstanceStatusCommand,
} from '@aws-sdk/client-ec2';

const ec2 = new EC2Client({
  region:      process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2.send(command);

    const instances: any[] = [];

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        const nameTag = instance.Tags?.find(t => t.Key === 'Name');
        instances.push({
          instanceId:   instance.InstanceId,
          name:         nameTag?.Value || 'Unnamed',
          state:        instance.State?.Name,
          type:         instance.InstanceType,
          publicIp:     instance.PublicIpAddress || null,
          privateIp:    instance.PrivateIpAddress || null,
          region:       process.env.AWS_REGION || 'ap-south-1',
          launchTime:   instance.LaunchTime,
          platform:     instance.Platform || 'linux',
          az:           instance.Placement?.AvailabilityZone,
        });
      }
    }

    return NextResponse.json(instances);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { instanceId, action } = await req.json();

    if (!instanceId || !action) {
      return NextResponse.json({ message: 'instanceId and action required' }, { status: 400 });
    }

    if (action === 'start') {
      await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
      return NextResponse.json({ message: `Instance ${instanceId} starting` });
    }

    if (action === 'stop') {
      await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
      return NextResponse.json({ message: `Instance ${instanceId} stopping` });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}