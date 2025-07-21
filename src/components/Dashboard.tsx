import React, { useState } from 'react';

const Dashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <main style={{ maxWidth: 600, margin: '40px auto' }}>
      {!showProfile ? (
        <section className="section active">
          <h2>Create New Task / Emergency</h2>
          <form>
            <label>Task Title:</label>
            <input type="text" name="title" placeholder="e.g. Food Distribution" required />
            <label>Description:</label>
            <textarea name="description" rows={4} placeholder="Describe the task..." required />
            <label>Number of Volunteers Needed:</label>
            <input type="number" name="peopleNeeded" min={1} required />
            <label>Urgency Level:</label>
            <select name="urgency">
              <option>Normal</option>
              <option>Urgent</option>
              <option>Emergency</option>
            </select>
            <button type="submit" className="get-started">Post Task</button>
          </form>
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
