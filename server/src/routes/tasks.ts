import express from 'express';
import { createTask, getTasks, acceptTask, deleteTask } from '../controllers/taskController';

const router = express.Router();

// Create Task
router.post('/', async (req, res) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Volunteer accepts a task
router.post('/:id/accept/:volunteerId', async (req, res) => {
  try {
    const { id: taskId, volunteerId } = req.params;
    const result = await acceptTask(taskId, volunteerId);
    
    res.json({
      success: true,
      message: 'Task accepted',
      task: result,
    });
  } catch (err) {
    console.error('Error in accept route:', err);
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
});

// Delete Task (only if not accepted by any volunteers)
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.headers['userid'];
    
    // Optional: check if the user is the creator
    if (userId) {
      const task = await getTasks({ _id: taskId });
      if (task.length > 0 && task[0].createdBy._id.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to delete this task.' });
      }
    }
    
    await deleteTask(taskId);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
});

// Get All Tasks
router.get('/', async (req, res) => {
  try {
    let filter = {};
    if (req.query.createdBy) {
      filter = { createdBy: req.query.createdBy };
    }
    const tasks = await getTasks(filter);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

export default router;
