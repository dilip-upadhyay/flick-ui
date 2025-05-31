// Test script to simulate preview functionality
console.log('Testing preview functionality...');

// Simulate the showPreview method
function testShowPreview() {
    // Create a mock config
    const config = {
        type: 'layout',
        components: [
            {
                id: 'test-1',
                type: 'text',
                content: 'Test Preview',
                styles: {}
            }
        ],
        layout: { type: 'grid', columns: 2, gap: '16px' },
        metadata: { title: 'Test Layout' }
    };

    console.log('Mock config:', config);

    // Test session storage
    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            sessionStorage.setItem('preview-config', JSON.stringify(config));
            console.log('✓ Config stored in sessionStorage successfully');
            
            // Test retrieval
            const storedConfig = sessionStorage.getItem('preview-config');
            const parsedConfig = JSON.parse(storedConfig);
            console.log('✓ Config retrieved from sessionStorage successfully:', parsedConfig);
            
            // Test opening new window (would need to be done in actual browser)
            const previewUrl = `${window.location.origin}/preview`;
            console.log('✓ Preview URL would be:', previewUrl);
            
        } catch (error) {
            console.error('✗ Error in sessionStorage operations:', error);
        }
    } else {
        console.warn('✗ sessionStorage not available');
    }
}

// Run the test
testShowPreview();
