// Content script to capture console logs with deep copy support
(function () {
    'use strict';

    // Function to inject page script
    function injectPageScript() {
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

        console.log('[Console Log Extractor] Page script injected');
    }

    // Inject page script only once
    if (!window.__consoleLogExtractorContentScriptLoaded) {
        window.__consoleLogExtractorContentScriptLoaded = true;
        injectPageScript();
        console.log('[Console Log Extractor] Content script loaded');
    } else {
        console.log('[Console Log Extractor] Content script already active');
    }

    // Content script part - bridge between page and extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getLogs') {
            console.log('[Content] Received getLogs request');
            // Request logs from page script with timeout
            let responded = false;
            const listener = function (event) {
                console.log('[Content] Received response event');
                // Read logs from DOM element (truly shared across isolated worlds)
                const dataElement = document.getElementById('__consoleLogExtractorData');
                let logs = [];
                if (dataElement && dataElement.textContent) {
                    try {
                        logs = JSON.parse(dataElement.textContent);
                        console.log('[Content] Retrieved logs from DOM:', logs.length);
                    } catch (e) {
                        console.error('[Content] Failed to parse logs:', e);
                    }
                } else {
                    console.warn('[Content] No data element found');
                }
                if (responded) return;
                responded = true;
                document.removeEventListener(
                    '__consoleLogExtractor_logsResponse',
                    listener
                );
                sendResponse({ logs: logs });
            };

            document.addEventListener(
                '__consoleLogExtractor_logsResponse',
                listener
            );
            console.log('[Content] Dispatching getLogs event');
            document.dispatchEvent(
                new CustomEvent('__consoleLogExtractor_getLogs')
            );

            // Timeout fallback: if page script doesn't respond, re-inject it
            setTimeout(() => {
                if (!responded) {
                    console.warn('[Content] Timeout! Page script did not respond within 100ms');
                    responded = true;
                    document.removeEventListener(
                        '__consoleLogExtractor_logsResponse',
                        listener
                    );
                    console.warn(
                        '[Console Log Extractor] Page script not responding, re-injecting'
                    );
                    injectPageScript();
                    sendResponse({ logs: [], error: 'Page script re-injected, please try again' });
                }
            }, 100);

            return true; // Keep channel open for async response
        } else if (request.action === 'clearLogs') {
            const listener = function (event) {
                document.removeEventListener(
                    '__consoleLogExtractor_clearResponse',
                    listener
                );
                sendResponse({ success: true });
            };

            document.addEventListener(
                '__consoleLogExtractor_clearResponse',
                listener
            );
            document.dispatchEvent(
                new CustomEvent('__consoleLogExtractor_clearLogs')
            );

            return true; // Keep channel open for async response
        }
        return false;
    });
})();
