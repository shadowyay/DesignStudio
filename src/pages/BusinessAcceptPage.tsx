import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface TaskInfo {
  _id: string;
  title: string;
  description: string;
  location: { address: string };
  urgency: string;
  amount: number;
  taskCategory: string;
  createdBy: {
    name: string;
    email: string;
    phone: string;
  };
}

interface BusinessInfo {
  _id: string;
  name: string;
  contactPerson: {
    name: string;
    email: string;
  };
}

const BusinessAcceptPage: React.FC = () => {
  const { businessId, taskId } = useParams<{ businessId: string; taskId: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [volunteerName, setVolunteerName] = useState('');
  const [volunteerPhone, setVolunteerPhone] = useState('');
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch task info
        const taskResponse = await fetch(`/api/tasks/${taskId}`);
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          setTask(taskData);
        } else {
          setError('Task not found or no longer available');
          return;
        }
        
        // Fetch business info
        const businessResponse = await fetch(`/api/business/${businessId}`);
        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          setBusiness(businessData.business);
        } else {
          setError('Business information not found');
          return;
        }
        
      } catch (err) {
        setError('Failed to load task information');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId, taskId]);



  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!volunteerName.trim() || !volunteerPhone.trim()) {
      setError('Volunteer name and phone are required');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/business/accept/${businessId}/task/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volunteerName: volunteerName.trim(),
          volunteerPhone: volunteerPhone.trim(),
          volunteerEmail: volunteerEmail.trim() || undefined,
          estimatedArrival: estimatedArrival || undefined
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Failed to assign volunteer');
      }
      
    } catch (err) {
      setError('Failed to submit volunteer assignment');
      console.error('Error accepting task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this task assignment?')) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/business/decline/${businessId}/task/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Unable to provide volunteer at this time'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Task assignment declined successfully');
        navigate('/');
      } else {
        setError(result.message || 'Failed to decline assignment');
      }
      
    } catch (err) {
      setError('Failed to decline assignment');
      console.error('Error declining task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task information...</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Task Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/')} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-700 mb-4">Volunteer Assigned Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for accepting this task. The customer has been notified with your volunteer's details.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                <strong>Volunteer:</strong> {volunteerName}<br/>
                <strong>Phone:</strong> {volunteerPhone}
                {volunteerEmail && <><br/><strong>Email:</strong> {volunteerEmail}</>}
                {estimatedArrival && <><br/><strong>Estimated Arrival:</strong> {new Date(estimatedArrival).toLocaleString()}</>}
              </p>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
            <h1 className="text-2xl font-bold">SmartServe - Volunteer Request</h1>
            <p className="mt-2 opacity-90">
              Hello {business?.contactPerson.name}, you've been requested to provide a volunteer for this task.
            </p>
          </div>

          {/* Task Details */}
          {task && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{task.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                    task.urgency === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.urgency} Priority
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="font-medium">{task.location.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Compensation</p>
                    <p className="font-medium">₹{task.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Category</p>
                    <p className="font-medium">{task.taskCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-medium">{task.createdBy.name}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-800">{task.description}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2"><strong>Customer Contact:</strong></p>
                  <p className="text-sm text-blue-700">
                    Email: {task.createdBy.email}<br/>
                    Phone: {task.createdBy.phone}
                  </p>
                </div>
              </div>

              {/* Volunteer Assignment Form */}
              <form onSubmit={handleAccept} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Volunteer</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volunteer Name *
                    </label>
                    <input
                      type="text"
                      value={volunteerName}
                      onChange={(e) => setVolunteerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Full name of volunteer"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volunteer Phone *
                    </label>
                    <input
                      type="tel"
                      value={volunteerPhone}
                      onChange={(e) => setVolunteerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Contact number"
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volunteer Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={volunteerEmail}
                      onChange={(e) => setVolunteerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      placeholder="Email address"
                      disabled={submitting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Arrival (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={estimatedArrival}
                      onChange={(e) => setEstimatedArrival(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Assigning...' : '✅ Accept & Assign Volunteer'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={submitting}
                    className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    ❌ Unable to Help
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessAcceptPage;