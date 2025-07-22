
import React, { useState } from 'react';
import { createTask } from '../api';
import { getUserTasks } from '../api';
import { getUserProfile } from '../api'; // Added import for getUserProfile

const Dashboard: React.FC = () => {
  // User's posted tasks state
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  React.useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId && !showProfile) {
      getUserTasks(userId).then((res: any) => setUserTasks(Array.isArray(res) ? res : []));
      // Fetch user profile data
      getUserProfile(userId).then((res: any) => {
        if (res) {
          setProfileName(res.name || '');
          setProfileEmail(res.email || '');
          setProfilePhone(res.phone || '');
          setProfileLocation(res.location || '');
        }
      });
    } else if (userId && showProfile) {
      // Fetch user profile data when showProfile is true
      getUserProfile(userId).then((res: any) => {
        if (res) {
          setProfileName(res.name || '');
          setProfileEmail(res.email || '');
          setProfilePhone(res.phone || '');
          setProfileLocation(res.location || '');
        }
      });
    }
  }, [showProfile]);
  const [amount, setAmount] = useState(0);
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
  // Add state for profile form
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  // ...existing code...

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
      const res = await createTask({ title, description, peopleNeeded, urgency, createdBy, location, approxStartTime, endTime: endTime || undefined, amount: Number(amount) }, token);
      if (res._id) {
        setSuccess('Task posted successfully!');
        const userId = localStorage.getItem('userId');
        if (userId) {
          getUserTasks(userId).then((res: any) => setUserTasks(Array.isArray(res) ? res : []));
        }
        setTitle('');
        setDescription('');
        setPeopleNeeded(1);
        setUrgency('Normal');
        setLocation('');
        setApproxStartTime('');
        setEndTime('');
        setAmount(0);
      } else {
        setError(res.message || 'Failed to post task');
      }
    } catch (err) {
      setError('Failed to post task');
    }
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto my-10 px-4">
      {!showProfile ? (
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Create New Task / Emergency</h2>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Task Title:</label>
              <input type="text" name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Food Distribution" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Description:</label>
              <textarea name="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the task..." required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location:</label>
              <input type="text" name="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Community Center" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Approximate Start Time (optional):</label>
                <input type="datetime-local" name="approxStartTime" value={approxStartTime} onChange={e => setApproxStartTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">End Time (optional):</label>
                <input type="datetime-local" name="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Number of Volunteers Needed:</label>
                <input type="number" name="peopleNeeded" min={1} value={peopleNeeded} onChange={e => setPeopleNeeded(Number(e.target.value))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Urgency Level:</label>
                <select name="urgency" value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                  <option>Normal</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Amount to Pay:</label>
              <input type="number" name="amount" min={0} value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <small className="text-orange-500 block mt-1">You will pay this amount. Extra taxes may apply.</small>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition mt-6" disabled={loading}>{loading ? 'Posting...' : 'Post Task'}</button>
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {success && <p className="text-green-500 mt-4">{success}</p>}
          <h3 className="text-xl font-semibold text-gray-800 mt-10 mb-4">Your Posted Tasks</h3>
          <div id="userTaskList" className="space-y-4">
            {userTasks.length === 0 ? <p className="text-gray-500">No tasks posted yet.</p> : null}
            {userTasks.map(task => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                <h4 className="text-lg font-bold text-blue-700 mb-1">{task.title}</h4>
                <p className="text-gray-700 mb-1">{task.description}</p>
                <p className="text-sm text-gray-500"><b>Location:</b> {task.location}</p>
                <p className="text-sm text-gray-500"><b>Amount:</b> ₹{task.amount}</p>
                <p className="text-sm text-gray-500"><b>Start Time:</b> {task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'N/A'}</p>
                <p className="text-sm text-gray-500"><b>End Time:</b> {task.endTime ? new Date(task.endTime).toLocaleString() : 'N/A'}</p>
                <p className="text-sm text-gray-500"><b>Volunteers Needed:</b> {task.peopleNeeded}</p>
                <p className="text-sm text-gray-500"><b>Urgency:</b> {task.urgency}</p>
                <p className="text-sm text-gray-500"><b>Accepted Volunteers:</b> {task.acceptedBy ? task.acceptedBy.length : 0} / {task.peopleNeeded}</p>
                <p className="text-sm text-gray-500"><b>Status:</b> {task.acceptedBy && task.acceptedBy.length > 0 ? 'Accepted' : 'Pending'}</p>
                {task.acceptedBy && task.acceptedBy.length > 0 && task.acceptedBy[0].name && (
                  <p className="text-sm text-green-600"><b>Accepted By:</b> {task.acceptedBy[0].name} ({task.acceptedBy[0].email})</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Your Profile</h2>
          <form className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Profile Picture:</label>
              <input type="file" name="profilePic" accept="image/*" className="w-full" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Full Name:</label>
              <input type="text" name="name" value={profileName ?? ''} onChange={e => setProfileName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email:</label>
              <input type="email" name="email" value={profileEmail ?? ''} onChange={e => setProfileEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Phone:</label>
              <input type="tel" name="phone" value={profilePhone ?? ''} onChange={e => setProfilePhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location:</label>
              <input type="text" name="location" value={profileLocation ?? ''} onChange={e => setProfileLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Update Profile</button>
          </form>
        </section>
      )}
      <button className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full shadow-lg px-6 py-3 font-bold text-lg hover:bg-blue-700 transition" onClick={() => setShowProfile(!showProfile)}>
        {showProfile ? 'Back to Dashboard' : 'Profile'}
      </button>
    </main>
  );
};

export default Dashboard;
