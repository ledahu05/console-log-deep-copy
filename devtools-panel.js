// DevTools panel script for log extraction
let extractedLogs = [];
let currentPattern = '';

// DOM elements
const patternInput = document.getElementById('pattern');
const useRegexCheckbox = document.getElementById('useRegex');
const extractBtn = document.getElementById('extractBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const statsDiv = document.getElementById('stats');
const logContainer = document.getElementById('logContainer');
const notification = document.getElementById('notification');

// Load settings
chrome.storage.sync.get(['pattern', 'useRegex'], (result) => {
    if (result.pattern) patternInput.value = result.pattern;
    if (result.useRegex !== undefined)
        useRegexCheckbox.checked = result.useRegex;
});

// Save settings
patternInput.addEventListener('input', () => {
    chrome.storage.sync.set({ pattern: patternInput.value });
});

useRegexCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ useRegex: useRegexCheckbox.checked });
});

// Extract logs from console
async function extractLogs() {
    try {
        // Get the current tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        // Inject a script to get console logs
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractConsoleLogs,
            args: [patternInput.value, useRegexCheckbox.checked]
        });

        if (results && results[0] && results[0].result) {
            extractedLogs = results[0].result;
            displayLogs();
            showNotification(`Extracted ${extractedLogs.length} logs`);
        } else {
            showNotification('No logs found or extraction failed');
        }
    } catch (error) {
        console.error('Error extracting logs:', error);
        showNotification('Error extracting logs: ' + error.message);
    }
}

// Function to inject into the page to extract console logs
function extractConsoleLogs(pattern, useRegex) {
    // This function runs in the page context
    const logs = [];

    // Get all console messages from the page
    // Note: This is a simplified approach - in reality, we'd need to hook into the console API
    // For now, we'll return a message explaining the limitation
    logs.push({
        type: 'info',
        timestamp: new Date().toISOString(),
        message:
            'Console log extraction requires DevTools to be open. Please use the Console tab to copy logs manually, or use the extension popup for real-time capture.',
        source: 'extension'
    });

    return logs;
}

// Alternative approach: Use Chrome DevTools Protocol
async function extractLogsViaCDP() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        // Attach to the tab
        await chrome.debugger.attach({ tabId: tab.id }, '1.3');

        // Enable Runtime domain
        await chrome.debugger.sendCommand({ tabId: tab.id }, 'Runtime.enable');

        // Get console messages
        const result = await chrome.debugger.sendCommand(
            { tabId: tab.id },
            'Runtime.getConsoleMessages'
        );

        // Filter by pattern
        const pattern = patternInput.value;
        const useRegex = useRegexCheckbox.checked;

        let filteredLogs = result.messages || [];

        if (pattern) {
            filteredLogs = filteredLogs.filter((msg) => {
                const text = msg.text || '';
                if (useRegex) {
                    try {
                        const regex = new RegExp(pattern, 'i');
                        return regex.test(text);
                    } catch (e) {
                        return text
                            .toLowerCase()
                            .includes(pattern.toLowerCase());
                    }
                } else {
                    return text.toLowerCase().includes(pattern.toLowerCase());
                }
            });
        }

        // Format logs
        extractedLogs = filteredLogs.map((msg) => ({
            type: msg.type || 'log',
            timestamp: new Date(msg.timestamp).toISOString(),
            message: msg.text,
            source: 'console'
        }));

        // Detach debugger
        await chrome.debugger.detach({ tabId: tab.id });

        displayLogs();
        showNotification(`Extracted ${extractedLogs.length} logs`);
    } catch (error) {
        console.error('Error extracting logs via CDP:', error);
        showNotification('Error extracting logs: ' + error.message);
    }
}

// Display extracted logs
function displayLogs() {
    const pattern = patternInput.value;
    const useRegex = useRegexCheckbox.checked;

    let filteredLogs = extractedLogs;

    if (pattern) {
        filteredLogs = extractedLogs.filter((log) => {
            const text = log.message || '';
            if (useRegex) {
                try {
                    const regex = new RegExp(pattern, 'i');
                    return regex.test(text);
                } catch (e) {
                    return text.toLowerCase().includes(pattern.toLowerCase());
                }
            } else {
                return text.toLowerCase().includes(pattern.toLowerCase());
            }
        });
    }

    statsDiv.textContent = `${filteredLogs.length} logs extracted`;

    if (filteredLogs.length === 0) {
        logContainer.innerHTML = `
            <div class="empty-state">
                <p>${
                    extractedLogs.length === 0
                        ? 'No logs extracted yet.'
                        : 'No logs match the pattern.'
                }</p>
                <p>Try a different pattern or check the Console tab in DevTools.</p>
            </div>
        `;
        return;
    }

    logContainer.innerHTML = filteredLogs
        .map((log) => {
            const typeClass = `log-${log.type}`;
            const time = new Date(log.timestamp).toLocaleTimeString();

            return `
            <div class="log-entry ${typeClass}">
                <span class="log-type">[${log.type.toUpperCase()}]</span>
                <span class="log-time">${time}</span>
                <span class="log-message">${escapeHtml(log.message)}</span>
            </div>
        `;
        })
        .join('');
}

// Copy logs to clipboard
async function copyLogs() {
    const pattern = patternInput.value;
    const useRegex = useRegexCheckbox.checked;

    let filteredLogs = extractedLogs;

    if (pattern) {
        filteredLogs = extractedLogs.filter((log) => {
            const text = log.message || '';
            if (useRegex) {
                try {
                    const regex = new RegExp(pattern, 'i');
                    return regex.test(text);
                } catch (e) {
                    return text.toLowerCase().includes(pattern.toLowerCase());
                }
            } else {
                return text.toLowerCase().includes(pattern.toLowerCase());
            }
        });
    }

    if (filteredLogs.length === 0) {
        showNotification('No logs to copy');
        return;
    }

    const formattedLogs = filteredLogs
        .map((log) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            return `[${log.type.toUpperCase()}] ${time} - ${log.message}`;
        })
        .join('\n');

    try {
        await navigator.clipboard.writeText(formattedLogs);
        showNotification('Logs copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy:', error);
        showNotification('Failed to copy logs');
    }
}

// Clear logs
function clearLogs() {
    extractedLogs = [];
    displayLogs();
    showNotification('Logs cleared');
}

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
extractBtn.addEventListener('click', extractLogsViaCDP);
copyBtn.addEventListener('click', copyLogs);
clearBtn.addEventListener('click', clearLogs);

// Auto-update display when pattern changes
patternInput.addEventListener('input', displayLogs);
useRegexCheckbox.addEventListener('change', displayLogs);
