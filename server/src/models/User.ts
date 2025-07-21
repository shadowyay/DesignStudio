import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  dob: Date;
  location: string;
  role: 'user' | 'volunteer';
  skills?: string;
  openToAnything?: boolean;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  location: { type: String, required: true },
  role: { type: String, enum: ['user', 'volunteer'], required: true },
  skills: { type: String },
  openToAnything: { type: Boolean }
});

export default mongoose.model<IUser>('User', UserSchema);
