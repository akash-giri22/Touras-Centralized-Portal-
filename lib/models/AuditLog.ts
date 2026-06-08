import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?:   mongoose.Types.ObjectId;
  userName?: string;
  action:    string;
  target?:   string;
  ipAddress?: string;
  metadata?: any;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  userName:  { type: String, default: null },
  action:    { type: String, required: true },
  target:    { type: String, default: null },
  ipAddress: { type: String, default: null },
  metadata:  { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);