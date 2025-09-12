import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TaskHistoryItem {
  _id: string;
  taskId: string;
  title: string;
  description: string;
  taskCategory: 'General' | 'Emergency' | 'Donor' | 'Rental' | 'Other';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  amount: number;
  location: {
    address: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
  };
  createdBy: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
  };
  volunteers: Array<{
    userId: string;
    name: string;
    email: string;
    phone?: string;
    joinedAt: string;
    rating?: number;
    review?: string;
  }>;
  businessVolunteerInfo?: {
    businessId: string;
    businessName: string;
    businessContact: string;
    volunteerName: string;
    volunteerPhone: string;
    volunteerEmail?: string;
    estimatedArrival?: string;
    assignedAt: string;
  };
  createdAt: string;
  completedAt: string;
  approxStartTime?: string;
  endTime?: string;
  actualDuration?: number;
  peopleNeeded: number;
  actualVolunteersCount: number;
  completionStatus: 'Completed Successfully' | 'Completed with Issues' | 'Cancelled' | 'Failed';
  completionNotes?: string;
  userRating?: {
    rating: number;
    review?: string;
    ratedAt: string;
  };
  volunteerRatings?: Array<{
    volunteerId: string;
    ratingByUser?: number;
    reviewByUser?: string;
    ratingByVolunteer?: number;
    reviewByVolunteer?: string;
    ratedAt: string;
  }>;
  financial: {
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'Pending' | 'Partial' | 'Completed' | 'Failed';
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
  };
  statistics: {
    responseTime: number;
    completionTime: number;
    efficiency: number;
    successRate: number;
  };
  issues?: Array<{
    type: 'Late Arrival' | 'No Show' | 'Quality Issue' | 'Communication Problem' | 'Other';
    description: string;
    reportedBy: 'User' | 'Volunteer' | 'Business';
    reportedAt: string;
    resolved: boolean;
  }>;
}

interface HistoryResponse {
  success: boolean;
  data: {
    history: TaskHistoryItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    statistics: {
      totalTasks: number;
      completedSuccessfully: number;
      completedWithIssues: number;
      cancelled: number;
      failed: number;
      totalAmountSpent?: number;
      totalEarnings?: number;
      avgEfficiency: number;
      avgSuccessRate: number;
      avgResponseTime: number;
      avgCompletionTime: number;
      successRatePercentage: number;
    };
  };
  error?: string;
}

interface TaskHistoryPageProps {
  userId?: string;
  historyType?: 'user' | 'volunteer'; // user = tasks created, volunteer = tasks volunteered for
}

