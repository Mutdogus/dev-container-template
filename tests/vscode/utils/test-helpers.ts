import {
  VSCodeTestResult,
  TestConfiguration,
  ContainerValidation,
  ExtensionStatus,
} from '../../../src/vscode/types';
import { VSCodeTestUtils } from '../../../src/vscode/utils/helpers';
import { TestLoggerFactory } from '../../../src/vscode/utils/logger';

/**
 * Mock factory for creating test objects
 */
export class MockFactory {
  private static logger = TestLoggerFactory.getInstance();

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
      ...overrides,
    };
  }

  /**
   * Create mock test configuration
   */
  public static createMockTestConfig(
    overrides: Partial<TestConfiguration> = {}
  ): TestConfiguration {
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
        ports: {},
      },
      ...overrides,
    };
  }

  /**
   * Create mock container validation
   */
  public static createMockContainerValidation(
    overrides: Partial<ContainerValidation> = {}
  ): ContainerValidation {
    return {
      containerId: VSCodeTestUtils.generateContainerName('mock'),
      status: 'running',
      buildTime: 60000,
      startupTime: 30000,
      resourceUsage: {
        memory: { used: 1024, limit: 4096, warningThreshold: 2048 },
        cpu: { usage: 25, cores: 4 },
        disk: { used: 1024, available: 3072 },
      },
      extensions: [
        {
          id: 'ms-vscode.cpptools',
          name: 'C/C++',
          version: '1.0.0',
          status: 'loaded',
          loadTime: 5000,
        },
      ],
      environmentChecks: [
        {
          name: 'Node.js availability',
          status: 'passed',
          executionTime: 1000,
          message: 'Node.js is available and properly configured',
        },
      ],
      ...overrides,
    };
  }

  /**
   * Create mock extension status
   */
  public static createMockExtensionStatus(
    overrides: Partial<ExtensionStatus> = {}
  ): ExtensionStatus {
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
        warnings: [],
      },
      ...overrides,
    };
  }

  /**
   * Create array of mock test results
   */
  public static createMockTestResults(
    count: number,
    failureRate: number = 0.2
  ): VSCodeTestResult[] {
    const results: VSCodeTestResult[] = [];
    const failureCount = Math.floor(count * failureRate);

    for (let i = 0; i < count; i++) {
      const isFailure = i < failureCount;
      results.push(
        this.createMockTestResult({
          id: `mock-test-${i + 1}`,
          name: `Mock Test ${i + 1}`,
          status: isFailure ? 'failed' : 'passed',
          duration: Math.random() * 5000 + 1000,
          error: isFailure ? 'Mock test failure' : undefined,
        })
      );
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
      extensionLoadingTime: Math.random() * 10000 + 5000, // 5-15 seconds
    };
  }

  /**
   * Create valid extensions for testing
   */
  public static createValidExtensions() {
    return [
      {
        id: 'ext-1',
        name: 'TypeScript Extension',
        version: '1.0.0',
        path: '/extensions/typescript',
        enabled: true,
      },
      {
        id: 'ext-2',
        name: 'Docker Extension',
        version: '2.1.0',
        path: '/extensions/docker',
        enabled: true,
      },
      {
        id: 'ext-3',
        name: 'Git Extension',
        version: '3.2.1',
        path: '/extensions/git',
        enabled: true,
      },
    ];
  }

  /**
   * Create invalid extensions for testing failure scenarios
   */
  public static createInvalidExtensions() {
    return [
      {
        id: 'ext-invalid-1',
        name: 'Invalid Extension',
        version: '1.0.0',
        path: '/extensions/invalid',
        enabled: true,
        shouldFail: true,
      },
      {
        id: 'ext-invalid-2',
        name: 'Corrupted Extension',
        version: '2.0.0',
        path: '/extensions/corrupted',
        enabled: true,
        shouldFail: true,
      },
    ];
  }

  /**
   * Create extensions with dependencies
   */
  public static createExtensionsWithDependencies() {
    return [
      {
        id: 'ext-dep-1',
        name: 'Extension with Dependencies',
        version: '1.0.0',
        path: '/extensions/with-deps',
        enabled: true,
        dependencies: ['ext-1', 'ext-2'],
      },
      {
        id: 'ext-dep-2',
        name: 'Extension with Missing Deps',
        version: '2.0.0',
        path: '/extensions/missing-deps',
        enabled: true,
        dependencies: ['ext-missing-1', 'ext-missing-2'],
      },
    ];
  }

  /**
   * Create extensions with version requirements
   */
  public static createExtensionsWithVersionRequirements() {
    return [
      {
        id: 'ext-version-1',
        name: 'Version Specific Extension',
        version: '2.0.0',
        path: '/extensions/version-specific',
        enabled: true,
        minVSCodeVersion: '1.80.0',
        maxVSCodeVersion: '1.90.0',
      },
      {
        id: 'ext-version-2',
        name: 'Outdated Extension',
        version: '1.5.0',
        path: '/extensions/outdated',
        enabled: true,
        minVSCodeVersion: '1.85.0',
      },
    ];
  }

  /**
   * Create problematic extensions for error testing
   */
  public static createProblematicExtensions() {
    return [
      {
        id: 'ext-problem-1',
        name: 'Problematic Extension',
        version: '1.0.0',
        path: '/extensions/problematic',
        enabled: true,
      },
      {
        id: 'ext-problem-2',
        name: 'Conflicting Extension',
        version: '2.0.0',
        path: '/extensions/conflicting',
        enabled: true,
      },
    ];
  }

  /**
   * Create compatible extensions for testing
   */
  public static createCompatibleExtensions() {
    return [
      {
        id: 'compatible-1',
        name: 'Compatible Extension',
        version: '1.0.0',
        path: '/extensions/compatible1',
        enabled: true,
        minVSCodeVersion: '1.80.0',
        maxVSCodeVersion: '1.90.0',
      },
      {
        id: 'compatible-2',
        name: 'Another Compatible Extension',
        version: '2.0.0',
        path: '/extensions/compatible2',
        enabled: true,
        minVSCodeVersion: '1.75.0',
      },
    ];
  }

  /**
   * Create incompatible extensions for testing
   */
  public static createIncompatibleExtensions() {
    return [
      {
        id: 'incompatible-1',
        name: 'Incompatible Extension',
        version: '1.0.0',
        path: '/extensions/incompatible1',
        enabled: true,
        minVSCodeVersion: '1.90.0', // Requires newer version
      },
      {
        id: 'incompatible-2',
        name: 'Outdated Extension',
        version: '2.0.0',
        path: '/extensions/incompatible2',
        enabled: true,
        maxVSCodeVersion: '1.80.0', // Too old
      },
    ];
  }

  /**
   * Create boundary version extensions for testing
   */
  public static createBoundaryVersionExtensions() {
    return [
      {
        id: 'boundary-min',
        name: 'Boundary Min Extension',
        version: '1.0.0',
        path: '/extensions/boundary-min',
        enabled: true,
        minVSCodeVersion: '1.85.0',
      },
      {
        id: 'boundary-max',
        name: 'Boundary Max Extension',
        version: '1.0.0',
        path: '/extensions/boundary-max',
        enabled: true,
        maxVSCodeVersion: '1.85.0',
      },
    ];
  }

  /**
   * Create version test extensions
   */
  public static createVersionTestExtensions() {
    return [
      {
        id: 'version-test-1',
        name: 'Version Test 1',
        version: '1.0.0',
        path: '/extensions/version1',
        enabled: true,
        minVSCodeVersion: '1.80.0',
        maxVSCodeVersion: '1.90.0',
      },
      {
        id: 'version-test-2',
        name: 'Version Test 2',
        version: '1.0.0',
        path: '/extensions/version2',
        enabled: true,
        minVSCodeVersion: '1.85.0',
        maxVSCodeVersion: '1.85.0',
      },
      {
        id: 'version-test-3',
        name: 'Version Test 3',
        version: '1.0.0',
        path: '/extensions/version3',
        enabled: true,
        maxVSCodeVersion: '1.80.0',
      },
    ];
  }

  /**
   * Create extensions with complex dependencies
   */
  public static createExtensionsWithComplexDependencies() {
    return [
      {
        id: 'complex-dep-1',
        name: 'Complex Dependency Extension 1',
        version: '1.0.0',
        path: '/extensions/complex1',
        enabled: true,
        dependencies: ['ext-1', 'ext-2'],
      },
      {
        id: 'complex-dep-2',
        name: 'Complex Dependency Extension 2',
        version: '1.0.0',
        path: '/extensions/complex2',
        enabled: true,
        dependencies: ['ext-3', 'non-existent'],
      },
    ];
  }

  /**
   * Create available extensions (for dependency checking)
   */
  public static createAvailableExtensions() {
    return [
      {
        id: 'ext-1',
        name: 'Available Extension 1',
        version: '1.0.0',
        path: '/extensions/available1',
        enabled: true,
      },
      {
        id: 'ext-2',
        name: 'Available Extension 2',
        version: '1.0.0',
        path: '/extensions/available2',
        enabled: true,
      },
      {
        id: 'ext-3',
        name: 'Available Extension 3',
        version: '1.0.0',
        path: '/extensions/available3',
        enabled: true,
      },
    ];
  }

  /**
   * Create circular dependency extensions
   */
  public static createCircularDependencyExtensions() {
    return [
      {
        id: 'circular-1',
        name: 'Circular Extension 1',
        version: '1.0.0',
        path: '/extensions/circular1',
        enabled: true,
        dependencies: ['circular-2'],
      },
      {
        id: 'circular-2',
        name: 'Circular Extension 2',
        version: '1.0.0',
        path: '/extensions/circular2',
        enabled: true,
        dependencies: ['circular-1'],
      },
    ];
  }

  /**
   * Create extensions with missing dependencies
   */
  public static createExtensionsWithMissingDependencies() {
    return [
      {
        id: 'missing-dep-1',
        name: 'Missing Dependency Extension 1',
        version: '1.0.0',
        path: '/extensions/missing1',
        enabled: true,
        dependencies: ['available-ext', 'missing-ext'],
      },
    ];
  }

  /**
   * Create API compatibility extensions
   */
  public static createAPICompatibilityExtensions() {
    return [
      {
        id: 'api-compatible',
        name: 'API Compatible Extension',
        version: '1.0.0',
        path: '/extensions/api-compatible',
        enabled: true,
      },
    ];
  }

  /**
   * Create experimental API extensions
   */
  public static createExperimentalAPIExtensions() {
    return [
      {
        id: 'experimental-api',
        name: 'Experimental API Extension',
        version: '1.0.0',
        path: '/extensions/experimental',
        enabled: true,
      },
    ];
  }

  /**
   * Create matrix test extensions for multi-version testing
   */
  public static createMatrixTestExtensions() {
    return [
      {
        id: 'matrix-ext-1',
        name: 'Matrix Extension 1',
        version: '1.0.0',
        path: '/extensions/matrix1',
        enabled: true,
        minVSCodeVersion: '1.80.0',
        maxVSCodeVersion: '1.90.0',
      },
      {
        id: 'matrix-ext-2',
        name: 'Matrix Extension 2',
        version: '2.0.0',
        path: '/extensions/matrix2',
        enabled: true,
        minVSCodeVersion: '1.85.0',
      },
      {
        id: 'matrix-ext-3',
        name: 'Matrix Extension 3',
        version: '1.5.0',
        path: '/extensions/matrix3',
        enabled: true,
        maxVSCodeVersion: '1.85.0',
      },
    ];
  }

  /**
   * Create performance test extensions
   */
  public static createPerformanceTestExtensions() {
    return [
      {
        id: 'perf-ext-1',
        name: 'Performance Extension 1',
        version: '1.0.0',
        path: '/extensions/perf1',
        enabled: true,
        loadTime: 5000,
      },
      {
        id: 'perf-ext-2',
        name: 'Performance Extension 2',
        version: '2.0.0',
        path: '/extensions/perf2',
        enabled: true,
        loadTime: 8000,
      },
    ];
  }

  /**
   * Create extensions with activation failure
   */
  public static createExtensionsWithActivationFailure() {
    return [
      {
        id: 'activation-fail-1',
        name: 'Activation Failure Extension 1',
        version: '1.0.0',
        path: '/extensions/activation-fail-1',
        enabled: true,
        shouldFail: true,
        failureType: 'activation',
      },
      {
        id: 'activation-fail-2',
        name: 'Activation Failure Extension 2',
        version: '2.0.0',
        path: '/extensions/activation-fail-2',
        enabled: true,
        shouldFail: true,
        failureType: 'activation',
      },
    ];
  }

  /**
   * Create extensions with settings
   */
  public static createExtensionsWithSettings() {
    return [
      {
        id: 'settings-ext-1',
        name: 'Settings Extension 1',
        version: '1.0.0',
        path: '/extensions/settings-1',
        enabled: true,
        settings: {
          setting1: 'value1',
          setting2: true,
        },
      },
      {
        id: 'settings-ext-2',
        name: 'Settings Extension 2',
        version: '2.0.0',
        path: '/extensions/settings-2',
        enabled: true,
        settings: {
          option1: 42,
          option2: 'test',
        },
      },
    ];
  }

  /**
   * Create missing extensions
   */
  public static createMissingExtensions() {
    return [
      {
        id: 'missing-ext-1',
        name: 'Missing Extension 1',
        version: '1.0.0',
        path: '/extensions/missing-1',
        enabled: false,
        missing: true,
      },
      {
        id: 'missing-ext-2',
        name: 'Missing Extension 2',
        version: '2.0.0',
        path: '/extensions/missing-2',
        enabled: false,
        missing: true,
      },
    ];
  }

  /**
   * Create deprecated API extensions
   */
  public static createDeprecatedAPIExtensions() {
    return [
      {
        id: 'deprecated-api-1',
        name: 'Deprecated API Extension 1',
        version: '1.0.0',
        path: '/extensions/deprecated-1',
        enabled: true,
        apiCompatibility: {
          deprecatedAPIs: ['oldAPI1', 'oldAPI2'],
          experimentalAPIs: [],
        },
      },
      {
        id: 'deprecated-api-2',
        name: 'Deprecated API Extension 2',
        version: '2.0.0',
        path: '/extensions/deprecated-2',
        enabled: true,
        apiCompatibility: {
          deprecatedAPIs: ['legacyAPI'],
          experimentalAPIs: [],
        },
      },
    ];
  }

  /**
   * Create high impact extensions
   */
  public static createHighImpactExtensions() {
    return [
      {
        id: 'high-impact-1',
        name: 'High Impact Extension 1',
        version: '1.0.0',
        path: '/extensions/high-impact-1',
        enabled: true,
        impact: 'high',
        resourceUsage: {
          memory: 512,
          cpu: 30,
        },
      },
      {
        id: 'high-impact-2',
        name: 'High Impact Extension 2',
        version: '2.0.0',
        path: '/extensions/high-impact-2',
        enabled: true,
        impact: 'high',
        resourceUsage: {
          memory: 1024,
          cpu: 50,
        },
      },
    ];
  }

  /**
   * Create malformed extensions
   */
  public static createMalformedExtensions() {
    return [
      {
        id: 'malformed-1',
        name: 'Malformed Extension 1',
        version: 'invalid.version',
        path: '/extensions/malformed-1',
        enabled: true,
        malformed: true,
      },
      {
        id: 'malformed-2',
        name: 'Malformed Extension 2',
        version: '',
        path: '/extensions/malformed-2',
        enabled: true,
        malformed: true,
      },
    ];
  }

  /**
   * Create invalid version extensions
   */
  public static createInvalidVersionExtensions() {
    return [
      {
        id: 'invalid-version-1',
        name: 'Invalid Version Extension 1',
        version: 'not.a.version',
        path: '/extensions/invalid-version-1',
        enabled: true,
      },
      {
        id: 'invalid-version-2',
        name: 'Invalid Version Extension 2',
        version: '1.2.3.4.5',
        path: '/extensions/invalid-version-2',
        enabled: true,
      },
    ];
  }

  /**
   * Create problematic compatibility extensions
   */
  public static createProblematicCompatibilityExtensions() {
    return [
      {
        id: 'problematic-comp-1',
        name: 'Problematic Compatibility Extension 1',
        version: '1.0.0',
        path: '/extensions/problematic-comp-1',
        enabled: true,
        compatibilityIssues: ['API mismatch', 'Version conflict'],
      },
      {
        id: 'problematic-comp-2',
        name: 'Problematic Compatibility Extension 2',
        version: '2.0.0',
        path: '/extensions/problematic-comp-2',
        enabled: true,
        compatibilityIssues: ['Deprecated features'],
      },
    ];
  }

  /**
   * Assert test result is failed
   */
  public static assertTestFailed(result: VSCodeTestResult, message?: string): void {
    if (result.status !== 'failed') {
      const errorMessage =
        message || `Test "${result.name}" should have failed but got status: ${result.status}`;
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
      const errorMessage =
        message ||
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
      const errorMessage =
        message || `Container validation should be running but got status: ${validation.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { validation });
      throw new Error(errorMessage);
    }

    const failedExtensions = validation.extensions.filter(ext => ext.status === 'failed');
    if (failedExtensions.length > 0) {
      const errorMessage =
        message ||
        `Container should have no failed extensions but found: ${failedExtensions.map(e => e.id).join(', ')}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { failedExtensions });
      throw new Error(errorMessage);
    }

    const failedChecks = validation.environmentChecks.filter(check => check.status === 'failed');
    if (failedChecks.length > 0) {
      const errorMessage =
        message ||
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
      const errorMessage =
        message || `Memory usage ${usedMb}MB exceeds threshold of ${thresholdMb}MB`;
      this.logger.logError(new Error(errorMessage), 'assertion', { usedMb, thresholdMb });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert extension is loaded
   */
  public static assertExtensionLoaded(extension: ExtensionStatus, message?: string): void {
    if (extension.status !== 'loaded') {
      const errorMessage =
        message ||
        `Extension "${extension.name}" should be loaded but got status: ${extension.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { extension });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert array contains expected items
   */
  public static assertArrayContains<T>(array: T[], expectedItems: T[], message?: string): void {
    const missingItems = expectedItems.filter(item => !array.includes(item));
    if (missingItems.length > 0) {
      const errorMessage =
        message || `Array should contain ${missingItems.join(', ')} but missing items were found`;
      this.logger.logError(new Error(errorMessage), 'assertion', {
        array,
        expectedItems,
        missingItems,
      });
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
      const errorMessage =
        message || `Success rate ${successRate}% is below minimum ${minimumRate}%`;
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
      const errorMessage =
        message || `Object is missing required properties: ${missingProperties.join(', ')}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { obj, missingProperties });
      throw new Error(errorMessage);
    }
  }

  /**
   * Assert value is not null or undefined
   */
  public static assertNotNull<T>(
    value: T | null | undefined,
    message?: string
  ): asserts value is T {
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
      const errorMessage = message || `Number ${value} is not within range [${min}, ${max}]`;
      this.logger.logError(new Error(errorMessage), 'assertion', { value, min, max });
      throw new Error(errorMessage);
    }
  }
}

