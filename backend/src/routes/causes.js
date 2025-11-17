import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import Cause from '../models/Cause.js';
import User from '../models/User.js';

const router = express.Router();

// Get all active causes
router.get('/', optionalAuth, async (req, res) => {
  try {
    const causes = await Cause.findActive();
    const sorted = causes.sort((a, b) => b.totalSteps - a.totalSteps);
    res.json(sorted.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch causes' });
  }
});

// Get most active causes
router.get('/most-active', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const causes = await Cause.getMostActive(limit);
    res.json(causes.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch most active causes' });
  }
});

// Get a single cause
router.get('/:id', async (req, res) => {
  try {
    const cause = await Cause.findById(req.params.id);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }
    res.json(cause.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cause' });
  }
});

// Create a new cause
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, icon, color } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const cause = await Cause.create({
      title,
      description,
      category,
      icon,
      color,
      createdBy: req.session.userId,
      supporters: [req.session.userId] // Creator automatically supports
    });

    // Add to user's supported causes
    const user = await User.findById(req.session.userId);
    await user.supportCause(cause.id, 1); // Default: every step

    res.status(201).json(cause.toJSON());
  } catch (error) {
    console.error('Create cause error:', error);
    res.status(500).json({ error: 'Failed to create cause' });
  }
});

// Update a cause
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const cause = await Cause.findById(req.params.id);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }

    // Only creator can update
    if (cause.createdBy !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized to update this cause' });
    }

    const { title, description, category, icon, color, isActive } = req.body;

    if (title) cause.title = title;
    if (description) cause.description = description;
    if (category) cause.category = category;
    if (icon) cause.icon = icon;
    if (color) cause.color = color;
    if (isActive !== undefined) cause.isActive = isActive;

    await cause.save();
    res.json(cause.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cause' });
  }
});

// Support a cause
router.post('/:id/support', requireAuth, async (req, res) => {
  try {
    const { interval = 1 } = req.body; // Default: every step

    const cause = await Cause.findById(req.params.id);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }

    await cause.addSupporter(req.session.userId);

    const user = await User.findById(req.session.userId);
    await user.supportCause(cause.id, interval);

    res.json({
      message: 'Cause supported successfully',
      cause: cause.toJSON()
    });
  } catch (error) {
    console.error('Support cause error:', error);
    res.status(500).json({ error: 'Failed to support cause' });
  }
});

// Unsupport a cause
router.post('/:id/unsupport', requireAuth, async (req, res) => {
  try {
    const cause = await Cause.findById(req.params.id);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }

    await cause.removeSupporter(req.session.userId);

    const user = await User.findById(req.session.userId);
    await user.unsupportCause(cause.id);

    res.json({
      message: 'Cause unsupported successfully',
      cause: cause.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsupport cause' });
  }
});

// Update step distribution for a cause
router.put('/:id/distribution', requireAuth, async (req, res) => {
  try {
    const { interval } = req.body;

    if (!interval || interval < 1) {
      return res.status(400).json({ error: 'Invalid interval' });
    }

    const user = await User.findById(req.session.userId);
    await user.updateStepDistribution(req.params.id, interval);

    res.json({
      message: 'Step distribution updated',
      stepDistribution: user.stepDistribution
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update step distribution' });
  }
});

// Delete a cause
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const cause = await Cause.findById(req.params.id);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }

    // Only creator can delete
    if (cause.createdBy !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this cause' });
    }

    await cause.delete();
    res.json({ message: 'Cause deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cause' });
  }
});

export default router;
