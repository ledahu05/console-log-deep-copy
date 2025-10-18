# Quick Start Guide

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select this folder (`deep-copy`)

## Testing the Extension

### Option 1: Use the Test Page

1. Open `test-page.html` in Chrome (just double-click it or drag to browser)
2. Open DevTools (F12) to see the console
3. Click the test buttons to generate logs
4. Click the extension icon in the toolbar
5. Try filtering with "some pattern" or "test data"
6. Click "Copy All" to copy the filtered logs

### Option 2: Use Your Own Page

1. Open your app (e.g., `localhost:3000` or `localhost:5173`)
2. Make sure it has console.log statements like:
    ```javascript
    console.log('some pattern', { id: 1, data: [1, 2, 3] });
    ```
3. Click the extension icon
4. Logs will auto-load
5. Enter filter pattern (e.g., "some pattern")
6. Click "Copy All"

## How It Works

### Automatic Capture

The extension intercepts all console methods:

-   `console.log()`
-   `console.info()`
-   `console.warn()`
-   `console.error()`
-   `console.debug()`

### Filtering

Filter works on the **first string argument** of each log:

```javascript
console.log('FILTER_THIS', { data: 'content' });
//          ^^^^^^^^^^^^
//          This string is used for filtering
```

### Deep Copy Format

When you click "Copy All", you get JSON like this:

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
    }
]
```

All objects and arrays are **fully preserved** with their structure!

## Troubleshooting

### "Content script not loaded"

**Solution**: Refresh the page (F5 or Ctrl+R)

### No logs appearing

1. Make sure the page has console.log statements
2. Check DevTools console to verify logs exist
3. Try clicking "Refresh" button in the extension

### Filter not working

-   Filter is case-insensitive
-   It searches in the first string argument
-   Try "Use regex pattern" for advanced filtering

## Tips

-   Logs auto-refresh every 2 seconds
-   Maximum 5000 logs stored (oldest removed first)
-   Click "Clear" to reset captured logs
-   Use regex for complex patterns (e.g., `error|warning`)

## Example Use Case

You're debugging an API response:

```javascript
// Your code
console.log('API Response', {
    status: 200,
    data: { users: [...] }
});
```

1. Open extension
2. Filter: "API Response"
3. Click "Copy All"
4. Paste in your notes/docs
5. Full JSON structure is preserved!

Enjoy! 🚀
