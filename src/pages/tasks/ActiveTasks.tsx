import React, { useState, useEffect } from 'react';
import { getTasks } from '../../api';
import { Task } from '../../types';

const ActiveTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const allTasks = await getTasks();
        const activeTasks = allTasks.filter(task => !task.isCompleted && task.taskCategory !== 'Rental');
        setTasks(activeTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Active Tasks</h1>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No active tasks found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-gray-500">
                      <i className="fas fa-clock mr-2"></i>
                      Due: {new Date(task.endTime).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500">
                      <i className="fas fa-user-friends mr-2"></i>
                      People Needed: {task.peopleNeeded}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.urgency === 'High' ? 'bg-red-100 text-red-800' :
                    task.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.urgency} Priority
                  </span>
                  <span className="mt-2 text-blue-600 font-bold">${task.amount}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-4">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  View Details
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Mark Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveTasks;