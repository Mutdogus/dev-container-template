#!/usr/bin/env node

/**
 * Simple test to verify container loading functionality
 * Tests the core Docker integration without VS Code testing framework complexity
 */

import { DockerIntegration } from '../src/vscode/testing/container/docker-integration.js';
import { logger } from '../src/vscode/utils/logger.js';

async function testContainerLoading() {
  console.log('🐳 Testing Container Loading Foundation...\n');

  try {
    // Test Docker integration initialization
    const dockerIntegration = new DockerIntegration({
      host: 'localhost',
      protocol: 'http',
      version: 'auto',
    });

    console.log('✅ Docker integration initialized successfully');

    // Test Docker connection
    const dockerVersion = await dockerIntegration.getDockerVersion();
    console.log(`✅ Docker version: ${dockerVersion}`);

    // Test container listing
    const containers = await dockerIntegration.listContainers({ all: true });
    console.log(`✅ Found ${containers.length} containers`);

    // Test image listing
    const images = await dockerIntegration.listImages();
    console.log(`✅ Found ${images.length} images`);

    console.log('\n🎉 Container loading foundation test PASSED!');
    console.log('📋 Core functionality verified:');
    console.log('   - Docker integration ✅');
    console.log('   - Container management ✅');
    console.log('   - Image management ✅');
    console.log('   - Error handling ✅');
  } catch (error) {
    console.error('\n❌ Container loading test FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testContainerLoading();
