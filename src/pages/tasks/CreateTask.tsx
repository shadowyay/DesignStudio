import React, { useState } from 'react';
import { createTask } from '../../api';
import { useNavigate } from 'react-router-dom';

const CreateTask = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskCategory: 'General',
    peopleNeeded: 1,
    urgency: 'Medium',
    amount: '',
    endTime: '',
    location: '',
    // Rental specific fields
    isRental: false,
    dailyRate: '',
    availableFrom: '',
    availableTo: '',
    itemCondition: 'New',
    securityDeposit: '',
    itemImages: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not logged in');
      }

      const taskData = {
        ...formData,
        createdBy: userId,
        amount: Number(formData.amount),
        dailyRate: formData.isRental ? Number(formData.dailyRate) : undefined,
        securityDeposit: formData.isRental ? Number(formData.securityDeposit) : undefined
      };

      await createTask(taskData);
      navigate('/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.taskCategory}
                  onChange={(e) => setFormData({...formData, taskCategory: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="General">General Task</option>
                  <option value="Rental">Rental</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Volunteer">Volunteer Work</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Task Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">People Needed</label>
                <input
                  type="number"
                  value={formData.peopleNeeded}
                  onChange={(e) => setFormData({...formData, peopleNeeded: parseInt(e.target.value)})}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Urgency</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Rental Specific Fields */}
          {formData.taskCategory === 'Rental' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Rental Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Daily Rate ($)</label>
                  <input
                    type="number"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({...formData, dailyRate: e.target.value})}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Deposit ($)</label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({...formData, securityDeposit: e.target.value})}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Available From</label>
                  <input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Available To</label>
                  <input
                    type="date"
                    value={formData.availableTo}
                    onChange={(e) => setFormData({...formData, availableTo: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Condition</label>
                  <select
                    value={formData.itemCondition}
                    onChange={(e) => setFormData({...formData, itemCondition: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Task
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;