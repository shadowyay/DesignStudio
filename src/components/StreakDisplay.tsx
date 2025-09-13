import React, { useState, useEffect } from 'react';
import { getVolunteerStreakInfo, getVolunteerAccountStatus } from '../api';

interface StreakDisplayProps {
  userId: string;
  userRole: 'user' | 'volunteer';
  token: string;
  compact?: boolean; // For navbar display
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakBroken: boolean;
  daysSinceLastTask: number | null;
  monthlyTasksCompleted: number;
  accountStatus: 'active' | 'warning' | 'rejected';
}

interface AccountStatus {
  accountStatus: 'active' | 'warning' | 'rejected';
  currentStreak: number;
  streakBroken: boolean;
  daysSinceLastTask: number | null;
  monthlyTasksCompleted: number;
  message: string;
  isActive: boolean;
  isWarning: boolean;
  isRejected: boolean;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ 
  userId, 
  userRole, 
  token, 
  compact = false 
}) => {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStreakData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both streak info and account status
      const [streakData, statusData] = await Promise.all([
        getVolunteerStreakInfo(userId, token),
        getVolunteerAccountStatus(userId, token)
      ]);
      
      setStreakInfo(streakData);
      setAccountStatus(statusData);
    } catch (err) {
      console.error('Error fetching streak data:', err);
      setError('Failed to load streak information');
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    if (userRole === 'volunteer' && userId && token) {
      fetchStreakData();
    } else {
      setLoading(false);
    }
  }, [userRole, userId, token, fetchStreakData]);

  if (userRole !== 'volunteer') {
    return null; // Don't show streak for regular users
  }

  if (loading) {
    return (
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
        Loading streak...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-red-500`}>
        {error}
      </div>
    );
  }

  if (!streakInfo || !accountStatus) {
    return null;
  }

  const getStreakEmoji = (streak: number, broken: boolean) => {
    if (broken || streak === 0) return '💔';
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    return '✨';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    // Compact version for navbar
    return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
        <span className="text-lg">
          {getStreakEmoji(streakInfo.currentStreak, streakInfo.streakBroken)}
        </span>
        <span className="text-sm font-medium text-blue-700">
          {streakInfo.currentStreak} day{streakInfo.currentStreak !== 1 ? 's' : ''}
        </span>
        {accountStatus.accountStatus !== 'active' && (
          <span className={`w-2 h-2 rounded-full ${
            accountStatus.accountStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        )}
      </div>
    );
  }

  // Full version for dashboard
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🏆</span>
          Volunteer Streak
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(accountStatus.accountStatus)}`}>
          {accountStatus.accountStatus.charAt(0).toUpperCase() + accountStatus.accountStatus.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Current Streak */}
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-3xl mb-2">
            {getStreakEmoji(streakInfo.currentStreak, streakInfo.streakBroken)}
          </div>
          <div className="text-2xl font-bold text-blue-700 mb-1">
            {streakInfo.currentStreak}
          </div>
          <div className="text-sm text-blue-600">
            Current Streak
          </div>
          {streakInfo.streakBroken && (
            <div className="text-xs text-red-500 mt-1">
              Streak broken
            </div>
          )}
        </div>

        {/* Longest Streak */}
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-3xl mb-2">👑</div>
          <div className="text-2xl font-bold text-purple-700 mb-1">
            {streakInfo.longestStreak}
          </div>
          <div className="text-sm text-purple-600">
            Best Streak
          </div>
        </div>

        {/* Monthly Tasks */}
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-2xl font-bold text-green-700 mb-1">
            {streakInfo.monthlyTasksCompleted}
          </div>
          <div className="text-sm text-green-600">
            This Month
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-lg border ${getStatusColor(accountStatus.accountStatus)}`}>
        <p className="text-sm font-medium">
          {accountStatus.message}
        </p>
        {streakInfo.daysSinceLastTask !== null && streakInfo.daysSinceLastTask > 0 && (
          <p className="text-xs mt-2 opacity-75">
            Last task completed {streakInfo.daysSinceLastTask} day{streakInfo.daysSinceLastTask !== 1 ? 's' : ''} ago
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <span>Days to beat record: {Math.max(0, streakInfo.longestStreak - streakInfo.currentStreak + 1)}</span>
        <button
          onClick={fetchStreakData}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default StreakDisplay;