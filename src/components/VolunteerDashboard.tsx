
import React, { useState, useEffect } from 'react';
import { getTasks } from '../api';

const VolunteerDashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <main>
      {!showProfile ? (
        <section className="section active">
          <h2>Available Tasks</h2>
          {loading ? <p>Loading tasks...</p> : null}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div id="taskList">
            {tasks.length === 0 && !loading ? <p>No tasks available.</p> : null}
            {tasks.map(task => (
              <div key={task._id} style={{ border: '1px solid #444', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p><b>Volunteers Needed:</b> {task.peopleNeeded}</p>
                <p><b>Urgency:</b> {task.urgency}</p>
                <p><b>Posted by:</b> {task.createdBy?.name || 'Unknown'}</p>
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
