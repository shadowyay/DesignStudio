import React, { useState } from 'react';

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory] = useState([
    { 
      date: new Date().toISOString(),
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      status: 'Successful'
    },
    {
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      status: 'Successful'
    }
  ]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      // In a real app, you would call an API endpoint here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  const handleToggle2FA = async () => {
    try {
      // In a real app, you would handle 2FA setup/disable here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTwoFactorEnabled(!twoFactorEnabled);
      setMessage({
        type: 'success',
        text: `Two-factor authentication ${twoFactorEnabled ? 'disabled' : 'enabled'} successfully`
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update 2FA settings' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

      {message.text && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Password Change Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`${
                twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span className={`${
                twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
          </div>
          
          {twoFactorEnabled && (
            <p className="text-sm text-gray-600 mt-2">
              Two-factor authentication is enabled. You'll be asked for a verification code when signing in from a new device.
            </p>
          )}
        </div>

        {/* Login History Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Login Activity</h2>
          
          <div className="space-y-4">
            {loginHistory.map((login, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{login.device}</p>
                  <p className="text-sm text-gray-500">{login.location}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(login.date).toLocaleDateString()} {new Date(login.date).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  login.status === 'Successful' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {login.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;