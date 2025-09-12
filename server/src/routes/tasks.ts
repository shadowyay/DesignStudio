import express from 'express';
import { createTask, getTasks, acceptTask, deleteTask, updateTask } from '../controllers/taskController';
import { auth, AuthRequest } from '../middleware/auth';

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

// Update Task
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.headers['userid'];
    
    // Check if the user is the creator
    if (userId) {
      const task = await getTasks({ _id: taskId });
      if (task.length > 0 && task[0].createdBy._id.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to update this task.' });
      }
    }
    
    const updatedTask = await updateTask(taskId, req.body);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Volunteer accepts a task
router.post('/:id/accept/:volunteerId', auth, async (req: AuthRequest, res) => {
  try {
    const { id: taskId, volunteerId } = req.params;
<<<<<<< Updated upstream
    console.log('Accept task route called:', { taskId, volunteerId });
=======
    
    // Verify that the authenticated user is the one trying to accept the task
    if (req.user?.userId !== volunteerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept tasks for yourself'
      });
    }
    
>>>>>>> Stashed changes
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
