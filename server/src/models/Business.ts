import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number;
    lng: number;
  };
  services: string[]; // Types of tasks they can provide volunteers for
  coverageRadius: number; // In kilometers
  isActive: boolean;
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  maxVolunteersPerDay: number;
  currentVolunteerCount: number;
  responseTime: number; // Average response time in hours
  reliability: number; // Rating from 1-5 based on past performance
  lastContactedAt?: Date;
  totalTasksAssigned: number;
  successfulAssignments: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtual properties
  successRate: number;
  // Methods
  isCurrentlyOpen(): boolean;
  distanceTo(lat: number, lng: number): number;
  canHandleTask(taskCategory: string, taskLat: number, taskLng: number): boolean;
}

const BusinessSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Business email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String, 
    required: [true, 'Business phone is required'],
    trim: true,
    match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  services: { 
    type: [String], 
    required: true,
    enum: ['General', 'Donor', 'Blood Emergency', 'Other', 'Rental', 'Delivery', 'Cleaning', 'Maintenance'],
    validate: {
      validator: function(services: string[]) {
        return services.length > 0;
      },
      message: 'At least one service must be specified'
    }
  },
  coverageRadius: { 
    type: Number, 
    required: true,
    min: [1, 'Coverage radius must be at least 1 km'],
    max: [50, 'Coverage radius cannot exceed 50 km'],
    default: 10
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  contactPerson: {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  businessHours: {
    monday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    tuesday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    wednesday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    thursday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    friday: { 
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true }
    },
    saturday: { 
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isOpen: { type: Boolean, default: true }
    },
    sunday: { 
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isOpen: { type: Boolean, default: false }
    }
  },
  maxVolunteersPerDay: { 
    type: Number, 
    required: true,
    min: [1, 'Must be able to provide at least 1 volunteer per day'],
    default: 3
  },
  currentVolunteerCount: { 
    type: Number, 
    default: 0,
    min: [0, 'Current volunteer count cannot be negative']
  },
  responseTime: { 
    type: Number, 
    default: 4,
    min: [0.5, 'Response time must be at least 30 minutes'],
    max: [48, 'Response time cannot exceed 48 hours']
  },
  reliability: { 
    type: Number, 
    default: 5,
    min: [1, 'Reliability rating must be at least 1'],
    max: [5, 'Reliability rating cannot exceed 5']
  },
  lastContactedAt: { 
    type: Date,
    default: null
  },
  totalTasksAssigned: { 
    type: Number, 
    default: 0,
    min: [0, 'Total tasks assigned cannot be negative']
  },
  successfulAssignments: { 
    type: Number, 
    default: 0,
    min: [0, 'Successful assignments cannot be negative']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for success rate calculation
BusinessSchema.virtual('successRate').get(function(this: IBusiness) {
  if (this.totalTasksAssigned === 0) return 100;
  return Math.round((this.successfulAssignments / this.totalTasksAssigned) * 100);
});

// Index for location-based queries
BusinessSchema.index({ 'address.lat': 1, 'address.lng': 1 });
BusinessSchema.index({ isActive: 1, services: 1 });
BusinessSchema.index({ email: 1 }, { name: 'business_email_1' });

// Method to check if business is currently open
BusinessSchema.methods.isCurrentlyOpen = function(this: IBusiness): boolean {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()] as keyof typeof this.businessHours;
  const daySchedule = this.businessHours[currentDay];
  
  if (!daySchedule.isOpen) return false;
  
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
  return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
};

// Method to calculate distance to a location (using Haversine formula)
BusinessSchema.methods.distanceTo = function(this: IBusiness, lat: number, lng: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.address.lat) * Math.PI / 180;
  const dLng = (lng - this.address.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.address.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Method to check if business can handle a task
BusinessSchema.methods.canHandleTask = function(this: IBusiness, taskCategory: string, taskLat: number, taskLng: number): boolean {
  if (!this.isActive) return false;
  if (!this.services.includes(taskCategory)) return false;
  if (this.currentVolunteerCount >= this.maxVolunteersPerDay) return false;
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = (taskLat - this.address.lat) * Math.PI / 180;
  const dLng = (taskLng - this.address.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.address.lat * Math.PI / 180) * Math.cos(taskLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= this.coverageRadius;
};

export default mongoose.model<IBusiness>('Business', BusinessSchema);