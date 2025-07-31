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
  profilePicture?: string;
  about?: string;
  gender: 'male' | 'female' | 'rather not say';
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  location: { type: String, required: true },
  role: { type: String, enum: ['user', 'volunteer'], default: 'user' },
  skills: { type: String },
  openToAnything: { type: Boolean, default: false },
  profilePicture: { type: String },
  about: { type: String },
  gender: { type: String, enum: ['male', 'female', 'rather not say'] }
});

export default mongoose.model<IUser>('User', UserSchema);
