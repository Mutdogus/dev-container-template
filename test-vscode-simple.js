#!/usr/bin/env node

/**
 * Simple VS Code Test Runner
 * Bypasses complex framework to test container loading directly
 */

import { spawn } from 'child_process';
import path from 'path';

async function runVSCodeContainerTest() {
  console.log('🚀 Starting VS Code Container Test...\n');

  try {
    // Test 1: Check Docker availability
    console.log('📋 Test 1: Docker Availability');
    const dockerCheck = spawn('docker', ['--version']);

    await new Promise((resolve, reject) => {
      dockerCheck.on('close', code => {
        if (code === 0) {
          console.log('✅ Docker is available\n');
          resolve();
        } else {
          console.log('❌ Docker is not available\n');
          reject(new Error('Docker not found'));
        }
      });
    });

    // Test 2: Check if we can create a simple container
    console.log('📋 Test 2: Container Creation');
    const testContainer = spawn('docker', [
      'run',
      '--rm',
      'alpine:latest',
      'echo',
      'Container test successful',
    ]);

    await new Promise((resolve, reject) => {
      let output = '';
      testContainer.stdout.on('data', data => {
        output += data.toString();
      });

      testContainer.on('close', code => {
        if (code === 0) {
          console.log('✅ Container creation successful');
          console.log(`Output: ${output.trim()}\n`);
          resolve();
        } else {
          console.log('❌ Container creation failed\n');
          reject(new Error('Container creation failed'));
        }
      });
    });

    // Test 3: Check for VS Code executable
    console.log('📋 Test 3: VS Code Availability');
    const codeCheck = spawn('code', ['--version']);

    await new Promise(resolve => {
      codeCheck.on('error', err => {
        if (err.code === 'ENOENT') {
          console.log('⚠️  VS Code not found in PATH (may need manual installation)\n');
        } else {
          console.log(`❌ Error checking VS Code: ${err.message}\n`);
        }
        resolve();
      });

      codeCheck.on('close', code => {
        if (code === 0) {
          console.log('✅ VS Code is available\n');
        } else {
          console.log('⚠️  VS Code not found in PATH (may need manual installation)\n');
        }
        resolve();
      });
    });

    // Test 4: Check Node.js version
    console.log('📋 Test 4: Node.js Environment');
    const nodeCheck = spawn('node', ['--version']);

    await new Promise(resolve => {
      nodeCheck.stdout.on('data', data => {
        const version = data.toString().trim();
        console.log(`✅ Node.js version: ${version}\n`);
      });
      nodeCheck.on('close', resolve);
    });

    // Summary
    console.log('🎉 VS Code Container Test Summary:');
    console.log('✅ Docker Integration: Working');
    console.log('✅ Container Creation: Working');
    console.log('✅ Basic Environment: Ready');
    console.log('\n📝 Next Steps:');
    console.log('1. Install VS Code if not available');
    console.log('2. Install VS Code Extension Development Host');
    console.log('3. Test with actual VS Code containers');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVSCodeContainerTest();
}

export { runVSCodeContainerTest };
