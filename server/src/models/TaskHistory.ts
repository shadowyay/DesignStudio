import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskHistory extends Document {
  // Task Information
  taskId: string;
  title: string;
  description: string;
  taskCategory: 'General' | 'Emergency' | 'Donor' | 'Rental' | 'Other';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  amount: number;
  
  // Location Information
  location: {
    address: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
  };
  
  // Task Creator Information
  createdBy: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  // Volunteer Information
  volunteers: Array<{
    userId: string;
    name: string;
    email: string;
    phone?: string;
    joinedAt: Date;
    rating?: number;
    review?: string;
  }>;
  
  // Business Volunteer Information (if applicable)
  businessVolunteerInfo?: {
    businessId: string;
    businessName: string;
    businessContact: string;
    volunteerName: string;
    volunteerPhone: string;
    volunteerEmail?: string;
    estimatedArrival?: string;
    assignedAt: string;
  };
  
  // Timing Information
  createdAt: Date;
  startedAt?: Date;
  completedAt: Date;
  approxStartTime?: Date;
  endTime?: Date;
  actualDuration?: number; // in minutes
  
  // Task Specific Fields
  peopleNeeded: number;
  actualVolunteersCount: number;
  
  // Rental Specific (if applicable)
  rentalInfo?: {
    dailyRate: number;
    securityDeposit?: number;
    availableFrom: Date;
    availableTo: Date;
    rentalTerms?: string;
    itemCondition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
    actualRentalPeriod?: {
      startDate: Date;
      endDate: Date;
      totalDays: number;
      totalAmount: number;
    };
  };
  
  // Donor Specific (if applicable)
  donorInfo?: {
    bloodType?: string;
    donationCenter?: string;
    urgentContact?: string;
  };
  
  // Emergency Specific (if applicable)
  emergencyInfo?: {
    emergencyType: string;
    contactPerson: string;
    emergencyContact: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  
  // Completion Information
  completionStatus: 'Completed Successfully' | 'Completed with Issues' | 'Cancelled' | 'Failed';
  completionNotes?: string;
  
  // Ratings and Reviews
  userRating?: {
    rating: number; // 1-5 stars
    review?: string;
    ratedAt: Date;
  };
  
  volunteerRatings?: Array<{
    volunteerId: string;
    ratingByUser: number; // 1-5 stars from task creator
    reviewByUser?: string;
    ratingByVolunteer?: number; // 1-5 stars from volunteer about the task
    reviewByVolunteer?: string;
    ratedAt: Date;
  }>;
  
  // Financial Information
  financial: {
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'Pending' | 'Partial' | 'Completed' | 'Failed';
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: Date;
  };
  
  // Statistics
  statistics: {
    responseTime: number; // Time from creation to first volunteer acceptance (in minutes)
    completionTime: number; // Time from creation to completion (in minutes)
    efficiency: number; // Percentage score based on various factors
    successRate: number; // 0-100 based on completion quality
  };
  
  // Additional Metadata
  tags?: string[];
  issues?: Array<{
    type: 'Late Arrival' | 'No Show' | 'Quality Issue' | 'Communication Problem' | 'Other';
    description: string;
    reportedBy: 'User' | 'Volunteer' | 'Business';
    reportedAt: Date;
    resolved: boolean;
  }>;
}

const TaskHistorySchema: Schema = new Schema({
  taskId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  taskCategory: { 
    type: String, 
    required: true, 
    enum: ['General', 'Emergency', 'Donor', 'Rental', 'Other'],
    index: true 
  },
  urgency: { 
    type: String, 
    required: true, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    index: true 
  },
  amount: { type: Number, required: true },
  
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' }
  },
  
  createdBy: {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String }
  },
  
  volunteers: [{
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    joinedAt: { type: Date, required: true },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String }
  }],
  
  businessVolunteerInfo: {
    businessId: { type: String, index: true },
    businessName: { type: String },
    businessContact: { type: String },
    volunteerName: { type: String },
    volunteerPhone: { type: String },
    volunteerEmail: { type: String },
    estimatedArrival: { type: String },
    assignedAt: { type: String }
  },
  
  createdAt: { type: Date, required: true, index: true },
  startedAt: { type: Date },
  completedAt: { type: Date, required: true, index: true },
  approxStartTime: { type: Date },
  endTime: { type: Date },
  actualDuration: { type: Number },
  
  peopleNeeded: { type: Number, required: true },
  actualVolunteersCount: { type: Number, required: true },
  
  rentalInfo: {
    dailyRate: { type: Number },
    securityDeposit: { type: Number },
    availableFrom: { type: Date },
    availableTo: { type: Date },
    rentalTerms: { type: String },
    itemCondition: { 
      type: String, 
      enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
    },
    actualRentalPeriod: {
      startDate: { type: Date },
      endDate: { type: Date },
      totalDays: { type: Number },
      totalAmount: { type: Number }
    }
  },
  
  donorInfo: {
    bloodType: { type: String },
    donationCenter: { type: String },
    urgentContact: { type: String }
  },
  
  emergencyInfo: {
    emergencyType: { type: String },
    contactPerson: { type: String },
    emergencyContact: { type: String },
    severity: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical']
    }
  },
  
  completionStatus: { 
    type: String, 
    required: true, 
    enum: ['Completed Successfully', 'Completed with Issues', 'Cancelled', 'Failed'],
    index: true 
  },
  completionNotes: { type: String },
  
  userRating: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    ratedAt: { type: Date }
  },
  
  volunteerRatings: [{
    volunteerId: { type: String, required: true },
    ratingByUser: { type: Number, min: 1, max: 5 },
    reviewByUser: { type: String },
    ratingByVolunteer: { type: Number, min: 1, max: 5 },
    reviewByVolunteer: { type: String },
    ratedAt: { type: Date, default: Date.now }
  }],
  
  financial: {
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    paymentStatus: { 
      type: String, 
      required: true, 
      enum: ['Pending', 'Partial', 'Completed', 'Failed'],
      default: 'Pending'
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  
  statistics: {
    responseTime: { type: Number, required: true }, // minutes
    completionTime: { type: Number, required: true }, // minutes
    efficiency: { type: Number, required: true, min: 0, max: 100 }, // percentage
    successRate: { type: Number, required: true, min: 0, max: 100 } // percentage
  },
  
  tags: [{ type: String }],
  
  issues: [{
    type: { 
      type: String, 
      required: true, 
      enum: ['Late Arrival', 'No Show', 'Quality Issue', 'Communication Problem', 'Other']
    },
    description: { type: String, required: true },
    reportedBy: { 
      type: String, 
      required: true, 
      enum: ['User', 'Volunteer', 'Business']
    },
    reportedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }]
}, { 
  timestamps: true,
  collection: 'taskhistories'
});

