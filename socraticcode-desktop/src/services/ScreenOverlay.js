const { BrowserWindow, screen } = require('electron');
const EventEmitter = require('events');

class ScreenOverlay extends EventEmitter {
  constructor() {
    super();
    this.overlayWindow = null;
    this.isActive = false;
    this.screenBounds = null;
  }

  async showOverlay() {
    try {
      // Get primary display bounds
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      this.screenBounds = { width, height };

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

  hideOverlay() {
    if (this.overlayWindow) {
      this.overlayWindow.close();
      this.overlayWindow = null;
    }
    this.isActive = false;
    console.log('🎯 Screen overlay deactivated');
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
