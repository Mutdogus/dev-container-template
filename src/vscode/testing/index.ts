import { VSCodeTestRunner } from './core/test-runner.js';

/**
 * VS Code test runner for development environment
 */
export class VSCodeTestEnvironment {
  private runner: VSCodeTestRunner;

  constructor() {
    this.runner = new VSCodeTestRunner();
  }

  /**
   * Run all VS Code test suites
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting VS Code test execution...');
    
    try {
      const testSuites = await this.runner.getAvailableTestSuites();
      
      for (const suiteName of testSuites) {
        console.log(`📋 Running test suite: ${suiteName}`);
        const result = await this.runner.runTestSuite(suiteName);
        
        if (result.status === 'failed') {
          console.error(`❌ Test suite '${suiteName}' failed:`, result.error);
          process.exit(1);
        }
        
        console.log(`✅ Test suite '${suiteName}' completed: ${result.status}`);
      }
      
      console.log('🎉 All VS Code tests completed successfully!');
    } catch (error) {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run specific test suite
   */
  async runTestSuite(suiteName: string): Promise<void> {
    const result = await this.runner.runTestSuite(suiteName);
    
    if (result.status === 'failed') {
      throw new Error(`Test suite '${suiteName}' failed: ${result.error}`);
    }
    
    console.log(`✅ Test suite '${suiteName}' passed`);
  }

  /**
   * Get test runner status
   */
  getStatus() {
    return this.runner.getStatus();
  }
}

// CLI entry point
if (require.main === module) {
  const environment = new VSCodeTestEnvironment();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      environment.runAllTests();
      break;
    case 'test-suite':
      if (!process.argv[3]) {
        console.error('Usage: npm run test -- <suite-name>');
        process.exit(1);
      }
      environment.runTestSuite(process.argv[3]);
      break;
    case 'status':
      const status = environment.getStatus();
      console.log('Test Runner Status:', status);
      break;
    default:
      console.log('Usage:');
      console.log('  npm run test              # Run all tests');
      console.log('  npm run test -- <suite>  # Run specific test suite');
      console.log('  npm run test -- status     # Show test runner status');
      break;
  }
}