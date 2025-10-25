const mongoose = require('mongoose');
const Problem = require('./models/Problem');
require('dotenv').config();

const sampleProblems = [
  {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "beginner",
    language: "javascript",
    category: "arrays",
    hints: {
      level1: "What data structure could help you remember numbers you've already seen? Think about how you could check if a complement exists for each number.",
      level2: "1. Create a hash map to store numbers and their indices\n2. For each number, calculate the complement (target - current number)\n3. Check if complement exists in hash map\n4. If yes, return the indices; if no, store current number and index",
      level3: "function twoSum(nums, target) {\n  const map = new Map();\n  \n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    \n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    \n    map.set(nums[i], i);\n  }\n  \n  return [];\n}"
    },
    solution: "function twoSum(nums, target) {\n  const map = new Map();\n  \n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    \n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    \n    map.set(nums[i], i);\n  }\n  \n  return [];\n}",
    testCases: [
      {
        input: "nums = [2,7,11,15], target = 9",
        expectedOutput: "[0,1]",
        description: "nums[0] + nums[1] = 2 + 7 = 9"
      },
      {
        input: "nums = [3,2,4], target = 6",
        expectedOutput: "[1,2]",
        description: "nums[1] + nums[2] = 2 + 4 = 6"
      }
    ]
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters. You must do this by modifying the input array in-place with O(1) extra memory.",
    difficulty: "beginner",
    language: "javascript",
    category: "strings",
    hints: {
      level1: "Think about using two pointers. What happens if you swap characters from the beginning and end, moving inward?",
      level2: "1. Initialize two pointers: left at start, right at end\n2. While left < right:\n   - Swap characters at left and right positions\n   - Move left pointer right, right pointer left\n3. Return the modified array",
      level3: "function reverseString(s) {\n  let left = 0;\n  let right = s.length - 1;\n  \n  while (left < right) {\n    // Swap characters\n    let temp = s[left];\n    s[left] = s[right];\n    s[right] = temp;\n    \n    left++;\n    right--;\n  }\n  \n  return s;\n}"
    },
    solution: "function reverseString(s) {\n  let left = 0;\n  let right = s.length - 1;\n  \n  while (left < right) {\n    let temp = s[left];\n    s[left] = s[right];\n    s[right] = temp;\n    \n    left++;\n    right--;\n  }\n  \n  return s;\n}",
    testCases: [
      {
        input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]",
        expectedOutput: "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
        description: "Reverse the string 'hello'"
      },
      {
        input: "s = [\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]",
        expectedOutput: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]",
        description: "Reverse the string 'Hannah'"
      }
    ]
  },
  {
    title: "Valid Parentheses",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: 1) Open brackets must be closed by the same type of brackets. 2) Open brackets must be closed in the correct order.",
    difficulty: "intermediate",
    language: "javascript",
    category: "stacks",
    hints: {
      level1: "What data structure naturally handles matching pairs in a specific order? Think about how you could track opening brackets and match them with closing ones.",
      level2: "1. Use a stack to track opening brackets\n2. For each character:\n   - If it's an opening bracket, push to stack\n   - If it's a closing bracket, check if stack is empty or if it matches the last opening bracket\n3. At the end, stack should be empty for valid string",
      level3: "function isValid(s) {\n  const stack = [];\n  const pairs = {\n    ')': '(',\n    '}': '{',\n    ']': '['\n  };\n  \n  for (let char of s) {\n    if (char in pairs) {\n      if (stack.length === 0 || stack.pop() !== pairs[char]) {\n        return false;\n      }\n    } else {\n      stack.push(char);\n    }\n  }\n  \n  return stack.length === 0;\n}"
    },
    solution: "function isValid(s) {\n  const stack = [];\n  const pairs = {\n    ')': '(',\n    '}': '{',\n    ']': '['\n  };\n  \n  for (let char of s) {\n    if (char in pairs) {\n      if (stack.length === 0 || stack.pop() !== pairs[char]) {\n        return false;\n      }\n    } else {\n      stack.push(char);\n    }\n  }\n  \n  return stack.length === 0;\n}",
    testCases: [
      {
        input: "s = \"()\"",
        expectedOutput: "true",
        description: "Simple valid parentheses"
      },
      {
        input: "s = \"()[]{}\"",
        expectedOutput: "true",
        description: "Multiple types of valid brackets"
      },
      {
        input: "s = \"(]\"",
        expectedOutput: "false",
        description: "Mismatched bracket types"
      }
    ]
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/socraticcode');
    console.log('Connected to MongoDB');
    
    // Clear existing problems
    await Problem.deleteMany({});
    console.log('Cleared existing problems');
    
    // Insert sample problems
    await Problem.insertMany(sampleProblems);
    console.log('Inserted sample problems');
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