// Indexes for efficient querying
TaskHistorySchema.index({ 'createdBy.userId': 1, completedAt: -1 });
TaskHistorySchema.index({ 'volunteers.userId': 1, completedAt: -1 });
TaskHistorySchema.index({ 'businessVolunteerInfo.businessId': 1, completedAt: -1 });
TaskHistorySchema.index({ taskCategory: 1, completedAt: -1 });
TaskHistorySchema.index({ urgency: 1, completedAt: -1 });
TaskHistorySchema.index({ completionStatus: 1, completedAt: -1 });
TaskHistorySchema.index({ 'location.city': 1, completedAt: -1 });

// Interface for query options
interface IHistoryQueryOptions {
  taskCategory?: string;
  urgency?: string;
  completionStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  skip?: number;
}

// Virtual for calculating average volunteer rating
TaskHistorySchema.virtual('averageVolunteerRating').get(function() {
  if (!this.volunteerRatings || this.volunteerRatings.length === 0) return 0;
  
  const totalRating = this.volunteerRatings.reduce((sum: number, rating: { ratingByUser?: number }) => {
    return sum + (rating.ratingByUser || 0);
  }, 0);
  
  return totalRating / this.volunteerRatings.length;
});

// Method to calculate task success metrics
TaskHistorySchema.methods.calculateSuccessMetrics = function() {
  let efficiency = 100;
  let successRate = 100;
  
  // Reduce efficiency for issues
  if (this.issues && this.issues.length > 0) {
    efficiency -= (this.issues.length * 10);
  }
  
  // Reduce efficiency for late completion
  if (this.actualDuration && this.endTime && this.approxStartTime) {
    const expectedDuration = new Date(this.endTime).getTime() - new Date(this.approxStartTime).getTime();
    const actualDurationMs = this.actualDuration * 60 * 1000;
    
    if (actualDurationMs > expectedDuration * 1.2) { // 20% over expected time
      efficiency -= 15;
    }
  }
  
  // Adjust based on completion status
  switch (this.completionStatus) {
    case 'Completed Successfully':
      // No reduction
      break;
    case 'Completed with Issues':
      efficiency -= 20;
      successRate -= 10;
      break;
    case 'Cancelled':
      efficiency = 0;
      successRate = 0;
      break;
    case 'Failed':
      efficiency = 0;
      successRate = 0;
      break;
  }
  
  // Adjust based on volunteer ratings
  const avgRating = this.averageVolunteerRating;
  if (avgRating > 0) {
    if (avgRating >= 4.5) {
      successRate += 5;
    } else if (avgRating < 3) {
      successRate -= 15;
    }
  }
  
  // Ensure values are within bounds
  efficiency = Math.max(0, Math.min(100, efficiency));
  successRate = Math.max(0, Math.min(100, successRate));
  
  this.statistics.efficiency = efficiency;
  this.statistics.successRate = successRate;
};

