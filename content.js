// Content script to capture console logs with deep copy support
(function () {
    'use strict';

    // Constants
    const EVENT_GET_LOGS = '__consoleLogExtractor_getLogs';
    const EVENT_LOGS_RESPONSE = '__consoleLogExtractor_logsResponse';
    const EVENT_CLEAR_LOGS = '__consoleLogExtractor_clearLogs';
    const EVENT_CLEAR_RESPONSE = '__consoleLogExtractor_clearResponse';
    const DATA_ELEMENT_ID = '__consoleLogExtractorData';
    const RESPONSE_TIMEOUT_MS = 100;

    /**
     * Injects the page script into the page's main context
     * This needs to run in the page context to intercept console calls before other scripts
     */
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

    /**
     * Reads logs from the DOM element shared between isolated worlds
     * Returns parsed logs array or empty array on failure
     */
    function readLogsFromDOM() {
        const dataElement = document.getElementById(DATA_ELEMENT_ID);
        let logs = [];
        if (dataElement && dataElement.textContent) {
            try {
                logs = JSON.parse(dataElement.textContent);
            } catch (e) {
                console.error('[Console Log Extractor] Failed to parse logs:', e);
            }
        }
        return logs;
    }

    /**
     * Handles getLogs request from popup
     * Uses DOM-based communication to bridge isolated worlds (page script ↔ content script)
     */
    function handleGetLogsRequest(sendResponse) {
        let responded = false;

        const listener = function (event) {
            if (responded) return;
            responded = true;
            document.removeEventListener(EVENT_LOGS_RESPONSE, listener);

            const logs = readLogsFromDOM();
            sendResponse({ logs: logs });
        };

        document.addEventListener(EVENT_LOGS_RESPONSE, listener);
        document.dispatchEvent(new CustomEvent(EVENT_GET_LOGS));

        // Timeout fallback: if page script doesn't respond, re-inject it
        setTimeout(() => {
            if (!responded) {
                responded = true;
                document.removeEventListener(EVENT_LOGS_RESPONSE, listener);
                console.warn(
                    '[Console Log Extractor] Page script not responding, re-injecting'
                );
                injectPageScript();
                sendResponse({ logs: [], error: 'Page script re-injected, please try again' });
            }
        }, RESPONSE_TIMEOUT_MS);

        return true; // Keep channel open for async response
    }

    /**
     * Handles clearLogs request from popup
     */
    function handleClearLogsRequest(sendResponse) {
        const listener = function (event) {
            document.removeEventListener(EVENT_CLEAR_RESPONSE, listener);
            sendResponse({ success: true });
        };

        document.addEventListener(EVENT_CLEAR_RESPONSE, listener);
        document.dispatchEvent(new CustomEvent(EVENT_CLEAR_LOGS));

        return true; // Keep channel open for async response
    }

    // Message listener - bridge between page and extension popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getLogs') {
            return handleGetLogsRequest(sendResponse);
        } else if (request.action === 'clearLogs') {
            return handleClearLogsRequest(sendResponse);
        }
        return false;
    });
})();
