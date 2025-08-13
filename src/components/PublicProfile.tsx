import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../api';
import type { IFrontendUser } from '../types';

interface PublicProfileProps {
  userId: string;
  userName: string;
  userEmail: string;
  isClickable?: boolean;
  onProfileClick?: () => void;
  userGender?: 'male' | 'female' | 'rather not say';
}

const PublicProfile: React.FC<PublicProfileProps> = ({ 
  userId, 
  userName, 
  userEmail, 
  isClickable = false,
  onProfileClick,
  userGender
}) => {
  const [profile, setProfile] = useState<IFrontendUser | null>(null);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
  } catch (_err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleClick = () => {
    if (isClickable && onProfileClick) {
      onProfileClick();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfilePicture = () => {
    const raw = profile?.profilePicture || '';
    if (!raw || imgError) {
      return (
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {getInitials(userName)}
          </span>
        </div>
      );
    }
    let imageUrl = raw;
    if (!raw.startsWith('http')) {
      let cleanPath = raw.replace(/^\//, '');
      if (/^(male|female|rather_not_say)\.jpg$/i.test(cleanPath)) {
        cleanPath = `profile_pics/${cleanPath}`;
      }
      imageUrl = `/${cleanPath}`;
    }
    return (
      <img
        src={imageUrl}
        alt={userName}
        className="w-12 h-12 rounded-full object-cover"
        onError={() => {
          console.error('Image failed to load in PublicProfile:', imageUrl);
          setImgError(true);
        }}
      />
    );
  };

  return (
    <div className="flex items-center space-x-3">
      {getProfilePicture()}
      <div className="flex-1">
        <div 
          className={`font-medium text-gray-900 ${isClickable ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
          onClick={handleClick}
        >
          {userName}
        </div>
        <div className="text-sm text-gray-500">{userEmail}</div>
        {userGender && (
          <div className="text-sm text-gray-500 capitalize">{userGender}</div>
        )}
        {profile?.about && (
          <div className="text-sm text-gray-600 mt-1">{profile.about}</div>
        )}
        {loading && <div className="text-xs text-gray-400">Loading...</div>}
        {error && <div className="text-xs text-red-400">Failed to load profile</div>}
      </div>
    </div>
  );
};

export default PublicProfile; 