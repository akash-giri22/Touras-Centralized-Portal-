import mongoose, { Schema, Document } from 'mongoose';

export interface IAwsRequest extends Document {
  userId:       mongoose.Types.ObjectId;
  userName:     string;
  userEmail:    string;
  resourceType: 'server' | 'storage' | 'both';
  resourceName: string;
  reason:       string;
  status:       'pending' | 'manager-approved' | 'admin-approved' | 'rejected' | 'granted';
  managerNote?: string;
  adminNote?:   string;
  iamUsername?: string;
  accessKeyId?: string;
}

const AwsRequestSchema = new Schema<IAwsRequest>({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:     { type: String, required: true },
  userEmail:    { type: String, required: true },
  resourceType: { type: String, enum: ['server', 'storage', 'both'], required: true },
  resourceName: { type: String, required: true },
  reason:       { type: String, required: true },
  status:       {
    type:    String,
    enum:    ['pending', 'manager-approved', 'admin-approved', 'rejected', 'granted'],
    default: 'pending',
  },
  managerNote:  { type: String, default: '' },
  adminNote:    { type: String, default: '' },
  iamUsername:  { type: String, default: null },
  accessKeyId:  { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.AwsRequest ||
  mongoose.model<IAwsRequest>('AwsRequest', AwsRequestSchema);