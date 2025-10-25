// CoDei Browser Extension - Content Script
// Intercepts solution requests and replaces with learning-focused responses

class CoDeiBrowserInterceptor {
  constructor() {
    this.isActive = true;
    this.interceptedElements = new Set();
    this.learningProfile = {
      personality: 'mentor',
      hintLevel: 1,
      sessionHistory: []
    };
    
    this.init();
  }

  init() {
    console.log('🎓 CoDei Browser Extension Active');
    
    // Load saved learning profile
    this.loadLearningProfile();
    
    // Start monitoring
    this.startMonitoring();
    
    // Inject CoDei UI elements
    this.injectCoDeiUI();
  }

  async loadLearningProfile() {
    try {
      const result = await chrome.storage.local.get(['codeiProfile']);
      if (result.codeiProfile) {
        this.learningProfile = { ...this.learningProfile, ...result.codeiProfile };
      }
    } catch (error) {
      console.log('Using default learning profile');
    }
  }

  async saveLearningProfile() {
    try {
      await chrome.storage.local.set({ codeiProfile: this.learningProfile });
    } catch (error) {
      console.error('Failed to save learning profile:', error);
    }
  }

  startMonitoring() {
    // Monitor for solution requests on different platforms
    this.monitorChatGPT();
    this.monitorCursor();
    this.monitorReplit();
    this.monitorStackOverflow();
    this.monitorGitHub();
    
    // Monitor for code copying
    this.monitorCodeCopying();
    
    // Monitor for AI completion requests
    this.monitorAICompletions();
  }

