// CoDei Browser Extension - Background Script
// Handles extension lifecycle and communication

chrome.runtime.onInstalled.addListener((details) => {
  console.log('🎓 CoDei Learning Conscience installed');
  
  // Set default learning profile
  chrome.storage.local.set({
    codeiProfile: {
      personality: 'mentor',
      hintLevel: 1,
      sessionHistory: [],
      totalInterceptions: 0,
      learningStreak: 0
    }
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open popup or show status
  chrome.tabs.sendMessage(tab.id, { action: 'showStatus' });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'interception') {
    // Update learning statistics
    chrome.storage.local.get(['codeiProfile'], (result) => {
      const profile = result.codeiProfile || {};
      profile.totalInterceptions = (profile.totalInterceptions || 0) + 1;
      profile.learningStreak = (profile.learningStreak || 0) + 1;
      
      chrome.storage.local.set({ codeiProfile: profile });
    });
  }
  
  if (request.action === 'getProfile') {
    chrome.storage.local.get(['codeiProfile'], (result) => {
      sendResponse(result.codeiProfile);
    });
    return true; // Keep message channel open
  }
});

// Handle notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('Notification clicked:', notificationId);
});
