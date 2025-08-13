import Task from '../models/Task';
import User from '../models/User';
import { validateLocation, formatLocationForDB } from '../utils/locationUtils';
import mongoose, { FilterQuery } from 'mongoose';
import { ITask } from '../models/Task';

export const createTask = async (taskData: Omit<ITask, 'acceptedBy' | 'createdAt' | 'updatedAt' | '_id'>) => {
  const { title, description, peopleNeeded, urgency, createdBy, location, approxStartTime, endTime, amount, taskCategory } = taskData;
  
  // Validate user exists
  const user = await User.findById(createdBy);
  if (!user) {
    throw new Error('User not found');
  }

  // Validate location
  if (!validateLocation(location)) {
    throw new Error('Invalid location data');
  }

  // Format location for database
  const formattedLocation = formatLocationForDB(location);

  // Create task
  const task = new Task({ 
    title, 
    description, 
    peopleNeeded, 
    urgency, 
    createdBy, 
    location: formattedLocation, 
    approxStartTime, 
    endTime, 
    amount,
    taskCategory: taskCategory || 'General'
  });
  
  return await task.save();
};

export const updateTask = async (taskId: string, updateData: Partial<Omit<ITask, 'acceptedBy' | 'createdAt' | 'updatedAt' | '_id'>>) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  // Update allowed fields
  if (updateData.title !== undefined) task.title = updateData.title;
  if (updateData.description !== undefined) task.description = updateData.description;
  if (updateData.peopleNeeded !== undefined) task.peopleNeeded = updateData.peopleNeeded;
  if (updateData.urgency !== undefined) task.urgency = updateData.urgency;
  if (updateData.location !== undefined) {
    if (!validateLocation(updateData.location)) {
      throw new Error('Invalid location data');
    }
    task.location = formatLocationForDB(updateData.location);
  }
  if (updateData.approxStartTime !== undefined) task.approxStartTime = updateData.approxStartTime;
  if (updateData.endTime !== undefined) task.endTime = updateData.endTime;
  if (updateData.amount !== undefined) task.amount = updateData.amount;
  if (updateData.taskCategory !== undefined) task.taskCategory = updateData.taskCategory;

  return await task.save();
};

export const getTasks = async (filter: FilterQuery<ITask> = {}) => {
  const tasks = await Task.find(filter)
    .populate('createdBy', 'name email')
    .populate('acceptedBy', 'name email');
  
  // Format the response to include all relevant fields
  return tasks.map(task => ({
    _id: task._id,
    title: task.title,
    description: task.description,
    peopleNeeded: task.peopleNeeded,
    urgency: task.urgency,
    createdBy: task.createdBy,
    location: task.location,
    approxStartTime: task.approxStartTime,
    endTime: task.endTime,
    amount: task.amount,
    acceptedBy: task.acceptedBy,
    acceptedCount: task.acceptedBy.length,
    isFull: task.acceptedBy.length >= task.peopleNeeded,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    taskCategory: task.taskCategory
  }));
};

export const acceptTask = async (taskId: string, volunteerId: string) => {
  if (!mongoose.Types.ObjectId.isValid(volunteerId) || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new Error('Invalid task or volunteer ID');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const isAlreadyAccepted = task.acceptedBy.map(id => id.toString()).includes(volunteerId);
  if (isAlreadyAccepted) {
    throw new Error('You have already accepted this task');
  }

  if (task.acceptedBy.length >= task.peopleNeeded) {
    throw new Error('This task is already full');
  }

  // Add the volunteer
  task.acceptedBy.push(new mongoose.Types.ObjectId(volunteerId));
  task.markModified('acceptedBy');
  await task.save();

  // Return populated task
  const updatedTask = await Task.findById(taskId).populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'acceptedBy', select: 'name email' },
  ]);

  return {
    ...updatedTask!.toObject(),
    acceptedCount: updatedTask!.acceptedBy.length,
    isFull: updatedTask!.acceptedBy.length >= updatedTask!.peopleNeeded,
  };
};

export const deleteTask = async (taskId: string) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  if (task.acceptedBy && task.acceptedBy.length > 0) {
    throw new Error('Cannot delete a task that has been accepted by volunteers');
  }
  
  await Task.findByIdAndDelete(taskId);
  return { success: true };
}; 