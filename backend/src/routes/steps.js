import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import StepService from '../services/StepService.js';

const router = express.Router();

// Record steps
router.post('/', requireAuth, async (req, res) => {
  try {
    const { steps } = req.body;

    if (!steps || steps < 1) {
      return res.status(400).json({ error: 'Invalid step count' });
    }

    const result = await StepService.recordSteps(req.userId, steps);
    res.json({
      message: 'Steps recorded successfully',
      ...result
    });
  } catch (error) {
    console.error('Record steps error:', error);
    if (error.message === 'User not found') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Failed to record steps' });
  }
});

// Get user's step history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const steps = await StepService.getHistory(req.userId);
    res.json(steps.map(s => s.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch step history' });
  }
});

// Get user's steps for a specific cause
router.get('/cause/:causeId', requireAuth, async (req, res) => {
  try {
    const stats = await StepService.getCauseStats(req.userId, req.params.causeId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cause steps' });
  }
});

// Get total steps by date
router.get('/daily/:date', requireAuth, async (req, res) => {
  try {
    const data = await StepService.getDailySteps(req.userId, req.params.date);
    res.json({
      ...data,
      records: data.records.map(s => s.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily steps' });
  }
});

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await StepService.getUserStats(req.userId);
    res.json({
      ...stats,
      causeStats: stats.causeStats.map(cs => ({
        cause: cs.cause.toJSON(),
        steps: cs.steps
      }))
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
