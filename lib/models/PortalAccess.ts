 
import mongoose, { Schema, Document } from 'mongoose';

export interface IPortalAccess extends Document {
  userId:   mongoose.Types.ObjectId;
  portalId: mongoose.Types.ObjectId;
  grantedBy: mongoose.Types.ObjectId;
}

const PortalAccessSchema = new Schema<IPortalAccess>({
  userId:    { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  portalId:  { type: Schema.Types.ObjectId, ref: 'Portal', required: true },
  grantedBy: { type: Schema.Types.ObjectId, ref: 'User',   required: true },
}, { timestamps: true });

// Unique per user+portal
PortalAccessSchema.index({ userId: 1, portalId: 1 }, { unique: true });

export default mongoose.models.PortalAccess ||
  mongoose.model<IPortalAccess>('PortalAccess', PortalAccessSchema);