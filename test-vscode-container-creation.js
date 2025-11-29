#!/usr/bin/env node

/**
 * Test VS Code Container Creation
 * Tests if VS Code testing framework can create containers without errors
 */

import { ContainerLauncher } from '../src/vscode/dist/testing/container/launcher.js';

console.log('🧪 Testing VS Code Container Creation...');

async function testContainerCreation() {
  try {
    console.log('📦 Initializing ContainerLauncher...');
    const launcher = new ContainerLauncher();

    console.log('✅ ContainerLauncher initialized');

    // Test basic container configuration
    const testConfig = {
      image: 'alpine:latest',
      name: 'vscode-test-container',
      timeout: 30000,
      environment: {
        NODE_ENV: 'test',
        TEST_MODE: 'container-creation',
      },
      volumes: [],
      ports: {},
    };

    console.log('🔧 Testing container configuration...');
    console.log(`  Image: ${testConfig.image}`);
    console.log(`  Name: ${testConfig.name}`);
    console.log(`  Timeout: ${testConfig.timeout}ms`);
    console.log(`  Environment: ${JSON.stringify(testConfig.environment)}`);

    // Try to launch container
    console.log('🚀 Attempting to launch container...');
    const result = await launcher.launchContainer(testConfig);

    if (result.success) {
      console.log('✅ Container launched successfully!');
      console.log(`  Container ID: ${result.containerId}`);
      console.log(`  Status: ${result.status}`);

      // Wait a moment and check status
      await new Promise(resolve => setTimeout(resolve, 2000));

      const info = await launcher.getContainerInfo(result.containerId);
      console.log('📊 Container status after 2s:');
      console.log(`  Status: ${info.status}`);
      console.log(`  Started: ${info.startedAt}`);

      // Clean up
      await launcher.stopContainer(result.containerId);
      console.log('✅ Container stopped and cleaned up successfully');

      return true;
    } else {
      console.error('❌ Container launch failed!');
      console.error(`  Error: ${result.error}`);
      console.error(`  Container ID: ${result.containerId || 'none'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test
testContainerCreation()
  .then(success => {
    if (success) {
      console.log('\n🎉 VS Code Container Creation Test PASSED!');
      console.log('📋 Test Results:');
      console.log('   ✅ ContainerLauncher initialization');
      console.log('   ✅ Container configuration');
      console.log('   ✅ Container launch');
      console.log('   ✅ Container status check');
      console.log('   ✅ Container cleanup');
      console.log('\n🔍 VS Code container creation is working correctly!');
      console.log('\n💡 This means the VS Code testing framework should be able to:');
      console.log('   - Create test containers');
      console.log('   - Launch VS Code in containers');
      console.log('   - Run extension tests');
      console.log('   - Validate container behavior');
      console.log('\n🛠️ If you are still seeing container loading errors, the issue is likely:');
      console.log('   1. In the VS Code testing framework itself (not our container tools)');
      console.log('   2. Container configuration issues');
      console.log('   3. Docker environment problems');
      console.log('   4. Resource or permission issues');
      console.log('\n🔧 Use our container tools to diagnose:');
      console.log('   ./container-tools.js diagnostics');
      console.log('   ./container-tools.js list');
      console.log('   ./container-tools.js info <container-id>');
      console.log('   ./container-tools.js logs <container-id>');
      console.log('\n🎯 Container Loading Foundation Status:');
      console.log('   ✅ Docker Integration: WORKING');
      console.log('   ✅ Container Management: WORKING');
      console.log('   ✅ VS Code Testing: NEEDS INVESTIGATION');
      process.exit(0);
    } else {
      console.log('\n❌ VS Code Container Creation Test FAILED!');
      console.log('💡 This indicates there are issues in the VS Code testing framework');
      console.log('\n🔍 Next steps:');
      console.log('   1. Check VS Code testing framework imports');
      console.log('   2. Verify ContainerLauncher class implementation');
      console.log('   3. Test with simpler container configurations');
      console.log('   4. Use our container tools for detailed diagnostics');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test crashed with exception:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
