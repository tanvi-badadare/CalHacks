const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, systemPreferences } = require('electron');
const path = require('path');
const FileMonitor = require('./services/FileMonitor');
const KeystrokeMonitor = require('./services/KeystrokeMonitor');
const UniversalCoDeiService = require('./services/UniversalCoDeiService');
const ScreenOverlay = require('./services/ScreenOverlay');
const ScreenReader = require('./services/ScreenReader_ENHANCED');
const RAGHintService = require('./services/RAGHintService');
const SmartHintEngine = require('./services/SmartHintEngine');

// Handle EPIPE errors specifically to prevent crashes
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') {
    // Silently handle EPIPE errors
    return;
  }
  // Log other errors
  console.error('Uncaught exception:', error);
});

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE on stdout
    return;
  }
});

process.stderr.on('error', (error) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE on stderr
    return;
  }
});

class SocraticApp {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.fileMonitor = null;
    this.keystrokeMonitor = null;
    this.universalService = null;
    this.screenOverlay = null;
    this.screenReader = null;
    this.ragHintService = null;
    this.isDev = process.argv.includes('--dev');
  }

  createWindow() {
    // Create a sleek, dynamic-sized window
    this.mainWindow = new BrowserWindow({
      width: 400,
      height: 500,
      minWidth: 350,
      minHeight: 400,
      maxWidth: 500,
      maxHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      show: true,
      titleBarStyle: 'hidden', // Clean, modern look
      resizable: true, // Allow resizing within limits
      minimizable: true,
      maximizable: false, // No fullscreen/maximize
      alwaysOnTop: false,
      skipTaskbar: false,
      center: true,
      fullscreen: false,
      fullscreenable: false, // No fullscreen capability
      movable: true, // Allow moving
      frame: true // Keep frame for better UX
    });

    // Load the app
    this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (this.isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Don't auto-hide on blur - let user control when to hide
    // this.mainWindow.on('blur', () => {
    //   this.mainWindow.hide();
    // });

    this.mainWindow.on('close', (event) => {
      // Only hide to tray, don't actually quit unless explicitly requested
      event.preventDefault();
      this.mainWindow.hide();
    });
  }

  createTray() {
    // Create a simple, visible icon for macOS menu bar
    const iconData = Buffer.from(`
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" fill="#667eea"/>
        <text x="8" y="12" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">S</text>
      </svg>
    `);
    
    const trayIcon = nativeImage.createFromDataURL('data:image/svg+xml;base64,' + iconData.toString('base64'));
    this.tray = new Tray(trayIcon);
    this.updateTrayIcon(false);
    
        this.tray.setToolTip('Socratic - AI Coding Tutor');
    
    this.tray.on('click', () => {
      this.mainWindow.show();
    });
  }

  updateTrayIcon(isActive) {
    // Create simple colored square with letter S
    const color = isActive ? '#27ae60' : '#667eea'; // Green when active, blue when inactive
    
    const iconData = Buffer.from(`
      <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" fill="${color}"/>
        <text x="8" y="12" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">S</text>
      </svg>
    `);
    
    const trayIcon = nativeImage.createFromDataURL('data:image/svg+xml;base64,' + iconData.toString('base64'));
    this.tray.setImage(trayIcon);
    
    // Update context menu
        const contextMenu = Menu.buildFromTemplate([
          {
            label: 'Socratic',
            enabled: false
          },
          { type: 'separator' },
          {
            label: isActive ? 'Monitoring Active' : 'Monitoring Inactive',
            enabled: false
          },
          {
            label: 'Show Controls',
            click: () => {
              this.mainWindow.show();
            }
          },
          { type: 'separator' },
          {
            label: 'Quit Socratic',
            click: () => {
              app.isQuiting = true;
              app.quit();
            }
          }
        ]);

    this.tray.setContextMenu(contextMenu);
  }

  async initializeServices() {
    // Initialize RAG Hint Service
    this.ragHintService = new RAGHintService('http://127.0.0.1:5001');
    
    // Check RAG service connection
    const isConnected = await this.ragHintService.checkConnection();
    console.log(`🤖 RAG Hint Service: ${isConnected ? 'Connected ✅' : 'Disconnected ⚠️'}`);
    
    // Initialize Screen Overlay for visual hints
    this.screenOverlay = new ScreenOverlay();
    
    // Track current personality setting
    this.currentPersonality = 'mentor';
    this.currentHintLevel = 1;
    
    // Initialize Smart Hint Engine (detects when user is stuck)
    this.smartHintEngine = new SmartHintEngine();
    this.smartHintEngine.on('user-stuck', async (data) => {
      console.log('🆘 User appears stuck:', data.reason, '- Offering hint');
      
      // Generate a contextual hint
      try {
        const hints = await this.ragHintService.generateHints({
          topic: data.context.topic,
          question: data.context.question,
          codeContext: data.codeSnapshot,
          personality: this.currentPersonality,
          hint_level: this.currentHintLevel
        });
        
        if (hints && !this.screenOverlay.overlayWindow.isDestroyed()) {
          this.screenOverlay.overlayWindow.webContents.send('show-stuck-hint', {
            hint: hints.progressive_hints[0],
            reason: data.reason,
            severity: data.severity
          });
        }
      } catch (error) {
        console.error('Error generating stuck hint:', error);
      }
    });
    
    this.smartHintEngine.on('hint-requested', async (data) => {
      console.log('🙋 User requested hint manually');
      // Handle manual hint requests
    });
    
    // Initialize Enhanced Screen Reader for reading screen content (uses OCR + Claude backend)
    this.screenReader = new ScreenReader('http://127.0.0.1:8000', this.currentPersonality);
    this.screenReader.on('contentDetected', (data) => {
      try {
        console.log('📸 Coding content detected:', {
          topic: data.topic,
          question: data.question,
          personality: data.hints?.personality,
          progressiveHints: data.hints?.progressiveHints?.length || 0
        });
        
        // Feed Smart Hint Engine with code updates (for real-time stuck detection)
        if (data.code) {
          this.smartHintEngine.updateCodeSnapshot(data.code);
          this.smartHintEngine.updateContext(data.topic, data.question, data.code);
        }
        
        // Send progressive hints to sidebar overlay
        if (this.screenOverlay && this.screenOverlay.isActive) {
          // Send the hint data to the overlay window
          if (this.screenOverlay.overlayWindow && !this.screenOverlay.overlayWindow.isDestroyed()) {
            try {
              this.screenOverlay.overlayWindow.webContents.send('show-progressive-hints', {
                topic: data.topic,
                question: data.question,
                code: data.code || '',  // Include code for chat context
                hints: data.hints,
                personality: data.hints?.personality || this.currentPersonality
              });
            } catch (error) {
              console.log('Failed to send hints to overlay (window may be destroyed):', error.message);
            }
          }
        }
        
        // Also notify main window
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send('coding-detected', data);
        }
      } catch (error) {
        console.error('Error handling content detection:', error);
      }
    });
    
    // Initialize Universal CoDei Service with RAG integration
    this.universalService = new UniversalCoDeiService(this.ragHintService);
    
    // Set up event listeners for universal service
    this.universalService.on('solutionIntercepted', (data) => {
      console.log('🌐 Universal solution intercepted:', data);
      
      // Show hint on screen overlay
      this.screenOverlay.showHint({
        message: data.response.learningResponse || "Let's think about this together!",
        level: data.response.hintLevel || 1,
        position: { x: 50, y: 50 },
        highlight: { x: 100, y: 100, width: 300, height: 50 }
      });
    });
    
    this.universalService.on('codeCopied', (data) => {
      console.log('📋 Code copying detected:', data);
      
      // Show hint about learning
      this.screenOverlay.showHint({
        message: "Think about why this code works! Understanding > Copying 💡",
        level: 2,
        position: { x: 50, y: 100 },
      });
    });
    
    this.universalService.on('manualInvocation', (data) => {
      console.log('🔑 Socratic manually invoked:', data);
    });
    
    // Initialize the universal service
    const success = await this.universalService.initialize();
    if (success) {
      console.log('✅ Universal Socratic Service initialized');
    } else {
      console.log('⚠️ Universal Socratic Service initialization failed');
    }
    
    // Initialize file monitoring for local development
    this.fileMonitor = new FileMonitor();
    this.fileMonitor.on('fileChanged', (data) => {
      console.log('File changed:', data.filePath);
      
      // Check if this is a solution request in code comments
      if (this.containsSolutionRequest(data.content)) {
        this.universalService.interceptSolutionRequest({
          platform: 'local_file',
          type: 'code_comment',
          content: this.extractSolutionRequest(data.content),
          context: 'Code comment requesting solution'
        });
      }
    });

    // Initialize keystroke monitoring for contextual hints
    this.keystrokeMonitor = new KeystrokeMonitor();
    this.currentTypingContext = {
      buffer: [],
      lastAnalysis: Date.now()
    };
    
    this.keystrokeMonitor.on('keystrokePattern', (data) => {
      console.log('⌨️ Keystroke pattern detected:', data.patterns);
      
      // Update typing context
      this.currentTypingContext.buffer = data.recentKeystrokes || [];
      this.currentTypingContext.context = data.context;
      this.currentTypingContext.patterns = data.patterns;
      
      // Provide contextual hints based on typing behavior
      this.provideContextualHints(data);
      
      // Check for solution request patterns
      if (this.isSolutionRequestPattern(data.patterns)) {
        this.universalService.interceptSolutionRequest({
          platform: 'keystroke',
          type: 'pattern_detected',
          content: data.patterns,
          context: 'Keystroke pattern indicating solution request'
        });
      }
    });
    
    // Start keystroke monitoring
    this.keystrokeMonitor.startMonitoring();
    console.log('⌨️ Keystroke monitoring initialized');
  }
  
  // Provide contextual hints based on typing patterns
  provideContextualHints(keystrokeData) {
    const { patterns, context } = keystrokeData;
    
    // If user is hesitating (lots of backspaces), offer gentle hints
    if (patterns.some(p => p.type === 'hesitation')) {
      console.log('🤔 User seems stuck, preparing hint...');
      
      // Trigger screen analysis to provide contextual help
      if (this.screenReader && this.screenReader.isReading) {
        // The screen reader will automatically provide hints based on current screen content
        console.log('📸 Screen reader active - hints will be based on current question');
      }
    }
    
    // If syntax error patterns detected, offer specific help
    if (patterns.some(p => p.type === 'syntax_error')) {
      console.log('⚠️ Potential syntax error detected');
      
      if (this.screenOverlay && this.screenOverlay.isActive) {
        this.screenOverlay.showHint({
          message: "Check your syntax - are all brackets/parentheses closed?",
          level: 1,
          position: { x: 50, y: 150 }
        });
      }
    }
  }

  showNotification(hint) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('show-hint', hint);
    }
    
    // Also show system notification using Electron's Notification
    try {
      const notification = new Notification({
        title: 'Socratic Hint',
        body: hint.message,
        icon: path.join(__dirname, '../assets/icon.png')
      });
      
      notification.show();
    } catch (error) {
      console.log('Socratic Hint:', hint.message);
      console.log('Note: System notifications not available');
    }
  }


  containsSolutionRequest(content) {
    const solutionPatterns = [
      /\/\/\s*(?:write|create|generate|solve|complete)\s+(?:me\s+)?(?:a\s+)?(?:complete\s+)?(?:function|code|program|solution)/i,
      /\/\*\s*(?:TODO|FIXME|HACK):\s*(?:write|create|generate|solve|complete)/i,
      /\/\/\s*(?:can\s+you\s+)?(?:write|create|generate|solve|complete)/i
    ];
    
    return solutionPatterns.some(pattern => pattern.test(content));
  }

  extractSolutionRequest(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (this.containsSolutionRequest(line)) {
        return line.trim();
      }
    }
    return '';
  }

  isSolutionRequestPattern(pattern) {
    const solutionPatterns = [
      'write', 'create', 'generate', 'solve', 'complete',
      'function', 'class', 'program', 'code', 'solution'
    ];
    
    return solutionPatterns.some(keyword => 
      pattern.toLowerCase().includes(keyword)
    );
  }

  setupIPC() {
    // Handle requests from renderer process
    ipcMain.handle('start-monitoring', async (event, options) => {
      try {
        await this.fileMonitor.startMonitoring(options.watchPaths);
        await this.keystrokeMonitor.startMonitoring();
        
        // Start screen reading
        await this.screenReader.startReading();
        
        // Show the screen overlay for hints
        await this.screenOverlay.showOverlay();
        
        // DON'T hide the main window - user needs to see controls and chat
        // Keep it visible so they can interact with the overlay
        
        this.updateTrayIcon(true); // Update tray to show active
        
        // Send event to renderer to update UI
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('monitoring-started', { success: true });
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('stop-monitoring', async () => {
      try {
        await this.fileMonitor.stopMonitoring();
        await this.keystrokeMonitor.stopMonitoring();
        
        // Stop screen reading
        this.screenReader.stopReading();
        
        // Hide the screen overlay
        this.screenOverlay.hideOverlay();
        
        // Show the main window when monitoring stops
        if (this.mainWindow) {
          this.mainWindow.show();
        }
        
        this.updateTrayIcon(false); // Update tray to show inactive
        
        // Send event to renderer to update UI
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('monitoring-stopped', { success: true });
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('invoke-codei', async (event, context) => {
      return this.universalService.invokeCoDei(context);
    });

    ipcMain.handle('get-service-status', async () => {
      return this.universalService.getServiceStatus();
    });

    ipcMain.handle('set-personality', async (event, personality) => {
      // Update universal service personality
      this.universalService.learningProfile.personality = personality;
      // Store current personality for hint generation
      this.currentPersonality = personality;
      // Update screen reader personality
      if (this.screenReader) {
        this.screenReader.setPersonality(personality);
      }
      console.log(`👤 Personality set to: ${personality}`);
      return true;
    });

    ipcMain.handle('get-learning-profile', async () => {
      return this.universalService.learningProfile;
    });

    ipcMain.handle('generate-rag-hints', async (event, code, options) => {
      if (this.ragHintService) {
        return await this.ragHintService.generateHints(code, options);
      }
      return { success: false, error: 'RAG service not initialized' };
    });

    ipcMain.handle('get-rag-topics', async () => {
      if (this.ragHintService) {
        return await this.ragHintService.getAvailableTopics();
      }
      return [];
    });

    ipcMain.handle('get-rag-status', async () => {
      if (this.ragHintService) {
        return this.ragHintService.getConnectionStatus();
      }
      return { connected: false };
    });

    ipcMain.handle('analyze-code-from-ui', async (event, code, topic) => {
      // Manual analysis request from UI
      if (this.ragHintService) {
        return await this.ragHintService.generateHints(code, { topic });
      }
      return { success: false, error: 'RAG service not available' };
    });

    ipcMain.handle('get-screen-reader-status', async () => {
      return {
        isReading: this.screenReader ? this.screenReader.isReading : false,
        overlayActive: this.screenOverlay ? this.screenOverlay.isActive : false
      };
    });

    ipcMain.handle('get-overlay-status', async () => {
      return {
        isActive: this.screenOverlay ? this.screenOverlay.isActive : false,
        isReading: this.screenReader ? this.screenReader.isReading : false
      };
    });

    // Handle sidebar toggle from indicator dot
    ipcMain.on('toggle-sidebar', () => {
      if (this.screenOverlay) {
        this.screenOverlay.toggleSidebar();
      }
    });
    
    // Handle request for next hint level
    ipcMain.handle('request-next-hint', async () => {
      if (this.screenReader && this.currentHintLevel < 3) {
        this.currentHintLevel++;
        this.screenReader.setHintLevel(this.currentHintLevel);
        return { success: true, level: this.currentHintLevel };
      }
      return { success: false, message: 'Already at max hint level' };
    });
    
    // Handle reset hint level
    ipcMain.handle('reset-hint-level', async () => {
      this.currentHintLevel = 1;
      if (this.screenReader) {
        this.screenReader.setHintLevel(1);
      }
      return { success: true, level: 1 };
    });
    
    // Handle chat messages - analyze user questions in context
    ipcMain.handle('analyze-chat-message', async (event, data) => {
      try {
        const { message } = data;
        
        console.log('💬 User asked:', message);
        
        // Get screen context from passive screen recording
        const screenContext = this.screenReader ? this.screenReader.getCurrentContext() : null;
        
        // Build context string for Claude with OCR screen data
        let contextString = message;
        if (screenContext && screenContext.ocrText) {
          // Format the screen OCR data for Claude with [SCREEN:] prefix
          let screenInfo = '';
          
          if (screenContext.ocrText) {
            screenInfo += `[SCREEN: ${screenContext.ocrText.substring(0, 500)}]\n`;
          }
          
          if (screenContext.code) {
            screenInfo += `[CODE on screen: ${screenContext.code.substring(0, 300)}]\n`;
          }
          
          if (screenContext.topic) {
            screenInfo += `[TOPIC: ${screenContext.topic}]\n`;
          }
          
          // Add explicit instruction for Claude to acknowledge what it sees
          contextString = `I can see what's on your screen right now.\n\n${screenInfo}\n\nUser asks: ${message}\n\nIMPORTANT: First tell the user what you can see on their screen, then answer their question.`;
          console.log('📸 Including screen OCR context in chat');
          console.log(`📄 Screen text: ${screenContext.ocrText.substring(0, 100)}...`);
        }
        
        // Send directly to Claude backend (EXACTLY like origin/main does)
        const axios = require('axios');
        const response = await axios.post(
          'http://localhost:8000/api/code_update',
          {
            code: contextString,
            context: 'User chat',
            language: 'python'
          },
          { timeout: 15000 }
        );
        
        if (response.data && response.data.question) {
          console.log('✅ Claude responded');
          
          return {
            success: true,
            hint: response.data.question
          };
        }
        
        // Fallback response
        return {
          success: true,
          hint: `I'm here to help! What specific part would you like me to explain?`
        };
        
      } catch (error) {
        console.error('❌ Error analyzing chat message:', error.message);
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('✅ All IPC handlers registered');
  }

  async requestScreenPermissions() {
    if (process.platform === 'darwin') {
      try {
        // Request screen recording permission
        const status = systemPreferences.getMediaAccessStatus('screen');
        console.log('📱 Screen recording permission status:', status);
        
        if (status !== 'granted') {
          console.log('⚠️  Screen recording permission not granted. Requesting...');
          await systemPreferences.askForMediaAccess('screen');
        }
        
        // Note: macOS fullscreen apps run in a separate layer that Electron windows cannot overlay
        // To show overlays in fullscreen, we would need a native module using NSOpenGL or Metal
        console.log('⚠️  Note: Overlay visibility in fullscreen may be limited on macOS');
      } catch (error) {
        console.error('Failed to request screen recording permission:', error);
      }
    }
  }

  async initialize() {
    this.createTray(); // Create tray first
    this.createWindow();
    await this.requestScreenPermissions(); // Request screen recording permissions
    this.initializeServices();
    this.setupIPC();
  }
}

// App event handlers
app.whenReady().then(async () => {
  const socraticApp = new SocraticApp();
  await socraticApp.initialize();
});

app.on('window-all-closed', () => {
  // Keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    const socraticApp = new SocraticApp();
    socraticApp.initialize();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});