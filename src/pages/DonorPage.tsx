import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasks, acceptTask } from '../api';
import AddressDisplay from '../components/AddressDisplay';
import PublicProfile from '../components/PublicProfile';
import NavBar from '../components/NavBar';
import type { IFrontendUser, IFrontendTask } from '../types';

const DonorPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<IFrontendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const fetchTasks = useCallback(() => {
    setLoading(true);
    getTasks()
      .then((res: IFrontendTask[]) => {
        if (Array.isArray(res)) {
          // Filter only Donor tasks and exclude full tasks
          const donorTasks = res.filter((task: IFrontendTask) => {
            if (task.taskCategory !== 'Donor') return false;
            const currentUserAccepted = !!(userId && task.acceptedBy?.some((vol: IFrontendUser) => vol._id === userId));
            if (currentUserAccepted) return true;
            if (task.isFull) return false;
            const acceptedCount = task.acceptedCount ?? (task.acceptedBy?.length ?? 0);
            const availableSpots = (task.peopleNeeded || 0) - acceptedCount;
            return availableSpots > 0;
          });
          setTasks(donorTasks);
          setError('');
        } else {
          setTasks([]);
          setError('Invalid response format from server');
        }
      })
      .catch((_err) => {
        setError('Failed to load donor tasks');
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTasks();
  }, [token, navigate, fetchTasks]);

  const handleAccept = async (taskId: string) => {
    if (!userId || !token) {
      setMessage('You must be logged in to accept tasks.');
      return;
    }

    setAccepting(taskId);
    setMessage('');
    setError('');

    try {
      const result = await acceptTask(taskId, userId!, token!);
      if (result.success) {
        setMessage('Donor task accepted successfully!');
        // Merge updated task immediately so UI reflects acceptance and shows creator
        if (result.task && result.task._id) {
          setTasks(prev => prev.map(t => (t._id === result.task._id ? { ...t, ...result.task } : t)));
        }
        setTimeout(() => {
          fetchTasks();
          setMessage('');
        }, 1200);
      } else {
        setMessage(result.message || 'Could not accept task.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept task.';
      setMessage(msg);
    } finally {
      setAccepting(null);
    }
  };

  return (
    <>
      <NavBar userType="volunteer" />
      <main className="max-w-6xl mx-auto my-10 p-4 pt-24">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-green-700 mb-2">🫀 Donor Tasks</h1>
              <p className="text-gray-600">Blood donation requests and organ donor opportunities</p>
            </div>
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {loading && <p className="text-gray-500">Loading donor tasks...</p>}
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {message && <p className={`mt-2 font-semibold ${message.includes('accepted') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}

          {/* Task Summary */}
          {!loading && tasks.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                🫀 {tasks.length} Donor task{tasks.length !== 1 ? 's' : ''} available for volunteers
              </p>
            </div>
          )}

          <div className="space-y-6">
            {tasks.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🫀</div>
                <p className="text-gray-500 text-lg mb-2">No donor tasks at the moment</p>
                <p className="text-gray-400 text-sm">Check back later for new donation opportunities</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task._id} className="border border-green-200 rounded-lg p-6 shadow-lg bg-green-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">{task.title}</h3>
                      <p className="text-gray-700 text-lg">{task.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      task.urgency === 'Emergency' ? 'bg-red-200 text-red-800' :
                      task.urgency === 'Urgent' ? 'bg-orange-200 text-orange-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {task.urgency}
                    </span>
                  </div>

                  <AddressDisplay
                    address={task.location?.address}
                    lat={task.location?.lat}
                    lng={task.location?.lng}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Start Time:</span>
                      <p className="text-gray-700 font-medium">{task.approxStartTime ? new Date(task.approxStartTime).toLocaleString() : 'Flexible'}</p>
                    </div>
                    {task.endTime && (
                      <div className="bg-white p-3 rounded-lg border">
                        <span className="text-gray-500 block">End Time:</span>
                        <p className="text-gray-700 font-medium">{new Date(task.endTime).toLocaleString()}</p>
                      </div>
                    )}
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Volunteers:</span>
                      <p className="text-gray-700 font-medium">{task.acceptedCount || 0} / {task.peopleNeeded}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Amount:</span>
                      <p className="text-gray-700 font-medium">₹{task.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  {/* Task Status and Actions */}
                  {(() => {
                    const currentUserAccepted = task.acceptedBy && userId && task.acceptedBy.some((vol: IFrontendUser) => vol._id === userId);
                    const availableSpots = (task.peopleNeeded || 0) - (task.acceptedCount || 0);

                    if (currentUserAccepted) {
                      return (
                        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                          <p className="text-green-800 font-bold text-lg mb-3">✅ You have accepted this donor task!</p>
                          {task.createdBy && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Task Created By:</p>
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <PublicProfile
                                  userId={task.createdBy._id || ''}
                                  userName={task.createdBy.name || 'Unknown User'}
                                  userEmail={task.createdBy.email || ''}
                                  isClickable={true}
                                  onProfileClick={() => {
                                    navigate(`/profile/${task.createdBy._id}`);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else if (availableSpots <= 0) {
                      return (
                        <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                          <span className="text-gray-700 font-medium">Task is full - All volunteers accepted</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-6">
                          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-green-800 font-medium">
                              🫀 <span className="font-bold">{availableSpots}</span> spot{availableSpots !== 1 ? 's' : ''} still available for this donor task
                            </p>
                          </div>
                          <button 
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed" 
                            onClick={() => handleAccept(task._id)} 
                            disabled={accepting === task._id}
                          >
                            {accepting === task._id ? 'Accepting...' : '🫀 Accept Donor Task'}
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default DonorPage;
