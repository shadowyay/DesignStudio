import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  peopleNeeded: number;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  createdBy: mongoose.Types.ObjectId;
  location: string;
  approxStartTime?: Date;
  endTime?: Date;
  amount: number;
  accepted: boolean;
  acceptedBy?: mongoose.Types.ObjectId;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  peopleNeeded: { type: Number, required: true },
  urgency: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: String, required: true },
  approxStartTime: { type: Date },
  endTime: { type: Date },
  amount: { type: Number, required: true },
  accepted: { type: Boolean, default: false },
  acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
