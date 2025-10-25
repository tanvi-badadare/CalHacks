// CoDei Browser Extension - Popup Script
// Handles popup interactions and displays

document.addEventListener('DOMContentLoaded', async () => {
  // Load current profile
  const profile = await getProfile();
  
  // Update UI with current stats
  document.getElementById('interceptions').textContent = profile.totalInterceptions || 0;
  document.getElementById('streak').textContent = profile.learningStreak || 0;
  document.getElementById('personality').value = profile.personality || 'mentor';
  
  // Add event listeners
  document.getElementById('personality').addEventListener('change', updatePersonality);
  document.getElementById('testBtn').addEventListener('click', testExtension);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('helpBtn').addEventListener('click', showHelp);
});

async function getProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['codeiProfile'], (result) => {
      resolve(result.codeiProfile || {});
    });
  });
}

async function updatePersonality(event) {
  const personality = event.target.value;
  const profile = await getProfile();
  profile.personality = personality;
  
  await chrome.storage.local.set({ codeiProfile: profile });
  
  // Notify content script of change
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'updatePersonality', 
      personality: personality 
    });
  }
}

async function testExtension() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    // Open a test page
    chrome.tabs.create({ 
      url: 'https://chat.openai.com/' 
    });
  }
}

function openSettings() {
  // Open extension settings page
  chrome.tabs.create({ 
    url: chrome.runtime.getURL('settings.html') 
  });
}

function showHelp() {
  // Show help information
  alert(`CoDei Learning Conscience Help:

🎓 What it does:
- Monitors coding websites for solution requests
- Intercepts requests for complete code/solutions
- Provides learning-focused hints instead

🔧 How to use:
1. Visit coding websites (ChatGPT, Cursor, GitHub, etc.)
2. Try asking for complete solutions
3. CoDei will intervene with learning hints

⚙️ Settings:
- Change personality in the dropdown
- View your learning statistics
- Test the extension on different sites

The extension works on:
- ChatGPT (chat.openai.com)
- Cursor (cursor.sh)
- GitHub (github.com)
- Stack Overflow (stackoverflow.com)
- Replit (replit.com)
- And more!`);
}
