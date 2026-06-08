import mongoose, { Schema, Document } from 'mongoose';

export interface IPortal extends Document {
  name:        string;
  type:        string;
  icon:        string;
  baseUrl:     string;
  adminUrl?:   string;
  description?: string;
  category?:   string;
  color?:      string;
  regionBased: boolean;
  isActive:    boolean;
}

const PortalSchema = new Schema<IPortal>({
  name:        { type: String, required: true },
  type:        { type: String, default: 'external' },
  icon:        { type: String, default: '' },
  baseUrl:     { type: String, required: true },
  adminUrl:    { type: String, default: null },
  description: { type: String, default: '' },
  category:    { type: String, default: '' },
  color:       { type: String, default: '#6366f1' },
  regionBased: { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Portal ||
  mongoose.model<IPortal>('Portal', PortalSchema);