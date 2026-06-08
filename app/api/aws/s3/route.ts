import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
  PutBucketPolicyCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region:      process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket');

    if (bucket) {
      // List objects in specific bucket
      const command = new ListObjectsV2Command({
        Bucket:  bucket,
        MaxKeys: 100,
      });
      const response = await s3.send(command);

      const objects = (response.Contents || []).map(obj => ({
        key:          obj.Key,
        size:         obj.Size,
        lastModified: obj.LastModified,
        storageClass: obj.StorageClass,
      }));

      return NextResponse.json({
        bucket,
        objects,
        count: objects.length,
        totalSize: objects.reduce((a, o) => a + (o.size || 0), 0),
      });
    }

    // List all buckets
    const response = await s3.send(new ListBucketsCommand({}));

    const buckets = await Promise.all(
      (response.Buckets || []).map(async b => {
        try {
          const locRes = await s3.send(new GetBucketLocationCommand({ Bucket: b.Name! }));
          return {
            name:         b.Name,
            creationDate: b.CreationDate,
            region:       locRes.LocationConstraint || 'us-east-1',
          };
        } catch {
          return { name: b.Name, creationDate: b.CreationDate, region: 'unknown' };
        }
      })
    );

    return NextResponse.json(buckets);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { bucket, key } = await req.json();
    if (!bucket || !key) {
      return NextResponse.json({ message: 'bucket and key required' }, { status: 400 });
    }

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ message: `Object ${key} deleted from ${bucket}` });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}