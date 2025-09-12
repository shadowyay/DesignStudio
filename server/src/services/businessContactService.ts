import Task, { ITask } from '../models/Task';
import Business, { IBusiness } from '../models/Business';
import { sendBusinessVolunteerRequest } from '../utils/emailUtils';
import { Document } from 'mongoose';

interface BusinessContactResult {
  taskId: string;
  businessId: string | null;
  success: boolean;
  message: string;
}

/**
 * Service to automatically contact businesses when tasks have no volunteers
 * This should be called periodically (e.g., every 30 minutes) via cron job or scheduler
 */
export class BusinessContactService {
  
  /**
   * Check for tasks that need business contact and attempt to assign them
   */
  static async processTasksNeedingBusinessContact(): Promise<BusinessContactResult[]> {
    const results: BusinessContactResult[] = [];
    
    try {
      console.log('Starting business contact service scan...');
      
      // Find tasks that:
      // 1. Have passed their no-volunteer timeout
      // 2. Have no accepted volunteers (acceptedBy array is empty)
      // 3. Haven't been assigned to a business yet
      // 4. Are still active (not past endTime if specified)
      
      const now = new Date();
      const tasksNeedingHelp = await Task.find({
        noVolunteerTimeout: { $lte: now },
        $expr: { $eq: [{ $size: "$acceptedBy" }, 0] }, // No volunteers accepted
        businessContactAttempted: { $ne: true },
        $or: [
          { endTime: { $exists: false } },
          { endTime: { $gt: now } }
        ]
      }).populate('createdBy', 'name email phone');
      
      console.log(`Found ${tasksNeedingHelp.length} tasks needing business contact`);
      
      for (const task of tasksNeedingHelp) {
        try {
          const result = await this.attemptBusinessContactForTask(task);
          results.push(result);
          
          // Add delay between business contacts to avoid overwhelming
          if (results.length > 0 && results.length % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }
          
        } catch (error) {
          console.error(`Error processing task ${task._id}:`, error);
          results.push({
            taskId: task._id.toString(),
            businessId: null,
            success: false,
            message: `Error processing task: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
      
      console.log(`Business contact service completed. Processed ${results.length} tasks.`);
      console.log(`Successful contacts: ${results.filter(r => r.success).length}`);
      console.log(`Failed contacts: ${results.filter(r => !r.success).length}`);
      
      return results;
      
    } catch (error) {
      console.error('Error in business contact service:', error);
      throw error;
    }
  }
  
  /**
   * Attempt to find and contact a suitable business for a specific task
   */
  static async attemptBusinessContactForTask(task: ITask & Document & { createdBy?: { name?: string; email?: string; phone?: string } }): Promise<BusinessContactResult> {
    try {
      console.log(`Processing task: ${task.title} (${task._id})`);
      
      // Find suitable businesses for this task
      const suitableBusinesses = await this.findSuitableBusinesses(task);
      
      if (suitableBusinesses.length === 0) {
        console.log(`No suitable businesses found for task ${task._id}`);
        
        // Mark as attempted even if no business found to avoid repeated checks
        task.businessContactAttempted = true;
        task.businessContactedAt = new Date();
        await task.save();
        
        return {
          taskId: task._id.toString(),
          businessId: null,
          success: false,
          message: 'No suitable businesses found in the area'
        };
      }
      
      // Select the best business (first in the sorted list)
      const selectedBusiness = suitableBusinesses[0];
      
      // Update task with business assignment
      task.businessContactAttempted = true;
      task.businessContactedAt = new Date();
      task.assignedBusinessId = selectedBusiness._id;
      await task.save();
      
      // Update business metrics
      selectedBusiness.lastContactedAt = new Date();
      selectedBusiness.currentVolunteerCount += 1;
      selectedBusiness.totalTasksAssigned += 1;
      await selectedBusiness.save();
      
      // Send email to business
      const taskCreator = task.createdBy;
      await sendBusinessVolunteerRequest(
        selectedBusiness.contactPerson.email,
        selectedBusiness.contactPerson.name,
        selectedBusiness.name,
        task.title,
        task.description,
        task.location.address,
        task.urgency,
        task.amount,
        taskCreator?.name || 'Unknown User',
        taskCreator?.email || '',
        taskCreator?.phone || '',
        task._id.toString(),
        selectedBusiness._id.toString()
      );
      
      console.log(`Successfully contacted business ${selectedBusiness.name} for task ${task._id}`);
      
      return {
        taskId: task._id.toString(),
        businessId: selectedBusiness._id.toString(),
        success: true,
        message: `Contacted ${selectedBusiness.name} successfully`
      };
      
    } catch (error) {
      console.error(`Error contacting business for task ${task._id}:`, error);
      
      return {
        taskId: task._id.toString(),
        businessId: null,
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Find businesses suitable for a given task
   */
  static async findSuitableBusinesses(task: ITask & Document) {
    try {
      // Find businesses that:
      // 1. Are active
      // 2. Support this task category
      // 3. Have available volunteer capacity
      // 4. Haven't been contacted too recently (avoid spam)
      
      const recentContactThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const businesses = await Business.find({
        isActive: true,
        services: task.taskCategory,
        $expr: {
          $lt: ['$currentVolunteerCount', '$maxVolunteersPerDay']
        },
        $or: [
          { lastContactedAt: { $exists: false } },
          { lastContactedAt: { $lt: recentContactThreshold } }
        ]
      }).sort({ 
        reliability: -1,
        responseTime: 1,
        lastContactedAt: 1 // Prefer businesses contacted less recently
      });
      
      // Filter by distance and current capacity
      const suitableBusinesses = businesses.filter(business => {
        // Check if business can handle this task (distance and other criteria)
        try {
          return business.canHandleTask(task.taskCategory, task.location.lat, task.location.lng);
        } catch (error) {
          console.warn(`Error checking business ${business._id} capability:`, error);
          return false;
        }
      });
      
      // Sort by priority: currently open > high reliability > close distance > less recently contacted
      return suitableBusinesses.sort((a, b) => {
        // Check if currently open (higher priority)
        const aOpen = this.isBusinessCurrentlyOpen(a);
        const bOpen = this.isBusinessCurrentlyOpen(b);
        
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        
        // Then by reliability (higher is better)
        const reliabilityDiff = b.reliability - a.reliability;
        if (Math.abs(reliabilityDiff) > 0.5) return reliabilityDiff;
        
        // Then by distance (closer is better)
        const aDistance = this.calculateDistance(
          a.address.lat, 
          a.address.lng, 
          task.location.lat, 
          task.location.lng
        );
        const bDistance = this.calculateDistance(
          b.address.lat, 
          b.address.lng, 
          task.location.lat, 
          task.location.lng
        );
        
        const distanceDiff = aDistance - bDistance;
        if (Math.abs(distanceDiff) > 2) return distanceDiff; // 2km threshold
        
        // Finally by last contacted time (less recent is better)
        const aLastContact = a.lastContactedAt?.getTime() || 0;
        const bLastContact = b.lastContactedAt?.getTime() || 0;
        
        return aLastContact - bLastContact;
      });
      
    } catch (error) {
      console.error('Error finding suitable businesses:', error);
      return [];
    }
  }
  
  /**
   * Check if a business is currently open based on business hours
   */
  static isBusinessCurrentlyOpen(business: IBusiness & Document): boolean {
    try {
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()] as keyof typeof business.businessHours;
      const daySchedule = business.businessHours[currentDay];
      
      if (!daySchedule?.isOpen) return false;
      
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
      return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
    } catch (error) {
      console.warn('Error checking business hours:', error);
      return false;
    }
  }
  
  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Reset business volunteer counts at the start of each day
   * This should be called daily at midnight
   */
  static async resetDailyVolunteerCounts(): Promise<void> {
    try {
      console.log('Resetting daily volunteer counts for all businesses...');
      
      const result = await Business.updateMany(
        { isActive: true },
        { $set: { currentVolunteerCount: 0 } }
      );
      
      console.log(`Reset volunteer counts for ${result.modifiedCount} businesses`);
      
    } catch (error) {
      console.error('Error resetting daily volunteer counts:', error);
      throw error;
    }
  }
  
  /**
   * Get statistics about business contact service performance
   */
  static async getServiceStats(): Promise<{
    tasksAwaitingBusinessContact: number;
    businessesActive: number;
    averageResponseTime: number;
    successRate: number;
  }> {
    try {
      const now = new Date();
      
      // Count tasks awaiting business contact
      const tasksAwaiting = await Task.countDocuments({
        noVolunteerTimeout: { $lte: now },
        $expr: { $eq: [{ $size: "$acceptedBy" }, 0] },
        businessContactAttempted: { $ne: true },
        $or: [
          { endTime: { $exists: false } },
          { endTime: { $gt: now } }
        ]
      });
      
      // Count active businesses
      const activeBusinesses = await Business.countDocuments({ isActive: true });
      
      // Calculate average response time and success rate
      const businesses = await Business.find({ 
        isActive: true,
        totalTasksAssigned: { $gt: 0 }
      });
      
      const avgResponseTime = businesses.length > 0 
        ? businesses.reduce((sum, b) => sum + b.responseTime, 0) / businesses.length 
        : 0;
      
      const totalAssigned = businesses.reduce((sum, b) => sum + b.totalTasksAssigned, 0);
      const totalSuccessful = businesses.reduce((sum, b) => sum + b.successfulAssignments, 0);
      const successRate = totalAssigned > 0 ? (totalSuccessful / totalAssigned) * 100 : 100;
      
      return {
        tasksAwaitingBusinessContact: tasksAwaiting,
        businessesActive: activeBusinesses,
        averageResponseTime: Math.round(avgResponseTime * 10) / 10,
        successRate: Math.round(successRate * 10) / 10
      };
      
    } catch (error) {
      console.error('Error getting service stats:', error);
      throw error;
    }
  }
}

export default BusinessContactService;