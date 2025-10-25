const { BrowserWindow, screen } = require('electron');
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
      });
      
      // Make the sidebar solid and clickable
      this.overlayWindow.setIgnoreMouseEvents(false);

      // Load overlay HTML
      this.overlayWindow.loadURL(`file://${__dirname}/../overlay/index.html`);

      // Make it visible
      this.overlayWindow.show();

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
    });

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
          }
          .indicator {
            width: 12px;
            height: 12px;
            background: #00d4aa;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 212, 170, 0.6);
            transition: all 0.2s ease;
          }
          .indicator:hover {
            transform: scale(1.2);
            box-shadow: 0 0 15px rgba(0, 212, 170, 0.8);
          }
          .indicator.active {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      </head>
      <body>
        <div class="indicator active" id="indicator"></div>
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
