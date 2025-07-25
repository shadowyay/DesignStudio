
import React, { useState, useEffect } from 'react';
import { createTask, getTasks, deleteTask } from '../api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    location: { address: '', lat: 0, lng: 0 },
    peopleNeeded: 1,
    approxStartTime: '',
    endTime: '',
    urgency: 'Normal',
    amount: 0,
  });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to India
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    getTasks()
      .then((res: any) => setTasks(Array.isArray(res) ? res : []))
      .catch((err) => setError('Failed to fetch tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Handle error or default
        }
      );
    }
  }, []);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const newLatLng: [number, number] = [e.latlng.lat, e.latlng.lng];
        setMarkerPosition(newLatLng);
        const locationDetails = { ...newTask.location, lat: e.latlng.lat, lng: e.latlng.lng };
        if (editingTask) {
          setEditingTask({ ...editingTask, location: locationDetails });
        } else {
          setNewTask({ ...newTask, location: locationDetails });
        }
      },
    });

    return markerPosition === null ? null : (
      <Marker position={markerPosition}></Marker>
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a task.');
        setLoading(false);
        return;
      }
      const createdBy = localStorage.getItem('userId');
      if (!createdBy) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      const res = await createTask({ ...newTask, createdBy }, token);
      if (res._id) {
        fetchTasks();
        setNewTask({ title: '', description: '', location: { address: '', lat: 0, lng: 0 }, peopleNeeded: 1, approxStartTime: '', endTime: '', urgency: 'Normal', amount: 0 });
        setMarkerPosition(null);
        setShowForm(false);
      } else {
        setError(res.message || 'Failed to create task');
      }
    } catch (err) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to update a task.');
        setLoading(false);
        return;
      }
      // Assuming createTask can handle updates if _id is present
      const res = await createTask(editingTask, token);
      if (res._id) {
        fetchTasks();
        setEditingTask(null);
        setShowForm(false);
        setMarkerPosition(null);
      } else {
        setError(res.message || 'Failed to update task');
      }
    } catch (err) {
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (taskId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await deleteTask(taskId, token);
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const startEditing = (task: any) => {
    setEditingTask({ ...task });
    if (task.location && task.location.lat && task.location.lng) {
      setMarkerPosition([task.location.lat, task.location.lng]);
    }
    setShowForm(true);
  };

  return (
    <main className="max-w-4xl mx-auto my-10 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          onClick={() => {
            setShowForm(!showForm);
            setEditingTask(null);
            setNewTask({ title: '', description: '', location: { address: '', lat: 0, lng: 0 }, peopleNeeded: 1, approxStartTime: '', endTime: '', urgency: 'Normal', amount: 0 });
            setMarkerPosition(null);
          }}
        >
          {showForm ? 'Cancel' : 'Create New Task'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Title:</label>
              <input type="text" value={editingTask ? editingTask.title : newTask.title} onChange={e => editingTask ? setEditingTask({ ...editingTask, title: e.target.value }) : setNewTask({ ...newTask, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Description:</label>
              <textarea value={editingTask ? editingTask.description : newTask.description} onChange={e => editingTask ? setEditingTask({ ...editingTask, description: e.target.value }) : setNewTask({ ...newTask, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" rows={3}></textarea>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location Address:</label>
              <input type="text" placeholder="e.g., 123 Main St, Anytown, USA" value={editingTask ? editingTask.location?.address : newTask.location?.address} onChange={e => {
                const newLocation = { ... (editingTask ? editingTask.location : newTask.location), address: e.target.value };
                if (editingTask) {
                  setEditingTask({ ...editingTask, location: newLocation });
                } else {
                  setNewTask({ ...newTask, location: newLocation });
                }
              }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div style={{ height: '400px', width: '100%' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker />
            </MapContainer>
            </div>
            <p className="text-sm text-gray-600 mt-2">Click on the map to set the task location.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Approximate Start Time (optional):</label>
                  <input type="datetime-local" value={editingTask ? (editingTask.approxStartTime ? new Date(editingTask.approxStartTime).toISOString().slice(0, 16) : '') : newTask.approxStartTime} onChange={e => {
                    const time = e.target.value;
                    if (editingTask) {
                      setEditingTask({ ...editingTask, approxStartTime: time });
                    } else {
                      setNewTask({ ...newTask, approxStartTime: time });
                    }
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">End Time (optional):</label>
                  <input type="datetime-local" value={editingTask ? (editingTask.endTime ? new Date(editingTask.endTime).toISOString().slice(0, 16) : '') : newTask.endTime} onChange={e => {
                    const time = e.target.value;
                    if (editingTask) {
                      setEditingTask({ ...editingTask, endTime: time });
                    } else {
                      setNewTask({ ...newTask, endTime: time });
                    }
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Number of Volunteers Needed:</label>
                  <input type="number" min="1" value={editingTask ? editingTask.peopleNeeded : newTask.peopleNeeded} onChange={e => {
                    const people = parseInt(e.target.value, 10);
                    if (editingTask) {
                      setEditingTask({ ...editingTask, peopleNeeded: people });
                    } else {
                      setNewTask({ ...newTask, peopleNeeded: people });
                    }
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Urgency Level:</label>
                  <select value={editingTask ? editingTask.urgency : newTask.urgency} onChange={e => {
                      const urgency = e.target.value;
                      if (editingTask) {
                        setEditingTask({ ...editingTask, urgency: urgency });
                      } else {
                        setNewTask({ ...newTask, urgency: urgency });
                      }
                    }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                    <option>Normal</option>
                    <option>Emergency</option>
                  </select>
                </div>
              </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" disabled={loading}>
              {loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Create Task')}
            </button>
          </form>
        </div>
      )}

      {error && <p className="text-red-500 my-4">{error}</p>}

      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Current Tasks</h2>
        {loading ? <p>Loading tasks...</p> : (
          <ul className="space-y-4">
            {tasks.map(task => (
              <li key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                <h3 className="text-lg font-bold text-blue-700">{task.title}</h3>
                <p className="text-gray-700 my-1">{task.description}</p>
                {task.location?.address && <p className="text-sm text-gray-500"><b>Location:</b> {task.location.address}</p>}
                {task.location?.lat && task.location?.lng && (
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
                {task.acceptedBy && task.acceptedBy.length > 0 && (
                  <div className="mt-2">
                    <b>Accepted By:</b>
                    <ul className="list-disc pl-6">
                      {task.acceptedBy.map((volunteer: any) => (
                        <li key={volunteer._id}>{volunteer.name} ({volunteer.email})</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => startEditing(task)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Edit</button>
                  <button onClick={() => handleDelete(task._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" disabled={loading}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};

export default Dashboard;
