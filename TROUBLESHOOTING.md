# Troubleshooting Guide

## Issue: Logs in DevTools but not in Extension

### Why This Happens

The extension only captures logs that occur **after** the content script loads. If logs appear before the extension is ready, they won't be captured.

### Solution 1: Refresh the Page ✅

**This is the easiest fix:**

1. Refresh your page (F5 or Ctrl+R)
2. Logs will be created again
3. Content script will capture them this time
4. Open extension to see them

### Solution 2: Check Content Script is Loaded

**In DevTools Console, check for this message:**

```
Console Log Extractor: Ready to capture logs
```

If you see this, the extension is working. Any logs **after** this message will be captured.

### Solution 3: Force Re-logging

**Add this to your app to re-trigger logs:**

```javascript
// In your browser console, run:
window.location.reload();

// Or trigger your logging code again
```

### Solution 4: Check Extension Status

1. **Open extension popup**
2. Look for the stats line (e.g., "5 of 5 logs")
3. If it says "0 of 0 logs", the content script might not be injected

**To fix:**

-   Refresh the page
-   Reload the extension in `chrome://extensions/`
-   Make sure the page is not a chrome:// URL (extension can't run there)

## Diagnostic Checklist

### Step 1: Check Content Script

```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for: "Console Log Extractor: Ready to capture logs"
4. ✅ If you see it: Extension is loaded
5. ❌ If you don't: Reload extension or refresh page
```

### Step 2: Test with New Log

```
1. In DevTools Console, type:
   console.log('test message', { test: 'data' })

2. Open extension popup
3. Should show "1 of X logs"
4. Should see "test message" in the list
```

### Step 3: Check Timing

```
Timeline of events:
1. Page loads
2. Your app logs: [WelcomeContainer] question {...}  ← Too early!
3. Content script loads
4. Content script ready  ← Extension can now capture

Solution: Refresh page so step 2 happens AFTER step 4
```

## Common Scenarios

### Scenario 1: React/Vite Development

```
Problem: Logs happen during initial render
Solution: Refresh page after extension is loaded
```

### Scenario 2: Logs from inject.js

```
If you see "inject.js:94" in DevTools, these might be
from another extension or injected script.

These logs are captured if they use the native console
after our content script loads.
```

### Scenario 3: Build Tools

```
Some build tools (Vite, Webpack) inject their own logging.
These are captured like any other console.log.
```

## Testing Extension is Working

### Quick Test

**In DevTools Console, run these commands:**

```javascript
// Test 1: Simple log
console.log('test 1', { id: 1 });

// Test 2: With your pattern
console.log('[WelcomeContainer] question', { test: 'placeholder' });

// Test 3: Multiple logs
for (let i = 0; i < 5; i++) {
    console.log('test ' + i, { iteration: i });
}
```

**Then open extension:**

-   Should see 7 logs (1 + 1 + 5)
-   Filter by "test" → should show 6 logs
-   Filter by "WelcomeContainer" → should show 1 log

## Advanced Debugging

### Check Content Script is Injected

**Method 1: Via Console**

```javascript
// In DevTools Console, check if our script modified console:
console.log.toString();
// Should show: "function () { [native code] }" or similar
```

**Method 2: Via Extension**

```
1. Go to chrome://extensions/
2. Find "Console Log Deep Copy"
3. Click "Details"
4. Under "Inspect views:", click "service worker"
5. Check for any errors
```

### Enable Verbose Logging

Add this to the top of `content.js` (for debugging):

```javascript
// Add after line 6
console.log('[Extension] Script loading...', new Date().toISOString());
```

This will help you see exactly when the content script loads.

## Known Issues

### Issue 1: Page Loaded Before Extension

**Symptom:** Old logs not captured
**Solution:** Refresh page

### Issue 2: Extension Not Injected

**Symptom:** No logs captured at all, no "Ready to capture" message
**Solution:**

-   Check manifest.json has correct content_scripts
-   Reload extension
-   Refresh page

### Issue 3: iframe or Shadow DOM

**Symptom:** Logs from iframes not captured
**Note:** Extension should capture these (all_frames: true in manifest)
**Solution:** Make sure logs are from main page, not chrome-extension:// URLs

## Still Not Working?

### Debug Steps:

1. **Test with test-page.html**

    ```bash
    file:///home/chris/workspace/deep-copy/test-page.html
    ```

    If this works, the issue is with your app's page load timing.

2. **Check Extension Logs**

    - Right-click extension popup → Inspect
    - Check Console for errors

3. **Check Content Script Injection**

    ```javascript
    // In DevTools Console:
    chrome.runtime.sendMessage(
        'extension-id-here',
        { action: 'getLogs' },
        console.log
    );
    ```

4. **Reload Everything**
    - Reload extension in chrome://extensions/
    - Refresh your page (F5)
    - Clear browser cache if needed

## Pro Tips

### Tip 1: Development Workflow

```
1. Start your dev server (npm run dev)
2. Load extension
3. Open your app
4. Now logs will be captured
5. Don't need to reload extension unless you modify it
```

### Tip 2: Persistent Logging

```javascript
// In your app, add a helper to ensure logs are captured:
export const debugLog = (...args) => {
    console.log('[DEBUG]', ...args);
};

// Use in your components:
debugLog('WelcomeContainer question', data);
```

### Tip 3: Auto-Refresh

```
The extension auto-refreshes every 2 seconds.
So if you trigger new logs, they'll appear automatically
without closing/opening the popup.
```

## Contact / Report Issues

If none of these solutions work:

1. Check the browser console for errors
2. Check the extension console (right-click popup → Inspect)
3. Verify you're on the latest version (v3.0.0)
4. Try the test-page.html to isolate the issue

---

**Most common fix: Just refresh the page! 🔄**