/**
 * Assertion helpers for testing
 */
export class AssertionHelpers {
  /**
   * Assert test result is failed
   */
  public static assertTestFailed(result: VSCodeTestResult, message?: string): void {
    return MockFactory.assertTestFailed(result, message);
  }

  /**
   * Assert test execution time is within threshold
   */
  public static assertExecutionTimeWithinThreshold(
    result: VSCodeTestResult,
    thresholdMs: number,
    message?: string
  ): void {
    return MockFactory.assertExecutionTimeWithinThreshold(result, thresholdMs, message);
  }

  /**
   * Assert container validation is successful
   */
  public static assertContainerValidationSuccessful(
    validation: ContainerValidation,
    message?: string
  ): void {
    return MockFactory.assertContainerValidationSuccessful(validation, message);
  }

  /**
   * Assert memory usage is within threshold
   */
  public static assertMemoryWithinThreshold(
    usedMb: number,
    thresholdMb: number,
    message?: string
  ): void {
    return MockFactory.assertMemoryWithinThreshold(usedMb, thresholdMb, message);
  }

  /**
   * Assert extension is loaded
   */
  public static assertExtensionLoaded(extension: ExtensionStatus, message?: string): void {
    return MockFactory.assertExtensionLoaded(extension, message);
  }

  /**
   * Assert array contains expected items
   */
  public static assertArrayContains<T>(array: T[], expectedItems: T[], message?: string): void {
    return MockFactory.assertArrayContains(array, expectedItems, message);
  }

