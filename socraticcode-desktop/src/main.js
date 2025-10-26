const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, systemPreferences } = require('electron');
const path = require('path');
const FileMonitor = require('./services/FileMonitor');
const KeystrokeMonitor = require('./services/KeystrokeMonitor');
const UniversalCoDeiService = require('./services/UniversalCoDeiService');
const ScreenOverlay = require('./services/ScreenOverlay');
const ScreenReader = require('./services/ScreenReader');

class CoDeiApp {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.fileMonitor = null;
    this.keystrokeMonitor = null;
    this.universalService = null;
    this.screenOverlay = null;
    this.screenReader = null;
    this.isDev = process.argv.includes('--dev');
    this.isStartingMonitoring = false;
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
    console.log('🟢 IPC: Loading renderer HTML file');
    this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      console.log('🟢 IPC: Main window ready to show');
      this.mainWindow.show();
      
      // Always open dev tools for debugging
      this.mainWindow.webContents.openDevTools();
    });

    // Add debugging for renderer events
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('🟢 IPC: Renderer finished loading');
    });

    this.mainWindow.webContents.on('dom-ready', () => {
      console.log('🟢 IPC: Renderer DOM ready');
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
    
        this.tray.setToolTip('CoDei - AI Coding Tutor');
    
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
            label: 'CoDei',
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
            label: 'Quit CoDei',
            click: () => {
              app.isQuiting = true;
              app.quit();
            }
          }
        ]);

    this.tray.setContextMenu(contextMenu);
  }

  async initializeServices() {
    // Initialize Screen Overlay for visual hints (but don't show it yet)
    this.screenOverlay = new ScreenOverlay();
    
    // Initialize Screen Reader for reading screen content (but don't start it yet)
    this.screenReader = new ScreenReader();
    this.screenReader.on('contentDetected', (data) => {
      try {
        console.log('📸 Content detected:', data);
        
        // Show hint on screen overlay only if it's initialized and active
        if (this.screenOverlay && this.screenOverlay.isActive) {
          this.screenOverlay.showHint({
            message: data.hint,
            level: 1,
            position: { x: 50, y: 50 },
          });
        }
      } catch (error) {
        console.error('Error handling content detection:', error.message);
        // Don't let content detection errors crash the app
      }
    });
    
    // Initialize Universal CoDei Service
    this.universalService = new UniversalCoDeiService();
    
    // Set up event listeners for universal service
    this.universalService.on('solutionIntercepted', (data) => {
      console.log('🌐 Universal solution intercepted:', data);
      
      // Show hint on screen overlay only if it's active
      if (this.screenOverlay && this.screenOverlay.isActive) {
        this.screenOverlay.showHint({
          message: data.response.learningResponse || "Let's think about this together!",
          level: data.response.hintLevel || 1,
          position: { x: 50, y: 50 },
          highlight: { x: 100, y: 100, width: 300, height: 50 }
        });
      }
    });
    
    this.universalService.on('codeCopied', (data) => {
      console.log('📋 Code copying detected:', data);
      
      // Show hint about learning only if overlay is active
      if (this.screenOverlay && this.screenOverlay.isActive) {
        this.screenOverlay.showHint({
          message: "Think about why this code works! Understanding > Copying 💡",
          level: 2,
          position: { x: 50, y: 100 },
        });
      }
    });
    
    this.universalService.on('manualInvocation', (data) => {
      console.log('🔑 CoDei manually invoked:', data);
    });
    
    // Don't initialize the universal service yet - wait for user to start monitoring
    console.log('✅ Universal CoDei Service ready for initialization');
    
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

    // Initialize keystroke monitoring
    this.keystrokeMonitor = new KeystrokeMonitor();
    this.keystrokeMonitor.on('patternDetected', (pattern) => {
      console.log('Pattern detected:', pattern);
      
      // Check for solution request patterns in keystrokes
      if (this.isSolutionRequestPattern(pattern)) {
        this.universalService.interceptSolutionRequest({
          platform: 'keystroke',
          type: 'pattern_detected',
          content: pattern,
          context: 'Keystroke pattern indicating solution request'
        });
      }
    });
  }

  showNotification(hint) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('show-hint', hint);
    }
    
    // Also show system notification using Electron's Notification
    try {
      const notification = new Notification({
        title: 'CoDei Hint',
        body: hint.message,
        icon: path.join(__dirname, '../assets/icon.png')
      });
      
      notification.show();
    } catch (error) {
      console.log('CoDei Hint:', hint.message);
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
        console.log('🟢 IPC: start-monitoring handler called');
        
        // Prevent multiple simultaneous start-monitoring calls
        if (this.isStartingMonitoring) {
          console.log('⚠️ Start monitoring already in progress, skipping');
          return { success: false, error: 'Start monitoring already in progress' };
        }
        
        this.isStartingMonitoring = true;
        // Initialize the universal service when user starts monitoring
        if (!this.universalService.isActive) {
          const success = await this.universalService.initialize();
          if (!success) {
            console.log('⚠️ Universal CoDei Service initialization failed');
            return { success: false, error: 'Failed to initialize Universal CoDei Service' };
          }
          console.log('✅ Universal CoDei Service initialized');
        }
        
        await this.fileMonitor.startMonitoring(options.watchPaths);
        await this.keystrokeMonitor.startMonitoring();
        
        // Start screen reading
        await this.screenReader.startReading();
        
        // Show the screen overlay for hints
        await this.screenOverlay.showOverlay();
        
        // Note: Theme will be applied when overlay is created
        
        // Send success response to renderer first
        console.log('🟢 IPC: Sending monitoring-started event to renderer');
        event.sender.send('monitoring-started', { success: true });
        console.log('🟢 IPC: monitoring-started event sent to renderer');
        
        // Keep main window visible - user can manually hide it if desired
        console.log('🟢 IPC: Monitoring started - main window remains visible');
        
        this.updateTrayIcon(true); // Update tray to show active
        this.isStartingMonitoring = false;
        return { success: true };
      } catch (error) {
        this.isStartingMonitoring = false;
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
        
        // Send monitoring stopped event to renderer
        console.log('🟢 IPC: Sending monitoring-stopped event to renderer');
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('monitoring-stopped', { success: true });
          console.log('🟢 IPC: monitoring-stopped event sent to renderer');
        }
        
        // Show the main window when monitoring stops
        if (this.mainWindow) {
          this.mainWindow.show();
        }
        
        this.updateTrayIcon(false); // Update tray to show inactive
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

    ipcMain.handle('get-overlay-status', async () => {
      return {
        isActive: this.screenOverlay ? this.screenOverlay.isActive : false
      };
    });

    ipcMain.handle('set-personality', async (event, personality) => {
      // Update universal service personality
      this.universalService.learningProfile.personality = personality;
      return true;
    });

    ipcMain.handle('get-learning-profile', async () => {
      return this.universalService.learningProfile;
    });

    // Handle sidebar toggle from indicator dot
    ipcMain.on('toggle-sidebar', (event, data) => {
      console.log('🎯 toggle-sidebar IPC received from:', data?.source || 'unknown');
      console.log('🎯 Stack trace:', new Error().stack);
      console.log('🎯 Calling screenOverlay.toggleSidebar()');
      if (this.screenOverlay && this.screenOverlay.isActive) {
        this.screenOverlay.toggleSidebar();
      } else {
        console.log('🎯 Cannot toggle sidebar - overlay not active');
      }
    });

    ipcMain.on('close-app', () => {
      console.log('🚪 Close button clicked - shutting down CoDei');
      app.isQuiting = true;
      app.quit();
    });

    // Handle "show" command from sidebar
    ipcMain.on('get-screen-content', async (event) => {
      console.log('📸 get-screen-content IPC received');
      try {
        if (this.screenReader && this.screenReader.isReading) {
          const screenInfo = await this.screenReader.getScreenDescription();
          
          // Send screen description back to renderer
          if (this.screenOverlay && this.screenOverlay.isActive && this.screenOverlay.overlayWindow) {
            this.screenOverlay.overlayWindow.webContents.send('screen-content', {
              description: screenInfo.hasScreen ? 
                `I can see your screen! Last captured ${Math.round((Date.now() - screenInfo.timestamp) / 1000)}s ago. The screen shows a ${screenInfo.description}.` :
                'Screen capture is not available right now.',
              timestamp: screenInfo.timestamp
            });
          }
        } else {
          // Send error if screen reading not active
          if (this.screenOverlay && this.screenOverlay.isActive && this.screenOverlay.overlayWindow) {
            this.screenOverlay.overlayWindow.webContents.send('screen-content', {
              description: 'Screen reading is not active. Please start monitoring first.'
            });
          }
        }
      } catch (error) {
        console.error('Error getting screen content:', error);
        if (this.screenOverlay && this.screenOverlay.isActive && this.screenOverlay.overlayWindow) {
          this.screenOverlay.overlayWindow.webContents.send('screen-content', {
            description: 'Error capturing screen: ' + error.message
          });
        }
      }
    });
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
  const codeiApp = new CoDeiApp();
  await codeiApp.initialize();
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
    const codeiApp = new CoDeiApp();
    codeiApp.initialize();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});