import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Step from '../models/Step.js';
import User from '../models/User.js';
import Cause from '../models/Cause.js';

const router = express.Router();

// Record steps
router.post('/', requireAuth, async (req, res) => {
  try {
    const { steps } = req.body;

    if (!steps || steps < 1) {
      return res.status(400).json({ error: 'Invalid step count' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Distribute steps to causes based on user's configuration
    const distribution = await distributeSteps(user, steps);

    // Record steps for each cause
    const stepRecords = [];
    for (const [causeId, stepCount] of Object.entries(distribution)) {
      if (stepCount > 0) {
        const stepRecord = await Step.create({
          userId: user.id,
          causeId,
          steps: stepCount
        });
        stepRecords.push(stepRecord.toJSON());

        // Update cause total
        const cause = await Cause.findById(causeId);
        if (cause) {
          await cause.addSteps(stepCount);
        }
      }
    }

    // Update user total
    await user.addSteps(steps);

    res.json({
      message: 'Steps recorded successfully',
      totalSteps: steps,
      distribution: distribution,
      records: stepRecords,
      userTotalSteps: user.totalSteps
    });
  } catch (error) {
    console.error('Record steps error:', error);
    res.status(500).json({ error: 'Failed to record steps' });
  }
});

// Helper function to distribute steps across causes
async function distributeSteps(user, totalSteps) {
  const distribution = {};
  const causes = Object.keys(user.stepDistribution);

  if (causes.length === 0) {
    return distribution;
  }

  // Initialize distribution
  causes.forEach(causeId => {
    distribution[causeId] = 0;
  });

  // Distribute steps based on intervals
  for (let i = 0; i < totalSteps; i++) {
    for (const causeId of causes) {
      const config = user.stepDistribution[causeId];
      if ((i + 1) % config.interval === 0) {
        distribution[causeId]++;
      }
    }
  }

  return distribution;
}

// Get user's step history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const steps = await Step.findByUser(req.session.userId);
    res.json(steps.map(s => s.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch step history' });
  }
});

// Get user's steps for a specific cause
router.get('/cause/:causeId', requireAuth, async (req, res) => {
  try {
    const stats = await Step.getUserStatsForCause(req.session.userId, req.params.causeId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cause steps' });
  }
});

// Get total steps by date
router.get('/daily/:date', requireAuth, async (req, res) => {
  try {
    const steps = await Step.findByDate(req.params.date);
    const userSteps = steps.filter(s => s.userId === req.session.userId);
    const total = userSteps.reduce((sum, s) => sum + s.steps, 0);

    res.json({
      date: req.params.date,
      totalSteps: total,
      records: userSteps.map(s => s.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily steps' });
  }
});

// Get user stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const steps = await Step.findByUser(req.session.userId);

    // Group by cause
    const byCause = {};
    for (const step of steps) {
      if (!byCause[step.causeId]) {
        byCause[step.causeId] = 0;
      }
      byCause[step.causeId] += step.steps;
    }

    // Get cause details
    const causeStats = [];
    for (const [causeId, stepCount] of Object.entries(byCause)) {
      const cause = await Cause.findById(causeId);
      if (cause) {
        causeStats.push({
          cause: cause.toJSON(),
          steps: stepCount
        });
      }
    }

    res.json({
      totalSteps: user.totalSteps,
      causesSupported: user.causesSupported.length,
      stepDistribution: user.stepDistribution,
      causeStats: causeStats.sort((a, b) => b.steps - a.steps)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
