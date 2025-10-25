# SocraticCode Desktop - AI Coding Tutor

SocraticCode Desktop is an intelligent coding tutor that runs in the background and monitors your code in real-time. It analyzes your coding patterns, detects common mistakes, and provides contextual hints to help you become a better programmer.

## 🚀 Features

### **Real-Time Code Monitoring**
- **File System Watching**: Monitors code files across multiple directories
- **Multi-Language Support**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby
- **Intelligent Analysis**: Detects syntax errors, complexity issues, and common mistakes

### **Keystroke Pattern Analysis**
- **Typing Pattern Detection**: Identifies hesitation, mistakes, and learning opportunities
- **Context-Aware Hints**: Provides suggestions based on your current coding context
- **Adaptive Learning**: Adjusts hint levels based on your progress

### **Three-Level Hint System**
- **Level 1**: Critical issues that need immediate attention
- **Level 2**: Improvement opportunities and best practices
- **Level 3**: Advanced concepts and optimization suggestions

### **Smart Notifications**
- **System Notifications**: Non-intrusive desktop notifications
- **In-App Dashboard**: Beautiful UI showing your progress and recent hints
- **Tray Integration**: Runs quietly in the background with system tray access

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
```bash
# Clone or download the project
cd socraticcode-desktop

# Install dependencies
npm install

# Start the application
npm start

# For development
npm run dev
```

## 📱 Usage

### **Starting the Application**
1. Run `npm start` to launch SocraticCode Desktop
2. The app will appear in your system tray
3. Click the tray icon or use the main window to control monitoring

### **Monitoring Your Code**
1. Click "Start Monitoring" to begin watching your code
2. The app will automatically detect and monitor code files
3. As you code, SocraticCode will analyze your work and provide hints

### **Understanding Hints**
- **Red Border**: Critical issues requiring immediate attention
- **Orange Border**: Improvement opportunities
- **Green Border**: Advanced suggestions and optimizations

### **System Tray**
- **Right-click** the tray icon for quick access
- **Left-click** to show/hide the main window
- **Monitor Status**: See if file and keystroke monitoring are active

## 🎯 How It Works

### **File Monitoring**
- Watches common development directories (Desktop, Documents, Projects, etc.)
- Detects changes to code files in real-time
- Analyzes code for syntax errors, complexity, and best practices

### **Code Analysis**
- **Language Detection**: Automatically identifies programming language
- **Pattern Recognition**: Detects common algorithms and coding patterns
- **Mistake Detection**: Identifies common programming mistakes
- **Best Practice Suggestions**: Recommends improvements

### **Intelligent Hints**
- **Context-Aware**: Hints are relevant to what you're currently working on
- **Progressive Learning**: Adapts to your skill level over time
- **Non-Intrusive**: Only shows hints when they're truly helpful

## 🔧 Configuration

### **Default Watch Paths**
The app automatically monitors these directories:
- `~/Desktop`
- `~/Documents`
- `~/Projects`
- `~/Code`
- `~/Development`

### **Supported File Extensions**
- `.js`, `.ts` (JavaScript/TypeScript)
- `.py` (Python)
- `.java` (Java)
- `.cpp`, `.c` (C/C++)
- `.cs` (C#)
- `.go` (Go)
- `.rs` (Rust)
- `.php` (PHP)
- `.rb` (Ruby)

## 🏗️ Architecture

### **Main Process** (`src/main.js`)
- Electron main process
- Manages windows, tray, and system integration
- Coordinates between services

### **Services**
- **FileMonitor**: Watches file system changes
- **KeystrokeMonitor**: Analyzes typing patterns
- **CodeAnalyzer**: Performs intelligent code analysis
- **HintSystem**: Generates contextual hints

### **Renderer** (`src/renderer/`)
- Beautiful, modern UI
- Real-time statistics and monitoring
- Hint display and management

## 🔒 Privacy & Security

- **Local Processing**: All analysis happens locally on your machine
- **No Data Collection**: Your code is never sent to external servers
- **Keystroke Monitoring**: Currently simulated (requires platform-specific implementation)
- **File Access**: Only reads files you're actively working on

## 🚧 Development Status

### **Completed Features**
- ✅ Electron desktop application
- ✅ File system monitoring
- ✅ Code analysis engine
- ✅ Intelligent hint system
- ✅ Beautiful UI with real-time updates
- ✅ System tray integration
- ✅ Multi-language support

### **In Progress**
- 🔄 Real keystroke monitoring (requires platform-specific libraries)
- 🔄 Advanced pattern detection
- 🔄 Learning progress tracking

### **Future Enhancements**
- 📋 User authentication and cloud sync
- 📋 Custom hint database
- 📋 Integration with popular IDEs
- 📋 Machine learning-based suggestions
- 📋 Collaborative learning features

## 🐛 Troubleshooting

### **App Won't Start**
- Ensure Node.js is installed
- Run `npm install` to install dependencies
- Check console for error messages

### **File Monitoring Not Working**
- Check file permissions
- Ensure files have supported extensions
- Verify watch paths exist

### **No Hints Appearing**
- Make sure monitoring is active
- Check if files are being detected
- Look for errors in the console

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the console logs for error messages

---

**SocraticCode Desktop** - Learn to code better, one hint at a time! 🎓✨

