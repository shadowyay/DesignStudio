import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TaskHistoryItem {
  _id: string;
  taskId: string;
  title: string;
  taskCategory: 'General' | 'Emergency' | 'Donor' | 'Rental' | 'Other';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  amount: number;
  completedAt: string;
  completionStatus: 'Completed Successfully' | 'Completed with Issues' | 'Cancelled' | 'Failed';
  actualVolunteersCount: number;
  peopleNeeded: number;
  statistics: {
    efficiency: number;
    successRate: number;
  };
  userRating?: {
    rating: number;
    review?: string;
  };
}

interface HistoryWidgetProps {
  userId: string;
  historyType: 'user' | 'volunteer';
  maxItems?: number;
  showViewAllButton?: boolean;
}

const TaskHistoryWidget: React.FC<HistoryWidgetProps> = ({ 
  userId, 
  historyType, 
  maxItems = 5,
  showViewAllButton = true 
}) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentHistory = async () => {
      try {
        setLoading(true);
        
        const endpoint = historyType === 'user' ? 'user' : 'volunteer';
        const response = await fetch(`/api/history/${endpoint}/${userId}?limit=${maxItems}&page=1`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setHistory(data.data.history);
        } else {
          throw new Error(data.error || 'Failed to fetch history');
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setHistory([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRecentHistory();
  }, [userId, historyType, maxItems]);

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Emergency': return 'bg-red-100 text-red-800';
      case 'Donor': return 'bg-green-100 text-green-800';
      case 'Rental': return 'bg-purple-100 text-purple-800';
      case 'General': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed Successfully': return 'bg-green-100 text-green-800';
      case 'Completed with Issues': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number): string => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const handleViewAll = () => {
    navigate(`/history?type=${historyType}&userId=${userId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {historyType === 'user' ? 'Recent Tasks' : 'Recent Volunteer History'}
        </h3>
        {showViewAllButton && history.length > 0 && (
          <button
            onClick={handleViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {history.length === 0 && !error ? (
        <div className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-3">📋</div>
          <p className="text-gray-600">No completed tasks yet</p>
          <p className="text-gray-500 text-sm mt-1">
            {historyType === 'user' 
              ? 'Your completed tasks will appear here' 
              : 'Tasks you\'ve volunteered for will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {history.map((task) => (
            <div key={task._id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                    {task.title}
                  </h4>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.taskCategory)}`}>
                      {task.taskCategory}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.completionStatus)}`}>
                      {task.completionStatus === 'Completed Successfully' ? '✅ Success' :
                       task.completionStatus === 'Completed with Issues' ? '⚠️ Issues' :
                       task.completionStatus === 'Cancelled' ? '❌ Cancelled' : '❌ Failed'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📅 {new Date(task.completedAt).toLocaleDateString()}</p>
                    <p>💰 ₹{task.amount.toFixed(2)}</p>
                    <p>👥 {task.actualVolunteersCount}/{task.peopleNeeded} volunteers</p>
                  </div>
                </div>
                
                <div className="text-right ml-3">
                  <div className="text-lg font-bold text-blue-600 mb-1">
                    {task.statistics.efficiency.toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500 mb-2">efficiency</p>
                  
                  {task.userRating && (
                    <div className="text-yellow-400 text-sm">
                      {renderStars(task.userRating.rating)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showViewAllButton && history.length > 0 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={handleViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Complete History →
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskHistoryWidget;