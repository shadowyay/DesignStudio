import express from 'express';
import { getUserById, updateUserProfile, deleteUserById } from '../controllers/userController';
import { getVolunteerStreakAndActivity, getVolunteerStreakInfo } from '../services/volunteerStreakService';

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (_err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await updateUserProfile(req.params.id, req.body);
    res.json(updatedUser);
  } catch (_err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteUserById(req.params.id);
    res.json(result);
  } catch (err) {
    let message = 'User not found';
    if (err && typeof err === 'object' && 'message' in err) {
      const errorWithMessage = err as { message?: string };
      message = errorWithMessage.message || message;
    }
    res.status(404).json({ message });
  }
});

// Get volunteer streak and monthly activity status (legacy endpoint)
router.get('/:id/streak', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await getVolunteerStreakAndActivity(userId);
    // If not active this month, add rejection flag
    res.json({
      ...result,
      rejected: !result.monthlyActive
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Get comprehensive volunteer streak information
router.get('/:id/streak-info', async (req, res) => {
  try {
    const userId = req.params.id;
    const streakInfo = await getVolunteerStreakInfo(userId);
    res.json(streakInfo);
  } catch (err) {
    console.error('Error getting volunteer streak info:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ message, error: err });
  }
});

// Get volunteer account status and streak summary
router.get('/:id/account-status', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'volunteer') {
      return res.status(400).json({ message: 'User is not a volunteer' });
    }

    const streakInfo = await getVolunteerStreakInfo(userId);
    
    res.json({
      userId: user._id,
      accountStatus: user.accountStatus || 'active',
      accountStatusUpdatedAt: user.accountStatusUpdatedAt,
      currentStreak: streakInfo.currentStreak,
      streakBroken: streakInfo.streakBroken,
      daysSinceLastTask: streakInfo.daysSinceLastTask,
      monthlyTasksCompleted: streakInfo.monthlyTasksCompleted,
      isActive: user.accountStatus === 'active',
      isWarning: user.accountStatus === 'warning',
      isRejected: user.accountStatus === 'rejected',
      message: getAccountStatusMessage(user.accountStatus, streakInfo)
    });
  } catch (err) {
    console.error('Error getting account status:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ message, error: err });
  }
});

// Helper function to get account status message
function getAccountStatusMessage(status: string | undefined, streakInfo: any): string {
  const daysSince = streakInfo.daysSinceLastTask;
  
  switch (status) {
    case 'active':
      if (daysSince === 0) {
        return '🎉 Great job! You completed a task today. Keep your streak going!';
      } else if (daysSince === 1) {
        return '⚡ Your streak is active! Complete a task today to maintain it.';
      } else if (daysSince && daysSince > 1) {
        return `⚠️ Your streak was broken ${daysSince} days ago. Complete a task to start a new streak!`;
      }
      return '✅ Your account is active. Complete tasks daily to build your streak!';
      
    case 'warning':
      return '⚠️ Warning: You haven\'t completed any tasks this month. Complete at least one task to avoid account rejection.';
      
    case 'rejected':
      return '❌ Your account has been rejected due to inactivity. You haven\'t completed tasks for more than a month.';
      
    default:
      return 'Account status unknown.';
  }
}

export default router;