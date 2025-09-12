import express from 'express';
import Business from '../models/Business';
import Task from '../models/Task';
import { sendBusinessVolunteerRequest } from '../utils/emailUtils';
import { BusinessContactService } from '../services/businessContactService';

const router = express.Router();

// Register a new business partner
router.post('/register', async (req, res) => {
  try {
    const businessData = req.body;
    
    // Check if business email already exists
    const existingBusiness = await Business.findOne({ email: businessData.email });
    if (existingBusiness) {
      return res.status(400).json({ 
        success: false, 
        message: 'Business with this email already exists' 
      });
    }

    // Create new business
    const business = new Business(businessData);
    await business.save();

    res.status(201).json({
      success: true,
      message: 'Business registered successfully',
      business: {
        _id: business._id,
        name: business.name,
        email: business.email,
        services: business.services,
        coverageRadius: business.coverageRadius,
        isActive: business.isActive
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to register business';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

// Get all active businesses (admin only)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, services, city } = req.query;
    
    const query: Record<string, unknown> = { isActive: true };
    
    if (services) {
      query.services = { $in: Array.isArray(services) ? services : [services] };
    }
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    const businesses = await Business.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .select('-__v');

    const total = await Business.countDocuments(query);

    res.json({
      success: true,
      businesses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalBusinesses: total
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch businesses';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Find suitable businesses for a task
router.get('/suitable/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Find businesses that can handle this task
    const businesses = await Business.find({ 
      isActive: true,
      services: task.taskCategory,
      $expr: {
        $lt: ['$currentVolunteerCount', '$maxVolunteersPerDay']
      }
    }).sort({ reliability: -1, responseTime: 1 });

    // Filter by distance and availability
    const suitableBusinesses = businesses.filter(business => {
      return business.canHandleTask(
        task.taskCategory, 
        task.location.lat, 
        task.location.lng
      );
    }).map(business => ({
      _id: business._id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      services: business.services,
      coverageRadius: business.coverageRadius,
      responseTime: business.responseTime,
      reliability: business.reliability,
      successRate: business.successRate,
      distance: business.distanceTo(task.location.lat, task.location.lng),
      isCurrentlyOpen: business.isCurrentlyOpen(),
      availableVolunteers: business.maxVolunteersPerDay - business.currentVolunteerCount
    })).sort((a, b) => {
      // Sort by: currently open > reliability > distance
      if (a.isCurrentlyOpen && !b.isCurrentlyOpen) return -1;
      if (!a.isCurrentlyOpen && b.isCurrentlyOpen) return 1;
      if (Math.abs(a.reliability - b.reliability) > 0.5) return b.reliability - a.reliability;
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      businesses: suitableBusinesses,
      taskInfo: {
        _id: task._id,
        title: task.title,
        taskCategory: task.taskCategory,
        urgency: task.urgency,
        location: task.location
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to find suitable businesses';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Contact business for volunteer assignment
router.post('/contact/:businessId/task/:taskId', async (req, res) => {
  try {
    const { businessId, taskId } = req.params;
    
    // Get business and task
    const business = await Business.findById(businessId);
    const task = await Task.findById(taskId).populate('createdBy', 'name email phone');
    
    if (!business || !task) {
      return res.status(404).json({
        success: false,
        message: 'Business or task not found'
      });
    }

    // Check if business can handle this task
    if (!business.canHandleTask(task.taskCategory, task.location.lat, task.location.lng)) {
      return res.status(400).json({
        success: false,
        message: 'Business cannot handle this task'
      });
    }

    // Check if task hasn't already been assigned to a business
    if (task.businessContactAttempted) {
      return res.status(400).json({
        success: false,
        message: 'Task has already been assigned to a business'
      });
    }

    // Update task with business contact info
    task.businessContactAttempted = true;
    task.businessContactedAt = new Date();
    task.assignedBusinessId = business._id;
    await task.save();

    // Update business contact time and increment current volunteer count
    business.lastContactedAt = new Date();
    business.currentVolunteerCount += 1;
    business.totalTasksAssigned += 1;
    await business.save();

    // Send email to business
    try {
      await sendBusinessVolunteerRequest(
        business.contactPerson.email,
        business.contactPerson.name,
        business.name,
        task.title,
        task.description,
        task.location.address,
        task.urgency,
        task.amount,
        (task.createdBy as { name?: string })?.name || 'Unknown',
        (task.createdBy as { email?: string })?.email || '',
        (task.createdBy as { phone?: string })?.phone || '',
        task._id.toString(),
        business._id.toString()
      );
    } catch (emailError) {
      console.error('Failed to send business contact email:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'Business contacted successfully',
      contactInfo: {
        businessName: business.name,
        contactPerson: business.contactPerson.name,
        contactEmail: business.contactPerson.email,
        responseTime: business.responseTime
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to contact business';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Business accepts volunteer assignment and provides volunteer details
router.post('/accept/:businessId/task/:taskId', async (req, res) => {
  try {
    const { businessId, taskId } = req.params;
    const { volunteerName, volunteerPhone, volunteerEmail, estimatedArrival } = req.body;
    
    if (!volunteerName || !volunteerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer name and phone are required'
      });
    }

    // Get business and task
    const business = await Business.findById(businessId);
    const task = await Task.findById(taskId).populate('createdBy', 'name email');
    
    if (!business || !task) {
      return res.status(404).json({
        success: false,
        message: 'Business or task not found'
      });
    }

    // Verify this business was assigned to this task
    if (!task.assignedBusinessId?.equals(business._id)) {
      return res.status(400).json({
        success: false,
        message: 'This business is not assigned to this task'
      });
    }

    // Update task with volunteer info
    task.businessVolunteerInfo = {
      volunteerName,
      volunteerPhone,
      volunteerEmail: volunteerEmail || undefined,
      estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : undefined,
      assignedAt: new Date(),
      businessName: business.name,
      businessContact: business.contactPerson.phone
    };
    await task.save();

    // Update business success metrics
    business.successfulAssignments += 1;
    await business.save();

    // TODO: Send notification to task creator about business volunteer assignment

    res.json({
      success: true,
      message: 'Volunteer assigned successfully',
      volunteerInfo: task.businessVolunteerInfo
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign volunteer';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Business declines volunteer assignment
router.post('/decline/:businessId/task/:taskId', async (req, res) => {
  try {
    const { businessId, taskId } = req.params;
    const { reason } = req.body;
    
    // Get business and task
    const business = await Business.findById(businessId);
    const task = await Task.findById(taskId);
    
    if (!business || !task) {
      return res.status(404).json({
        success: false,
        message: 'Business or task not found'
      });
    }

    // Verify this business was assigned to this task
    if (!task.assignedBusinessId?.equals(business._id)) {
      return res.status(400).json({
        success: false,
        message: 'This business is not assigned to this task'
      });
    }

    // Reset task business assignment
    task.businessContactAttempted = false;
    task.businessContactedAt = undefined;
    task.assignedBusinessId = undefined;
    await task.save();

    // Decrement business current volunteer count
    business.currentVolunteerCount = Math.max(0, business.currentVolunteerCount - 1);
    await business.save();

    // TODO: Log the decline reason for analytics
    console.log(`Business ${business.name} declined task ${task._id}: ${reason}`);

    res.json({
      success: true,
      message: 'Task assignment declined'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to decline assignment';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Get business profile and stats
router.get('/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findById(businessId).select('-__v');
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Get recent task assignments
    const recentTasks = await Task.find({
      assignedBusinessId: businessId,
      businessVolunteerInfo: { $exists: true }
    })
    .limit(10)
    .sort({ 'businessVolunteerInfo.assignedAt': -1 })
    .select('title taskCategory createdAt businessVolunteerInfo.assignedAt location.address');

    res.json({
      success: true,
      business: {
        ...business.toObject(),
        successRate: business.successRate
      },
      recentTasks
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch business profile';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Update business information
router.put('/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated via this endpoint
    delete updates.totalTasksAssigned;
    delete updates.successfulAssignments;
    delete updates.currentVolunteerCount;
    delete updates.createdAt;
    delete updates.updatedAt;

    const business = await Business.findByIdAndUpdate(
      businessId, 
      updates, 
      { new: true, runValidators: true }
    );
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.json({
      success: true,
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update business';
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

// Manual trigger for business contact service (admin/cron use)
router.post('/contact-service/run', async (req, res) => {
  try {
    console.log('Manually triggering business contact service...');
    const results = await BusinessContactService.processTasksNeedingBusinessContact();
    
    res.json({
      success: true,
      message: `Business contact service completed`,
      results: {
        totalProcessed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to run business contact service';
    console.error('Error running business contact service:', error);
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Get business contact service statistics
router.get('/contact-service/stats', async (req, res) => {
  try {
    const stats = await BusinessContactService.getServiceStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get service stats';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// Reset daily volunteer counts (should be called daily via cron)
router.post('/contact-service/reset-daily-counts', async (req, res) => {
  try {
    await BusinessContactService.resetDailyVolunteerCounts();
    
    res.json({
      success: true,
      message: 'Daily volunteer counts reset successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset daily counts';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

export default router;