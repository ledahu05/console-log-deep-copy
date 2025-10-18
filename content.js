// Content script to capture console logs with deep copy support
(function () {
    'use strict';

    // Inject page script into the page's main context
    // This needs to be a separate file to avoid CSP issues with inline scripts
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page-script.js');
    script.onload = function () {
        this.remove(); // Clean up after injection
    };

    // Insert at the very beginning of the document
    (document.head || document.documentElement).insertBefore(
        script,
        (document.head || document.documentElement).firstChild
    );

    // Content script part - bridge between page and extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getLogs') {
            // Request logs from page script
            const listener = function (event) {
                window.removeEventListener(
                    '__consoleLogExtractor_logsResponse',
                    listener
                );
                sendResponse({ logs: event.detail.logs });
            };

            window.addEventListener(
                '__consoleLogExtractor_logsResponse',
                listener
            );
            window.dispatchEvent(
                new CustomEvent('__consoleLogExtractor_getLogs')
            );

            return true; // Keep channel open for async response
        } else if (request.action === 'clearLogs') {
            const listener = function (event) {
                window.removeEventListener(
                    '__consoleLogExtractor_clearResponse',
                    listener
                );
                sendResponse(event.detail);
            };

            window.addEventListener(
                '__consoleLogExtractor_clearResponse',
                listener
            );
            window.dispatchEvent(
                new CustomEvent('__consoleLogExtractor_clearLogs')
            );

            return true; // Keep channel open for async response
        }
        return false;
    });
})();
