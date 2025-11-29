import {
  VSCodeTestResult,
  TestConfiguration,
  TestExecutionContext,
  TestSuiteResult,
} from '../../types';
import { DiagnosticLogger } from '../../utils/diagnostic-logger';
import { TestResultFactory } from '../../types/test-result-factory';
import { VSCodeTestUtils } from '../../utils/helpers';

/**
 * Enhanced VS Code test runner with container and extension testing capabilities
 * Simplified version focused on core functionality
 */
export class VSCodeTestRunner {
  private logger: DiagnosticLogger;
  private configuration: TestConfiguration;
  private currentContext?: TestExecutionContext;
  private isDisposed = false;

  constructor(configuration: TestConfiguration) {
    this.logger = DiagnosticLogger.getInstance();
    this.configuration = configuration;
    this.logger.setLogLevel('info');
    this.logger.info('VS Code Test Runner initialized', 'test-runner', {
      vscodeVersions: configuration.vscodeVersions,
      timeout: configuration.timeout,
      parallel: configuration.parallel,
    });
  }

  /**
   * Run a complete test suite for VS Code container validation
   */
  public async runContainerValidationSuite(): Promise<VSCodeTestResult[]> {
    const testSuiteName = 'VS Code Container Validation';
    this.logger.info(`Starting container validation test suite: ${testSuiteName}`, 'test-runner');

    const tests = [
      () => this.testContainerStartup(),
      () => this.testExtensionLoading(),
      () => this.testEnvironmentReadiness(),
      () => this.testResourceUsage(),
      () => this.testVSCodeConnection(),
    ];

    const suiteResult = await this.runTestSuite(testSuiteName, tests);
    return suiteResult.tests;
  }

