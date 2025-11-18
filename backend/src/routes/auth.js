import express from 'express';
import { verifyGoogleToken, requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Email login (simple MVP authentication)
router.post('/email', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find or create user with email
    const userData = {
      email: email.toLowerCase(),
      name: name || email.split('@')[0], // Use email prefix as name if not provided
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=6366F1&color=fff`
    };

    const user = await User.findOrCreate(userData);

    // Set session
    req.session.userId = user.id;

    res.json({
      user: user.toJSON(),
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
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify Google token
    const googleData = await verifyGoogleToken(token);

    // Find or create user
    const user = await User.findOrCreate(googleData);

    // Set session
    req.session.userId = user.id;

    res.json({
      user: user.toJSON(),
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
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check auth status
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    userId: req.session.userId || null
  });
});

export default router;
