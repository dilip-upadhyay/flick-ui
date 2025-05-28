/**
 * Load Navigation Position Demo Test Script
 * Run this in the browser console to test navigation overlap prevention
 */

async function loadNavigationPositionDemo() {
  console.log('🧭 Loading Navigation Position Demo...');
  
  try {
    // Load the navigation position demo configuration
    const response = await fetch('/assets/configs/navigation-position-demo.json');
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.statusText}`);
    }
    
    const config = await response.json();
    console.log('✅ Navigation position demo loaded');
    console.log('Components:', config.components.map(c => `${c.id} (${c.type})`));
    
    // Store for designer to load
    localStorage.setItem('designer-config', JSON.stringify(config));
    console.log('✅ Configuration saved to localStorage');
    
    return config;
  } catch (error) {
    console.error('❌ Error loading demo:', error);
    return null;
  }
}

async function loadNavigationOverlapTest() {
  console.log('🧪 Loading Navigation Overlap Test...');
  
  try {
    // Load our custom test configuration
    const response = await fetch('/assets/configs/navigation-overlap-test.json');
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.statusText}`);
    }
    
    const config = await response.json();
    console.log('✅ Navigation overlap test loaded');
    console.log('Components:', config.components.map(c => `${c.id} (${c.type}, position: ${c.props?.position || 'none'})`));
    
    // Store for designer to load
    localStorage.setItem('designer-config', JSON.stringify(config));
    console.log('✅ Configuration saved to localStorage');
    
    return config;
  } catch (error) {
    console.error('❌ Error loading test:', error);
    return null;
  }
}

function analyzeNavigationComponents(config) {
  if (!config || !config.components) {
    console.log('❌ No configuration provided');
    return;
  }
  
  console.log('\n📊 Navigation Component Analysis:');
  console.log('-'.repeat(50));
  
  const navigationComponents = config.components.filter(c => c.type === 'navigation');
  
  if (navigationComponents.length === 0) {
    console.log('⚠️ No navigation components found');
    return;
  }
  
  navigationComponents.forEach((nav, index) => {
    console.log(`Navigation ${index + 1}: ${nav.id}`);
    console.log(`  Type: ${nav.props?.type || 'not specified'}`);
    console.log(`  Position: ${nav.props?.position || 'not specified'}`);
    console.log(`  Items: ${nav.props?.items?.length || 0}`);
    console.log(`  Class: ${nav.props?.className || 'none'}`);
  });
  
  // Check for potential overlap scenarios
  const positions = navigationComponents.map(n => n.props?.position).filter(Boolean);
  const hasTop = positions.includes('top');
  const hasLeft = positions.includes('left');
  const hasRight = positions.includes('right');
  const hasBottom = positions.includes('bottom');
  
  console.log('\n🔍 Overlap Risk Analysis:');
  if (hasTop) console.log('⚠️ Top navigation - check app header overlap (should use top: 64px)');
  if (hasLeft) console.log('⚠️ Left navigation - check content overlap (content needs left padding)');
  if (hasRight) console.log('⚠️ Right navigation - check content overlap (content needs right padding)');
  if (hasBottom) console.log('⚠️ Bottom navigation - check content overlap (content needs bottom padding)');
}

function runNavigationTest() {
  console.log('🚀 Starting Navigation Overlap Test...');
  console.log('=' + '='.repeat(49));
  
  // Test 1: Load and analyze navigation position demo
  console.log('\n📋 Test 1: Loading Navigation Position Demo');
  loadNavigationPositionDemo().then(config => {
    if (config) {
      analyzeNavigationComponents(config);
    }
  });
  
  // Test 2: Load and analyze our comprehensive test
  setTimeout(() => {
    console.log('\n📋 Test 2: Loading Navigation Overlap Test');
    loadNavigationOverlapTest().then(config => {
      if (config) {
        analyzeNavigationComponents(config);
      }
      
      // Instructions for manual testing
      console.log('\n📝 Manual Testing Steps:');
      console.log('-'.repeat(50));
      console.log('1. Go to the designer: http://localhost:4200/designer');
      console.log('2. Click the "Load" button in the toolbar (folder icon)');
      console.log('3. This should load the configuration from localStorage');
      console.log('4. Check that navigation components render without overlapping');
      console.log('5. Verify proper z-index layering and positioning');
      
      console.log('\n🔧 Run these in console after loading:');
      console.log('• window.navigationOverlapTest.checkNavigationStyles()');
      console.log('• window.navigationOverlapTest.checkAppHeaderStyles()');
      console.log('• window.navigationOverlapTest.checkOverlaps()');
    });
  }, 2000);
}

// Run the test
runNavigationTest();
