import express from 'express';
import { getUserById, updateUserProfile, deleteUserById } from '../controllers/userController';
import { getVolunteerStreakAndActivity } from '../services/volunteerStreakService';

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

// Get volunteer streak and monthly activity status
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

export default router;