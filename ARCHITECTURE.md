# Architecture Overview

## Extension Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Page                              │
│  (localhost:3000 or localhost:5173)                         │
│                                                              │
│  console.log('some pattern', { id: 1, data: [...] })       │
│  console.log('some pattern', { id: 2, data: [...] })       │
│  console.log('other message', 'something else')             │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Console API intercepted
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Content Script (content.js)                 │
│                                                              │
│  • Intercepts console.log/info/warn/error/debug             │
│  • Deep clones all arguments                                │
│  • Stores logs in memory (up to 5000)                       │
│  • Responds to extension queries                            │
│                                                              │
│  Log Structure:                                             │
│  {                                                          │
│    type: 'log',                                             │
│    timestamp: '2025-10-18T...',                             │
│    preview: 'some pattern',  // For filtering              │
│    args: ['some pattern', {...}, [...]]  // Deep cloned    │
│  }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ chrome.runtime.sendMessage
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                Background Service Worker                     │
│                   (background.js)                           │
│                                                              │
│  • Manages extension lifecycle                              │
│  • Stores user settings (pattern, useRegex)                 │
│  • Routes messages (minimal in this extension)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ User clicks extension icon
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Extension Popup (popup.html/js/css)             │
│                                                              │
│  ┌───────────────────────────────────────────────┐         │
│  │  Console Log Deep Copy                         │         │
│  ├───────────────────────────────────────────────┤         │
│  │  Filter: [some pattern          ]             │         │
│  │  ☐ Use regex pattern                          │         │
│  │  [Refresh] [Copy All] [Clear]                 │         │
│  ├───────────────────────────────────────────────┤         │
│  │  2 of 5000 logs                               │         │
│  ├───────────────────────────────────────────────┤         │
│  │  [LOG] 10:30:45                               │         │
│  │  some pattern {id: 1, data: [1,2,3]}          │         │
│  │                                                │         │
│  │  [LOG] 10:30:46                               │         │
│  │  some pattern {id: 2, data: [4,5,6]}          │         │
│  └───────────────────────────────────────────────┘         │
│                                                              │
│  Actions:                                                   │
│  • Auto-load logs on open                                   │
│  • Auto-refresh every 2 seconds                             │
│  • Filter by preview string                                 │
│  • Copy as JSON to clipboard                                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Capture Phase

```javascript
// Page executes
console.log('some pattern', { id: 1, data: [1, 2, 3] });

// Content script intercepts
captureMessage('log', ['some pattern', { id: 1, data: [1, 2, 3] }]);

// Deep clone and store
{
  type: 'log',
  timestamp: '2025-10-18T10:30:45.123Z',
  preview: 'some pattern',
  args: ['some pattern', { id: 1, data: [1, 2, 3] }]  // Cloned!
}
```

### 2. Query Phase

```javascript
// Popup opens and sends message
chrome.tabs.sendMessage(tabId, { action: 'getLogs' });

// Content script responds
sendResponse({
    logs: [
        /* all captured logs */
    ]
});

// Popup receives and stores
extractedLogs = response.logs; // Array of log objects
```

### 3. Filter Phase

```javascript
// User types in filter box
patternInput.value = 'some pattern';

// Popup filters logs
filteredLogs = extractedLogs.filter((log) =>
    log.preview.toLowerCase().includes('some pattern')
);

// Display filtered results
displayLogs(); // Shows 2 of 5000 logs
```

### 4. Copy Phase

```javascript
// User clicks "Copy All"
const output = filteredLogs.map((log) => ({
    type: log.type,
    timestamp: log.timestamp,
    args: log.args // Full deep-cloned data
}));

// Copy to clipboard as JSON
await navigator.clipboard.writeText(JSON.stringify(output, null, 2));
```

## Deep Cloning Logic

```
Input: Any JavaScript value
│
├─ Primitive? ────────────► Return as-is
│
├─ null? ─────────────────► Return null
│
├─ Circular reference? ───► Return '[Circular Reference]'
│
├─ Date? ─────────────────► Return ISO string
│
├─ RegExp? ───────────────► Return string representation
│
├─ Error? ────────────────► Return { name, message, stack }
│
├─ DOM Element? ──────────► Return tag string
│
├─ Array? ────────────────► Recursively clone each item
│
├─ Plain Object? ─────────► Recursively clone each property
│
└─ Other? ────────────────► Try JSON.parse(JSON.stringify())
```

## Component Responsibilities

### Content Script (content.js)

-   ✅ Intercept console methods
-   ✅ Deep clone arguments
-   ✅ Store logs in memory
-   ✅ Respond to popup queries
-   ❌ Does NOT filter or format
-   ❌ Does NOT communicate with background

### Popup (popup.js)

-   ✅ Query content script for logs
-   ✅ Filter logs by pattern
-   ✅ Display logs in UI
-   ✅ Format and copy logs
-   ✅ Auto-refresh every 2 seconds
-   ❌ Does NOT capture logs itself
-   ❌ Does NOT modify page console

### Background (background.js)

-   ✅ Initialize default settings
-   ✅ Respond to settings queries
-   ❌ Does NOT handle log data
-   ❌ Does NOT communicate with content script

## Storage

### Chrome Storage (Sync)

```javascript
{
  pattern: 'some pattern',     // User's filter pattern
  useRegex: false              // Regex mode enabled?
}
```

### Content Script Memory

```javascript
consoleLogs = [
  { type: 'log', timestamp: '...', preview: '...', args: [...] },
  { type: 'log', timestamp: '...', preview: '...', args: [...] },
  // ... up to 5000 logs
]
```

### Popup Memory (Temporary)

```javascript
extractedLogs = [
    /* All logs from content script */
];
filteredLogs = [
    /* Logs matching current filter */
];
```

## Performance Considerations

### Memory

-   Content script: ~5MB for 5000 logs (depends on log size)
-   Popup: Temporary, cleared when closed
-   Deep cloning: WeakMap prevents circular reference loops

### CPU

-   Interception: Minimal overhead (runs on every console call)
-   Cloning: O(n) where n = object size
-   Filtering: O(m) where m = number of logs
-   Auto-refresh: Every 2 seconds (doesn't block UI)

### Network

-   None! All processing is local

## Security

### XSS Prevention

-   All log content is escaped before display
-   `escapeHtml()` prevents script injection

### Permissions

-   `activeTab`: Only access active tab when extension is clicked
-   `storage`: Only sync user settings
-   `scripting`: Required for content script injection

### Data Privacy

-   All data stays local (never sent to server)
-   Logs cleared when tab closes
-   No tracking or analytics

## Extension Lifecycle

```
User installs extension
    │
    ├─► background.js: Initialize settings
    │
User opens webpage
    │
    ├─► content.js: Inject and start intercepting
    │
User interacts with page
    │
    ├─► Logs captured and stored (up to 5000)
    │
User clicks extension icon
    │
    ├─► popup.html: Open popup
    ├─► popup.js: Query content script
    ├─► Auto-refresh: Every 2 seconds
    │
User closes popup
    │
    ├─► Auto-refresh: Stopped
    ├─► Logs remain in content script
    │
User closes tab
    │
    └─► Logs cleared from memory
```

## Troubleshooting Flow

```
Logs not appearing?
    │
    ├─► Is content script loaded?
    │   └─► No: Refresh page (F5)
    │
    ├─► Are logs in DevTools console?
    │   └─► No: Page isn't logging anything
    │
    ├─► Is filter too restrictive?
    │   └─► Yes: Clear filter or adjust pattern
    │
    └─► Check for error messages in popup
```