// Static method to get user task history with statistics
TaskHistorySchema.statics.getUserHistory = function(userId: string, options: IHistoryQueryOptions = {}) {
  const query: Record<string, unknown> = { 'createdBy.userId': userId };
  
  // Add filters if provided
  if (options.taskCategory) {
    query.taskCategory = options.taskCategory;
  }
  if (options.urgency) {
    query.urgency = options.urgency;
  }
  if (options.completionStatus) {
    query.completionStatus = options.completionStatus;
  }
  if (options.dateFrom || options.dateTo) {
    query.completedAt = {};
    if (options.dateFrom) (query.completedAt as Record<string, Date>).$gte = new Date(options.dateFrom);
    if (options.dateTo) (query.completedAt as Record<string, Date>).$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ completedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get volunteer task history with statistics
TaskHistorySchema.statics.getVolunteerHistory = function(userId: string, options: IHistoryQueryOptions = {}) {
  const query: Record<string, unknown> = { 'volunteers.userId': userId };
  
  // Add filters if provided
  if (options.taskCategory) {
    query.taskCategory = options.taskCategory;
  }
  if (options.urgency) {
    query.urgency = options.urgency;
  }
  if (options.completionStatus) {
    query.completionStatus = options.completionStatus;
  }
  if (options.dateFrom || options.dateTo) {
    query.completedAt = {};
    if (options.dateFrom) (query.completedAt as Record<string, Date>).$gte = new Date(options.dateFrom);
    if (options.dateTo) (query.completedAt as Record<string, Date>).$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ completedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get business history
TaskHistorySchema.statics.getBusinessHistory = function(businessId: string, options: IHistoryQueryOptions = {}) {
  const query: Record<string, unknown> = { 'businessVolunteerInfo.businessId': businessId };
  
  // Add filters if provided
  if (options.taskCategory) {
    query.taskCategory = options.taskCategory;
  }
  if (options.dateFrom || options.dateTo) {
    query.completedAt = {};
    if (options.dateFrom) (query.completedAt as Record<string, Date>).$gte = new Date(options.dateFrom);
    if (options.dateTo) (query.completedAt as Record<string, Date>).$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .sort({ completedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

export const TaskHistory = mongoose.model<ITaskHistory>('TaskHistory', TaskHistorySchema);