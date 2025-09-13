import Task, { ITask } from '../models/Task';
import { TaskHistory, ITaskHistory } from '../models/TaskHistory';
import Business, { IBusiness } from '../models/Business';
import User from '../models/User';
import { updateVolunteerStreak } from './volunteerStreakService';

export interface TaskCompletionData {
  taskId: string;
  completionStatus: 'Completed Successfully' | 'Completed with Issues' | 'Cancelled' | 'Failed';
  completionNotes?: string;
  actualDuration?: number; // in minutes
  userRating?: {
    rating: number;
    review?: string;
  };
  volunteerRatings?: Array<{
    volunteerId: string;
    ratingByUser?: number;
    reviewByUser?: string;
    ratingByVolunteer?: number;
    reviewByVolunteer?: string;
  }>;
  issues?: Array<{
    type: 'Late Arrival' | 'No Show' | 'Quality Issue' | 'Communication Problem' | 'Other';
    description: string;
    reportedBy: 'User' | 'Volunteer' | 'Business';
  }>;
  rentalActualPeriod?: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
    totalAmount: number;
  };
  paymentInfo?: {
    amountPaid: number;
    paymentStatus: 'Pending' | 'Partial' | 'Completed' | 'Failed';
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: Date;
  };
}

// Helper function to map task urgency to history urgency
function mapUrgencyToHistory(taskUrgency: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  switch (taskUrgency) {
    case 'Normal': return 'Low';
    case 'Urgent': return 'High';
    case 'Emergency': return 'Critical';
    default: return 'Medium';
  }
}

// Helper function to map task category to history category
function mapCategoryToHistory(taskCategory: string): 'General' | 'Emergency' | 'Donor' | 'Rental' | 'Other' {
  switch (taskCategory) {
    case 'Blood Emergency': return 'Emergency';
    case 'General': return 'General';
    case 'Donor': return 'Donor';
    case 'Rental': return 'Rental';
    case 'Other': return 'Other';
    default: return 'General';
  }
}

export class TaskCompletionService {
  
  /**
   * Complete a task and create a history record
   */
  static async completeTask(completionData: TaskCompletionData): Promise<ITaskHistory> {
    try {
      // Get the task with populated data
      const task = await Task.findById(completionData.taskId)
        .populate('createdBy', 'name email phone')
        .populate('acceptedBy', 'name email phone');

      if (!task) {
        throw new Error('Task not found');
      }

      // Get business information if applicable
      let businessVolunteerInfo;
      if (task.businessVolunteerInfo && task.assignedBusinessId) {
        const business = await Business.findById(task.assignedBusinessId);
        if (business && task.businessVolunteerInfo) {
          businessVolunteerInfo = {
            businessId: task.assignedBusinessId.toString(),
            businessName: business.name,
            businessContact: business.contactPerson.phone,
            volunteerName: task.businessVolunteerInfo.volunteerName,
            volunteerPhone: task.businessVolunteerInfo.volunteerPhone,
            volunteerEmail: task.businessVolunteerInfo.volunteerEmail,
            estimatedArrival: task.businessVolunteerInfo.estimatedArrival?.toISOString(),
            assignedAt: task.businessVolunteerInfo.assignedAt.toISOString()
          };
        }
      }

      // Calculate statistics
      const createdAt = new Date(task.createdAt);
      const completedAt = new Date();
      const approxStartTime = task.approxStartTime ? new Date(task.approxStartTime) : null;
      
      // Calculate response time (from creation to first acceptance)
      const responseTime = task.acceptedBy && task.acceptedBy.length > 0 
        ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60) // in minutes
        : 0;
      
      // Calculate completion time (total time from creation to completion)
      const completionTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60); // in minutes
      
