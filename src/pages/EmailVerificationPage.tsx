import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { API_URL } from '../api';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const hasAttemptedVerifyRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedVerifyRef.current) return;
    hasAttemptedVerifyRef.current = true;
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
    // Intentionally empty dependency array to run once on mount
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setVerificationStatus('success');
        setMessage(data.message);
      } else {
        setVerificationStatus('error');
        setMessage(data.message || 'Verification failed');
      }
  } catch (_error) {
      setVerificationStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.message || 'Failed to resend verification email');
      }
  } catch (_error) {
      setMessage('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <NavBar userType="user" />
      <main className="max-w-2xl mx-auto my-10 p-4 pt-24">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          {verificationStatus === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-green-700 mb-2">Email Verified Successfully!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/user/auth')}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Login to Your Account
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Need a new verification email?</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Enter your email address below and we'll send you a new verification link.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/user/auth')}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default EmailVerificationPage;
