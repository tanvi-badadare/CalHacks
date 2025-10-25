const express = require('express');
const Session = require('../models/Session');
const router = express.Router();

// Create a new session
router.post('/', async (req, res) => {
  try {
    const { problemId } = req.body;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = new Session({
      sessionId,
      problemId,
      currentHintLevel: 1
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId })
      .populate('problemId');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update session (record hint usage, attempts, etc.)
router.put('/:sessionId', async (req, res) => {
  try {
    const { hintLevel, userCode, isCorrect, completed } = req.body;
    
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Record hint usage
    if (hintLevel) {
      session.hintsUsed.push({ level: hintLevel });
      session.currentHintLevel = Math.max(session.currentHintLevel, hintLevel);
    }
    
    // Record user attempt
    if (userCode !== undefined) {
      session.userAttempts.push({ 
        code: userCode, 
        isCorrect: isCorrect || false 
      });
    }
    
    // Mark as completed
    if (completed) {
      session.completed = true;
      session.completedAt = new Date();
    }
    
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
