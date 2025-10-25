const express = require('express');
const Problem = require('../models/Problem');
const Session = require('../models/Session');
const router = express.Router();

// Get hint for a specific level
router.get('/:problemId/:level', async (req, res) => {
  try {
    const { problemId, level } = req.params;
    const hintLevel = parseInt(level);
    
    if (![1, 2, 3].includes(hintLevel)) {
      return res.status(400).json({ error: 'Invalid hint level. Must be 1, 2, or 3' });
    }
    
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    const hint = problem.hints[`level${hintLevel}`];
    res.json({ 
      level: hintLevel,
      hint: hint,
      message: `Level ${hintLevel} hint: ${hint}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all hints for a problem (for debugging/admin)
router.get('/:problemId', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    res.json(problem.hints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
