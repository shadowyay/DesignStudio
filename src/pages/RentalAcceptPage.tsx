import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, acceptTask } from '../api';
import AddressDisplay from '../components/AddressDisplay';
import PublicProfile from '../components/PublicProfile';
import NavBar from '../components/NavBar';
import type { IFrontendUser, IFrontendTask } from '../types';

const RentalAcceptPage: React.FC = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<IFrontendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [selectedRental, setSelectedRental] = useState<IFrontendTask | null>(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState('All');
  
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const fetchRentals = useCallback(() => {
    setLoading(true);
    getTasks()
      .then((res: IFrontendTask[]) => {
        if (Array.isArray(res)) {
          // Filter only Rental tasks and exclude full tasks
          const rentalTasks = res.filter((task: IFrontendTask) => {
            if (task.taskCategory !== 'Rental') return false;
            const currentUserAccepted = !!(userId && task.acceptedBy?.some((vol: IFrontendUser) => vol._id === userId));
            if (currentUserAccepted) return true;
            if (task.isFull) return false;
            const acceptedCount = task.acceptedCount ?? (task.acceptedBy?.length ?? 0);
            const availableSpots = (task.peopleNeeded || 0) - acceptedCount;
            return availableSpots > 0;
          });
          setRentals(rentalTasks);
          setError('');
        } else {
          setRentals([]);
          setError('Invalid response format from server');
        }
      })
      .catch((_err) => {
        setError('Failed to load rental items');
        setRentals([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!token) {
      navigate('/volunteer/auth');
      return;
    }
    fetchRentals();
  }, [token, navigate, fetchRentals]);

  const handleAcceptRental = async (taskId: string) => {
    if (!userId || !token) {
      setMessage('You must be logged in to rent items.');
      return;
    }

    setAccepting(taskId);
    setMessage('');
    setError('');

    try {
      const result = await acceptTask(taskId, userId!, token!);
      if (result.success) {
        setMessage('Rental request sent successfully!');
        // Merge updated task immediately so UI reflects acceptance and shows creator
        if (result.task && result.task._id) {
          setRentals(prev => prev.map(t => (t._id === result.task._id ? { ...t, ...result.task } : t)));
        }
        setTimeout(() => {
          fetchRentals();
          setMessage('');
        }, 1200);
      } else {
        setMessage(result.message || 'Could not send rental request.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send rental request.';
      setMessage(msg);
    } finally {
      setAccepting(null);
    }
  };

  // Filter rentals based on search and filters
  const filteredRentals: IFrontendTask[] = useMemo(() => {
    let filtered = rentals;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(rental => {
        const title = rental.title?.toLowerCase() || '';
        const desc = rental.description?.toLowerCase() || '';
        const addr = rental.location?.address?.toLowerCase() || '';
        return title.includes(q) || desc.includes(q) || addr.includes(q);
      });
    }

    // Condition filter
    if (conditionFilter !== 'All') {
      filtered = filtered.filter(rental => rental.itemCondition === conditionFilter);
    }

    // Price range filter
    if (priceRangeFilter !== 'All') {
      filtered = filtered.filter(rental => {
        const rate = rental.dailyRate || 0;
        switch (priceRangeFilter) {
          case 'Under 100': return rate < 100;
          case '100-500': return rate >= 100 && rate <= 500;
          case '500-1000': return rate >= 500 && rate <= 1000;
          case 'Over 1000': return rate > 1000;
          default: return true;
        }
      });
    }

    return filtered;
  }, [rentals, search, conditionFilter, priceRangeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
      case 'Like New':
        return 'bg-green-100 text-green-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'Poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userType="volunteer" />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-purple-700 mb-2">🏠 Browse Rental Items</h1>
                <p className="text-gray-600">Find and rent items from your community</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={fetchRentals}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  onClick={() => navigate('/rentals/create')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📝 Post Item
                </button>
                <button
                  onClick={() => navigate('/rentals')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  ⚙️ My Rentals
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Search rentals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All">All Conditions</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                >
                  <option value="All">All Price Ranges</option>
                  <option value="Under 100">Under ₹100</option>
                  <option value="100-500">₹100 - ₹500</option>
                  <option value="500-1000">₹500 - ₹1000</option>
                  <option value="Over 1000">Over ₹1000</option>
                </select>
              </div>
            </div>

            {loading && <p className="text-gray-500">Loading rental items...</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {message && <p className={`mt-2 font-semibold ${message.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}

            {/* Rental Summary */}
            {!loading && filteredRentals.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700 font-medium">
                  🏠 {filteredRentals.length} rental item{filteredRentals.length !== 1 ? 's' : ''} available
                </p>
              </div>
            )}
          </div>

          {/* Rental Items Grid */}
          <div className="space-y-6">
            {filteredRentals.length === 0 && !loading ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">🏠</div>
                <p className="text-gray-500 text-lg mb-2">No rental items at the moment</p>
                <p className="text-gray-400 text-sm">Check back later for new rental opportunities</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredRentals.map(rental => (
                  <div key={rental._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(rental.itemCondition || 'Good')}`}>
                        {rental.itemCondition || 'Good'}
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        ₹{rental.dailyRate || 0}/day
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{rental.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{rental.description}</p>

                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <span className="mr-2">📍</span>
                        <span>{rental.location?.address || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>
                          Available: {rental.availableFrom ? formatDate(rental.availableFrom) : 'N/A'} - {rental.availableTo ? formatDate(rental.availableTo) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">💰</span>
                        <span>Security Deposit: ₹{rental.securityDeposit || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <span>Owner: {rental.createdBy?.name || 'Unknown'}</span>
                      </div>
                    </div>

                    {rental.rentalTerms && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Terms:</strong> {rental.rentalTerms}
                        </p>
                      </div>
                    )}

                    <AddressDisplay
                      address={rental.location?.address}
                      lat={rental.location?.lat}
                      lng={rental.location?.lng}
                    />

                    {/* Rental Status and Actions */}
                    {(() => {
                      const currentUserAccepted = rental.acceptedBy && userId && rental.acceptedBy.some((vol: IFrontendUser) => vol._id === userId);
                      const availableSpots = (rental.peopleNeeded || 0) - (rental.acceptedCount || 0);

                      if (currentUserAccepted) {
                        return (
                          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-green-800 font-bold text-lg mb-3">✅ You have requested to rent this item!</p>
                            {rental.createdBy && (
                              <div>
                                <p className="text-sm text-gray-600 mb-2">Item Owner:</p>
                                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                  <PublicProfile
                                    userId={rental.createdBy._id || ''}
                                    userName={rental.createdBy.name || 'Unknown User'}
                                    userEmail={rental.createdBy.email || ''}
                                    isClickable={true}
                                    onProfileClick={() => {
                                      navigate(`/profile/${rental.createdBy._id}`);
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      } else if (availableSpots <= 0) {
                        return (
                          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                            <span className="text-gray-700 font-medium">Item is no longer available</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="mt-6">
                            <div className="mb-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                              <p className="text-purple-800 font-medium">
                                🏠 Item available for rent - Contact owner to proceed
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedRental(rental)}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleAcceptRental(rental._id)}
                                disabled={accepting === rental._id}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                              >
                                {accepting === rental._id ? 'Processing...' : 'Rent Now'}
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rental Details Modal */}
        {selectedRental && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedRental.title}</h2>
                <button
                  onClick={() => setSelectedRental(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(selectedRental.itemCondition || 'Good')}`}>
                    {selectedRental.itemCondition || 'Good'}
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    ₹{selectedRental.dailyRate || 0}/day
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description:</h3>
                  <p className="text-gray-600">{selectedRental.description}</p>
                </div>

                {selectedRental.rentalTerms && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Rental Terms:</h3>
                    <p className="text-gray-600">{selectedRental.rentalTerms}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Available From:</h3>
                    <p className="text-gray-600">{selectedRental.availableFrom ? formatDate(selectedRental.availableFrom) : 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Available Until:</h3>
                    <p className="text-gray-600">{selectedRental.availableTo ? formatDate(selectedRental.availableTo) : 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Security Deposit:</h3>
                  <p className="text-gray-600">₹{selectedRental.securityDeposit || 0}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Pickup Location:</h3>
                  <AddressDisplay
                    address={selectedRental.location?.address}
                    lat={selectedRental.location?.lat}
                    lng={selectedRental.location?.lng}
                  />
                </div>

                {selectedRental.createdBy && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Item Owner:</h3>
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <PublicProfile
                        userId={selectedRental.createdBy._id || ''}
                        userName={selectedRental.createdBy.name || 'Unknown User'}
                        userEmail={selectedRental.createdBy.email || ''}
                        isClickable={true}
                        onProfileClick={() => {
                          navigate(`/profile/${selectedRental.createdBy._id}`);
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => window.open(`mailto:${selectedRental.createdBy?.email}?subject=Rental Inquiry: ${selectedRental.title}`, '_blank')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    📧 Contact Owner
                  </button>
                  <button
                    onClick={() => setSelectedRental(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalAcceptPage;