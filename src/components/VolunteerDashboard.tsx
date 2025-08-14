import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, acceptTask, getUserProfile, updateUserProfile, deleteAccount } from '../api';
import AddressDisplay from './AddressDisplay';
import PublicProfile from './PublicProfile';
import type { IFrontendUser, IFrontendTask } from '../types';
import NavBar from './NavBar';


const VolunteerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [tasks, setTasks] = useState<IFrontendTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<IFrontendUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [search, setSearch] = useState('');

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token'); // Retrieve token here

  const refreshTasks = useCallback(() => {
    if (!showProfile) {
      setLoading(true);
      getTasks()
        .then((res: IFrontendTask[]) => {
          if (Array.isArray(res)) {
            // Filter tasks: show available tasks + tasks accepted by current volunteer
            const filteredTasks = res.filter((task: IFrontendTask) => {
              const currentUserAccepted = !!(userId && task.acceptedBy?.some((vol: IFrontendUser) => vol._id === userId));
              if (currentUserAccepted) return true;
              if (task.taskCategory && ['General', 'Donor', 'Blood Emergency', 'Other'].includes(task.taskCategory)) {
                if (task.isFull) return false;
                const acceptedCount = task.acceptedCount ?? (task.acceptedBy?.length ?? 0);
                const availableSpots = (task.peopleNeeded || 0) - acceptedCount;
                return availableSpots > 0;
              }
              return false;
            });
            
          setTasks(filteredTasks);
          setError('');
          } else {
            setTasks([]);
            setError('Invalid response format from server');
          }
        })
        .catch((_err) => {
          setError('Failed to load tasks');
          setTasks([]);
        })
        .finally(() => setLoading(false));
    }
  }, [showProfile, userId]);

  useEffect(() => {
    refreshTasks();
    
    // Load profile if profile section is shown
    if (showProfile && userId) {
      setProfileLoading(true);
      if (!token) {
        setProfileError('Authentication token not found. Please log in again.');
        setProfileLoading(false);
        return;
      }
      getUserProfile(userId, token)
        .then((data) => {
          if (data && data._id) {
            setProfile(data);
            setProfileError('');
          } else {
            setProfileError('Failed to load profile: Invalid data received.');
          }
        })
        .catch((_err) => setProfileError('Failed to load profile'))
        .finally(() => setProfileLoading(false));
    }
  }, [showProfile, userId, token, refreshTasks]); 

  // Search filtering for available tasks
  const visibleTasks: IFrontendTask[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t: IFrontendTask) => {
      const title = t.title?.toLowerCase() || '';
      const desc = t.description?.toLowerCase() || '';
      const addr = t.location?.address?.toLowerCase() || '';
      return title.includes(q) || desc.includes(q) || addr.includes(q);
    });
  }, [tasks, search]);

  const handleAccept = async (taskId: string) => {
    if (!userId) {
      setMessage('You must be logged in as a volunteer to accept tasks.');
      return;
    }
    setAccepting(taskId);
    setMessage('');
    try {
      if (!token) {
        setMessage('Authentication token not found. Please log in.');
        setAccepting(null);
        return;
      }
  const result = await acceptTask(taskId, userId!, token!);
      if (result.success) {
        setMessage('Task accepted successfully!');
        // Refresh tasks to show updated status
        setTimeout(() => {
          refreshTasks();
          setMessage('');
        }, 2000);
      } else {
        setMessage(result.message || 'Could not accept task.');
      }
    } catch (_err) {
      setMessage('Error accepting task.');
    }
    setAccepting(null);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prevProfile => {
      if (!prevProfile) return null;

      const updatedProfile = { ...prevProfile, [name]: value } as IFrontendUser;

      if (name === 'gender') {
        if (value === 'male') {
          updatedProfile.profilePicture = 'profile_pics/male.jpg';
        } else if (value === 'female') {
          updatedProfile.profilePicture = 'profile_pics/female.jpg';
        } else if (value === 'rather not say') {
          updatedProfile.profilePicture = 'profile_pics/rather_not_say.jpg';
        }
      }

      return updatedProfile;
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');
    try {
      if (!profile) {
        setProfileError('Profile data is not loaded.');
        return;
      }
      if (!token) {
        setProfileError('Authentication token not found. Cannot update profile.');
        setProfileLoading(false);
        return;
      }
      await updateUserProfile(userId, profile, token); // Pass token
      setProfileMessage('Profile updated successfully!');
      
    } catch (_err) {
      setProfileError('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <>
      <NavBar 
        userType="volunteer" 
        onProfileToggle={() => setShowProfile(!showProfile)}
        showProfile={showProfile}
      />
      <main className="max-w-4xl mx-auto my-10 p-4 pt-24">
  {!showProfile && (
    <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">

          {/* Task Category Navigation */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Browse Tasks by Category:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/blood-emergency')}
                className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition text-left"
              >
                <div className="text-2xl mb-2">🩸</div>
                <h4 className="font-bold text-red-700">Blood Emergency</h4>
                <p className="text-sm text-red-600">Urgent blood donation requests</p>
              </button>
              
              <button
                onClick={() => navigate('/donor')}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-left"
              >
                <div className="text-2xl mb-2">🫀</div>
                <h4 className="font-bold text-green-700">Donor Tasks</h4>
                <p className="text-sm text-green-600">Blood donation opportunities</p>
              </button>
              
              <button
                onClick={() => navigate('/general-tasks')}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-left"
              >
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-bold text-blue-700">General Tasks</h4>
                <p className="text-sm text-blue-600">Community service opportunities</p>
              </button>
            </div>
          </div>
      </div>
  )}
      {!showProfile ? (
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold text-blue-700">Available Tasks</h2>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks (title, description, location)"
                className="flex-1 md:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={refreshTasks}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
          {/** derive visible tasks based on search **/}
          {/** computed via useMemo below **/}
          {loading ? <p className="text-gray-500">Loading tasks...</p> : null}
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {message && <p className={`mt-2 font-semibold ${message.includes('accepted') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
          
          {/* Task Summary */}
      {!loading && visibleTasks.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
        Showing {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
        {search ? ' (filtered)' : ''} - 
                Available to accept or already accepted by you
              </p>
            </div>
          )}
          
          <div id="taskList" className="space-y-6 mt-6">
            {/* Blood Emergency Tasks */}
            {visibleTasks.filter(task => task.taskCategory === 'Blood Emergency').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                  🩸 Blood Emergency Tasks
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                    {visibleTasks.filter(task => task.taskCategory === 'Blood Emergency').length}
                  </span>
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter(task => task.taskCategory === 'Blood Emergency').map(task => (
                    <div key={task._id} className="border border-red-200 rounded-lg p-4 shadow-sm bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-red-700">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                          task.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.urgency}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{task.description}</p>
                      
                      <AddressDisplay
                        address={task.location?.address}
                        lat={task.location?.lat}
                        lng={task.location?.lng}
                      />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Start Time:</span>
                          <p className="text-gray-700">{task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        {task.endTime && (
                          <div>
                            <span className="text-gray-500">End Time:</span>
                            <p className="text-gray-700">{new Date(task.endTime).toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Volunteers:</span>
                          <p className="text-gray-700">{task.acceptedCount || 0} / {task.peopleNeeded}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="text-gray-700">₹{task.amount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      
                      {/* Task Status and Actions */}
                      {(() => {
                        const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: IFrontendUser) => vol._id === userId);
                        const availableSpots = (task.peopleNeeded || 0) - (task.acceptedCount || 0);

                        if (currentUserAccepted) {
                          return (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-green-700 font-bold mb-2">✅ You have accepted this task!</p>
                              {task.createdBy && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">Task Created By:</p>
                                  <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <PublicProfile
                                      userId={task.createdBy._id || ''}
                                      userName={task.createdBy.name || 'Unknown User'}
                                      userEmail={task.createdBy.email || ''}
                                      isClickable={true}
                                      onProfileClick={() => {
                                        navigate(`/profile/${task.createdBy._id}`);
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } else if (availableSpots <= 0) {
                          return (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-gray-600 font-medium">Task is full - All volunteers accepted</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-4">
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">{availableSpots}</span> spot{availableSpots !== 1 ? 's' : ''} still available
                                </p>
                              </div>
                              <button 
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                onClick={() => handleAccept(task._id)} 
                                disabled={accepting === task._id}
                              >
                                {accepting === task._id ? 'Accepting...' : 'Accept Task'}
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donor Tasks */}
            {visibleTasks.filter(task => task.taskCategory === 'Donor').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  🫀 Donor Tasks
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {visibleTasks.filter(task => task.taskCategory === 'Donor').length}
                  </span>
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter(task => task.taskCategory === 'Donor').map(task => (
                    <div key={task._id} className="border border-green-200 rounded-lg p-4 shadow-sm bg-green-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-green-700">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                          task.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.urgency}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{task.description}</p>
                      
                      <AddressDisplay
                        address={task.location?.address}
                        lat={task.location?.lat}
                        lng={task.location?.lng}
                      />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Start Time:</span>
                          <p className="text-gray-700">{task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        {task.endTime && (
                          <div>
                            <span className="text-gray-500">End Time:</span>
                            <p className="text-gray-700">{new Date(task.endTime).toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Volunteers:</span>
                          <p className="text-gray-700">{task.acceptedCount || 0} / {task.peopleNeeded}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="text-gray-700">₹{task.amount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      
                      {/* Task Status and Actions */}
                      {(() => {
                        const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: IFrontendUser) => vol._id === userId);
                        const availableSpots = (task.peopleNeeded || 0) - (task.acceptedCount || 0);

                        if (currentUserAccepted) {
                          return (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-green-700 font-bold mb-2">✅ You have accepted this task!</p>
                              {task.createdBy && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">Task Created By:</p>
                                  <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <PublicProfile
                                      userId={task.createdBy._id || ''}
                                      userName={task.createdBy.name || 'Unknown User'}
                                      userEmail={task.createdBy.email || ''}
                                      isClickable={true}
                                      onProfileClick={() => {
                                        navigate(`/profile/${task.createdBy._id}`);
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } else if (availableSpots <= 0) {
                          return (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-gray-600 font-medium">Task is full - All volunteers accepted</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-4">
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">{availableSpots}</span> spot{availableSpots !== 1 ? 's' : ''} still available
                                </p>
                              </div>
                              <button 
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                onClick={() => handleAccept(task._id)} 
                                disabled={accepting === task._id}
                              >
                                {accepting === task._id ? 'Accepting...' : 'Accept Task'}
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General and Other Tasks */}
            {visibleTasks.filter(task => task.taskCategory === 'General' || task.taskCategory === 'Other').length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                  📋 General & Other Tasks
                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {visibleTasks.filter(task => task.taskCategory === 'General' || task.taskCategory === 'Other').length}
                  </span>
                </h3>
                <div className="space-y-4">
                  {visibleTasks.filter(task => task.taskCategory === 'General' || task.taskCategory === 'Other').map(task => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-blue-700">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                          task.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.urgency}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{task.description}</p>
                      
                <AddressDisplay
                  address={task.location?.address}
                  lat={task.location?.lat}
                  lng={task.location?.lng}
                />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Start Time:</span>
                          <p className="text-gray-700">{task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        {task.endTime && (
                          <div>
                            <span className="text-gray-500">End Time:</span>
                            <p className="text-gray-700">{new Date(task.endTime).toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Volunteers:</span>
                          <p className="text-gray-700">{task.acceptedCount || 0} / {task.peopleNeeded}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="text-gray-700">₹{task.amount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      
                      {/* Task Status and Actions */}
                {(() => {
                  const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: IFrontendUser) => vol._id === userId);
                        const availableSpots = (task.peopleNeeded || 0) - (task.acceptedCount || 0);

                  if (currentUserAccepted) {
                    return (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-green-700 font-bold mb-2">✅ You have accepted this task!</p>
                        {task.createdBy && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">Task Created By:</p>
                            <div className="border border-gray-200 rounded-lg p-3 bg-white">
                              <PublicProfile
                                userId={task.createdBy._id || ''}
                                userName={task.createdBy.name || 'Unknown User'}
                                userEmail={task.createdBy.email || ''}
                                isClickable={true}
                                onProfileClick={() => {
                                  navigate(`/profile/${task.createdBy._id}`);
                                }}
                              />
                            </div>
                          </div>
                        )}
                            </div>
                          );
                        } else if (availableSpots <= 0) {
                          return (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <span className="text-gray-600 font-medium">Task is full - All volunteers accepted</span>
                            </div>
                          );
                  } else {
                    return (
                            <div className="mt-4">
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">{availableSpots}</span> spot{availableSpots !== 1 ? 's' : ''} still available
                                </p>
                              </div>
                              <button 
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                onClick={() => handleAccept(task._id)} 
                                disabled={accepting === task._id}
                              >
                        {accepting === task._id ? 'Accepting...' : 'Accept Task'}
                      </button>
                            </div>
                    );
                  }
                })()}
              </div>
            ))}
                </div>
              </div>
            )}

            {/* No Tasks Message */}
            {visibleTasks.length === 0 && !loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No tasks available at the moment.</p>
                <p className="text-gray-400 text-sm mt-2">Check back later for new volunteer opportunities!</p>
              </div>
            ) : null}
          </div>
        </section>
        
      ) : (
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Your Profile</h2>
          {profileLoading && <p className="text-gray-500">Loading profile...</p>}
          {profileError && <p className="text-red-500 mt-2">{profileError}</p>}
          {profileMessage && <p className="text-green-600 mt-2">{profileMessage}</p>}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Profile Picture Section - Preview at top */}
            <div className="text-center mb-6">
              <label className="block font-medium text-gray-700 mb-3">Profile Picture:</label>
              {profile?.profilePicture ? (
                <div className="flex justify-center">
                  <img
                    src={`/${profile.profilePicture.replace(/^\//, '')}`}
                    alt="Profile Preview"
                    className="w-24 h-24 object-cover rounded-full border-4 border-blue-200 shadow-lg"
                    onError={() => {
                      console.error('Profile picture failed to load:', profile.profilePicture);
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto border-4 border-blue-200 shadow-lg">
                  <span className="text-white font-semibold text-2xl">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Full Name:</label>
              <input type="text" name="name" value={profile?.name || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email:</label>
              <input type="email" name="email" value={profile?.email || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Phone:</label>
              <input type="tel" name="phone" value={profile?.phone || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
                <label className="block font-medium text-gray-700 mb-1">Gender:</label>
                <select
                  name="gender"
                  value={profile?.gender || ''}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="rather not say">Rather not say</option>
                </select>
              </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location:</label>
              <input type="text" name="location" value={profile?.location || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Aadhaar Number:</label>
              <input 
                type="text" 
                name="aadhaar" 
                value={profile?.aadhaar || ''} 
                onChange={handleProfileChange} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                placeholder="123456789012"
                readOnly
              />
              <small className="text-gray-500 block mt-1">Aadhaar number cannot be changed</small>
            </div>
                         <div>
               <label className="block font-medium text-gray-700 mb-1">Skills / Interests:</label>
               <input type="text" name="skills" value={profile?.skills || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
             </div>
             <div>
               <label className="block font-medium text-gray-700 mb-1">About:</label>
               <textarea 
                 name="about" 
                 value={profile?.about || ''} 
                 onChange={handleProfileChange} 
                 rows={3}
                 placeholder="Tell us about yourself..."
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
               />
             </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" disabled={profileLoading}>
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Delete Account</h3>
            <button
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              onClick={async () => {
                const uid = localStorage.getItem('userId');
                const tok = localStorage.getItem('token');
                if (!uid || !tok) {
                  setProfileError('Not authenticated. Please log in again.');
                  return;
                }
                const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
                if (!confirmed) return;
                try {
                  await deleteAccount(uid, tok);
                  localStorage.removeItem('token');
                  localStorage.removeItem('userId');
                  localStorage.removeItem('userName');
                  localStorage.removeItem('userEmail');
                  localStorage.removeItem('aadhaar');
                  navigate('/');
                } catch (_err) {
                  setProfileError('Failed to delete account.');
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </section>
      )}

    </main>
    </>
  );
};

export default VolunteerDashboard;
