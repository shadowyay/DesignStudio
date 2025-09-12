import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask, getTasksByUser, deleteTask, getUserProfile, updateUserProfile, updateTask, deleteAccount } from '../api';
import LocationMap from './LocationMap';
import LocationPicker from './LocationPicker';
import AddressDisplay from './AddressDisplay';
import PublicProfile from './PublicProfile';
import BusinessVolunteerDisplay from './BusinessVolunteerDisplay';
import { getCurrentLocation } from '../utils/locationUtils';
import type { IFrontendUser, IFrontendTask, ICreateTaskData, LocationData } from '../types';
import NavBar from './NavBar';
import Feedback from './Feedback';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<IFrontendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [newTask, setNewTask] = useState<Omit<ICreateTaskData, 'createdBy' | 'location'> & { location: LocationData }>({ // Explicitly type newTask
    title: '',
    description: '',
    location: { address: '', lat: 0, lng: 0 },
    peopleNeeded: 1,
    approxStartTime: '',
    endTime: '',
    urgency: 'Normal',
    amount: 0,
    taskCategory: 'General',
    isRental: false,
    dailyRate: 0,
    availableFrom: '',
    availableTo: '',
    rentalDuration: 1,
    itemCondition: 'Good',
    securityDeposit: 0,
    rentalTerms: '',
    itemImages: []
    });
  const [editingTask, setEditingTask] = useState<IFrontendTask | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to India
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<IFrontendUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [search, setSearch] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const fetchTasks = () => {
    setLoading(true);
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    getTasksByUser(userId)
      .then((res: IFrontendTask[]) => setTasks(Array.isArray(res) ? res : []))
      .catch((_err) => setError('Failed to fetch tasks'))
      .finally(() => setLoading(false));
  };

  // Client-side search for posted tasks
  const visibleTasks: IFrontendTask[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t: IFrontendTask) => {
      const title = t.title?.toLowerCase() || '';
      const desc = t.description?.toLowerCase() || '';
      const addr = t.location?.address?.toLowerCase() || '';
      return title.includes(q) || desc.includes(q) || addr.includes(q);
    });
  }, [tasks, search]);

  // Validation function for description
  const validateDescription = (description: string): { isValid: boolean; error: string } => {
    if (!description || typeof description !== 'string') {
      return { isValid: false, error: 'Description is required' };
    }
    
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      return { isValid: false, error: 'Description must be at least 10 characters long' };
    }
    
    if (trimmed.length > 1000) {
      return { isValid: false, error: 'Description cannot exceed 1000 characters' };
    }
    
    return { isValid: true, error: '' };
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const currentTask = editingTask || newTask;
    const currentDescription = currentTask.description;
    const currentTitle = currentTask.title;
    const currentLocation = currentTask.location;
    const currentCategory = currentTask.taskCategory;
    
    const descValidation = validateDescription(currentDescription || '');
    const hasTitle = currentTitle && currentTitle.trim().length > 0;
    const hasLocation = currentLocation && currentLocation.address && currentLocation.lat !== 0 && currentLocation.lng !== 0;
    
    // Additional validation for rental items
    if (currentCategory === 'Rental') {
      const hasDailyRate = currentTask.dailyRate && currentTask.dailyRate > 0;
      const hasAvailableFrom = currentTask.availableFrom && currentTask.availableFrom.trim().length > 0;
      const hasAvailableTo = currentTask.availableTo && currentTask.availableTo.trim().length > 0;
      const hasItemCondition = currentTask.itemCondition && currentTask.itemCondition.trim().length > 0;
      
      // Check if availableTo is after availableFrom
      const validDateRange = hasAvailableFrom && hasAvailableTo ? 
        new Date(currentTask.availableTo!) > new Date(currentTask.availableFrom!) : false;
      
      return descValidation.isValid && hasTitle && hasLocation && 
             hasDailyRate && hasAvailableFrom && hasAvailableTo && hasItemCondition && validDateRange;
    }
    
    return descValidation.isValid && hasTitle && hasLocation;
  }, [editingTask, newTask]);



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

  useEffect(() => {
    if (showForm && editingTask && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showForm, editingTask]);

  // Load profile when profile section is shown
  useEffect(() => {
    if (showProfile) {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (userId && token) {
        setProfileLoading(true);
        setProfileError('');
        getUserProfile(userId, token)
          .then((data) => {
            if (data && data._id) {
              setProfile(data);
            } else {
              setProfileError('Failed to load profile: Invalid data received.');
            }
          })
          .catch((_err) => setProfileError('Failed to load profile'))
          .finally(() => setProfileLoading(false));
      } else {
        setProfileError('Authentication token not found. Please log in again.');
      }
    }
  }, [showProfile]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    const newLatLng: [number, number] = [lat, lng];
    setMarkerPosition(newLatLng);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat}, ${lng}`;
      const locationDetails = { address, lat, lng };
      if (editingTask) {
        setEditingTask({ ...editingTask, location: locationDetails });
        console.log('Editing Task Location Updated:', locationDetails);
      } else {
        setNewTask({ ...newTask, location: locationDetails });
        console.log('New Task Location Updated:', locationDetails);
      }
    } catch (error) {
      console.error("Error during reverse geocoding:", error);
      // Fallback to just updating lat/lng if geocoding fails
      const baseLocation = editingTask ? editingTask.location : newTask.location;
      const locationDetails = { ...baseLocation, lat, lng };
      if (editingTask) {
        setEditingTask({ ...editingTask, location: locationDetails });
      } else {
        setNewTask({ ...newTask, location: locationDetails });
      }
      setError('Failed to get address for selected location.');
    }
  };

  // Function to handle opening the create task form with current location
  const handleOpenCreateForm = async () => {
    setLocationLoading(true);
    setError(''); // Clear any previous errors
    setSuccessMessage(''); // Clear any previous success messages
    try {
      const currentLocation = await getCurrentLocation();
      
      // Update map center to user's location
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      
      // Set marker position to user's location
      setMarkerPosition([currentLocation.lat, currentLocation.lng]);
      
      // Update newTask with current location
      setNewTask({
        ...newTask,
        location: {
          address: currentLocation.address || '',
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        taskCategory: newTask.taskCategory || 'General'
      });
      
      setShowForm(true);
      setEditingTask(null);
      setSuccessMessage('Location set successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location. Please try again or set location manually.');
      // Fallback: open form without location
      setShowForm(true);
      setEditingTask(null);
      setNewTask({ title: '', description: '', location: { address: '', lat: 0, lng: 0 }, peopleNeeded: 1, approxStartTime: '', endTime: '', urgency: 'Normal', amount: 0, taskCategory: 'General' });
      setMarkerPosition(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate description before submitting
    const descValidation = validateDescription(newTask.description || '');
    if (!descValidation.isValid) {
      setError(descValidation.error);
      setLoading(false);
      return;
    }
    
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
      const createdByUser: IFrontendUser = {
        _id: createdBy,
        name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          role: 'user',
          aadhaar: localStorage.getItem('aadhaar') || '',
        };

      const res = await createTask({ ...newTask, createdBy: createdByUser }, token);
      if (res._id) {
  fetchTasks();
  setNewTask({ title: '', description: '', location: { address: '', lat: 0, lng: 0 }, peopleNeeded: 1, approxStartTime: '', endTime: '', urgency: 'Normal', amount: 0, taskCategory: 'General' });
  setMarkerPosition(null);
  setShowForm(false);
      } else {
        setError(res.message || 'Failed to create task');
      }
    } catch (_err) {
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
    
    // Validate description before submitting
    const descValidation = validateDescription(editingTask.description || '');
    if (!descValidation.isValid) {
      setError(descValidation.error);
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to update a task.');
        setLoading(false);
        return;
      }
      
  const res = await updateTask(editingTask._id, { ...editingTask, taskCategory: newTask.taskCategory || 'General' }, token);
      if (res._id) {
        fetchTasks();
        setEditingTask(null);
        setShowForm(false);
        setMarkerPosition(null);
      } else {
        setError(res.message || 'Failed to update task');
      }
    } catch (_err) {
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
    } catch (_err) {
      setError('Failed to delete task');
    }
  };

  const startEditing = (task: IFrontendTask) => {
    setEditingTask({ ...task });
    if (task.location && task.location.lat && task.location.lng) {
      setMarkerPosition([task.location.lat, task.location.lng]);
      setMapCenter([task.location.lat, task.location.lng]); // Set map center when editing
    }
    setShowForm(true);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prevProfile => {
      if (!prevProfile) return null;

      const updatedProfile = { ...prevProfile, [name]: value } as IFrontendUser;

      if (name === 'gender') {
        if (value === 'male') {
          updatedProfile.profilePicture = 'profile_pics/male.jpg';
        } else if (value === 'female') {
          updatedProfile.profilePicture = 'profile_pics/female.jpg';
        } else if (value === 'rather not say') {
          updatedProfile.profilePicture = 'profile_pics/rather_not_say.jpg';
        }
      }

      return updatedProfile;
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (!userId || !token) {
      setProfileError('Authentication token not found. Cannot update profile.');
      return;
    }

    if (!profile) {
      setProfileError('Profile data is not loaded.');
      return;
    }

    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');
    
    try {
      await updateUserProfile(userId, profile, token);
      setProfileMessage('Profile updated successfully!');
      // Update localStorage with new values
      if (profile.name) localStorage.setItem('userName', profile.name);
      if (profile.email) localStorage.setItem('userEmail', profile.email);
      
    } catch (_err) {
      setProfileError('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <>
      <NavBar 
        userType="user" 
        onProfileToggle={() => setShowProfile(!showProfile)}
        showProfile={showProfile}
      />
      <main className="max-w-4xl mx-auto my-10 p-4 pt-24">
      {!showProfile && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Hello, {localStorage.getItem('userName')}</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your tasks (title, description, location)"
              className="flex-1 md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => navigate('/rentals/create')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              📝 Post Rental
            </button>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={locationLoading}
              onClick={() => {
                if (showForm) {
                  // Cancel form
                  setShowForm(false);
                  setEditingTask(null);
                  setNewTask({ title: '', description: '', location: { address: '', lat: 0, lng: 0 }, peopleNeeded: 1, approxStartTime: '', endTime: '', urgency: 'Normal', amount: 0, taskCategory: 'General' });
                  setMarkerPosition(null);
                } else {
                  // Open form with current location
                  handleOpenCreateForm();
                }
              }}
            >
              {locationLoading ? 'Getting Location...' : (showForm ? 'Cancel' : 'Create New Task')}
            </button>
            <button
              onClick={() => navigate('/history')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              View History
            </button>
          </div>
        </div>
      )}

      {/* Task Category Tips */}
      {!showProfile && !showForm && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Task Creation Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl mb-2">🩸</div>
              <h4 className="font-bold text-red-700 mb-2">Blood Emergency</h4>
              <p className="text-sm text-red-600 mb-2">Use for urgent blood donation requests, medical emergencies, or life-threatening situations.</p>
              <p className="text-xs text-red-500">Set urgency to "Emergency" for immediate attention.</p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl mb-2">🫀</div>
              <h4 className="font-bold text-green-700 mb-2">Donor Tasks</h4>
              <p className="text-sm text-green-600 mb-2">Use for blood donation drives, organ donor requests, or regular donation needs.</p>
              <p className="text-xs text-green-500">Set urgency based on timeline requirements.</p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-bold text-blue-700 mb-2">General Tasks</h4>
              <p className="text-sm text-blue-600 mb-2">Use for community service, events, help requests, or other volunteer opportunities.</p>
              <p className="text-xs text-blue-500">Most flexible category for various needs.</p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl mb-2">🏠</div>
              <h4 className="font-bold text-purple-700 mb-2">Rental Items</h4>
              <p className="text-sm text-purple-600 mb-2">Use to rent out items like tools, equipment, electronics, or other belongings.</p>
              <p className="text-xs text-purple-500">Set daily rates and availability periods.</p>
            </div>
          </div>
        </div>
      )}

      {!showProfile && showForm && (
        <div ref={formRef} className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Title:</label>
              <input type="text" value={editingTask ? editingTask.title : newTask.title} onChange={e => editingTask ? setEditingTask({ ...editingTask, title: e.target.value }) : setNewTask({ ...newTask, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Description: <span className="text-red-500">*</span></label>
              <textarea 
                value={editingTask ? editingTask.description : newTask.description} 
                onChange={e => {
                  const newDesc = e.target.value;
                  const validation = validateDescription(newDesc);
                  setDescriptionError(validation.error);
                  
                  if (editingTask) {
                    setEditingTask({ ...editingTask, description: newDesc });
                  } else {
                    setNewTask({ ...newTask, description: newDesc });
                  }
                }} 
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
                  descriptionError 
                    ? 'border-red-300 focus:ring-red-400 focus:border-red-400' 
                    : 'border-gray-300 focus:ring-blue-400 focus:border-blue-400'
                }`} 
                rows={3}
                placeholder="Provide a detailed description of the task (minimum 10 characters)"
                required
              />
              {descriptionError && (
                <p className="text-red-500 text-sm mt-1">{descriptionError}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Character count: {((editingTask ? editingTask.description : newTask.description) || '').length}/1000
              </p>
            </div>
            <LocationPicker
              address={newTask.location?.address || ''}
              onAddressChange={(address) => setNewTask({ ...newTask, location: { ...newTask.location, address } })}
              onLocationChange={handleLocationSelect}
              loading={locationLoading}
              onCurrentLocationClick={() => console.log('Current location button clicked for New Task')}
              lat={newTask.location?.lat}
              lng={newTask.location?.lng}
            />
            <LocationMap
              center={mapCenter}
              markerPosition={markerPosition}
              onLocationSelect={handleLocationSelect}
              height="300px"
            />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block font-medium text-gray-700 mb-1">Amount (₹):</label>
                  <input type="number" min="0" step="0.01" value={editingTask ? editingTask.amount : newTask.amount} onChange={e => {
                    const amount = parseFloat(e.target.value);
                    if (editingTask) {
                      setEditingTask({ ...editingTask, amount: amount });
                    } else {
                      setNewTask({ ...newTask, amount: amount });
                    }
                  }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Urgency Level:</label>
                  <select value={editingTask ? editingTask.urgency : newTask.urgency} onChange={e => {
                      const urgency = e.target.value as 'Normal' | 'Urgent' | 'Emergency';
                      if (editingTask) {
                        setEditingTask({ ...editingTask, urgency: urgency });
                      } else {
                        setNewTask({ ...newTask, urgency: urgency });
                      }
                    }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                    <option>Normal</option>
                    <option>Urgent</option>
                    <option>Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Task Category:</label>
                  <select value={editingTask ? editingTask.taskCategory : newTask.taskCategory} onChange={e => {
                      const taskCategory = e.target.value as 'General' | 'Donor' | 'Blood Emergency' | 'Other' | 'Rental';
                      if (editingTask) {
                        setEditingTask({ ...editingTask, taskCategory: taskCategory });
                      } else {
                        setNewTask({ ...newTask, taskCategory: taskCategory, isRental: taskCategory === 'Rental' });
                      }
                    }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                    <option value="General">General</option>
                    <option value="Donor">Donor</option>
                    <option value="Blood Emergency">Blood Emergency</option>
                    <option value="Rental">Rental Items</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

            {/* Rental-specific fields */}
            {((editingTask && editingTask.taskCategory === 'Rental') || (!editingTask && newTask.taskCategory === 'Rental')) && (
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-700 mb-4">🏠 Rental Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Daily Rate (₹): <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      min="1" 
                      step="0.01" 
                      value={editingTask ? (editingTask.dailyRate || '') : (newTask.dailyRate || '')} 
                      onChange={e => {
                        const dailyRate = parseFloat(e.target.value) || 0;
                        if (editingTask) {
                          setEditingTask({ ...editingTask, dailyRate });
                        } else {
                          setNewTask({ ...newTask, dailyRate });
                        }
                      }} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" 
                      placeholder="e.g., 100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Item Condition: <span className="text-red-500">*</span></label>
                    <select 
                      value={editingTask ? (editingTask.itemCondition || 'Good') : (newTask.itemCondition || 'Good')} 
                      onChange={e => {
                        const itemCondition = e.target.value as 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
                        if (editingTask) {
                          setEditingTask({ ...editingTask, itemCondition });
                        } else {
                          setNewTask({ ...newTask, itemCondition });
                        }
                      }} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                      required
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Available From: <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={editingTask ? (editingTask.availableFrom ? new Date(editingTask.availableFrom).toISOString().slice(0, 10) : '') : (newTask.availableFrom || '')} 
                      onChange={e => {
                        const availableFrom = e.target.value;
                        if (editingTask) {
                          setEditingTask({ ...editingTask, availableFrom });
                        } else {
                          setNewTask({ ...newTask, availableFrom });
                        }
                      }} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Available Until: <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={editingTask ? (editingTask.availableTo ? new Date(editingTask.availableTo).toISOString().slice(0, 10) : '') : (newTask.availableTo || '')} 
                      onChange={e => {
                        const availableTo = e.target.value;
                        if (editingTask) {
                          setEditingTask({ ...editingTask, availableTo });
                        } else {
                          setNewTask({ ...newTask, availableTo });
                        }
                      }} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block font-medium text-gray-700 mb-1">Security Deposit (₹) (optional):</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={editingTask ? (editingTask.securityDeposit || '') : (newTask.securityDeposit || '')} 
                    onChange={e => {
                      const securityDeposit = parseFloat(e.target.value) || 0;
                      if (editingTask) {
                        setEditingTask({ ...editingTask, securityDeposit });
                      } else {
                        setNewTask({ ...newTask, securityDeposit });
                      }
                    }} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" 
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Rental Terms & Conditions (optional):</label>
                  <textarea 
                    value={editingTask ? (editingTask.rentalTerms || '') : (newTask.rentalTerms || '')} 
                    onChange={e => {
                      const rentalTerms = e.target.value;
                      if (editingTask) {
                        setEditingTask({ ...editingTask, rentalTerms });
                      } else {
                        setNewTask({ ...newTask, rentalTerms });
                      }
                    }} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400" 
                    rows={3}
                    placeholder="e.g., No smoking, handle with care, return in same condition..."
                    maxLength={500}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Character count: {((editingTask ? (editingTask.rentalTerms || '') : (newTask.rentalTerms || ''))).length}/500
                  </p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className={`w-full py-3 text-white rounded-lg font-semibold transition ${
                loading || !isFormValid 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : ((editingTask && editingTask.taskCategory === 'Rental') || (!editingTask && newTask.taskCategory === 'Rental'))
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`} 
              disabled={loading || !isFormValid}
            >
              {loading ? 'Saving...' : (editingTask ? 'Update' : 'Post') + 
                (((editingTask && editingTask.taskCategory === 'Rental') || (!editingTask && newTask.taskCategory === 'Rental')) ? ' Rental' : ' Task')}
            </button>
            {!isFormValid && (
              <p className="text-red-500 text-sm text-center mt-2">
                Please fill in all required fields with valid information before submitting.
              </p>
            )}
          </form>
        </div>
      )}

      {!showProfile && (
        <>
          {error && <p className="text-red-500 my-4">{error}</p>}
          {successMessage && <p className="text-green-600 my-4 font-semibold">{successMessage}</p>}

          <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Tasks Posted by You</h2>
  {loading ? <p>Loading tasks...</p> : (
          <>
            {/* Blood Emergency Tasks */}
      {visibleTasks.filter(task => task.taskCategory === 'Blood Emergency').length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                  🩸 Blood Emergency Tasks
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
        {visibleTasks.filter(task => task.taskCategory === 'Blood Emergency').length}
                  </span>
                </h3>
                <ul className="space-y-4">
      {visibleTasks.filter(task => task.taskCategory === 'Blood Emergency').map(task => (
                    <li key={task._id} className="border border-red-200 rounded-lg p-4 shadow-sm bg-red-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-red-700">{task.title}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {task.urgency}
                        </span>
                      </div>
                      <p className="text-gray-700 my-1">{task.description}</p>
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
                      {task.acceptedBy && task.acceptedBy.length > 0 && (
                        <div className="mt-4">
                          <b className="text-gray-700 mb-2 block">Accepted Volunteers:</b>
                          {/* AI Recommendation: Highest-point volunteer */}
                          {(() => {
                            // Smarter AI: score by skill match, points, recency
                            const acceptedList = Array.isArray(task.acceptedBy) ? task.acceptedBy : [];
                            const scored = acceptedList.map((vol, idx) => {
                              let skillMatch = false;
                              if (Array.isArray(vol.skills) && vol.skills.length > 0) {
                                const skillsLower = vol.skills.map(s => s.toLowerCase().trim());
                                const title = (task.title || '').toLowerCase();
                                const desc = (task.description || '').toLowerCase();
                                skillMatch = skillsLower.some(skill =>
                                  skill && (title.includes(skill) || desc.includes(skill) || skill.includes(title) || skill.includes(desc))
                                );
                              }
                              // Simulate recency: use array index (lower idx = earlier accept)
                              const recencyScore = 1 - idx / (acceptedList.length || 1);
                              // Score: skill match (2), points (normalized), recency (0.5)
                              const score = (skillMatch ? 2 : 0) + ((vol.points || 0) / 20) + recencyScore * 0.5;
                              const reason = [];
                              if (skillMatch) reason.push('Skill match');
                              if (vol.points) reason.push(`Points: ${vol.points}`);
                              reason.push(`Recency: ${idx === 0 ? 'First' : `#${idx+1}`}`);
                              return { vol, score, reason: reason.join(', ') };
                            });
                            scored.sort((a, b) => b.score - a.score);
                            const top = scored[0];
                            return top ? (
                              <div className="mb-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <span className="font-semibold text-indigo-700">AI Recommended Volunteer:</span>
                                <PublicProfile
                                  userId={top.vol._id || ''}
                                  userName={top.vol.name || 'Unknown User'}
                                  userEmail={top.vol.email || ''}
                                  isClickable={true}
                                  onProfileClick={() => navigate(`/profile/${top.vol._id}`)}
                                />
                                <span className="text-xs text-indigo-700 ml-2">Score: {top.score.toFixed(2)} | {top.reason}</span>
                              </div>
                            ) : null;
                          })()}
                          <div className="space-y-3">
                            {task.acceptedBy.map((volunteer: IFrontendUser) => {
                              // Skill match highlight
                              let skillMatch = false;
                              if (Array.isArray(volunteer.skills) && volunteer.skills.length > 0) {
                                const skillsLower = volunteer.skills.map(s => s.toLowerCase().trim());
                                const title = (task.title || '').toLowerCase();
                                const desc = (task.description || '').toLowerCase();
                                skillMatch = skillsLower.some(skill =>
                                  skill && (title.includes(skill) || desc.includes(skill) || skill.includes(title) || skill.includes(desc))
                                );
                              }
                              return (
                                <div key={volunteer._id} className={`border border-gray-200 rounded-lg p-3 bg-white ${skillMatch ? 'ring-2 ring-green-400' : ''}`}>
                                  <PublicProfile
                                    userId={volunteer._id || ''}
                                    userName={volunteer.name || 'Unknown User'}
                                    userEmail={volunteer.email || ''}
                                    isClickable={true}
                                    onProfileClick={() => {
                                      navigate(`/profile/${volunteer._id}`);
                                    }}
                                  />
                                  {skillMatch && <div className="text-xs text-green-600 mt-1">Skill match!</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Business Volunteer Display */}
                      <BusinessVolunteerDisplay task={task} />
                      
                      {(!task.acceptedCount || task.acceptedCount === 0) && !task.businessVolunteerInfo && (
                        <div className="flex space-x-2 mt-4">
                          <button onClick={() => startEditing(task)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Edit</button>
                          <button onClick={() => handleDelete(task._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" disabled={loading}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Donor Tasks */}
            {visibleTasks.filter(task => task.taskCategory === 'Donor').length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  🫀 Donor Tasks
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {visibleTasks.filter(task => task.taskCategory === 'Donor').length}
                  </span>
                </h3>
                <ul className="space-y-4">
                  {visibleTasks.filter(task => task.taskCategory === 'Donor').map(task => (
                    <li key={task._id} className="border border-green-200 rounded-lg p-4 shadow-sm bg-green-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-green-700">{task.title}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {task.urgency}
                        </span>
                      </div>
                      <p className="text-gray-700 my-1">{task.description}</p>
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
                      {task.acceptedBy && task.acceptedBy.length > 0 && (
                        <div className="mt-4">
                          <b className="text-gray-700 mb-2 block">Accepted Volunteers:</b>
                          <div className="space-y-3">
                            {task.acceptedBy.map((volunteer: IFrontendUser) => (
                              <div key={volunteer._id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <PublicProfile
                                  userId={volunteer._id || ''}
                                  userName={volunteer.name || 'Unknown User'}
                                  userEmail={volunteer.email || ''}
                                  isClickable={true}
                                  onProfileClick={() => {
                                    navigate(`/profile/${volunteer._id}`);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <BusinessVolunteerDisplay task={task} />
                      {(!task.acceptedCount || task.acceptedCount === 0) && !task.businessVolunteerInfo?.volunteerName && (
                        <div className="flex space-x-2 mt-4">
                          <button onClick={() => startEditing(task)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Edit</button>
                          <button onClick={() => handleDelete(task._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" disabled={loading}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* General and Other Tasks */}
            {visibleTasks.filter(task => task.taskCategory === 'General' || task.taskCategory === 'Other').length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                  📋 General & Other Tasks
                  <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {visibleTasks.filter(task => task.taskCategory === 'General' || task.taskCategory === 'Other').length}
                  </span>
                </h3>
                <ul className="space-y-4">
                  {visibleTasks.filter(task => task.taskCategory === 'General' || task.taskCategory === 'Other').map(task => (
                    <li key={task._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-blue-700">{task.title}</h4>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {task.urgency}
                        </span>
                      </div>
                      <p className="text-gray-700 my-1">{task.description}</p>
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
                      {task.acceptedBy && task.acceptedBy.length > 0 && (
                        <div className="mt-4">
                          <b className="text-gray-700 mb-2 block">Accepted Volunteers:</b>
                          <div className="space-y-3">
                            {task.acceptedBy.map((volunteer: IFrontendUser) => (
                              <div key={volunteer._id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <PublicProfile
                                  userId={volunteer._id || ''}
                                  userName={volunteer.name || 'Unknown User'}
                                  userEmail={volunteer.email || ''}
                                  isClickable={true}
                                  onProfileClick={() => {
                                    navigate(`/profile/${volunteer._id}`);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <BusinessVolunteerDisplay task={task} />
                      {(!task.acceptedCount || task.acceptedCount === 0) && !task.businessVolunteerInfo?.volunteerName && (
                        <div className="flex space-x-2 mt-4">
                          <button onClick={() => startEditing(task)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Edit</button>
                          <button onClick={() => handleDelete(task._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" disabled={loading}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rental Tasks */}
            {visibleTasks.filter(task => task.taskCategory === 'Rental').length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
                  🏠 Rental Items
                  <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {visibleTasks.filter(task => task.taskCategory === 'Rental').length}
                  </span>
                </h3>
                <ul className="space-y-4">
                  {visibleTasks.filter(task => task.taskCategory === 'Rental').map(task => (
                    <li key={task._id} className="border border-purple-200 rounded-lg p-4 shadow-sm bg-purple-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-purple-700">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {task.itemCondition}
                            </span>
                            <span className="text-lg font-bold text-purple-600">
                              ₹{task.dailyRate}/day
                            </span>
                            {task.securityDeposit && task.securityDeposit > 0 && (
                              <span className="text-sm text-gray-500">
                                + ₹{task.securityDeposit} deposit
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {task.isFull ? 'Rented' : 'Available'}
                        </span>
                      </div>
                      <p className="text-gray-700 my-1">{task.description}</p>
                      <AddressDisplay
                        address={task.location?.address}
                        lat={task.location?.lat}
                        lng={task.location?.lng}
                      />
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <p className="text-sm text-gray-500">
                          <b>Available From:</b> {task.availableFrom ? new Date(task.availableFrom).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          <b>Available Until:</b> {task.availableTo ? new Date(task.availableTo).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      {task.rentalTerms && (
                        <div className="mt-2">
                          <b className="text-gray-700">Rental Terms:</b>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded mt-1">{task.rentalTerms}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-2"><b>Renter:</b> {task.acceptedCount || 0} / {task.peopleNeeded}</p>
                      {task.acceptedBy && task.acceptedBy.length > 0 && (
                        <div className="mt-4">
                          <b className="text-gray-700 mb-2 block">Current Renter:</b>
                          <div className="space-y-3">
                            {task.acceptedBy.map((renter: IFrontendUser) => (
                              <div key={renter._id} className="border border-purple-200 rounded-lg p-3 bg-white">
                                <PublicProfile
                                  userId={renter._id || ''}
                                  userName={renter.name || 'Unknown User'}
                                  userEmail={renter.email || ''}
                                  isClickable={true}
                                  onProfileClick={() => {
                                    navigate(`/profile/${renter._id}`);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <BusinessVolunteerDisplay task={task} />
                      {(!task.acceptedCount || task.acceptedCount === 0) && !task.businessVolunteerInfo?.volunteerName && (
                        <div className="flex space-x-2 mt-4">
                          <button onClick={() => startEditing(task)} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">Edit</button>
                          <button onClick={() => handleDelete(task._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" disabled={loading}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No Tasks Message */}
            {visibleTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No tasks posted yet.</p>
                <p className="text-gray-400 text-sm mt-2">Create your first task to get started!</p>
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}

      {/* Profile Section */}
      {showProfile && (
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Your Profile</h2>
          {profileLoading && <p className="text-gray-500">Loading profile...</p>}
          {profileError && <p className="text-red-500 mt-2">{profileError}</p>}
          {profileMessage && <p className="text-green-600 mt-2">{profileMessage}</p>}
          
          {profile ? (
            <>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Profile Picture Section - Moved to top */}
              <div className="text-center mb-6">
                <label className="block font-medium text-gray-700 mb-3">Profile Picture:</label>
                {profile.profilePicture ? (
                  <div className="flex justify-center">
                    <img 
                      src={`/${profile.profilePicture.replace(/^\//, '')}`}
                      alt="Profile Preview" 
                      className="w-24 h-24 object-cover rounded-full border-4 border-blue-200 shadow-lg"
                      onError={() => {
                        console.error('Profile picture failed to load:', profile.profilePicture);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto border-4 border-blue-200 shadow-lg">
                    <span className="text-white font-semibold text-2xl">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={profile.name || ''} 
                  onChange={handleProfileChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email:</label>
                <input 
                  type="email" 
                  name="email" 
                  value={profile.email || ''} 
                  onChange={handleProfileChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Phone:</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={profile.phone || ''} 
                  onChange={handleProfileChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Gender:</label>
                <select
                  name="gender"
                  value={profile.gender || ''}
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
                <input 
                  type="text" 
                  name="location" 
                  value={profile.location || ''} 
                  onChange={handleProfileChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Aadhaar Number:</label>
                <input 
                  type="text" 
                  name="aadhaar" 
                  value={profile?.aadhaar || ''} 
                  onChange={handleProfileChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                  placeholder="123456789012"
                  readOnly
                />
                <small className="text-gray-500 block mt-1">Aadhaar number cannot be changed</small>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">About:</label>
                <textarea 
                  name="about" 
                  value={profile.about || ''} 
                  onChange={handleProfileChange} 
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" 
                disabled={profileLoading}
              >
                {profileLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Delete Account</h3>
              <button
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                onClick={async () => {
                  if (!profile) return;
                  const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
                  if (!confirmed) return;
                  const userId = localStorage.getItem('userId');
                  const token = localStorage.getItem('token');
                  if (!userId || !token) {
                    setProfileError('Not authenticated. Please log in again.');
                    return;
                  }
                  try {
                    await deleteAccount(userId, token);
                    // Clear local storage and redirect
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('aadhaar');
                    navigate('/');
                  } catch (_err) {
                    setProfileError('Failed to delete account.');
                  }
                }}
              >
                Delete Account
              </button>
            </div>
            </>
          ) : (
                         <div className="space-y-4">
               <div>
                 <label className="block font-medium text-gray-700 mb-1">Full Name:</label>
                 <p className="text-gray-900">{localStorage.getItem('userName') || 'Not set'}</p>
               </div>
               <div>
                 <label className="block font-medium text-gray-700 mb-1">Email:</label>
                 <p className="text-gray-900">{localStorage.getItem('userEmail') || 'Not set'}</p>
               </div>
               <div>
                 <label className="block font-medium text-gray-700 mb-1">User ID:</label>
                 <p className="text-gray-900">{localStorage.getItem('userId') || 'Not set'}</p>
               </div>
               <div>
                 <label className="block font-medium text-gray-700 mb-1">Aadhaar Number:</label>
                 <p className="text-gray-900">{localStorage.getItem('aadhaar') || 'Not provided'}</p>
               </div>
             </div>
          )}
        </div>
      )}

  {/* Feedback section for users, not in profile view */}
  {!showProfile && <Feedback theme="user" />}
  </main>
  </>
  );
};

export default Dashboard;
