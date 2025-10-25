const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class FileMonitor extends EventEmitter {
  constructor() {
    super();
    this.watcher = null;
    this.watchPaths = [];
    this.fileExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb'];
  }

  async startMonitoring(paths = []) {
    try {
      // Default to common development directories if no paths provided
      if (paths.length === 0) {
        paths = this.getDefaultWatchPaths();
      }

      this.watchPaths = paths;
      
      console.log('Starting file monitoring for paths:', paths);

      this.watcher = chokidar.watch(paths, {
        ignored: [
          /node_modules/,
          /\.git/,
          /\.vscode/,
          /\.idea/,
          /dist/,
          /build/,
          /coverage/,
          /\.DS_Store/,
          /__pycache__/,
          /\.env/,
          /\.cache/,
          /\.tmp/,
          /\.temp/,
          /venv/,
          /env/,
          /\.pytest_cache/,
          /\.mypy_cache/,
          /GradescopeProject/,
          /ocr_env/,
          /site-packages/,
          /\.pyc$/,
          /package-lock\.json$/,
          /yarn\.lock$/
        ],
        persistent: true,
        ignoreInitial: true,
        depth: 2 // Limit depth to prevent deep recursion
      });

      this.watcher
        .on('change', async (filePath) => {
          await this.handleFileChange(filePath);
        })
        .on('add', async (filePath) => {
          await this.handleFileChange(filePath);
        })
        .on('error', (error) => {
          console.error('File watcher error:', error);
        });

      console.log('File monitoring started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start file monitoring:', error);
      throw error;
    }
  }

  async stopMonitoring() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('File monitoring stopped');
    }
  }

  async handleFileChange(filePath) {
    try {
      // Check if file has a supported extension
      if (!this.isSupportedFile(filePath)) {
        return;
      }

      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);

      this.emit('fileChanged', {
        filePath,
        content,
        size: stats.size,
        modified: stats.mtime,
        extension: path.extname(filePath)
      });

    } catch (error) {
      console.error('Error handling file change:', error);
    }
  }

  isSupportedFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.fileExtensions.includes(ext);
  }

  getDefaultWatchPaths() {
    const homeDir = require('os').homedir();
    const os = require('os');
    
    // Cross-platform project path detection
    let projectPath;
    if (os.platform() === 'win32') {
      // Windows: Look for CalHacks in common locations
      projectPath = path.join(homeDir, 'Desktop', 'CalHacks');
    } else {
      // macOS/Linux: Use Desktop
      projectPath = path.join(homeDir, 'Desktop', 'CalHacks');
    }
    
    // Check if the project exists and get specific subdirectories
    try {
      require('fs').accessSync(projectPath);
      
      // Only monitor the desktop app src folder to avoid EMFILE errors
      const specificPaths = [
        path.join(projectPath, 'socraticcode-desktop', 'src')
      ].filter(p => {
        try {
          require('fs').accessSync(p);
          return true;
        } catch {
          return false;
        }
      });
      
      console.log('Monitoring specific paths:', specificPaths);
      return specificPaths;
    } catch {
      console.log('CalHacks project not found, monitoring disabled');
      return [];
    }
  }

  getWatchStatus() {
    return {
      isActive: this.watcher !== null,
      watchPaths: this.watchPaths,
      supportedExtensions: this.fileExtensions
    };
  }
}

module.exports = FileMonitor;

