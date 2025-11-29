import { VSCodeTestResult, TestConfiguration, ContainerValidation } from '@vscode/types';
import { TestLogger } from '@vscode/utils/logger';

/**
 * Mock factory for creating test objects
 */
export class MockFactory {
  private static logger = TestLogger.getInstance();

  /**
   * Create mock test result
   */
  public static createMockTestResult(overrides: Partial<VSCodeTestResult> = {}): VSCodeTestResult {
    return {
      id: `mock-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: 'Mock Test',
      status: 'passed',
      timestamp: new Date(),
      duration: 1000,
      ...overrides
    };
  }

  /**
   * Create mock test configuration
   */
  public static createMockTestConfig(overrides: Partial<TestConfiguration> = {}): TestConfiguration {
    return {
      vscodeVersions: ['stable'],
      timeout: 30000,
      parallel: true,
      retryCount: 3,
      memoryThreshold: 2048,
      containerConfig: {
        image: 'mcr.microsoft.com/vscode/devcontainers/javascript-node:18',
        name: 'mock-container',
        timeout: 300000,
        environment: {},
        volumes: [],
        ports: {}
      },
      ...overrides
    };
  }

  /**
   * Create mock container validation
   */
  public static createMockContainerValidation(overrides: Partial<ContainerValidation> = {}): ContainerValidation {
    return {
      containerId: `mock-container-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'running',
      buildTime: 60000,
      startupTime: 30000,
      resourceUsage: {
        memory: { used: 1024, limit: 4096, warningThreshold: 2048 },
        cpu: { usage: 25, cores: 4 },
        disk: { used: 1024, available: 3072 }
      },
      extensions: [
        {
          id: 'ms-vscode.cpptools',
          name: 'C/C++',
          version: '1.0.0',
          status: 'loaded',
          loadTime: 5000
        }
      ],
      environmentChecks: [
        {
          name: 'Node.js availability',
          status: 'passed',
          executionTime: 1000,
          message: 'Node.js is available and properly configured'
        }
      ],
      ...overrides
    };
  }
}

/**
 * Test assertion helpers
 */
export class AssertionHelpers {
  private static logger = TestLogger.getInstance();

  /**
   * Assert test result is successful
   */
  public static assertTestPassed(result: VSCodeTestResult, message?: string): void {
    if (result.status !== 'passed') {
      const errorMessage = message || `Test "${result.name}" should have passed but got status: ${result.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { result });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert test result is failed
   */
  public static assertTestFailed(result: VSCodeTestResult, message?: string): void {
    if (result.status !== 'failed') {
      const errorMessage = message || `Test "${result.name}" should have failed but got status: ${result.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { result });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert container validation is successful
   */
  public static assertContainerValidationSuccessful(validation: ContainerValidation, message?: string): void {
    if (validation.status !== 'running') {
      const errorMessage = message || 
        `Container validation should be running but got status: ${validation.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { validation });
      throw new Error(errorMessage);
    }
  }
}