# Copy Selected Feature

## Overview

The extension now supports selecting individual logs and copying only the selected ones. This is useful when you want to copy specific logs from a large set without filtering.

## How to Use

### 1. Select Logs

Each log entry now has a checkbox on the left side of the header:

```
┌─────────────────────────────────────────┐
│ ☐ [LOG] 10:30:45                        │
│   console.log('test', { data: 123 })    │
│                                         │
│ ☑ [ERROR] 10:30:46                      │  ← Selected!
│   console.error('error', { code: 500 }) │
│                                         │
│ ☐ [LOG] 10:30:47                        │
│   console.log('another', [1, 2, 3])     │
└─────────────────────────────────────────┘
```

### 2. Check the Boxes

Click the checkbox next to any log you want to copy. You can select:

-   A single log
-   Multiple logs
-   All logs (or just use "Copy All" button)

### 3. Visual Feedback

**Selected logs are highlighted:**

-   Background changes to light blue (#e3f2fd)
-   Border becomes slightly thicker
-   Subtle shadow appears

**Stats show selection count:**

-   Normal: "20 of 50 logs"
-   With selection: "20 of 50 logs (3 selected)"

### 4. Copy Selected

Click the "Copy Selected" button to copy only the checked logs as JSON.

## Features

### Smart Selection

-   ✅ Selections persist while viewing the same filtered list
-   ✅ Selections are cleared when filter changes (to avoid confusion)
-   ✅ Selections are cleared when logs are refreshed
-   ✅ Checkboxes are disabled by default (unchecked)

### Visual Indicators

-   ✅ Checkboxes hover effect (slight scale on hover)
-   ✅ Selected logs have blue background
-   ✅ Stats show selection count
-   ✅ Smooth transitions

### Button Behavior

**"Copy All"**: Copies all filtered logs (ignores checkboxes)
**"Copy Selected"**: Copies only checked logs

If no logs are selected and you click "Copy Selected", you'll see:

```
⚠️ No logs selected. Check the boxes next to logs you want to copy.
```

## Example Workflow

### Scenario: Debug Specific Errors

1. **Filter logs**: Enter "error" in filter box
2. **Review results**: See 10 error logs
3. **Select interesting ones**: Check 3 specific errors you want to investigate
4. **Copy selected**: Click "Copy Selected"
5. **Paste and analyze**: Get JSON with just those 3 errors

### JSON Output

When you copy 2 selected logs, you get:

```json
[
    {
        "type": "error",
        "timestamp": "2025-10-18T10:30:45.123Z",
        "args": [
            "API Error",
            {
                "code": 500,
                "message": "Internal Server Error"
            }
        ]
    },
    {
        "type": "error",
        "timestamp": "2025-10-18T10:31:12.456Z",
        "args": [
            "Database Error",
            {
                "code": "ECONNREFUSED",
                "details": "Connection refused"
            }
        ]
    }
]
```

## UI Layout

The buttons are now arranged in a 2x2 grid:

```
┌─────────────────────────────────────┐
│ Filter: [pattern____________]       │
│ ☐ Use regex pattern                 │
│                                     │
│ ┌──────────┬──────────────────┐    │
│ │ Refresh  │ Copy All         │    │
│ ├──────────┼──────────────────┤    │
│ │ Copy     │ Clear            │    │
│ │ Selected │                  │    │
│ └──────────┴──────────────────┘    │
└─────────────────────────────────────┘
```

This layout fits nicely in the extension popup width.

## Technical Details

### State Management

```javascript
// Track selected log indices
let selectedLogIndices = new Set();

// Add/remove on checkbox change
function handleCheckboxChange(event) {
    const index = parseInt(event.target.dataset.index);
    if (event.target.checked) {
        selectedLogIndices.add(index);
    } else {
        selectedLogIndices.delete(index);
    }
}
```

### Selection Preservation

Selections are maintained based on the **index in the filtered list**. When the filter changes:

-   The filtered list changes
-   Indices change
-   Selections are cleared (to avoid copying wrong logs)

### Copy Logic

```javascript
// Copy only selected logs
const logsToCopy = Array.from(selectedLogIndices)
    .sort((a, b) => a - b) // Keep original order
    .map((index) => filteredLogs[index])
    .map((log) => ({
        type: log.type,
        timestamp: log.timestamp,
        args: log.args
    }));
```

## Keyboard Shortcuts (Future Enhancement)

Potential future additions:

-   `Ctrl+A` - Select all visible logs
-   `Ctrl+Shift+A` - Deselect all
-   `Space` - Toggle selection on focused log
-   `Ctrl+C` - Copy selected (if any selected, otherwise copy all)

## Benefits

### Precision

-   Copy exactly what you need, no more, no less
-   Avoid copying irrelevant logs mixed with important ones

### Workflow

-   Filter → Select → Copy → Analyze
-   No need to manually extract specific logs from large JSON output

### Flexibility

-   Quick filter + select for complex queries
-   "Copy All" still available for simple cases

## Use Cases

### 1. Error Analysis

```
Filter: "error"
Select: Only critical errors (500s)
Copy: Just the critical ones for reporting
```

### 2. Performance Tracking

```
Filter: "API Response"
Select: Slow responses (>1000ms)
Copy: Just the slow ones for analysis
```

### 3. User Journey

```
Filter: "user_action"
Select: Specific user's actions
Copy: Complete journey for that user
```

### 4. A/B Testing

```
Filter: "experiment"
Select: Variant A logs
Copy: Data for variant comparison
```

## Tips

1. **Use filter first**: Narrow down to relevant logs, then select specific ones
2. **Visual cues**: Selected logs are blue - easy to see what you've chosen
3. **Stats check**: Always check "(X selected)" to confirm your selection
4. **Copy All vs Selected**:
    - Copy All: Quick export of everything filtered
    - Copy Selected: Precise export of handpicked logs

## Troubleshooting

### Selections disappear when I type in filter

**Expected behavior**: Selections are cleared when filter changes to prevent copying wrong logs.

### Can't see checkboxes

**Solution**: Make sure you've reloaded the extension and the page. Checkboxes appear to the left of [LOG], [ERROR], etc.

### "No logs selected" warning

**Solution**: Check at least one checkbox before clicking "Copy Selected"

### Want to copy all filtered logs

**Solution**: Use "Copy All" button - no need to check all boxes

---

## Implementation Files

-   `popup.html`: Added "Copy Selected" button
-   `popup.js`: Added selection tracking and copy selected functionality
-   `popup.css`: Added checkbox and selected log styling
-   `README.md`: Updated documentation

## Version

Added in version 3.1.0

Enjoy selective log copying! 🎯
