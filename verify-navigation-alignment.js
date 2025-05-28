// Navigation Alignment Verification Script
// Run this after loading the navigation-overlap-test.json configuration

console.log('🔧 Navigation Alignment Verification Starting...');

// Step 1: Load the comprehensive test configuration
function loadTestConfiguration() {
    console.log('\n📋 Step 1: Loading Navigation Overlap Test Configuration');
    console.log('Instructions:');
    console.log('1. Navigate to http://localhost:4200/designer');
    console.log('2. Click "Load Configuration" in the config preview panel');
    console.log('3. Load: src/assets/configs/navigation-overlap-test.json');
    console.log('4. Wait for configuration to load and render');
    console.log('5. Run verifyAlignment() in the console');
}

// Step 2: Verify dynamic renderer classes
function verifyDynamicRendererClasses() {
    console.log('\n🎯 Step 2: Verifying Dynamic Renderer Classes');
    
    const renderer = document.querySelector('.dynamic-renderer');
    if (!renderer) {
        console.error('❌ Dynamic renderer not found!');
        return false;
    }
    
    const classes = renderer.className;
    console.log('✅ Dynamic Renderer Classes:', classes);
    
    const hasPositionedNav = classes.includes('has-positioned-navigation');
    const hasSpecificPosition = classes.includes('has-left-navigation') || 
                               classes.includes('has-right-navigation') || 
                               classes.includes('has-top-navigation') || 
                               classes.includes('has-bottom-navigation');
    
    console.log('📊 Navigation Class Detection:', {
        hasPositionedNav,
        hasSpecificPosition,
        classes: classes.split(' ').filter(c => c.includes('navigation'))
    });
    
    return hasPositionedNav && hasSpecificPosition;
}

// Step 3: Verify navigation positioning
function verifyNavigationPositioning() {
    console.log('\n📍 Step 3: Verifying Navigation Positioning');
    
    const navigations = document.querySelectorAll('[class*="navigation-position"]');
    console.log(`Found ${navigations.length} positioned navigation elements`);
    
    let allProperlyPositioned = true;
    
    navigations.forEach((nav, index) => {
        const rect = nav.getBoundingClientRect();
        const styles = window.getComputedStyle(nav);
        
        console.log(`Navigation ${index + 1}:`, {
            className: nav.className,
            position: styles.position,
            top: styles.top,
            left: styles.left,
            right: styles.right,
            actualPosition: {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom
            },
            dimensions: {
                width: rect.width,
                height: rect.height
            }
        });
        
        // Check if positioned navigation is actually fixed
        if (styles.position !== 'fixed') {
            console.warn(`⚠️  Navigation ${index + 1} should be position: fixed`);
            allProperlyPositioned = false;
        }
        
        // Check if left/right navigation starts at edge
        if (nav.classList.contains('navigation-position-left') && rect.left !== 0) {
            console.warn(`⚠️  Left navigation ${index + 1} should start at left edge (0px), currently at ${rect.left}px`);
            allProperlyPositioned = false;
        }
        
        if (nav.classList.contains('navigation-position-right') && rect.right !== window.innerWidth) {
            console.warn(`⚠️  Right navigation ${index + 1} should end at right edge, currently at ${rect.right}px vs ${window.innerWidth}px`);
            allProperlyPositioned = false;
        }
    });
    
    return allProperlyPositioned;
}

