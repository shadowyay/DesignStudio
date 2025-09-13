import { TaskHistory } from '../models/TaskHistory';
import User, { IUser } from '../models/User';
import { subDays, startOfMonth, endOfMonth, differenceInDays, isSameDay, format } from 'date-fns';

interface UserStreakUpdate {
  currentStreak?: number;
  longestStreak?: number;
  lastTaskCompletedAt?: Date;
  lastStreakUpdateAt?: Date;
  streakBroken?: boolean;
  monthlyTasksCompleted?: number;
  lastActiveMonth?: Date;
  accountStatus?: 'active' | 'warning' | 'rejected';
  accountStatusUpdatedAt?: Date;
}

/**
 * Checks a volunteer's daily streak and monthly activity.
 * @param userId Volunteer userId (string)
 * @returns { streakBroken: boolean, lastStreakDate: Date|null, monthlyActive: boolean, lastActiveMonth: Date|null }
 */
export async function getVolunteerStreakAndActivity(userId: string) {
  // Get all completed tasks for this volunteer, sorted by completedAt descending
  const histories = await TaskHistory.find({
    'volunteers.userId': userId,
    completionStatus: { $in: ['Completed Successfully', 'Completed with Issues'] }
  }).sort({ completedAt: -1 }).select('completedAt');

  if (!histories.length) {
    return {
      streakBroken: true,
      lastStreakDate: null,
      monthlyActive: false,
      lastActiveMonth: null
    };
  }

  // Build a set of all days the volunteer completed a task
  const daysSet = new Set(
    histories.map(h => h.completedAt.toISOString().slice(0, 10))
  );

  // Check daily streak (from yesterday backwards)
  let streakBroken = false;
  let lastStreakDate: Date | null = null;
  const today = new Date();
  const yesterday = subDays(today, 1);
  let streakDate = yesterday;
  while (daysSet.has(streakDate.toISOString().slice(0, 10))) {
    lastStreakDate = new Date(streakDate);
    streakDate = subDays(streakDate, 1);
  }
  // If yesterday is not in the set, streak is broken
  if (!daysSet.has(yesterday.toISOString().slice(0, 10))) {
    streakBroken = true;
  }

  // Check monthly activity (for current month)
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);
  const monthlyActive = histories.some(h => h.completedAt >= startMonth && h.completedAt <= endMonth);
  let lastActiveMonth: Date | null = null;
  if (monthlyActive) {
    lastActiveMonth = today;
  } else {
    // Find the most recent month with activity
    for (const h of histories) {
      const month = startOfMonth(h.completedAt);
      if (!lastActiveMonth || month > lastActiveMonth) {
        lastActiveMonth = month;
      }
    }
  }

  return {
    streakBroken,
    lastStreakDate,
    monthlyActive,
    lastActiveMonth
  };
}

/**
 * Updates a volunteer's streak when they complete a task
 * @param userId Volunteer userId
 * @param taskCompletedAt Date when task was completed
 */
export async function updateVolunteerStreak(userId: string, taskCompletedAt: Date) {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'volunteer') {
      throw new Error('User not found or not a volunteer');
    }

    const today = new Date();
    const completedDate = new Date(taskCompletedAt);
    
    // Check if task was completed today
    const isCompletedToday = isSameDay(completedDate, today);
    const wasCompletedYesterday = isSameDay(completedDate, subDays(today, 1));
    
    if (!isCompletedToday && !wasCompletedYesterday) {
      // Task completed on a different day, don't update streak
      return user;
    }

    const lastTaskDate = user.lastTaskCompletedAt;
    let currentStreak = user.currentStreak || 0;
    let streakBroken = false;

    if (!lastTaskDate) {
      // First task ever
      currentStreak = 1;
    } else {
      const daysSinceLastTask = differenceInDays(completedDate, lastTaskDate);
      
      if (daysSinceLastTask === 1) {
        // Consecutive day, increment streak
        currentStreak += 1;
      } else if (daysSinceLastTask === 0) {
        // Same day, maintain streak (don't increment)
        // This handles multiple tasks in one day
      } else {
        // Gap in days, streak broken, restart
        currentStreak = 1;
        streakBroken = true;
      }
    }

    // Update user streak data
    const updateData: UserStreakUpdate = {
      currentStreak,
      lastTaskCompletedAt: completedDate,
      lastStreakUpdateAt: today,
      streakBroken,
      accountStatus: 'active',
      accountStatusUpdatedAt: today
    };

    // Update longest streak if current is greater
    if (currentStreak > (user.longestStreak || 0)) {
      updateData.longestStreak = currentStreak;
    }

    // Update monthly tasks completed
    const currentMonth = startOfMonth(today);
    if (!user.lastActiveMonth || !isSameDay(user.lastActiveMonth, currentMonth)) {
      updateData.monthlyTasksCompleted = 1;
      updateData.lastActiveMonth = currentMonth;
    } else {
      updateData.monthlyTasksCompleted = (user.monthlyTasksCompleted || 0) + 1;
    }

    await User.findByIdAndUpdate(userId, updateData);
    
    console.log(`Volunteer ${userId} streak updated: ${currentStreak} days`);
    return await User.findById(userId);
  } catch (error) {
    console.error('Error updating volunteer streak:', error);
    throw error;
  }
}

