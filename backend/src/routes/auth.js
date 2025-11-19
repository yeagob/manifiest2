import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyGoogleToken, requireAuth, generateToken } from '../middleware/auth.js';
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

    // Generate JWT token
    const token = generateToken(user.id);

    // Set session (for backwards compatibility)
    req.session.userId = user.id;

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

    // Verify Google token
    const googleData = await verifyGoogleToken(googleToken);

    // Find or create user
    const user = await User.findOrCreate(googleData);

    // Generate JWT token
    const jwtToken = generateToken(user.id);

    // Set session (for backwards compatibility)
    req.session.userId = user.id;

    console.log('✅ Google login successful:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      user: user.toJSON(),
      token: jwtToken,
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
    const userId = req.userId || req.session?.userId;
    const user = await User.findById(userId);
    if (!user) {
      if (req.session) req.session.destroy();
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
  // Check JWT token first
  const authHeader = req.headers.authorization;
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'protest-simulator-jwt-secret-key-change-in-production');
      userId = decoded.userId;
    } catch (error) {
      // Token invalid, check session
    }
  }

  // Fallback to session
  if (!userId && req.session?.userId) {
    userId = req.session.userId;
  }

  res.json({
    authenticated: !!userId,
    userId: userId
  });
});

export default router;
