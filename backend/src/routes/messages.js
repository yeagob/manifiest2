import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Cause from '../models/Cause.js';

const router = express.Router();

// Get messages for a cause
router.get('/cause/:causeId', async (req, res) => {
  try {
    const messages = await Message.findByCause(req.params.causeId);
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
    const messages = await Message.getMostLikedByCause(req.params.causeId, limit);
    res.json(messages.map(m => m.toJSON()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top messages' });
  }
});

// Get user's messages
router.get('/user/:userId', async (req, res) => {
  try {
    const messages = await Message.findByUser(req.params.userId);
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

    // Verify cause exists
    const cause = await Cause.findById(causeId);
    if (!cause) {
      return res.status(404).json({ error: 'Cause not found' });
    }

    // Get user info
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create message
    const newMessage = await Message.create({
      causeId,
      userId: user.id,
      userName: user.name,
      userPicture: user.picture,
      message,
      type: type || 'placard'
    });

    res.status(201).json(newMessage.toJSON());
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Like a message
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.addLike(req.session.userId);
    res.json(message.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to like message' });
  }
});

// Unlike a message
router.delete('/:id/like', requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.removeLike(req.session.userId);
    res.json(message.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlike message' });
  }
});

// Delete a message (only by creator)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only creator can delete
    if (message.userId !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.delete();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
