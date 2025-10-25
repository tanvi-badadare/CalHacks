const express = require('express');
const Problem = require('../models/Problem');
const router = express.Router();

// Get all problems
router.get('/', async (req, res) => {
  try {
    const { difficulty, language, category } = req.query;
    let query = {};
    
    if (difficulty) query.difficulty = difficulty;
    if (language) query.language = language;
    if (category) query.category = category;
    
    const problems = await Problem.find(query).select('-solution -hints');
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific problem
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select('-solution');
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new problem (admin only - for now)
router.post('/', async (req, res) => {
  try {
    const problem = new Problem(req.body);
    await problem.save();
    res.status(201).json(problem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
