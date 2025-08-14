import express from 'express';
import { getUserById, updateUserProfile, deleteUserById } from '../controllers/userController';

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
  } catch (err: any) {
    res.status(404).json({ message: err.message || 'User not found' });
  }
});

export default router; 