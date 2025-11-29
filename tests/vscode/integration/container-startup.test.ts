import { VSCodeTestRunner } from '@vscode/testing/core/test-runner';
import { TestConfigurationManager } from '@vscode/testing/config/manager';
import { MockFactory, AssertionHelpers } from '@vscode/utils/test-helpers';
import { TestLogger } from '@vscode/utils/logger';

// Mock Docker for testing
const mockDocker = {
  createContainer: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn(),
  removeContainer: jest.fn(),
  getContainerStats: jest.fn(),
  listContainers: jest.fn()
};

// Mock VS Code API for testing
const mockVSCode = {
  commands: {
    executeCommand: jest.fn(),
    registerCommand: jest.fn()
  },
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn()
  },
  workspace: {
    getConfiguration: jest.fn()
  }
};

describe('Container Startup Validation Integration', () => {
  let testRunner: VSCodeTestRunner;
  let configManager: TestConfigurationManager;
  let logger: TestLogger;

  beforeEach(async () => {
    logger = TestLogger.getInstance();
    configManager = new TestConfigurationManager();
    const config = await configManager.loadConfiguration();
    testRunner = new VSCodeTestRunner(config);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await logger.flush();
    testRunner.dispose();
  });

  describe('Container Creation and Startup', () => {
    it('should successfully create and start a container', async () => {
      // Arrange
      const containerConfig = MockFactory.createMockTestConfig();
      const expectedContainerId = 'test-container-123';
      
      mockDocker.createContainer.mockResolvedValue({ id: expectedContainerId });
      mockDocker.startContainer.mockResolvedValue({ success: true });
      mockDocker.getContainerStats.mockResolvedValue({
        memory: { usage: 512, limit: 4096 },
        cpu: { usage: 25, cores: 4 }
      });

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'container-startup-test',
        async () => {
          const containerId = await mockDocker.createContainer(containerConfig.containerConfig);
          await mockDocker.startContainer(containerId);
          return MockFactory.createMockTestResult({
            name: 'Container Startup Test',
            status: 'passed',
            duration: 30000
          });
        },
        3
      );

      // Assert
      AssertionHelpers.assertTestPassed(testResult);
      expect(mockDocker.createContainer).toHaveBeenCalledWith(containerConfig.containerConfig);
      expect(mockDocker.startContainer).toHaveBeenCalledWith(expectedContainerId);
      expect(testResult.duration).toBeGreaterThan(0);
    });

    it('should handle container creation failure', async () => {
      // Arrange
      const containerConfig = MockFactory.createMockTestConfig();
      const errorMessage = 'Container creation failed';
      
      mockDocker.createContainer.mockRejectedValue(new Error(errorMessage));

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'container-creation-failure-test',
        async () => {
          try {
            await mockDocker.createContainer(containerConfig.containerConfig);
            return MockFactory.createMockTestResult({
              name: 'Container Creation Test',
              status: 'passed'
            });
          } catch (error) {
            return MockFactory.createMockTestResult({
              name: 'Container Creation Test',
              status: 'failed',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        },
        1
      );

      // Assert
      AssertionHelpers.assertTestFailed(testResult);
      expect(testResult.error).toContain(errorMessage);
      expect(mockDocker.createContainer).toHaveBeenCalledWith(containerConfig.containerConfig);
    });

    it('should handle container startup timeout', async () => {
      // Arrange
      const containerConfig = MockFactory.createMockTestConfig({ timeout: 5000 });
      const expectedContainerId = 'test-container-timeout';
      
      mockDocker.createContainer.mockResolvedValue({ id: expectedContainerId });
      mockDocker.startContainer.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
      );

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'container-startup-timeout-test',
        async () => {
          const containerId = await mockDocker.createContainer(containerConfig.containerConfig);
          try {
            await mockDocker.startContainer(containerId);
            return MockFactory.createMockTestResult({
              name: 'Container Startup Timeout Test',
              status: 'passed'
            });
          } catch (error) {
            return MockFactory.createMockTestResult({
              name: 'Container Startup Timeout Test',
              status: 'failed',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        },
        1
      );

      // Assert
      AssertionHelpers.assertTestFailed(testResult);
      expect(testResult.error).toContain('timed out');
    });
  });

  describe('Container Resource Monitoring', () => {
    it('should monitor container resource usage', async () => {
      // Arrange
      const mockStats = {
        memory: { usage: 1024, limit: 4096 },
        cpu: { usage: 50, cores: 4 },
        disk: { used: 2048, available: 2048 }
      };
      
      mockDocker.getContainerStats.mockResolvedValue(mockStats);

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'resource-monitoring-test',
        async () => {
          const stats = await mockDocker.getContainerStats('test-container');
          
          // Check memory usage is within reasonable bounds
          const memoryUsagePercent = (stats.memory.usage / stats.memory.limit) * 100;
          if (memoryUsagePercent > 80) {
            return MockFactory.createMockTestResult({
              name: 'Resource Monitoring Test',
              status: 'failed',
              error: `Memory usage too high: ${memoryUsagePercent}%`
            });
          }

          // Check CPU usage is reasonable
          if (stats.cpu.usage > 90) {
            return MockFactory.createMockTestResult({
              name: 'Resource Monitoring Test',
              status: 'failed',
              error: `CPU usage too high: ${stats.cpu.usage}%`
            });
          }

          return MockFactory.createMockTestResult({
            name: 'Resource Monitoring Test',
            status: 'passed',
            metrics: {
              executionTime: 1000,
              memoryUsage: stats.memory.usage,
              cpuUsage: stats.cpu.usage
            }
          });
        },
        1
      );

      // Assert
      AssertionHelpers.assertTestPassed(testResult);
      expect(testResult.metrics).toBeDefined();
      expect(testResult.metrics!.memoryUsage).toBe(1024);
      expect(testResult.metrics!.cpuUsage).toBe(50);
    });

    it('should detect memory threshold violations', async () => {
      // Arrange
      const mockStats = {
        memory: { usage: 3500, limit: 4096 }, // 85% usage
        cpu: { usage: 30, cores: 4 },
        disk: { used: 2048, available: 2048 }
      };
      
      mockDocker.getContainerStats.mockResolvedValue(mockStats);

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'memory-threshold-test',
        async () => {
          const stats = await mockDocker.getContainerStats('test-container');
          const memoryUsagePercent = (stats.memory.usage / stats.memory.limit) * 100;
          
          if (memoryUsagePercent > 80) {
            return MockFactory.createMockTestResult({
              name: 'Memory Threshold Test',
              status: 'failed',
              error: `Memory usage exceeds threshold: ${memoryUsagePercent.toFixed(1)}%`
            });
          }

          return MockFactory.createMockTestResult({
            name: 'Memory Threshold Test',
            status: 'passed'
          });
        },
        1
      );

      // Assert
      AssertionHelpers.assertTestFailed(testResult);
      expect(testResult.error).toContain('Memory usage exceeds threshold');
    });
  });

  describe('Container Cleanup', () => {
    it('should properly cleanup containers after test completion', async () => {
      // Arrange
      const containerId = 'test-container-cleanup';
      mockDocker.createContainer.mockResolvedValue({ id: containerId });
      mockDocker.startContainer.mockResolvedValue({ success: true });
      mockDocker.stopContainer.mockResolvedValue({ success: true });
      mockDocker.removeContainer.mockResolvedValue({ success: true });

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'container-cleanup-test',
        async () => {
          const createdContainerId = await mockDocker.createContainer({});
          await mockDocker.startContainer(createdContainerId);
          
          // Simulate test cleanup
          await mockDocker.stopContainer(createdContainerId);
          await mockDocker.removeContainer(createdContainerId);
          
          return MockFactory.createMockTestResult({
            name: 'Container Cleanup Test',
            status: 'passed'
          });
        },
        1
      );

      // Assert
      AssertionHelpers.assertTestPassed(testResult);
      expect(mockDocker.stopContainer).toHaveBeenCalledWith(containerId);
      expect(mockDocker.removeContainer).toHaveBeenCalledWith(containerId);
    });

    it('should handle cleanup failures gracefully', async () => {
      // Arrange
      const containerId = 'test-container-cleanup-fail';
      const cleanupError = 'Container removal failed';
      
      mockDocker.createContainer.mockResolvedValue({ id: containerId });
      mockDocker.startContainer.mockResolvedValue({ success: true });
      mockDocker.stopContainer.mockResolvedValue({ success: true });
      mockDocker.removeContainer.mockRejectedValue(new Error(cleanupError));

      // Act
      const testResult = await testRunner.runTestWithRetry(
        'container-cleanup-fail-test',
        async () => {
          const createdContainerId = await mockDocker.createContainer({});
          await mockDocker.startContainer(createdContainerId);
          await mockDocker.stopContainer(createdContainerId);
          
          try {
            await mockDocker.removeContainer(createdContainerId);
            return MockFactory.createMockTestResult({
              name: 'Container Cleanup Fail Test',
              status: 'passed'
            });
          } catch (error) {
            return MockFactory.createMockTestResult({
              name: 'Container Cleanup Fail Test',
              status: 'warning', // Warning because test passed but cleanup failed
              error: `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`
            });
          }
        },
        1
      );

      // Assert
      // Test should still pass but with warning about cleanup
      expect(testResult.status).toBe('warning');
      expect(testResult.error).toContain('Cleanup failed');
    });
  });
});