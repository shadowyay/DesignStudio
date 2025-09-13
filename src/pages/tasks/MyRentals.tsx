import React, { useState, useEffect } from 'react';
import { getTasks } from '../../api';
import { ITask } from '../../types';

const MyRentals = () => {
  const [rentals, setRentals] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const allTasks = await getTasks();
        const rentalTasks = allTasks.filter(task => task.taskCategory === 'Rental');
        setRentals(rentalTasks);
      } catch (error) {
        console.error('Error fetching rentals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
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
      <h1 className="text-2xl font-bold mb-6">My Rentals</h1>
      
      {rentals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No rentals found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.map((rental) => (
            <div key={rental._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {rental.itemImages && rental.itemImages[0] && (
                <img
                  src={rental.itemImages[0]}
                  alt={rental.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{rental.title}</h3>
                <p className="text-gray-600 mb-2">{rental.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-bold">${rental.dailyRate}/day</span>
                  <span className="text-sm text-gray-500">
                    {rental.isAvailable ? 'Available' : 'Rented'}
                  </span>
                </div>
                {rental.isAvailable && (
                  <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRentals;