const EventEmitter = require('events');

class CoDeiAI extends EventEmitter {
  constructor() {
    super();
    this.studentProfile = {
      weaknesses: [],
      strengths: [],
      hintLevel: 1, // 1=conceptual, 2=algorithmic, 3=pseudocode
      personality: 'mentor', // sarcastic, fun, mentor, grade-level
      sessionHistory: []
    };
    
    this.personalities = {
      mentor: {
        tone: 'encouraging',
        style: 'patient and supportive',
        responses: {
          conceptual: "Let's think about this step by step. What do you understand about the problem?",
          algorithmic: "Great! Now let's break this down into smaller steps. What would be your first approach?",
          pseudocode: "Excellent progress! Let's structure this with some pseudocode to organize your thoughts."
        }
      },
      sarcastic: {
        tone: 'playfully sarcastic',
        style: 'witty but helpful',
        responses: {
          conceptual: "Oh, so you want to solve this the hard way? Let's start with the basics...",
          algorithmic: "Finally! Now we're getting somewhere. What's your brilliant algorithm?",
          pseudocode: "Look at you, thinking like a real programmer! Let's structure this properly."
        }
      },
      fun: {
        tone: 'enthusiastic',
        style: 'energetic and playful',
        responses: {
          conceptual: "🎉 Time to solve this puzzle! What's your first thought?",
          algorithmic: "🚀 Awesome! Let's break this down into fun steps!",
          pseudocode: "🎯 You're on fire! Let's organize this into neat pseudocode!"
        }
      },
      'grade-level': {
        tone: 'educational',
        style: 'structured and clear',
        responses: {
          conceptual: "Let's analyze this problem systematically. What are the key concepts?",
          algorithmic: "Good! Now let's develop a step-by-step approach.",
          pseudocode: "Perfect! Let's translate this into structured pseudocode."
        }
      }
    };
  }

  analyzeCode(code, filePath, context = {}) {
    const analysis = {
      hasIssues: false,
      issues: [],
      suggestions: [],
      complexity: 'unknown',
      language: this.detectLanguage(filePath),
      concepts: []
    };

    // Basic code analysis
    if (this.studentProfile.language !== analysis.language) {
      analysis.hasIssues = true;
      analysis.issues.push({
        type: 'language_mismatch',
        message: `You're working in ${analysis.language}, but we've been focusing on ${this.studentProfile.language || 'programming fundamentals'}`,
        severity: 'low'
      });
    }

    // Detect common patterns and issues
    if (code.includes('console.log') && analysis.language === 'javascript') {
      analysis.concepts.push('debugging');
    }

    if (code.includes('for') || code.includes('while')) {
      analysis.concepts.push('loops');
    }

    if (code.includes('if') || code.includes('else')) {
      analysis.concepts.push('conditionals');
    }

    // Detect potential issues
    if (code.length > 1000 && !code.includes('function') && !code.includes('class')) {
      analysis.hasIssues = true;
      analysis.issues.push({
        type: 'code_organization',
        message: 'This code is getting quite long. Consider breaking it into functions.',
        severity: 'medium'
      });
    }

    return analysis;
  }

  generateHint(context) {
    const personality = this.personalities[this.studentProfile.personality];
    const hintLevel = this.determineHintLevel(context);
    
    let hint = {
      level: hintLevel,
      message: '',
      type: 'guidance',
      timestamp: new Date(),
      context: context
    };

    switch (hintLevel) {
      case 1: // Conceptual
        hint.message = personality.responses.conceptual;
        hint.message += this.getConceptualGuidance(context);
        break;
        
      case 2: // Algorithmic
        hint.message = personality.responses.algorithmic;
        hint.message += this.getAlgorithmicGuidance(context);
        break;
        
      case 3: // Pseudocode
        hint.message = personality.responses.pseudocode;
        hint.message += this.getPseudocodeGuidance(context);
        break;
    }

    // Track this interaction
    this.studentProfile.sessionHistory.push({
      timestamp: new Date(),
      hintLevel: hintLevel,
      context: context,
      response: hint.message
    });

    return hint;
  }

  determineHintLevel(context) {
    // Adaptive hint level based on student progress
    if (context.issues && context.issues.length > 0) {
      const hasComplexIssues = context.issues.some(issue => issue.severity === 'high');
      if (hasComplexIssues) {
        return 1; // Start with conceptual
      }
    }

    // If student has been struggling with same concept
    const recentHistory = this.studentProfile.sessionHistory.slice(-5);
    const conceptualCount = recentHistory.filter(h => h.hintLevel === 1).length;
    
    if (conceptualCount >= 2) {
      return 2; // Move to algorithmic
    }
    
    if (recentHistory.length >= 3 && recentHistory.every(h => h.hintLevel >= 2)) {
      return 3; // Move to pseudocode
    }

    return this.studentProfile.hintLevel;
  }

  getConceptualGuidance(context) {
    const language = context.language || 'programming';
    const concepts = context.concepts || [];
    
    if (concepts.includes('loops')) {
      return " Think about what you're trying to repeat and what conditions should stop the repetition.";
    }
    
    if (concepts.includes('conditionals')) {
      return " Consider what different scenarios you need to handle and what decisions your code should make.";
    }
    
    return " What is the core problem you're trying to solve? Break it down into the simplest possible terms.";
  }

  getAlgorithmicGuidance(context) {
    const language = context.language || 'programming';
    
    return ` Here's a structured approach:
1. Identify your inputs and expected outputs
2. Break the problem into smaller sub-problems
3. Consider edge cases
4. Think about the order of operations`;
  }

  getPseudocodeGuidance(context) {
    const language = context.language || 'programming';
    
    return ` Let's structure this:
BEGIN
  // Define your variables
  // Set up your main logic
  // Handle edge cases
  // Return your result
END`;
  }

  detectLanguage(filePath) {
    const ext = require('path').extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    return languageMap[ext] || 'unknown';
  }

  updateStudentProfile(interaction) {
    // Track student progress and adapt
    if (interaction.type === 'struggle') {
      this.studentProfile.weaknesses.push(interaction.concept);
    }
    
    if (interaction.type === 'success') {
      this.studentProfile.strengths.push(interaction.concept);
    }
  }

  setPersonality(personality) {
    if (this.personalities[personality]) {
      this.studentProfile.personality = personality;
      return true;
    }
    return false;
  }

  getStudentProfile() {
    return {
      ...this.studentProfile,
      sessionCount: this.studentProfile.sessionHistory.length,
      averageHintLevel: this.calculateAverageHintLevel()
    };
  }

  calculateAverageHintLevel() {
    if (this.studentProfile.sessionHistory.length === 0) return 1;
    
    const sum = this.studentProfile.sessionHistory.reduce((acc, session) => acc + session.hintLevel, 0);
    return sum / this.studentProfile.sessionHistory.length;
  }
}

module.exports = CoDeiAI;