  monitorChatGPT() {
    if (!window.location.hostname.includes('openai.com')) return;
    
    // Monitor ChatGPT input for solution requests
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkForSolutionRequests(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  monitorCursor() {
    if (!window.location.hostname.includes('cursor.sh')) return;
    
    // Monitor Cursor AI requests
    this.monitorAIRequests();
  }

  monitorReplit() {
    if (!window.location.hostname.includes('replit.com')) return;
    
    // Monitor Replit help requests
    this.monitorHelpRequests();
  }

  monitorStackOverflow() {
    if (!window.location.hostname.includes('stackoverflow.com')) return;
    
    // Monitor for code copying from Stack Overflow
    this.monitorCodeBlocks();
  }

  monitorGitHub() {
    if (!window.location.hostname.includes('github.com')) return;
    
    // Monitor GitHub Copilot suggestions
    this.monitorCopilotSuggestions();
  }

  checkForSolutionRequests(element) {
    const textContent = element.textContent || element.value || '';
    
    // Detect solution request patterns
    const solutionPatterns = [
      /write\s+(?:me\s+)?(?:a\s+)?(?:complete\s+)?(?:function|code|program|script)/i,
      /solve\s+(?:this\s+)?(?:problem|question|challenge)/i,
      /give\s+me\s+(?:the\s+)?(?:complete\s+)?(?:solution|code|answer)/i,
      /show\s+me\s+(?:how\s+to\s+)?(?:write|implement|create)/i,
      /can\s+you\s+(?:write|create|generate|make)\s+(?:me\s+)?(?:a\s+)?(?:complete\s+)?/i
    ];
    
    const isSolutionRequest = solutionPatterns.some(pattern => pattern.test(textContent));
    
    if (isSolutionRequest && !this.interceptedElements.has(element)) {
      this.interceptSolutionRequest(element, textContent);
      this.interceptedElements.add(element);
    }
  }

  interceptSolutionRequest(element, originalText) {
    console.log('🚨 CoDei intercepted solution request:', originalText);
    
    // Generate learning-focused response
    const learningResponse = this.generateLearningResponse(originalText);
    
    // Show CoDei intervention
    this.showCoDeiIntervention(element, learningResponse);
    
    // Update learning profile
    this.updateLearningProfile(originalText, learningResponse);
  }

  generateLearningResponse(originalText) {
    const personality = this.getPersonalityResponse();
    const hintLevel = this.determineHintLevel();
    
    let response = '';
    
    switch (hintLevel) {
      case 1: // Conceptual
        response = `${personality.conceptual}Instead of asking for the complete solution, let's understand the core concept first. What do you think this problem is really asking for? What are the key components you need to consider?`;
        break;
        
      case 2: // Algorithmic
        response = `${personality.algorithmic}Great! Now let's break this down step by step. What would be your approach to solving this? Think about the main steps involved and the logic flow.`;
        break;
        
      case 3: // Implementation
        response = `${personality.implementation}Perfect! Now let's structure this with some pseudocode. What would the main function signature look like? What parameters would it need?`;
        break;
    }
    
    return {
      response: response,
      hintLevel: hintLevel,
      originalText: originalText
    };
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

  determineHintLevel() {
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

  showCoDeiIntervention(element, learningResponse) {
    // Create CoDei intervention overlay
    const overlay = document.createElement('div');
    overlay.className = 'codei-intervention-overlay';
    overlay.innerHTML = `
      <div class="codei-intervention-content">
        <div class="codei-header">
          <span class="codei-logo">🎓 CoDei</span>
          <span class="codei-subtitle">Learning Conscience</span>
        </div>
        <div class="codei-message">
          ${learningResponse.response}
        </div>
        <div class="codei-actions">
          <button class="codei-btn codei-btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
            I'll Think About It
          </button>
          <button class="codei-btn codei-btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            Show Me More Hints
          </button>
        </div>
      </div>
    `;
    
    // Add styles
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Inject CSS
    this.injectCoDeiCSS();
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 10000);
  }

  injectCoDeiCSS() {
    if (document.getElementById('codei-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'codei-styles';
    style.textContent = `
      .codei-intervention-content {
        background: #1a1a1a;
        border: 1px solid #404040;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        color: white;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .codei-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .codei-logo {
        font-size: 20px;
        font-weight: bold;
        color: #00d4aa;
        margin-right: 8px;
      }
      
      .codei-subtitle {
        font-size: 12px;
        color: #b0b0b0;
      }
      
      .codei-message {
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 20px;
        color: #ffffff;
      }
      
      .codei-actions {
        display: flex;
        gap: 12px;
      }
      
      .codei-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      }
      
      .codei-btn-primary {
        background: #00d4aa;
        color: #1a1a1a;
      }
      
      .codei-btn-primary:hover {
        background: #00a085;
      }
      
      .codei-btn-secondary {
        background: #2d2d2d;
        color: white;
        border: 1px solid #404040;
      }
      
      .codei-btn-secondary:hover {
        background: #404040;
      }
    `;
    
    document.head.appendChild(style);
  }

  injectCoDeiUI() {
    // Add CoDei floating button
    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'codei-floating-btn';
    floatingBtn.innerHTML = '🎓';
    floatingBtn.title = 'CoDei Learning Conscience';
    floatingBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: #00d4aa;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
      transition: all 0.3s ease;
    `;
    
    floatingBtn.addEventListener('click', () => {
      this.showCoDeiStatus();
    });
    
    document.body.appendChild(floatingBtn);
  }

  showCoDeiStatus() {
    const status = document.createElement('div');
    status.className = 'codei-status-overlay';
    status.innerHTML = `
      <div class="codei-status-content">
        <div class="codei-header">
          <span class="codei-logo">🎓 CoDei</span>
          <span class="codei-subtitle">Learning Conscience Active</span>
        </div>
        <div class="codei-stats">
          <div class="codei-stat">
            <span class="codei-stat-label">Interceptions:</span>
            <span class="codei-stat-value">${this.interceptedElements.size}</span>
          </div>
          <div class="codei-stat">
            <span class="codei-stat-label">Personality:</span>
            <span class="codei-stat-value">${this.learningProfile.personality}</span>
          </div>
          <div class="codei-stat">
            <span class="codei-stat-label">Hint Level:</span>
            <span class="codei-stat-value">${this.learningProfile.hintLevel}</span>
          </div>
        </div>
        <button class="codei-btn codei-btn-primary" onclick="this.parentElement.parentElement.remove()">
          Close
        </button>
      </div>
    `;
    
    status.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    document.body.appendChild(status);
    
    setTimeout(() => {
      if (status.parentElement) {
        status.remove();
      }
    }, 5000);
  }

  monitorCodeCopying() {
    // Monitor for code copying
    document.addEventListener('copy', (event) => {
      const selection = window.getSelection().toString();
      if (this.isCodeContent(selection)) {
        this.showCopyingReminder(selection);
      }
    });
  }

  monitorAICompletions() {
    // Monitor for AI completion requests
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkForAIRequests(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkForAIRequests(element) {
    // Check for AI completion patterns
    const aiPatterns = [
      /complete\s+(?:this\s+)?(?:code|function|class)/i,
      /generate\s+(?:me\s+)?(?:a\s+)?(?:complete\s+)?/i,
      /write\s+(?:me\s+)?(?:the\s+)?(?:rest\s+of\s+)?/i
    ];
    
    const textContent = element.textContent || element.value || '';
    const isAIRequest = aiPatterns.some(pattern => pattern.test(textContent));
    
    if (isAIRequest && !this.interceptedElements.has(element)) {
      this.interceptSolutionRequest(element, textContent);
      this.interceptedElements.add(element);
    }
  }

  isCodeContent(content) {
    const codeIndicators = [
      'function', 'class', 'import', 'export', 'def ', 'if ', 'for ',
      'const ', 'let ', 'var ', 'return', 'public', 'private', '{}', '()'
    ];
    
    return codeIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }

  showCopyingReminder(code) {
    const notification = document.createElement('div');
    notification.className = 'codei-copy-notification';
    notification.innerHTML = `
      <div class="codei-notification-content">
        <span class="codei-notification-icon">🎓</span>
        <span class="codei-notification-text">
          Remember: Understanding > Copying. Take a moment to understand this code before using it!
        </span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a1a1a;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #00d4aa;
      z-index: 10000;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation CSS
    if (!document.getElementById('codei-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'codei-animation-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  updateLearningProfile(originalText, learningResponse) {
    this.learningProfile.sessionHistory.push({
      timestamp: new Date(),
      originalText: originalText,
      hintLevel: learningResponse.hintLevel,
      response: learningResponse.response
    });
    
    // Keep only last 50 interactions
    if (this.learningProfile.sessionHistory.length > 50) {
      this.learningProfile.sessionHistory = this.learningProfile.sessionHistory.slice(-50);
    }
    
    // Save to storage
    this.saveLearningProfile();
  }

  // Platform-specific monitoring methods
  monitorAIRequests() {
    // Generic AI request monitoring
  }

  monitorHelpRequests() {
    // Generic help request monitoring
  }

  monitorCodeBlocks() {
    // Generic code block monitoring
  }

  monitorCopilotSuggestions() {
    // Generic Copilot monitoring
  }
}

// Initialize CoDei Browser Interceptor
const codeiInterceptor = new CoDeiBrowserInterceptor();
