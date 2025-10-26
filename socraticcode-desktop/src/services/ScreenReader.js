const { screen, desktopCapturer } = require('electron');
const EventEmitter = require('events');

class ScreenReader extends EventEmitter {
  constructor() {
    super();
    this.isReading = false;
    this.readInterval = null;
    this.lastContent = '';
    this.lastScreenImage = null;
    this.lastScreenTimestamp = null;
    this.lastScreenDescription = null;
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

      // Capture screen image
      const img = await this.captureScreenImage(sources[0]);
      
      // Store the image for when user types "show"
      this.lastScreenImage = img;
      this.lastScreenTimestamp = Date.now();

    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  }

  async captureScreenImage(source) {
    try {
      // Get native image handle from source
      const img = source.thumbnail;
      return {
        source: img,
        timestamp: Date.now(),
        display: screen.getPrimaryDisplay().workAreaSize
      };
    } catch (error) {
      console.error('Error capturing screen image:', error);
      return null;
    }
  }

  async getScreenDescription() {
    // Return description of what's on screen
    return {
      hasScreen: this.lastScreenImage !== null,
      timestamp: this.lastScreenTimestamp,
      description: this.lastScreenDescription || 'Screen content captured. Analyzing...'
    };
  }

  // Removed dummy content detection - now captures real screen content

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
