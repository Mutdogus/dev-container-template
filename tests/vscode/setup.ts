import { VSCodeTestEnvironment } from './index.js';

/**
 * Setup VS Code test environment
 */
export async function setupTestEnvironment(): Promise<void> {
  console.log('🔧 Setting up VS Code test environment...');
  
  // Create test directories if they don't exist
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const testDirs = [
    'tests/vscode/unit',
    'tests/vscode/integration', 
    'tests/vscode/fixtures',
    'coverage/vscode',
  ];
  
  for (const dir of testDirs) {
    await fs.mkdir(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
  
  // Create test configuration files
  const testConfig = {
    testMatchPattern: '**/*.test.ts',
    collectCoverageFrom: [
      '<rootDir>/src/vscode/**/*.{ts,tsx}'
    ],
    coverageDirectory: 'coverage/vscode',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/vscode/setup.ts'],
  };
  
  const configPath = path.join(process.cwd(), 'tests/vscode/jest.config.js');
  await fs.writeFile(configPath, `module.exports = ${JSON.stringify(testConfig, null, 2)};`);
  
  console.log('⚙️ Test environment setup complete');
  console.log(`📋 Test configuration: ${configPath}`);
}