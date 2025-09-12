import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserProfile } from '../api';
import type { IFrontendUser } from '../types';

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
          {/* Left side - SmartServe branding */}
          <div className="flex items-center">
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
          </div>

          {/* Right side - Profile section */}
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
      
      {/* Close dropdown when clicking outside */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}

      {/* Navigation links - Always visible */}
      <div className="hidden md:flex justify-center space-x-8 bg-white py-2 border-t border-gray-200">
        <Link to="/dashboard" className="text-gray-900 hover:text-blue-600 transition-colors duration-200">
          Dashboard
        </Link>
        <Link to="/tasks" className="text-gray-900 hover:text-blue-600 transition-colors duration-200">
          My Tasks
        </Link>
        <Link to="/history" className="text-gray-900 hover:text-blue-600 transition-colors duration-200">
          Task History
        </Link>
        <Link to="/settings" className="text-gray-900 hover:text-blue-600 transition-colors duration-200">
          Settings
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;