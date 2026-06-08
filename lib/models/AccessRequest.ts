import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessRequest extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'portal' | 'license';
  targetId: string;
  targetName: string;
  reason: string;
  status: 'pending' | 'manager-approved' | 'admin-approved' | 'rejected';
  managerId?: mongoose.Types.ObjectId;
  managerNote?: string;
  adminNote?: string;
}

const AccessRequestSchema = new Schema<IAccessRequest>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['portal','license'], required: true },
  targetId:    { type: String, required: true },
  targetName:  { type: String, required: true },
  reason:      { type: String, required: true },
  status:      { type: String, enum: ['pending','manager-approved','admin-approved','rejected'], default: 'pending' },
  managerId:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
  managerNote: { type: String, default: null },
  adminNote:   { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.AccessRequest || mongoose.model<IAccessRequest>('AccessRequest', AccessRequestSchema);