import express from 'express';
import { register, login, verifyEmail, resendVerificationEmail } from '../controllers/userController';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(400).json({ message });
  }
});

// Verify email route
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid verification token' });
    }
    
    const result = await verifyEmail(token);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    res.status(400).json({ message });
  }
});

// Resend verification email route
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const result = await resendVerificationEmail(email);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Resend failed';
    res.status(400).json({ message });
  }
});

export default router;