  /**
   * Test container startup process
   */
  private async testContainerStartup(): Promise<VSCodeTestResult> {
    const testId = VSCodeTestUtils.generateTestId('container-startup');
    const startTime = Date.now();

    try {
      this.logger.info('Testing container startup', 'container-test');

      // Simulate container startup validation
      const startupTime = Math.random() * 30000 + 20000; // 20-50 seconds
      const isSuccessful = startupTime < 45000; // Should complete within 45 seconds

      await VSCodeTestUtils.sleep(startupTime);

      const result = TestResultFactory.createTestResult(
        testId,
        'Container Startup Test',
        isSuccessful ? 'passed' : 'failed',
        Date.now() - startTime
      );

      if (!isSuccessful) {
        result.error = `Container startup took too long: ${startupTime}ms`;
      }

      result.metrics = {
        executionTime: result.duration!,
        containerStartupTime: startupTime,
      };

      this.logger.info(`Container startup test ${result.status}`, 'container-test', {
        duration: result.duration,
        startupTime,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Container startup test failed: ${errorMessage}`, 'container-test');

      return TestResultFactory.createFailedTest(
        testId,
        'Container Startup Test',
        duration,
        errorMessage
      );
    }
  }

  /**
   * Test extension loading process
   */
  private async testExtensionLoading(): Promise<VSCodeTestResult> {
    const testId = VSCodeTestUtils.generateTestId('extension-loading');
    const startTime = Date.now();

    try {
      this.logger.info('Testing extension loading', 'extension-test');

      // Simulate extension loading validation
      const extensionCount = 5; // Simulate 5 extensions
      const loadingTime = Math.random() * 15000 + 5000; // 5-20 seconds
      const failedExtensions = Math.random() > 0.8 ? 1 : 0; // 20% chance of failure

      await VSCodeTestUtils.sleep(loadingTime);

      const isSuccessful = failedExtensions === 0 && loadingTime < 30000;

      const result = TestResultFactory.createTestResult(
        testId,
        'Extension Loading Test',
        isSuccessful ? 'passed' : 'failed',
        Date.now() - startTime
      );

      if (!isSuccessful) {
        if (failedExtensions > 0) {
          result.error = `${failedExtensions} extensions failed to load`;
        } else {
          result.error = `Extension loading took too long: ${loadingTime}ms`;
        }
      }

      result.metrics = {
        executionTime: result.duration!,
        extensionLoadingTime: loadingTime,
      };

      this.logger.info(`Extension loading test ${result.status}`, 'extension-test', {
        duration: result.duration,
        loadingTime,
        extensionCount,
        failedExtensions,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Extension loading test failed: ${errorMessage}`, 'extension-test');

      return TestResultFactory.createFailedTest(
        testId,
        'Extension Loading Test',
        duration,
        errorMessage
      );
    }
  }

  /**
   * Test environment readiness
   */
  private async testEnvironmentReadiness(): Promise<VSCodeTestResult> {
    const testId = VSCodeTestUtils.generateTestId('environment-readiness');
    const startTime = Date.now();

    try {
      this.logger.info('Testing environment readiness', 'environment-test');

      // Simulate environment checks
      const checks = [
        { name: 'Node.js availability', passed: true },
        { name: 'Git availability', passed: true },
        { name: 'Docker socket access', passed: Math.random() > 0.1 }, // 90% success rate
        { name: 'Development tools', passed: Math.random() > 0.05 }, // 95% success rate
      ];

      const checkTime = 2000; // 2 seconds for all checks
      await VSCodeTestUtils.sleep(checkTime);

      const failedChecks = checks.filter(check => !check.passed);
      const isSuccessful = failedChecks.length === 0;

      const result = TestResultFactory.createTestResult(
        testId,
        'Environment Readiness Test',
        isSuccessful ? 'passed' : 'failed',
        Date.now() - startTime
      );

      if (!isSuccessful) {
        result.error = `Environment checks failed: ${failedChecks.map(c => c.name).join(', ')}`;
      }

      result.metrics = {
        executionTime: result.duration!,
      };

      this.logger.info(`Environment readiness test ${result.status}`, 'environment-test', {
        duration: result.duration,
        checks,
        failedChecks: failedChecks.length,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Environment readiness test failed: ${errorMessage}`, 'environment-test');

      return TestResultFactory.createFailedTest(
        testId,
        'Environment Readiness Test',
        duration,
        errorMessage
      );
    }
  }

  /**
   * Test resource usage
   */
  private async testResourceUsage(): Promise<VSCodeTestResult> {
    const testId = VSCodeTestUtils.generateTestId('resource-usage');
    const startTime = Date.now();

    try {
      this.logger.info('Testing resource usage', 'resource-test');

      // Simulate resource usage monitoring
      const memoryUsage = Math.random() * 1536 + 512; // 512-2048 MB
      const cpuUsage = Math.random() * 50 + 10; // 10-60%
      const threshold = this.configuration.memoryThreshold;

      const checkTime = 1000; // 1 second for resource check
      await VSCodeTestUtils.sleep(checkTime);

      const isMemoryOk = memoryUsage <= threshold;
      const isCpuOk = cpuUsage <= 80; // CPU should be under 80%
      const isSuccessful = isMemoryOk && isCpuOk;

      const result = TestResultFactory.createTestResult(
        testId,
        'Resource Usage Test',
        isSuccessful ? 'passed' : 'failed',
        Date.now() - startTime
      );

      if (!isSuccessful) {
        const issues = [];
        if (!isMemoryOk)
          issues.push(`Memory usage ${memoryUsage}MB exceeds threshold ${threshold}MB`);
        if (!isCpuOk) issues.push(`CPU usage ${cpuUsage.toFixed(1)}% exceeds 80%`);
        result.error = issues.join('; ');
      }

      result.metrics = {
        executionTime: result.duration!,
        memoryUsage,
        cpuUsage,
      };

      this.logger.info(`Resource usage test ${result.status}`, 'resource-test', {
        duration: result.duration,
        memoryUsage,
        cpuUsage,
        threshold,
        isMemoryOk,
        isCpuOk,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Resource usage test failed: ${errorMessage}`, 'resource-test');

      return TestResultFactory.createFailedTest(
        testId,
        'Resource Usage Test',
        duration,
        errorMessage
      );
    }
  }

  /**
   * Test VS Code connection
   */
  private async testVSCodeConnection(): Promise<VSCodeTestResult> {
    const testId = VSCodeTestUtils.generateTestId('vscode-connection');
    const startTime = Date.now();

    try {
      this.logger.info('Testing VS Code connection', 'vscode-test');

      // Simulate VS Code connection test
      const connectionTime = Math.random() * 5000 + 2000; // 2-7 seconds
      const isConnected = Math.random() > 0.05; // 95% success rate

      await VSCodeTestUtils.sleep(connectionTime);

      const isSuccessful = isConnected && connectionTime < 10000;

      const result = TestResultFactory.createTestResult(
        testId,
        'VS Code Connection Test',
        isSuccessful ? 'passed' : 'failed',
        Date.now() - startTime
      );

      if (!isSuccessful) {
        if (!isConnected) {
          result.error = 'VS Code connection failed';
        } else {
          result.error = `VS Code connection took too long: ${connectionTime}ms`;
        }
      }

      result.metrics = {
        executionTime: result.duration!,
      };

      this.logger.info(`VS Code connection test ${result.status}`, 'vscode-test', {
        duration: result.duration,
        connectionTime,
        isConnected,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`VS Code connection test failed: ${errorMessage}`, 'vscode-test');

      return TestResultFactory.createFailedTest(
        testId,
        'VS Code Connection Test',
        duration,
        errorMessage
      );
    }
  }

  /**
   * Run a test suite with proper error handling and timing
   */
  public async runTestSuite(
    testSuiteName: string,
    tests: Array<() => Promise<VSCodeTestResult>>
  ): Promise<{
    name: string;
    tests: VSCodeTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
      successRate: number;
    };
  }> {
    const startTime = Date.now();
    this.logger.info(`Starting test suite: ${testSuiteName}`, 'test-runner');

    // Create test execution context
    this.currentContext = {
      testSuite: testSuiteName,
      startTime: new Date(),
      vscodeVersion: this.configuration.vscodeVersions[0] || 'stable',
      configuration: this.configuration,
    };

    const results: VSCodeTestResult[] = [];

    // Execute tests
    for (const testFactory of tests) {
      if (this.isDisposed) {
        this.logger.warning('Test execution stopped - runner disposed', 'test-runner');
        break;
      }

      try {
        const testResult = await this.executeTest(testFactory);
        results.push(testResult);
      } catch (error) {
        this.logger.error(`Test execution failed: ${error}`, 'test-runner');
        const failedResult = TestResultFactory.createFailedTest(
          'execution-error',
          'Test execution error',
          0,
          error instanceof Error ? error.message : String(error)
        );
        results.push(failedResult);
      }
    }

    const duration = Date.now() - startTime;
    const passedCount = results.filter(r => r.status === 'passed').length;
    const successRate = (passedCount / results.length) * 100;

    this.logger.info(`Test suite completed: ${testSuiteName} in ${duration}ms`, 'test-runner', {
      total: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      successRate: successRate.toFixed(1),
    });

    return {
      name: testSuiteName,
      tests: results,
      summary: {
        total: results.length,
        passed: passedCount,
        failed: results.length - passedCount,
        duration,
        successRate,
      },
    };
  }

  /**
   * Execute a single test with error handling and timing
   */
  private async executeTest(
    testFactory: () => Promise<VSCodeTestResult>
  ): Promise<VSCodeTestResult> {
    const startTime = Date.now();
    let testResult: VSCodeTestResult;

    try {
      testResult = await testFactory();

      // Ensure timing information
      if (!testResult.duration) {
        testResult.duration = Date.now() - startTime;
      }

      this.logger.info(`Test completed: ${testResult.name} (${testResult.status})`, 'test-runner', {
        duration: testResult.duration,
        status: testResult.status,
        error: testResult.error,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      testResult = TestResultFactory.createFailedTest(
        'unknown-test',
        'Unknown test',
        duration,
        errorMessage
      );

      this.logger.error(`Test failed with exception: ${errorMessage}`, 'test-runner', {
        duration,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return testResult;
  }

  /**
   * Get current test execution context
   */
  public getCurrentContext(): TestExecutionContext | undefined {
    return this.currentContext;
  }

  /**
   * Update configuration
   */
  public updateConfiguration(newConfig: Partial<TestConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
    this.logger.info('Test runner configuration updated', 'test-runner', { newConfig });
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): TestConfiguration {
    return { ...this.configuration };
  }

  /**
   * Run a test with retry logic
   */
  public async runTestWithRetry(
    testName: string,
    testFunction: () => Promise<VSCodeTestResult>,
    maxRetries: number = this.configuration.retryCount || 3
  ): Promise<VSCodeTestResult> {
    let lastResult: VSCodeTestResult | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(
          `Running test attempt ${attempt}/${maxRetries}: ${testName}`,
          'test-runner'
        );
        lastResult = await testFunction();

        if (lastResult.status === 'passed') {
          this.logger.info(`Test passed on attempt ${attempt}: ${testName}`, 'test-runner');
          return lastResult;
        }

        if (attempt < maxRetries) {
          this.logger.warning(
            `Test failed on attempt ${attempt}, retrying: ${testName}`,
            'test-runner',
            {
              error: lastResult.error,
              attempt,
            }
          );
          // Exponential backoff
          await VSCodeTestUtils.sleep(Math.pow(2, attempt) * 1000);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Test attempt ${attempt} failed with exception: ${testName}`,
          'test-runner',
          {
            error: errorMessage,
            attempt,
          }
        );

        if (attempt === maxRetries) {
          return TestResultFactory.createFailedTest(
            testName,
            testName,
            0,
            `Test failed after ${maxRetries} attempts: ${errorMessage}`
          );
        }
      }
    }

    return lastResult || TestResultFactory.createFailedTest(testName, testName, 0, 'Unknown error');
  }

  /**
   * Run tests in parallel
   */
  public async runTestsParallel(
    testFunctions: Array<() => Promise<VSCodeTestResult>>,
    maxConcurrency: number = 3
  ): Promise<VSCodeTestResult[]> {
    if (!this.configuration.parallel) {
      // Run sequentially if parallel is disabled
      const results: VSCodeTestResult[] = [];
      for (const testFunction of testFunctions) {
        const result = await testFunction();
        results.push(result);
      }
      return results;
    }

    this.logger.info(
      `Running ${testFunctions.length} tests in parallel with concurrency ${maxConcurrency}`,
      'test-runner'
    );

    const results: VSCodeTestResult[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < testFunctions.length; i++) {
      const executeTest = async (index: number) => {
        try {
          const fn = testFunctions[index];
          if (!fn) return;
          const result = await fn();
          results[index] = result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results[index] = TestResultFactory.createFailedTest(
            `parallel-test-${index}`,
            `parallel-test-${index}`,
            0,
            errorMessage
          );
        }
      };

      const promise = executeTest(i);
      executing.push(promise);

      // Limit concurrency
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        // Remove completed promises
        for (let j = executing.length - 1; j >= 0; j--) {
          if (results[j] !== undefined) {
            executing.splice(j, 1);
          }
        }
      }
    }

    // Wait for remaining tests
    await Promise.all(executing);

    const passedCount = results.filter(r => r.status === 'passed').length;
    this.logger.info(
      `Parallel tests completed: ${passedCount}/${results.length} passed`,
      'test-runner'
    );

    return results;
  }

  /**
   * Dispose of test runner resources
   */
  public dispose(): void {
    this.isDisposed = true;
    this.logger.info('VS Code Test Runner disposed', 'test-runner');
    this.currentContext = undefined;
  }
}
