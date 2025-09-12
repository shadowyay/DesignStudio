import express, { Request, Response } from 'express';
import { TaskHistory } from '../models/TaskHistory';
import mongoose from 'mongoose';

const router = express.Router();

// Interface for history query parameters
interface HistoryQueryParams {
  userId?: string;
  taskCategory?: 'General' | 'Emergency' | 'Donor' | 'Rental' | 'Other';
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  completionStatus?: 'Completed Successfully' | 'Completed with Issues' | 'Cancelled' | 'Failed';
  dateFrom?: string;
  dateTo?: string;
  limit?: string;
  skip?: string;
  page?: string;
}

// Interface for response body types
interface HistoryResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Get user task history (tasks created by user)
router.get('/user/:userId', async (req: Request<{ userId: string }, HistoryResponse, never, HistoryQueryParams>, res: Response<HistoryResponse>) => {
  try {
    const { userId } = req.params;
    const { 
      taskCategory, 
      urgency, 
      completionStatus, 
      dateFrom, 
      dateTo, 
      limit = '20', 
      page = '1' 
    } = req.query;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    // Calculate skip based on page and limit
    const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 items per page
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    // Build query options
    const options = {
      taskCategory,
      urgency,
      completionStatus,
      dateFrom,
      dateTo,
      limit: limitNum,
      skip
    };

    // Get history using static method
    const history = await (TaskHistory as unknown as { getUserHistory: (userId: string, options: Record<string, unknown>) => Promise<mongoose.Document[]> }).getUserHistory(userId, options);
    
    // Get total count for pagination
    const query: Record<string, unknown> = { 'createdBy.userId': userId };
    if (taskCategory) query.taskCategory = taskCategory;
    if (urgency) query.urgency = urgency;
    if (completionStatus) query.completionStatus = completionStatus;
    if (dateFrom || dateTo) {
      query.completedAt = {};
      if (dateFrom) (query.completedAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (query.completedAt as Record<string, Date>).$lte = new Date(dateTo);
    }
    
    const totalCount = await TaskHistory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Calculate user statistics
    const stats = await TaskHistory.aggregate([
      { $match: { 'createdBy.userId': userId } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
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
          },
          totalAmountSpent: { $sum: '$financial.amountPaid' },
          avgEfficiency: { $avg: '$statistics.efficiency' },
          avgSuccessRate: { $avg: '$statistics.successRate' },
          avgResponseTime: { $avg: '$statistics.responseTime' },
          avgCompletionTime: { $avg: '$statistics.completionTime' }
        }
      }
    ]);

    const userStats = stats.length > 0 ? stats[0] : {
      totalTasks: 0,
      completedSuccessfully: 0,
      completedWithIssues: 0,
      cancelled: 0,
      failed: 0,
      totalAmountSpent: 0,
      avgEfficiency: 0,
      avgSuccessRate: 0,
      avgResponseTime: 0,
      avgCompletionTime: 0
    };

    // Calculate success rate percentage
    userStats.successRatePercentage = userStats.totalTasks > 0 
      ? ((userStats.completedSuccessfully + userStats.completedWithIssues) / userStats.totalTasks) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        statistics: userStats
      }
    });

  } catch (error) {
    console.error('Error fetching user task history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task history' });
  }
});

