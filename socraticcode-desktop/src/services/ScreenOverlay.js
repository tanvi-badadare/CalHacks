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
  }

  async showOverlay() {
    try {
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
      });
      
      // Make the sidebar solid and clickable
      this.overlayWindow.setIgnoreMouseEvents(false);
      
      // Force always on top with special level (like Zoom does)
      this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');

      // Load overlay HTML
      this.overlayWindow.loadURL(`file://${__dirname}/../overlay/index.html`);

      // Make it visible
      this.overlayWindow.show();
      
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
            
            console.log('🎯 Sidebar set to be visible on fullscreen apps with multiple levels');
          } catch (error) {
            console.error('Failed to set sidebar fullscreen visibility:', error);
          }
        }, 500);
      }

      this.isActive = true;
      console.log('🎯 Screen overlay activated');

      // Send screen bounds to overlay
      this.overlayWindow.webContents.send('screen-bounds', this.screenBounds);

      return true;
    } catch (error) {
      console.error('Failed to show overlay:', error);
      return false;
    }
  }

  createIndicatorDot(screenWidth, screenHeight) {
    // Create a small indicator dot at the top right
    this.indicatorWindow = new BrowserWindow({
      width: 24,
      height: 24,
      x: screenWidth - 30,
      y: 10,
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
      ignoreMouseEvents: false,
      hasShadow: false,
      visibleOnAllWorkspaces: true,
      fullscreenable: false,
      simpleFullscreen: false,
      // macOS-specific flags for always-on-top in fullscreen
      level: 'screen-saver',
      acceptFirstMouse: true,
    });
    
    // Force always on top with special level (like Zoom does)
    this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
    console.log('🎯 Indicator set to always on top with screen-saver level');

    // Create HTML for the indicator
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
          }
          .indicator-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }
          .indicator {
            width: 12px;
            height: 12px;
            background: #00d4aa;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 15px rgba(0, 212, 170, 0.8);
            transition: all 0.2s ease;
          }
          .indicator:hover {
            transform: scale(1.15);
            box-shadow: 0 0 20px rgba(0, 212, 170, 1);
          }

          .indicator.active {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        </style>
      </head>
      <body>
        <div class="indicator-container">
          <div class="indicator active" id="indicator"></div>
        </div>
        <script>
          const indicator = document.getElementById('indicator');
          const { ipcRenderer } = require('electron');
          
          indicator.addEventListener('click', () => {
            ipcRenderer.send('toggle-sidebar');
          });
        </script>
      </body>
      </html>
    `;

    this.indicatorWindow.loadURL(`data:text/html,${encodeURIComponent(indicatorHTML)}`);
    this.indicatorWindow.show();
    
    // Set visible on fullscreen apps (must be called after window is shown on macOS)
    if (process.platform === 'darwin') {
      // Use setTimeout to ensure window is fully loaded
      setTimeout(() => {
        try {
          this.indicatorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          
          // Force to top using electron's internal API
          this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
          this.indicatorWindow.setAlwaysOnTop(true, 'floating');
          this.indicatorWindow.setAlwaysOnTop(true, 'normal');
          this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
          
          console.log('🎯 Indicator set to be visible on fullscreen apps with multiple levels');
        } catch (error) {
          console.error('Failed to set indicator fullscreen visibility:', error);
        }
      }, 500);
      
      // Also try setting it on the ready event
      this.indicatorWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          try {
            this.indicatorWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            this.indicatorWindow.setAlwaysOnTop(true, 'screen-saver');
            console.log('🎯 Indicator visibility set again after load');
          } catch (error) {
            console.error('Failed to set indicator visibility after load:', error);
          }
        }, 200);
      });
    }
    
    console.log('🎯 Indicator dot created');
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
    this.isActive = false;
    console.log('🎯 Screen overlay deactivated');
  }

  toggleSidebar() {
    if (!this.overlayWindow) return;
    
    this.sidebarVisible = !this.sidebarVisible;
    
    if (this.sidebarVisible) {
      // Show sidebar
      this.overlayWindow.show();
    } else {
      // Hide sidebar
      this.overlayWindow.hide();
    }
    
    console.log(`🎯 Sidebar ${this.sidebarVisible ? 'shown' : 'hidden'}`);
  }

  showHint(hintData) {
    if (!this.overlayWindow || !this.isActive) {
      return;
    }

    // Send hint to overlay window
    this.overlayWindow.webContents.send('show-hint', hintData);
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
