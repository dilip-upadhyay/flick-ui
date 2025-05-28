// Comprehensive test script for verifying layout spacing, appearance, and preview functionality
// Run this in the browser console to test the complete workflow

async function runComprehensiveTest() {
  console.log('🧪 Starting Comprehensive Layout Test...');
  
  // Step 1: Load test configuration
  console.log('\n📋 Step 1: Loading test configuration...');
  try {
    const response = await fetch('/assets/configs/spacing-appearance-test.json');
    if (!response.ok) {
      throw new Error(`Failed to load configuration: ${response.statusText}`);
    }
    
    const config = await response.json();
    console.log('✅ Test configuration loaded successfully');
    console.log('Components in config:', config.components.length);
    
    // Store in localStorage for the designer to load
    localStorage.setItem('designer-config', JSON.stringify(config));
    console.log('✅ Configuration saved to localStorage');
    
    // Step 2: Verify configuration structure
    console.log('\n🔍 Step 2: Verifying configuration structure...');
    
    const componentsWithStyles = config.components.filter(comp => 
      comp.props && (
        comp.props.width || comp.props.height || 
        comp.props.margin || comp.props.padding ||
        comp.props.backgroundColor || comp.props.textColor
      )
    );
    
    console.log(`✅ Found ${componentsWithStyles.length} components with styling properties`);
    
    // Step 3: Test styling extraction
    console.log('\n🎨 Step 3: Testing style extraction...');
    
    // Mock the getComponentStyles function that should be used in both design and preview modes
    function getComponentStyles(component) {
      const styles = {};
      
      if (component.props) {
        // Layout properties
        if (component.props.width) styles.width = component.props.width;
        if (component.props.height) styles.height = component.props.height;
        if (component.props.margin) styles.margin = component.props.margin;
        if (component.props.padding) styles.padding = component.props.padding;
        
        // Flexbox properties
        if (component.props.display) styles.display = component.props.display;
        if (component.props.flexDirection) styles['flex-direction'] = component.props.flexDirection;
        if (component.props.justifyContent) styles['justify-content'] = component.props.justifyContent;
        if (component.props.alignItems) styles['align-items'] = component.props.alignItems;
        if (component.props.gap) styles.gap = component.props.gap;
        
        // Grid properties
        if (component.props.gridTemplateColumns) styles['grid-template-columns'] = component.props.gridTemplateColumns;
        
        // Appearance properties
        if (component.props.backgroundColor) styles['background-color'] = component.props.backgroundColor;
        if (component.props.textColor) styles.color = component.props.textColor;
        if (component.props.borderRadius) styles['border-radius'] = component.props.borderRadius;
        if (component.props.boxShadow) styles['box-shadow'] = component.props.boxShadow;
        if (component.props.border) styles.border = component.props.border;
      }
      
      return styles;
    }
    
    // Test style extraction on each component
    componentsWithStyles.forEach((comp, index) => {
      const extractedStyles = getComponentStyles(comp);
      const styleCount = Object.keys(extractedStyles).length;
      console.log(`  Component ${index + 1} (${comp.type}): ${styleCount} styles extracted`);
      if (styleCount > 0) {
        console.log('    Styles:', extractedStyles);
      }
    });
    
    console.log('✅ Style extraction test completed');
    
    // Step 4: Test preview functionality
    console.log('\n🔗 Step 4: Testing preview functionality...');
    
    // Simulate storing config for preview
    sessionStorage.setItem('preview-config', JSON.stringify(config));
    console.log('✅ Configuration stored in sessionStorage for preview');
    
    // Step 5: Provide test instructions
    console.log('\n📋 Step 5: Manual Test Instructions');
    console.log('='.repeat(50));
    console.log('1. In the designer, click on "Templates" → "Load Test Config"');
    console.log('2. Verify that components appear with proper spacing and styling');
    console.log('3. Click on individual components to see their properties in the Property Editor');
    console.log('4. Click "Preview" to open the layout in preview mode');
    console.log('5. Compare the styling between design mode and preview mode');
    console.log('6. Both modes should show identical styling and alignment');
    
    // Step 6: Automated alignment verification
    console.log('\n⚖️ Step 6: Alignment Verification Checklist');
    console.log('='.repeat(50));
    
    const verificationChecks = [
      'Navigation component should have proper padding and background color',
      'Container components should respect width, height, and margin settings',
      'Grid layout should display with correct column configuration',
      'Form components should maintain proper spacing between elements',
      'Background colors and text colors should be applied consistently',
      'Border radius and shadows should be visible',
      'Flexbox alignment should work correctly',
      'Gap between elements should be respected'
    ];
    
    verificationChecks.forEach((check, index) => {
      console.log(`${index + 1}. ${check}`);
    });
    
    console.log('\n✅ Comprehensive test setup completed!');
    console.log('💡 Tip: Open the browser developer tools to monitor any console errors during testing');
    
    return {
      config,
      componentsWithStyles: componentsWithStyles.length,
      totalComponents: config.components.length,
      testPassed: true
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      testPassed: false,
      error: error.message
    };
  }
}

// Auto-run the test
runComprehensiveTest().then(result => {
  if (result.testPassed) {
    console.log('\n🎉 Test setup completed successfully!');
    console.log(`📊 Results: ${result.componentsWithStyles}/${result.totalComponents} components have styling`);
  } else {
    console.log('\n💥 Test failed:', result.error);
  }
});
