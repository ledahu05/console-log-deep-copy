// Console Log Extractor with Deep Copy Support
console.log('Console Log Extractor popup loaded');

let extractedLogs = [];
let filteredLogs = [];

// DOM elements
const patternInput = document.getElementById('pattern');
const useRegexCheckbox = document.getElementById('useRegex');
const refreshBtn = document.getElementById('refreshBtn');
const copyBtn = document.getElementById('copyBtn');
const copySelectedBtn = document.getElementById('copySelectedBtn');
const clearBtn = document.getElementById('clearBtn');
const statsDiv = document.getElementById('stats');
const logContainer = document.getElementById('logContainer');

// Track selected logs
let selectedLogIndices = new Set();

// Load settings and auto-extract logs
chrome.storage.sync.get(['pattern', 'useRegex'], (result) => {
    if (result.pattern) patternInput.value = result.pattern;
    if (result.useRegex !== undefined)
        useRegexCheckbox.checked = result.useRegex;

    // Auto-extract logs on popup open
    extractLogs(false);
});

// Save settings and re-filter
patternInput.addEventListener('input', () => {
    chrome.storage.sync.set({ pattern: patternInput.value });
    applyFilter(true);
});

useRegexCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ useRegex: useRegexCheckbox.checked });
    applyFilter(true);
});

