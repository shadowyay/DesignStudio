import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api';
import type { IFrontendUser } from '../types';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<IFrontendUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('User ID is required');
        return;
      }

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
          console.log('Profile data received:', data);
          console.log('Profile picture URL:', data.profilePicture);
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
  }, [userId]);

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
      // Ensure the URL is correctly formed for deployment
      let imageUrl = profile.profilePicture;
      
      // If it's not an absolute URL, make it relative to the public directory
      if (!profile.profilePicture.startsWith('http')) {
        // Remove leading slash if present and ensure it's relative to public
        const cleanPath = profile.profilePicture.replace(/^\//, '');
        imageUrl = `/${cleanPath}`;
      }
      
      console.log('Original profile picture:', profile.profilePicture);
      console.log('Constructed image URL:', imageUrl);

      return (
        <img 
          src={imageUrl} 
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover mx-auto shadow-lg"
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            console.error('Error event:', e);
          }}
        />
      );
    }
    
    console.log('No profile picture found, showing initials');
    return (
      <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
        <span className="text-white font-semibold text-3xl">
          {getInitials(profile?.name || 'User')}
        </span>
      </div>
    );
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={handleGoBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Profile not found</p>
          <button
            onClick={handleGoBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Public Profile</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-center text-white">
            {getProfilePicture()}
            <h2 className="text-3xl font-bold mt-4">{profile.name}</h2>
            <p className="text-blue-100 mt-2">{profile.email}</p>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            {/* About Section */}
            {profile.about && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">About</h3>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-lg">
                  {profile.about}
                </p>
              </div>
            )}

            {/* Contact Information */}
            {(profile.phone || profile.location) && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {profile.phone && (
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 text-xl">📞</span>
                      <span className="text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500 text-xl">📍</span>
                      <span className="text-gray-600">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gender Information */}
            {profile.gender && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Gender</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 text-xl">👤</span>
                  <span className="text-gray-600 capitalize">{profile.gender}</span>
                </div>
              </div>
            )}

            {/* Skills/Interests */}
            {profile.skills && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Skills & Interests</h3>
                <p className="text-gray-600 bg-gray-50 p-6 rounded-lg">
                  {profile.skills}
                </p>
              </div>
            )}

            {/* Additional Information */}
            {profile.openToAnything && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 text-xl">✅</span>
                  <span className="text-gray-600">Open to anything</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage; 