const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  currentHintLevel: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  hintsUsed: [{
    level: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  userAttempts: [{
    code: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isCorrect: Boolean
  }],
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Session', SessionSchema);
