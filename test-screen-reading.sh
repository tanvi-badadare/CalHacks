#!/bin/bash

echo "🧪 Testing SocraticCode Screen Reading"
echo "======================================"
echo ""
echo "✅ Fixed: EIO write errors (app will no longer crash on console.log)"
echo ""

# Check if RAG service is running
echo "1️⃣ Checking RAG Service..."
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "   ✅ RAG Service is running on port 5001"
else
    echo "   ❌ RAG Service is NOT running"
    echo "   💡 Start it with:"
    echo "      cd /Users/tintuk/calhacks/CalHacks/rag-service"
    echo "      source venv/bin/activate"
    echo "      python app.py"
    echo ""
fi

# Check if desktop app is running
echo ""
echo "2️⃣ Checking Desktop App..."
if pgrep -f "electron.*socraticcode-desktop" > /dev/null 2>&1; then
    echo "   ✅ Desktop app appears to be running"
else
    echo "   ⚠️  Desktop app may not be running"
    echo "   💡 Start it with:"
    echo "      cd /Users/tintuk/calhacks/CalHacks/socraticcode-desktop"
    echo "      npm start"
    echo ""
fi

echo ""
echo "3️⃣ What to Look For in Terminal:"
echo "   ================================"
echo "   In the terminal where you ran 'npm start', you should see:"
echo ""
echo "   📷 Capturing screen..."
echo "   ✅ Screenshot captured, analyzing..."
echo ""
echo "   If you have a coding tool open (VS Code, LeetCode, etc):"
echo "   🎯 Coding content detected! Topic: arrays"
echo ""
echo ""
echo "4️⃣ Testing Hint Generation:"
echo "   ========================="
echo "   Testing RAG service directly..."
echo ""

curl -X POST http://localhost:5001/api/hints/generate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def reverse_string(s):\n    return s[::-1]",
    "topic": "strings",
    "num_hints": 2
  }' 2>/dev/null | python3 -m json.tool 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ RAG service is generating hints!"
else
    echo ""
    echo "   ❌ Could not generate hints"
fi

echo ""
echo "5️⃣ Visual Indicators:"
echo "   ==================="
echo "   When monitoring is active, you should see:"
echo "   • Green dot in the top-right corner of your screen"
echo "   • Sidebar on the right side (400px wide)"
echo "   • Hints appearing in the sidebar when coding detected"
echo ""
echo "6️⃣ To Trigger Detection:"
echo "   ======================"
echo "   • Open VS Code or Cursor"
echo "   • Visit leetcode.com in your browser"
echo "   • Open any window with 'code' in the title"
echo "   • Wait 5-10 seconds for the screen reader cycle"
echo ""
echo "Done! 🎯"




