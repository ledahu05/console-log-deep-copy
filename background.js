// Background service worker for DevTools Log Extractor
chrome.runtime.onInstalled.addListener(() => {
    console.log('DevTools Log Extractor extension installed');

    // Set default settings
    chrome.storage.sync.set({
        pattern: '',
        useRegex: false
    });
});

// Handle messages from DevTools panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.sync.get(['pattern', 'useRegex'], (result) => {
            sendResponse(result);
        });
        return true;
    }
});
