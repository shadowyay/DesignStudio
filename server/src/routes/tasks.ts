import express from 'express';
import Task from '../models/Task';
import User from '../models/User';

const router = express.Router();

// Create Task
router.post('/', async (req, res) => {
  try {
    const { title, description, peopleNeeded, urgency, createdBy, location, approxStartTime, endTime, amount } = req.body;
    const user = await User.findById(createdBy);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const task = new Task({ title, description, peopleNeeded, urgency, createdBy, location, approxStartTime, endTime, amount });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Volunteer accepts a task
router.post('/:id/accept', async (req, res) => {
  try {
    const { volunteerId } = req.body;
    if (!volunteerId) {
      return res.status(400).json({ success: false, message: 'Volunteer ID missing' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.accepted) return res.status(400).json({ success: false, message: 'Task already accepted' });
    task.accepted = true;
    try {
      task.acceptedBy = require('mongoose').Types.ObjectId(volunteerId);
    } catch (idErr) {
      return res.status(400).json({ success: false, message: 'Invalid volunteer ID', error: idErr });
    }
    try {
      await task.save();
    } catch (saveErr) {
      console.error('Error saving task:', saveErr);
      return res.status(500).json({ success: false, message: 'Error saving task', error: saveErr });
    }
    res.json({ success: true, message: 'Task accepted', task });
  } catch (err) {
    console.error('Error in accept route:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err });
  }
});

// Get All Tasks
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.createdBy) {
      filter = { createdBy: req.query.createdBy };
    }
    const tasks = await Task.find(filter).populate('createdBy', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