/**
 * Checks and handles daily streak breaks for all volunteers
 * Should be run daily via cron job
 */
export async function checkDailyStreaks() {
  try {
    const volunteers = await User.find({ 
      role: 'volunteer', 
      accountStatus: { $in: ['active', 'warning'] }
    });

    const today = new Date();

    for (const volunteer of volunteers) {
      const lastTaskDate = volunteer.lastTaskCompletedAt;
      
      if (!lastTaskDate) {
        // No tasks completed yet, mark as streak broken
        await User.findByIdAndUpdate(volunteer._id, {
          streakBroken: true,
          currentStreak: 0,
          lastStreakUpdateAt: today
        });
        continue;
      }

      const daysSinceLastTask = differenceInDays(today, lastTaskDate);
      
      if (daysSinceLastTask > 1) {
        // Streak broken (more than 1 day without completing a task)
        await User.findByIdAndUpdate(volunteer._id, {
          streakBroken: true,
          currentStreak: 0,
          lastStreakUpdateAt: today
        });
        
        console.log(`Streak broken for volunteer ${volunteer._id}: ${daysSinceLastTask} days without task completion`);
      }
    }
    
    console.log(`Daily streak check completed for ${volunteers.length} volunteers`);
  } catch (error) {
    console.error('Error checking daily streaks:', error);
  }
}

/**
 * Checks monthly activity and handles account rejections
 * Should be run monthly via cron job
 */
export async function checkMonthlyActivity() {
  try {
    const volunteers = await User.find({ 
      role: 'volunteer',
      accountStatus: { $in: ['active', 'warning'] }
    });

    const today = new Date();
    const currentMonth = startOfMonth(today);
    const lastMonth = startOfMonth(subDays(currentMonth, 1));

    for (const volunteer of volunteers) {
      // Check if volunteer completed any tasks this month
      const thisMonthTasks = await TaskHistory.countDocuments({
        'volunteers.userId': volunteer._id.toString(),
        completionStatus: { $in: ['Completed Successfully', 'Completed with Issues'] },
        completedAt: {
          $gte: currentMonth,
          $lte: endOfMonth(today)
        }
      });

      const lastMonthTasks = await TaskHistory.countDocuments({
        'volunteers.userId': volunteer._id.toString(),
        completionStatus: { $in: ['Completed Successfully', 'Completed with Issues'] },
        completedAt: {
          $gte: lastMonth,
          $lte: endOfMonth(lastMonth)
        }
      });

      if (thisMonthTasks === 0 && lastMonthTasks === 0) {
        // No tasks completed for 2 months, reject account
        await User.findByIdAndUpdate(volunteer._id, {
          accountStatus: 'rejected',
          accountStatusUpdatedAt: today
        });
        
        console.log(`Account rejected for volunteer ${volunteer._id}: No tasks completed for 2 months`);
      } else if (thisMonthTasks === 0) {
        // No tasks this month, set warning
        await User.findByIdAndUpdate(volunteer._id, {
          accountStatus: 'warning',
          accountStatusUpdatedAt: today
        });
        
        console.log(`Warning set for volunteer ${volunteer._id}: No tasks completed this month`);
      } else {
        // Active this month, ensure status is active
        await User.findByIdAndUpdate(volunteer._id, {
          accountStatus: 'active',
          monthlyTasksCompleted: thisMonthTasks,
          lastActiveMonth: currentMonth,
          accountStatusUpdatedAt: today
        });
      }
    }
    
    console.log(`Monthly activity check completed for ${volunteers.length} volunteers`);
  } catch (error) {
    console.error('Error checking monthly activity:', error);
  }
}

/**
 * Gets comprehensive streak information for a volunteer
 * @param userId Volunteer userId
 */
export async function getVolunteerStreakInfo(userId: string) {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'volunteer') {
      throw new Error('User not found or not a volunteer');
    }

    const today = new Date();
    
    // Get recent task history
    const recentTasks = await TaskHistory.find({
      'volunteers.userId': userId,
      completionStatus: { $in: ['Completed Successfully', 'Completed with Issues'] }
    })
    .sort({ completedAt: -1 })
    .limit(30)
    .select('completedAt taskCategory');

    // Calculate days since last task
    const daysSinceLastTask = user.lastTaskCompletedAt 
      ? differenceInDays(today, user.lastTaskCompletedAt)
      : null;

    return {
      userId: user._id,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      streakBroken: user.streakBroken || false,
      lastTaskCompletedAt: user.lastTaskCompletedAt,
      daysSinceLastTask,
      monthlyTasksCompleted: user.monthlyTasksCompleted || 0,
      accountStatus: user.accountStatus || 'active',
      accountStatusUpdatedAt: user.accountStatusUpdatedAt,
      recentTasks: recentTasks.map(task => ({
        completedAt: task.completedAt,
        taskCategory: task.taskCategory,
        dayLabel: format(task.completedAt, 'MMM dd, yyyy')
      }))
    };
  } catch (error) {
    console.error('Error getting volunteer streak info:', error);
    throw error;
  }
}
