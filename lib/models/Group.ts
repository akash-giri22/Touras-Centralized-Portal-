import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
  name:        string;
  description: string;
  leadId:      mongoose.Types.ObjectId;
  memberIds:   mongoose.Types.ObjectId[];
  createdBy:   mongoose.Types.ObjectId;
  isActive:    boolean;
}

const GroupSchema = new Schema<IGroup>({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  leadId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberIds:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Group ||
  mongoose.model<IGroup>('Group', GroupSchema);