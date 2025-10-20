# Console Log Deep Copy Extension

A Chrome extension that captures console logs from web pages and allows you to filter and deep copy them with full object/array structure preservation.

## Features

-   **Auto-capture**: Automatically captures all console.log, console.info, console.warn, console.error, and console.debug calls
-   **Real-time updates**: Logs refresh automatically every 2 seconds while the popup is open
-   **Pattern filtering**: Filter logs by text pattern or regex
-   **Deep copy**: Copy filtered logs as JSON with full object/array structures preserved
-   **Visual display**: Color-coded log types with timestamps
-   **SPA support**: Works across Single Page Application (SPA) navigation with automatic script injection
-   **Selective copy**: Choose specific logs to copy using checkboxes

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory

## Usage

### Basic Workflow

1. **Load your page** (e.g., `localhost:3000` or `localhost:5173`)
2. **Open the extension** by clicking its icon in the toolbar
3. **View logs**: All console logs are automatically displayed
4. **Filter logs** (optional): Enter a pattern like "some pattern" to filter
5. **Copy logs**: Click "Copy All" to deep copy filtered logs to clipboard

### Example

If your page has:

```javascript
console.log('some pattern', { id: 1, data: [1, 2, 3] });
console.log('some pattern', { id: 2, data: [4, 5, 6] });
console.log('other message', 'ignored');
```

1. Open the extension
2. Enter "some pattern" in the filter
3. Click "Copy All"
4. Paste to get:

```json
[
    {
        "type": "log",
        "timestamp": "2025-10-18T10:30:45.123Z",
        "args": [
            "some pattern",
            {
                "id": 1,
                "data": [1, 2, 3]
            }
        ]
    },
    {
        "type": "log",
        "timestamp": "2025-10-18T10:30:45.456Z",
        "args": [
            "some pattern",
            {
                "id": 2,
                "data": [4, 5, 6]
            }
        ]
    }
]
```

## Features in Detail

### Pattern Filtering

-   **Text search**: Enter any text to filter logs (case-insensitive)
-   **Regex**: Enable "Use regex pattern" for advanced filtering
-   Filtering is based on the first string argument of each log

### Deep Copy

The extension preserves:

-   ✅ Objects with nested properties
-   ✅ Arrays and nested arrays
-   ✅ Primitive values (strings, numbers, booleans)
-   ✅ null and undefined
-   ✅ Dates (as ISO strings)
-   ✅ Regular expressions (as strings)
-   ✅ Error objects (with name, message, stack)
-   ⚠️ Circular references (marked as "[Circular Reference]")
-   ⚠️ DOM elements (represented as tag strings)

### Buttons

-   **Refresh**: Manually refresh logs from the page
-   **Copy All**: Copy all filtered logs as JSON to clipboard
-   **Copy Selected**: Copy only the selected logs (checked checkboxes) as JSON
-   **Clear**: Clear all captured logs from memory

### Selecting Logs

Each log entry has a checkbox that allows you to select specific logs:

1. Check the boxes next to the logs you want to copy
2. Click "Copy Selected" to copy only those logs
3. The stats will show how many logs are selected: "X of Y logs (Z selected)"
4. Selections are cleared when you change the filter

## Supported Console Methods

-   `console.log()`
-   `console.info()`
-   `console.warn()`
-   `console.error()`
-   `console.debug()`

## Limitations

-   Maximum 5000 logs stored (oldest are removed when limit is reached)
-   Content script must be injected (refresh page if logs don't appear)
-   Some non-serializable objects may be represented as strings
-   Auto-refresh occurs every 2 seconds (not real-time instant updates)

## Development

### File Structure

```
deep-copy/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic and filtering
├── content.js          # Content script - bridges page and extension
├── page-script.js      # Page script - intercepts console in page context
├── background.js       # Service worker
└── icons/              # Extension icons
```

### How It Works

The extension uses a sophisticated architecture to overcome Chrome's isolated worlds limitation:

#### The Isolated Worlds Problem

Chrome extensions have three separate JavaScript contexts:
- **Page Context**: Where the website's JavaScript runs
- **Content Script Context**: An isolated environment with DOM access but separate global scope
- **Extension Context**: Where popup.js and background scripts run

The problem: `console.log()` calls happen in the page context, but we need to capture them in the content script to send to the popup.

#### Our Solution

1. **Page Script Injection** (`page-script.js`):
   - Injected directly into the page context at the earliest possible moment
   - Intercepts console methods before any other scripts run
   - Deep clones all arguments to preserve object state at time of logging
   - Stores logs in a hidden DOM element (`<script type="application/json">`)

2. **Content Script Bridge** (`content.js`):
   - Runs in isolated world but shares the DOM with page context
   - Listens for requests from popup via Chrome message passing
   - Communicates with page script using DOM events
   - Reads logs from shared DOM element (the only truly shared data structure)

3. **Popup Interface** (`popup.js`):
   - Requests logs from content script every 2 seconds
   - Applies filtering and displays results
   - Handles copy-to-clipboard functionality

#### Communication Flow

```
Popup (Extension Context)
    ↓ chrome.runtime.sendMessage()
Content Script (Isolated World)
    ↓ document.dispatchEvent() → document.addEventListener()
Page Script (Page Context)
    ↓ Writes JSON to DOM element
Content Script (Isolated World)
    ↓ Reads from shared DOM element
Popup (Extension Context)
```

#### SPA Navigation Handling

When navigating in Single Page Applications:
- Page context is reset (page script stops working)
- Content script persists but loses connection
- Solution: Timeout-based detection and automatic re-injection
- If page script doesn't respond within 100ms, content script re-injects it

### Key Technologies

-   Chrome Extension Manifest V3
-   Content Scripts in isolated worlds
-   Page script injection for early console interception
-   DOM-based inter-world communication
-   Deep cloning with circular reference handling
-   Event-driven architecture

## Troubleshooting

**Logs not appearing?**

-   Refresh the page to ensure content script is injected
-   Check that the page is actually logging to console
-   Open DevTools console to verify logs are there
-   Look for the green "[Console Log Extractor] Ready to capture logs" message in the console

**Extension not working after SPA navigation?**

-   The extension now automatically re-injects the page script when needed
-   When you open the popup after SPA navigation, it may return empty logs on first attempt
-   The extension will auto-inject and subsequent attempts (within 2s) will work
-   Look for these messages in DevTools console:
    -   `[Console Log Extractor] Content script loaded` - Content script active
    -   `[Console Log Extractor] Page script injected` - Script re-injected after SPA navigation
    -   `[Console Log Extractor] Ready to capture logs` - Page script is working
-   If auto-injection fails, manually refresh the page (F5)

**Extension not working?**

-   Make sure you're on a supported page (not chrome:// or extension pages)
-   Reload the extension in chrome://extensions
-   Check for any errors in the extension's console

**Deep copy incomplete?**

-   Some objects may not be fully serializable (e.g., functions, symbols)
-   Check console for any serialization errors
-   Try logging simpler data structures

## Version History

-   **v3.2.0**: Code refactoring and improved documentation with technical architecture details
-   **v3.1.0**: Fixed SPA support using DOM-based communication between isolated worlds
-   **v3.0.0**: Complete refactor with deep copy support and auto-loading
-   **v2.0.0**: Added debugger protocol support
-   **v1.0.0**: Initial release

## License

MIT License - feel free to use and modify as needed.