// Get volunteer history (tasks accepted/volunteered for by user)
router.get('/volunteer/:userId', async (req: Request<{ userId: string }, HistoryResponse, never, HistoryQueryParams>, res: Response<HistoryResponse>) => {
  try {
    const { userId } = req.params;
    const { 
      taskCategory, 
      urgency, 
      dateFrom, 
      dateTo, 
      limit = '20', 
      page = '1' 
    } = req.query;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }

    // Calculate skip based on page and limit
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    // Import Task model
    const Task = (await import('../models/Task')).default;

    // Build match conditions for tasks where user is in acceptedBy array
    const matchConditions: Record<string, unknown> = {
      acceptedBy: new mongoose.Types.ObjectId(userId)
    };

    // Add filters
    if (taskCategory) matchConditions.taskCategory = taskCategory;
    if (urgency) matchConditions.urgency = urgency;
    if (dateFrom || dateTo) {
      matchConditions.createdAt = {};
      if (dateFrom) (matchConditions.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (matchConditions.createdAt as Record<string, Date>).$lte = new Date(dateTo);
    }

    // Get tasks and populate creator info
    const tasks = await Task.find(matchConditions)
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Transform tasks to match expected history format
    const history = tasks.map(task => ({
      _id: task._id,
      taskId: task._id.toString(),
      title: task.title,
      description: task.description,
      taskCategory: task.taskCategory,
      urgency: task.urgency,
      amount: task.amount || 0,
      location: {
        address: task.location?.address || '',
        lat: task.location?.lat || 0,
        lng: task.location?.lng || 0,
        city: 'Unknown',
        state: 'Unknown', 
        country: 'India'
      },
      createdBy: {
        userId: typeof task.createdBy === 'object' && task.createdBy && '_id' in task.createdBy ? task.createdBy._id.toString() : '',
        name: typeof task.createdBy === 'object' && task.createdBy && 'name' in task.createdBy ? task.createdBy.name || 'Unknown User' : 'Unknown User',
        email: typeof task.createdBy === 'object' && task.createdBy && 'email' in task.createdBy ? task.createdBy.email || '' : '',
        phone: typeof task.createdBy === 'object' && task.createdBy && 'phone' in task.createdBy ? task.createdBy.phone : undefined
      },
      volunteers: [], // Not needed for accepted tasks view
      businessVolunteerInfo: task.businessVolunteerInfo ? {
        businessId: task.assignedBusinessId?.toString() || '',
        businessName: task.businessVolunteerInfo.businessName || '',
        businessContact: task.businessVolunteerInfo.businessContact || '',
        volunteerName: task.businessVolunteerInfo.volunteerName || '',
        volunteerPhone: task.businessVolunteerInfo.volunteerPhone || '',
        volunteerEmail: task.businessVolunteerInfo.volunteerEmail,
        estimatedArrival: task.businessVolunteerInfo.estimatedArrival?.toISOString(),
        assignedAt: task.businessVolunteerInfo.assignedAt?.toISOString() || ''
      } : undefined,
      createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
      completedAt: '', // Not completed yet for accepted tasks
      approxStartTime: task.approxStartTime?.toISOString(),
      endTime: task.endTime?.toISOString(),
      actualDuration: 0,
      peopleNeeded: task.peopleNeeded || 1,
      actualVolunteersCount: task.acceptedBy?.length || 0,
      completionStatus: 'In Progress' as const, // These are accepted but ongoing
      completionNotes: '',
      userRating: undefined,
      volunteerRatings: [],
      financial: {
        totalAmount: task.amount || 0,
        amountPaid: 0,
        paymentStatus: 'Pending' as const,
        paymentMethod: undefined,
        transactionId: undefined,
        paidAt: undefined
      },
      statistics: {
        responseTime: 0,
        completionTime: 0,
        efficiency: 0,
        successRate: 0
      },
      issues: []
    }));
    
    const totalCount = tasks.length;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Calculate volunteer statistics for accepted tasks
    const totalTasksAccepted = totalCount;
    const totalEarnings = tasks.reduce((sum, task) => sum + (task.amount || 0), 0);
    


    const volunteerStats = {
      totalTasks: totalTasksAccepted,
      completedSuccessfully: 0, // These are accepted tasks, not completed
      completedWithIssues: 0,
      cancelled: 0,
      failed: 0,
      totalEarnings: totalEarnings,
      avgEfficiency: 0,
      avgSuccessRate: 0,
      avgResponseTime: 0,
      avgCompletionTime: 0,
      successRatePercentage: 0
    };

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        statistics: volunteerStats
      }
    });

  } catch (error) {
    console.error('Error fetching volunteer history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch volunteer history' });
  }
});

