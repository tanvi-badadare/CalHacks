# Real Screen Reading Implementation

## 🎯 What Changed

### Before (Simulation Mode)
- Generated fake coding questions randomly
- No actual screen text extraction
- Topics rotated artificially

### Now (Real Vision-Based Reading)
- **Uses Groq Vision API** (llama-3.2-90b-vision-preview) to analyze screenshots
- **Extracts actual text** from your screen
- **Detects real coding problems** from LeetCode, HackerRank, code editors, etc.
- **Tracks your typing** using KeystrokeMonitor
- **Provides contextual hints** based on what you're actually doing

## 🧠 How It Works

### 1. Screen Capture (Every 5 seconds)
```
📷 Takes screenshot of primary display
```

### 2. Vision Analysis
```
🔍 Sends screenshot to Groq Vision API
📝 AI analyzes: "Is there coding content?"
   - Detects: Coding problems, questions, code editors
   - Extracts: Topic, question text, visible code
   - Returns: Confidence score
```

### 3. Contextual Hint Generation
```
🎯 If coding detected (confidence > 50%):
   ✅ Sends real question to RAG service
   🤖 Generates progressive hints with personality
   📊 Displays in sidebar
```

### 4. Keystroke Tracking
```
⌨️ Monitors your typing patterns
🤔 Detects:
   - Hesitation (lots of backspaces)
   - Syntax errors (unmatched brackets)
   - Coding patterns (loops, functions)
   - Long pauses (stuck on problem)

💡 Provides timely hints when you're struggling
```

## 🔧 Technical Stack

### Screen Reading
- **Electron desktopCapturer**: Screenshots
- **Groq Vision API**: llama-3.2-90b-vision-preview
- **Model**: Analyzes images to detect coding content

### Keystroke Monitoring
- **KeystrokeMonitor.js**: Pattern detection
- **Tracks**: Typing speed, backspaces, pauses, patterns

### Hint Generation
- **RAG Service**: Flask backend with Groq LLM
- **Model**: llama-3.3-70b-versatile
- **Features**: Progressive hints, personality-aware

## 📋 Testing Instructions

### Step 1: Open a Real Coding Problem
```
1. Open LeetCode, HackerRank, or any coding site in your browser
2. Navigate to a problem (e.g., "Two Sum", "Reverse String")
3. Make sure the problem statement is visible on screen
```

### Step 2: Start the App
```bash
# Terminal 1: Start RAG service
cd /Users/tintuk/calhacks/CalHacks/rag-service
source venv/bin/activate
python app.py

# Terminal 2: Start Desktop App
cd /Users/tintuk/calhacks/CalHacks/socraticcode-desktop
npm start
```

### Step 3: Activate Screen Reading
```
1. Select a personality in the app
2. Click "Start Monitoring"
3. Wait 5-10 seconds for first screen capture
```

### Step 4: Watch the Terminal
You should see:
```
📷 Capturing screen...
✅ Screenshot captured, analyzing...
🎯 Coding content detected! Topic: arrays
📝 Question: Two Sum - Find two numbers...
```

### Step 5: Start Typing in Your Editor
```
1. Open VS Code or any code editor
2. Start typing code for the problem
3. Make some mistakes (backspace a lot)
4. Watch for contextual hints in the sidebar!
```

## 🔍 What the Vision API Detects

The AI looks for:

### Coding Platforms
- ✅ LeetCode problems
- ✅ HackerRank challenges
- ✅ CodeWars kata
- ✅ Codeforces problems

### Code Editors
- ✅ VS Code
- ✅ Cursor
- ✅ PyCharm / IntelliJ
- ✅ Sublime Text
- ✅ Any editor with code visible

### Programming Content
- ✅ Problem statements
- ✅ Function signatures
- ✅ Code snippets
- ✅ Error messages
- ✅ Documentation

## 🎨 Contextual Hint Triggers

