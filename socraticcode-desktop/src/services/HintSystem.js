const EventEmitter = require('events');

class HintSystem extends EventEmitter {
  constructor() {
    super();
    this.hintDatabase = this.initializeHintDatabase();
    this.userProgress = new Map();
    this.contextHistory = [];
  }

  generateHint(context) {
    const hint = this.analyzeContext(context);
    
    if (hint) {
      this.contextHistory.push({
        context,
        hint,
        timestamp: Date.now()
      });
      
      // Keep only last 50 interactions
      if (this.contextHistory.length > 50) {
        this.contextHistory.shift();
      }
    }
    
    return hint;
  }

  generateContextualHint(pattern) {
    const context = this.buildContextFromPattern(pattern);
    return this.generateHint(context);
  }

  analyzeContext(context) {
    const hints = [];

    // Analyze code issues
    if (context.analysis && context.analysis.hasIssues) {
      hints.push(this.generateCodeHint(context.analysis));
    }

    // Analyze keystroke patterns
    if (context.keystrokePattern) {
      hints.push(this.generateKeystrokeHint(context.keystrokePattern));
    }

    // Analyze learning patterns
    if (context.learningPattern) {
      hints.push(this.generateLearningHint(context.learningPattern));
    }

    // Return the most relevant hint
    return this.selectBestHint(hints);
  }

  generateCodeHint(analysis) {
    const criticalIssues = analysis.issues.filter(issue => issue.severity === 'high');
    const mediumIssues = analysis.issues.filter(issue => issue.severity === 'medium');

    if (criticalIssues.length > 0) {
      return {
        level: 1,
        type: 'critical_code_issue',
        title: 'Critical Issue Detected',
        message: `I noticed a critical issue in your code: ${criticalIssues[0].message}`,
        suggestion: this.getCodeSuggestion(criticalIssues[0]),
        action: 'fix_immediately',
        priority: 'high'
      };
    }

    if (mediumIssues.length > 0) {
      return {
        level: 2,
        type: 'code_improvement',
        title: 'Code Improvement Opportunity',
        message: `Here's a suggestion to improve your code: ${mediumIssues[0].message}`,
        suggestion: this.getCodeSuggestion(mediumIssues[0]),
        action: 'consider_improvement',
        priority: 'medium'
      };
    }

    return null;
  }

  generateKeystrokeHint(pattern) {
    if (pattern.type === 'hesitation') {
      return {
        level: 1,
        type: 'typing_assistance',
        title: 'Need Help?',
        message: 'I notice you\'re making frequent corrections. Would you like a hint about what you\'re working on?',
        suggestion: 'Take a moment to think about the problem. Sometimes stepping back helps!',
        action: 'offer_help',
        priority: 'medium'
      };
    }

    if (pattern.type === 'syntax_error') {
      return {
        level: 2,
        type: 'syntax_help',
        title: 'Syntax Issue',
        message: pattern.description,
        suggestion: 'Check your brackets, parentheses, and semicolons carefully.',
        action: 'check_syntax',
        priority: 'high'
      };
    }

    if (pattern.type === 'algorithm_implementation') {
      return {
        level: 3,
        type: 'algorithm_guidance',
        title: 'Algorithm Implementation',
        message: pattern.description,
        suggestion: 'Consider the time and space complexity of your approach.',
        action: 'think_algorithm',
        priority: 'low'
      };
    }

    return null;
  }

  generateLearningHint(pattern) {
    return {
      level: 2,
      type: 'learning_opportunity',
      title: 'Learning Moment',
      message: 'This is a great opportunity to learn about a new concept!',
      suggestion: 'Would you like me to explain the underlying principles?',
      action: 'explain_concept',
      priority: 'low'
    };
  }

  selectBestHint(hints) {
    if (hints.length === 0) return null;

    // Sort by priority and level
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    
    hints.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.level - b.level; // Lower level hints are more important
    });

    return hints[0];
  }

  getCodeSuggestion(issue) {
    const suggestions = {
      'common_mistake': 'This is a common mistake that many developers make. Consider reviewing best practices for your language.',
      'complexity': 'Try breaking this into smaller functions. Each function should do one thing well.',
      'line_length': 'Long lines can be hard to read. Consider breaking them up or using variables.',
      'syntax_error': 'Double-check your syntax. Missing brackets or semicolons are common issues.',
      'best_practice': 'Great job following best practices! Keep it up!'
    };

    return suggestions[issue.type] || 'Consider reviewing this part of your code.';
  }

  buildContextFromPattern(pattern) {
    return {
      keystrokePattern: pattern,
      timestamp: Date.now(),
      context: 'keystroke_analysis'
    };
  }

  initializeHintDatabase() {
    return {
      commonMistakes: {
        javascript: [
          {
            pattern: 'var instead of let/const',
            hint: 'Consider using let or const instead of var for better scoping.',
            level: 2
          },
          {
            pattern: '== instead of ===',
            hint: 'Use === for strict equality comparison to avoid type coercion.',
            level: 2
          },
          {
            pattern: 'missing semicolon',
            hint: 'While JavaScript has automatic semicolon insertion, it\'s good practice to include them.',
            level: 1
          }
        ],
        python: [
          {
            pattern: '== None instead of is None',
            hint: 'Use "is None" instead of "== None" for identity comparison.',
            level: 2
          },
          {
            pattern: 'range(len()) instead of enumerate',
            hint: 'Use enumerate() instead of range(len()) for better readability.',
            level: 2
          }
        ]
      },
      learningOpportunities: [
        {
          concept: 'recursion',
          hint: 'Recursion can be elegant but watch out for stack overflow with large inputs.',
          level: 3
        },
        {
          concept: 'time_complexity',
          hint: 'Consider the time complexity of your algorithm. Can you make it more efficient?',
          level: 3
        },
        {
          concept: 'data_structures',
          hint: 'Choosing the right data structure can make your code much more efficient.',
          level: 2
        }
      ]
    };
  }

  getUserProgress(userId) {
    return this.userProgress.get(userId) || {
      hintsReceived: 0,
      issuesFixed: 0,
      learningLevel: 1,
      preferredHintLevel: 2
    };
  }

  updateUserProgress(userId, hint) {
    const progress = this.getUserProgress(userId);
    progress.hintsReceived++;
    
    if (hint.action === 'fix_immediately') {
      progress.issuesFixed++;
    }
    
    this.userProgress.set(userId, progress);
  }

  getAdaptiveHintLevel(userId) {
    const progress = this.getUserProgress(userId);
    
    // Adapt hint level based on user progress
    if (progress.hintsReceived > 20 && progress.issuesFixed > 5) {
      return Math.min(progress.preferredHintLevel + 1, 3);
    }
    
    return progress.preferredHintLevel;
  }
}

module.exports = HintSystem;

