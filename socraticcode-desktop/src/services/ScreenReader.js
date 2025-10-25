const { screen, desktopCapturer } = require('electron');
const EventEmitter = require('events');

class ScreenReader extends EventEmitter {
  constructor() {
    super();
    this.isReading = false;
    this.readInterval = null;
    this.lastContent = '';
  }

  async startReading() {
    this.isReading = true;
    
    // Read the screen every 3 seconds
    this.readInterval = setInterval(() => {
      this.captureAndAnalyze();
    }, 3000);
    
    // Do an initial read
    this.captureAndAnalyze();
    
    console.log('📸 Screen reading started');
  }

  stopReading() {
    this.isReading = false;
    if (this.readInterval) {
      clearInterval(this.readInterval);
      this.readInterval = null;
    }
    console.log('📸 Screen reading stopped');
  }

  async captureAndAnalyze() {
    try {
      // Get screen sources
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        console.log('No screen sources available');
        return;
      }

      // Get primary display
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      // For now, we'll simulate detecting coding content
      // In a real implementation, you would:
      // 1. Use OCR (like Tesseract.js) to extract text from the screenshot
      // 2. Parse the text to detect coding problems, questions, code snippets
      // 3. Analyze the context and generate relevant hints

      this.simulateContentDetection(width, height);

    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  }

  simulateContentDetection(width, height) {
    // Simulate detecting different types of coding content
    const contentTypes = [
      {
        type: 'leetcode_problem',
        confidence: 0.9,
        snippet: 'Two Sum',
        hint: "What data structure helps you find pairs efficiently? Think about tracking what you've seen!"
      },
      {
        type: 'code_snippet',
        confidence: 0.8,
        snippet: 'function solve()',
        hint: "Before solving, what's the time and space complexity goal for this problem?"
      },
      {
        type: 'coding_question',
        confidence: 0.85,
        snippet: 'reverse a string',
        hint: "Can you solve this without extra space? What about using two pointers?"
      }
    ];

    // Randomly generate a hint occasionally (reduced probability to prevent spam)
    if (Math.random() < 0.05) { // Reduced from 0.3 to 0.05 (20% chance every 3 seconds)
      const content = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      
      if (content.snippet !== this.lastContent) {
        this.emit('contentDetected', {
          type: content.type,
          snippet: content.snippet,
          hint: content.hint,
          confidence: content.confidence,
          timestamp: new Date()
        });
        
        this.lastContent = content.snippet;
      }
    }
  }

  async getTextFromImage(imagePath) {
    // This would integrate with OCR like Tesseract.js
    // For now, return simulated text
    return {
      text: "Given an array of integers, return indices of the two numbers such that they add up to target.",
      confidence: 0.9
    };
  }

  analyzeCodeProblem(text) {
    // Analyze the text to determine if it's a coding problem
    const problemPatterns = [
      /given\s+an?\s+array/i,
      /return\s+the/,
      /find\s+the/,
      /implement\s+a\s+function/i,
      /write\s+a\s+(?:function|program)/i
    ];

    const isProblem = problemPatterns.some(pattern => pattern.test(text));
    
    if (isProblem) {
      return {
        isCodingProblem: true,
        keywords: this.extractKeywords(text),
        hintLevel: 1
      };
    }

    return { isCodingProblem: false };
  }

  extractKeywords(text) {
    // Extract important keywords from the problem
    const commonKeywords = ['array', 'string', 'integer', 'target', 'return', 'find', 'given'];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => commonKeywords.includes(word));
  }

  generateHint(problemAnalysis) {
    // Generate a relevant hint based on the problem analysis
    const hints = {
      array: "Think about which array methods might help here. Do you need to iterate? Filter? Transform?",
      string: "What string operations are relevant? Substring? Reverse? Compare?",
      two_pointers: "Can you use two pointers to solve this more efficiently? Start from opposite ends!",
      hash_map: "Would a hash map help you track seen elements quickly?",
      sorting: "Would sorting the data first make this problem easier to solve?",
      default: "Start by understanding the input and output. What's the simplest approach you can think of?"
    };

    // Determine which hint to give based on keywords
    for (const keyword of problemAnalysis.keywords || []) {
      if (keyword in hints) {
        return hints[keyword];
      }
    }

    return hints.default;
  }
}

module.exports = ScreenReader;
