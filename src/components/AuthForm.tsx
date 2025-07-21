
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';

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
  const [skills, setSkills] = useState('');
  const [openToAnything, setOpenToAnything] = useState('Yes');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res.token && res.user && res.user._id) {
        // Save token and user ID, redirect to dashboard
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', res.user._id);
        navigate(isVolunteer ? '/volunteer/dashboard' : '/user/dashboard');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data: any = {
        name,
        dob,
        email,
        phone,
        password,
        location,
        role: isVolunteer ? 'volunteer' : 'user',
      };
      if (isVolunteer) {
        data.skills = skills;
        data.openToAnything = openToAnything === 'Yes';
      }
      const res = await register(data);
      if (res.message && res.message.includes('success')) {
        setShowRegister(false);
        setError('');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 400, margin: '40px auto', lineHeight: 1.8 }}>
      {!showRegister ? (
        <section className="section active">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <label>Email:</label>
            <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <label>Password:</label>
            <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="get-started" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <p>
            Don't have an account? <a href="#" onClick={e => {e.preventDefault(); setShowRegister(true);}}>Create an account</a>
          </p>
        </section>
      ) : (
        <section className="section">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <label>Full Name:</label>
            <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} required />
            <label>Date of Birth:</label>
            <input type="date" name="dob" value={dob} onChange={e => setDob(e.target.value)} required />
            <label>Email:</label>
            <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <label>Phone Number:</label>
            <input type="tel" name="phone" pattern="[0-9]{10}" title="Enter a 10-digit number" value={phone} onChange={e => setPhone(e.target.value)} required />
            <label>Password:</label>
            <input type="password" name="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <small>Password must be at least 8 characters with letters and numbers.</small>
            <label>Location:</label>
            <input type="text" name="location" value={location} onChange={e => setLocation(e.target.value)} required />
            {isVolunteer && (
              <>
                <label>What can you volunteer for?</label>
                <input type="text" name="skills" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Teaching, Cleaning, Organizing" required />
                <label>Or open to anything?</label>
                <select name="openToAnything" value={openToAnything} onChange={e => setOpenToAnything(e.target.value)}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </>
            )}
            <button type="submit" className="get-started" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <p>
            Already have an account? <a href="#" onClick={e => {e.preventDefault(); setShowRegister(false);}}>Back to Login</a>
          </p>
        </section>
      )}
    </main>
  );
};

export default AuthForm;
