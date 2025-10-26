const { screen, desktopCapturer } = require('electron');
const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ScreenReaderEnhanced extends EventEmitter {
  constructor(claudeBackendUrl = 'http://127.0.0.1:8000', personality = 'mentor') {
    super();
    this.isReading = false;
    this.readInterval = null;
    this.lastContent = '';
    this.lastDetectedContext = null;  // Store screen context (passive mode)
    this.claudeBackendUrl = claudeBackendUrl;  // Claude backend (not old rag-service)
    this.personality = personality;
    this.currentHintLevel = 1;
    
    this.safeLog('📸 Enhanced Screen Reader initialized');
    this.safeLog(`🔍 Using OCR (Tesseract) for screen reading`);
  }
  
  setPersonality(personality) {
    this.personality = personality;
    this.safeLog(`👤 Screen reader personality updated to: ${personality}`);
  }
  
  setHintLevel(level) {
    this.currentHintLevel = level;
    this.safeLog(`📊 Hint level updated to: ${level}`);
  }

  // Safe logging that won't crash on EIO errors
  safeLog(...args) {
    try {
      console.log(...args);
    } catch (error) {
      // Silently ignore write errors (EPIPE errors are handled at process level)
    }
  }

  async startReading() {
    this.isReading = true;
    
    // Read the screen every 10 seconds to see updates faster
    this.readInterval = setInterval(() => {
      this.captureAndAnalyze();
    }, 10000);
    
    // Do an initial read immediately
    this.captureAndAnalyze();
    
    this.safeLog('📸 Enhanced screen reading started - scanning every 10 seconds...');
    this.safeLog('👀 Looking for any text and code on your screen');
  }

  stopReading() {
    this.isReading = false;
    if (this.readInterval) {
      clearInterval(this.readInterval);
      this.readInterval = null;
    }
    this.safeLog('📸 Screen reading stopped');
  }

  async captureAndAnalyze() {
    try {
      // Reduced logging to avoid console spam
      // this.safeLog('📷 Capturing screen...');
      
      // Get screen sources - prefer active window over full screen
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1920, height: 1080 } // Higher res for better OCR
      });

      if (sources.length === 0) {
        this.safeLog('⚠️  No screen sources available');
        return;
      }

      // Find the active coding window (VS Code, Cursor, Chrome with code, etc.)
      let activeSource = sources.find(s => {
        const title = s.name.toLowerCase();
        return title.includes('cursor') || 
               title.includes('vscode') || 
               title.includes('visual studio code') ||
               title.includes('leetcode') ||
               title.includes('hackerrank') ||
               title.includes('.py') || title.includes('.js') || 
               title.includes('.java') || title.includes('.cpp');
      });
      
      // Fallback to primary screen if no coding window found
      if (!activeSource) {
        activeSource = sources.find(s => s.name.includes('Screen')) || sources[0];
      }
      
      const screenshot = activeSource.thumbnail;
      
      // Convert to base64 PNG
      const screenshotBase64 = screenshot.toPNG().toString('base64');
      
      // Only log when we actually detect coding content
      // this.safeLog('✅ Screenshot captured, analyzing...');
      // this.safeLog(`📱 Capturing from: ${activeSource.name}`);
      
      // Analyze the screenshot for coding content
      await this.analyzeScreenshot(screenshotBase64);

    } catch (error) {
      this.safeLog('❌ Error capturing screen:', error.message);
    }
  }

  async analyzeScreenshot(screenshotBase64) {
    try {
      // Use OCR to extract screen content
      const ocrResult = await this.analyzeWithOCR(screenshotBase64);
      
      // ALWAYS store OCR context for Claude, even if not coding
      if (ocrResult && ocrResult.extractedText) {
        // Store the context for chat (ALWAYS, not just when coding)
        this.lastDetectedContext = {
          type: ocrResult.isCoding ? 'coding_question' : 'screen_content',
          topic: ocrResult.topic || 'general',
          question: ocrResult.question || '',
          code: ocrResult.code || '',
          confidence: ocrResult.confidence || 0.5,
          timestamp: new Date(),
          ocrText: ocrResult.extractedText  // This is the key - always store OCR text
        };
        
        if (ocrResult.isCoding) {
          this.safeLog(`🎯 Coding content detected! Topic: ${ocrResult.topic}`);
          this.safeLog(`💻 Code found: ${ocrResult.code ? ocrResult.code.substring(0, 150) : '(no code)'}...`);
        }
        
        this.safeLog(`💾 Screen context stored (${ocrResult.extractedText.length} chars)`);
        
        // Show a snippet of what we captured
        this.safeLog(`📄 Captured: "${ocrResult.extractedText.substring(0, 100)}..."`);
      }

    } catch (error) {
      this.safeLog('❌ Error analyzing screenshot:', error.message);
    }
  }
  
  // Public method to get current screen context for chat
  getCurrentContext() {
    return this.lastDetectedContext || null;
  }

  // NOTE: Gemini Vision removed - now using OCR + Claude for screen analysis
  async analyzeScreenWithVision(screenshotBase64) {
    // Not used anymore - we use OCR + Claude instead
    return null;
  }
  
  async analyzeWithOCR(screenshotBase64) {
    try {
      // Validate the image data first
      if (!screenshotBase64 || screenshotBase64.length < 100) {
        this.safeLog('⚠️  Invalid screenshot data, skipping OCR');
        return null;
      }
      
      // Check if it's a valid base64 image string
      if (!screenshotBase64.startsWith('iVBORw0KGgo')) {
        // Standard PNG header in base64
        this.safeLog('⚠️  Screenshot does not appear to be a valid PNG, skipping OCR');
        return null;
      }
      
      // Simple OCR using Tesseract.js
      const Tesseract = require('tesseract.js');
      
      this.safeLog('🔍 Using OCR fallback (Tesseract)...');
      
      let result;
      try {
        result = await Tesseract.recognize(
          Buffer.from(screenshotBase64, 'base64'),
          'eng',
          {
            // Disabled verbose OCR logging
            // logger: m => {
            //   if (m.status === 'recognizing text') {
            //     this.safeLog(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            //   }
            // }
          }
        );
      } catch (tesseractError) {
        this.safeLog('❌ Tesseract OCR error:', tesseractError.message);
        this.safeLog('⚠️  OCR unavailable, skipping screen capture');
        return null;
      }
      
      const extractedText = result.data.text;
      
      // Filter out UI noise - focus on actual code content
      const lines = extractedText.split('\n');
      const codeLines = [];
      const questionLines = [];
      
      // UI elements to ignore
      const uiNoise = [
        'cursor', 'file', 'edit', 'selection', 'view', 'go', 'run', 'terminal', 'window', 'help',
        'package', 'readme', 'node_modules', 'trash', 'agents', 'undo', 'keep all'
      ];
      
      for (const line of lines) {
        const lower = line.toLowerCase().trim();
        
        // Skip empty lines or UI elements
        if (!lower || lower.length < 3) continue;
        if (uiNoise.some(noise => lower.includes(noise) && lower.length < 50)) continue;
        
        // Detect code (has indentation, keywords, or symbols)
        if (
          lower.includes('def ') || lower.includes('function') || lower.includes('class ') ||
          lower.includes('return') || lower.includes('if ') || lower.includes('for ') ||
          lower.includes('import ') || lower.includes('const ') || lower.includes('let ') ||
          line.match(/^\s{2,}/) || // Indented code
          line.includes('(') && line.includes(')') || // Function calls
          line.includes('{') || line.includes('}') || // Braces
          line.includes('//') || line.includes('#') // Comments
        ) {
          codeLines.push(line);
        }
        // Detect questions/problems (longer text, contains keywords)
        else if (
          lower.includes('problem') || lower.includes('question') || lower.includes('given') ||
          lower.includes('array') || lower.includes('string') || lower.includes('algorithm') ||
          lower.includes('implement') || lower.includes('write') || lower.includes('find') ||
          lower.includes('calculate') || lower.includes('return')
        ) {
          questionLines.push(line);
        }
      }
      
      const cleanedCode = codeLines.join('\n');
      const cleanedQuestion = questionLines.join(' ');
      
      // Always show what we found - this is what you'll see in the terminal
      this.safeLog('═'.repeat(60));
      this.safeLog('📄 WHAT I SEE ON YOUR SCREEN:');
      this.safeLog('─'.repeat(60));
      if (cleanedCode) {
        this.safeLog('CODE:');
        this.safeLog(cleanedCode);
      }
      if (cleanedQuestion) {
        this.safeLog('TEXT/CONTENT:');
        this.safeLog(cleanedQuestion);
      }
      if (!cleanedCode && !cleanedQuestion) {
        this.safeLog('(detecting... check back in 10 seconds)');
      }
      this.safeLog('═'.repeat(60));
      
      // Check if we found actual coding content
      const hasCodingContent = codeLines.length > 0 || questionLines.length > 0;
      
      if (hasCodingContent) {
        // Detect topic from code/question
        let topic = 'programming';
        const allText = (cleanedCode + ' ' + cleanedQuestion).toLowerCase();
        
        if (allText.includes('array') || allText.includes('list')) topic = 'arrays';
        else if (allText.includes('string') || allText.includes('char')) topic = 'strings';
        else if (allText.includes('recursion') || allText.includes('recursive')) topic = 'recursion';
        else if (allText.includes('tree') || allText.includes('node')) topic = 'trees';
        else if (allText.includes('graph') || allText.includes('vertex')) topic = 'graphs';
        else if (allText.includes('sort') || allText.includes('search')) topic = 'algorithms';
        else if (allText.includes('hash') || allText.includes('map')) topic = 'hash-tables';
        else if (allText.includes('loop') || allText.includes('for') || allText.includes('while')) topic = 'loops';
        
        return {
          isCoding: true,
          topic: topic,
          question: cleanedQuestion || 'Analyzing code...',
          code: cleanedCode,
          extractedText: cleanedCode + '\n\n' + cleanedQuestion,
          confidence: codeLines.length > 2 ? 0.8 : 0.6
        };
      }
      
      return {
        isCoding: false,
        confidence: 0.0,
        topic: '',
        question: '',
        code: '',
        extractedText: extractedText
      };
      
    } catch (error) {
      this.safeLog('❌ OCR error:', error.message);
      
      return {
        isCoding: false,
        confidence: 0.0,
        topic: '',
        question: '',
        code: '',
        extractedText: ''
      };
    }
  }

  async generateHints(code, topic, userApproach = '', misconceptions = '') {
    try {
      // Send captured screen data to Claude backend for Socratic hints
      const contextMessage = `Problem Topic: ${topic}\n\nCode:\n${code}\n\nStudent's Approach: ${userApproach || 'Not yet determined'}\n\nPotential Issues: ${misconceptions || 'None detected'}`;
      
      this.safeLog(`🤖 Sending to Claude backend: ${this.claudeBackendUrl}/api/code_update`);
      
      const response = await axios.post(
        `${this.claudeBackendUrl}/api/code_update`,
        {
          code: contextMessage,
          context: `The student is working on a ${topic} problem on LeetCode. Provide a Socratic hint to guide their thinking.`,
          language: 'python'  // Claude will auto-detect actual language
        },
        { timeout: 15000 }
      );

      if (response.data && response.data.question) {
        // Claude's Socratic response
        const claudeHint = response.data.question;
        
        this.safeLog(`✅ Claude responded: ${claudeHint.substring(0, 80)}...`);
        
        return {
          topic: topic,
          personality: this.personality,
          knowledgeBaseHints: [],
          progressiveHints: [
            { level: 1, hint: claudeHint, revealed: true },  // Claude's Socratic question (Level 1)
            { level: 2, hint: 'Think about edge cases and how your code handles them.', revealed: false },
            { level: 3, hint: 'Consider the time complexity. Can you optimize your approach?', revealed: false }
          ],
          currentLevel: this.currentHintLevel
        };
      }
    } catch (error) {
      this.safeLog('❌ Error calling Claude backend:', error.message);
      this.safeLog('   Make sure Claude backend is running on port 8000!');
    }

    // Fallback hints (when Claude is unavailable)
    return {
      topic: topic,
      personality: this.personality,
      knowledgeBaseHints: [
        "Break down the problem into smaller steps.",
        "What are the inputs and expected outputs?",
        "Consider edge cases in your solution."
      ],
      progressiveHints: [
        { level: 1, hint: "What is the main challenge in solving this problem?", revealed: true },
        { level: 2, hint: "What data structure could help you track information efficiently?", revealed: false },
        { level: 3, hint: "Consider using a hash map for O(1) lookups.", revealed: false }
      ],
      currentLevel: 1
    };
  }

  // Keep the old methods for backward compatibility
  simulateContentDetection(width, height) {
    // Legacy method - now handled by captureAndAnalyze
  }

  analyzeCodeProblem(text) {
    const problemPatterns = [
      /given\s+an?\s+array/i,
      /return\s+the/i,
      /find\s+the/i,
      /implement\s+a\s+function/i,
      /write\s+a\s+(?:function|program)/i,
      /solve\s+the/i,
      /algorithm\s+for/i
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
    const commonKeywords = [
      'array', 'string', 'integer', 'target', 'return', 'find', 'given',
      'sort', 'search', 'loop', 'recursion', 'dynamic', 'programming'
    ];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => commonKeywords.includes(word));
  }
}

module.exports = ScreenReaderEnhanced;

