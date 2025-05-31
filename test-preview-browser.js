// Test script to run in browser console
// This will simulate clicking the preview button

console.log('=== PREVIEW FUNCTIONALITY TEST ===');

// Check if we're on the designer page
if (window.location.pathname.includes('/designer')) {
    console.log('✓ On designer page');
    
    // Try to find the preview button
    const previewButton = document.querySelector('button[mattooltip="Preview Layout"]');
    if (previewButton) {
        console.log('✓ Preview button found');
        console.log('Button element:', previewButton);
        
        // Simulate click
        console.log('Simulating preview button click...');
        previewButton.click();
        
    } else {
        console.log('✗ Preview button not found');
        
        // Let's look for any button with preview icon
        const previewIcons = document.querySelectorAll('mat-icon');
        const previewIconButton = Array.from(previewIcons).find(icon => icon.textContent === 'preview');
        if (previewIconButton) {
            const button = previewIconButton.closest('button');
            if (button) {
                console.log('✓ Found preview button via icon');
                button.click();
            }
        } else {
            console.log('✗ No preview icon found');
        }
    }
} else {
    console.log('✗ Not on designer page. Current path:', window.location.pathname);
}

console.log('=== END TEST ===');
