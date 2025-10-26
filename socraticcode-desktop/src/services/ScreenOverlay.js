const { BrowserWindow, screen, nativeTheme } = require('electron');
const EventEmitter = require('events');

class ScreenOverlay extends EventEmitter {
  constructor() {
    super();
    this.overlayWindow = null;
    this.indicatorWindow = null;
    this.isActive = false;
    this.sidebarVisible = true;
    this.screenBounds = null;
    this.lastToggleTime = 0; // Initialize toggle timing
    this.creationTime = 0; // Track when sidebar was created to prevent auto-toggles
  }

  // Safe logging that won't crash on EIO errors
  safeLog(...args) {
    try {
      this.safeLog(...args);
    } catch (error) {
      // Silently ignore write errors
    }
  }

  async showOverlay() {
    try {
      // Check if overlay is already active
      if (this.isActive) {
        this.safeLog('🎯 Overlay already active');
        return true;
      }

      // Reset state for fresh start
      this.sidebarVisible = true; // Start with sidebar visible
      this.lastToggleTime = 0;
      this.safeLog('🎯 Resetting overlay state for fresh start');

      // Get primary display bounds
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      this.screenBounds = { width, height };

      // Create the indicator dot at the top right
      this.createIndicatorDot(width, height);

      // Create an overlay window that covers the right side (400px width like Cursor)
      const sidebarWidth = 400;
      this.overlayWindow = new BrowserWindow({
        width: sidebarWidth,
        height: height,
        x: width - sidebarWidth,
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
        // Make it NOT click-through - solid sidebar
        ignoreMouseEvents: false,
        hasShadow: false,
        visibleOnAllWorkspaces: true,
        fullscreenable: false,
        simpleFullscreen: false,
        // macOS-specific flags for always-on-top in fullscreen
        level: 'screen-saver', // Higher level for always-on-top
        acceptFirstMouse: true,
        // Additional macOS flags for maximum visibility
        titleBarStyle: 'hidden',
        vibrancy: 'under-window',
        // Force visibility across all spaces
        show: false, // Don't show immediately, we'll show it manually
      });
      
      // Make the sidebar solid and clickable
      this.overlayWindow.setIgnoreMouseEvents(false);
      
      // Set visible on all workspaces immediately (works better when called early on macOS)
      if (process.platform === 'darwin') {
        try {
          this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          this.safeLog('🎯 Sidebar set to visible on all workspaces at creation');
        } catch (error) {
          this.safeLog('Failed to set sidebar visibility at creation:', error);
        }
      }
      
      // Force always on top with special level (like Zoom does)
      this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');

      // Load overlay HTML
      this.overlayWindow.loadURL(`file://${__dirname}/../overlay/index.html`);

      // Make it visible
      this.overlayWindow.show();
      
      // Set creation time NOW (when window is actually shown) for grace period protection
      this.creationTime = Date.now();
      this.safeLog('🎯 Sidebar window shown - grace period starts now');
      
      // IMMEDIATELY set visible on all workspaces AFTER show() - this is critical for first-run visibility on macOS
      if (process.platform === 'darwin') {
        try {
          this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          this.safeLog('🎯 Sidebar set to visible on all workspaces immediately after show()');
        } catch (error) {
          this.safeLog('Failed to set sidebar visibility immediately:', error);
        }
      }
      
      // Force focus and bring to front
      this.overlayWindow.focus();
      this.overlayWindow.moveTop();
      
      // Set visible on fullscreen apps (must be called after window is shown on macOS)
      if (process.platform === 'darwin') {
        // Use setTimeout to ensure window is fully loaded
        setTimeout(() => {
          try {
            this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            
            // Force to top using electron's internal API
            this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
            this.overlayWindow.setAlwaysOnTop(true, 'floating');
            this.overlayWindow.setAlwaysOnTop(true, 'normal');
            this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
            
            // Force show and focus again
            this.overlayWindow.show();
            this.overlayWindow.focus();
            this.overlayWindow.moveTop();
            
            this.safeLog('🎯 Sidebar set to be visible on fullscreen apps with multiple levels');
          } catch (error) {
            this.safeLog('Failed to set sidebar fullscreen visibility:', error);
          }
        }, 500);
        
        // Also set it on the ready event for better reliability
        this.overlayWindow.webContents.once('did-finish-load', () => {
          setTimeout(() => {
            try {
              this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
              this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
              this.overlayWindow.setAlwaysOnTop(true, 'floating');
              this.overlayWindow.setAlwaysOnTop(true, 'normal');
              this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
              this.overlayWindow.show();
              this.overlayWindow.focus();
              this.overlayWindow.moveTop();
              this.safeLog('🎯 Sidebar visibility set after load event');
            } catch (error) {
              this.safeLog('Failed to set sidebar visibility after load:', error);
            }
          }, 200);
        });
      }

    this.isActive = true;
    this.safeLog('🎯 Screen overlay activated');
      this.safeLog('🎯 Overlay window bounds:', this.overlayWindow.getBounds());
      this.safeLog('🎯 Overlay window visible:', this.overlayWindow.isVisible());
      this.safeLog('🎯 Overlay window focused:', this.overlayWindow.isFocused());

      // Send screen bounds to overlay
      this.overlayWindow.webContents.send('screen-bounds', this.screenBounds);

      // Add a periodic refresh to maintain sidebar visibility
      this.sidebarRefreshInterval = setInterval(() => {
        try {
          if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
            this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            // Only refresh visibility if sidebar should be visible
            if (this.sidebarVisible && !this.overlayWindow.isVisible()) {
              this.overlayWindow.show();
            } else if (!this.sidebarVisible && this.overlayWindow.isVisible()) {
              this.overlayWindow.hide();
            }
          }
        } catch (error) {
          // Ignore errors, window might be destroyed
        }
      }, 3000); // Refresh every 3 seconds for better visibility

      return true;
    } catch (error) {
      this.safeLog('Failed to show overlay:', error);
      return false;
    }
  }

  createIndicatorDot(screenWidth, screenHeight) {
    // Check if indicator already exists
    if (this.indicatorWindow && !this.indicatorWindow.isDestroyed()) {
      this.safeLog('🎯 Indicator already exists, skipping creation');
      return;
    }

    // Create a small indicator rectangle at the top right
    this.indicatorWindow = new BrowserWindow({
      width: 40,
      height: 40,
      x: screenWidth - 50,
      y: 10,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      ignoreMouseEvents: false,
      hasShadow: false,
      visibleOnAllWorkspaces: true,
      fullscreenable: false,
      simpleFullscreen: false,
      // macOS-specific flags for always-on-top in fullscreen
      level: 'screen-saver',
      acceptFirstMouse: true,
      // Additional macOS flags for maximum visibility
      titleBarStyle: 'hidden',
      vibrancy: 'under-window',
      // Force visibility across all spaces
      show: false, // Don't show immediately, we'll show it manually
    });
    
    // Force always on top with special level (like Zoom does)
    this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
    this.indicatorWindow.setAlwaysOnTop(true, 'floating');
    this.indicatorWindow.setAlwaysOnTop(true, 'torn-off-menu');
    this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
    this.safeLog('🎯 Indicator set to always on top with screen-saver level');

    // Create HTML for the indicator rectangle
    const indicatorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            overflow: hidden;
          }
          .indicator-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }
          .indicator {
            width: 28px;
            height: 28px;
            background: var(--button-bg, #2d2d2d);
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 0 15px var(--button-shadow, rgba(45, 45, 45, 0.8));
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .indicator:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px var(--button-shadow-hover, rgba(45, 45, 45, 1));
          }
          .indicator::before {
            content: '';
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-right: 8px solid var(--button-icon, white);
            margin-left: 2px;
            transition: transform 0.3s ease;
          }
          
          /* When sidebar is open, arrow points left (to close) */
          .indicator.open::before {
            border-right: none;
            border-left: 8px solid var(--button-icon, white);
            margin-left: 0;
            margin-right: 2px;
          }

          .indicator.active {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          
          /* Dark mode styles */
          .dark-mode {
            --button-bg: #2d2d2d;
            --button-shadow: rgba(45, 45, 45, 0.8);
            --button-shadow-hover: rgba(45, 45, 45, 1);
            --button-icon: white;
          }
          
          /* Light mode styles */
          .light-mode {
            --button-bg: #f0f0f0;
            --button-shadow: rgba(240, 240, 240, 0.8);
            --button-shadow-hover: rgba(240, 240, 240, 1);
            --button-icon: #333333;
          }
        </style>
      </head>
      <body>
        <div class="indicator-container">
          <div class="indicator active open" id="indicator"></div>
        </div>
        <script>
          const indicator = document.getElementById('indicator');
          const { ipcRenderer } = require('electron');
          
          // Listen for theme changes
          ipcRenderer.on('theme-changed', (event, theme) => {
            document.body.className = theme + '-mode';
          });
          
          // Add comprehensive event debugging
          ['click', 'mousedown', 'mouseup', 'focus', 'blur', 'mouseenter', 'mouseleave'].forEach(function(eventType) {
            indicator.addEventListener(eventType, function(event) {
              console.log('🎯 Indicator ' + eventType + ' event:', {
                type: event.type,
                target: event.target.tagName,
                timestamp: Date.now(),
                button: event.button,
                detail: event.detail
              });
            });
          });

          // Block all clicks for 3 seconds after window creation
          let indicatorWindowCreationTime = Date.now();
          indicator.addEventListener('click', (event) => {
            const now = Date.now();
            const timeSinceCreation = now - indicatorWindowCreationTime;
            
            // Block ALL clicks for 3 seconds after window creation
            if (timeSinceCreation < 3000) {
              console.log('🎯 Blocked indicator dot click - too soon after window creation (' + timeSinceCreation + 'ms ago, need 3000ms grace period)');
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            
            console.log('🎯 Indicator dot clicked - allowed (trusted click after grace period)');
            ipcRenderer.send('toggle-sidebar', { source: 'indicator' });
          });
        </script>
      </body>
      </html>
    `;

    this.indicatorWindow.loadURL(`data:text/html,${encodeURIComponent(indicatorHTML)}`);
    this.indicatorWindow.show();
    
    // Force focus and bring to front immediately
    this.indicatorWindow.focus();
    this.indicatorWindow.moveTop();
    
    // Set visible on fullscreen apps (must be called after window is shown on macOS)
    if (process.platform === 'darwin') {
      // Use setTimeout to ensure window is fully loaded
      setTimeout(() => {
        try {
          this.indicatorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          
          // Force to top using electron's internal API with multiple levels
          this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
          this.indicatorWindow.setAlwaysOnTop(true, 'floating');
          this.indicatorWindow.setAlwaysOnTop(true, 'torn-off-menu');
          this.indicatorWindow.setAlwaysOnTop(true, 'modal-panel');
          this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
          
          // Force focus and show again
          this.indicatorWindow.focus();
          this.indicatorWindow.show();
          this.indicatorWindow.moveTop();
          
          this.safeLog('🎯 Indicator set to be visible on fullscreen apps with multiple levels');
        } catch (error) {
          this.safeLog('Failed to set indicator fullscreen visibility:', error);
        }
      }, 500);
      
      // Also try setting it on the ready event
      this.indicatorWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          try {
            this.indicatorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
            this.indicatorWindow.setAlwaysOnTop(true, 'floating');
            this.indicatorWindow.setAlwaysOnTop(true, 'torn-off-menu');
            this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
            this.indicatorWindow.focus();
            this.indicatorWindow.show();
            this.safeLog('🎯 Indicator visibility set again after load');
          } catch (error) {
            this.safeLog('Failed to set indicator visibility after load:', error);
          }
        }, 200);
      });
      
      // Add a periodic refresh to maintain always-on-top
      this.indicatorRefreshInterval = setInterval(() => {
        try {
          if (this.indicatorWindow && !this.indicatorWindow.isDestroyed()) {
            this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
            this.indicatorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            // Force show and focus to maintain visibility
            if (!this.indicatorWindow.isVisible()) {
              this.indicatorWindow.show();
            }
          }
        } catch (error) {
          // Ignore errors, window might be destroyed
        }
      }, 3000); // Refresh every 3 seconds for better visibility
    }
    
    this.safeLog('🎯 Indicator dot created');
    this.safeLog('🎯 Indicator window bounds:', this.indicatorWindow.getBounds());
    this.safeLog('🎯 Indicator window visible:', this.indicatorWindow.isVisible());
    this.safeLog('🎯 Indicator window focused:', this.indicatorWindow.isFocused());
  }

  updateTheme(theme) {
    if (this.indicatorWindow && !this.indicatorWindow.isDestroyed()) {
      this.indicatorWindow.webContents.send('theme-changed', theme);
    }
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('theme-changed', theme);
    }
  }

  hideOverlay() {
    if (this.overlayWindow) {
      this.overlayWindow.close();
      this.overlayWindow = null;
    }
    if (this.indicatorWindow) {
      this.indicatorWindow.close();
      this.indicatorWindow = null;
    }
    // Clear the refresh intervals
    if (this.indicatorRefreshInterval) {
      clearInterval(this.indicatorRefreshInterval);
      this.indicatorRefreshInterval = null;
    }
    if (this.sidebarRefreshInterval) {
      clearInterval(this.sidebarRefreshInterval);
      this.sidebarRefreshInterval = null;
    }
    this.isActive = false;
    this.safeLog('🎯 Screen overlay deactivated');
  }

  toggleSidebar() {
    this.safeLog('🎯 toggleSidebar() called');
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.safeLog('🎯 Cannot toggle sidebar - overlay window is destroyed or missing');
      return;
    }
    
    // Prevent toggles immediately after creation (grace period to avoid auto-triggers)
    const now = Date.now();
    const timeSinceCreation = now - this.creationTime;
    this.safeLog(`🎯 Toggle check - creationTime: ${this.creationTime}, now: ${now}, timeSince: ${timeSinceCreation}ms`);
    if (this.creationTime && timeSinceCreation < 3000) {
      this.safeLog(`🎯 Sidebar toggle blocked - too soon after creation (${timeSinceCreation}ms ago, need 3000ms grace period)`);
      return;
    }
    
    // Prevent rapid toggling - add a small delay
    if (this.lastToggleTime && (now - this.lastToggleTime) < 500) {
      this.safeLog(`🎯 Sidebar toggle ignored - too rapid (${now - this.lastToggleTime}ms ago, need 500ms)`);
      return;
    }

    this.lastToggleTime = now;
    this.sidebarVisible = !this.sidebarVisible;

    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      const sidebarWidth = 400;

      if (this.sidebarVisible) {
        // Slide sidebar in from the right
        this.safeLog('🎯 Showing sidebar - sliding in');
        this.overlayWindow.setBounds({
          x: width - sidebarWidth,
          y: 0,
          width: sidebarWidth,
          height: height
        }, true); // animate = true
        this.overlayWindow.show();
        
        // Update indicator arrow direction (pointing left when open)
        if (this.indicatorWindow && !this.indicatorWindow.isDestroyed()) {
          try {
            this.indicatorWindow.webContents.executeJavaScript(`
              const indicator = document.getElementById('indicator');
              if (indicator) {
                indicator.classList.add('open');
              }
            `).catch(err => {
              // Silently ignore - indicator may not be ready
            });
          } catch (error) {
            // Silently ignore - indicator may not be ready
          }
        }
      } else {
        // Slide sidebar out to the right (off-screen)
        this.safeLog('🎯 Hiding sidebar - sliding out');
        this.overlayWindow.setBounds({
          x: width, // Move completely off-screen to the right
          y: 0,
          width: sidebarWidth,
          height: height
        }, true); // animate = true
        
        // Update indicator arrow direction (pointing right when closed)
        if (this.indicatorWindow && !this.indicatorWindow.isDestroyed()) {
          try {
            this.indicatorWindow.webContents.executeJavaScript(`
              const indicator = document.getElementById('indicator');
              if (indicator) {
                indicator.classList.remove('open');
              }
            `).catch(err => {
              // Silently ignore - indicator may not be ready
            });
          } catch (error) {
            // Silently ignore - indicator may not be ready
          }
        }
        
        // After animation completes (300ms), optionally hide to save resources
        setTimeout(() => {
          if (!this.sidebarVisible && this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            // Keep it rendered but off-screen (don't hide completely)
            // this.overlayWindow.hide();
          }
        }, 300);
      }
      
      this.safeLog(`🎯 Sidebar ${this.sidebarVisible ? 'shown' : 'hidden'} with animation`);
    } catch (error) {
      this.safeLog('🎯 Error toggling sidebar:', error.message);
    }
  }

  showHint(hintData) {
    if (!this.overlayWindow || !this.isActive) {
      return;
    }

    try {
      // Check if window is still valid before sending
      if (this.overlayWindow.isDestroyed()) {
        this.safeLog('Overlay window has been destroyed, skipping hint');
        return;
      }
      
      // Additional check for webContents
      if (!this.overlayWindow.webContents || this.overlayWindow.webContents.isDestroyed()) {
        this.safeLog('Overlay webContents has been destroyed, skipping hint');
        return;
      }
      
      // Send hint to overlay window
      this.overlayWindow.webContents.send('show-hint', hintData);
    } catch (error) {
      this.safeLog('Error sending hint to overlay:', error.message);
    }
  }

  makeClickable() {
    if (this.overlayWindow) {
      this.overlayWindow.setIgnoreMouseEvents(false);
    }
  }

  makeClickThrough() {
    if (this.overlayWindow) {
      this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  }
}

module.exports = ScreenOverlay;
