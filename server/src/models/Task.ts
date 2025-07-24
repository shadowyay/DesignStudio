import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  peopleNeeded: number;
  urgency: 'Normal' | 'Emergency';
  createdBy: mongoose.Types.ObjectId;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  approxStartTime?: Date;
  endTime?: Date;
  amount: number;
  acceptedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  peopleNeeded: { type: Number, required: true },
  urgency: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  approxStartTime: { type: Date },
  endTime: { type: Date },
  amount: { type: Number, required: true },
  acceptedBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
