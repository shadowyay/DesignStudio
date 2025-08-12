import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../api';
import type { IFrontendUser } from '../types';

interface ProfileModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  userId, 
  userName, 
  userEmail, 
  isOpen, 
  onClose 
}) => {
  const [profile, setProfile] = useState<IFrontendUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Authentication required');
            return;
          }
          const data = await getUserProfile(userId, token);
          if (data && data._id) {
            setProfile(data);
          } else {
            setError('Failed to load profile');
          }
        } catch (err) {
          setError('Failed to load profile');
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [isOpen, userId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfilePicture = () => {
    if (profile?.profilePicture) {
      return (
        <img 
          src={profile.profilePicture} 
          alt={userName}
          className="w-24 h-24 rounded-full object-cover mx-auto"
        />
      );
    }
    
    return (
      <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
        <span className="text-white font-semibold text-2xl">
          {getInitials(userName)}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="text-center">
                {getProfilePicture()}
                <h3 className="text-xl font-semibold text-gray-800 mt-3">{userName}</h3>
                <p className="text-gray-500">{userEmail}</p>
              </div>

              {/* About Section */}
              {profile?.about && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">About</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{profile.about}</p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                <div className="space-y-2">
                  {profile?.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">📞</span>
                      <span className="text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">📍</span>
                      <span className="text-gray-600">{profile.location}</span>
                    </div>
                  )}
                  {profile?.aadhaar ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">🆔</span>
                      <span className="text-gray-600">Aadhaar: {profile.aadhaar}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">🆔</span>
                      <span className="text-gray-400">Aadhaar: Not provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills/Interests */}
              {profile?.skills && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skills & Interests</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{profile.skills}</p>
                </div>
              )}

              {/* Additional Info */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Additional Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">👤</span>
                    <span className="text-gray-600">Role: {profile?.role === 'volunteer' ? 'Volunteer' : 'User'}</span>
                  </div>
                  {profile?.openToAnything && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">✅</span>
                      <span className="text-gray-600">Open to anything</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal; 