// Page script - runs in the page's main context to intercept console before other scripts
(function () {
    'use strict';

    // Constants
    const MAX_LOGS = 5000;
    const EVENT_GET_LOGS = '__consoleLogExtractor_getLogs';
    const EVENT_LOGS_RESPONSE = '__consoleLogExtractor_logsResponse';
    const EVENT_CLEAR_LOGS = '__consoleLogExtractor_clearLogs';
    const EVENT_CLEAR_RESPONSE = '__consoleLogExtractor_clearResponse';
    const DATA_ELEMENT_ID = '__consoleLogExtractorData';

    const consoleLogs = [];

    // Store original console methods IMMEDIATELY before any interception
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    /**
     * Deep clones an object with support for circular references, special types
     * Handles: Date, RegExp, Error, DOM Elements, Arrays, Objects
     * @param {*} obj - Object to clone
     * @param {WeakMap} seen - Tracks visited objects to handle circular references
     * @returns {*} Deep cloned copy
     */
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

    /**
     * Captures and stores a console message with deep copy of all arguments
     * @param {string} type - Console method type (log, info, warn, error, debug)
     * @param {Array} args - Arguments passed to the console method
     */
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
        if (consoleLogs.length > MAX_LOGS) {
            consoleLogs.shift();
        }
    }

    /**
     * Gets or creates the DOM element used to share data with content script
     * Uses a hidden <script type="application/json"> element to bridge isolated worlds
     */
    function getOrCreateDataElement() {
        let dataElement = document.getElementById(DATA_ELEMENT_ID);
        if (!dataElement) {
            dataElement = document.createElement('script');
            dataElement.id = DATA_ELEMENT_ID;
            dataElement.type = 'application/json';
            dataElement.style.display = 'none';
            document.documentElement.appendChild(dataElement);
        }
        return dataElement;
    }

    // Override console methods IMMEDIATELY - before any other script can run
    ['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
        console[method] = function (...args) {
            captureMessage(method, args);
            originalConsole[method].apply(console, args);
        };
    });

    // Listen for getLogs request from content script
    document.addEventListener(EVENT_GET_LOGS, function () {
        // Store logs in DOM element (the only truly shared thing between isolated worlds)
        const dataElement = getOrCreateDataElement();
        dataElement.textContent = JSON.stringify(consoleLogs);

        // Dispatch event to notify content script that data is ready
        document.dispatchEvent(new CustomEvent(EVENT_LOGS_RESPONSE));
    });

    // Listen for clearLogs request from content script
    document.addEventListener(EVENT_CLEAR_LOGS, function () {
        consoleLogs.length = 0;

        // Update DOM element to reflect cleared state
        const dataElement = document.getElementById(DATA_ELEMENT_ID);
        if (dataElement) {
            dataElement.textContent = '[]';
        }

        document.dispatchEvent(new CustomEvent(EVENT_CLEAR_RESPONSE));
    });

    // Mark that the extractor is active
    window.__consoleLogExtractorActive = true;
    originalConsole.log(
        '%c[Console Log Extractor]%c Ready to capture logs',
        'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;',
        'color: #4CAF50;'
    );
})();
