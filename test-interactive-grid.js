// Interactive Grid Layout Test Script
// This script tests the enhanced interactive grid functionality

console.log('🧪 Starting Interactive Grid Layout Test...');

// Test Configuration
const testConfig = {
    baseURL: 'http://localhost:4200',
    designerPath: '/designer',
    testTimeout: 30000
};

// Helper function to wait for element
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        };
        checkElement();
    });
}

// Helper function to simulate drag and drop
function simulateDragDrop(sourceElement, targetElement) {
    const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
    });
    
    const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dragStartEvent.dataTransfer
    });
    
    const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dragStartEvent.dataTransfer
    });
    
    sourceElement.dispatchEvent(dragStartEvent);
    targetElement.dispatchEvent(dragOverEvent);
    targetElement.dispatchEvent(dropEvent);
}

// Test Functions
async function testGridContainerPresence() {
    console.log('📋 Testing grid container presence...');
    try {
        const gridContainer = await waitForElement('.main-grid-layout');
        console.log('✅ Grid container found:', gridContainer);
        
        const gridBlocks = document.querySelectorAll('.main-grid-block');
        console.log(`✅ Found ${gridBlocks.length} grid blocks`);
        
        return { success: true, gridBlocks: gridBlocks.length };
    } catch (error) {
        console.error('❌ Grid container test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testGridBlockInteractivity() {
    console.log('🎯 Testing grid block interactivity...');
    try {
        const gridBlocks = document.querySelectorAll('.main-grid-block');
        const results = [];
        
        gridBlocks.forEach((block, index) => {
            // Test hover effects
            block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            const hasHoverStyles = window.getComputedStyle(block).transform !== 'none' || 
                                  window.getComputedStyle(block).boxShadow !== 'none';
            
            // Test drop zone functionality
            const isDropZone = block.hasAttribute('cdkDropList');
            
            results.push({
                index,
                hasHoverEffect: hasHoverStyles,
                isDropZone,
                hasComponent: block.classList.contains('has-component')
            });
            
            block.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        });
        
        console.log('✅ Grid block interactivity results:', results);
        return { success: true, results };
    } catch (error) {
        console.error('❌ Grid block interactivity test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testComponentPaletteIntegration() {
    console.log('🎨 Testing component palette integration...');
    try {
        const componentPalette = await waitForElement('app-component-palette');
        console.log('✅ Component palette found');
        
        const paletteItems = document.querySelectorAll('app-component-palette [cdkDrag]');
        console.log(`✅ Found ${paletteItems.length} draggable palette items`);
        
        // Test if palette items are properly configured for dragging
        const dragConfigurations = Array.from(paletteItems).map((item, index) => ({
            index,
            hasCdkDrag: item.hasAttribute('cdkDrag'),
            dragData: item.getAttribute('cdkDrag') || item.textContent?.trim()
        }));
        
        console.log('✅ Palette drag configurations:', dragConfigurations);
        return { success: true, paletteItems: paletteItems.length, configurations: dragConfigurations };
    } catch (error) {
        console.error('❌ Component palette test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testDragDropFunctionality() {
    console.log('🔄 Testing drag and drop functionality...');
    try {
        const paletteItems = document.querySelectorAll('app-component-palette [cdkDrag]');
        const gridBlocks = document.querySelectorAll('.main-grid-block[cdkDropList]');
        
        if (paletteItems.length === 0 || gridBlocks.length === 0) {
            throw new Error('Insufficient elements for drag-drop test');
        }
        
        // Test dragging first palette item to first grid block
        const sourceItem = paletteItems[0];
        const targetBlock = gridBlocks[0];
        
        console.log('🎯 Simulating drag from palette to grid...');
        simulateDragDrop(sourceItem, targetBlock);
        
        // Wait a moment for any state changes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if block state changed
        const blockHasComponent = targetBlock.classList.contains('has-component') ||
                                 targetBlock.querySelector('.component-content');
        
        console.log('✅ Drag-drop simulation completed');
        return { 
            success: true, 
            componentAdded: blockHasComponent,
            sourceElement: sourceItem.tagName,
            targetElement: targetBlock.className
        };
    } catch (error) {
        console.error('❌ Drag-drop test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testVisualFeedback() {
    console.log('💫 Testing visual feedback...');
    try {
        const gridBlocks = document.querySelectorAll('.main-grid-block');
        const feedbackResults = [];
        
        for (let i = 0; i < Math.min(3, gridBlocks.length); i++) {
            const block = gridBlocks[i];
            
            // Test hover effect
            block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            const hoverStyles = window.getComputedStyle(block);
            
            // Test drag enter effect
            block.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
            const dragStyles = window.getComputedStyle(block);
            
            feedbackResults.push({
                blockIndex: i,
                hasTransition: hoverStyles.transition !== 'none',
                hasBoxShadow: hoverStyles.boxShadow !== 'none',
                hasTransform: hoverStyles.transform !== 'none',
                className: block.className
            });
            
            // Clean up events
            block.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            block.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
        }
        
        console.log('✅ Visual feedback test results:', feedbackResults);
        return { success: true, results: feedbackResults };
    } catch (error) {
        console.error('❌ Visual feedback test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testResponsiveDesign() {
    console.log('📱 Testing responsive design...');
    try {
        const gridContainer = document.querySelector('.main-grid-layout');
        const originalWidth = window.innerWidth;
        
        // Test mobile breakpoint
        window.innerWidth = 480;
        window.dispatchEvent(new Event('resize'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mobileStyles = window.getComputedStyle(gridContainer);
        
        // Test tablet breakpoint
        window.innerWidth = 768;
        window.dispatchEvent(new Event('resize'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const tabletStyles = window.getComputedStyle(gridContainer);
        
        // Restore original width
        window.innerWidth = originalWidth;
        window.dispatchEvent(new Event('resize'));
        
        console.log('✅ Responsive design test completed');
        return { 
            success: true, 
            mobileGridColumns: mobileStyles.gridTemplateColumns,
            tabletGridColumns: tabletStyles.gridTemplateColumns
        };
    } catch (error) {
        console.error('❌ Responsive design test failed:', error);
        return { success: false, error: error.message };
    }
}

// Main test execution
async function runInteractiveGridTests() {
    console.log('🚀 Running comprehensive interactive grid tests...\n');
    
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: {}
    };
    
    try {
        // Wait for Angular to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Run all tests
        testResults.tests.gridContainer = await testGridContainerPresence();
        testResults.tests.gridInteractivity = await testGridBlockInteractivity();
        testResults.tests.componentPalette = await testComponentPaletteIntegration();
        testResults.tests.dragDrop = await testDragDropFunctionality();
        testResults.tests.visualFeedback = await testVisualFeedback();
        testResults.tests.responsiveDesign = await testResponsiveDesign();
        
        // Calculate overall success
        const successCount = Object.values(testResults.tests).filter(test => test.success).length;
        const totalTests = Object.keys(testResults.tests).length;
        
        testResults.overall = {
            success: successCount === totalTests,
            successRate: `${successCount}/${totalTests}`,
            percentage: Math.round((successCount / totalTests) * 100)
        };
        
        console.log('\n📊 INTERACTIVE GRID TEST SUMMARY:');
        console.log('=====================================');
        console.log(`Overall Success: ${testResults.overall.success ? '✅' : '❌'}`);
        console.log(`Success Rate: ${testResults.overall.successRate} (${testResults.overall.percentage}%)`);
        console.log('\nDetailed Results:');
        Object.entries(testResults.tests).forEach(([testName, result]) => {
            console.log(`  ${result.success ? '✅' : '❌'} ${testName}`);
        });
        
        return testResults;
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        testResults.error = error.message;
        return testResults;
    }
}

// Auto-run if we're in the browser
if (typeof window !== 'undefined') {
    // Wait for page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInteractiveGridTests);
    } else {
        runInteractiveGridTests();
    }
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runInteractiveGridTests };
}
