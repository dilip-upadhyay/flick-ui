// Canvas vs Preview Navigation Alignment Verification
// Run this script after loading navigation-overlap-test.json in the designer

console.log('🎯 Canvas vs Preview Navigation Alignment Test');
console.log('=================================================');

function testCanvasAlignment() {
    console.log('\n📐 Testing Designer Canvas Alignment...');
    
    // Check canvas viewport classes
    const canvasViewport = document.querySelector('.canvas-viewport');
    if (!canvasViewport) {
        console.error('❌ Canvas viewport not found!');
        return false;
    }
    
    const canvasClasses = canvasViewport.className;
    console.log('📋 Canvas viewport classes:', canvasClasses);
    
    // Check for navigation alignment classes
    const hasNavClasses = canvasClasses.includes('has-') && canvasClasses.includes('-navigation');
    console.log('🎯 Canvas has navigation classes:', hasNavClasses ? '✅' : '❌');
    
    // Check canvas padding adjustments
    const canvasStyles = window.getComputedStyle(canvasViewport);
    console.log('📏 Canvas viewport padding:', {
        left: canvasStyles.paddingLeft,
        right: canvasStyles.paddingRight,
        top: canvasStyles.paddingTop,
        bottom: canvasStyles.paddingBottom
    });
    
    return hasNavClasses;
}

function testPreviewAlignment() {
    console.log('\n📱 Testing Preview (Dynamic Renderer) Alignment...');
    
    // Check dynamic renderer classes
    const dynamicRenderer = document.querySelector('.dynamic-renderer');
    if (!dynamicRenderer) {
        console.error('❌ Dynamic renderer not found!');
        return false;
    }
    
    const rendererClasses = dynamicRenderer.className;
    console.log('📋 Dynamic renderer classes:', rendererClasses);
    
    // Check for navigation alignment classes
    const hasNavClasses = rendererClasses.includes('has-') && rendererClasses.includes('-navigation');
    console.log('🎯 Renderer has navigation classes:', hasNavClasses ? '✅' : '❌');
    
    return hasNavClasses;
}

function compareAlignments() {
    console.log('\n🔄 Comparing Canvas vs Preview Alignment...');
    
    const canvasViewport = document.querySelector('.canvas-viewport');
    const dynamicRenderer = document.querySelector('.dynamic-renderer');
    
    if (!canvasViewport || !dynamicRenderer) {
        console.error('❌ Missing required elements for comparison');
        return false;
    }
    
    const canvasClasses = canvasViewport.className.split(' ').filter(c => c.includes('has-'));
    const rendererClasses = dynamicRenderer.className.split(' ').filter(c => c.includes('has-'));
    
    console.log('📐 Canvas navigation classes:', canvasClasses);
    console.log('📱 Preview navigation classes:', rendererClasses);
    
    // Check if both have the same navigation classes
    const alignmentMatches = JSON.stringify(canvasClasses.sort()) === JSON.stringify(rendererClasses.sort());
    console.log('🎯 Alignment consistency:', alignmentMatches ? '✅ MATCH' : '❌ MISMATCH');
    
    return alignmentMatches;
}

function testFormAlignment() {
    console.log('\n📝 Testing Form Alignment in Both Contexts...');
    
    const forms = document.querySelectorAll('.component-form, app-form-renderer');
    const leftNav = document.querySelector('.navigation-position-left');
    
    if (forms.length === 0) {
        console.log('⚠️  No forms found to test');
        return true;
    }
    
    if (!leftNav) {
        console.log('ℹ️  No left navigation found');
        return true;
    }
    
    const leftNavRect = leftNav.getBoundingClientRect();
    let allFormsAligned = true;
    
    forms.forEach((form, index) => {
        const formRect = form.getBoundingClientRect();
        const isAligned = formRect.left >= leftNavRect.right;
        
        console.log(`Form ${index + 1}: ${isAligned ? '✅' : '❌'} aligned (form: ${formRect.left}px, nav: ${leftNavRect.right}px)`);
        
        if (!isAligned) {
            allFormsAligned = false;
        }
    });
    
    return allFormsAligned;
}

function runCompleteTest() {
    console.log('\n🧪 === COMPLETE CANVAS VS PREVIEW ALIGNMENT TEST ===');
    
    const results = {
        canvasAlignment: testCanvasAlignment(),
        previewAlignment: testPreviewAlignment(),
        alignmentConsistency: compareAlignments(),
        formAlignment: testFormAlignment()
    };
    
    console.log('\n📊 === TEST RESULTS ===');
    console.log('Canvas Alignment:', results.canvasAlignment ? '✅ PASS' : '❌ FAIL');
    console.log('Preview Alignment:', results.previewAlignment ? '✅ PASS' : '❌ FAIL');
    console.log('Alignment Consistency:', results.alignmentConsistency ? '✅ PASS' : '❌ FAIL');
    console.log('Form Alignment:', results.formAlignment ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
        console.log('\n🎉 === ALL TESTS PASSED! ===');
        console.log('✅ Both canvas and preview have consistent navigation alignment');
        console.log('✅ Navigation alignment issue resolved in both contexts');
    } else {
        console.log('\n⚠️  === SOME TESTS FAILED ===');
        console.log('❌ Navigation alignment inconsistency detected');
        console.log('Please check the failed tests above');
    }
    
    return results;
}

// Export functions for console use
console.log('\n📚 Available Functions:');
console.log('- runCompleteTest() - Run full alignment comparison');
console.log('- testCanvasAlignment() - Test designer canvas only');
console.log('- testPreviewAlignment() - Test preview renderer only');
console.log('- compareAlignments() - Compare canvas vs preview');
console.log('- testFormAlignment() - Test form positioning');

console.log('\n🚀 Ready to test! Load navigation-overlap-test.json and run runCompleteTest()');
