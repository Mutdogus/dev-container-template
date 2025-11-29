#!/usr/bin/env node

/**
 * Quick Port Verification for Updated Dev Container
 */

import { spawn } from 'child_process';

async function checkPorts() {
  console.log('🔍 Checking Updated Dev Container Ports\n');

  const ports = [3001, 8001, 5433];
  let allAvailable = true;

  for (const port of ports) {
    try {
      const portCheck = spawn('lsof', ['-i', `:${port}`], { stdio: 'pipe' });
      await new Promise(resolve => {
        portCheck.on('close', code => {
          if (code === 0) {
            console.log(`❌ Port ${port} is in use`);
            allAvailable = false;
          } else {
            console.log(`✅ Port ${port} is available`);
          }
          resolve();
        });
        portCheck.on('error', () => {
          console.log(`✅ Port ${port} is available`);
          resolve();
        });
      });
    } catch (error) {
      console.log(`⚠️  Cannot check port ${port}`);
    }
  }

  console.log('\n🎯 Dev Container Status:');
  if (allAvailable) {
    console.log('✅ All ports are available - container should load successfully');
    console.log('\n📝 Next Steps:');
    console.log('1. Open VS Code');
    console.log('2. Command Palette: Ctrl+Shift+P');
    console.log('3. Select: "Dev Containers: Reopen in Container"');
    console.log('4. Container should load in 2-3 minutes');
  } else {
    console.log('❌ Some ports are still in use');
    console.log("Run: lsof -i :PORT to see what's using them");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkPorts();
}

export { checkPorts };
