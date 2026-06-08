import mongoose, { Schema, Document } from 'mongoose';

export interface IJiraAccess extends Document {
  userId?:     mongoose.Types.ObjectId;
  accountId:   string;
  displayName: string;
  email:       string;
  avatarUrl?:  string;
  status:      'active' | 'suspended' | 'removed' | 'invited';
}

const JiraAccessSchema = new Schema<IJiraAccess>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', default: null },
  accountId:   { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email:       { type: String, default: '' },
  avatarUrl:   { type: String, default: null },
  status:      {
    type:    String,
    enum:    ['active', 'suspended', 'removed', 'invited'],
    default: 'active',
  },
}, { timestamps: true });

export default mongoose.models.JiraAccess ||
  mongoose.model<IJiraAccess>('JiraAccess', JiraAccessSchema);