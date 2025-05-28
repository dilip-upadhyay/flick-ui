// Navigation Overlap Testing Script
// Execute this in the browser console to test overlap detection

console.log('🧪 Starting Navigation Overlap Testing...');

// Function to test navigation overlap prevention
function testNavigationOverlap() {
    console.log('\n=== NAVIGATION OVERLAP TEST ===');
    
    // 1. Check if navigation elements exist
    const navigations = document.querySelectorAll('[class*="navigation"], .nav-');
    console.log(`📍 Found ${navigations.length} navigation elements`);
    
    // 2. Check app header
    const appHeader = document.querySelector('app-header, .app-header, header, .mat-toolbar');
    if (appHeader) {
        const headerRect = appHeader.getBoundingClientRect();
        const headerStyles = window.getComputedStyle(appHeader);
        console.log('📱 App Header:', {
            height: headerRect.height,
            zIndex: headerStyles.zIndex,
            position: headerStyles.position,
            top: headerRect.top,
            bottom: headerRect.bottom
        });
    }
    
    // 3. Check dynamic renderer container
    const dynamicRenderer = document.querySelector('.dynamic-renderer');
    if (dynamicRenderer) {
        const rendererClasses = dynamicRenderer.className;
        console.log('🎯 Dynamic Renderer Classes:', rendererClasses);
        
        // Check if navigation positioning classes are applied
        const hasPositionedNav = rendererClasses.includes('has-positioned-navigation');
        const hasLeftNav = rendererClasses.includes('has-left-navigation');
        const hasRightNav = rendererClasses.includes('has-right-navigation');
        const hasTopNav = rendererClasses.includes('has-top-navigation');
        const hasBottomNav = rendererClasses.includes('has-bottom-navigation');
        
        console.log('📋 Navigation Layout Detection:', {
            hasPositionedNav,
            hasLeftNav,
            hasRightNav,
            hasTopNav,
            hasBottomNav
        });
    }
    
    // 4. Check each navigation element positioning
    navigations.forEach((nav, index) => {
        const rect = nav.getBoundingClientRect();
        const styles = window.getComputedStyle(nav);
        
        console.log(`📊 Navigation ${index + 1}:`, {
            position: styles.position,
            top: styles.top,
            left: styles.left,
            right: styles.right,
            bottom: styles.bottom,
            zIndex: styles.zIndex,
            width: rect.width,
            height: rect.height,
            className: nav.className,
            actualLeft: rect.left,
            actualTop: rect.top
        });
        
        // Check for overlap with header
        if (appHeader) {
            const headerRect = appHeader.getBoundingClientRect();
            const navRect = rect;
            
            const overlapping = !(
                headerRect.right < navRect.left ||
                headerRect.left > navRect.right ||
                headerRect.bottom < navRect.top ||
                headerRect.top > navRect.bottom
            );
            
            console.log(`🔍 Navigation ${index + 1} overlaps with header:`, overlapping);
            
            // Check if navigation properly starts below header
            if (nav.classList.contains('navigation-position-left') || nav.classList.contains('navigation-position-right')) {
                const properlyBelowHeader = navRect.top >= headerRect.bottom;
                console.log(`✅ Navigation ${index + 1} properly positioned below header:`, properlyBelowHeader);
            }
        }
    });
    
    // 5. Check content alignment and spacing
    const forms = document.querySelectorAll('form, .form-container, .component-form, app-form-renderer');
    console.log(`📝 Found ${forms.length} form elements`);
    
    forms.forEach((form, index) => {
        const formRect = form.getBoundingClientRect();
        const formStyles = window.getComputedStyle(form);
        
        console.log(`📋 Form ${index + 1}:`, {
            top: formRect.top,
            left: formRect.left,
            width: formRect.width,
            height: formRect.height,
            marginLeft: formStyles.marginLeft,
            marginRight: formStyles.marginRight,
            marginTop: formStyles.marginTop,
            maxWidth: formStyles.maxWidth,
            visible: formRect.width > 0 && formRect.height > 0,
            zIndex: formStyles.zIndex
        });
        
        // Check if form aligns properly with navigation
        navigations.forEach((nav, navIndex) => {
            const navRect = nav.getBoundingClientRect();
            
            if (nav.classList.contains('navigation-position-left')) {
                const properAlignment = formRect.left >= navRect.right;
                console.log(`📏 Form ${index + 1} properly aligned with left nav ${navIndex + 1}:`, properAlignment);
                if (!properAlignment) {
                    console.warn(`⚠️  Form ${index + 1} may be overlapping with left navigation`);
                }
            }
            
            if (nav.classList.contains('navigation-position-right')) {
                const properAlignment = formRect.right <= navRect.left;
                console.log(`📏 Form ${index + 1} properly aligned with right nav ${navIndex + 1}:`, properAlignment);
                if (!properAlignment) {
                    console.warn(`⚠️  Form ${index + 1} may be overlapping with right navigation`);
                }
            }
        });
    });
    
    console.log('\n✅ Navigation overlap and alignment test completed!');
}
    
    // 4. Check content spacing
    const mainContent = document.querySelector('main, .main-content, .content-area');
    if (mainContent) {
        const contentStyles = window.getComputedStyle(mainContent);
        console.log('📄 Main Content Spacing:', {
            marginTop: contentStyles.marginTop,
            marginLeft: contentStyles.marginLeft,
            marginRight: contentStyles.marginRight,
            marginBottom: contentStyles.marginBottom,
            paddingTop: contentStyles.paddingTop,
            paddingLeft: contentStyles.paddingLeft,
            paddingRight: contentStyles.paddingRight,
            paddingBottom: contentStyles.paddingBottom
        });
    }
    
    // 5. Check form elements
    const forms = document.querySelectorAll('form, .form-container');
    console.log(`📝 Found ${forms.length} form elements`);
    
    forms.forEach((form, index) => {
        const formRect = form.getBoundingClientRect();
        const formStyles = window.getComputedStyle(form);
        
        console.log(`📋 Form ${index + 1}:`, {
            top: formRect.top,
            left: formRect.left,
            width: formRect.width,
            height: formRect.height,
            visible: formRect.width > 0 && formRect.height > 0,
            zIndex: formStyles.zIndex
        });
        
        // Check if form is hidden behind navigation
        navigations.forEach((nav, navIndex) => {
            const navRect = nav.getBoundingClientRect();
            const navZIndex = parseInt(window.getComputedStyle(nav).zIndex) || 0;
            const formZIndex = parseInt(formStyles.zIndex) || 0;
            
            const overlapping = !(
                navRect.right < formRect.left ||
                navRect.left > formRect.right ||
                navRect.bottom < formRect.top ||
                navRect.top > formRect.bottom
            );
            
            if (overlapping && navZIndex > formZIndex) {
                console.warn(`⚠️  Form ${index + 1} may be hidden behind Navigation ${navIndex + 1}`);
            }
        });
    });
    
    console.log('\n✅ Navigation overlap test completed!');
}

