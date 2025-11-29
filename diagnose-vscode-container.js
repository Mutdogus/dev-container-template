#!/usr/bin/env node

/**
 * VS Code Dev Container Diagnostic Tool
 * Identifies specific issues preventing container loading
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';

async function diagnoseVSCodeContainer() {
  console.log('🔬 VS Code Dev Container Diagnostic Tool\n');

  // Test 1: Check VS Code installation and Remote Containers extension
  console.log('📋 Test 1: VS Code Environment');

  try {
    // Check if VS Code is installed
    const codeVersion = spawn('code', ['--version'], { stdio: 'pipe' });
    await new Promise((resolve, reject) => {
      codeVersion.on('close', code => {
        if (code === 0) {
          console.log('✅ VS Code is installed');
        } else {
          console.log('❌ VS Code is not in PATH or not installed');
        }
        resolve();
      });
      codeVersion.on('error', () => {
        console.log('❌ VS Code is not in PATH or not installed');
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ VS Code check failed');
  }

  // Test 2: Check Docker Desktop status
  console.log('\n📋 Test 2: Docker Desktop Status');

  try {
    const dockerInfo = spawn('docker', ['info'], { stdio: 'pipe' });
    let dockerOutput = '';

    await new Promise(resolve => {
      dockerInfo.stdout.on('data', data => {
        dockerOutput += data.toString();
      });

      dockerInfo.on('close', code => {
        if (code === 0) {
          if (dockerOutput.includes('Desktop')) {
            console.log('✅ Docker Desktop is running');
          } else {
            console.log('⚠️  Docker daemon running, but may not be Docker Desktop');
          }

          // Check for common Docker issues
          if (dockerOutput.includes('WARNING')) {
            console.log('⚠️  Docker warnings detected:');
            dockerOutput
              .split('\n')
              .filter(line => line.includes('WARNING'))
              .forEach(line => console.log(`   ${line.trim()}`));
          }
        } else {
          console.log('❌ Docker daemon is not running');
        }
        resolve();
      });

      dockerInfo.on('error', () => {
        console.log('❌ Docker daemon is not running');
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ Docker check failed');
  }

  // Test 3: Check for port conflicts
  console.log('\n📋 Test 3: Port Availability');

  const ports = [3000, 8000, 5432];
  for (const port of ports) {
    try {
      const portCheck = spawn('lsof', ['-i', `:${port}`], { stdio: 'pipe' });
      await new Promise(resolve => {
        portCheck.on('close', code => {
          if (code === 0) {
            console.log(`❌ Port ${port} is in use`);
          } else {
            console.log(`✅ Port ${port} is available`);
          }
          resolve();
        });
        portCheck.on('error', () => {
          console.log(`⚠️  Cannot check port ${port} (lsof not available)`);
          resolve();
        });
      });
    } catch (error) {
      console.log(`⚠️  Cannot check port ${port}`);
    }
  }

  // Test 4: Check disk space
  console.log('\n📋 Test 4: Disk Space');

  try {
    const df = spawn('df', ['-h', '.'], { stdio: 'pipe' });
    let dfOutput = '';

    await new Promise(resolve => {
      df.stdout.on('data', data => {
        dfOutput += data.toString();
      });

      df.on('close', () => {
        const lines = dfOutput.split('\n');
        if (lines.length > 1) {
          const diskInfo = lines[1].split(/\s+/);
          const available = diskInfo[3];
          const usedPercent = diskInfo[4];

          console.log(`Disk space: ${usedPercent} used, ${available} available`);

          if (parseInt(usedPercent) > 90) {
            console.log('❌ Low disk space - may prevent container build');
          } else if (parseInt(usedPercent) > 80) {
            console.log('⚠️  Limited disk space - may cause issues');
          } else {
            console.log('✅ Sufficient disk space');
          }
        }
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ Cannot check disk space');
  }

  // Test 5: Check VS Code Remote Containers logs
  console.log('\n📋 Test 5: VS Code Remote Containers Logs');

  const vscodeLogsPath = `${homedir()}/Library/Application Support/Code/User/logs`;
  if (existsSync(vscodeLogsPath)) {
    console.log('✅ VS Code logs directory found');
    console.log('📝 Check these logs for detailed error information:');
    console.log(`   ${vscodeLogsPath}`);
    console.log('   Look for files containing "remote" or "container"');
  } else {
    console.log('⚠️  VS Code logs directory not found');
    console.log('   This is normal if VS Code has not been used yet');
  }

  // Test 6: Check for common VS Code extension issues
  console.log('\n📋 Test 6: Remote Containers Extension');

  try {
    // Try to list VS Code extensions
    const extList = spawn('code', ['--list-extensions'], { stdio: 'pipe' });
    let extensions = '';

    await new Promise(resolve => {
      extList.stdout.on('data', data => {
        extensions += data.toString();
      });

      extList.on('close', code => {
        if (code === 0) {
          const hasRemoteContainers = extensions.includes('ms-vscode-remote.remote-containers');
          if (hasRemoteContainers) {
            console.log('✅ Remote Containers extension is installed');
          } else {
            console.log('❌ Remote Containers extension is NOT installed');
            console.log('   Install it from VS Code marketplace:');
            console.log('   Extension ID: ms-vscode-remote.remote-containers');
          }
        } else {
          console.log('⚠️  Cannot check VS Code extensions');
        }
        resolve();
      });

      extList.on('error', () => {
        console.log('⚠️  Cannot check VS Code extensions');
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ Extension check failed');
  }

  // Test 7: Check file permissions
  console.log('\n📋 Test 7: File Permissions');

  const filesToCheck = ['.devcontainer/devcontainer.json', '.devcontainer/Dockerfile', '.'];

  for (const file of filesToCheck) {
    try {
      const stats = spawn('ls', ['-la', file], { stdio: 'pipe' });
      let output = '';

      await new Promise(resolve => {
        stats.stdout.on('data', data => {
          output += data.toString();
        });

        stats.on('close', code => {
          if (code === 0) {
            console.log(`✅ ${file} - readable`);
          } else {
            console.log(`❌ ${file} - not accessible`);
          }
          resolve();
        });
      });
    } catch (error) {
      console.log(`❌ ${file} - permission check failed`);
    }
  }

  // Test 8: Try manual container build with verbose output
  console.log('\n📋 Test 8: Verbose Container Build Test');
  console.log('Testing container build with detailed output...');

  try {
    const buildProcess = spawn(
      'docker',
      [
        'build',
        '--no-cache',
        '--progress=plain',
        '-t',
        'vscode-diagnostic-test',
        '-f',
        '.devcontainer/Dockerfile',
        '.',
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );

    let buildOutput = '';
    let errorOutput = '';
    let hasError = false;

    buildProcess.stdout.on('data', data => {
      const output = data.toString();
      buildOutput += output;
      process.stdout.write('.');
    });

    buildProcess.stderr.on('data', data => {
      const output = data.toString();
      errorOutput += output;
      if (output.includes('ERROR') || output.includes('error')) {
        hasError = true;
        process.stdout.write('❌');
      } else {
        process.stdout.write('⚠️');
      }
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('close', code => {
        console.log('\n');

        if (code === 0 && !hasError) {
          console.log('✅ Container build successful');
        } else {
          console.log('❌ Container build failed');

          // Extract key error messages
          const errorLines = errorOutput
            .split('\n')
            .filter(
              line =>
                line.includes('ERROR') ||
                line.includes('error:') ||
                line.includes('failed') ||
                line.includes('permission denied')
            );

          if (errorLines.length > 0) {
            console.log('\n🔍 Key Error Messages:');
            errorLines.slice(0, 5).forEach(line => {
              console.log(`   ${line.trim()}`);
            });
          }
        }

        resolve();
      });

      buildProcess.on('error', error => {
        console.log(`\n❌ Build process failed: ${error.message}`);
        resolve();
      });
    });

    // Cleanup test image
    spawn('docker', ['rmi', 'vscode-diagnostic-test'], { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Build test failed');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If any tests above show ❌, fix those issues first');
  console.log('2. Try opening VS Code and use "Dev Containers: Rebuild Container"');
  console.log('3. Check VS Code Output panel for "Remote - Containers" logs');
  console.log('4. If still failing, try VS Code "Developer: Reload Window"');
  console.log('5. As last resort, restart VS Code and Docker Desktop');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  diagnoseVSCodeContainer();
}

export { diagnoseVSCodeContainer };
