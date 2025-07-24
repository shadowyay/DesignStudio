import express from 'express';
import Task from '../models/Task';
import User from '../models/User';
import mongoose from 'mongoose';

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
router.post('/:id/accept/:volunteerId', async (req, res) => {
  try {
    const { id: taskId, volunteerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(volunteerId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task or volunteer ID' });
    }

    // This is the most robust way to handle the update to prevent race conditions.
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const isAlreadyAccepted = task.acceptedBy.map(id => id.toString()).includes(volunteerId);
    if (isAlreadyAccepted) {
      return res.status(400).json({ success: false, message: 'You have already accepted this task.' });
    }

    if (task.acceptedBy.length >= task.peopleNeeded) {
      return res.status(400).json({ success: false, message: 'This task is already full.' });
    }

    // Add the volunteer and explicitly mark the array as modified.
    task.acceptedBy.push(new mongoose.Types.ObjectId(volunteerId));
    task.markModified('acceptedBy');
    
    await task.save();

    // To ensure the client gets the latest data, populate the fields *after* saving.
    const updatedTask = await Task.findById(taskId).populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'acceptedBy', select: 'name email' },
    ]);
    
    res.json({
      success: true,
      message: 'Task accepted',
      task: {
        ...updatedTask!.toObject(),
        acceptedCount: updatedTask!.acceptedBy.length,
        isFull: updatedTask!.acceptedBy.length >= updatedTask!.peopleNeeded,
      },
    });

  } catch (err) {
    console.error('Error in accept route:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Task (only if not accepted by any volunteers)
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    // Get userId from headers (sent from frontend)
    const userId = req.headers['userid'];
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.acceptedBy && task.acceptedBy.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete a task that has been accepted by volunteers.' });
    }
    // Optionally, check if the user is the creator
    if (userId && task.createdBy.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this task.' });
    }
    await Task.findByIdAndDelete(taskId);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get All Tasks
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.createdBy) {
      filter = { createdBy: req.query.createdBy };
    }
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email')
      .populate('acceptedBy', 'name email');
    // Format the response to include all relevant fields
    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      peopleNeeded: task.peopleNeeded,
      urgency: task.urgency,
      createdBy: task.createdBy, // will include name and email
      location: task.location,
      approxStartTime: task.approxStartTime,
      endTime: task.endTime,
      amount: task.amount,
      acceptedBy: task.acceptedBy, // array of users
      acceptedCount: task.acceptedBy.length,
      isFull: task.acceptedBy.length >= task.peopleNeeded,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));
    res.json(formattedTasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
