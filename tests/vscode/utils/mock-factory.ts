import {
  VSCodeTestResult,
  TestConfiguration,
  ContainerValidation,
  ExtensionStatus,
} from '../../../src/vscode/types';
import { TestLoggerFactory } from '../../../src/vscode/utils/logger';
import {
  ExtensionInfo,
  ExtensionLoadResult,
  ExtensionCompatibilityResult,
} from '../../../src/vscode/testing/extensions/loader';

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
      id: `mock-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: 'Mock Test',
      status: 'passed',
      timestamp: new Date(),
      duration: 1000,
      ...overrides,
    };
  }

  /**
   * Create mock extensions for testing
   */
  public static createValidExtensions(): ExtensionInfo[] {
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
  public static createInvalidExtensions(): ExtensionInfo[] {
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
  public static createExtensionsWithDependencies(): ExtensionInfo[] {
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
   * Create extensions with activation failures
   */
  public static createExtensionsWithActivationFailure(): ExtensionInfo[] {
    return [
      {
        id: 'ext-activation-fail',
        name: 'Activation Failure Extension',
        version: '1.0.0',
        path: '/extensions/activation-fail',
        enabled: true,
      },
    ];
  }

  /**
   * Create extensions with settings
   */
  public static createExtensionsWithSettings(): ExtensionInfo[] {
    return [
      {
        id: 'ext-settings-1',
        name: 'Settings Extension',
        version: '1.0.0',
        path: '/extensions/settings',
        enabled: true,
      },
    ];
  }

  /**
   * Create extensions with version requirements
   */
  public static createExtensionsWithVersionRequirements(): ExtensionInfo[] {
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
   * Create missing extensions for testing
   */
  public static createMissingExtensions(): ExtensionInfo[] {
    return [
      {
        id: 'ext-missing-1',
        name: 'Missing Extension',
        version: '1.0.0',
        path: '/extensions/missing',
        enabled: true,
      },
    ];
  }

  /**
   * Create problematic extensions for error testing
   */
  public static createProblematicExtensions(): ExtensionInfo[] {
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
   * Create mock container validation
   */
  public static createMockContainerValidation(
    overrides: Partial<ContainerValidation> = {}
  ): ContainerValidation {
    return {
      containerId: `mock-container-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
}

/**
 * Test assertion helpers
 */
export class AssertionHelpers {
  private static logger = TestLoggerFactory.getInstance();

  /**
   * Assert test result is successful
   */
  public static assertTestPassed(result: VSCodeTestResult, message?: string): void {
    if (result.status !== 'passed') {
      const errorMessage =
        message || `Test "${result.name}" should have passed but got status: ${result.status}`;
      this.logger.logError(new Error(errorMessage), 'assertion', { result });
      throw new Error(errorMessage);
    }
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
  }
}
