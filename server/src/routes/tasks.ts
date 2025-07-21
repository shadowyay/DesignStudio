import express from 'express';
import Task from '../models/Task';
import User from '../models/User';

const router = express.Router();

// Create Task
router.post('/', async (req, res) => {
  try {
    const { title, description, peopleNeeded, urgency, createdBy } = req.body;
    const user = await User.findById(createdBy);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const task = new Task({ title, description, peopleNeeded, urgency, createdBy });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Get All Tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().populate('createdBy', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