  /**
   * Assert success rate meets minimum
   */
  public static assertSuccessRateMeetsMinimum(
    results: VSCodeTestResult[],
    minimumRate: number,
    message?: string
  ): void {
    return MockFactory.assertSuccessRateMeetsMinimum(results, minimumRate, message);
  }

  /**
   * Assert object has required properties
   */
  public static assertHasProperties<T extends Record<string, any>>(
    obj: T,
    requiredProperties: (keyof T)[],
    message?: string
  ): void {
    return MockFactory.assertHasProperties(obj, requiredProperties, message);
  }

  /**
   * Assert value is not null or undefined
   */
  public static assertNotNull<T>(
    value: T | null | undefined,
    message?: string
  ): asserts value is T {
    return MockFactory.assertNotNull(value, message);
  }

  /**
   * Assert string is not empty
   */
  public static assertNotEmpty(value: string, message?: string): void {
    return MockFactory.assertNotEmpty(value, message);
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
    return MockFactory.assertNumberInRange(value, min, max, message);
  }

  /**
   * Assert test result is passed
   */
  public static assertTestPassed(result: VSCodeTestResult, message?: string): void {
    if (result.status !== 'passed') {
      const errorMessage =
        message || `Test "${result.name}" should have passed but got status: ${result.status}`;
      MockFactory['logger'].logError(new Error(errorMessage), 'assertion', { result });
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
      memoryThreshold: Math.floor(Math.random() * 4096) + 512,
    });
  }

  /**
   * Generate random test results
   */
  public static generateRandomTestResults(count: number): VSCodeTestResult[] {
    return MockFactory.createMockTestResults(count, Math.random() * 0.5);
  }

  /**
   * Generate random extensions
   */
  public static generateRandomExtensions(count: number) {
    const extensions: any[] = [];
    for (let i = 0; i < count; i++) {
      extensions.push({
        id: `random-ext-${i}`,
        name: `Random Extension ${i}`,
        version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        path: `/extensions/random-${i}`,
        enabled: Math.random() > 0.2,
      });
    }
    return extensions;
  }
}
