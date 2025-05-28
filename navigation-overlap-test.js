const puppeteer = require('puppeteer');
const path = require('path');

async function testNavigationOverlapPrevention() {
    console.log('🔧 Starting Navigation Overlap Prevention Test...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to the application
        console.log('📱 Opening application...');
        await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
        
        // Wait for the application to load
        await page.waitForSelector('app-root', { timeout: 10000 });
        console.log('✅ Application loaded successfully');
        
        // Go to designer page to load test configuration
        console.log('🎨 Navigating to designer...');
        await page.goto('http://localhost:4200/designer', { waitUntil: 'networkidle0' });
        
        // Wait for designer to load
        await page.waitForSelector('.designer-container', { timeout: 10000 });
        console.log('✅ Designer loaded');
        
        // Look for load config button or input
        const loadConfigElements = await page.$$eval('*', elements => 
            elements.filter(el => 
                el.textContent?.toLowerCase().includes('load') && 
                (el.textContent?.toLowerCase().includes('config') || 
                 el.textContent?.toLowerCase().includes('test'))
            ).map(el => ({
                text: el.textContent,
                tagName: el.tagName,
                className: el.className
            }))
        );
        
        console.log('🔍 Found load config elements:', loadConfigElements);
        
        // Try to find and click load config button
        const loadButton = await page.$('button:contains("Load"), input[type="file"], [data-testid*="load"]');
        if (loadButton) {
            console.log('📁 Found load button, attempting to load test config...');
            await loadButton.click();
        } else {
            console.log('⚠️  Load button not found, trying alternative method...');
            
            // Try to find file input or config loading mechanism
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                const configPath = path.resolve(__dirname, 'src/assets/configs/navigation-overlap-test.json');
                await fileInput.uploadFile(configPath);
                console.log('📄 Uploaded test configuration file');
            }
        }
        
        // Wait a moment for config to load
        await page.waitForTimeout(2000);
        
        // Check for navigation components
        console.log('🧭 Checking for navigation components...');
        
        const navigationElements = await page.$$eval('[class*="navigation"], [class*="nav"]', elements => 
            elements.map(el => ({
                className: el.className,
                position: getComputedStyle(el).position,
                zIndex: getComputedStyle(el).zIndex,
                top: getComputedStyle(el).top,
                left: getComputedStyle(el).left,
                right: getComputedStyle(el).right,
                bottom: getComputedStyle(el).bottom,
                bounds: el.getBoundingClientRect()
            }))
        );
        
        console.log('📊 Navigation elements found:', navigationElements);
        
        // Check for form elements
        const formElements = await page.$$eval('form, [class*="form"]', elements => 
            elements.map(el => ({
                tagName: el.tagName,
                className: el.className,
                bounds: el.getBoundingClientRect()
            }))
        );
        
        console.log('📝 Form elements found:', formElements);
        
        // Check for overlaps
        console.log('🔍 Checking for overlaps...');
        
        let overlapsDetected = false;
        
        for (const nav of navigationElements) {
            for (const form of formElements) {
                if (isOverlapping(nav.bounds, form.bounds)) {
                    console.log('❌ OVERLAP DETECTED:');
                    console.log('  Navigation:', nav);
                    console.log('  Form:', form);
                    overlapsDetected = true;
                }
            }
        }
        
        if (!overlapsDetected) {
            console.log('✅ No navigation-form overlaps detected!');
        }
        
        // Test different navigation positions
        console.log('🔄 Testing different navigation positions...');
        
        // Check app header z-index
        const appHeader = await page.$eval('.app-header, [class*="header"]', el => ({
            zIndex: getComputedStyle(el).zIndex,
            bounds: el.getBoundingClientRect()
        })).catch(() => null);
        
        if (appHeader) {
            console.log('📱 App header z-index:', appHeader.zIndex);
            
            // Verify app header is above navigation
            for (const nav of navigationElements) {
                if (parseInt(appHeader.zIndex) <= parseInt(nav.zIndex)) {
                    console.log('⚠️  App header z-index may be too low compared to navigation');
                }
            }
        }
        
        // Take screenshot for visual verification
        await page.screenshot({ 
            path: 'navigation-overlap-test.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved as navigation-overlap-test.png');
        
        console.log('✅ Navigation overlap test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

function isOverlapping(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
}

// Run the test
testNavigationOverlapPrevention().catch(console.error);
