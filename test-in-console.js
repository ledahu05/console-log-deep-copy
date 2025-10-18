// Test Script for Console Log Deep Copy Extension
// Copy and paste this into your DevTools Console to test if extension is working

console.log('='.repeat(50));
console.log('Testing Console Log Deep Copy Extension');
console.log('='.repeat(50));

// Test 1: Simple log
console.log('[TEST] Simple message', { test: 'data' });

// Test 2: Your WelcomeContainer pattern
console.log('[WelcomeContainer] question', { test: 'placeholder' });

// Test 3: Multiple arguments
console.log('[TEST] Multiple args', 'string', 123, true, {
    nested: { deep: 'value' }
});

// Test 4: Array
console.log('[TEST] Array', [1, 2, 3, { id: 4 }]);

// Test 5: Complex nested structure
console.log('[TEST] Complex', {
    user: {
        name: 'Test User',
        data: [1, 2, 3],
        meta: {
            timestamp: new Date().toISOString(),
            deep: { nested: { value: 'here' } }
        }
    }
});

console.log('='.repeat(50));
console.log('✅ Test logs created!');
console.log('Now open the extension popup to see them.');
console.log('You should see 6 logs.');
console.log('Try filtering by "[TEST]" to see 4 logs.');
console.log('Try filtering by "[WelcomeContainer]" to see 1 log.');
console.log('='.repeat(50));
