import express from 'express';
import { verifyGoogleToken, requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

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
