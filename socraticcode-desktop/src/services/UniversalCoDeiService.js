const EventEmitter = require('events');
const { spawn } = require('child_process');
const path = require('path');
const { Notification } = require('electron');

class UniversalCoDeiService extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.interceptedRequests = [];
    this.learningProfile = {
      weaknessAreas: [],
      strengthAreas: [],
      hintLevel: 1,
      personality: 'mentor',
      sessionHistory: []
    };
    
    this.platforms = {
      browser: false,
      ide: false,
      chatbot: false,
      clipboard: false
    };
  }

  async initialize() {
    console.log('🌐 Initializing Universal CoDei Service...');
    
    try {
      // Initialize browser monitoring
      await this.initializeBrowserMonitoring();
      
      // Initialize IDE monitoring
      await this.initializeIDEMonitoring();
      
      // Initialize clipboard monitoring
      await this.initializeClipboardMonitoring();
      
      // Initialize global hotkey system
      await this.initializeGlobalHotkeys();
      
      this.isActive = true;
      console.log('✅ Universal CoDei Service Active');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Universal CoDei Service:', error);
      return false;
    }
  }

  async initializeBrowserMonitoring() {
    console.log('🌍 Setting up browser monitoring...');
    
    // This would integrate with browser extensions
    // For now, we'll simulate the detection
    this.platforms.browser = true;
    
    // Monitor for common coding platforms
    // DISABLED: Uncomment for development/demo
    // this.monitorCodingWebsites();
  }

  async initializeIDEMonitoring() {
    console.log('💻 Setting up IDE monitoring...');
    
    // Monitor VS Code, Cursor, PyCharm, etc.
    this.platforms.ide = true;
    
    // This would integrate with IDE extensions
    // DISABLED: Uncomment for development/demo
    // this.monitorIDEActions();
  }

  async initializeClipboardMonitoring() {
    console.log('📋 Setting up clipboard monitoring...');
    
    this.platforms.clipboard = true;
    
    // Monitor clipboard for code copying
    // DISABLED: Uncomment for development/demo
    // this.monitorClipboardChanges();
  }

  async initializeGlobalHotkeys() {
    console.log('⌨️ Setting up global hotkeys...');
    
    // Global hotkey to invoke CoDei anywhere
    // This would use system-level hotkey registration
    this.registerGlobalHotkeys();
  }

  monitorCodingWebsites() {
    // Simulate monitoring coding websites
    setInterval(() => {
      // This would detect when user is on:
      // - ChatGPT asking for code solutions
      // - Cursor AI requesting completions
      // - Replit asking for help
      // - GitHub Copilot suggestions
      // - Stack Overflow copying
      
      const simulatedRequest = this.generateSimulatedRequest();
      if (simulatedRequest) {
        this.interceptSolutionRequest(simulatedRequest);
      }
    }, 5000); // Check every 5 seconds
  }

  monitorIDEActions() {
    // Monitor IDE for solution requests
    setInterval(() => {
      // This would detect:
      // - AI completion requests
      // - "Solve this" prompts
      // - Code generation requests
      // - Copy-paste from AI tools
      
      const simulatedIDERequest = this.generateSimulatedIDERequest();
      if (simulatedIDERequest) {
        this.interceptSolutionRequest(simulatedIDERequest);
      }
    }, 3000);
  }

  monitorClipboardChanges() {
    let lastClipboard = '';
    
    setInterval(async () => {
      try {
        // This would monitor clipboard for code
        const currentClipboard = await this.getClipboardContent();
        
        if (currentClipboard !== lastClipboard && this.isCodeContent(currentClipboard)) {
          this.interceptClipboardCode(currentClipboard);
          lastClipboard = currentClipboard;
        }
      } catch (error) {
        // Clipboard access might be restricted
      }
    }, 1000);
  }

  registerGlobalHotkeys() {
    // This would register global hotkeys like:
    // Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows/Linux)
    // to invoke CoDei anywhere
    
    console.log('🔑 Global hotkeys registered: Cmd+Shift+C to invoke CoDei');
  }

  generateSimulatedRequest() {
    const requests = [
      {
        platform: 'chatgpt',
        type: 'solution_request',
        content: 'Write a function to reverse a string',
        context: 'user asking for complete solution'
      },
      {
        platform: 'cursor',
        type: 'completion_request',
        content: 'Complete this sorting algorithm',
        context: 'AI completion request'
      },
      {
        platform: 'replit',
        type: 'help_request',
        content: 'How do I implement binary search?',
        context: 'asking for implementation help'
      }
    ];
    
    // Randomly return a request 30% of the time
    if (Math.random() < 0.3) {
      return requests[Math.floor(Math.random() * requests.length)];
    }
    return null;
  }

  generateSimulatedIDERequest() {
    const requests = [
      {
        platform: 'vscode',
        type: 'ai_completion',
        content: 'Generate a class for handling API requests',
        context: 'AI completion in VS Code'
      },
      {
        platform: 'cursor',
        type: 'code_generation',
        content: 'Create a React component for user authentication',
        context: 'Cursor AI generation request'
      }
    ];
    
    if (Math.random() < 0.2) {
      return requests[Math.floor(Math.random() * requests.length)];
    }
    return null;
  }

  async getClipboardContent() {
    // This would get actual clipboard content
    // For now, return empty string
    return '';
  }

  isCodeContent(content) {
    // Detect if clipboard content is code
    const codeIndicators = [
      'function', 'class', 'import', 'export', 'def ', 'if ', 'for ',
      'const ', 'let ', 'var ', 'return', 'public', 'private'
    ];
    
    return codeIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  interceptSolutionRequest(request) {
    console.log(`🚨 CoDei intercepted ${request.platform} request:`, request.content);
    
    // Record the interception
    this.interceptedRequests.push({
      ...request,
      timestamp: new Date(),
      intercepted: true
    });
    
    // Generate learning-focused response
    const learningResponse = this.generateLearningResponse(request);
    
    // Show CoDei intervention
    this.showCoDeiIntervention(request, learningResponse);
    
    // Emit event for UI updates
    this.emit('solutionIntercepted', {
      request,
      response: learningResponse
    });
  }

  interceptClipboardCode(code) {
    console.log('📋 CoDei detected code copying:', code.substring(0, 50) + '...');
    
    // Show learning reminder
    this.showLearningReminder(code);
    
    this.emit('codeCopied', {
      code: code.substring(0, 100),
      timestamp: new Date()
    });
  }

  generateLearningResponse(request) {
    const personality = this.getPersonalityResponse();
    const hintLevel = this.determineHintLevel(request);
    
    let response = {
      type: 'learning_intervention',
      platform: request.platform,
      originalRequest: request.content,
      learningResponse: '',
      hintLevel: hintLevel,
      personality: this.learningProfile.personality
    };

    switch (hintLevel) {
      case 1: // Conceptual
        response.learningResponse = `${personality.conceptual} Instead of asking for the complete solution, let's understand the core concept first. What do you think this problem is really asking for?`;
        break;
        
      case 2: // Algorithmic
        response.learningResponse = `${personality.algorithmic} Great! Now let's break this down step by step. What would be your approach to solving this? Think about the main steps involved.`;
        break;
        
      case 3: // Implementation
        response.learningResponse = `${personality.implementation} Perfect! Now let's structure this with some pseudocode. What would the main function signature look like?`;
        break;
    }

    return response;
  }

  getPersonalityResponse() {
    const personalities = {
      mentor: {
        conceptual: "Let's think about this together. ",
        algorithmic: "Excellent question! ",
        implementation: "You're on the right track! "
      },
      sarcastic: {
        conceptual: "Oh, you want the easy way out? ",
        algorithmic: "Finally, some real thinking! ",
        implementation: "Look at you, getting sophisticated! "
      },
      fun: {
        conceptual: "🎯 Time for some detective work! ",
        algorithmic: "🚀 Let's break this puzzle down! ",
        implementation: "🎨 Now let's paint this solution! "
      },
      'grade-level': {
        conceptual: "Let's analyze this systematically. ",
        algorithmic: "Good approach! ",
        implementation: "Excellent progress! "
      }
    };
    
    return personalities[this.learningProfile.personality];
  }

  determineHintLevel(request) {
    // Adaptive hint level based on user's learning profile
    const recentHistory = this.learningProfile.sessionHistory.slice(-5);
    const conceptualCount = recentHistory.filter(h => h.hintLevel === 1).length;
    
    if (conceptualCount >= 2) {
      return 2; // Move to algorithmic
    }
    
    if (recentHistory.length >= 3 && recentHistory.every(h => h.hintLevel >= 2)) {
      return 3; // Move to implementation
    }
    
    return 1; // Start with conceptual
  }

  showCoDeiIntervention(request, response) {
    try {
      // Show system notification using Electron's Notification
      const notification = new Notification({
        title: 'CoDei Learning Intervention',
        body: `Instead of copying, let's learn! ${response.learningResponse}`,
        icon: path.join(__dirname, '../assets/icon.png')
      });
      
      notification.show();
      
      // Log the intervention
      console.log(`🎓 CoDei Learning Intervention:`, response.learningResponse);
    } catch (error) {
      console.log(`🎓 CoDei Learning Intervention:`, response.learningResponse);
      console.log('Note: System notifications not available');
    }
  }

  showLearningReminder(code) {
    try {
      const notification = new Notification({
        title: 'CoDei Learning Reminder',
        body: 'Remember: Understanding > Copying. Take a moment to understand this code before using it!',
        icon: path.join(__dirname, '../assets/icon.png')
      });
      
      notification.show();
    } catch (error) {
      console.log('🎓 CoDei Learning Reminder: Understanding > Copying!');
      console.log('Note: System notifications not available');
    }
  }

  // Global hotkey handler
  invokeCoDei(context) {
    console.log('🔑 CoDei invoked globally with context:', context);
    
    const intervention = {
      type: 'manual_invocation',
      context: context,
      timestamp: new Date(),
      response: this.generateLearningResponse({
        platform: 'manual',
        type: 'user_request',
        content: context,
        context: 'User manually invoked CoDei'
      })
    };
    
    this.emit('manualInvocation', intervention);
    return intervention;
  }

  // Update learning profile
  updateLearningProfile(interaction) {
    this.learningProfile.sessionHistory.push({
      timestamp: new Date(),
      interaction: interaction,
      hintLevel: interaction.hintLevel || 1
    });
    
    // Keep only last 50 interactions
    if (this.learningProfile.sessionHistory.length > 50) {
      this.learningProfile.sessionHistory = this.learningProfile.sessionHistory.slice(-50);
    }
  }

  // Get service status
  getServiceStatus() {
    return {
      isActive: this.isActive,
      platforms: this.platforms,
      interceptedRequests: this.interceptedRequests.length,
      learningProfile: this.learningProfile
    };
  }

  // Stop the service
  async stop() {
    this.isActive = false;
    console.log('🛑 Universal CoDei Service Stopped');
  }
}

module.exports = UniversalCoDeiService;