const TaskHistoryPage: React.FC<TaskHistoryPageProps> = ({ userId: propUserId, historyType: propHistoryType }) => {
  const navigate = useNavigate();
  
  // Get user data from localStorage if not passed as props
  const userId = propUserId || localStorage.getItem('userId') || '';
  const userRole = localStorage.getItem('userRole') || 'user';
  const historyType = propHistoryType || (userRole === 'volunteer' ? 'volunteer' : 'user');
  const token = localStorage.getItem('token');
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!token || !userId) {
      console.log('Not authenticated - token:', !!token, 'userId:', userId);
      // Don't redirect immediately, show a login message instead
      setError('Please log in to view your task history');
      setLoading(false);
      return;
    }
  }, [token, userId, navigate]);
  
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    taskCategory: '',
    urgency: '',
    completionStatus: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Statistics state
  const [statistics, setStatistics] = useState<HistoryResponse['data']['statistics'] | null>(null);
  
  // Detailed view state
  const [selectedTask, setSelectedTask] = useState<TaskHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      console.log('Fetching history for userId:', userId, 'historyType:', historyType);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      // Add filters if they exist
      if (filters.taskCategory) params.append('taskCategory', filters.taskCategory);
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.completionStatus) params.append('completionStatus', filters.completionStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const endpoint = historyType === 'user' ? 'user' : 'volunteer';
      const response = await fetch(`/api/history/${endpoint}/${userId}?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch history: ${response.status} ${response.statusText}`);
      }
      
      const data: HistoryResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch history');
      }
      
      setHistory(data.data.history);
      setCurrentPage(data.data.pagination.currentPage);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.totalCount);
      setStatistics(data.data.statistics);
      
    } catch (err) {
      console.error('Error fetching history:', err);
      console.error('userId:', userId);
      console.error('historyType:', historyType);
      console.error('API URL:', `/api/history/${historyType === 'user' ? 'user' : 'volunteer'}/${userId}`);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userId) {
      fetchHistory(currentPage);
    }
  }, [userId, historyType, currentPage, filters, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      taskCategory: '',
      urgency: '',
      completionStatus: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Emergency': return 'bg-red-100 text-red-800';
      case 'Donor': return 'bg-green-100 text-green-800';
      case 'Rental': return 'bg-purple-100 text-purple-800';
      case 'General': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed Successfully': return 'bg-green-100 text-green-800';
      case 'Completed with Issues': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Accepted': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const renderStars = (rating: number): string => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const openDetailModal = (task: TaskHistoryItem) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {historyType === 'user' ? 'My Task History' : 'Tasks I\'ve Accepted'}
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              ← Back
            </button>
          </div>
          
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.totalTasks}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-green-900">{statistics.successRatePercentage.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">
                  {historyType === 'user' ? 'Amount Spent' : 'Amount Earned'}
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{((statistics.totalAmountSpent || statistics.totalEarnings || 0)).toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Avg Efficiency</p>
                <p className="text-2xl font-bold text-yellow-900">{statistics.avgEfficiency.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <select
              value={filters.taskCategory}
              onChange={(e) => handleFilterChange('taskCategory', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="General">General</option>
              <option value="Emergency">Emergency</option>
              <option value="Donor">Donor</option>
              <option value="Rental">Rental</option>
              <option value="Other">Other</option>
            </select>
            
            <select
              value={filters.urgency}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Urgencies</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            
            {historyType === 'user' && (
              <select
                value={filters.completionStatus}
                onChange={(e) => handleFilterChange('completionStatus', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="Completed Successfully">Completed Successfully</option>
                <option value="Completed with Issues">Completed with Issues</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Failed">Failed</option>
              </select>
            )}
            
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="From Date"
            />
            
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="To Date"
            />
          </div>
          <button
            onClick={clearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Clear Filters
          </button>
        </div>

        {/* Task History List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Task History ({totalCount} total)
            </h2>
          </div>
          
          {error && (
            <div className="p-6 border-b border-gray-200 bg-red-50">
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-red-500 mt-2">Debug info: userId={userId}, historyType={historyType}</p>
              {(!token || !userId) && (
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/user/auth')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          )}
          
          {history.length === 0 && !loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-600 text-lg">
                {historyType === 'user' ? 'No task history found' : 'No accepted tasks found'}
              </p>
              <p className="text-gray-500 mt-2">
                {historyType === 'user' 
                  ? 'You haven\'t created any completed tasks yet.' 
                  : 'You haven\'t accepted any tasks to volunteer for yet.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {history.map((task) => (
                <div key={task._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.taskCategory)}`}>
                          {task.taskCategory}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(task.urgency)}`}>
                          {task.urgency}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(historyType === 'volunteer' ? 'Accepted' : task.completionStatus)}`}>
                          {historyType === 'volunteer' ? 'Accepted' : task.completionStatus}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>📍 {task.location.address}</p>
                        <p>📅 Completed: {new Date(task.completedAt).toLocaleDateString()}</p>
                        <p>💰 Amount: ₹{task.amount.toFixed(2)}</p>
                        {task.actualDuration && (
                          <p>⏱️ Duration: {formatDuration(task.actualDuration)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {task.statistics.efficiency.toFixed(0)}%
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Efficiency</p>
                      
                      {task.userRating && (
                        <div className="mb-3">
                          <div className="text-yellow-400 text-lg">
                            {renderStars(task.userRating.rating)}
                          </div>
                          <p className="text-xs text-gray-500">User Rating</p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => openDetailModal(task)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Info Bar */}
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium">Volunteers:</span> {task.actualVolunteersCount}/{task.peopleNeeded}
                      </div>
                      <div>
                        <span className="font-medium">Response Time:</span> {formatDuration(task.statistics.responseTime)}
                      </div>
                      <div>
                        <span className="font-medium">Payment:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          task.financial.paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                          task.financial.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.financial.paymentStatus}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Issues:</span> {task.issues?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded ${
                  currentPage === 1 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Title:</p>
                    <p className="text-gray-600">{selectedTask.title}</p>
                  </div>
                  <div>
                    <p className="font-medium">Category:</p>
                    <span className={`px-2 py-1 rounded text-sm ${getCategoryColor(selectedTask.taskCategory)}`}>
                      {selectedTask.taskCategory}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Description:</p>
                    <p className="text-gray-600">{selectedTask.description}</p>
                  </div>
                  <div>
                    <p className="font-medium">Status:</p>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedTask.completionStatus)}`}>
                      {selectedTask.completionStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Volunteers */}
              {selectedTask.volunteers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Volunteers</h3>
                  <div className="space-y-2">
                    {selectedTask.volunteers.map((volunteer) => (
                      <div key={volunteer.userId} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{volunteer.name}</p>
                        <p className="text-sm text-gray-600">{volunteer.email}</p>
                        {volunteer.rating && (
                          <p className="text-sm text-yellow-600">
                            Rating: {renderStars(volunteer.rating)} ({volunteer.rating}/5)
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Business Volunteer */}
              {selectedTask.businessVolunteerInfo && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Volunteer</h3>
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="font-medium">{selectedTask.businessVolunteerInfo.businessName}</p>
                    <p>Volunteer: {selectedTask.businessVolunteerInfo.volunteerName}</p>
                    <p>Phone: {selectedTask.businessVolunteerInfo.volunteerPhone}</p>
                    {selectedTask.businessVolunteerInfo.volunteerEmail && (
                      <p>Email: {selectedTask.businessVolunteerInfo.volunteerEmail}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Financial Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium">Total Amount:</p>
                    <p className="text-gray-600">₹{selectedTask.financial.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Amount Paid:</p>
                    <p className="text-gray-600">₹{selectedTask.financial.amountPaid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Payment Status:</p>
                    <span className={`px-2 py-1 rounded text-sm ${
                      selectedTask.financial.paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                      selectedTask.financial.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedTask.financial.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Performance Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedTask.statistics.efficiency.toFixed(0)}%</p>
                    <p className="text-sm text-blue-800">Efficiency</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedTask.statistics.successRate.toFixed(0)}%</p>
                    <p className="text-sm text-green-800">Success Rate</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatDuration(selectedTask.statistics.responseTime)}</p>
                    <p className="text-sm text-purple-800">Response Time</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-yellow-600">{formatDuration(selectedTask.statistics.completionTime)}</p>
                    <p className="text-sm text-yellow-800">Total Time</p>
                  </div>
                </div>
              </div>
              
              {/* Issues */}
              {selectedTask.issues && selectedTask.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Issues Reported</h3>
                  <div className="space-y-3">
                    {selectedTask.issues.map((issue, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-800">{issue.type}</p>
                            <p className="text-sm text-red-600">{issue.description}</p>
                            <p className="text-xs text-red-500 mt-1">
                              Reported by {issue.reportedBy} on {new Date(issue.reportedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {issue.resolved ? 'Resolved' : 'Open'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskHistoryPage;