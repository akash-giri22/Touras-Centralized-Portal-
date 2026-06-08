import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketNumber: string;
  title:        string;
  description:  string;
  category:     'hardware' | 'software' | 'network' | 'access' | 'other';
  priority:     'low' | 'medium' | 'high' | 'critical';
  status:       'open' | 'in-progress' | 'resolved' | 'closed';
  raisedBy:     mongoose.Types.ObjectId;
  assignedTo?:  mongoose.Types.ObjectId;
  comments:     { userId: mongoose.Types.ObjectId; text: string; createdAt: Date }[];
resolvedAt: { type: Date, default: null },}

const TicketSchema = new Schema<ITicket>({
  ticketNumber: { type: String, unique: true },
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  category:     { type: String, enum: ['hardware','software','network','access','other'], default: 'other' },
  priority:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:       { type: String, enum: ['open','in-progress','resolved','closed'], default: 'open' },
  raisedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
  comments:     [{
    userId:    { type: Schema.Types.ObjectId, ref: 'User' },
    text:      { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  resolvedAt:   { type: Date, default: null },
}, { timestamps: true });

// Auto generate ticket number
TicketSchema.pre('save', async function () {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(4, '0')}`;
  }
});

export default mongoose.models.Ticket ||
  mongoose.model<ITicket>('Ticket', TicketSchema);