### Trigger 1: Coding Content Detected
```
Screen shows coding problem
→ Generates 3 progressive hints
→ Displays in sidebar
```

### Trigger 2: Hesitation Detected
```
User types, deletes, types again (3+ backspaces)
→ "User seems stuck"
→ Shows subtle hint
```

### Trigger 3: Syntax Error Pattern
```
Unmatched brackets detected in typing
→ "Check your syntax"
→ Quick tip in sidebar
```

### Trigger 4: Long Pause
```
No typing for 2+ seconds
→ Algorithm implementation detected
→ Gentle nudge with hint
```

## 🚀 API Information

### Groq Vision API
- **Model**: llama-3.2-90b-vision-preview
- **Purpose**: Extract text/code from screenshots
- **API Key**: Already configured in code
- **Rate Limit**: Check Groq dashboard

### Groq LLM API
- **Model**: llama-3.3-70b-versatile
- **Purpose**: Generate Socratic hints
- **Temperature**: 0.7 (creative hints)

## 🧪 Testing Scenarios

### Scenario 1: LeetCode Test
1. Open: https://leetcode.com/problems/two-sum/
2. Ensure problem description visible
3. Start monitoring
4. **Expected**: Detects "Two Sum" problem, provides hints about hash maps

### Scenario 2: Local Code Editor
1. Open VS Code
2. Create file: `solution.py`
3. Start typing a function
4. Make mistakes (backspace frequently)
5. **Expected**: Detects coding, shows syntax hints when stuck

### Scenario 3: Multi-Window
1. LeetCode on left, VS Code on right
2. Screenshot captures both
3. **Expected**: Prioritizes detecting the coding problem

## ⚡ Performance Notes

### Screenshot Capture
- **Frequency**: Every 5 seconds
- **Resolution**: 1280x720 (optimized)
- **Format**: PNG → Base64

### Vision API Call
- **Latency**: 1-3 seconds
- **Tokens**: ~300-500 per analysis
- **Cost**: Minimal (Groq is fast/cheap)

### Keystroke Detection
- **Real-time**: Immediate pattern detection
- **Buffer**: Last 50 keystrokes kept
- **Patterns**: Analyzed on-the-fly

## 🎯 Next Steps for Better Accuracy

### Option 1: Enhance Prompt Engineering
Make the vision analysis prompt more specific to your use case

### Option 2: Add OCR Fallback
Use Tesseract.js for offline OCR when API is unavailable

### Option 3: Multi-Monitor Support
Detect which monitor has coding content

### Option 4: Active Window Detection
Focus only on the active window for faster analysis

## 🐛 Troubleshooting

### No Content Detected?
```
✓ Is the coding problem clearly visible?
✓ Is the text large enough to read?
✓ Is the window not minimized?
✓ Check terminal for Vision API errors
```

### Vision API Errors?
```
✓ Check Groq API key is valid
✓ Check internet connection
✓ Check rate limits on Groq dashboard
✓ Look for error messages in terminal
```

### Hints Not Appearing?
```
✓ Is RAG service running? (port 5001)
✓ Is monitoring active? (green indicator)
✓ Is sidebar expanded? (click indicator dot)
✓ Check terminal for hint generation logs
```

## 📊 Success Metrics

You'll know it's working when you see:
```
✅ "Coding content detected" in terminal
✅ Real question extracted from your screen
✅ Hints appear in sidebar within 10 seconds
✅ Hints are relevant to the actual problem
✅ Typing patterns trigger contextual help
```

## 🎉 That's It!

The system now:
- ✅ **Reads your actual screen** (not simulated)
- ✅ **Extracts real coding problems** (via Vision API)
- ✅ **Tracks your typing** (via KeystrokeMonitor)
- ✅ **Provides contextual hints** (based on real behavior)
- ✅ **No fake scenarios** (all real detection)

Ready to test? Follow the instructions above! 🚀

