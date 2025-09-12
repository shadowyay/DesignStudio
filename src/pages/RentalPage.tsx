import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasksByUser, deleteTask } from '../api';
import AddressDisplay from '../components/AddressDisplay';
import NavBar from '../components/NavBar';
import type { IFrontendTask } from '../types';

const RentalPage: React.FC = () => {
  const navigate = useNavigate();
  const [myRentals, setMyRentals] = useState<IFrontendTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMyRentals = useCallback(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!userId || !token) {
      navigate('/user/auth');
      return;
    }

    setLoading(true);
    getTasksByUser(userId)
      .then((res: IFrontendTask[]) => {
        const userRentals = Array.isArray(res) ? res.filter(task => task.taskCategory === 'Rental') : [];
        setMyRentals(userRentals);
        setError('');
      })
      .catch(() => setError('Failed to fetch your rentals'))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    fetchMyRentals();
  }, [fetchMyRentals]);

  const handleDeleteRental = async (rentalId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to delete a rental.');
      return;
    }

    try {
      await deleteTask(rentalId, token);
      setSuccessMessage('Rental deleted successfully!');
      fetchMyRentals();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (_err) {
      setError('Failed to delete rental');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'New': return 'bg-green-100 text-green-800';
      case 'Like New': return 'bg-blue-100 text-blue-800';
      case 'Good': return 'bg-yellow-100 text-yellow-800';
      case 'Fair': return 'bg-orange-100 text-orange-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userType={(localStorage.getItem('userRole') as 'user' | 'volunteer') || 'user'} />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h1 className="text-3xl font-bold text-purple-700 mb-4">⚙️ My Rentals</h1>
          <p className="text-gray-600 mb-6">
            Manage your posted rental items. You can view their status and remove them if they are no longer available.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => navigate('/rentals/create')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              📝 Post New Rental
            </button>
            <button
              onClick={() => navigate('/rentals/browse')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🔍 Browse Rentals
            </button>
            <button
              onClick={fetchMyRentals}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">📋 My Posted Items</h2>
          
          {loading ? (
             <div className="text-center py-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-500">Loading your rentals...</p>
              </div>
          ) : myRentals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRentals.map((rental) => (
                <div key={rental._id} className="bg-gray-50 p-6 rounded-xl shadow border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(rental.itemCondition)}`}>
                        {rental.itemCondition || 'Not Set'}
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        ₹{rental.dailyRate || 0}/day
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{rental.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{rental.description}</p>

                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>
                          Available: {formatDate(rental.availableFrom)} - {formatDate(rental.availableTo)}
                        </span>
                      </div>
                       {rental.location && (
                        <div className="flex items-center">
                           <span className="mr-2">📍</span>
                           <AddressDisplay
                            address={rental.location.address}
                            lat={rental.location.lat}
                            lng={rental.location.lng}
                            simple={true}
                          />
                        </div>
                      )}
                      {rental.acceptedCount && rental.acceptedCount > 0 ? (
                        <div className="flex items-center text-green-600 font-medium">
                          <span className="mr-2">👤</span>
                          <span>{rental.acceptedCount} rental request{rental.acceptedCount !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                         <div className="flex items-center text-gray-500">
                          <span className="mr-2">👤</span>
                          <span>No rental requests yet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleDeleteRental(rental._id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-300"
                      disabled={(rental.acceptedCount || 0) > 0}
                      title={(rental.acceptedCount || 0) > 0 ? "Cannot delete item with active requests" : "Delete this item"}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No rentals posted yet</h3>
              <p className="text-gray-500 mb-4">Start earning by posting your first rental item!</p>
              <button
                onClick={() => navigate('/rentals/create')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                🚀 Post Your First Rental
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalPage;