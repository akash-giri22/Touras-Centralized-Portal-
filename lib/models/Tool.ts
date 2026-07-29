 
import mongoose, { Schema, Document } from 'mongoose';
 
export interface ITool extends Document {
  name:        string;
  description: string;
  url:         string;
  iconUrl:     string;   // uploaded image path or empty
  iconEmoji:   string;   // fallback emoji if no image
  color:       string;
  roles:       string[]; // ['admin','manager','employee']
  isActive:    boolean;
  isExternal:  boolean;  // always true for admin-added tools
  createdBy:   string;
}
 
const ToolSchema = new Schema<ITool>({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  url:         { type: String, required: true },
  iconUrl:     { type: String, default: '' },
  iconEmoji:   { type: String, default: '🔧' },
  color:       { type: String, default: '#6366f1' },
  roles:       { type: [String], default: ['admin'] },
  isActive:    { type: Boolean, default: true },
  isExternal:  { type: Boolean, default: true },
  createdBy:   { type: String, default: '' },
}, { timestamps: true });
 
export default mongoose.models.Tool ||
  mongoose.model<ITool>('Tool', ToolSchema);
 








