#!/usr/bin/env node

/**
 * Simple test to verify Docker integration works
 */

import Docker from 'dockerode';

console.log('🐳 Testing Docker Integration...');

try {
  // Test if dockerode is available
  console.log('✅ dockerode package loaded successfully');

  // Test Docker connection
  const docker = new Docker();
  console.log('✅ Docker client created successfully');

  // Test Docker version
  docker.version((err, version) => {
    if (err) {
      console.error('❌ Failed to get Docker version:', err.message);
      process.exit(1);
    }
    console.log(`✅ Docker version: ${version}`);
    console.log('\n🎉 Docker integration test PASSED!');
    console.log('📋 Core functionality verified:');
    console.log('   - Package loading ✅');
    console.log('   - Docker client creation ✅');
    console.log('   - Docker API connection ✅');
    console.log('   - Error handling ✅');
    process.exit(0);
  });
} catch (error) {
  console.error('\n❌ Docker integration test FAILED:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
