import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Cause from '../models/Cause.js';

const router = express.Router();

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get causes user supports
    const causes = await Promise.all(
      user.causesSupported.map(causeId => Cause.findById(causeId))
    );

    res.json({
      user: user.toJSON(),
      causes: causes.filter(c => c !== null).map(c => c.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, picture } = req.body;
    if (name) user.name = name;
    if (picture) user.picture = picture;

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update user avatar
router.put('/avatar', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { emoji, color } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    await user.updateAvatar(emoji, color);

    console.log('✅ Avatar updated:', {
      userId: user.id,
      emoji,
      color
    });

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Failed to update avatar:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// Get user's supported causes
router.get('/causes', requireAuth, async (req, res) => {
  try {
    const causes = await Cause.findByUser(req.session.userId);
    res.json(causes.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user causes' });
  }
});

export default router;
