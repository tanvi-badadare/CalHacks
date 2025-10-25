const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  language: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  hints: {
    level1: {
      type: String,
      required: true
    },
    level2: {
      type: String,
      required: true
    },
    level3: {
      type: String,
      required: true
    }
  },
  solution: {
    type: String,
    required: true
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Problem', ProblemSchema);
