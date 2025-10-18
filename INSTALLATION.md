# Installation & Testing Guide

## Step 1: Install the Extension

### For Chrome/Edge/Brave

1. **Open Extensions Page**

    - Chrome: Navigate to `chrome://extensions/`
    - Edge: Navigate to `edge://extensions/`
    - Brave: Navigate to `brave://extensions/`

2. **Enable Developer Mode**

    - Toggle "Developer mode" switch in the top-right corner

3. **Load the Extension**

    - Click "Load unpacked" button
    - Navigate to and select this directory: `/home/chris/workspace/deep-copy`
    - Click "Select Folder"

4. **Verify Installation**
    - You should see "Console Log Deep Copy" in your extensions list
    - The extension icon should appear in your browser toolbar
    - Version should show: 3.0.0

### Troubleshooting Installation

❌ **"Manifest file is missing or unreadable"**

-   Make sure you selected the correct folder containing `manifest.json`

❌ **Extension icon not showing**

-   Click the puzzle piece icon in toolbar
-   Pin "Console Log Deep Copy"

## Step 2: Test with Test Page

### Quick Test (5 minutes)

1. **Open Test Page**

    ```bash
    # Option 1: Open directly in browser
    open /home/chris/workspace/deep-copy/test-page.html

    # Option 2: Use file:// URL
    file:///home/chris/workspace/deep-copy/test-page.html
    ```

2. **Open DevTools**

    - Press `F12` or `Ctrl+Shift+I` (Linux/Windows)
    - Press `Cmd+Option+I` (Mac)
    - Go to Console tab

3. **Generate Logs**

    - Click button: "Log with 'some pattern'"
    - You should see 3 console logs appear in DevTools

4. **Open Extension**

    - Click the extension icon in toolbar
    - Popup should open and show 3 logs automatically
    - Look for: "3 of X logs" in the stats area

5. **Test Filtering**

    - Type "some pattern" in the filter box
    - Should show: "3 of X logs"
    - Clear filter → Should show all logs

6. **Test Copy**

    - With "some pattern" filter active
    - Click "Copy All" button
    - Should see: "Copied 3 logs with deep copy!"
    - Paste (Ctrl+V) into text editor

7. **Verify Output**
    ```json
    [
      {
        "type": "log",
        "timestamp": "2025-10-18T...",
        "args": [
          "some pattern",
          {
            "id": 1,
            "data": [1, 2, 3]
          }
        ]
      },
      ...
    ]
    ```

### Expected Results ✅

-   [ ] Extension loads without errors
-   [ ] Logs appear automatically when popup opens
-   [ ] Filter works (shows filtered count)
-   [ ] Copy creates valid JSON
-   [ ] Objects and arrays are fully structured
-   [ ] Auto-refresh updates logs every 2 seconds

## Step 3: Test with Your Application

### Setup Your App

1. **Start Your Dev Server**

    ```bash
    # Example: React/Vite
    npm run dev
    # or
    yarn dev
    ```

2. **Add Test Logs** (if needed)

    ```javascript
    // Add to your app code
    console.log('some pattern', {
        id: 1,
        data: [1, 2, 3],
        nested: { deep: { value: 'test' } }
    });

    console.log('some pattern', {
        id: 2,
        data: [4, 5, 6]
    });
    ```

3. **Open Your App**

    - Navigate to `localhost:3000` or `localhost:5173`
    - Trigger actions that generate console logs

4. **Verify in DevTools**

    - Open DevTools console
    - Confirm logs are appearing

5. **Test Extension**
    - Click extension icon
    - Logs should load automatically
    - Filter by your pattern
    - Copy and verify JSON structure

### Real-World Test Cases

#### Test Case 1: API Response

```javascript
console.log('API Response', {
    status: 200,
    data: {
        users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ]
    }
});
```

✅ Filter: "API Response" → Should show 1 log
✅ Copy should preserve full nested structure

#### Test Case 2: Error Logging

```javascript
console.error('API Error', {
    code: 500,
    message: 'Server error',
    stack: new Error().stack
});
```

✅ Should appear with red color in extension
✅ Type should be "error"

#### Test Case 3: Multiple Arguments

```javascript
console.log('Debug:', 'value1', 123, true, { obj: 'test' }, [1, 2, 3]);
```

✅ All arguments should be in `args` array
✅ Preview should be "Debug:"

