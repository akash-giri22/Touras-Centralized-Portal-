import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  entraId?: string;
  email: string;
  name: string;
  passwordHash?: string;
  role: 'admin' | 'manager' | 'employee';
  managerId?: mongoose.Types.ObjectId;
  department?: string;
  isActive: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  entraId:      { type: String, default: null },
  email:        { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  passwordHash: { type: String, default: null },
  role:         { type: String, enum: ['admin','manager','employee'], default: 'employee' },
  managerId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  department:   { type: String, default: null },
  isActive:     { type: Boolean, default: false },
}, { timestamps: true });

export default (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);