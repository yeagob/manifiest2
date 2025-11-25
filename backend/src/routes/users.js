import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import UserService from '../services/UserService.js';

const router = express.Router();

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await UserService.getUserProfile(req.userId);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: profile.user.toJSON(),
      causes: profile.causes.map(c => c.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, picture } = req.body;
    const user = await UserService.updateProfile(req.userId, { name, picture });
    res.json(user.toJSON());
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update user avatar
router.put('/avatar', requireAuth, async (req, res) => {
  try {
    const config = req.body;

    // Validate that at least one avatar property is provided
    const validProps = ['base', 'eyes', 'mouth', 'accessory', 'bgColor', 'skinTone'];
    const hasValidProp = validProps.some(prop => config[prop] !== undefined);

    if (!hasValidProp) {
      return res.status(400).json({ error: 'Avatar configuration is required' });
    }

    const user = await UserService.updateAvatar(req.userId, config);

    console.log('✅ Avatar updated:', {
      userId: user.id,
      config
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
    const causes = await UserService.getUserCauses(req.userId);
    res.json(causes.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user causes' });
  }
});

export default router;
