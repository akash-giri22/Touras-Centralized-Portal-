import mongoose, { Schema, Document } from 'mongoose';

export interface IAwsAccess extends Document {
  userId:       mongoose.Types.ObjectId;
  userName:     string;
  userEmail:    string;
  resourceType: 'ec2' | 's3';
  resourceId:   string;
  resourceName: string;
  region:       string;
  status:       'active' | 'revoked';
  assignedBy:   string;
  iamUsername?: string;
  accessKeyId?: string;
}

const AwsAccessSchema = new Schema<IAwsAccess>({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:     { type: String, required: true },
  userEmail:    { type: String, required: true },
  resourceType: { type: String, enum: ['ec2', 's3'], required: true },
  resourceId:   { type: String, required: true },
  resourceName: { type: String, required: true },
  region:       { type: String, default: 'ap-south-1' },
  status:       { type: String, enum: ['active', 'revoked'], default: 'active' },
  assignedBy:   { type: String, required: true },
  iamUsername:  { type: String, default: null },
  accessKeyId:  { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.AwsAccess ||
  mongoose.model<IAwsAccess>('AwsAccess', AwsAccessSchema);