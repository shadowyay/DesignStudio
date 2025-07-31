
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';
import type {RegisterData} from '../types'

type AuthFormProps = {
  isVolunteer?: boolean;
};

const AuthForm: React.FC<AuthFormProps> = ({ isVolunteer }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Registration fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [about, setAbout] = useState('');
  const [passwordError, setPasswordError] = useState(''); // New state for password validation errors
  const [gender, setGender] = useState<'male' | 'female' | 'rather not say' | ''>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res.token && res.user && res.user._id) {
        // Save token, user ID, and user name
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', res.user._id);
        localStorage.setItem('userName', res.user.name);
        setLoading(false); // Set loading to false BEFORE navigation
        navigate(isVolunteer ? '/volunteer/dashboard' : '/user/dashboard');
      } else {
        setError(res.message || 'Login failed');
        setLoading(false);
      }
    } catch (_err) { 
      setError('Login failed');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPasswordError(''); // Clear previous password errors

    // Password validation
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      let profilePictureUrl = '';
      if (gender === 'male') {
        profilePictureUrl = '/profile_pics/male.jpg';
      } else if (gender === 'female') {
        profilePictureUrl = '/profile_pics/female.jpg';
      } else if (gender === 'rather not say') {
        profilePictureUrl = '/profile_pics/rather_not_say.jpg';
      }

      const data: RegisterData = {
        name,
        dob,
        email,
        phone,
        password,
        location,
        profilePicture: profilePictureUrl,
        about,
        role: isVolunteer ? 'volunteer' : 'user',
        gender: gender || undefined,
      };
      const res = await register(data);
      if (res.message && res.message.includes('success')) {
        setShowRegister(false);
        setError('');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (_err) { 
      setError('Registration failed');
    }
    setLoading(false);
  };

  return (
    <main className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl shadow-lg">
      {!showRegister ? (
        <section>
          <h2 className="text-3xl font-bold text-black-700 mb-6 text-center">SmartServe</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email:</label>
              <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Password:</label>
              <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <p className="mt-4 text-gray-600">
            Don't have an account?{' '}
            <a href="#" className="text-blue-600 hover:underline" onClick={e => {e.preventDefault(); setShowRegister(true);}}>Create an account</a>
          </p>
        </section>
      ) : (
        <section>
          <h2 className="text-3xl font-bold text-black-700 mb-6 text-center">SmartServe</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Full Name:</label>
              <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Date of Birth:</label>
              <input type="date" name="dob" value={dob} onChange={e => setDob(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Email:</label>
              <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Phone Number:</label>
              <input type="tel" name="phone" pattern="[0-9]{10}" title="Enter a 10-digit number" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Gender:</label>
              <select
                name="gender"
                value={gender}
                onChange={e => setGender(e.target.value as 'male' | 'female' | 'rather not say')}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="rather not say">Rather not say</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Password:</label>
              <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
              <small className="text-gray-500 block mt-1">Password must be at least 6 characters long.</small>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Location:</label>
              <input type="text" name="location" value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">About (Optional):</label>
              <textarea 
                name="about" 
                value={about} 
                onChange={e => setAbout(e.target.value)} 
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" 
              />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <p className="mt-4 text-gray-600">
            Already have an account?{' '}
            <a href="#" className="text-blue-600 hover:underline" onClick={e => {e.preventDefault(); setShowRegister(false);}}>Back to Login</a>
          </p>
        </section>
      )}
    </main>
  );
};

export default AuthForm;
