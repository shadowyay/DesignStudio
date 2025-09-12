import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dob?: string;
  location?: string;
  role: 'user' | 'volunteer';
  skills?: string[];
  openToAnything?: boolean;
  profilePicture?: string;
  about?: string;
  gender?: string;
  aadhaar: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  points?: number;
  level?: number;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dob: { type: String },
  location: { type: String },
  role: { type: String, enum: ['user', 'volunteer'], required: true },
  skills: { type: [String], default: [] },
  openToAnything: { type: Boolean },
  profilePicture: { type: String },
  about: { type: String },
  gender: { type: String },
  aadhaar: { type: String, required: true, unique: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
