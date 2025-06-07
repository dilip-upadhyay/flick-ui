#!/usr/bin/env node

/**
 * Grid Layout Bug Fix Verification Script
 * 
 * This script validates that the grid-test-scenario.json configuration
 * contains all the required properties for the bug fix test.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = './src/assets/configs/grid-test-scenario.json';

console.log('🔬 Grid Layout Bug Fix Verification');
console.log('=====================================');

try {
    // Load the test configuration
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    let passed = 0;
    let total = 0;
    
    function test(description, condition) {
        total++;
        const status = condition ? '✅' : '❌';
        console.log(`${status} ${description}`);
        if (condition) passed++;
        return condition;
    }
    
    console.log('\n📋 Testing Grid Configuration...');
    
    // Test 1: Layout type is grid
    test('Layout type is "grid"', config.layout?.type === 'grid');
    
    // Test 2: Grid has 2 columns
    test('Grid has 2 columns', config.layout?.columns === 2);
    
    // Test 3: Grid has 2 rows
    test('Grid has 2 rows', config.layout?.rows === 2);
    
    // Test 4: Grid gap is 10px
    test('Grid gap is "10px"', config.layout?.gap === '10px');
    
    // Test 5: Has 4 components
    test('Configuration has 4 components', config.components?.length === 4);
    
    // Test 6: All components are text-input type
    const allTextInputs = config.components?.every(comp => comp.type === 'text-input');
    test('All components are text-input type', allTextInputs);
    
    // Test 7: All components have gridPosition
    const allHaveGridPosition = config.components?.every(comp => comp.gridPosition);
    test('All components have gridPosition', allHaveGridPosition);
    
    // Test 8: Grid positions cover all 4 cells
    const positions = config.components?.map(comp => `${comp.gridPosition.row},${comp.gridPosition.col}`);
    const expectedPositions = ['0,0', '0,1', '1,0', '1,1'];
    const hasAllPositions = expectedPositions.every(pos => positions?.includes(pos));
    test('Grid positions cover all 4 cells (0,0), (0,1), (1,0), (1,1)', hasAllPositions);
    
    console.log('\n📊 Component Details:');
    config.components?.forEach((comp, index) => {
        const pos = comp.gridPosition;
        console.log(`   ${index + 1}. ${comp.props.label} at (${pos.row},${pos.col})`);
    });
    
    console.log('\n🏁 Test Results:');
    console.log(`   Passed: ${passed}/${total} tests`);
    
    if (passed === total) {
        console.log('   🎉 All tests passed! Grid layout configuration is correct.');
        console.log('   ✅ Ready for manual testing in designer and preview modes.');
    } else {
        console.log('   ⚠️  Some tests failed. Please review the configuration.');
    }
    
    console.log('\n🔗 Test URLs:');
    console.log('   Designer: http://localhost:4200/designer');
    console.log('   Preview:  http://localhost:4200/preview?config=grid-test-scenario');
    
} catch (error) {
    console.error('❌ Error reading configuration file:', error.message);
    console.log('\nPlease ensure the configuration file exists at:', CONFIG_PATH);
}
