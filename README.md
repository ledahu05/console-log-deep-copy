# Console Log Deep Copy Extension

A Chrome extension that captures console logs from web pages and allows you to filter and deep copy them with full object/array structure preservation.

## Features

-   **Auto-capture**: Automatically captures all console.log, console.info, console.warn, console.error, and console.debug calls
-   **Real-time updates**: Logs refresh automatically every 2 seconds while the popup is open
-   **Pattern filtering**: Filter logs by text pattern or regex
-   **Deep copy**: Copy filtered logs as JSON with full object/array structures preserved
-   **Visual display**: Color-coded log types with timestamps

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
├── content.js          # Console interception and log capture
├── background.js       # Service worker
└── icons/              # Extension icons
```

### Key Technologies

-   Chrome Extension Manifest V3
-   Content Scripts for console interception
-   Deep cloning with circular reference handling
-   Real-time filtering and display

## Troubleshooting

**Logs not appearing?**

-   Refresh the page to ensure content script is injected
-   Check that the page is actually logging to console
-   Open DevTools console to verify logs are there

**Extension not working?**

-   Make sure you're on a supported page (not chrome:// or extension pages)
-   Reload the extension in chrome://extensions
-   Check for any errors in the extension's console

**Deep copy incomplete?**

-   Some objects may not be fully serializable (e.g., functions, symbols)
-   Check console for any serialization errors
-   Try logging simpler data structures

## Version History

-   **v3.0.0**: Complete refactor with deep copy support and auto-loading
-   **v2.0.0**: Added debugger protocol support
-   **v1.0.0**: Initial release

## License

MIT License - feel free to use and modify as needed.
