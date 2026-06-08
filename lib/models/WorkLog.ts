import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkLog extends Document {
  userId: mongoose.Types.ObjectId;
  workDescription: string;
  hoursSpent: number;
  status: 'pending' | 'in-progress' | 'completed';
  logDate: string;
  project?: string;
  tags?: string[];
  managerComment?: string;
}

const WorkLogSchema = new Schema<IWorkLog>({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workDescription: { type: String, required: true },
  hoursSpent:      { type: Number, required: true },
  status:          { type: String, enum: ['pending','in-progress','completed'], default: 'pending' },
  logDate:         { type: String, required: true },
  project:         { type: String, default: null },
  tags:            { type: [String], default: [] },
  managerComment:  { type: String, default: null },
}, { timestamps: true });

export default mongoose.models.WorkLog || mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);