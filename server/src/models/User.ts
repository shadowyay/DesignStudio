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
  aadhaar?: string; // Made optional to handle existing users
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dob: { type: String },
  location: { type: String },
  role: { type: String, enum: ['user', 'volunteer'], required: true },
  skills: { type: [String] },
  openToAnything: { type: Boolean },
  profilePicture: { type: String },
  about: { type: String },
  gender: { type: String },
  aadhaar: { type: String, unique: true, sparse: true }, // Made optional and added sparse index for unique constraint
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
