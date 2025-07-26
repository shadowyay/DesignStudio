
import React, { useState, useEffect } from 'react';
import { getTasks, acceptTask, getUserProfile, updateUserProfile } from '../api';

const VolunteerDashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<any>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!showProfile) {
      setLoading(true);
      getTasks()
        .then(res => {
          const filteredTasks = Array.isArray(res) ? res.filter((task: any) => {
            const isAcceptedByAnyone = task.acceptedBy && task.acceptedBy.length > 0;
            const currentUserAccepted = isAcceptedByAnyone && userId && task.acceptedBy.some((vol: any) => vol._id === userId);
            // Show task if no one has accepted it OR if the current user has accepted it
            return !isAcceptedByAnyone || currentUserAccepted;
          }) : [];
          setTasks(filteredTasks);
          setError('');
        })
        .catch(() => setError('Failed to load tasks'))
        .finally(() => setLoading(false));
    } else if (userId) {
      setProfileLoading(true);
      getUserProfile(userId)
        .then(data => {
          setProfile(data);
          setProfileError('');
        })
        .catch(() => setProfileError('Failed to load profile'))
        .finally(() => setProfileLoading(false));
    }
  }, [showProfile, userId]);

  const handleAccept = async (taskId: string) => {
    if (!userId) {
      setMessage('You must be logged in as a volunteer to accept tasks.');
      return;
    }
    setAccepting(taskId);
    setMessage('');
    try {
      const result = await acceptTask(taskId, userId);
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
    } catch (err) {
      setMessage('Error accepting task.');
    }
    setAccepting(null);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');
    try {
      await updateUserProfile(userId, profile);
      setProfileMessage('Profile updated successfully!');
    } catch (err) {
      setProfileError('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto my-10 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Volunteer Dashboard</h1>
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
                <p className="text-sm text-gray-500"><b>Location:</b> {task.location?.address || ''}</p>
                {task.location && (
                  <a
                    href={`https://www.openstreetmap.org/#map=18/${task.location.lat}/${task.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    View on OpenStreetMap
                  </a>
                )}
                <p className="text-sm text-gray-500"><b>Approx. Start Time:</b> {task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                {task.endTime && <p className="text-sm text-gray-500"><b>End Time:</b> {new Date(task.endTime).toLocaleString()}</p>}
                <p className="text-sm text-gray-500"><b>Volunteers Needed:</b> {task.peopleNeeded}</p>
                <p className="text-sm text-gray-500"><b>Accepted Volunteers:</b> {task.acceptedCount} / {task.peopleNeeded}</p>
                <p className="text-sm text-gray-500"><b>Amount:</b> ₹{task.amount?.toFixed(2) || '0.00'}</p>
                {/* Determine if the current user has accepted this task */}
                {(() => {
                  const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: any) => vol._id === userId);

                  if (currentUserAccepted) {
                    return (
                      <>
                        <p className="text-green-600 font-bold">You have accepted this task!</p>
                        {/* Display the full list of accepted volunteers only if the current user has accepted it */}
                        {task.acceptedBy && task.acceptedBy.length > 0 && (
                          <div className="mb-2">
                            <b>Accepted Volunteers List:</b>
                            <ul className="list-disc pl-6">
                              {task.acceptedBy.map((vol: any) => (
                                <li key={vol._id}>{vol.name} ({vol.email})</li>
                              ))}
                            </ul>
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
              <input type="text" name="name" value={profile.name || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email:</label>
              <input type="email" name="email" value={profile.email || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Phone:</label>
              <input type="tel" name="phone" value={profile.phone || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location:</label>
              <input type="text" name="location" value={profile.location || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Skills / Interests:</label>
              <input type="text" name="skills" value={profile.skills || ''} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" disabled={profileLoading}>
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </section>
      )}
      <button className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full shadow-lg px-6 py-3 font-bold text-lg hover:bg-blue-700 transition" onClick={() => setShowProfile(!showProfile)}>
        {showProfile ? 'Back to Dashboard' : 'Profile'}
      </button>
    </main>
  );
};

export default VolunteerDashboard;
