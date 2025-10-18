// DevTools integration for log extraction
console.log('DevTools script loading...');

// Check if we're in the right context
if (typeof chrome !== 'undefined' && chrome.devtools) {
    console.log('Chrome DevTools API available');

    chrome.devtools.panels.create(
        'Log Extractor',
        'icons/icon16.png',
        'devtools-panel.html',
        function (panel) {
            if (chrome.runtime.lastError) {
                console.error(
                    'Error creating DevTools panel:',
                    chrome.runtime.lastError
                );
            } else {
                console.log(
                    'DevTools Log Extractor panel created successfully'
                );
                console.log('Panel object:', panel);
            }
        }
    );
} else {
    console.error('Chrome DevTools API not available');
    console.log('Chrome object:', typeof chrome);
    console.log('DevTools object:', typeof chrome?.devtools);
}
