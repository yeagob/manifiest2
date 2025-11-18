import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import aiService from '../services/aiService.js';
import Cause from '../models/Cause.js';

const router = express.Router();

/**
 * POST /api/ai/check-similar-cause
 * Check if a proposed cause is similar to existing causes
 * Requires authentication
 */
router.post('/check-similar-cause', requireAuth, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({
        error: 'Title and description are required'
      });
    }

    // Get all existing causes
    const existingCauses = await Cause.findAll();

    // Skip AI check if no existing causes
    if (existingCauses.length === 0) {
      return res.json({
        enabled: true,
        isSimilar: false,
        confidence: 100,
        reason: 'No hay causas existentes aún',
        suggestion: 'Sé el primero en crear esta causa'
      });
    }

    // Prepare proposed cause data
    const proposedCause = {
      title: title.trim(),
      description: description.trim(),
      category: category || 'other'
    };

    // Get AI analysis
    const analysis = await aiService.checkSimilarCause(proposedCause, existingCauses);

    // If a similar cause was found, enrich with full cause data
    if (analysis.isSimilar && analysis.matchedCauseId) {
      const matchedCause = await Cause.findById(analysis.matchedCauseId);
      if (matchedCause) {
        analysis.matchedCause = {
          id: matchedCause.id,
          title: matchedCause.title,
          description: matchedCause.description,
          category: matchedCause.category,
          icon: matchedCause.icon,
          color: matchedCause.color,
          supporters: matchedCause.supporters?.length || 0,
          totalSteps: matchedCause.totalSteps || 0
        };
      }
    }

    res.json(analysis);
  } catch (error) {
    console.error('AI check error:', error);
    res.status(500).json({
      error: 'Failed to check cause similarity',
      details: error.message,
      enabled: false,
      isSimilar: false
    });
  }
});

/**
 * GET /api/ai/status
 * Check if AI service is enabled and working
 */
router.get('/status', async (req, res) => {
  res.json({
    enabled: aiService.enabled,
    model: aiService.enabled ? 'gemini-1.5-flash' : null,
    status: aiService.enabled ? 'ready' : 'disabled',
    message: aiService.enabled
      ? 'AI service is ready'
      : 'AI service disabled (GEMINI_API_KEY not set)'
  });
});

export default router;