      // Create the history record
      const historyData: Partial<ITaskHistory> = {
        taskId: task._id.toString(),
        title: task.title,
        description: task.description,
        taskCategory: mapCategoryToHistory(task.taskCategory),
        urgency: mapUrgencyToHistory(task.urgency),
        amount: task.amount || 0,
        
        location: {
          address: task.location?.address || '',
          lat: task.location?.lat || 0,
          lng: task.location?.lng || 0,
          city: 'Unknown', // Task location doesn't have city field
          state: 'Unknown', // Task location doesn't have state field
          country: 'India'
        },
        
        createdBy: {
          userId: (task.createdBy as any)._id.toString(),
          name: (task.createdBy as any).name || 'Unknown User',
          email: (task.createdBy as any).email || '',
          phone: (task.createdBy as any).phone
        },
        
        volunteers: task.acceptedBy ? task.acceptedBy.map((volunteer: any) => ({
          userId: volunteer._id.toString(),
          name: volunteer.name || 'Unknown User',
          email: volunteer.email || '',
          phone: volunteer.phone,
          joinedAt: createdAt, // Approximation - we could track this better in future
          rating: completionData.volunteerRatings?.find(r => r.volunteerId === volunteer._id.toString())?.ratingByUser,
          review: completionData.volunteerRatings?.find(r => r.volunteerId === volunteer._id.toString())?.reviewByUser
        })) : [],
        
        businessVolunteerInfo,
        
        createdAt,
        completedAt,
        approxStartTime: approxStartTime || undefined,
        endTime: task.endTime,
        actualDuration: completionData.actualDuration,
        
        peopleNeeded: task.peopleNeeded || 1,
        actualVolunteersCount: task.acceptedBy?.length || 0,
        
        completionStatus: completionData.completionStatus,
        completionNotes: completionData.completionNotes,
        
        userRating: completionData.userRating ? {
          rating: completionData.userRating.rating,
          review: completionData.userRating.review,
          ratedAt: completedAt
        } : undefined,
        
        volunteerRatings: completionData.volunteerRatings?.map(rating => ({
          volunteerId: rating.volunteerId,
          ratingByUser: rating.ratingByUser || 0,
          reviewByUser: rating.reviewByUser,
          ratingByVolunteer: rating.ratingByVolunteer,
          reviewByVolunteer: rating.reviewByVolunteer,
          ratedAt: completedAt
        })),
        
        financial: {
          totalAmount: task.amount || 0,
          amountPaid: completionData.paymentInfo?.amountPaid || 0,
          paymentStatus: completionData.paymentInfo?.paymentStatus || 'Pending',
          paymentMethod: completionData.paymentInfo?.paymentMethod,
          transactionId: completionData.paymentInfo?.transactionId,
          paidAt: completionData.paymentInfo?.paidAt
        },
        
        statistics: {
          responseTime,
          completionTime,
          efficiency: 0, // Will be calculated by the model method
          successRate: 0 // Will be calculated by the model method
        },
        
        issues: completionData.issues?.map(issue => ({
          type: issue.type,
          description: issue.description,
          reportedBy: issue.reportedBy,
          reportedAt: completedAt,
          resolved: false
        }))
      };
      
      // Add category-specific data
      if (task.taskCategory === 'Rental') {
        historyData.rentalInfo = {
          dailyRate: (task as any).dailyRate || 0,
          securityDeposit: (task as any).securityDeposit || 0,
          availableFrom: (task as any).availableFrom,
          availableTo: (task as any).availableTo,
          rentalTerms: (task as any).rentalTerms,
          itemCondition: (task as any).itemCondition || 'Good',
          actualRentalPeriod: completionData.rentalActualPeriod
        };
      }
      
      if (task.taskCategory === 'Donor') {
        historyData.donorInfo = {
          bloodType: (task as any).bloodType,
          donationCenter: (task as any).donationCenter,
          urgentContact: (task as any).urgentContact
        };
      }
      
      if (task.taskCategory === 'Blood Emergency') {
        historyData.emergencyInfo = {
          emergencyType: (task as any).emergencyType || 'General',
          contactPerson: (task as any).contactPerson || (task.createdBy as any).name,
          emergencyContact: (task as any).emergencyContact || (task.createdBy as any).phone,
          severity: task.urgency as any
        };
      }
      
      // Create the history record
      const taskHistory = new TaskHistory(historyData);
      
      // Save the history record
      await taskHistory.save();
      
      // Update volunteer streaks if task completed successfully
      if (completionData.completionStatus === 'Completed Successfully' || 
          completionData.completionStatus === 'Completed with Issues') {
        
        // Update streaks for all volunteers who participated
        if (task.acceptedBy && task.acceptedBy.length > 0) {
          for (const volunteer of task.acceptedBy) {
            try {
              await updateVolunteerStreak((volunteer as any)._id.toString(), completedAt);
              console.log(`Streak updated for volunteer ${(volunteer as any)._id.toString()}`);
            } catch (error) {
              console.error(`Failed to update streak for volunteer ${(volunteer as any)._id.toString()}:`, error);
            }
          }
        }
        
        // Update streak for business volunteer if applicable
        if (task.businessVolunteerInfo && task.assignedBusinessId) {
          // For business volunteers, we would need to track their individual volunteer records
          // This could be enhanced in the future to track individual business volunteers
          console.log('Business volunteer streak update not implemented yet');
        }
      }
      
