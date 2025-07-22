
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
    try {
      await updateUserProfile(userId, profile);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setProfileError('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <main>
      {!showProfile ? (
        <section className="section active">
          <h2>Available Tasks</h2>
          {loading ? <p>Loading tasks...</p> : null}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {message && <p style={{ color: message.includes('accepted') ? 'green' : 'red' }}>{message}</p>}
          <div id="taskList">
            {tasks.length === 0 && !loading ? <p>No tasks available.</p> : null}
            {tasks.map(task => (
              <div key={task._id} style={{ border: '1px solid #444', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p><b>Location:</b> {task.location}</p>
                <p><b>Approx. Start Time:</b> {task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                {task.endTime && <p><b>End Time:</b> {new Date(task.endTime).toLocaleString()}</p>}
                <p><b>Volunteers Needed:</b> {task.peopleNeeded}</p>
                <p><b>Accepted Volunteers:</b> {task.acceptedCount} / {task.peopleNeeded}</p>
                {/* Determine if the current user has accepted this task */}
                {(() => {
                  const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: any) => vol._id === userId);

                  if (currentUserAccepted) {
                    return (
                      <>
                        <p style={{ color: 'green', fontWeight: 'bold' }}>You have accepted this task!</p>
                        {/* Display the full list of accepted volunteers only if the current user has accepted it */}
                        {task.acceptedBy && task.acceptedBy.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <b>Accepted Volunteers List:</b>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {task.acceptedBy.map((vol: any) => (
                                <li key={vol._id}>{vol.name} ({vol.email})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  } else if (task.isFull) {
                    return <span style={{ color: 'green' }}><b>All volunteers accepted</b></span>;
                  } else {
                    return (
                      <button className="get-started" onClick={() => handleAccept(task._id)} disabled={accepting === task._id}>
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
        <section className="section">
          <h2>Your Profile</h2>
          {profileLoading && <p>Loading profile...</p>}
          {profileError && <p style={{ color: 'red' }}>{profileError}</p>}
          <form onSubmit={handleProfileSubmit}>
            <label>Full Name:</label>
            <input type="text" name="name" value={profile.name || ''} onChange={handleProfileChange} />
            <label>Email:</label>
            <input type="email" name="email" value={profile.email || ''} onChange={handleProfileChange} />
            <label>Phone:</label>
            <input type="tel" name="phone" value={profile.phone || ''} onChange={handleProfileChange} />
            <label>Location:</label>
            <input type="text" name="location" value={profile.location || ''} onChange={handleProfileChange} />
            <label>Skills / Interests:</label>
            <input type="text" name="skills" value={profile.skills || ''} onChange={handleProfileChange} />
            <button type="submit" className="get-started" disabled={profileLoading}>
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </section>
      )}
      <button className="get-started" onClick={() => setShowProfile(!showProfile)}>
        {showProfile ? 'Back to Dashboard' : 'Profile'}
      </button>
    </main>
  );
};

export default VolunteerDashboard;