## Step 4: Advanced Testing

### Test Edge Cases

1. **Large Objects**

    ```javascript
    const large = {
        /* 1000+ properties */
    };
    console.log('large object', large);
    ```

    - Should handle without freezing

2. **Circular References**

    ```javascript
    const obj = { a: 1 };
    obj.self = obj;
    console.log('circular', obj);
    ```

    - Should show "[Circular Reference]"

3. **Special Types**

    ```javascript
    console.log('special', new Date(), /regex/, new Error('test'));
    ```

    - Date → ISO string
    - RegExp → string
    - Error → object with name/message/stack

4. **Many Logs**
    - Generate 100+ logs quickly
    - Extension should handle smoothly
    - Oldest logs removed after 5000

### Performance Test

1. **Generate 1000 Logs**

    ```javascript
    for (let i = 0; i < 1000; i++) {
        console.log('test ' + i, { iteration: i, data: [i, i + 1, i + 2] });
    }
    ```

2. **Open Extension**

    - Should load within 1-2 seconds
    - UI should remain responsive
    - Filtering should be instant

3. **Copy Large Set**
    - Filter to get ~500 logs
    - Click Copy All
    - Should complete within 1 second

## Step 5: Verify All Features

### Checklist

-   [ ] **Auto-Load**: Logs appear without clicking "Refresh"
-   [ ] **Auto-Refresh**: Logs update every 2 seconds
-   [ ] **Filter**: Text search works (case-insensitive)
-   [ ] **Regex**: Regex mode works for advanced patterns
-   [ ] **Copy**: Creates valid JSON with full structure
-   [ ] **Clear**: Clears all logs from memory
-   [ ] **Refresh**: Manually refreshes when clicked
-   [ ] **Notifications**: Shows success/error messages
-   [ ] **Stats**: Shows "X of Y logs" correctly
-   [ ] **Colors**: Different log types have different colors
-   [ ] **Timestamps**: Shows correct time for each log
-   [ ] **Settings**: Filter pattern persists between sessions

## Common Issues & Solutions

### Issue: "Content script not loaded"

**Solution**: Refresh the webpage (F5)
**Why**: Extension injects content script on page load

### Issue: No logs appearing

**Solutions**:

1. Check DevTools console - are logs there?
2. Refresh the page
3. Click "Refresh" button in extension
4. Reload the extension in chrome://extensions

### Issue: Filter not working

**Check**:

-   Is the pattern in the first string argument?
-   Is regex syntax correct (if using regex mode)?
-   Try clearing filter and see if logs appear

### Issue: Copy gives error

**Solutions**:

1. Check clipboard permissions
2. Try copying fewer logs (filter first)
3. Check browser console for errors

### Issue: Extension crashes

**Solutions**:

1. Check for memory issues (too many logs)
2. Click "Clear" to reset
3. Reload extension

## Debugging the Extension

### View Extension Logs

1. **Popup Console**

    - Right-click extension popup
    - Select "Inspect"
    - Check Console tab

2. **Background Console**

    - Go to `chrome://extensions/`
    - Find "Console Log Deep Copy"
    - Click "service worker" link
    - Check Console

3. **Content Script Console**
    - Open page DevTools (F12)
    - Check Console tab
    - Look for extension logs

### Enable Verbose Logging

Add this to test pages:

```javascript
// See what extension is capturing
window.addEventListener('console-capture', (e) => {
    console.log('Captured:', e.detail);
});
```

## Success Criteria

Your extension is working correctly if:

✅ Logs appear automatically when popup opens
✅ Filter works and shows correct count
✅ Copy produces valid JSON
✅ Objects/arrays are fully preserved
✅ Auto-refresh updates logs
✅ No errors in any console
✅ Extension works on multiple tabs
✅ Settings persist across sessions

## Next Steps

Once testing is complete:

1. Read `README.md` for detailed documentation
2. Read `QUICKSTART.md` for usage tips
3. Read `ARCHITECTURE.md` to understand how it works
4. Customize for your needs
5. Share with your team!

## Support

If you encounter issues:

1. Check this guide first
2. Look for errors in browser console
3. Try with test-page.html to isolate issues
4. Check manifest.json permissions
5. Verify Chrome version compatibility

---

**Ready to use!** Start capturing and deep copying your console logs! 🚀
