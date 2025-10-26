const EventEmitter = require('events');

/**
 * Smart Hint Engine - Analyzes user behavior and provides hints ONLY when needed
 * 
 * Triggers hints when:
 * - User pauses for 15+ seconds (stuck/thinking)
 * - No code progress for 30+ seconds
 * - Frequent code deletions (trying different approaches)
 * - Error patterns detected
 */
class SmartHintEngine extends EventEmitter {
  constructor() {
    super();
    
    this.codeHistory = [];
    this.lastCodeSnapshot = '';
    this.lastChangeTime = Date.now();
    this.lastHintTime = 0;
    this.hintCooldown = 60000; // 1 minute between hints (not overwhelming)
    
    this.behaviorPatterns = {
      pauseThreshold: 15000,      // 15 seconds no typing = thinking/stuck
      noProgressThreshold: 30000,  // 30 seconds no progress = stuck
      frequentDeletions: 0,        // Track backspacing
      errorCount: 0
    };
    
    this.currentContext = {
      topic: '',
      question: '',
      code: '',
      difficulty: 'medium'
    };
  }
  
  /**
   * Update current code snapshot from screen
   */
  updateCodeSnapshot(codeText) {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastChangeTime;
    
    // Detect if code actually changed
    const codeChanged = codeText !== this.lastCodeSnapshot;
    
    if (codeChanged) {
      // Track deletion patterns (code getting shorter = struggling)
      if (codeText.length < this.lastCodeSnapshot.length) {
        this.behaviorPatterns.frequentDeletions++;
      }
      
      // Store in history
      this.codeHistory.push({
        code: codeText,
        timestamp: now,
        length: codeText.length
      });
      
      // Keep only last 20 snapshots
      if (this.codeHistory.length > 20) {
        this.codeHistory.shift();
      }
      
      this.lastCodeSnapshot = codeText;
      this.lastChangeTime = now;
      
      this.safeLog('📝 Code changed, length:', codeText.length);
    } else {
      // No change detected
      const pauseDuration = now - this.lastChangeTime;
      
      // Check if user is stuck (long pause)
      if (pauseDuration > this.behaviorPatterns.pauseThreshold) {
        this.safeLog('⏸️  User paused for', Math.floor(pauseDuration/1000), 'seconds');
        this.checkIfStuck(pauseDuration);
      }
    }
  }
  
  /**
   * Update current problem context
   */
  updateContext(topic, question, code = '') {
    this.currentContext = { topic, question, code };
    this.safeLog('🎯 Context updated:', { topic, question: question.substring(0, 50) + '...' });
  }
  
  /**
   * Check if user is stuck and needs a hint
   */
  checkIfStuck(pauseDuration) {
    const now = Date.now();
    const timeSinceLastHint = now - this.lastHintTime;
    
    // Don't spam hints (1 minute cooldown)
    if (timeSinceLastHint < this.hintCooldown) {
      this.safeLog('🚫 Hint on cooldown, waiting...');
      return;
    }
    
    // Analyze behavior patterns
    const isStuck = this.analyzeStuckPatterns(pauseDuration);
    
    if (isStuck) {
      this.safeLog('🆘 User appears stuck! Offering hint...');
      this.lastHintTime = now;
      
      this.emit('user-stuck', {
        reason: isStuck.reason,
        severity: isStuck.severity, // 'gentle', 'moderate', 'urgent'
        context: this.currentContext,
        codeSnapshot: this.lastCodeSnapshot
      });
    }
  }
  
  /**
   * Analyze patterns to determine if user is stuck
   */
  analyzeStuckPatterns(pauseDuration) {
    const patterns = [];
    
    // Pattern 1: Long pause (15+ seconds)
    if (pauseDuration >= this.behaviorPatterns.pauseThreshold) {
      patterns.push({
        type: 'long_pause',
        severity: pauseDuration > 30000 ? 'urgent' : 'moderate',
        message: 'User paused for a while'
      });
    }
    
    // Pattern 2: Frequent deletions (trying multiple approaches)
    if (this.behaviorPatterns.frequentDeletions >= 3) {
      patterns.push({
        type: 'frequent_deletions',
        severity: 'moderate',
        message: 'User keeps deleting code - might be stuck on approach'
      });
      this.behaviorPatterns.frequentDeletions = 0; // Reset
    }
    
    // Pattern 3: No progress (code length not increasing)
    const recentSnapshots = this.codeHistory.slice(-5);
    if (recentSnapshots.length >= 5) {
      const lengths = recentSnapshots.map(s => s.length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
      
      if (variance < 10) { // Very low variance = no progress
        patterns.push({
          type: 'no_progress',
          severity: 'gentle',
          message: 'Code length not changing - might need direction'
        });
      }
    }
    
    // Determine overall stuck state
    if (patterns.length === 0) return null;
    
    // Choose highest severity pattern
    const severities = ['gentle', 'moderate', 'urgent'];
    patterns.sort((a, b) => severities.indexOf(b.severity) - severities.indexOf(a.severity));
    
    return {
      reason: patterns[0].type,
      severity: patterns[0].severity,
      patterns: patterns
    };
  }
  
  /**
   * Manual hint request from user
   */
  requestHint() {
    this.safeLog('🙋 User manually requested hint');
    this.lastHintTime = Date.now();
    
    this.emit('hint-requested', {
      context: this.currentContext,
      codeSnapshot: this.lastCodeSnapshot,
      manual: true
    });
  }
  
  /**
   * Reset hint cooldown (e.g., when starting new problem)
   */
  reset() {
    this.codeHistory = [];
    this.lastCodeSnapshot = '';
    this.lastChangeTime = Date.now();
    this.lastHintTime = 0;
    this.behaviorPatterns.frequentDeletions = 0;
    this.safeLog('🔄 Smart Hint Engine reset');
  }
  
  safeLog(...args) {
    try {
      console.log(...args);
    } catch (e) {
      // Silently ignore EIO errors
    }
  }
}

module.exports = SmartHintEngine;