// Extract logs from content script
async function extractLogs(showSuccessNotification = true) {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        // Get logs from content script
        chrome.tabs.sendMessage(tab.id, { action: 'getLogs' }, (response) => {
            if (chrome.runtime.lastError) {
                showNotification(
                    'Content script not loaded. Please refresh the page (F5).',
                    'error'
                );
                extractedLogs = [];
                applyFilter();
                return;
            }

            if (response && response.logs) {
                extractedLogs = response.logs;
                applyFilter();

                if (showSuccessNotification) {
                    if (extractedLogs.length === 0) {
                        showNotification(
                            'No logs captured yet. Try refreshing the page or creating new logs.',
                            'warning'
                        );
                    } else {
                        showNotification(
                            `Loaded ${extractedLogs.length} logs`,
                            'success'
                        );
                    }
                }
            } else {
                extractedLogs = [];
                applyFilter();
            }
        });
    } catch (error) {
        console.error('Error extracting logs:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Apply filter and display logs
function applyFilter(clearSelections = false) {
    const pattern = patternInput.value.trim();
    const useRegex = useRegexCheckbox.checked;

    // Clear selections when filter changes
    if (clearSelections) {
        selectedLogIndices.clear();
    }

    if (!pattern) {
        filteredLogs = extractedLogs;
    } else {
        filteredLogs = extractedLogs.filter((log) => {
            const text = log.preview || '';

            if (useRegex) {
                try {
                    const regex = new RegExp(pattern, 'i');
                    return regex.test(text);
                } catch (e) {
                    // If regex is invalid, fall back to string match
                    return text.toLowerCase().includes(pattern.toLowerCase());
                }
            } else {
                return text.toLowerCase().includes(pattern.toLowerCase());
            }
        });
    }

    displayLogs();
}

// Display logs in the UI
function displayLogs() {
    statsDiv.textContent = `${filteredLogs.length} of ${extractedLogs.length} logs`;

    if (filteredLogs.length === 0) {
        logContainer.innerHTML = `
            <div class="empty-state">
                <p>${
                    extractedLogs.length === 0
                        ? 'No logs captured yet.'
                        : 'No logs match the filter pattern.'
                }</p>
                <p>${
                    extractedLogs.length === 0
                        ? '<strong>Tip:</strong> Refresh the page (F5) if you see logs in DevTools but not here.'
                        : 'Try a different pattern or clear the filter.'
                }</p>
                ${
                    extractedLogs.length === 0
                        ? '<p style="font-size: 11px; margin-top: 8px; color: #999;">The extension captures logs created <em>after</em> the page loads.</p>'
                        : ''
                }
            </div>
        `;
        return;
    }

    logContainer.innerHTML = filteredLogs
        .map((log, index) => {
            const typeClass = `log-${log.type}`;
            const time = new Date(log.timestamp).toLocaleTimeString();
            const isSelected = selectedLogIndices.has(index);

            // Format the arguments for display
            let displayContent = '';
            try {
                if (log.args && log.args.length > 0) {
                    displayContent = log.args
                        .map((arg) => {
                            if (typeof arg === 'object' && arg !== null) {
                                return JSON.stringify(arg, null, 2);
                            }
                            return String(arg);
                        })
                        .join(' ');
                } else {
                    displayContent = log.preview || '';
                }
            } catch (e) {
                displayContent = log.preview || '[Error displaying log]';
            }

            return `
                <div class="log-entry ${typeClass} ${
                isSelected ? 'selected' : ''
            }" data-index="${index}">
                    <div class="log-header">
                        <input type="checkbox" class="log-checkbox" data-index="${index}" ${
                isSelected ? 'checked' : ''
            }>
                        <span class="log-type">[${log.type.toUpperCase()}]</span>
                        <span class="log-time">${time}</span>
                    </div>
                    <div class="log-content">${escapeHtml(displayContent)}</div>
                </div>
            `;
        })
        .join('');

    // Add event listeners to checkboxes
    document.querySelectorAll('.log-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });

    // Update stats with selection count
    updateSelectedCount();
}

// Handle checkbox change
function handleCheckboxChange(event) {
    const index = parseInt(event.target.dataset.index);
    if (event.target.checked) {
        selectedLogIndices.add(index);
    } else {
        selectedLogIndices.delete(index);
    }
    updateSelectedCount();
}

// Update stats to show selected count
function updateSelectedCount() {
    const selectedCount = selectedLogIndices.size;
    if (selectedCount > 0) {
        statsDiv.textContent = `${filteredLogs.length} of ${extractedLogs.length} logs (${selectedCount} selected)`;
    } else {
        statsDiv.textContent = `${filteredLogs.length} of ${extractedLogs.length} logs`;
    }
}

// Copy filtered logs with deep copy support
async function copyLogs() {
    if (filteredLogs.length === 0) {
        showNotification('No logs to copy', 'warning');
        return;
    }

    try {
        // Create deep copy of all filtered log arguments
        const logsToCopy = filteredLogs.map((log) => {
            return {
                type: log.type,
                timestamp: log.timestamp,
                args: log.args
            };
        });

        // Convert to formatted JSON string
        const jsonOutput = JSON.stringify(logsToCopy, null, 2);

        await navigator.clipboard.writeText(jsonOutput);
        showNotification(
            `Copied ${filteredLogs.length} logs with deep copy!`,
            'success'
        );
    } catch (error) {
        console.error('Failed to copy:', error);
        showNotification('Failed to copy logs', 'error');
    }
}

// Copy only selected logs
async function copySelectedLogs() {
    if (selectedLogIndices.size === 0) {
        showNotification(
            'No logs selected. Check the boxes next to logs you want to copy.',
            'warning'
        );
        return;
    }

    try {
        // Create deep copy of selected log arguments
        const logsToCopy = Array.from(selectedLogIndices)
            .sort((a, b) => a - b) // Keep original order
            .map((index) => {
                const log = filteredLogs[index];
                return {
                    type: log.type,
                    timestamp: log.timestamp,
                    args: log.args
                };
            });

        // Convert to formatted JSON string
        const jsonOutput = JSON.stringify(logsToCopy, null, 2);

        await navigator.clipboard.writeText(jsonOutput);
        showNotification(
            `Copied ${selectedLogIndices.size} selected logs with deep copy!`,
            'success'
        );
    } catch (error) {
        console.error('Failed to copy:', error);
        showNotification('Failed to copy selected logs', 'error');
    }
}

// Clear captured logs
async function clearLogs() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        chrome.tabs.sendMessage(tab.id, { action: 'clearLogs' }, (response) => {
            if (chrome.runtime.lastError) {
                showNotification('Could not clear logs', 'error');
                return;
            }

            if (response && response.success) {
                extractedLogs = [];
                filteredLogs = [];
                displayLogs();
                showNotification('Logs cleared', 'success');
            }
        });
    } catch (error) {
        console.error('Error clearing logs:', error);
        showNotification('Error clearing logs', 'error');
    }
}

// Show notification with type
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification notification-${type}`;

    setTimeout(() => {
        notification.className = 'notification hidden';
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
refreshBtn.addEventListener('click', extractLogs);
copyBtn.addEventListener('click', copyLogs);
copySelectedBtn.addEventListener('click', copySelectedLogs);
clearBtn.addEventListener('click', clearLogs);

// Auto-refresh every 2 seconds when popup is open
const autoRefreshInterval = setInterval(() => {
    extractLogs(false);
}, 2000);

// Clean up interval when popup closes
window.addEventListener('unload', () => {
    clearInterval(autoRefreshInterval);
});
