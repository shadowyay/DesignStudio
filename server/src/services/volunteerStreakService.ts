import { TaskHistory } from '../models/TaskHistory';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

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
