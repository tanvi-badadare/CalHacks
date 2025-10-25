const EventEmitter = require('events');

class KeystrokeMonitor extends EventEmitter {
  constructor() {
    super();
    this.isMonitoring = false;
    this.keystrokeBuffer = [];
    this.bufferSize = 50; // Keep last 50 keystrokes
    this.patternDetector = new PatternDetector();
  }

  async startMonitoring() {
    try {
      console.log('Starting keystroke monitoring...');
      
      // Note: Actual keystroke monitoring requires platform-specific implementations
      // For now, we'll simulate the monitoring for demonstration
      this.isMonitoring = true;
      
      // In a real implementation, you would:
      // 1. Use platform-specific libraries (like robotjs, ioHook, etc.)
      // 2. Handle permissions properly
      // 3. Implement proper security measures
      
      console.log('Keystroke monitoring started (simulated)');
      return true;
    } catch (error) {
      console.error('Failed to start keystroke monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    this.keystrokeBuffer = [];
    console.log('Keystroke monitoring stopped');
  }

  // Simulate keystroke capture (in real implementation, this would be called by platform-specific code)
  captureKeystroke(key, modifiers = {}) {
    if (!this.isMonitoring) return;

    const keystroke = {
      key,
      modifiers,
      timestamp: Date.now(),
      application: this.getCurrentApplication()
    };

    this.keystrokeBuffer.push(keystroke);
    
    // Keep buffer size manageable
    if (this.keystrokeBuffer.length > this.bufferSize) {
      this.keystrokeBuffer.shift();
    }

    // Detect patterns
    const patterns = this.patternDetector.detectPatterns(this.keystrokeBuffer);
    
    if (patterns.length > 0) {
      this.emit('keystrokePattern', {
        patterns,
        context: this.getTypingContext(),
        recentKeystrokes: this.keystrokeBuffer.slice(-10)
      });
    }
  }

  getCurrentApplication() {
    // In a real implementation, this would detect the current active application
    return 'unknown';
  }

  getTypingContext() {
    const recent = this.keystrokeBuffer.slice(-20);
    
    return {
      typingSpeed: this.calculateTypingSpeed(recent),
      commonMistakes: this.detectCommonMistakes(recent),
      codingPatterns: this.detectCodingPatterns(recent),
      pausePatterns: this.detectPausePatterns(recent)
    };
  }

  calculateTypingSpeed(keystrokes) {
    if (keystrokes.length < 2) return 0;
    
    const timeSpan = keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp;
    const minutes = timeSpan / (1000 * 60);
    
    return keystrokes.length / minutes;
  }

  detectCommonMistakes(keystrokes) {
    const mistakes = [];
    
    // Look for backspace patterns that might indicate mistakes
    let backspaceCount = 0;
    for (let i = 0; i < keystrokes.length; i++) {
      if (keystrokes[i].key === 'Backspace') {
        backspaceCount++;
      } else if (backspaceCount > 0) {
        if (backspaceCount > 3) {
          mistakes.push({
            type: 'excessive_backspace',
            count: backspaceCount,
            timestamp: keystrokes[i].timestamp
          });
        }
        backspaceCount = 0;
      }
    }
    
    return mistakes;
  }

  detectCodingPatterns(keystrokes) {
    const patterns = [];
    const keys = keystrokes.map(k => k.key);
    const keyString = keys.join('');
    
    // Detect common coding patterns
    if (keyString.includes('function') || keyString.includes('def ')) {
      patterns.push('function_definition');
    }
    
    if (keyString.includes('for(') || keyString.includes('for ')) {
      patterns.push('loop_construction');
    }
    
    if (keyString.includes('if(') || keyString.includes('if ')) {
      patterns.push('conditional_statement');
    }
    
    return patterns;
  }

  detectPausePatterns(keystrokes) {
    const pauses = [];
    
    for (let i = 1; i < keystrokes.length; i++) {
      const timeDiff = keystrokes[i].timestamp - keystrokes[i - 1].timestamp;
      
      if (timeDiff > 2000) { // Pause longer than 2 seconds
        pauses.push({
          duration: timeDiff,
          timestamp: keystrokes[i].timestamp,
          beforeKey: keystrokes[i - 1].key,
          afterKey: keystrokes[i].key
        });
      }
    }
    
    return pauses;
  }

  getMonitoringStatus() {
    return {
      isActive: this.isMonitoring,
      bufferSize: this.keystrokeBuffer.length,
      recentPatterns: this.patternDetector.getRecentPatterns()
    };
  }
}

class PatternDetector {
  constructor() {
    this.recentPatterns = [];
  }

  detectPatterns(keystrokes) {
    const patterns = [];
    
    // Detect hesitation patterns (frequent backspaces)
    const hesitationPattern = this.detectHesitationPattern(keystrokes);
    if (hesitationPattern) {
      patterns.push(hesitationPattern);
    }
    
    // Detect syntax error patterns
    const syntaxPattern = this.detectSyntaxErrorPattern(keystrokes);
    if (syntaxPattern) {
      patterns.push(syntaxPattern);
    }
    
    // Detect learning opportunity patterns
    const learningPattern = this.detectLearningPattern(keystrokes);
    if (learningPattern) {
      patterns.push(learningPattern);
    }
    
    this.recentPatterns = patterns;
    return patterns;
  }

  detectHesitationPattern(keystrokes) {
    const recent = keystrokes.slice(-10);
    const backspaceCount = recent.filter(k => k.key === 'Backspace').length;
    
    if (backspaceCount > 3) {
      return {
        type: 'hesitation',
        confidence: Math.min(backspaceCount / 10, 1),
        description: 'Student seems to be struggling with typing or syntax'
      };
    }
    
    return null;
  }

  detectSyntaxErrorPattern(keystrokes) {
    const recent = keystrokes.slice(-20);
    const keys = recent.map(k => k.key);
    
    // Look for common syntax error patterns
    if (keys.includes('(') && !keys.includes(')')) {
      return {
        type: 'syntax_error',
        confidence: 0.8,
        description: 'Missing closing parenthesis detected'
      };
    }
    
    if (keys.includes('{') && !keys.includes('}')) {
      return {
        type: 'syntax_error',
        confidence: 0.8,
        description: 'Missing closing brace detected'
      };
    }
    
    return null;
  }

  detectLearningPattern(keystrokes) {
    const recent = keystrokes.slice(-30);
    const keys = recent.map(k => k.key);
    const keyString = keys.join('');
    
    // Detect when student is trying to implement common algorithms
    if (keyString.includes('for') && keyString.includes('if')) {
      return {
        type: 'algorithm_implementation',
        confidence: 0.7,
        description: 'Student appears to be implementing an algorithm'
      };
    }
    
    return null;
  }

  getRecentPatterns() {
    return this.recentPatterns;
  }
}

module.exports = KeystrokeMonitor;

