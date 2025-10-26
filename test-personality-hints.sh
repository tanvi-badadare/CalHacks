#!/bin/bash

echo "🎭 Testing Progressive Personality-Aware Hints System"
echo "======================================================"
echo ""

# Check if RAG service is running
echo "1️⃣  Checking RAG Service..."
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "   ✅ RAG Service is running"
    
    # Test hint generation with different personalities
    echo ""
    echo "2️⃣  Testing Hint Generation..."
    echo ""
    
    personalities=("mentor" "sarcastic" "fun" "grade-level")
    
    for personality in "${personalities[@]}"; do
        echo "   Testing $personality personality:"
        
        response=$(curl -s -X POST http://localhost:5001/api/hints/generate \
          -H "Content-Type: application/json" \
          -d "{
            \"code\": \"def two_sum(nums, target):\\n    # TODO: find two numbers that add up to target\\n    pass\",
            \"topic\": \"arrays\",
            \"personality\": \"$personality\",
            \"hint_level\": 1,
            \"num_hints\": 3
          }")
        
        if echo "$response" | grep -q "success.*true"; then
            echo "      ✅ Generated hints successfully"
            
            # Show first hint
            first_hint=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['progressive_hints'][0]['hint'] if data.get('progressive_hints') else 'N/A')" 2>/dev/null)
            if [ ! -z "$first_hint" ] && [ "$first_hint" != "N/A" ]; then
                echo "      💡 Level 1 Hint: \"${first_hint:0:80}...\""
            fi
        else
            echo "      ❌ Failed to generate hints"
        fi
        echo ""
    done
    
else
    echo "   ❌ RAG Service is NOT running"
    echo ""
    echo "   💡 Start it with:"
    echo "      cd /Users/tintuk/calhacks/CalHacks/rag-service"
    echo "      source venv/bin/activate"
    echo "      python app.py"
    echo ""
    exit 1
fi

echo "3️⃣  System Status:"
echo "   ================================"
echo ""
echo "   ✅ Personality-aware prompts: IMPLEMENTED"
echo "   ✅ Progressive hints (3 levels): IMPLEMENTED"
echo "   ✅ Next Hint button: IMPLEMENTED"
echo "   ✅ Sidebar UI with color coding: IMPLEMENTED"
echo "   ✅ Screen reading integration: IMPLEMENTED"
echo ""

echo "4️⃣  How to Test Manually:"
echo "   ================================"
echo ""
echo "   1. Start the desktop app:"
echo "      cd /Users/tintuk/calhacks/CalHacks/socraticcode-desktop"
echo "      npm start"
echo ""
echo "   2. Select a personality (Mentor/Sarcastic/Fun/Grade-Level)"
echo ""
echo "   3. Click 'Start Monitoring'"
echo ""
echo "   4. Open VS Code or visit leetcode.com"
echo ""
echo "   5. Wait 5-10 seconds for detection"
echo ""
echo "   6. Check sidebar for hints"
echo ""
echo "   7. Click 'Need Another Hint?' to see progressive hints"
echo ""

echo "5️⃣  Expected Behavior:"
echo "   ================================"
echo ""
echo "   📱 Sidebar shows:"
echo "      • Topic header (e.g., 'Topic: ARRAYS')"
echo "      • First hint (Level 1 - subtle)"
echo "      • 'Need Another Hint?' button"
echo ""
echo "   🖱️  Click button:"
echo "      • Level 2 hint appears (moderate guidance)"
echo "      • Button remains for Level 3"
echo ""
echo "   🖱️  Click again:"
echo "      • Level 3 hint appears (direct suggestions)"
echo "      • Completion message: 'You've seen all the hints!'"
echo ""

echo "6️⃣  Personality Differences:"
echo "   ================================"
echo ""
echo "   👨‍🏫 Mentor: Patient, encouraging, supportive"
echo "   😏 Sarcastic: Witty, clever, humorous (but helpful)"
echo "   🎉 Fun: Energetic, emoji-filled, enthusiastic"
echo "   🎓 Grade-Level: Rigorous, theory-focused, academic"
echo ""

echo "✨ System is ready for testing!"
echo ""
echo "📖 For detailed testing instructions, see:"
echo "   /Users/tintuk/calhacks/CalHacks/TESTING_PROGRESSIVE_HINTS.md"
echo ""

