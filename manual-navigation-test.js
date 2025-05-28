/**
 * Manual Navigation Overlap Test Script
 * 
 * This script helps test the navigation overlap prevention fixes
 * by providing step-by-step instructions and verification checks.
 */

console.log('🧭 Navigation Overlap Prevention Test');
console.log('=' + '='.repeat(39));

// Navigation overlap test configuration
const navigationTestConfig = {
  "type": "layout",
  "version": "1.0", 
  "theme": "default",
  "components": [
    {
      "id": "top-nav",
      "type": "navigation",
      "props": {
        "type": "horizontal",
        "position": "top",
        "items": [
          {"id": "dashboard", "label": "Dashboard", "icon": "📊", "route": "/dashboard"},
          {"id": "forms", "label": "Forms", "icon": "📝", "route": "/forms"},
          {"id": "reports", "label": "Reports", "icon": "📋", "route": "/reports"}
        ],
        "className": "top-navigation-test"
      }
    },
    {
      "id": "left-sidebar",
      "type": "navigation", 
      "props": {
        "type": "vertical",
        "position": "left",
        "items": [
          {"id": "menu1", "label": "Menu Item 1", "icon": "🔗", "route": "/menu1"},
          {"id": "menu2", "label": "Menu Item 2", "icon": "🔗", "route": "/menu2"}
        ],
        "className": "left-navigation-test"
      }
    },
    {
      "id": "main-content",
      "type": "container",
      "props": {
        "title": "Navigation Overlap Test",
        "className": "main-content-test"
      },
      "children": [
        {
          "id": "test-form",
          "type": "form",
          "props": {
            "title": "Sample Form",
            "layout": "vertical",
            "fields": [
              {"id": "name", "type": "text", "label": "Full Name", "required": true},
              {"id": "email", "type": "email", "label": "Email Address", "required": true},
              {"id": "message", "type": "textarea", "label": "Message", "rows": 4}
            ]
          }
        }
      ]
    },
    {
      "id": "right-sidebar",
      "type": "navigation",
      "props": {
        "type": "vertical", 
        "position": "right",
        "items": [
          {"id": "help", "label": "Help", "icon": "❓", "route": "/help"},
          {"id": "settings", "label": "Settings", "icon": "⚙️", "route": "/settings"}
        ],
        "className": "right-navigation-test"
      }
    }
  ],
  "layout": {
    "type": "stack",
    "direction": "column"
  },
  "metadata": {
    "title": "Navigation Overlap Prevention Test"
  }
};

// Store test config in localStorage
localStorage.setItem('navigation-overlap-test-config', JSON.stringify(navigationTestConfig));

console.log('✅ Navigation test configuration saved to localStorage');

// Test instructions
console.log('\n📋 Manual Testing Instructions:');
console.log('-'.repeat(40));
console.log('1. Go to the designer page: http://localhost:4200/designer');
console.log('2. Click "Templates" button in the toolbar');
console.log('3. Click "Load Test Config" from the dropdown');
console.log('4. The navigation test configuration should load');
console.log('5. Verify no overlaps between navigation and content');

console.log('\n🔍 What to Check:');
console.log('-'.repeat(40));
console.log('✓ Top navigation should not overlap with app header');
console.log('✓ Left navigation should not overlap with main content');
console.log('✓ Right navigation should not overlap with main content');
console.log('✓ Form fields should be fully visible and not hidden');
console.log('✓ Navigation components should have proper z-index layering');

console.log('\n⚙️ CSS Rules to Verify:');
console.log('-'.repeat(40));
console.log('• App header z-index: 1000');
console.log('• Navigation z-index: 999'); 
console.log('• Content z-index: 1');
console.log('• Top navigation should account for app header height (64px)');
console.log('• Content should have proper padding when navigation is positioned');

// Verification functions
function checkNavigationStyles() {
  console.log('\n🔧 Checking Navigation Styles...');
  
  const navElements = document.querySelectorAll('[class*="navigation"], .component-navigation');
  
  navElements.forEach((nav, index) => {
    const styles = window.getComputedStyle(nav);
    const position = styles.position;
    const zIndex = styles.zIndex;
    const top = styles.top;
    const left = styles.left;
    const right = styles.right;
    
    console.log(`Navigation ${index + 1}:`);
    console.log(`  Position: ${position}`);
    console.log(`  Z-Index: ${zIndex}`);
    console.log(`  Top: ${top}`);
    console.log(`  Left: ${left}`);
    console.log(`  Right: ${right}`);
  });
}

function checkAppHeaderStyles() {
  console.log('\n🔧 Checking App Header Styles...');
  
  const header = document.querySelector('.app-header, [class*="header"]');
  if (header) {
    const styles = window.getComputedStyle(header);
    console.log(`App Header Z-Index: ${styles.zIndex}`);
    console.log(`App Header Height: ${styles.height}`);
  } else {
    console.log('⚠️ App header not found');
  }
}

function checkOverlaps() {
  console.log('\n🔍 Checking for Overlaps...');
  
  const navElements = document.querySelectorAll('[class*="navigation"]');
  const contentElements = document.querySelectorAll('form, [class*="form"], [class*="content"]');
  
  let overlapsFound = 0;
  
  navElements.forEach((nav, navIndex) => {
    const navRect = nav.getBoundingClientRect();
    
    contentElements.forEach((content, contentIndex) => {
      const contentRect = content.getBoundingClientRect();
      
      const isOverlapping = !(
        navRect.right < contentRect.left || 
        contentRect.right < navRect.left || 
        navRect.bottom < contentRect.top || 
        contentRect.bottom < navRect.top
      );
      
      if (isOverlapping) {
        console.log(`❌ OVERLAP DETECTED:`);
        console.log(`  Navigation ${navIndex + 1} overlaps with Content ${contentIndex + 1}`);
        overlapsFound++;
      }
    });
  });
  
  if (overlapsFound === 0) {
    console.log('✅ No overlaps detected!');
  } else {
    console.log(`❌ Found ${overlapsFound} overlaps`);
  }
  
  return overlapsFound === 0;
}

// Export functions for manual testing
window.navigationOverlapTest = {
  checkNavigationStyles,
  checkAppHeaderStyles, 
  checkOverlaps,
  loadTestConfig: () => {
    const config = JSON.parse(localStorage.getItem('navigation-overlap-test-config'));
    console.log('Test config loaded:', config);
    return config;
  }
};

console.log('\n🚀 Test functions available on window.navigationOverlapTest');
console.log('Usage:');
console.log('• window.navigationOverlapTest.checkNavigationStyles()');
console.log('• window.navigationOverlapTest.checkAppHeaderStyles()');
console.log('• window.navigationOverlapTest.checkOverlaps()');

console.log('\n⏳ Waiting for you to load the test configuration in the designer...');
