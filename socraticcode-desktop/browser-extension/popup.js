// CoDei Browser Extension Popup Script
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const helpBtn = document.getElementById('helpBtn');
    
    // Check if CoDei is already active
    chrome.storage.local.get(['codeiActive'], function(result) {
        if (result.codeiActive) {
            startBtn.textContent = 'Stop Learning Mode';
            startBtn.classList.remove('primary');
        }
    });
    
    // Start/Stop Learning Mode
    startBtn.addEventListener('click', function() {
        chrome.storage.local.get(['codeiActive'], function(result) {
            const newState = !result.codeiActive;
            
            chrome.storage.local.set({ codeiActive: newState }, function() {
                if (newState) {
                    startBtn.textContent = 'Stop Learning Mode';
                    startBtn.classList.remove('primary');
                    
                    // Send message to content script to start monitoring
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'startCodei'});
                    });
                } else {
                    startBtn.textContent = 'Start Learning Mode';
                    startBtn.classList.add('primary');
                    
                    // Send message to content script to stop monitoring
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'stopCodei'});
                    });
                }
            });
        });
    });
    
    // Settings
    settingsBtn.addEventListener('click', function() {
        chrome.tabs.create({url: 'chrome://extensions/'});
    });
    
    // Help
    helpBtn.addEventListener('click', function() {
        chrome.tabs.create({url: 'https://github.com/tanvi-badadare/CalHacks'});
    });
});
