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
  taskCategory: 'General' | 'Donor' | 'Blood Emergency' | 'Other' | 'Rental';
  // Rental-specific fields
  isRental?: boolean;
  dailyRate?: number;
  availableFrom?: Date;
  availableTo?: Date;
  rentalDuration?: number; // in days
  itemCondition?: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  securityDeposit?: number;
  rentalTerms?: string;
  itemImages?: string[];
  // Business volunteer tracking fields
  businessContactAttempted?: boolean;
  businessContactedAt?: Date;
  assignedBusinessId?: mongoose.Types.ObjectId;
  businessVolunteerInfo?: {
    volunteerName: string;
    volunteerPhone: string;
    volunteerEmail?: string;
    estimatedArrival?: Date;
    assignedAt: Date;
    businessName: string;
    businessContact: string;
  };
  noVolunteerTimeout?: Date; // When to start contacting businesses
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
  taskCategory: { type: String, enum: ['General', 'Donor', 'Blood Emergency', 'Other', 'Rental'], default: 'General' },
  // Rental-specific fields
  isRental: { type: Boolean, default: false },
  dailyRate: { 
    type: Number, 
    required: function(this: ITask) { return this.taskCategory === 'Rental'; },
    min: [0, 'Daily rate cannot be negative']
  },
  availableFrom: { 
    type: Date,
    required: function(this: ITask) { return this.taskCategory === 'Rental'; }
  },
  availableTo: { 
    type: Date,
    required: function(this: ITask) { return this.taskCategory === 'Rental'; },
    validate: {
      validator: function(this: ITask, value: Date) {
        return !this.availableFrom || value > this.availableFrom;
      },
      message: 'Available to date must be after available from date'
    }
  },
  rentalDuration: { 
    type: Number,
    min: [1, 'Rental duration must be at least 1 day']
  },
  itemCondition: { 
    type: String, 
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    required: function(this: ITask) { return this.taskCategory === 'Rental'; }
  },
  securityDeposit: { 
    type: Number, 
    min: [0, 'Security deposit cannot be negative'],
    default: 0
  },
  rentalTerms: { 
    type: String,
    maxlength: [500, 'Rental terms cannot exceed 500 characters']
  },
  itemImages: { 
    type: [String], 
    default: [] 
  },
  // Business volunteer tracking fields
  businessContactAttempted: { 
    type: Boolean, 
    default: false 
  },
  businessContactedAt: { 
    type: Date,
    default: null
  },
  assignedBusinessId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Business',
    default: null
  },
  businessVolunteerInfo: {
    volunteerName: { type: String, default: null },
    volunteerPhone: { type: String, default: null },
    volunteerEmail: { type: String, default: null },
    estimatedArrival: { type: Date, default: null },
    assignedAt: { type: Date, default: null },
    businessName: { type: String, default: null },
    businessContact: { type: String, default: null }
  },
  noVolunteerTimeout: { 
    type: Date,
    default: function(this: ITask) {
      // Set timeout to 24 hours after creation for regular tasks
      // For urgent tasks: 4 hours, for emergency: 1 hour
      const hoursToAdd = this.urgency === 'Emergency' ? 1 : 
                        this.urgency === 'Urgent' ? 4 : 24;
      return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
    }
  }
}, { timestamps: true });

// Automatically delete tasks when their endTime passes
// TTL index checks approximately every minute
TaskSchema.index({ endTime: 1 }, { expireAfterSeconds: 0 });

// Index for business contact queries
TaskSchema.index({ 
  businessContactAttempted: 1, 
  noVolunteerTimeout: 1, 
  taskCategory: 1 
});
TaskSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
