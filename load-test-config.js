// Script to load test configuration into the designer
// Open the browser console and run this script to load the test config

async function loadTestConfig() {
  try {
    // Fetch the test configuration
    const response = await fetch('/assets/configs/spacing-appearance-test.json');
    const config = await response.json();
    
    console.log('Test configuration loaded:', config);
    
    // Store it in localStorage so the designer can load it
    localStorage.setItem('designer-config', JSON.stringify(config));
    
    console.log('Configuration saved to localStorage. You can now click "Load" in the designer to load it.');
    
    // If we're already in the designer, trigger a reload
    if (window.location.pathname.includes('/designer')) {
      console.log('Reloading page to apply configuration...');
      window.location.reload();
    }
    
    return config;
  } catch (error) {
    console.error('Error loading test configuration:', error);
  }
}

// Auto-execute the function
loadTestConfig();
