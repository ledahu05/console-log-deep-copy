// Page script - runs in the page's main context to intercept console before other scripts
(function () {
    'use strict';

    const consoleLogs = [];
    const maxLogs = 5000;

    // Store original console methods IMMEDIATELY
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    // Deep clone function
    function deepClone(obj, seen = new WeakMap()) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (seen.has(obj)) {
            return '[Circular Reference]';
        }
        if (obj instanceof Date) {
            return obj.toISOString();
        }
        if (obj instanceof RegExp) {
            return obj.toString();
        }
        if (obj instanceof Error) {
            return {
                name: obj.name,
                message: obj.message,
                stack: obj.stack
            };
        }
        if (obj instanceof Element) {
            return `[${obj.tagName}${obj.id ? '#' + obj.id : ''}${
                obj.className ? '.' + obj.className.split(' ').join('.') : ''
            }]`;
        }
        if (Array.isArray(obj)) {
            seen.set(obj, true);
            const arr = obj.map((item) => deepClone(item, seen));
            seen.delete(obj);
            return arr;
        }
        if (obj.constructor === Object || !obj.constructor) {
            seen.set(obj, true);
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    try {
                        cloned[key] = deepClone(obj[key], seen);
                    } catch (e) {
                        cloned[key] = '[Error cloning property]';
                    }
                }
            }
            seen.delete(obj);
            return cloned;
        }
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            return '[Non-serializable object: ' + obj.constructor.name + ']';
        }
    }

    // Capture console messages
    function captureMessage(type, args) {
        const timestamp = new Date().toISOString();
        const clonedArgs = args.map((arg) => deepClone(arg));

        let preview = '';
        for (let arg of args) {
            if (typeof arg === 'string') {
                preview = arg;
                break;
            }
        }
        if (!preview && args.length > 0) {
            try {
                preview = String(args[0]);
            } catch (e) {
                preview = '[Object]';
            }
        }

        const logEntry = {
            type: type,
            timestamp: timestamp,
            preview: preview,
            args: clonedArgs,
            source: 'console'
        };

        consoleLogs.push(logEntry);
        if (consoleLogs.length > maxLogs) {
            consoleLogs.shift();
        }
    }

    // Override console methods IMMEDIATELY - before any other script
    ['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
        console[method] = function (...args) {
            captureMessage(method, args);
            originalConsole[method].apply(console, args);
        };
    });

    // Listen for requests from content script
    window.addEventListener('__consoleLogExtractor_getLogs', function () {
        window.dispatchEvent(
            new CustomEvent('__consoleLogExtractor_logsResponse', {
                detail: { logs: consoleLogs }
            })
        );
    });

    window.addEventListener('__consoleLogExtractor_clearLogs', function () {
        consoleLogs.length = 0;
        window.dispatchEvent(
            new CustomEvent('__consoleLogExtractor_clearResponse', {
                detail: { success: true }
            })
        );
    });

    console.log('Console Log Extractor: Ready to capture logs');
})();
