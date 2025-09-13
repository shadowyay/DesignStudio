import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserProfile } from '../api';
import type { IFrontendUser } from '../types';
import StreakDisplay from './StreakDisplay';

interface NavBarProps {
  userType: 'user' | 'volunteer';
  onProfileToggle?: () => void;
  showProfile?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ userType, onProfileToggle, showProfile }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userProfile, setUserProfile] = useState<IFrontendUser | null>(null);
  const [profileImgError, setProfileImgError] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  
  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || '';
  const userId = localStorage.getItem('userId');

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await getUserProfile(userId, token);
          if (data && data._id) {
            setUserProfile(data);
            setProfileImgError(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when scrolling to top
      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else {
        // Hide when scrolling up, show when scrolling down
        setIsVisible(currentScrollY < lastScrollY);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const getProfilePicture = () => {
    const raw = userProfile?.profilePicture || '';
    if (!raw || profileImgError) {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }

    let imageUrl = raw;
    if (!raw.startsWith('http')) {
      let cleanPath = raw.replace(/^\//, '');
      // Normalize common filename-only values to public/profile_pics
      if (/^(male|female|rather_not_say)\.jpg$/i.test(cleanPath)) {
        cleanPath = `profile_pics/${cleanPath}`;
      }
      imageUrl = `/${cleanPath}`;
    }

    return (
      <img
        src={imageUrl}
        alt={userName}
        className="w-8 h-8 rounded-full object-cover"
        onError={() => {
          console.error('Profile picture failed to load in NavBar:', imageUrl);
          setProfileImgError(true);
        }}
      />
    );
  };

  return (
    <nav className={`bg-white shadow-md fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
  <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - SmartServe branding and Browse Rentals */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <img
                src="/favicon.svg"
                alt="SmartServe logo"
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-700">SmartServe</h1>
                <p className="text-xs text-gray-500 capitalize">{userType} Dashboard</p>
              </div>
            </div>
            <Link to="/tasks" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
              Browse Rentals
            </Link>
          </div>

          {/* Center - Navigation links and Streak Display */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
              Dashboard
            </Link>
            <div className="relative group">
              <Link to="/tasks" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                My Tasks
              </Link>
              <div className="absolute hidden group-hover:block w-48 bg-white shadow-lg rounded-lg mt-2 py-2">
                <Link to="/tasks?type=rental" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Rentals</Link>
                <Link to="/tasks?type=active" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Active Tasks</Link>
                <Link to="/tasks/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Create New Task</Link>
              </div>
            </div>
            <Link to="/history" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
              History
            </Link>
            <div className="relative group">
              <Link to="/settings" className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium">
                Settings
              </Link>
              <div className="absolute hidden group-hover:block w-48 bg-white shadow-lg rounded-lg mt-2 py-2">
                <Link to="/settings/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile Settings</Link>
                <Link to="/settings/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Notifications</Link>
                <Link to="/settings/payment" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Payment Methods</Link>
                <Link to="/settings/security" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Security</Link>
              </div>
            </div>
            
            {/* Streak Display for Volunteers */}
            {userType === 'volunteer' && userId && (
              <StreakDisplay 
                userId={userId}
                userRole={userType}
                token={localStorage.getItem('token') || ''}
                compact={true}
              />
            )}
          </div>

          {/* Right side - Mobile menu button and Profile section */}
          <div className="flex items-center space-x-2">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Profile section */}
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2 transition-colors duration-200"
              >
                {getProfilePicture()}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    showProfileMenu ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile dropdown menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      {getProfilePicture()}
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{userName}</p>
                        <p className="text-xs text-gray-500 break-all">{userEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onProfileToggle) {
                          onProfileToggle();
                        }
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      📋 {showProfile ? 'Back to Dashboard' : 'My Profile'}
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="px-4 space-y-1">
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              onClick={() => setShowMobileMenu(false)}
            >
              Dashboard
            </Link>
            {/* My Tasks Section */}
            <div className="py-2 border-b border-gray-100">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase">My Tasks</div>
              <Link 
                to="/tasks?type=rental" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                My Rentals
              </Link>
              <Link 
                to="/tasks?type=active" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Active Tasks
              </Link>
              <Link 
                to="/tasks/create" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Create New Task
              </Link>
            </div>
            
            <Link 
              to="/history" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              onClick={() => setShowMobileMenu(false)}
            >
              History
            </Link>

            {/* Settings Section */}
            <div className="py-2 border-t border-gray-100">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase">Settings</div>
              <Link 
                to="/settings/profile" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Profile Settings
              </Link>
              <Link 
                to="/settings/notifications" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Notifications
              </Link>
              <Link 
                to="/settings/payment" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Payment Methods
              </Link>
              <Link 
                to="/settings/security" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Close dropdown when clicking outside */}
      {(showProfileMenu || showMobileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}
    </nav>
  );
};

export default NavBar;