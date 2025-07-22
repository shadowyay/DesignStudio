
import React, { useState } from 'react';
import { createTask } from '../api';

const Dashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  // Task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [peopleNeeded, setPeopleNeeded] = useState(1);
  const [urgency, setUrgency] = useState('Normal');
  const [location, setLocation] = useState('');
  const [approxStartTime, setApproxStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to post a task.');
        setLoading(false);
        return;
      }
      // Get user id from localStorage
      const createdBy = localStorage.getItem('userId');
      if (!createdBy) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      const res = await createTask({ title, description, peopleNeeded, urgency, createdBy, location, approxStartTime, endTime: endTime || undefined }, token);
      if (res._id) {
        setSuccess('Task posted successfully!');
        setTitle('');
        setDescription('');
        setPeopleNeeded(1);
        setUrgency('Normal');
        setLocation('');
        setApproxStartTime('');
        setEndTime('');
      } else {
        setError(res.message || 'Failed to post task');
      }
    } catch (err) {
      setError('Failed to post task');
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 600, margin: '40px auto' }}>
      {!showProfile ? (
        <section className="section active">
          <h2>Create New Task / Emergency</h2>
          <form onSubmit={handleTaskSubmit}>
            <label>Task Title:</label>
            <input type="text" name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Food Distribution" required />
            <label>Description:</label>
            <textarea name="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the task..." required />
            <label>Location:</label>
            <input type="text" name="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Community Center" required />
            <label>Approximate Start Time (optional):</label>
            <input type="datetime-local" name="approxStartTime" value={approxStartTime} onChange={e => setApproxStartTime(e.target.value)} />
            <label>End Time (optional):</label>
            <input type="datetime-local" name="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} />
            <label>Number of Volunteers Needed:</label>
            <input type="number" name="peopleNeeded" min={1} value={peopleNeeded} onChange={e => setPeopleNeeded(Number(e.target.value))} required />
            <label>Urgency Level:</label>
            <select name="urgency" value={urgency} onChange={e => setUrgency(e.target.value)}>
              <option>Normal</option>
              <option>Urgent</option>
              <option>Emergency</option>
            </select>
            <button type="submit" className="get-started" disabled={loading}>{loading ? 'Posting...' : 'Post Task'}</button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
        </section>
      ) : (
        <section className="section">
          <h2>Your Profile</h2>
          <form>
            <label>Profile Picture:</label>
            <input type="file" name="profilePic" accept="image/*" />
            <label>Full Name:</label>
            <input type="text" name="name" value="John Doe" />
            <label>Email:</label>
            <input type="email" name="email" value="johndoe@example.com" />
            <label>Phone:</label>
            <input type="tel" name="phone" value="1234567890" />
            <label>Location:</label>
            <input type="text" name="location" value="City, Country" />
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

export default Dashboard;