// Function to load test configuration
function loadTestConfig() {
    console.log('\n🔄 Loading navigation overlap test configuration...');
    
    // This would typically be done through the application's config loading mechanism
    // For manual testing, navigate to: http://localhost:4200?config=navigation-overlap-test
    
    console.log('📋 To load test configuration:');
    console.log('1. Navigate to: http://localhost:4200');
    console.log('2. Go to designer mode');
    console.log('3. Load config: src/assets/configs/navigation-overlap-test.json');
    console.log('4. Run testNavigationOverlap() again');
}

// Function to check CSS rules
function checkNavigationCSS() {
    console.log('\n=== CSS RULES CHECK ===');
    
    // Check if navigation CSS classes exist
    const styleSheets = Array.from(document.styleSheets);
    let cssRules = [];
    
    styleSheets.forEach(sheet => {
        try {
            if (sheet.cssRules) {
                Array.from(sheet.cssRules).forEach(rule => {
                    if (rule.selectorText && rule.selectorText.includes('navigation')) {
                        cssRules.push({
                            selector: rule.selectorText,
                            styles: rule.style.cssText
                        });
                    }
                });
            }
        } catch (e) {
            // CORS or other restrictions
        }
    });
    
    console.log('🎨 Found navigation CSS rules:', cssRules);
    
    // Check for key positioning classes
    const keyClasses = [
        '.navigation-top',
        '.navigation-left', 
        '.navigation-right',
        '.navigation-bottom',
        '.content-with-navigation'
    ];
    
    keyClasses.forEach(className => {
        const elements = document.querySelectorAll(className);
        console.log(`🔍 Elements with ${className}:`, elements.length);
    });
}

// Auto-run basic checks
console.log('🚀 Navigation Testing Script Loaded!');
console.log('Available functions:');
console.log('- testNavigationOverlap() - Check for navigation overlaps');
console.log('- loadTestConfig() - Instructions to load test config');
console.log('- checkNavigationCSS() - Check CSS rules');

// Run initial checks
checkNavigationCSS();
testNavigationOverlap();
