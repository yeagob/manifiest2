import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import MessageService from '../services/MessageService.js';

const router = express.Router();

// Get messages for a cause
router.get('/cause/:causeId', async (req, res) => {
  try {
    const messages = await MessageService.getByCause(req.params.causeId);
    res.json(messages.map(m => m.toJSON()));
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get most liked messages for a cause
router.get('/cause/:causeId/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const messages = await MessageService.getMostLiked(req.params.causeId, limit);
    res.json(messages.map(m => m.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top messages' });
  }
});

// Get user's messages
router.get('/user/:userId', async (req, res) => {
  try {
    const messages = await MessageService.getByUser(req.params.userId);
    res.json(messages.map(m => m.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user messages' });
  }
});

// Create a new message/placard
router.post('/', requireAuth, async (req, res) => {
  try {
    const { causeId, message, type } = req.body;

    if (!causeId || !message) {
      return res.status(400).json({ error: 'Cause ID and message are required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message is too long (max 500 characters)' });
    }

    const newMessage = await MessageService.createMessage(req.userId, {
      causeId,
      message,
      type
    });

    res.status(201).json(newMessage.toJSON());
  } catch (error) {
    console.error('Create message error:', error);
    if (error.message === 'Cause not found') return res.status(404).json({ error: 'Cause not found' });
    if (error.message === 'User not found') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Like a message
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const message = await MessageService.likeMessage(req.userId, req.params.id);
    res.json(message.toJSON());
  } catch (error) {
    if (error.message === 'Message not found') return res.status(404).json({ error: 'Message not found' });
    res.status(500).json({ error: 'Failed to like message' });
  }
});

// Unlike a message
router.delete('/:id/like', requireAuth, async (req, res) => {
  try {
    const message = await MessageService.unlikeMessage(req.userId, req.params.id);
    res.json(message.toJSON());
  } catch (error) {
    if (error.message === 'Message not found') return res.status(404).json({ error: 'Message not found' });
    res.status(500).json({ error: 'Failed to unlike message' });
  }
});

// Delete a message (only by creator)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await MessageService.deleteMessage(req.userId, req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    if (error.message === 'Message not found') return res.status(404).json({ error: 'Message not found' });
    if (error.message === 'Not authorized') return res.status(403).json({ error: 'Not authorized' });
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
