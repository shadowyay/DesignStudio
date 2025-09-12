import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask } from '../api';
import { getCurrentLocation } from '../utils/locationUtils';
import NavBar from '../components/NavBar';
import type { IFrontendUser } from '../types';



const RentalCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Location and map state
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Form state
  const [newRental, setNewRental] = useState({
    title: '',
    description: '',
    location: { address: '', lat: 0, lng: 0 },
    peopleNeeded: 1,
    approxStartTime: '',
    endTime: '',
    urgency: 'Normal' as const,
    amount: 0,
    taskCategory: 'Rental' as const,
    dailyRate: 0,
    securityDeposit: 0,
    availableFrom: '',
    availableTo: '',
    itemCondition: 'Good' as 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor',
    rentalTerms: ''
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/user/auth');
      return;
    }
  }, [navigate]);



  // Handle opening the post form with current location
  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const currentLocation = await getCurrentLocation();
      setNewRental(prev => ({ ...prev, location: currentLocation }));
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setSuccessMessage('Location detected successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location. Please set location manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle posting new rental
  const handlePostRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Frontend validation
    if (newRental.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      setLoading(false);
      return;
    }
    
    if (newRental.dailyRate <= 0) {
      setError('Daily rate must be greater than 0');
      setLoading(false);
      return;
    }
    
    if (!newRental.availableFrom || !newRental.availableTo) {
      setError('Please select availability dates');
      setLoading(false);
      return;
    }
    
    if (new Date(newRental.availableTo) < new Date(newRental.availableFrom)) {
      setError('Available to date must be after or same as available from date');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to post a rental.');
        setLoading(false);
        return;
      }
      
      const createdBy = localStorage.getItem('userId');
      if (!createdBy) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const createdByUser: IFrontendUser = {
        _id: createdBy,
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        role: 'user',
        aadhaar: localStorage.getItem('aadhaar') || '',
      };

      const res = await createTask({ ...newRental, createdBy: createdByUser }, token);
      
      if (res._id) {
        setSuccessMessage('Rental posted successfully!');
        setNewRental({
          title: '',
          description: '',
          location: { address: '', lat: 0, lng: 0 },
          peopleNeeded: 1,
          approxStartTime: '',
          endTime: '',
          urgency: 'Normal' as const,
          amount: 0,
          taskCategory: 'Rental' as const,
          dailyRate: 0,
          securityDeposit: 0,
          availableFrom: '',
          availableTo: '',
          itemCondition: 'Good' as 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor',
          rentalTerms: ''
        });
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/rentals');
        }, 2000);
      } else {
        setError(res.message || 'Failed to post rental');
      }
    } catch (err) {
      console.error('Error creating rental:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('Description must be at least')) {
        setError('Description must be at least 10 characters long');
      } else if (errorMessage.includes('Available to date must be after')) {
        setError('Available to date must be the same day or later than available from date');
      } else if (errorMessage.includes('Daily rate')) {
        setError('Daily rate must be greater than 0');
      } else {
        setError(errorMessage || 'Failed to post rental. Please check your inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userType={(localStorage.getItem('userRole') as 'user' | 'volunteer') || 'user'} />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
            <h1 className="text-3xl font-bold text-purple-700 mb-4">📝 Post Your Item for Rent</h1>
            <p className="text-gray-600 mb-6">
              List your item and start earning! Fill in the details below to make your item available for rent.
            </p>
            
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => navigate('/rentals/browse')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🔍 Browse Rentals
              </button>
              <button
                onClick={() => navigate('/rentals')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                ⚙️ My Rentals
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
            <form onSubmit={handlePostRental} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Title *</label>
                <input
                  type="text"
                  value={newRental.title}
                  onChange={(e) => setNewRental({ ...newRental, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  required
                  placeholder="e.g., Camera, Bicycle, Laptop..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description * 
                  <span className="text-xs text-gray-500 ml-2">
                    ({newRental.description.length}/10 characters minimum)
                  </span>
                </label>
                <textarea
                  value={newRental.description}
                  onChange={(e) => setNewRental({ ...newRental, description: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 ${
                    newRental.description.length > 0 && newRental.description.length < 10 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  rows={4}
                  required
                  minLength={10}
                  placeholder="Describe your item, its features, and any special instructions... (minimum 10 characters)"
                />
                {newRental.description.length > 0 && newRental.description.length < 10 && (
                  <p className="text-sm text-red-600 mt-1">
                    Description must be at least 10 characters long
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRental.dailyRate}
                    onChange={(e) => setNewRental({ ...newRental, dailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRental.securityDeposit}
                    onChange={(e) => setNewRental({ ...newRental, securityDeposit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                    placeholder="500"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available From *</label>
                  <input
                    type="date"
                    value={newRental.availableFrom}
                    onChange={(e) => setNewRental({ ...newRental, availableFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Until *</label>
                  <input
                    type="date"
                    value={newRental.availableTo}
                    onChange={(e) => setNewRental({ ...newRental, availableTo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
              </div>

              {/* Item Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Condition *</label>
                <select
                  value={newRental.itemCondition}
                  onChange={(e) => setNewRental({ ...newRental, itemCondition: e.target.value as 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  required
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              {/* Rental Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rental Terms (Optional)</label>
                <textarea
                  value={newRental.rentalTerms}
                  onChange={(e) => setNewRental({ ...newRental, rentalTerms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  rows={3}
                  placeholder="Any specific terms, rules, or conditions for renting this item..."
                />
              </div>

              {/* Location Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location *</label>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {locationLoading ? '⏳ Getting Location...' : '📍 Use Current Location'}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newRental.location.address}
                    onChange={(e) => setNewRental({
                      ...newRental,
                      location: { ...newRental.location, address: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    placeholder="Enter pickup address..."
                    required
                  />

                  {mapCenter && (
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Location detected:</p>
                      <p className="text-sm font-medium">Lat: {mapCenter[0]}, Lng: {mapCenter[1]}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {loading ? '⏳ Posting...' : '🚀 Post Rental'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/rentals')}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalCreatePage;