
import React, { useState, useEffect } from 'react';
import { getTasks, acceptTask } from '../api';

const VolunteerDashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!showProfile) {
      setLoading(true);
      getTasks()
        .then(res => {
          setTasks(Array.isArray(res) ? res : []);
          setError('');
        })
        .catch(() => setError('Failed to load tasks'))
        .finally(() => setLoading(false));
    }
  }, [showProfile]);

  const handleAccept = async (taskId: string) => {
    const volunteerId = localStorage.getItem('userId');
    if (!volunteerId) {
      setMessage('You must be logged in as a volunteer to accept tasks.');
      return;
    }
    setAccepting(taskId);
    setMessage('');
    try {
      const result = await acceptTask(taskId, volunteerId);
      if (result.success !== false && !result.error) {
        setMessage('Task accepted!');
      } else {
        setMessage(result.message || 'Could not accept task.');
      }
      // Refresh tasks after accepting
      getTasks().then(res => setTasks(Array.isArray(res) ? res : []));
    } catch (err) {
      setMessage('Error accepting task.');
    }
    setAccepting(null);
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
                <p><b>Urgency:</b> {task.urgency}</p>
                <p><b>Posted by:</b> {task.createdBy?.name || 'Unknown'}</p>
                {!task.accepted ? (
                  <button className="get-started" onClick={() => handleAccept(task._id)} disabled={accepting === task._id}>
                    {accepting === task._id ? 'Accepting...' : 'Accept Task'}
                  </button>
                ) : (
                  <span style={{ color: 'green' }}><b>Accepted</b></span>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>Your Profile</h2>
          <form>
            <label>Profile Picture:</label>
            <input type="file" name="profilePic" accept="image/*" />
            <label>Full Name:</label>
            <input type="text" name="name" value="Jane Volunteer" />
            <label>Email:</label>
            <input type="email" name="email" value="volunteer@example.com" />
            <label>Phone:</label>
            <input type="tel" name="phone" value="9876543210" />
            <label>Location:</label>
            <input type="text" name="location" value="City, Country" />
            <label>Skills / Interests:</label>
            <input type="text" name="skills" value="Teaching, Organizing" />
            <button type="submit" className="get-started">Update Profile</button>
          </form>
          <button className="get-started" onClick={() => setShowProfile(false)}>Back to Dashboard</button>
        </section>
      )}
      <button className="get-started" onClick={() => setShowProfile(!showProfile)}>
        {showProfile ? 'Back to Dashboard' : 'Profile'}
      </button>
    </main>
  );
};

export default VolunteerDashboard;
