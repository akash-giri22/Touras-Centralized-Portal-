import mongoose, { Schema, Document } from 'mongoose';

export interface ILicense extends Document {
  portalId:    mongoose.Types.ObjectId;
  licenseCode: string;
  licenseName: string;
  region?:     string;
  totalSeats:  number;
  usedSeats:   number;
  expiresAt?:  Date;
}

const LicenseSchema = new Schema<ILicense>({
  portalId:    { type: Schema.Types.ObjectId, ref: 'Portal', required: true },
  licenseCode: { type: String, required: true },
  licenseName: { type: String, required: true },
  region:      { type: String, default: null },
  totalSeats:  { type: Number, default: 1 },
  usedSeats:   { type: Number, default: 0 },
  expiresAt:   { type: Date,   default: null },
}, { timestamps: true });

export default mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);