// Step 4: Verify content alignment
function verifyContentAlignment() {
    console.log('\n📏 Step 4: Verifying Content Alignment');
    
    const forms = document.querySelectorAll('.component-form, app-form-renderer');
    const leftNav = document.querySelector('.navigation-position-left');
    const rightNav = document.querySelector('.navigation-position-right');
    
    console.log(`Found ${forms.length} form elements to check`);
    
    let allFormsAligned = true;
    
    forms.forEach((form, index) => {
        const formRect = form.getBoundingClientRect();
        const formStyles = window.getComputedStyle(form);
        
        console.log(`Form ${index + 1}:`, {
            position: {
                left: formRect.left,
                right: formRect.right,
                width: formRect.width
            },
            styles: {
                marginLeft: formStyles.marginLeft,
                marginRight: formStyles.marginRight,
                maxWidth: formStyles.maxWidth
            }
        });
        
        // Check alignment with left navigation
        if (leftNav) {
            const leftNavRect = leftNav.getBoundingClientRect();
            const properLeftAlignment = formRect.left >= leftNavRect.right;
            
            console.log(`📐 Form ${index + 1} left alignment:`, {
                formLeft: formRect.left,
                navRight: leftNavRect.right,
                properlyAligned: properLeftAlignment,
                gap: formRect.left - leftNavRect.right
            });
            
            if (!properLeftAlignment) {
                console.error(`❌ Form ${index + 1} overlaps with left navigation!`);
                allFormsAligned = false;
            } else {
                console.log(`✅ Form ${index + 1} properly aligned with left navigation`);
            }
        }
        
        // Check alignment with right navigation
        if (rightNav) {
            const rightNavRect = rightNav.getBoundingClientRect();
            const properRightAlignment = formRect.right <= rightNavRect.left;
            
            console.log(`📐 Form ${index + 1} right alignment:`, {
                formRight: formRect.right,
                navLeft: rightNavRect.left,
                properlyAligned: properRightAlignment,
                gap: rightNavRect.left - formRect.right
            });
            
            if (!properRightAlignment) {
                console.error(`❌ Form ${index + 1} overlaps with right navigation!`);
                allFormsAligned = false;
            } else {
                console.log(`✅ Form ${index + 1} properly aligned with right navigation`);
            }
        }
    });
    
    return allFormsAligned;
}

// Complete verification function
function verifyAlignment() {
    console.log('\n🧪 === COMPLETE NAVIGATION ALIGNMENT VERIFICATION ===');
    
    const results = {
        dynamicRendererClasses: verifyDynamicRendererClasses(),
        navigationPositioning: verifyNavigationPositioning(),
        contentAlignment: verifyContentAlignment()
    };
    
    console.log('\n📊 === VERIFICATION RESULTS ===');
    console.log('Dynamic Renderer Classes:', results.dynamicRendererClasses ? '✅ PASS' : '❌ FAIL');
    console.log('Navigation Positioning:', results.navigationPositioning ? '✅ PASS' : '❌ FAIL');
    console.log('Content Alignment:', results.contentAlignment ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
        console.log('\n🎉 === ALL TESTS PASSED! ===');
        console.log('✅ Navigation alignment is working correctly');
        console.log('✅ Forms and content are properly positioned');
        console.log('✅ No overlapping detected');
    } else {
        console.log('\n⚠️  === SOME TESTS FAILED ===');
        console.log('Please check the issues listed above');
    }
    
    return results;
}

// Quick test function for immediate verification
function quickAlignmentTest() {
    console.log('⚡ Quick Alignment Test');
    
    const renderer = document.querySelector('.dynamic-renderer');
    const leftNav = document.querySelector('.navigation-position-left');
    const forms = document.querySelectorAll('.component-form, app-form-renderer');
    
    if (!renderer) {
        console.log('❌ No dynamic renderer found');
        return;
    }
    
    if (!leftNav && !document.querySelector('.navigation-position-right')) {
        console.log('❌ No positioned navigation found');
        return;
    }
    
    if (forms.length === 0) {
        console.log('❌ No forms found');
        return;
    }
    
    console.log(`✅ Found: renderer, ${leftNav ? 'left nav' : 'other nav'}, ${forms.length} forms`);
    
    if (leftNav && forms.length > 0) {
        const form = forms[0];
        const formRect = form.getBoundingClientRect();
        const navRect = leftNav.getBoundingClientRect();
        
        const aligned = formRect.left >= navRect.right;
        console.log(`Form alignment: ${aligned ? '✅' : '❌'} (form: ${formRect.left}px, nav: ${navRect.right}px)`);
    }
}

// Export functions for console use
console.log('\n📚 Available Functions:');
console.log('- loadTestConfiguration() - Instructions to load test config');
console.log('- verifyAlignment() - Complete alignment verification');
console.log('- quickAlignmentTest() - Quick visual check');
console.log('- verifyDynamicRendererClasses() - Check renderer classes');
console.log('- verifyNavigationPositioning() - Check nav positioning');
console.log('- verifyContentAlignment() - Check form alignment');

// Auto-run quick test
quickAlignmentTest();
