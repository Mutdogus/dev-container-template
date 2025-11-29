import { VSCodeTestResult, TestConfiguration, ContainerValidation, ExtensionStatus } from '@vscode/types';
import { VSCodeTestUtils } from '@vscode/utils/helpers';
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
      id: VSCodeTestUtils.generateTestId('mock'),
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
      containerId: VSCodeTestUtils.generateContainerName('mock'),
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

  /**
   * Create mock extension status
   */
  public static createMockExtensionStatus(overrides: Partial<ExtensionStatus> = {}): ExtensionStatus {
    return {
      id: 'mock-extension',
      name: 'Mock Extension',
      version: '1.0.0',
      status: 'loaded',
      loadTime: 3000,
      compatibility: {
        vscodeVersion: '1.85.0',
        isCompatible: true,
        issues: [],
        warnings: []
      },
      ...overrides
    };
  }

  /**
   * Create array of mock test results
   */
  public static createMockTestResults(count: number, failureRate: number = 0.2): VSCodeTestResult[] {
    const results: VSCodeTestResult[] = [];
    const failureCount = Math.floor(count * failureRate);

    for (let i = 0; i < count; i++) {
      const isFailure = i < failureCount;
      results.push(this.createMockTestResult({
        id: `mock-test-${i + 1}`,
        name: `Mock Test ${i + 1}`,
        status: isFailure ? 'failed' : 'passed',
        duration: Math.random() * 5000 + 1000,
        error: isFailure ? 'Mock test failure' : undefined
      }));
    }

    return results;
  }

  /**
   * Create mock performance metrics
   */
  public static createMockPerformanceMetrics() {
    return {
      memoryUsage: Math.random() * 1024 + 512, // 512-1536 MB
      cpuUsage: Math.random() * 50 + 10, // 10-60%
      executionTime: Math.random() * 3000 + 1000, // 1-4 seconds
      containerStartupTime: Math.random() * 60000 + 30000, // 30-90 seconds
      extensionLoadingTime: Math.random() * 10000 + 5000 // 5-15 seconds
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
   * Assert test execution time is within threshold
   */
  public static assertExecutionTimeWithinThreshold(
    result: VSCodeTestResult,
    thresholdMs: number,
    message?: string
  ): void {
    const duration = result.duration || 0;
    if (duration > thresholdMs) {
      const errorMessage = message || 
        `Test "${result.name}" took ${duration}ms, which exceeds threshold of ${thresholdMs}ms`;
      this.logger.logError(new Error(errorMessage), 'assertion', { duration, thresholdMs });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert container validation is successful
   */
  public static assertContainerValidationSuccessful(
    validation: ContainerValidation,
    message?: string
  ): void {
    if (validation.status !== 'running') {
      const errorMessage = message || 
        `Container validation should be running but got status: ${validation.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { validation });
      throw new Error(errorMessage);
    }

    const failedExtensions = validation.extensions.filter(ext => ext.status === 'failed');
    if (failedExtensions.length > 0) {
      const errorMessage = message || 
        `Container should have no failed extensions but found: ${failedExtensions.map(e => e.id).join(', ')}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { failedExtensions });
      throw new Error(errorMessage);
    }

    const failedChecks = validation.environmentChecks.filter(check => check.status === 'failed');
    if (failedChecks.length > 0) {
      const errorMessage = message || 
        `Container should have no failed environment checks but found: ${failedChecks.map(c => c.name).join(', ')}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { failedChecks });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert memory usage is within threshold
   */
  public static assertMemoryWithinThreshold(
    usedMb: number,
    thresholdMb: number,
    message?: string
  ): void {
    if (usedMb > thresholdMb) {
      const errorMessage = message || 
        `Memory usage ${usedMb}MB exceeds threshold of ${thresholdMb}MB`;
      this.logger.logError(new Error(errorMessage), 'assertion', { usedMb, thresholdMb });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert extension is loaded
   */
  public static assertExtensionLoaded(extension: ExtensionStatus, message?: string): void {
    if (extension.status !== 'loaded') {
      const errorMessage = message || 
        `Extension "${extension.name}" should be loaded but got status: ${extension.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { extension });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert array contains expected items
   */
  public static assertArrayContains<T>(
    array: T[],
    expectedItems: T[],
    message?: string
  ): void {
    const missingItems = expectedItems.filter(item => !array.includes(item));
    if (missingItems.length > 0) {
      const errorMessage = message || 
        `Array should contain ${missingItems.join(', ')} but missing items were found`;
      this.logger.logError(new Error(errorMessage), 'assertion', { array, expectedItems, missingItems });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert success rate meets minimum
   */
  public static assertSuccessRateMeetsMinimum(
    results: VSCodeTestResult[],
    minimumRate: number,
    message?: string
  ): void {
    const successRate = VSCodeTestUtils.calculateSuccessRate(results);
    if (successRate < minimumRate) {
      const errorMessage = message || 
        `Success rate ${successRate}% is below minimum ${minimumRate}%`;
      this.logger.logError(new Error(errorMessage), 'assertion', { successRate, minimumRate });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert object has required properties
   */
  public static assertHasProperties<T extends Record<string, any>>(
    obj: T,
    requiredProperties: (keyof T)[],
    message?: string
  ): void {
    const missingProperties = requiredProperties.filter(prop => !(prop in obj));
    if (missingProperties.length > 0) {
      const errorMessage = message || 
        `Object is missing required properties: ${missingProperties.join(', ')}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { obj, missingProperties });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert value is not null or undefined
   */
  public static assertNotNull<T>(value: T | null | undefined, message?: string): asserts value is T {
    if (value === null || value === undefined) {
      const errorMessage = message || 'Value should not be null or undefined';
      this.logger.logError(new Error(errorMessage), 'assertion');
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert string is not empty
   */
  public static assertNotEmpty(value: string, message?: string): void {
    if (!value || value.trim().length === 0) {
      const errorMessage = message || 'String should not be empty';
      this.logger.logError(new Error(errorMessage), 'assertion', { value });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert number is within range
   */
  public static assertNumberInRange(
    value: number,
    min: number,
    max: number,
    message?: string
  ): void {
    if (value < min || value > max) {
      const errorMessage = message || 
        `Number ${value} is not within range [${min}, ${max}]`;
      this.logger.logError(new Error(errorMessage), 'assertion', { value, min, max });
      throw new Error(errorMessage);
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate random test configuration
   */
  public static generateRandomTestConfig(): TestConfiguration {
    return MockFactory.createMockTestConfig({
      timeout: Math.floor(Math.random() * 60000) + 10000,
      parallel: Math.random() > 0.5,
      retryCount: Math.floor(Math.random() * 5) + 1,
      memoryThreshold: Math.floor(Math.random() * 4096) + 512
    });
  }

  /**
   * Generate test results with various statuses
   */
  public static generateMixedTestResults(count: number): VSCodeTestResult[] {
    const results: VSCodeTestResult[] = [];
    const statuses: VSCodeTestResult['status'][] = ['passed', 'failed', 'skipped'];

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      results.push(MockFactory.createMockTestResult({
        id: `generated-test-${i + 1}`,
        name: `Generated Test ${i + 1}`,
        status,
        duration: Math.random() * 5000 + 500,
        error: status === 'failed' ? 'Generated failure' : undefined
      }));
    }

    return results;
  }

  /**
   * Generate container validation with mixed results
   */
  public static generateMixedContainerValidation(): ContainerValidation {
    const extensions = [
      MockFactory.createMockExtensionStatus({ status: 'loaded' }),
      MockFactory.createMockExtensionStatus({ status: 'loaded' }),
      MockFactory.createMockExtensionStatus({ status: 'failed', error: 'Extension failed to load' })
    ];

    const environmentChecks = [
      { name: 'Node.js', status: 'passed' as const, executionTime: 1000 },
      { name: 'Git', status: 'passed' as const, executionTime: 500 },
      { name: 'Docker', status: 'warning' as const, executionTime: 2000, message: 'Docker version is older than recommended' }
    ];

    return MockFactory.createMockContainerValidation({
      extensions,
      environmentChecks
    });
  }
}