// Get business history (tasks handled by business)
router.get('/business/:businessId', async (req: Request<{ businessId: string }, HistoryResponse, never, HistoryQueryParams>, res: Response<HistoryResponse>) => {
  try {
    const { businessId } = req.params;
    const { 
      taskCategory, 
      dateFrom, 
      dateTo, 
      limit = '20', 
      page = '1' 
    } = req.query;

    // Validate businessId format
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({ success: false, error: 'Invalid business ID format' });
    }

    // Calculate skip based on page and limit
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    // Build query options
    const options = {
      taskCategory,
      dateFrom,
      dateTo,
      limit: limitNum,
      skip
    };

    // Get history using static method
    const history = await (TaskHistory as unknown as { getBusinessHistory: (businessId: string, options: Record<string, unknown>) => Promise<mongoose.Document[]> }).getBusinessHistory(businessId, options);
    
    // Get total count for pagination
    const query: Record<string, unknown> = { 'businessVolunteerInfo.businessId': businessId };
    if (taskCategory) query.taskCategory = taskCategory;
    if (dateFrom || dateTo) {
      query.completedAt = {};
      if (dateFrom) (query.completedAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (query.completedAt as Record<string, Date>).$lte = new Date(dateTo);
    }
    
    const totalCount = await TaskHistory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Calculate business statistics
    const stats = await TaskHistory.aggregate([
      { $match: { 'businessVolunteerInfo.businessId': businessId } },
      {
        $group: {
          _id: null,
          totalTasksHandled: { $sum: 1 },
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
          },
          avgEfficiency: { $avg: '$statistics.efficiency' },
          avgSuccessRate: { $avg: '$statistics.successRate' }
        }
      }
    ]);

    const businessStats = stats.length > 0 ? stats[0] : {
      totalTasksHandled: 0,
      completedSuccessfully: 0,
      completedWithIssues: 0,
      cancelled: 0,
      failed: 0,
      avgEfficiency: 0,
      avgSuccessRate: 0
    };

    // Calculate success rate percentage
    businessStats.successRatePercentage = businessStats.totalTasksHandled > 0 
      ? ((businessStats.completedSuccessfully + businessStats.completedWithIssues) / businessStats.totalTasksHandled) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        statistics: businessStats
      }
    });

  } catch (error) {
    console.error('Error fetching business history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch business history' });
  }
});

// Get detailed task history by ID
router.get('/task/:taskId', async (req: Request<{ taskId: string }>, res: Response) => {
  try {
    const { taskId } = req.params;

    const taskHistory = await TaskHistory.findOne({ taskId });

    if (!taskHistory) {
      return res.status(404).json({ error: 'Task history not found' });
    }

    res.json({
      success: true,
      data: taskHistory
    });

  } catch (error) {
    console.error('Error fetching task history by ID:', error);
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

// Get overall platform statistics
router.get('/stats/platform', async (req: Request, res: Response) => {
  try {
    const stats = await TaskHistory.aggregate([
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          totalUsers: { $addToSet: '$createdBy.userId' },
          totalVolunteers: { $addToSet: '$volunteers.userId' },
          totalBusinesses: { $addToSet: '$businessVolunteerInfo.businessId' },
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
          },
          totalRevenue: { $sum: '$financial.amountPaid' },
          avgEfficiency: { $avg: '$statistics.efficiency' },
          avgSuccessRate: { $avg: '$statistics.successRate' },
          avgResponseTime: { $avg: '$statistics.responseTime' },
          avgCompletionTime: { $avg: '$statistics.completionTime' }
        }
      },
      {
        $addFields: {
          totalUniqueUsers: { $size: '$totalUsers' },
          totalUniqueVolunteers: { $size: '$totalVolunteers' },
          totalUniqueBusiness: { $size: '$totalBusinesses' }
        }
      }
    ]);

    // Get category breakdown
    const categoryStats = await TaskHistory.aggregate([
      {
        $group: {
          _id: '$taskCategory',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$financial.amountPaid' },
          avgSuccessRate: { $avg: '$statistics.successRate' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly trends (last 12 months)
    const monthlyTrends = await TaskHistory.aggregate([
      {
        $match: {
          completedAt: {
            $gte: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$financial.amountPaid' },
          avgSuccessRate: { $avg: '$statistics.successRate' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const platformStats = stats.length > 0 ? stats[0] : {
      totalTasks: 0,
      totalUniqueUsers: 0,
      totalUniqueVolunteers: 0,
      totalUniqueBusiness: 0,
      completedSuccessfully: 0,
      completedWithIssues: 0,
      cancelled: 0,
      failed: 0,
      totalRevenue: 0,
      avgEfficiency: 0,
      avgSuccessRate: 0,
      avgResponseTime: 0,
      avgCompletionTime: 0
    };

    // Calculate overall success rate
    platformStats.overallSuccessRate = platformStats.totalTasks > 0 
      ? ((platformStats.completedSuccessfully + platformStats.completedWithIssues) / platformStats.totalTasks) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        platformStats,
        categoryBreakdown: categoryStats,
        monthlyTrends
      }
    });

  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
});

export default router;