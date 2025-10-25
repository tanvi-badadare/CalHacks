const EventEmitter = require('events');

class CodeAnalyzer extends EventEmitter {
  constructor() {
    super();
    this.analysisRules = this.initializeAnalysisRules();
    this.languageDetectors = this.initializeLanguageDetectors();
  }

  analyzeCode(code, filePath) {
    const language = this.detectLanguage(filePath, code);
    const analysis = {
      language,
      filePath,
      timestamp: Date.now(),
      hasIssues: false,
      issues: [],
      suggestions: [],
      complexity: this.calculateComplexity(code, language),
      patterns: this.detectPatterns(code, language)
    };

    // Run language-specific analysis
    const languageAnalysis = this.runLanguageAnalysis(code, language);
    analysis.issues.push(...languageAnalysis.issues);
    analysis.suggestions.push(...languageAnalysis.suggestions);

    // Run general analysis
    const generalAnalysis = this.runGeneralAnalysis(code);
    analysis.issues.push(...generalAnalysis.issues);
    analysis.suggestions.push(...generalAnalysis.suggestions);

    // Determine if there are significant issues
    analysis.hasIssues = analysis.issues.some(issue => issue.severity === 'high' || issue.severity === 'medium');

    return analysis;
  }

  detectLanguage(filePath, code) {
    const extension = filePath.split('.').pop().toLowerCase();
    
    // Check file extension first
    if (this.languageDetectors[extension]) {
      return this.languageDetectors[extension];
    }

    // Fallback to content analysis
    if (code.includes('function') && code.includes('var ') || code.includes('let ') || code.includes('const ')) {
      return 'javascript';
    }
    
    if (code.includes('def ') && code.includes('import ')) {
      return 'python';
    }
    
    if (code.includes('public class') || code.includes('import java')) {
      return 'java';
    }
    
    if (code.includes('#include') || code.includes('using namespace')) {
      return 'cpp';
    }

    return 'unknown';
  }

  initializeLanguageDetectors() {
    return {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby'
    };
  }

