import React, { useState } from 'react';

const VolunteerDashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <main>
      {!showProfile ? (
        <section className="section active">
          <h2>Available Tasks</h2>
          <div id="taskList">
            {/* Tasks will be dynamically inserted here */}
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
