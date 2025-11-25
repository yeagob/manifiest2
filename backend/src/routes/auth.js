import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import AuthService from '../services/AuthService.js';
import UserService from '../services/UserService.js';

const router = express.Router();

// Email login
router.post('/email', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { user, token } = await AuthService.loginWithEmail(email, name);

    console.log('✅ Email login successful:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      user: user.toJSON(),
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Email auth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Google login
router.post('/google', async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const { user, token } = await AuthService.loginWithGoogle(googleToken);

    console.log('✅ Google login successful:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      user: user.toJSON(),
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { user } = await UserService.getUserProfile(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout
router.post('/logout', optionalAuth, (req, res) => {
  // Stateless JWT auth doesn't require server-side logout
  // Client should remove the token
  res.json({ message: 'Logout successful' });
});

// Check auth status
router.get('/status', (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      userId = decoded.userId;
    }
  }

  res.json({
    authenticated: !!userId,
    userId: userId
  });
});

export default router;