  initializeAnalysisRules() {
    return {
      javascript: {
        commonMistakes: [
          { pattern: /console\.log\([^)]*\)/g, message: 'Consider removing debug console.log statements', severity: 'low' },
          { pattern: /var\s+\w+/g, message: 'Consider using let or const instead of var', severity: 'medium' },
          { pattern: /==/g, message: 'Consider using === for strict equality comparison', severity: 'medium' },
          { pattern: /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, message: 'Consider using arrow functions for better readability', severity: 'low' }
        ],
        bestPractices: [
          { pattern: /const\s+\w+\s*=/g, message: 'Good use of const for immutable variables', severity: 'positive' },
          { pattern: /===/g, message: 'Good use of strict equality', severity: 'positive' }
        ]
      },
      python: {
        commonMistakes: [
          { pattern: /print\([^)]*\)/g, message: 'Consider using logging instead of print statements', severity: 'low' },
          { pattern: /for\s+\w+\s+in\s+range\(len\([^)]+\)\)/g, message: 'Consider using enumerate() instead of range(len())', severity: 'medium' },
          { pattern: /if\s+\w+\s*==\s*None/g, message: 'Consider using "is None" instead of "== None"', severity: 'medium' }
        ],
        bestPractices: [
          { pattern: /def\s+\w+\s*\([^)]*\):\s*"""[^"]*"""/g, message: 'Good use of docstrings', severity: 'positive' },
          { pattern: /with\s+\w+\s+as\s+\w+:/g, message: 'Good use of context managers', severity: 'positive' }
        ]
      }
    };
  }

  runLanguageAnalysis(code, language) {
    const issues = [];
    const suggestions = [];
    
    if (!this.analysisRules[language]) {
      return { issues, suggestions };
    }

    const rules = this.analysisRules[language];
    
    // Check for common mistakes
    rules.commonMistakes.forEach(rule => {
      const matches = code.match(rule.pattern);
      if (matches) {
        issues.push({
          type: 'common_mistake',
          message: rule.message,
          severity: rule.severity,
          matches: matches.length,
          line: this.findLineNumber(code, matches[0])
        });
      }
    });

    // Check for best practices
    rules.bestPractices.forEach(rule => {
      const matches = code.match(rule.pattern);
      if (matches) {
        suggestions.push({
          type: 'best_practice',
          message: rule.message,
          severity: rule.severity,
          matches: matches.length
        });
      }
    });

    return { issues, suggestions };
  }

  runGeneralAnalysis(code) {
    const issues = [];
    const suggestions = [];

    // Check for code complexity
    const complexity = this.calculateComplexity(code);
    if (complexity > 10) {
      issues.push({
        type: 'complexity',
        message: `Function complexity is high (${complexity}). Consider breaking it into smaller functions.`,
        severity: 'medium',
        complexity
      });
    }

    // Check for long lines
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push({
          type: 'line_length',
          message: `Line ${index + 1} is too long (${line.length} characters). Consider breaking it up.`,
          severity: 'low',
          lineNumber: index + 1,
          length: line.length
        });
      }
    });

    // Check for TODO comments
    const todoMatches = code.match(/TODO|FIXME|HACK|XXX/gi);
    if (todoMatches) {
      suggestions.push({
        type: 'todo',
        message: `Found ${todoMatches.length} TODO/FIXME comments. Consider addressing them.`,
        severity: 'low',
        count: todoMatches.length
      });
    }

    return { issues, suggestions };
  }

  calculateComplexity(code, language = 'unknown') {
    // Simple cyclomatic complexity calculation
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g
    ];

    decisionPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  detectPatterns(code, language) {
    const patterns = [];

    // Detect common algorithm patterns
    if (code.includes('for') && code.includes('if')) {
      patterns.push({
        type: 'search_algorithm',
        confidence: 0.7,
        description: 'Appears to be implementing a search algorithm'
      });
    }

    if (code.includes('while') && code.includes('temp')) {
      patterns.push({
        type: 'sorting_algorithm',
        confidence: 0.6,
        description: 'Appears to be implementing a sorting algorithm'
      });
    }

    if (code.includes('function') && code.includes('return')) {
      patterns.push({
        type: 'recursive_function',
        confidence: 0.8,
        description: 'Appears to be implementing a recursive function'
      });
    }

    return patterns;
  }

  findLineNumber(code, searchText) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return -1;
  }

  generateHint(analysis) {
    if (!analysis.hasIssues) {
      return null;
    }

    const highPriorityIssues = analysis.issues.filter(issue => issue.severity === 'high');
    const mediumPriorityIssues = analysis.issues.filter(issue => issue.severity === 'medium');

    if (highPriorityIssues.length > 0) {
      return {
        level: 1,
        type: 'critical_issue',
        message: `I notice you have ${highPriorityIssues.length} critical issue(s) in your code. ${highPriorityIssues[0].message}`,
        suggestion: this.getSuggestionForIssue(highPriorityIssues[0]),
        filePath: analysis.filePath
      };
    }

    if (mediumPriorityIssues.length > 0) {
      return {
        level: 2,
        type: 'improvement_opportunity',
        message: `There's an opportunity to improve your code: ${mediumPriorityIssues[0].message}`,
        suggestion: this.getSuggestionForIssue(mediumPriorityIssues[0]),
        filePath: analysis.filePath
      };
    }

    return null;
  }

  getSuggestionForIssue(issue) {
    const suggestions = {
      'common_mistake': 'Try to follow best practices for your programming language.',
      'complexity': 'Consider breaking your function into smaller, more manageable pieces.',
      'line_length': 'Try to keep lines under 120 characters for better readability.',
      'syntax_error': 'Check your syntax carefully. Missing brackets or parentheses are common mistakes.'
    };

    return suggestions[issue.type] || 'Consider reviewing this part of your code.';
  }
}

module.exports = CodeAnalyzer;

