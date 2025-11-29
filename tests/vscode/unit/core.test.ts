import { VSCodeTestRunner } from '../../../src/vscode/testing/core/test-runner';
import { TestConfigurationManager } from '../../../src/vscode/testing/config/manager';
import { MockFactory, AssertionHelpers } from '../utils/test-helpers';
import { TestLogger } from '../../../src/vscode/utils/logger';

describe('VS Code Test Runner Foundation', () => {
  let testRunner: VSCodeTestRunner;
  let configManager: TestConfigurationManager;
  let logger: TestLogger;

  beforeEach(() => {
    logger = new TestLogger();
    configManager = new TestConfigurationManager();
    testRunner = new VSCodeTestRunner(MockFactory.createMockTestConfig());
  });

  afterEach(async () => {
    await logger.flush();
    testRunner.dispose();
  });

  describe('Test Suite Execution', () => {
    it('should run a complete test suite successfully', async () => {
      // Arrange
      const testSuiteName = 'Test Suite 1';
      const mockTests = [
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 1', status: 'passed' })),
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 2', status: 'passed' })),
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 3', status: 'passed' })),
      ];

      // Act
      const result = await testRunner.runTestSuite(testSuiteName, mockTests);

      // Assert
      expect(result.name).toBe(testSuiteName);
      expect(result.tests).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.passed).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.successRate).toBe(100);
      AssertionHelpers.assertTestPassed(result.tests[0]);
      AssertionHelpers.assertTestPassed(result.tests[1]);
      AssertionHelpers.assertTestPassed(result.tests[2]);
    });

    it('should handle test failures gracefully', async () => {
      // Arrange
      const testSuiteName = 'Test Suite with Failures';
      const mockTests = [
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 1', status: 'passed' })),
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({
              name: 'Test 2',
              status: 'failed',
              error: 'Test failed',
            })
          ),
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 3', status: 'passed' })),
      ];

      // Act
      const result = await testRunner.runTestSuite(testSuiteName, mockTests);

      // Assert
      expect(result.name).toBe(testSuiteName);
      expect(result.tests).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.passed).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.successRate).toBeCloseTo(66.67, 1);
      AssertionHelpers.assertTestFailed(result.tests[1]);
    });

    it('should handle test execution exceptions', async () => {
      // Arrange
      const testSuiteName = 'Test Suite with Exceptions';
      const mockTests = [
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 1', status: 'passed' })),
        () => Promise.reject(new Error('Test execution error')),
        () =>
          Promise.resolve(MockFactory.createMockTestResult({ name: 'Test 3', status: 'passed' })),
      ];

      // Act
      const result = await testRunner.runTestSuite(testSuiteName, mockTests);

      // Assert
      expect(result.name).toBe(testSuiteName);
      expect(result.tests).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.passed).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.tests[1].status).toBe('failed');
      expect(result.tests[1].error).toContain('Test execution error');
    });
  });

  describe('Test Retry Logic', () => {
    it('should retry failed tests according to configuration', async () => {
      // Arrange
      const config = MockFactory.createMockTestConfig({ retryCount: 2 });
      const retryTestRunner = new VSCodeTestRunner(config);
      let attemptCount = 0;

      const testFunction = () => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve(
            MockFactory.createMockTestResult({
              name: 'Retry Test',
              status: 'failed',
              error: `Attempt ${attemptCount} failed`,
            })
          );
        }
        return Promise.resolve(
          MockFactory.createMockTestResult({
            name: 'Retry Test',
            status: 'passed',
          })
        );
      };

      // Act
      const result = await retryTestRunner.runTestWithRetry('Retry Test', testFunction);

      // Assert
      expect(result.status).toBe('passed');
      expect(attemptCount).toBe(3);
      retryTestRunner.dispose();
    });

    it('should fail after maximum retries', async () => {
      // Arrange
      const config = MockFactory.createMockTestConfig({ retryCount: 2 });
      const retryTestRunner = new VSCodeTestRunner(config);

      const testFunction = () => {
        return Promise.resolve(
          MockFactory.createMockTestResult({
            name: 'Always Fail Test',
            status: 'failed',
            error: 'Always fails',
          })
        );
      };

      // Act
      const result = await retryTestRunner.runTestWithRetry('Always Fail Test', testFunction);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.error).toContain('All retry attempts failed');
      retryTestRunner.dispose();
    });
  });

  describe('Parallel Test Execution', () => {
    it('should run tests in parallel when enabled', async () => {
      // Arrange
      const config = MockFactory.createMockTestConfig({ parallel: true });
      const parallelTestRunner = new VSCodeTestRunner(config);

      const mockTests = [
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({ name: 'Parallel Test 1', status: 'passed' })
          ),
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({ name: 'Parallel Test 2', status: 'passed' })
          ),
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({ name: 'Parallel Test 3', status: 'passed' })
          ),
      ];

      // Act
      const results = await parallelTestRunner.runTestsParallel(mockTests, 2);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        AssertionHelpers.assertTestPassed(result);
      });
      parallelTestRunner.dispose();
    });

    it('should run tests sequentially when parallel is disabled', async () => {
      // Arrange
      const config = MockFactory.createMockTestConfig({ parallel: false });
      const sequentialTestRunner = new VSCodeTestRunner(config);

      const mockTests = [
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({ name: 'Sequential Test 1', status: 'passed' })
          ),
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({ name: 'Sequential Test 2', status: 'passed' })
          ),
        () =>
          Promise.resolve(
            MockFactory.createMockTestResult({ name: 'Sequential Test 3', status: 'passed' })
          ),
      ];

      // Act
      const results = await sequentialTestRunner.runTestsParallel(mockTests, 2);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        AssertionHelpers.assertTestPassed(result);
      });
      sequentialTestRunner.dispose();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration correctly', () => {
      // Arrange
      const newConfig = { timeout: 60000, parallel: false };

      // Act
      testRunner.updateConfiguration(newConfig);
      const updatedConfig = testRunner.getConfiguration();

      // Assert
      expect(updatedConfig.timeout).toBe(60000);
      expect(updatedConfig.parallel).toBe(false);
    });

    it('should provide current execution context', () => {
      // Act
      const context = testRunner.getCurrentContext();

      // Assert
      expect(context).toBeDefined();
      expect(context!.vscodeVersion).toBeDefined();
      expect(context!.configuration).toBeDefined();
    });
  });
});
