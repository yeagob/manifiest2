import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import CauseService from '../services/CauseService.js';

const router = express.Router();

// Get all active causes
router.get('/', optionalAuth, async (req, res) => {
  try {
    const causes = await CauseService.getAllActive();
    // Sorting is already done in service if needed, but let's do it here to match previous behavior
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
    const causes = await CauseService.getMostActive(limit);
    res.json(causes.map(c => c.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch most active causes' });
  }
});

// Get a single cause
router.get('/:id', async (req, res) => {
  try {
    const cause = await CauseService.getById(req.params.id);
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

    const cause = await CauseService.createCause(req.userId, {
      title,
      description,
      category,
      icon,
      color
    });

    res.status(201).json(cause.toJSON());
  } catch (error) {
    console.error('Create cause error:', error);
    res.status(500).json({ error: 'Failed to create cause' });
  }
});

// Update a cause
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const cause = await CauseService.updateCause(req.userId, req.params.id, req.body);
    res.json(cause.toJSON());
  } catch (error) {
    if (error.message === 'Cause not found') return res.status(404).json({ error: 'Cause not found' });
    if (error.message === 'Not authorized') return res.status(403).json({ error: 'Not authorized' });
    res.status(500).json({ error: 'Failed to update cause' });
  }
});

// Support a cause
router.post('/:id/support', requireAuth, async (req, res) => {
  try {
    const { interval = 1 } = req.body;
    const cause = await CauseService.supportCause(req.userId, req.params.id, interval);

    res.json({
      message: 'Cause supported successfully',
      cause: cause.toJSON()
    });
  } catch (error) {
    if (error.message === 'Cause not found') return res.status(404).json({ error: 'Cause not found' });
    console.error('Support cause error:', error);
    res.status(500).json({ error: 'Failed to support cause' });
  }
});

// Unsupport a cause
router.post('/:id/unsupport', requireAuth, async (req, res) => {
  try {
    const cause = await CauseService.unsupportCause(req.userId, req.params.id);

    res.json({
      message: 'Cause unsupported successfully',
      cause: cause.toJSON()
    });
  } catch (error) {
    if (error.message === 'Cause not found') return res.status(404).json({ error: 'Cause not found' });
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

    const distribution = await CauseService.updateDistribution(req.userId, req.params.id, interval);

    res.json({
      message: 'Step distribution updated',
      stepDistribution: distribution
    });
  } catch (error) {
    if (error.message === 'User not found') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Failed to update step distribution' });
  }
});

// Delete a cause
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await CauseService.deleteCause(req.userId, req.params.id);
    res.json({ message: 'Cause deleted successfully' });
  } catch (error) {
    if (error.message === 'Cause not found') return res.status(404).json({ error: 'Cause not found' });
    if (error.message === 'Not authorized') return res.status(403).json({ error: 'Not authorized' });
    res.status(500).json({ error: 'Failed to delete cause' });
  }
});

// Get supporters with their steps for a cause
router.get('/:id/supporters-with-steps', async (req, res) => {
  try {
    const data = await CauseService.getSupportersWithSteps(req.params.id);
    res.json(data);
  } catch (error) {
    if (error.message === 'Cause not found') return res.status(404).json({ error: 'Cause not found' });
    console.error('Failed to get supporters with steps:', error);
    res.status(500).json({ error: 'Failed to fetch supporters data' });
  }
});

export default router;