      return taskHistory;
      
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }
  
  /**
   * Add rating and review to an existing task history
   */
  static async addRatingToHistory(
    taskId: string, 
    userId: string, 
    rating: number, 
    review?: string, 
    raterType: 'user' | 'volunteer' = 'user'
  ): Promise<ITaskHistory | null> {
    try {
      const taskHistory = await TaskHistory.findOne({ taskId });
      
      if (!taskHistory) {
        throw new Error('Task history not found');
      }
      
      if (raterType === 'user') {
        // User rating the overall experience
        taskHistory.userRating = {
          rating,
          review,
          ratedAt: new Date()
        };
      } else {
        // Volunteer rating - find or create volunteer rating entry
        const existingRatingIndex = taskHistory.volunteerRatings?.findIndex(
          r => r.volunteerId === userId
        ) ?? -1;
        
        if (existingRatingIndex >= 0 && taskHistory.volunteerRatings) {
          // Update existing rating
          taskHistory.volunteerRatings[existingRatingIndex].ratingByVolunteer = rating;
          taskHistory.volunteerRatings[existingRatingIndex].reviewByVolunteer = review;
          taskHistory.volunteerRatings[existingRatingIndex].ratedAt = new Date();
        } else {
          // Add new volunteer rating
          if (!taskHistory.volunteerRatings) {
            taskHistory.volunteerRatings = [];
          }
          taskHistory.volunteerRatings.push({
            volunteerId: userId,
            ratingByUser: 0, // Will be set when user rates
            ratingByVolunteer: rating,
            reviewByVolunteer: review,
            ratedAt: new Date()
          });
        }
      }
      
      // Success metrics will be calculated on save
      
      await taskHistory.save();
      return taskHistory;
      
    } catch (error) {
      console.error('Error adding rating to history:', error);
      throw error;
    }
  }
  
  /**
   * Report an issue with a completed task
   */
  static async reportIssue(
    taskId: string,
    issue: {
      type: 'Late Arrival' | 'No Show' | 'Quality Issue' | 'Communication Problem' | 'Other';
      description: string;
      reportedBy: 'User' | 'Volunteer' | 'Business';
    }
  ): Promise<ITaskHistory | null> {
    try {
      const taskHistory = await TaskHistory.findOne({ taskId });
      
      if (!taskHistory) {
        throw new Error('Task history not found');
      }
      
      if (!taskHistory.issues) {
        taskHistory.issues = [];
      }
      
      taskHistory.issues.push({
        type: issue.type,
        description: issue.description,
        reportedBy: issue.reportedBy,
        reportedAt: new Date(),
        resolved: false
      });
      
      // Success metrics will be recalculated on save
      
      await taskHistory.save();
      return taskHistory;
      
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error;
    }
  }
  
  /**
   * Get user statistics from completed tasks
   */
  static async getUserStatistics(userId: string) {
    try {
      const stats = await TaskHistory.aggregate([
        { $match: { 'createdBy.userId': userId } },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            totalAmountSpent: { $sum: '$financial.amountPaid' },
            avgEfficiency: { $avg: '$statistics.efficiency' },
            avgSuccessRate: { $avg: '$statistics.successRate' },
            avgResponseTime: { $avg: '$statistics.responseTime' },
            avgCompletionTime: { $avg: '$statistics.completionTime' },
            completedSuccessfully: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Completed Successfully'] }, 1, 0] }
            },
            completedWithIssues: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Completed with Issues'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Cancelled'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Failed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      return stats.length > 0 ? stats[0] : null;
      
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get volunteer statistics from completed tasks
   */
  static async getVolunteerStatistics(userId: string) {
    try {
      const stats = await TaskHistory.aggregate([
        { $match: { 'volunteers.userId': userId } },
        { $unwind: '$volunteers' },
        { $match: { 'volunteers.userId': userId } },
        {
          $group: {
            _id: null,
            totalTasksCompleted: { $sum: 1 },
            totalEarnings: { $sum: '$amount' },
            avgRatingReceived: { $avg: '$volunteerRatings.ratingByUser' },
            avgRatingGiven: { $avg: '$volunteerRatings.ratingByVolunteer' },
            completedSuccessfully: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Completed Successfully'] }, 1, 0] }
            },
            completedWithIssues: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Completed with Issues'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Cancelled'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$completionStatus', 'Failed'] }, 1, 0] }
            }
          }
        }
      ]);
      
      return stats.length > 0 ? stats[0] : null;
      
    } catch (error) {
      console.error('Error getting volunteer statistics:', error);
      throw error;
    }
  }
}

export default TaskCompletionService;