import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  peopleNeeded: number;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
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
  taskCategory: 'General' | 'Donor' | 'Blood Emergency' | 'Other';
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    validate: {
      validator: function(v: string) {
        return v && v.trim().length >= 10;
      },
      message: 'Description must contain at least 10 meaningful characters'
    }
  },
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
  acceptedBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  taskCategory: { type: String, enum: ['General', 'Donor', 'Blood Emergency', 'Other'], default: 'General' }
}, { timestamps: true });

// Automatically delete tasks when their endTime passes
// TTL index checks approximately every minute
TaskSchema.index({ endTime: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ITask>('Task', TaskSchema);
