import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, acceptTask, getUserProfile, updateUserProfile } from '../api';
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

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token'); // Retrieve token here

  useEffect(() => {
    if (!showProfile) {
      setLoading(true);
      getTasks()
        .then((res: IFrontendTask[]) => {
          const filteredTasks = Array.isArray(res) ? res.filter((task: IFrontendTask) => {
            const isAcceptedByAnyone = task.acceptedBy && task.acceptedBy.length > 0;
            const currentUserAccepted = isAcceptedByAnyone && userId && task.acceptedBy?.some((vol: IFrontendUser) => vol._id === userId);
            // Show task if no one has accepted it OR if the current user has accepted it
            return !isAcceptedByAnyone || currentUserAccepted;
          }) : [];
          setTasks(filteredTasks);
          setError('');
        })
        .catch((_err) => setError('Failed to load tasks'))
        .finally(() => setLoading(false));
    } else if (userId) {
      setProfileLoading(true);
      if (!token) {
        setProfileError('Authentication token not found. Please log in again.');
        setProfileLoading(false);
        return;
      }
      getUserProfile(userId, token) // Pass token
        .then((data) => {
          if (data && data._id) { // Ensure data and _id exist before setting profile
            setProfile(data);
            setProfileError('');
          } else {
            setProfileError('Failed to load profile: Invalid data received.');
          }
        })
        .catch((_err) => setProfileError('Failed to load profile'))
        .finally(() => setProfileLoading(false));
    }
  }, [showProfile, userId, token]); 

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
      const result = await acceptTask(taskId, userId, token); // Pass token
      if (result.success) {
        setMessage('Task accepted!');
        // Find the task in the current state and update it with the new data from the server.
        setTasks(prevTasks => {
          const newTasks = [...prevTasks];
          const taskIndex = newTasks.findIndex(t => t._id === taskId);
          if (taskIndex !== -1) {
            newTasks[taskIndex] = result.task;
          }
          return newTasks;
        });
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
          updatedProfile.profilePicture = '/profile_pics/male.jpg';
        } else if (value === 'female') {
          updatedProfile.profilePicture = '/profile_pics/female.jpg';
        } else if (value === 'rather not say') {
          updatedProfile.profilePicture = '/profile_pics/rather_not_say.jpg';
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Hello, {localStorage.getItem('userName') || 'Volunteer'}</h1>
      </div>
      {!showProfile ? (
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Available Tasks</h2>
          {loading ? <p className="text-gray-500">Loading tasks...</p> : null}
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {message && <p className={`mt-2 font-semibold ${message.includes('accepted') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
          <div id="taskList" className="space-y-4 mt-6">
            {tasks.length === 0 && !loading ? <p className="text-gray-500">No tasks available.</p> : null}
            {tasks.map(task => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                <h3 className="text-lg font-bold text-blue-700 mb-1">{task.title}</h3>
                <p className="text-gray-700 mb-1">{task.description}</p>
                <AddressDisplay
                  address={task.location?.address}
                  lat={task.location?.lat}
                  lng={task.location?.lng}
                />
                <p className="text-sm text-gray-500"><b>Approx. Start Time:</b> {task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                {task.endTime && <p className="text-sm text-gray-500"><b>End Time:</b> {new Date(task.endTime).toLocaleString()}</p>}
                <p className="text-sm text-gray-500"><b>Volunteers Needed:</b> {task.peopleNeeded}</p>
                <p className="text-sm text-gray-500"><b>Accepted Volunteers:</b> {task.acceptedCount} / {task.peopleNeeded}</p>
                <p className="text-sm text-gray-500"><b>Amount:</b> ₹{task.amount?.toFixed(2) || '0.00'}</p>
                {/* Determine if the current user has accepted this task */}
                {(() => {
                  const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: IFrontendUser) => vol._id === userId);

                  if (currentUserAccepted) {
                    return (
                      <>
                        <p className="text-green-600 font-bold">You have accepted this task!</p>
                        {task.createdBy && (
                          <div className="mt-4">
                            <b className="text-gray-700 mb-2 block">Task Created By:</b>
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
                      </>
                    );
                  } else if (task.isFull) {
                    return <span className="text-green-600 font-bold">All volunteers accepted</span>;
                  } else {
                    return (
                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition mt-2" onClick={() => handleAccept(task._id)} disabled={accepting === task._id}>
                        {accepting === task._id ? 'Accepting...' : 'Accept Task'}
                      </button>
                    );
                  }
                })()}
              </div>
            ))}
          </div>
        </section>
        
      ) : (
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Your Profile</h2>
          {profileLoading && <p className="text-gray-500">Loading profile...</p>}
          {profileError && <p className="text-red-500 mt-2">{profileError}</p>}
          {profileMessage && <p className="text-green-600 mt-2">{profileMessage}</p>}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
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
               <label className="block font-medium text-gray-700 mb-1">Skills / Interests:</label>
               <input type="text" name="skills" value={profile?.skills || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
             </div>
             <div>
               <label className="block font-medium text-gray-700 mb-1">Profile Picture:</label>
               {profile?.profilePicture && (
                 <div className="mt-2">
                   <img 
                     src={profile.profilePicture} 
                     alt="Profile Preview" 
                     className="w-20 h-20 object-cover rounded-lg border"
                   />
                 </div>
               )}
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
        </section>
      )}

    </main>
    </>
  );
};

export default VolunteerDashboard;
